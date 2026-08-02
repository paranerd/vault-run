import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Check,
  ChartNoAxesCombined,
  Clock3,
  Eye,
  LockKeyhole,
  RotateCcw,
  SlidersHorizontal,
  UsersRound,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  SECURITY,
  chestCapacity,
  convoySize,
  getUpgrades,
  passiveRate,
  tapValue,
  vaultCapacity,
} from './game/config'
import {
  advanceGame,
  buyUpgrade,
  dismissOfflineReport,
  startExpressTransport,
  startTransport,
  tap,
} from './game/engine'
import { formatDuration, formatGold } from './game/format'
import { loadGame, resetGame, saveGame } from './game/storage'
import type { GameState, UpgradeCategory, UpgradeId, UpgradeView } from './game/types'

type Panel = 'upgrades' | 'stats'
type Filter = 'all' | UpgradeCategory

const UPGRADE_NOTICE_KEY = 'vault-run-seen-upgrade-levels'
const WIDE_LAYOUT_QUERY = '(min-width: 760px)'
const SPRITE_ROOT = `${import.meta.env.BASE_URL}sprites`

interface CoinFlight {
  id: number
  value: number
  left: number
  top: number
  midX: number
  midY: number
  endX: number
  endY: number
  rotation: number
  duration: number
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'production', label: 'Abbau' },
  { id: 'storage', label: 'Schätze' },
  { id: 'transport', label: 'Transport' },
  { id: 'security', label: 'Sicherheit' },
]

function percentage(value: number, capacity: number) {
  return Math.max(0, Math.min(100, (value / capacity) * 100))
}

function roundTripPosition(start: number | null, end: number | null, now: number) {
  if (start === null || end === null) return 0
  const progress = percentage(now - start, end - start)
  return progress <= 50 ? progress * 2 : (100 - progress) * 2
}

