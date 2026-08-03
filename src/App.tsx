import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import {
  BarChart3,
  Check,
  Clock3,
  Download,
  RotateCcw,
  ShieldAlert,
  Settings,
  Vibrate,
  VibrateOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  GOLD_FLIGHT_DURATION_MS,
  SECTION_LABEL,
  MANUAL_SECURE_AMOUNT,
  RISK_ALERT,
  RISK_WARNING,
  SECTION_SLOT_GROUP,
  UPGRADE_FILTERS,
  UPGRADE_FILTER_LABEL,
  UPGRADE_FILTER_PREFIX,
  automaticTransportRate,
  chestCapacity,
  getAllUpgrades,
  getUpgradeGroups,
  hasAutomaticTransport,
  passiveRate,
  slotVisualLevel,
  tapValue,
  vaultCapacity,
} from './game/config'
import {
  advanceGame,
  buyEquipmentUpgrade,
  buySlotUpgrade,
  dismissOfflineReport,
  isSecuringManually,
  lowerThreat,
  startExpressTransport,
  startTransport,
  tap,
} from './game/engine'
import { formatDecimal, formatDuration, formatGold } from './game/format'
import { loadGame, resetGame, saveGame } from './game/storage'
import type { GameEvent, GameState, SectionId, SlotIndex, UpgradeFilter, UpgradeView } from './game/types'

interface UpgradePanelState {
  filter: UpgradeFilter
  focusKey?: string
  open: boolean
}

/** Das Sheet bleibt dauerhaft montiert, damit es beim ersten Öffnen einen Startzustand
    zum Herüberblenden hat und beim Schließen nach unten ausfahren kann. */
const CLOSED_PANEL: UpgradePanelState = { filter: 'all', open: false }

/** Fenster, über das die aktive Schürfrate gemittelt wird; danach ebbt sie von selbst ab. */
const TAP_RATE_WINDOW_MS = 3_000
/** Dasselbe für selbst ausgelöste Fuhren. Entspricht der Basis-Reisedauer, sodass lückenlos
    hintereinander gestartete Reisen die tatsächlich erreichbare Rate ergeben. */
const TRIP_RATE_WINDOW_MS = 12_000

/** Standzeit einer eingeblendeten Warnung; höchstens `MAX_ALERTS` liegen gleichzeitig an. */
const ALERT_LIFETIME_MS = 3_600
const MAX_ALERTS = 3

/** Abstand zwischen zwei übernommenen Spielzuständen. Entspricht dem bisherigen `setInterval`-Takt,
    damit sich Zahlen und Fortschrittsbalken unverändert flüssig bewegen. */
const TICK_INTERVAL_MS = 100
/** Erst ab dieser Abwesenheit gilt ein App-Wechsel als Offline-Strecke mit Rückkehr-Bericht. */
const OFFLINE_REPORT_THRESHOLD_MS = 60_000

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
  return formatDecimal(value)
}

/** Ein einziger, wiederverwendeter AudioContext. Vorher entstand pro Ton ein eigener und wurde
    sofort wieder geschlossen — das initialisiert jedes Mal den Audio-Graph und weckt die
    Audio-Hardware, bei einem Klickspiel also im Dauerbetrieb. Er wird erst beim ersten Ton
    angelegt, damit ohne Nutzergeste gar kein Kontext existiert. */
let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (sharedAudioContext) return sharedAudioContext
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  sharedAudioContext = new AudioContextClass()
  return sharedAudioContext
}

function playTone(kind: 'coin' | 'trip' | 'upgrade' | 'secure', enabled: boolean) {
  if (!enabled) return
  try {
    const context = getAudioContext()
    if (!context) return
    // iOS suspendiert den Kontext, sobald die App in den Hintergrund geht.
    if (context.state === 'suspended') void context.resume()
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
    // Der Kontext bleibt bestehen, die Knoten müssen aber abgehängt werden, sonst wächst der Graph.
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      gain.disconnect()
    })
  } catch {
    // Sound is progressive enhancement and can be blocked by the browser.
  }
}

/** Der Vibrationsmotor ist eine physische Wärmequelle im Gehäuse und ein spürbarer
    Akkuverbraucher — beim schnellen Schürfen läuft er praktisch durchgehend. Deshalb abschaltbar. */
