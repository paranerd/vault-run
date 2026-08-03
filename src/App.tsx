import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import {
  BarChart3,
  Check,
  Clock3,
  Download,
  Eye,
  RotateCcw,
  Settings,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  GOLD_FLIGHT_DURATION_MS,
  SECTION_LABEL,
  SECTION_SLOT_GROUP,
  UPGRADE_FILTERS,
  UPGRADE_FILTER_LABEL,
  UPGRADE_FILTER_PREFIX,
  UPGRADE_FILTER_TITLE,
  automaticTransportAmount,
  chestCapacity,
  getAllUpgrades,
  getUpgradeGroups,
  hasAutomaticTransport,
  passiveRate,
  securityRating,
  slotVisualLevel,
  tapValue,
  threatReductionPerClick,
  transportDuration,
  vaultCapacity,
} from './game/config'
import {
  advanceGame,
  buyEquipmentUpgrade,
  buySlotUpgrade,
  dismissOfflineReport,
  lowerThreat,
  startExpressTransport,
  startTransport,
  tap,
} from './game/engine'
import { formatDuration, formatGold } from './game/format'
import { loadGame, resetGame, saveGame } from './game/storage'
import type { GameState, SectionId, SlotIndex, UpgradeFilter, UpgradeView } from './game/types'

interface UpgradePanelState {
  filter: UpgradeFilter
  focusKey?: string
}

const UPGRADE_NOTICE_KEY = 'vault-run-seen-upgrade-levels-v2'
const SPRITE_ROOT = `${import.meta.env.BASE_URL}sprites`
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1_000

interface GoldFlight {
  id: number
  kind: 'coin' | 'pile'
  value: number
  left: number
  top: number
  midX: number
  midY: number
  endX: number
  endY: number
  rotation: number
  duration: number
  preciseValue: boolean
}

function percentage(value: number, capacity: number) {
  if (capacity <= 0) return 0
  return Math.max(0, Math.min(100, (value / capacity) * 100))
}

function formatFlightGold(value: number, precise: boolean) {
  if (!precise || Number.isInteger(value)) return formatGold(value)
  return value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
}

function playTone(kind: 'coin' | 'trip' | 'upgrade' | 'secure', enabled: boolean) {
  if (!enabled) return
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = kind === 'trip' || kind === 'secure' ? 'square' : 'sine'
    const start = kind === 'coin' ? 650 : kind === 'upgrade' ? 440 : kind === 'secure' ? 310 : 220
    const end = kind === 'coin' ? 920 : kind === 'upgrade' ? 680 : kind === 'secure' ? 220 : 330
    oscillator.frequency.setValueAtTime(start, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(end, context.currentTime + 0.08)
    gain.gain.setValueAtTime(0.035, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.12)
    oscillator.addEventListener('ended', () => void context.close())
  } catch {
    // Sound is progressive enhancement and can be blocked by the browser.
  }
}

function haptic(duration = 10) {
  navigator.vibrate?.(duration)
}