function playTone(kind: 'coin' | 'trip' | 'upgrade', enabled: boolean) {
  if (!enabled) return
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = kind === 'trip' ? 'square' : 'sine'
    oscillator.frequency.setValueAtTime(kind === 'coin' ? 650 : kind === 'upgrade' ? 440 : 220, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'coin' ? 920 : kind === 'upgrade' ? 680 : 330, context.currentTime + 0.08)
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

function PixelSprite({ family, level, className = '' }: { family: 'pickaxe' | 'bag' | 'chest' | 'transport' | 'security'; level: number; className?: string }) {
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

function UpgradeSprite({ upgrade, state }: { upgrade: UpgradeView; state: GameState }) {
  if (upgrade.id === 'tap') return <PixelSprite family="pickaxe" level={state.tapLevel} />
  if (upgrade.id === 'staff') return <PixelSprite family="transport" level={0} />
  if (upgrade.id === 'chest') return <PixelSprite family="bag" level={state.chestLevel} />
  if (upgrade.id === 'vault') return <PixelSprite family="chest" level={state.vaultLevel} />
  if (upgrade.id === 'security') return <PixelSprite family="security" level={state.securityLevel} />
  return <PixelSprite family="transport" level={state.transportLevel} />
}

function StorageMeter({ value, capacity, label }: { value: number; capacity: number; label: string }) {
  const fill = percentage(value, capacity)
  return (
    <div className="storage-meter">
      <div
        className="storage-meter__bar"
        role="progressbar"
        aria-label={`${label} zu ${Math.round(fill)} Prozent gefüllt`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fill)}
      >
        <i style={{ width: `${fill}%` }} />
      </div>
      <div className="storage-meter__amount">
        <strong>{formatGold(value)}</strong><span>/{formatGold(capacity)}</span>
      </div>
    </div>
  )
}

function UpgradeCard({ upgrade, state, onBuy }: { upgrade: UpgradeView; state: GameState; onBuy: (id: UpgradeId) => void }) {
  const affordable = state.vaultGold >= upgrade.cost
  const disabled = !upgrade.available || !affordable || upgrade.maxed
  return (
    <article className={`upgrade-card upgrade-card--${upgrade.category} ${!upgrade.available ? 'is-locked' : ''}`}>
      <div className="upgrade-card__content">
        <span className="upgrade-card__sprite"><UpgradeSprite upgrade={upgrade} state={state} /></span>
        <div className="upgrade-card__details">
          <div className="upgrade-card__top">
            <span>{upgrade.level}</span>
            {upgrade.maxed && <b><Check size={13} /> Aktiv</b>}
          </div>
          <h3>{upgrade.name}</h3>
          <p>{upgrade.description}</p>
          <div className="upgrade-effects" aria-label="Upgrade-Effekt">
            <div><span>Aktuell</span><strong>{upgrade.currentEffect}</strong></div>
            <div><span>Nächste Stufe</span><strong>{upgrade.nextEffect}</strong></div>
          </div>
          {!upgrade.available && !upgrade.maxed && (
            <span className="locked-note"><LockKeyhole size={13} /> Erst den Fuhrknecht anheuern</span>
          )}
        </div>
      </div>
      {(upgrade.available || upgrade.maxed) && (
        <button
          className="buy-button"
          disabled={disabled}
          onClick={() => onBuy(upgrade.id)}
          aria-label={upgrade.maxed ? `${upgrade.name}: erledigt` : `${upgrade.name} für ${formatGold(upgrade.cost)} kaufen`}
        >
          {upgrade.maxed ? <><Check size={18} /><span>Erledigt</span></> : <><PixelCoin /><span>{formatGold(upgrade.cost)}</span></>}
        </button>
      )}
    </article>
  )
}

function App() {
  const [state, setState] = useState<GameState>(() => loadGame())
  const [panel, setPanel] = useState<Panel | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sound, setSound] = useState(() => localStorage.getItem('vault-run-sound') !== 'off')
  const [coinFlights, setCoinFlights] = useState<CoinFlight[]>([])
  const [seenUpgradeLevels, setSeenUpgradeLevels] = useState(loadSeenUpgradeLevels)
  const [upgradeButtonPulsing, setUpgradeButtonPulsing] = useState(false)
  const [wideLayout, setWideLayout] = useState(() => window.matchMedia(WIDE_LAYOUT_QUERY).matches)
  const sceneRef = useRef<HTMLDivElement>(null)
  const chestRef = useRef<HTMLButtonElement>(null)
  const goldButtonRef = useRef<HTMLButtonElement>(null)
  const flightSequence = useRef(0)
  const lastTrips = useRef(state.tripCount)
  const previousAffordableLevels = useRef(new Set<string>())
  const upgradePulseTimer = useRef<number | null>(null)

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
    const query = window.matchMedia(WIDE_LAYOUT_QUERY)
    const updateLayout = () => setWideLayout(query.matches)
    query.addEventListener('change', updateLayout)
    return () => query.removeEventListener('change', updateLayout)
  }, [])

  useEffect(() => {
    if (state.tripCount > lastTrips.current) playTone('trip', sound)
    lastTrips.current = state.tripCount
  }, [state.tripCount, sound])

  const upgrades = useMemo(() => getUpgrades(state), [state])
  const visibleUpgrades = filter === 'all' ? upgrades : upgrades.filter((upgrade) => upgrade.category === filter)
  const affordableUpgrades = upgrades.filter((upgrade) => upgrade.available && !upgrade.maxed && state.vaultGold >= upgrade.cost)
  const affordableLevelKeys = affordableUpgrades.map((upgrade) => `${upgrade.id}:${upgrade.cost}`)
  const affordableLevelSignature = affordableLevelKeys.join('|')
  const hasUnseenAffordableUpgrade = affordableLevelKeys.some((key) => !seenUpgradeLevels.has(key))
  const upgradeNoticeCount = hasUnseenAffordableUpgrade ? affordableUpgrades.length : 0
  const upgradesVisible = panel === 'upgrades' || (wideLayout && panel !== 'stats')
  const now = Date.now()
  const chestMax = chestCapacity(state)
  const vaultMax = vaultCapacity(state)
  const chestFull = state.chestGold >= chestMax - 0.001
  const isTravelling = state.transportEndsAt !== null
  const isExpressTravelling = state.expressEndsAt !== null
  const businessPaused = isTravelling && !state.courierUnlocked
  const manualTransportProgress = businessPaused
    ? percentage(now - (state.transportStartedAt ?? now), (state.transportEndsAt ?? now) - (state.transportStartedAt ?? now))
    : 100
  const tripPosition = roundTripPosition(state.transportStartedAt, state.transportEndsAt, now)
  const expressPosition = roundTripPosition(state.expressStartedAt, state.expressEndsAt, now)
  const mainAtVault = state.transportDeliveredAt !== null && now >= state.transportDeliveredAt
  const expressAtVault = state.expressDeliveredAt !== null && now >= state.expressDeliveredAt
  const vaultReserved = state.inTransitGold + state.expressGold
  const canStartTransport = !isTravelling && state.chestGold > 0 && state.vaultGold + vaultReserved < vaultMax
  const canStartExpress = state.courierUnlocked && !isExpressTravelling && state.chestGold > 0 && state.vaultGold + vaultReserved < vaultMax
  const canUseChest = state.courierUnlocked ? canStartExpress : canStartTransport

  const acknowledgeAffordableUpgrades = () => {
    if (affordableLevelKeys.length === 0) return
    setSeenUpgradeLevels((current) => {
      const next = new Set(current)
      affordableLevelKeys.forEach((key) => next.add(key))
      localStorage.setItem(UPGRADE_NOTICE_KEY, JSON.stringify([...next]))
      return next
    })
    setUpgradeButtonPulsing(false)
    if (upgradePulseTimer.current !== null) window.clearTimeout(upgradePulseTimer.current)
  }

  useEffect(() => {
    const currentLevels = new Set(affordableLevelKeys)
    const hasNewLevel = affordableLevelKeys.some((key) => !previousAffordableLevels.current.has(key) && !seenUpgradeLevels.has(key))
    previousAffordableLevels.current = currentLevels

    if (!hasNewLevel || upgradesVisible) return
    setUpgradeButtonPulsing(true)
    if (upgradePulseTimer.current !== null) window.clearTimeout(upgradePulseTimer.current)
    upgradePulseTimer.current = window.setTimeout(() => setUpgradeButtonPulsing(false), 950)
    return () => {
      if (upgradePulseTimer.current !== null) window.clearTimeout(upgradePulseTimer.current)
    }
  }, [affordableLevelSignature, seenUpgradeLevels, upgradesVisible])

  useEffect(() => {
    if (upgradesVisible) acknowledgeAffordableUpgrades()
  }, [affordableLevelSignature, upgradesVisible])

  const launchCoin = (value: number) => {
    const scene = sceneRef.current?.getBoundingClientRect()
    const source = goldButtonRef.current?.getBoundingClientRect()
    const target = chestRef.current?.getBoundingClientRect()
    if (!scene || !source || !target) return

    const left = source.left + source.width / 2 - scene.left
    const top = source.top + source.height * 0.28 - scene.top
    const endX = target.left + target.width / 2 - scene.left - left
    const endY = target.top + target.height / 2 - scene.top - top
    const sway = (Math.random() - 0.5) * Math.min(92, Math.abs(endX) * 0.55 + 32)
    const arc = 24 + Math.random() * 38

    setCoinFlights((current) => [...current.slice(-5), {
      id: ++flightSequence.current,
      value,
      left,
      top,
      midX: endX * (0.38 + Math.random() * 0.18) + sway,
      midY: endY * 0.42 - arc,
      endX: endX + (Math.random() - 0.5) * 8,
      endY: endY + (Math.random() - 0.5) * 6,
      rotation: (Math.random() - 0.5) * 70,
      duration: 1_050 + Math.random() * 300,
    }])
  }

  const handleTap = () => {
    if (businessPaused || chestFull) return
    const earned = Math.min(tapValue(state), Math.max(0, chestMax - state.chestGold))
    setState((current) => tap(current))
    launchCoin(earned)
    playTone('coin', sound)
    haptic(8)
  }

  const handleTransport = () => {
    if (state.courierUnlocked) {
      if (!canStartExpress) return
      setState((current) => startExpressTransport(current, Date.now()))
    } else {
      if (!canStartTransport) return
      setState((current) => startTransport(current, Date.now()))
    }
    playTone('trip', sound)
    haptic(18)
  }

  const handleBuy = (id: UpgradeId) => {
    setState((current) => buyUpgrade(current, id))
    playTone('upgrade', sound)
    haptic(14)
  }

  const toggleSound = () => {
    setSound((enabled) => {
      localStorage.setItem('vault-run-sound', enabled ? 'off' : 'on')
      return !enabled
    })
  }

  const openPanel = (next: Panel) => {
    if (next === 'upgrades') acknowledgeAffordableUpgrades()
    setPanel((current) => current === next ? null : next)
  }
  const confirmReset = () => {
    if (window.confirm('Den lokalen Spielstand wirklich löschen?')) {
      localStorage.removeItem(UPGRADE_NOTICE_KEY)
      setSeenUpgradeLevels(new Set())
      setState(resetGame())
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-label="Vault Run"><PixelSprite family="pickaxe" level={3} /></div>
        <div className="header-wealth">
          <strong><PixelCoin /> {formatGold(state.vaultGold)}</strong>
        </div>
        <div className="header-actions">
          <button className="sound-button" onClick={toggleSound} aria-label={sound ? 'Ton ausschalten' : 'Ton einschalten'}>
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
      </header>

      <main className="app-layout">
        <section className="game-stage" aria-label="Deine Goldmine">
          <div className="game-scene" ref={sceneRef}>
            <div className="core-loop">
              <article className="station vault-station">
                <div className="station-heading">
                  <strong>Schatztruhe</strong>
                </div>
                <div className="station-visual station-visual--vault" aria-label="Deine sichere Schatztruhe">
                  <PixelSprite family="chest" level={state.vaultLevel} />
                </div>
                <StorageMeter value={state.vaultGold} capacity={vaultMax} label="Schatztruhe" />
                <div className="security-line"><PixelSprite family="security" level={state.securityLevel} /> {SECURITY[state.securityLevel].name}</div>
              </article>

              <div className="transport-lane" aria-label="Reise zur Schatztruhe">
                <div className="road">
                  {isTravelling && (
                    <div
                      className={`vehicle ${mainAtVault ? 'is-returning' : ''}`}
                      style={{ '--vehicle-position': `${tripPosition}%` } as CSSProperties}
                    >
                      <PixelSprite family="transport" level={state.transportLevel} />
                      {state.inTransitGold > 0 && <b className="vehicle__cargo">{formatGold(state.inTransitGold)}</b>}
                      {convoySize(state) > 1 && <em>×{convoySize(state)}</em>}
                    </div>
                  )}
                  {isExpressTravelling && (
                    <div
                      className={`vehicle vehicle--express ${expressAtVault ? 'is-returning' : ''}`}
                      style={{ '--vehicle-position': `${expressPosition}%` } as CSSProperties}
                    >
                      <PixelSprite family="transport" level={state.transportLevel} />
                      {state.expressGold > 0 && <b className="vehicle__cargo">{formatGold(state.expressGold)}</b>}
                    </div>
                  )}
                </div>
              </div>

              <article className={`station chest-station ${chestFull ? 'is-full' : ''}`}>
                <div className="station-heading">
                  <strong>Goldbeutel</strong>
                </div>
                <div className="chest-visual-row">
                  <button
                    ref={chestRef}
                    className={`station-visual station-visual--chest ${chestFull ? 'is-closed' : ''}`}
                    onClick={handleTransport}
                    disabled={!canUseChest}
                    aria-label={`${state.courierUnlocked ? 'Eilreise mit Gold starten' : 'Goldbeutel zur Schatztruhe bringen'}, ${Math.round(percentage(state.chestGold, chestMax))} Prozent gefüllt`}
                  >
                    <PixelSprite family="bag" level={state.chestLevel} />
                    {canUseChest && (
                      <span className="chest-action-badge" aria-hidden="true">
                        <PixelSprite family="transport" level={state.transportLevel} />
                      </span>
                    )}
                  </button>
                  <div className="chest-indicators" aria-label="Minenstatus">
                    <div className="chest-indicator chest-indicator--production" aria-label={`Passiver Abbau: ${formatGold(passiveRate(state))} Gold pro Sekunde`}>
                      <UsersRound size={16} aria-hidden="true" />
                      <strong>{formatGold(passiveRate(state))}/s</strong>
                    </div>
                    <div className="chest-indicator chest-indicator--attention" aria-label={`Diebesgefahr: ${Math.floor(state.threat)} Prozent`}>
                      <Eye size={16} aria-hidden="true" />
                      <strong>{Math.floor(state.threat)}%</strong>
                    </div>
                  </div>
                </div>
                <StorageMeter value={state.chestGold} capacity={chestMax} label="Goldbeutel" />
              </article>
            </div>

            {coinFlights.map((flight) => (
              <i
                key={flight.id}
                className="flying-coin"
                style={{
                  left: flight.left,
                  top: flight.top,
                  '--coin-mid-x': `${flight.midX}px`,
                  '--coin-mid-y': `${flight.midY}px`,
                  '--coin-end-x': `${flight.endX}px`,
                  '--coin-end-y': `${flight.endY}px`,
                  '--coin-rotation': `${flight.rotation}deg`,
                  '--coin-end-rotation': `${flight.rotation * 1.7}deg`,
                  '--coin-duration': `${flight.duration}ms`,
                } as CSSProperties}
                onAnimationEnd={() => setCoinFlights((current) => current.filter((item) => item.id !== flight.id))}
              >
                <PixelCoin /><span>+{formatGold(flight.value)}</span>
              </i>
            ))}

            <div className="action-dock">
              <button
                className={`dock-button dock-button--upgrades ${panel === 'upgrades' ? 'is-active' : ''} ${upgradeButtonPulsing ? 'is-notifying' : ''}`}
                onClick={() => openPanel('upgrades')}
              >
                <SlidersHorizontal size={22} /><span>Upgrades</span>
                {upgradeNoticeCount > 0 && <b className="dock-button__badge" aria-label={`${upgradeNoticeCount} kaufbare Upgrades`}>{upgradeNoticeCount}</b>}
              </button>
              <button
                ref={goldButtonRef}
                className="gold-button"
                disabled={businessPaused || chestFull}
                onClick={handleTap}
                aria-label={`Gold schürfen: ${formatGold(tapValue(state))}`}
              >
                <span className="gold-button__icon"><PixelSprite family="pickaxe" level={state.tapLevel} /></span>
                <strong>{chestFull ? 'Beutel voll' : businessPaused ? 'Auf Reisen' : `+${formatGold(tapValue(state))}`}</strong>
                {businessPaused && (
                  <span
                    className="gold-button__progress"
                    role="progressbar"
                    aria-label="Eigene Reise"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(manualTransportProgress)}
                  >
                    <i style={{ width: `${manualTransportProgress}%` }} />
                  </span>
                )}
              </button>
              <button className={`dock-button ${panel === 'stats' ? 'is-active' : ''}`} onClick={() => openPanel('stats')}>
                <ChartNoAxesCombined size={22} /><span>Statistik</span>
              </button>
            </div>
          </div>
        </section>

        <aside className={`management-sheet ${panel ? 'is-open' : ''}`} aria-label="Reich ausbauen">
          <button className="sheet-close" onClick={() => setPanel(null)} aria-label="Ausbau schließen">×</button>
          <div className="sheet-tabs">
            <button className={(panel ?? 'upgrades') === 'upgrades' ? 'is-active' : ''} onClick={() => setPanel('upgrades')}>Upgrades</button>
            <button className={panel === 'stats' ? 'is-active' : ''} onClick={() => setPanel('stats')}>Statistik</button>
          </div>

          {(panel ?? 'upgrades') === 'upgrades' ? (
            <div className="sheet-content">
              <div className="sheet-heading"><span>SCHMIEDE &amp; HANDEL</span><h2>Reich ausbauen</h2><p>Bezahlt wird mit sicherem Gold aus der Schatztruhe.</p></div>
              <div className="filter-row" aria-label="Upgrade-Kategorien">
                {FILTERS.map((item) => (
                  <button key={item.id} className={filter === item.id ? 'is-active' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>
                ))}
              </div>
              <div className="upgrade-list">
                {visibleUpgrades.map((upgrade) => <UpgradeCard key={upgrade.id} upgrade={upgrade} state={state} onBuy={handleBuy} />)}
              </div>
            </div>
          ) : (
            <div className="sheet-content log-panel">
              <div className="sheet-heading"><span>CHRONIK</span><h2>Deine Legende</h2></div>
              <dl className="ledger">
                <div><dt>Gold geschürft</dt><dd>{formatGold(state.lifetimeGold)}</dd></div>
                <div><dt>Reisen</dt><dd>{state.tripCount}</dd></div>
                <div><dt>Diebeszüge</dt><dd>{state.theftCount}</dd></div>
                <div><dt>Gestohlen</dt><dd>{formatGold(state.stolenGold)}</dd></div>
                <div><dt>Nicht eingelagert</dt><dd>{formatGold(state.lostGold)}</dd></div>
              </dl>
              <button className="reset-button" onClick={confirmReset}><RotateCcw size={15} /> Spielstand löschen</button>
            </div>
          )}
        </aside>
      </main>

      {panel && <button className="sheet-backdrop" aria-label="Ausbau schließen" onClick={() => setPanel(null)} />}

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
    </div>
  )
}

export default App