function haptic(enabled: boolean, duration = 10) {
  if (!enabled) return
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

function UpgradeIcon({ className = 'dock-button__icon' }: { className?: string }) {
  return <img className={className} src={`${SPRITE_ROOT}/upgrade.png`} alt="" aria-hidden="true" draggable={false} />
}

function StatTile({ label, value, icon, tone }: { label?: string; value?: string; icon?: ReactNode; tone?: 'warning' | 'alert' }) {
  return (
    <div className={`stat-tile ${label ? '' : 'is-empty'} ${tone ? `is-${tone}` : ''}`} aria-hidden={!label || undefined}>
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

/** `memo` bringt hier nur etwas, weil die Karte **kein** `state` mehr bekommt: Der ganze
    Spielzustand ändert sich zehnmal pro Sekunde, die Bezahlbarkeit einer einzelnen Karte dagegen
    nur beim Überschreiten ihrer Kosten. Die `upgrade`-Objekte selbst sind stabil, solange sich
    keine Stufe ändert (siehe `upgradeLevelKey`). */
const UpgradeCard = memo(function UpgradeCard({ upgrade, affordable, focused, onBuy }: { upgrade: UpgradeView; affordable: boolean; focused?: boolean; onBuy: (upgrade: UpgradeView) => void }) {
  const disabled = !upgrade.available || !affordable || upgrade.maxed
  const unowned = Boolean(upgrade.slot) && upgrade.stage === 0
  // Only the focused card carries the ref, so it scrolls into view exactly once when the focus moves.
  const revealFocused = useCallback((node: HTMLElement | null) => node?.scrollIntoView({ block: 'center' }), [])
  return (
    <article ref={focused ? revealFocused : undefined} className={`upgrade-card upgrade-card--${upgrade.accent} ${focused ? 'is-focused' : ''} ${unowned ? 'is-unowned' : ''}`}>
      <div className="upgrade-card__head">
        <span className="upgrade-card__sprite"><PixelSprite family={upgrade.spriteFamily} level={upgrade.spriteLevel} /></span>
        <div className="upgrade-card__facts">
          {/* Stufenname statt Slot-Name; die Slot-Nummer bleibt als Kennung, weil vier Slots
              derselben Stufe sonst identisch heißen. */}
          <h3><span>{upgrade.name}</span>{upgrade.slot && <em>Slot {upgrade.slot.index + 1}</em>}</h3>
          <div className="upgrade-effects" aria-label="Upgrade-Effekt">
            <div><span>Stufe {upgrade.stage}</span><strong>{upgrade.currentEffect}</strong></div>
            <div><span>Stufe {upgrade.stage + 1}</span><strong>{upgrade.nextEffect}</strong></div>
          </div>
        </div>
        <button className="buy-button" disabled={disabled} onClick={() => onBuy(upgrade)} aria-label={`${upgrade.name}${upgrade.slot ? `, Slot ${upgrade.slot.index + 1}` : ''} für ${formatGold(upgrade.cost)} Gold auf Stufe ${upgrade.stage + 1} verbessern`}>
          {upgrade.maxed ? <><Check size={18} /><span>Erledigt</span></> : <><PixelCoin /><span>{formatGold(upgrade.cost)}</span></>}
        </button>
      </div>
      <p className="upgrade-card__description">{upgrade.description}</p>
    </article>
  )
})

function App() {
  const [state, setState] = useState<GameState>(() => loadGame())
  const [panel, setPanel] = useState<UpgradePanelState>(CLOSED_PANEL)
  const [dockPanel, setDockPanel] = useState<'settings' | 'stats' | null>(null)
  const [resetArmed, setResetArmed] = useState(false)
  const [sound, setSound] = useState(() => localStorage.getItem('vault-run-sound') !== 'off')
  const [haptics, setHaptics] = useState(() => localStorage.getItem('vault-run-haptics') !== 'off')
  const [goldFlights, setGoldFlights] = useState<GoldFlight[]>([])
  const [seenUpgradeLevels, setSeenUpgradeLevels] = useState(loadSeenUpgradeLevels)
  const [upgradeNoticePulsing, setUpgradeNoticePulsing] = useState(false)
  const [updateInstalling, setUpdateInstalling] = useState(false)
  const [alerts, setAlerts] = useState<GameEvent[]>([])
  /** Höchste bereits gesichtete Ereignis-ID; `null`, bis der geladene Spielstand quittiert ist. */
  const lastAlertId = useRef<number | null>(null)
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
  const sheetContentRef = useRef<HTMLDivElement>(null)
  const recentTaps = useRef<number[]>([])
  const recentTrips = useRef<{ at: number; amount: number }[]>([])
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
    // Der Takt läuft über `requestAnimationFrame` statt `setInterval`: Er pausiert von selbst,
    // sobald die App in den Hintergrund geht, und liegt auf der Frame-Grenze statt mitten im
    // Frame. Übernommen wird der Zustand weiterhin nur alle `TICK_INTERVAL_MS` — die Anzeige
    // bleibt damit exakt so flüssig wie vorher, die Schleife selbst kostet nur einen Vergleich.
    let lastCommit = 0
    const loop = (timestamp: number) => {
      frame = requestAnimationFrame(loop)
      if (timestamp - lastCommit < TICK_INTERVAL_MS) return
      lastCommit = timestamp
      setState((current) => advanceGame(current, Date.now()))
    }
    let frame = requestAnimationFrame(loop)

    const saver = window.setInterval(() => setState((current) => {
      saveGame(current)
      return current
    }), 2_000)

    // Ein kurzer App-Wechsel ist kein Offline-Aufenthalt. Da der Takt im Hintergrund jetzt ganz
    // ruht, würde sonst schon ein Blick in eine andere App den „Willkommen zurück“-Bericht
    // auslösen. Nachgerechnet wird trotzdem immer — nur eben stillschweigend.
    let hiddenSince: number | null = null
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenSince = Date.now()
        setState((current) => {
          saveGame(current)
          return current
        })
      } else {
        const away = hiddenSince === null ? 0 : Date.now() - hiddenSince
        hiddenSince = null
        setState((current) => advanceGame(current, Date.now(), away >= OFFLINE_REPORT_THRESHOLD_MS))
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(saver)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (state.tripCount > lastTrips.current) playTone('trip', sound)
    lastTrips.current = state.tripCount
  }, [state.tripCount, sound])

  // Upgrade-Views hängen ausschließlich an den Stufen — nicht am Gold, nicht am Risiko, nicht am
  // Transport. Der bisherige Memo-Key `[state]` änderte sich jeden Tick und griff deshalb nie;
  // die Views wurden zehnmal pro Sekunde neu gebaut. Über die Stufen als Schlüssel passiert das
  // nur noch bei einem tatsächlichen Kauf.
  const upgradeLevelKey = [
    state.tapLevel, state.chestLevel, state.vaultLevel,
    ...state.minerLevels, ...state.transporterLevels, ...state.guardLevels,
  ].join(':')

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `state` ist absichtlich nicht in den
  // Dependencies: Alles, was `getAllUpgrades` liest, steckt bereits in `upgradeLevelKey`.
  const allUpgrades = useMemo(() => getAllUpgrades(state), [upgradeLevelKey])
  const affordable = useMemo(
    () => allUpgrades.filter((upgrade) => upgrade.available && !upgrade.maxed && state.vaultGold >= upgrade.cost),
    [allUpgrades, state.vaultGold],
  )
  const affordableKeys = useMemo(() => affordable.map((upgrade) => `${upgrade.key}:${upgrade.cost}`), [affordable])
  const affordableSignature = affordableKeys.join('|')

  useEffect(() => {
    const current = new Set(affordableKeys)
    const hasNew = affordableKeys.some((key) => !previousAffordable.current.has(key) && !seenUpgradeLevels.has(key))
    previousAffordable.current = current
    if (!hasNew || panel.open) return
    setUpgradeNoticePulsing(true)
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current)
    pulseTimer.current = window.setTimeout(() => setUpgradeNoticePulsing(false), 950)
    return () => {
      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current)
    }
  }, [affordableSignature, panel.open, seenUpgradeLevels])

  const acknowledge = (filter: UpgradeFilter) => {
    setUpgradeNoticePulsing(false)
    // „Alle“ ist kein Blick auf eine bestimmte Kategorie — und da der Dock-Button diesen Filter
    // öffnet, würde ein Abhaken dort schlicht jeden Punkt löschen, bevor etwas angesehen wurde.
    if (filter === 'all') return
    const prefix = UPGRADE_FILTER_PREFIX[filter]
    const relevant = affordable.filter((upgrade) => upgrade.key.startsWith(prefix)).map((upgrade) => `${upgrade.key}:${upgrade.cost}`)
    if (relevant.length === 0) return
    setSeenUpgradeLevels((current) => {
      const next = new Set(current)
      relevant.forEach((key) => next.add(key))
      localStorage.setItem(UPGRADE_NOTICE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const openUpgrades = (filter: UpgradeFilter, focusKey?: string) => {
    acknowledge(filter)
    setDockPanel(null)
    setPanel({ filter, focusKey, open: true })
    // Das Sheet bleibt montiert und behielte sonst die Scrollposition des letzten Filters.
    if (!focusKey) sheetContentRef.current?.scrollTo({ top: 0 })
  }

  const closeUpgrades = () => setPanel((current) => ({ ...current, open: false }))

  const openSlotUpgrades = (section: SectionId, index: SlotIndex) => {
    const group = SECTION_SLOT_GROUP[section]
    openUpgrades(group, `slot:${group}:${index}`)
  }

  const openDockPanel = (kind: 'settings' | 'stats') => {
    closeUpgrades()
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

  // Nur Warnungen werden eingeblendet — ein Diebeszug und die volle Truhe verlangen eine Reaktion.
  // Lieferungen und Käufe zeigen ihre Wirkung ohnehin selbst und liefen als Dauerfeuer.
  // Beim ersten Lauf wird der geladene Spielstand nur quittiert, sonst begrüßte jeder Start den
  // Spieler mit den Meldungen der letzten Sitzung.
  useEffect(() => {
    const newest = state.events[0]?.id ?? 0
    const seen = lastAlertId.current
    lastAlertId.current = newest
    if (seen === null || newest <= seen) return

    const fresh = state.events.filter((event) => event.id > seen && event.kind === 'warning').reverse()
    if (fresh.length === 0) return
    setAlerts((current) => [...current, ...fresh].slice(-MAX_ALERTS))
    for (const event of fresh) {
      window.setTimeout(() => setAlerts((current) => current.filter((alert) => alert.id !== event.id)), ALERT_LIFETIME_MS)
    }
  }, [state.events])

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
  const securing = state.secureEndsAt !== null
  const securingBlocks = isSecuringManually(state)
  const secureProgress = securing
    ? percentage(now - (state.secureStartedAt ?? now), (state.secureEndsAt ?? now) - (state.secureStartedAt ?? now))
    : 0
  const chestRevealed = state.tripCount > 0
    || state.vaultGold > 0
    || (state.transportEndsAt !== null && state.inTransitGold === 0)
    || (state.expressEndsAt !== null && state.expressGold === 0)

  // Steigende Anzeige: 0 % ist ruhig, 100 % ist der Diebeszug. Ab `RISK_WARNING` färbt sich die
  // Kachel, ab `RISK_ALERT` pulsiert zusätzlich die Sicherung — die Vorwarnung vor dem Schlag.
  const risk = Math.min(100, state.threat)
  const riskTone = risk >= RISK_ALERT ? 'alert' : risk >= RISK_WARNING ? 'warning' : undefined
  const riskAlarming = chestRevealed && risk >= RISK_ALERT && !securing

  // Gesamtförderung: passive Bergleute plus die über ein gleitendes Fenster gemittelten Klicks.
  // Die Kachel zeigt, was tatsächlich ankommt: Ohne Fuhrknecht ruht die Mine während einer
  // manuellen Reise, und bei vollem Beutel verfällt jedes weitere Korn — beides ergibt 0.
  const miningPaused = (mainTravelling && !automatic) || bagFull || securingBlocks
  const tapsPerSecond = recentTaps.current.filter((at) => now - at < TAP_RATE_WINDOW_MS).length / (TAP_RATE_WINDOW_MS / 1_000)
  const miningRate = miningPaused ? 0 : passiveRate(state) + tapsPerSecond * tapValue(state)

  // Transportrate nach demselben Muster: automatischer Dauerdurchsatz plus die selbst
  // ausgelösten Fuhren im Zeitfenster. Ohne Automatik und ohne Klicks steht sie auf 0.
  const manualTripGold = recentTrips.current
    .filter((trip) => now - trip.at < TRIP_RATE_WINDOW_MS)
    .reduce((total, trip) => total + trip.amount, 0)
  const vaultFull = state.vaultGold + reservedGold >= treasureMax - 0.001
  const transportRate = vaultFull ? 0 : automaticTransportRate(state) + manualTripGold / (TRIP_RATE_WINDOW_MS / 1_000)

  const affordableIn = (filter: UpgradeFilter) => affordable.filter((upgrade) => upgrade.key.startsWith(UPGRADE_FILTER_PREFIX[filter]))
  const unseenFor = (filter: UpgradeFilter) => affordableIn(filter).filter((upgrade) => !seenUpgradeLevels.has(`${upgrade.key}:${upgrade.cost}`))

  const handleTap = () => {
    if (playerTravelling || bagFull) return
    recentTaps.current = [...recentTaps.current.filter((at) => now - at < TAP_RATE_WINDOW_MS), now]
    const earned = Math.min(tapValue(state), Math.max(0, bagMax - state.chestGold))
    setState((current) => tap(current))
    launchGold(earned, 'coin')
    playTone('coin', sound)
    haptic(haptics, 8)
  }

  const handleTransport = () => {
    if (!canTransport) return
    const next = automatic ? startExpressTransport(state, Date.now()) : startTransport(state, Date.now())
    const payload = automatic ? next.expressGold : next.inTransitGold
    if (payload <= 0) return
    recentTrips.current = [...recentTrips.current.filter((trip) => now - trip.at < TRIP_RATE_WINDOW_MS), { at: now, amount: payload }]
    setState(next)
    playTone('trip', sound)
    haptic(haptics, 18)
  }

  const handleSecure = () => {
    if (state.threat <= 0 || securing) return
    setState((current) => lowerThreat(current, Date.now()))
    playTone('secure', sound)
    haptic(haptics, 10)
  }

  // Stabil halten, sonst rendert `memo(UpgradeCard)` trotzdem bei jedem Tick neu.
  const handleBuy = useCallback((upgrade: UpgradeView) => {
    setState((current) => upgrade.equipmentId
      ? buyEquipmentUpgrade(current, upgrade.equipmentId)
      : upgrade.slot ? buySlotUpgrade(current, upgrade.slot.group, upgrade.slot.index) : current)
    playTone('upgrade', sound)
    haptic(haptics, 14)
  }, [sound, haptics])

  const toggleSound = () => {
    setSound((enabled) => {
      localStorage.setItem('vault-run-sound', enabled ? 'off' : 'on')
      return !enabled
    })
  }

  const toggleHaptics = () => {
    setHaptics((enabled) => {
      localStorage.setItem('vault-run-haptics', enabled ? 'off' : 'on')
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
    setPanel(CLOSED_PANEL)
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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- wie oben: `upgradeLevelKey` deckt alles ab.
  const upgradeGroups = useMemo(() => getUpgradeGroups(state, panel.filter), [upgradeLevelKey, panel.filter])
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
              <div className="stats-grid stats-grid--single" aria-label="Truhenwerte">
                <StatTile label="Risiko" value={`${Math.round(risk)}%`} icon={<ShieldAlert aria-hidden="true" />} tone={riskTone} />
              </div>
              <div className="section-center">
                <button
                  ref={chestButtonRef}
                  className={`section-action section-action--chest ${chestRevealed ? 'is-revealed' : 'is-unrevealed'} ${securing ? 'is-progressing' : ''} ${riskAlarming ? 'is-alarming' : ''}`}
                  disabled={!chestRevealed || state.threat <= 0 || securing}
                  onClick={handleSecure}
                  aria-label={!chestRevealed ? 'Schatztruhe noch nicht erreicht' : securing ? `Wird gesichert: ${Math.round(secureProgress)} Prozent` : `Risiko um ${MANUAL_SECURE_AMOUNT} senken, aktuell ${Math.round(risk)} Prozent`}
                >
                  {securing && <i className="section-action__progress" style={{ height: `${secureProgress}%` }} aria-hidden="true" />}
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
              <div className="stats-grid stats-grid--single" aria-label="Beutelwerte">
                <StatTile label="Gold / Sek." value={formatGold(Math.round(transportRate))} />
              </div>
              <div className="section-center">
                <button ref={bagButtonRef} className={`section-action ${playerTravelling ? 'is-progressing' : ''} ${bagFull && canTransport && !securingBlocks ? 'is-full' : ''}`} disabled={!canTransport || securingBlocks} onClick={handleTransport} aria-label={playerTravelling ? `Manueller Transport: ${Math.round(playerTransportProgress)} Prozent` : 'Gold zur Schatztruhe transportieren'}>
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
              <div className="stats-grid stats-grid--single" aria-label="Minenwerte">
                <StatTile label="Gold / Sek." value={formatGold(Math.round(miningRate))} />
              </div>
              <div className="section-center">
                <button ref={mineButtonRef} className={`section-action ${playerTravelling ? 'is-progressing' : ''}`} disabled={playerTravelling || bagFull || securingBlocks} onClick={handleTap} aria-label={playerTravelling ? `Manueller Transport: ${Math.round(playerTransportProgress)} Prozent` : `Gold schürfen: ${formatGold(tapValue(state))}`}>
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

        <div className="alert-stack" role="status" aria-live="polite">
          {alerts.map((alert) => (
            <p key={alert.id} className="alert">{alert.message}</p>
          ))}
        </div>
      </main>

      <nav className="dock" aria-label="Hauptmenü">
        <div className="dock__inner">
          <button className={`dock-button ${dockPanel === 'stats' ? 'is-active' : ''}`} onClick={() => openDockPanel('stats')} aria-expanded={dockPanel === 'stats'} aria-label="Statistik öffnen">
            <BarChart3 size={22} aria-hidden="true" /><span>Statistik</span>
          </button>
          <button
            className={`dock-button ${panel.open ? 'is-active' : ''} ${upgradeNoticePulsing && dockNoticeCount > 0 ? 'is-notifying' : ''}`}
            onClick={() => (panel.open ? closeUpgrades() : openUpgrades('all'))}
            aria-expanded={panel.open}
            aria-label={dockNoticeCount > 0 ? `Ausbau öffnen, ${dockNoticeCount} kaufbare Upgrades` : 'Ausbau öffnen'}
          >
            <UpgradeIcon /><span>Ausbau</span>
            {dockNoticeCount > 0 && <em className="dock-button__badge">{dockNoticeCount}</em>}
          </button>
          <button className={`dock-button ${dockPanel === 'settings' ? 'is-active' : ''}`} onClick={() => openDockPanel('settings')} aria-expanded={dockPanel === 'settings'} aria-label="Einstellungen öffnen">
            <Settings size={22} aria-hidden="true" /><span>Einstellungen</span>
          </button>
        </div>
      </nav>

      <button className={`sheet-backdrop ${panel.open ? 'is-open' : ''}`} aria-label="Upgrades schließen" onClick={closeUpgrades} />
      <aside className={`management-sheet ${panel.open ? 'is-open' : ''}`} aria-labelledby="upgrade-sheet-title">
        <header className="sheet-header">
          <div className="sheet-header__top">
            <h2 id="upgrade-sheet-title"><UpgradeIcon className="sheet-header__icon" />Upgrades</h2>
            <button className="sheet-close" onClick={closeUpgrades} aria-label="Upgrades schließen">×</button>
          </div>
          <div className="sheet-filters" role="tablist" aria-label="Upgrade-Typ filtern">
            {UPGRADE_FILTERS.map((filter) => {
              // Der Punkt meldet nur noch ungesehene Angebote; „Alle“ bekommt gar keinen.
              const pending = filter === 'all' ? 0 : unseenFor(filter).length
              return (
                <button
                  key={filter}
                  role="tab"
                  aria-selected={panel.filter === filter}
                  aria-label={pending > 0 ? `${UPGRADE_FILTER_LABEL[filter]}, ${pending} neu bezahlbar` : UPGRADE_FILTER_LABEL[filter]}
                  className={panel.filter === filter ? 'is-active' : ''}
                  onClick={() => openUpgrades(filter)}
                >
                  {UPGRADE_FILTER_LABEL[filter]}
                  {pending > 0 && <b aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </header>
        <div className="sheet-content" ref={sheetContentRef}>
          {upgradeGroups.map((group) => (
            <section key={group.category} className="upgrade-group">
              {upgradeGroups.length > 1 && <h3 className="upgrade-group__title">{group.label}</h3>}
              <div className="upgrade-list">
                {group.upgrades.map((upgrade) => <UpgradeCard key={upgrade.key} upgrade={upgrade} affordable={state.vaultGold >= upgrade.cost} focused={panel.focusKey === upgrade.key} onBuy={handleBuy} />)}
              </div>
            </section>
          ))}
        </div>
      </aside>

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
                <button className="settings-toggle" onClick={toggleHaptics} aria-pressed={haptics}>
                  {haptics ? <Vibrate size={22} /> : <VibrateOff size={22} />}
                  <span><strong>Vibration</strong><small>{haptics ? 'Ein' : 'Aus'}</small></span>
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