function loadSeenUpgradeLevels() {
  try {
    const stored = JSON.parse(localStorage.getItem(UPGRADE_NOTICE_KEY) ?? '[]')
    return new Set<string>(Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function spriteStage(level: number, maximum = 3) {
  return Math.min(maximum, Math.max(0, level))
}

function PixelSprite({ family, level, className = '' }: { family: UpgradeView['spriteFamily']; level: number; className?: string }) {
  const maximum = family === 'security' ? 4 : 3
  return <img className={`pixel-sprite ${className}`} src={`${SPRITE_ROOT}/${family}-${spriteStage(level, maximum)}.png`} alt="" aria-hidden="true" draggable={false} />
}

function PixelCoin({ className = '' }: { className?: string }) {
  return (
    <svg className={`pixel-coin ${className}`} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="#4b2a0e" d="M5 1h6v1h2v2h1v2h1v4h-1v2h-1v2h-2v1H5v-1H3v-2H2v-2H1V6h1V4h1V2h2z" />
      <path fill="#c97917" d="M5 2h6v1h2v2h1v6h-1v2h-2v1H5v-1H3v-2H2V6h1V4h2z" />
      <path fill="#f7c64d" d="M6 3h5v1h2v2h1v4h-1v2h-2v1H5v-1H4v-2H3V6h1V5h2z" />
      <path fill="#ffe894" d="M6 4h4v1h2v2h1v2h-1v1h-2v1H6v-1H5V6h1z" />
      <path fill="#a85b12" d="M9 5h2v1h1v4h-2V8H8v3H6V6h1V5z" />
      <path fill="#fff4b8" d="M6 4h3v1H6z" />
    </svg>
  )
}

function PixelGoldPile() {
  return (
    <span className="pixel-gold-pile" aria-hidden="true">
      <PixelCoin /><PixelCoin /><PixelCoin />
    </span>
  )
}

function UpgradeIcon() {
  return <img className="dock-button__icon" src={`${SPRITE_ROOT}/upgrade.png`} alt="" aria-hidden="true" draggable={false} />
}

function StatTile({ label, value, icon }: { label?: string; value?: string; icon?: ReactNode }) {
  return (
    <div className={`stat-tile ${label ? '' : 'is-empty'}`} aria-hidden={!label || undefined}>
      {icon && <span className="stat-tile__icon">{icon}</span>}
      {label ? <><strong>{value}</strong><span>{label}</span></> : <span>·</span>}
    </div>
  )
}

function SectionProgress({ fill, label, amount, muted = false }: { fill: number; label: string; amount?: string; muted?: boolean }) {
  return (
    <div className={`section-progress ${muted ? 'is-muted' : ''}`}>
      <div className="section-progress__bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill)}>
        <i style={{ width: `${fill}%` }} />
      </div>
      {amount && <div className="section-progress__amount">{amount}</div>}
    </div>
  )
}

function SlotGrid({
  section,
  levels,
  family,
  notifying,
  noticeCount,
  onOpen,
}: {
  section: SectionId
  levels: readonly number[]
  family: UpgradeView['spriteFamily']
  notifying: boolean
  noticeCount: number
  onOpen: (index: SlotIndex) => void
}) {
  return (
    <div className={`slot-grid ${notifying ? 'is-notifying' : ''}`} aria-label={`${SECTION_LABEL[section]}: vier Slot-Upgrades`}>
      {levels.map((level, rawIndex) => {
        const index = rawIndex as SlotIndex
        return (
          <button key={index} className={level === 0 ? 'is-empty' : ''} onClick={() => onOpen(index)} aria-label={`Slot ${index + 1}, ${level === 0 ? 'unbesetzt' : `Stufe ${level}`}`}>
            <PixelSprite family={family} level={slotVisualLevel(SECTION_SLOT_GROUP[section], level)} />
            <b>{level === 0 ? '+' : level}</b>
          </button>
        )
      })}
      {noticeCount > 0 && <em className="slot-grid__badge" aria-label={`${noticeCount} kaufbare Slot-Upgrades`}>{noticeCount}</em>}
    </div>
  )
}

function UpgradeCard({ upgrade, state, focused, onBuy }: { upgrade: UpgradeView; state: GameState; focused?: boolean; onBuy: (upgrade: UpgradeView) => void }) {
  const affordable = state.vaultGold >= upgrade.cost
  const disabled = !upgrade.available || !affordable || upgrade.maxed
  const unowned = Boolean(upgrade.slot && upgrade.level === 'Unbesetzt')
  // Only the focused card carries the ref, so it scrolls into view exactly once when the focus moves.
  const revealFocused = useCallback((node: HTMLElement | null) => node?.scrollIntoView({ block: 'center' }), [])
  return (
    <article ref={focused ? revealFocused : undefined} className={`upgrade-card upgrade-card--${upgrade.accent} ${focused ? 'is-focused' : ''} ${unowned ? 'is-unowned' : ''}`}>
      <div className="upgrade-card__content">
        <span className="upgrade-card__sprite"><PixelSprite family={upgrade.spriteFamily} level={upgrade.spriteLevel} /></span>
        <div className="upgrade-card__details">
          <div className="upgrade-card__top"><span>{upgrade.level}</span>{upgrade.maxed && <b><Check size={13} /> Aktiv</b>}</div>
          <h3>{upgrade.name}</h3>
          <p>{upgrade.description}</p>
          <div className="upgrade-effects" aria-label="Upgrade-Effekt">
            <div><span>Aktuell</span><strong>{upgrade.currentEffect}</strong></div>
            <div><span>Nächste Stufe</span><strong>{upgrade.nextEffect}</strong></div>
          </div>
        </div>
      </div>
      <button className="buy-button" disabled={disabled} onClick={() => onBuy(upgrade)} aria-label={`${upgrade.name} für ${formatGold(upgrade.cost)} Gold verbessern`}>
        {upgrade.maxed ? <><Check size={18} /><span>Erledigt</span></> : <><PixelCoin /><span>{formatGold(upgrade.cost)}</span></>}
      </button>
    </article>
  )
}

function App() {
  const [state, setState] = useState<GameState>(() => loadGame())
  const [panel, setPanel] = useState<UpgradePanelState | null>(null)
  const [dockPanel, setDockPanel] = useState<'settings' | 'stats' | null>(null)
  const [resetArmed, setResetArmed] = useState(false)
  const [sound, setSound] = useState(() => localStorage.getItem('vault-run-sound') !== 'off')
  const [goldFlights, setGoldFlights] = useState<GoldFlight[]>([])
  const [seenUpgradeLevels, setSeenUpgradeLevels] = useState(loadSeenUpgradeLevels)
  const [upgradeNoticePulsing, setUpgradeNoticePulsing] = useState(false)
  const [updateInstalling, setUpdateInstalling] = useState(false)
  const serviceWorkerRegistration = useRef<ServiceWorkerRegistration | null>(null)
  const {
    needRefresh: [updateAvailable, setUpdateAvailable],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW: (_scriptUrl, registration) => {
      serviceWorkerRegistration.current = registration ?? null
    },
  })
  const sceneRef = useRef<HTMLDivElement>(null)
  const bagButtonRef = useRef<HTMLButtonElement>(null)
  const chestButtonRef = useRef<HTMLButtonElement>(null)
  const mineButtonRef = useRef<HTMLButtonElement>(null)
  const flightSequence = useRef(0)
  const lastTrips = useRef(state.tripCount)
  const lastMainTransportStart = useRef(state.transportStartedAt)
  const lastExpressTransportStart = useRef(state.expressStartedAt)
  const previousAffordable = useRef(new Set<string>())
  const pulseTimer = useRef<number | null>(null)
  const liveState = useRef(state)
  liveState.current = state

  useEffect(() => {
    const checkForUpdate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void serviceWorkerRegistration.current?.update()
      }
    }
    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL)
    window.addEventListener('focus', checkForUpdate)
    document.addEventListener('visibilitychange', checkForUpdate)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', checkForUpdate)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setState((current) => advanceGame(current, Date.now())), 100)
    const saver = window.setInterval(() => setState((current) => {
      saveGame(current)
      return current
    }), 2_000)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setState((current) => {
        saveGame(current)
        return current
      })
      else setState((current) => advanceGame(current, Date.now(), true))
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      window.clearInterval(saver)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (state.tripCount > lastTrips.current) playTone('trip', sound)
    lastTrips.current = state.tripCount
  }, [state.tripCount, sound])

  const allUpgrades = useMemo(() => getAllUpgrades(state), [state])
  const affordable = allUpgrades.filter((upgrade) => upgrade.available && !upgrade.maxed && state.vaultGold >= upgrade.cost)
  const affordableKeys = affordable.map((upgrade) => `${upgrade.key}:${upgrade.cost}`)
  const affordableSignature = affordableKeys.join('|')

  useEffect(() => {
    const current = new Set(affordableKeys)
    const hasNew = affordableKeys.some((key) => !previousAffordable.current.has(key) && !seenUpgradeLevels.has(key))
    previousAffordable.current = current
    if (!hasNew || panel) return
    setUpgradeNoticePulsing(true)
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current)
    pulseTimer.current = window.setTimeout(() => setUpgradeNoticePulsing(false), 950)
    return () => {
      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current)
    }
  }, [affordableSignature, panel, seenUpgradeLevels])

  const acknowledge = (filter: UpgradeFilter) => {
    const prefix = UPGRADE_FILTER_PREFIX[filter]
    const relevant = affordable.filter((upgrade) => upgrade.key.startsWith(prefix)).map((upgrade) => `${upgrade.key}:${upgrade.cost}`)
    if (relevant.length === 0) return
    setSeenUpgradeLevels((current) => {
      const next = new Set(current)
      relevant.forEach((key) => next.add(key))
      localStorage.setItem(UPGRADE_NOTICE_KEY, JSON.stringify([...next]))
      return next
    })
    setUpgradeNoticePulsing(false)
  }

  const openUpgrades = (filter: UpgradeFilter, focusKey?: string) => {
    acknowledge(filter)
    setDockPanel(null)
    setPanel({ filter, focusKey })
  }

  const openSlotUpgrades = (section: SectionId, index: SlotIndex) => {
    const group = SECTION_SLOT_GROUP[section]
    openUpgrades(group, `slot:${group}:${index}`)
  }

  const openDockPanel = (kind: 'settings' | 'stats') => {
    setPanel(null)
    setResetArmed(false)
    setDockPanel((current) => (current === kind ? null : kind))
  }

  const launchGold = useCallback((value: number, kind: GoldFlight['kind'], preciseValue = false) => {
    const scene = sceneRef.current?.getBoundingClientRect()
    const source = (kind === 'coin' ? mineButtonRef : bagButtonRef).current?.getBoundingClientRect()
    const target = (kind === 'coin' ? bagButtonRef : chestButtonRef).current?.getBoundingClientRect()
    if (!scene || !source || !target) return
    const left = source.left + source.width / 2 - scene.left
    const top = source.top + source.height / 2 - scene.top
    const endX = target.left + target.width / 2 - scene.left - left
    const endY = target.top + target.height / 2 - scene.top - top
    setGoldFlights((current) => [...current.slice(-5), {
      id: ++flightSequence.current,
      kind,
      value,
      left,
      top,
      midX: endX * 0.5 + (Math.random() - 0.5) * (kind === 'coin' ? 34 : 18),
      midY: endY * 0.5 - (kind === 'coin' ? 22 + Math.random() * 24 : 14),
      endX: endX + (Math.random() - 0.5) * 6,
      endY: endY + (Math.random() - 0.5) * 6,
      rotation: (Math.random() - 0.5) * 70,
      duration: kind === 'coin' ? 850 + Math.random() * 250 : GOLD_FLIGHT_DURATION_MS,
      preciseValue,
    }])
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const current = liveState.current
      const rate = passiveRate(current)
      const miningPaused = current.transportEndsAt !== null && !hasAutomaticTransport(current)
      const freeBagSpace = Math.max(0, chestCapacity(current) - current.chestGold)
      const animatedAmount = Math.min(rate, freeBagSpace)
      if (!miningPaused && animatedAmount > 0) launchGold(animatedAmount, 'coin', true)
    }, 1_000)
    return () => window.clearInterval(timer)
  }, [launchGold])

  useEffect(() => {
    if (state.transportStartedAt !== null && state.transportStartedAt !== lastMainTransportStart.current && state.inTransitGold > 0) {
      launchGold(state.inTransitGold, 'pile')
    }
    if (state.expressStartedAt !== null && state.expressStartedAt !== lastExpressTransportStart.current && state.expressGold > 0) {
      launchGold(state.expressGold, 'pile')
    }
    lastMainTransportStart.current = state.transportStartedAt
    lastExpressTransportStart.current = state.expressStartedAt
  }, [state.transportStartedAt, state.expressStartedAt, state.inTransitGold, state.expressGold, launchGold])

  const now = Date.now()
  const bagMax = chestCapacity(state)
  const treasureMax = vaultCapacity(state)
  const bagFull = state.chestGold >= bagMax - 0.001
  const automatic = hasAutomaticTransport(state)
  const mainTravelling = state.transportEndsAt !== null
  const expressTravelling = state.expressEndsAt !== null
  const playerTravelling = automatic ? expressTravelling : mainTravelling
  const playerTransportStartedAt = automatic ? state.expressStartedAt : state.transportStartedAt
  const playerTransportEndsAt = automatic ? state.expressEndsAt : state.transportEndsAt
  const playerTransportProgress = playerTravelling
    ? percentage(now - (playerTransportStartedAt ?? now), (playerTransportEndsAt ?? now) - (playerTransportStartedAt ?? now))
    : 100
  const reservedGold = state.inTransitGold + state.expressGold
  const canStartMain = !mainTravelling && state.chestGold > 0 && state.vaultGold + reservedGold < treasureMax
  const canStartExpress = automatic && !expressTravelling && state.chestGold > 0 && state.vaultGold + reservedGold < treasureMax
  const canTransport = automatic ? canStartExpress : canStartMain
  const transportSeconds = automatic ? transportDuration(state) : 0
  const chestRevealed = state.tripCount > 0
    || state.vaultGold > 0
    || (state.transportEndsAt !== null && state.inTransitGold === 0)
    || (state.expressEndsAt !== null && state.expressGold === 0)

  const affordableIn = (filter: UpgradeFilter) => affordable.filter((upgrade) => upgrade.key.startsWith(UPGRADE_FILTER_PREFIX[filter]))
  const unseenFor = (filter: UpgradeFilter) => affordableIn(filter).filter((upgrade) => !seenUpgradeLevels.has(`${upgrade.key}:${upgrade.cost}`))

  const handleTap = () => {
    if (playerTravelling || bagFull) return
    const earned = Math.min(tapValue(state), Math.max(0, bagMax - state.chestGold))
    setState((current) => tap(current))
    launchGold(earned, 'coin')
    playTone('coin', sound)
    haptic(8)
  }

  const handleTransport = () => {
    if (!canTransport) return
    const next = automatic ? startExpressTransport(state, Date.now()) : startTransport(state, Date.now())
    const payload = automatic ? next.expressGold : next.inTransitGold
    if (payload <= 0) return
    setState(next)
    playTone('trip', sound)
    haptic(18)
  }

  const handleSecure = () => {
    if (state.threat <= 0) return
    setState((current) => lowerThreat(current))
    playTone('secure', sound)
    haptic(10)
  }

  const handleBuy = (upgrade: UpgradeView) => {
    setState((current) => upgrade.equipmentId
      ? buyEquipmentUpgrade(current, upgrade.equipmentId)
      : upgrade.slot ? buySlotUpgrade(current, upgrade.slot.group, upgrade.slot.index) : current)
    playTone('upgrade', sound)
    haptic(14)
  }

  const toggleSound = () => {
    setSound((enabled) => {
      localStorage.setItem('vault-run-sound', enabled ? 'off' : 'on')
      return !enabled
    })
  }

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true)
      return
    }
    localStorage.removeItem(UPGRADE_NOTICE_KEY)
    setSeenUpgradeLevels(new Set())
    setState(resetGame())
    setPanel(null)
    setDockPanel(null)
    setResetArmed(false)
  }

  const closeDockPanel = () => {
    setDockPanel(null)
    setResetArmed(false)
  }

  const installUpdate = async () => {
    if (updateInstalling) return
    setUpdateInstalling(true)
    saveGame(state)
    try {
      await updateServiceWorker(true)
    } catch {
      setUpdateInstalling(false)
    }
  }

  const upgradeGroups = panel ? getUpgradeGroups(state, panel.filter) : []
  const dockNoticeCount = unseenFor('all').length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="header-wealth"><strong><PixelCoin /> {formatGold(state.vaultGold)}</strong></div>
      </header>

      <main className="game-stage" aria-label="Dein Goldreich">
        <div className="game-sections" ref={sceneRef}>
          <article className="game-section game-section--chest">
            <h2 className="section-divider"><span>Truhe</span></h2>
            <div className="section-layout">
              <div className="stats-grid" aria-label="Truhenwerte">
                <StatTile label="Sicherheitsniveau" value={`${securityRating(state)}%`} icon={<ShieldCheck aria-hidden="true" />} />
                <StatTile label="Risiko / Klick" value={`−${formatGold(threatReductionPerClick(state))}`} />
                <StatTile /><StatTile />
              </div>
              <div className="section-center">
                <button ref={chestButtonRef} className={`section-action section-action--chest ${chestRevealed ? 'is-revealed' : 'is-unrevealed'}`} disabled={!chestRevealed || state.threat <= 0} onClick={handleSecure} aria-label={chestRevealed ? `Aufmerksamkeit um ${threatReductionPerClick(state)} senken` : 'Schatztruhe noch nicht erreicht'}>
                  <PixelSprite family="chest" level={state.vaultLevel} />
                </button>
                <SectionProgress fill={percentage(state.vaultGold, treasureMax)} label="Füllstand der Schatztruhe" amount={`${formatGold(state.vaultGold)}/${formatGold(treasureMax)}`} />
              </div>
              <SlotGrid section="chest" levels={state.guardLevels} family="security" notifying={upgradeNoticePulsing && unseenFor('guards').length > 0} noticeCount={unseenFor('guards').length} onOpen={(index) => openSlotUpgrades('chest', index)} />
            </div>
          </article>

          <article className="game-section game-section--bag">
            <h2 className="section-divider"><span>Beutel</span></h2>
            <div className="section-layout">
              <div className="stats-grid" aria-label="Beutelwerte">
                <StatTile label="Aufmerksamkeit" value={`${Math.floor(state.threat)}%`} icon={<Eye aria-hidden="true" />} />
                <StatTile label="Auto-Menge" value={automatic ? formatGold(automaticTransportAmount(state)) : '–'} />
                <StatTile label="Auto-Takt" value={automatic ? `${transportSeconds.toLocaleString('de-DE', { maximumFractionDigits: 1 })} s` : 'Manuell'} />
                <StatTile />
              </div>
              <div className="section-center">
                <button ref={bagButtonRef} className={`section-action ${playerTravelling ? 'is-progressing' : ''} ${bagFull && canTransport ? 'is-full' : ''}`} disabled={!canTransport} onClick={handleTransport} aria-label={playerTravelling ? `Manueller Transport: ${Math.round(playerTransportProgress)} Prozent` : 'Gold zur Schatztruhe transportieren'}>
                  {playerTravelling && <i className="section-action__progress" style={{ height: `${playerTransportProgress}%` }} aria-hidden="true" />}
                  <PixelSprite family="bag" level={state.chestLevel} />
                </button>
                <SectionProgress fill={percentage(state.chestGold, bagMax)} label="Füllstand des Goldbeutels" amount={`${formatGold(state.chestGold)}/${formatGold(bagMax)}`} />
              </div>
              <SlotGrid section="bag" levels={state.transporterLevels} family="transport" notifying={upgradeNoticePulsing && unseenFor('transporters').length > 0} noticeCount={unseenFor('transporters').length} onOpen={(index) => openSlotUpgrades('bag', index)} />
            </div>
          </article>

          <article className="game-section game-section--mine">
            <h2 className="section-divider"><span>Mine</span></h2>
            <div className="section-layout">
              <div className="stats-grid" aria-label="Minenwerte">
                <StatTile label="Auto / Sek." value={formatFlightGold(passiveRate(state), true)} />
                <StatTile label="Gold / Klick" value={`+${formatGold(tapValue(state))}`} />
                <StatTile /><StatTile />
              </div>
              <div className="section-center">
                <button ref={mineButtonRef} className={`section-action ${playerTravelling ? 'is-progressing' : ''}`} disabled={playerTravelling || bagFull} onClick={handleTap} aria-label={playerTravelling ? `Manueller Transport: ${Math.round(playerTransportProgress)} Prozent` : `Gold schürfen: ${formatGold(tapValue(state))}`}>
                  {playerTravelling && <i className="section-action__progress" style={{ height: `${playerTransportProgress}%` }} aria-hidden="true" />}
                  <PixelSprite family="pickaxe" level={state.tapLevel} />
                </button>
              </div>
              <SlotGrid section="mine" levels={state.minerLevels} family="miner" notifying={upgradeNoticePulsing && unseenFor('miners').length > 0} noticeCount={unseenFor('miners').length} onOpen={(index) => openSlotUpgrades('mine', index)} />
            </div>
          </article>

          {goldFlights.map((flight) => (
            <i key={flight.id} className={`flying-gold flying-gold--${flight.kind}`} style={{
              left: flight.left,
              top: flight.top,
              '--coin-mid-x': `${flight.midX}px`,
              '--coin-mid-y': `${flight.midY}px`,
              '--coin-end-x': `${flight.endX}px`,
              '--coin-end-y': `${flight.endY}px`,
              '--coin-rotation': `${flight.rotation}deg`,
              '--coin-end-rotation': `${flight.rotation * 1.7}deg`,
              '--coin-duration': `${flight.duration}ms`,
            } as CSSProperties} onAnimationEnd={() => {
              if (flight.kind === 'pile') setState((current) => advanceGame(current, Date.now()))
              setGoldFlights((current) => current.filter((item) => item.id !== flight.id))
            }}>
              {flight.kind === 'coin' ? <PixelCoin /> : <PixelGoldPile />}<span>+{formatFlightGold(flight.value, flight.preciseValue)}</span>
            </i>
          ))}
        </div>
      </main>

      <nav className="dock" aria-label="Hauptmenü">
        <div className="dock__inner">
          <button
            className={`dock-button ${panel ? 'is-active' : ''} ${upgradeNoticePulsing && dockNoticeCount > 0 ? 'is-notifying' : ''}`}
            onClick={() => (panel ? setPanel(null) : openUpgrades('all'))}
            aria-expanded={Boolean(panel)}
            aria-label={dockNoticeCount > 0 ? `Ausbau öffnen, ${dockNoticeCount} kaufbare Upgrades` : 'Ausbau öffnen'}
          >
            <UpgradeIcon /><span>Ausbau</span>
            {dockNoticeCount > 0 && <em className="dock-button__badge">{dockNoticeCount}</em>}
          </button>
          <button className={`dock-button ${dockPanel === 'stats' ? 'is-active' : ''}`} onClick={() => openDockPanel('stats')} aria-expanded={dockPanel === 'stats'} aria-label="Statistik öffnen">
            <BarChart3 size={22} aria-hidden="true" /><span>Statistik</span>
          </button>
          <button className={`dock-button ${dockPanel === 'settings' ? 'is-active' : ''}`} onClick={() => openDockPanel('settings')} aria-expanded={dockPanel === 'settings'} aria-label="Einstellungen öffnen">
            <Settings size={22} aria-hidden="true" /><span>Einstellungen</span>
          </button>
        </div>
      </nav>

      {panel && (
        <>
          <button className="sheet-backdrop" aria-label="Ausbau schließen" onClick={() => setPanel(null)} />
          <aside className="management-sheet is-open" aria-label="Ausbau">
            <button className="sheet-close" onClick={() => setPanel(null)} aria-label="Ausbau schließen">×</button>
            <div className="sheet-filters" role="tablist" aria-label="Upgrade-Typ filtern">
              {UPGRADE_FILTERS.map((filter) => {
                const buyable = affordableIn(filter).length
                return (
                  <button key={filter} role="tab" aria-selected={panel.filter === filter} className={panel.filter === filter ? 'is-active' : ''} onClick={() => openUpgrades(filter)}>
                    {UPGRADE_FILTER_LABEL[filter]}
                    {buyable > 0 && <b aria-label={`${buyable} bezahlbar`}>{buyable}</b>}
                  </button>
                )
              })}
            </div>
            <div className="sheet-content">
              <div className="sheet-heading"><span>AUSBAU</span><h2>{UPGRADE_FILTER_TITLE[panel.filter]}</h2><p>Bezahlt wird mit Gold aus der Schatztruhe.</p></div>
              {upgradeGroups.map((group) => (
                <section key={group.category} className="upgrade-group">
                  {upgradeGroups.length > 1 && <h3 className="upgrade-group__title">{group.label}</h3>}
                  <div className="upgrade-list">
                    {group.upgrades.map((upgrade) => <UpgradeCard key={upgrade.key} upgrade={upgrade} state={state} focused={panel.focusKey === upgrade.key} onBuy={handleBuy} />)}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </>
      )}

      {dockPanel && (
        <div className="header-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDockPanel()}>
          <section className="header-modal" role="dialog" aria-modal="true" aria-labelledby="header-modal-title">
            <button className="header-modal__close" onClick={closeDockPanel} aria-label="Popup schließen">×</button>
            <span className="modal-kicker">VAULT RUN</span>
            <h2 id="header-modal-title">{dockPanel === 'settings' ? 'Einstellungen' : 'Statistik'}</h2>
            {dockPanel === 'settings' ? (
              <div className="settings-list">
                <button className="settings-toggle" onClick={toggleSound} aria-pressed={sound}>
                  {sound ? <Volume2 size={22} /> : <VolumeX size={22} />}
                  <span><strong>Sounds</strong><small>{sound ? 'Ein' : 'Aus'}</small></span>
                </button>
                <button className={`settings-reset ${resetArmed ? 'is-armed' : ''}`} onClick={handleReset}>
                  <RotateCcw size={21} />
                  <span>{resetArmed ? 'Erneut tippen: wirklich neu starten' : 'Spiel neu starten'}</span>
                </button>
              </div>
            ) : (
              <div className="statistics-grid">
                <div><span>Insgesamt geschürft</span><strong>{formatGold(state.lifetimeGold)}</strong></div>
                <div><span>Transporte</span><strong>{state.tripCount}</strong></div>
                <div><span>Aktuell gesichert</span><strong>{formatGold(state.vaultGold)}</strong></div>
                <div><span>Gestohlen</span><strong>{formatGold(state.stolenGold)}</strong></div>
                <div><span>Verloren</span><strong>{formatGold(state.lostGold)}</strong></div>
                <div><span>Diebeszüge</span><strong>{state.theftCount}</strong></div>
              </div>
            )}
          </section>
        </div>
      )}

      {state.lastOfflineReport && (
        <div className="modal-backdrop" role="presentation">
          <section className="offline-modal" role="dialog" aria-modal="true" aria-labelledby="offline-title">
            <div className="offline-icon"><Clock3 size={27} /></div>
            <span className="modal-kicker">WILLKOMMEN ZURÜCK</span>
            <h2 id="offline-title">Deine Mine war aktiv</h2>
            <p>{formatDuration(state.lastOfflineReport.seconds)} wurden nachberechnet.</p>
            <div className="offline-grid">
              <div><span>Verdient</span><strong>+{formatGold(state.lastOfflineReport.earned)}</strong></div>
              <div><span>Gesichert</span><strong>+{formatGold(state.lastOfflineReport.delivered)}</strong></div>
              <div className={state.lastOfflineReport.stolen ? 'has-loss' : ''}><span>Gestohlen</span><strong>–{formatGold(state.lastOfflineReport.stolen)}</strong></div>
            </div>
            <button onClick={() => setState((current) => dismissOfflineReport(current))}>Zurück in die Mine</button>
          </section>
        </div>
      )}

      {updateAvailable && (
        <aside className="update-notice" role="dialog" aria-modal="false" aria-live="polite" aria-labelledby="update-notice-title" aria-describedby="update-notice-description">
          <span className="update-notice__icon" aria-hidden="true"><Download size={23} /></span>
          <div className="update-notice__copy">
            <span>NEUE VERSION</span>
            <strong id="update-notice-title">Update bereit</strong>
            <p id="update-notice-description">Installiere die neue Version und spiele direkt weiter.</p>
          </div>
          <div className="update-notice__actions">
            <button className="update-notice__install" disabled={updateInstalling} onClick={() => void installUpdate()}>
              {updateInstalling ? 'Wird installiert …' : 'Jetzt installieren'}
            </button>
            <button className="update-notice__later" disabled={updateInstalling} onClick={() => setUpdateAvailable(false)}>Später</button>
          </div>
        </aside>
      )}
    </div>
  )
}

export default App
