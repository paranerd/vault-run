import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Bike,
  CarFront,
  Check,
  ChartNoAxesCombined,
  Clock3,
  Coins,
  Footprints,
  Landmark,
  LockKeyhole,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  SECURITY,
  TRANSPORTS,
  cargoCapacity,
  chestCapacity,
  convoySize,
  expressDuration,
  getUpgrades,
  passiveRate,
  tapValue,
  transportDuration,
  transportName,
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

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'production', label: 'Produktion' },
  { id: 'storage', label: 'Lagerung' },
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

function Meter({ value, tone = 'gold' }: { value: number; tone?: 'gold' | 'danger' | 'safe' }) {
  return <div className={`meter meter--${tone}`} aria-hidden="true"><span style={{ width: `${value}%` }} /></div>
}

function TransportGlyph({ kind, size = 24 }: { kind: string; size?: number }) {
  if (kind === 'footprints') return <Footprints size={size} />
  if (kind === 'bike') return <Bike size={size} />
  if (kind === 'car') return <CarFront size={size} />
  return <Truck size={size} />
}

function UpgradeCard({ upgrade, state, onBuy }: { upgrade: UpgradeView; state: GameState; onBuy: (id: UpgradeId) => void }) {
  const affordable = state.vaultGold >= upgrade.cost
  const disabled = !upgrade.available || !affordable || upgrade.maxed
  return (
    <article className={`upgrade-card upgrade-card--${upgrade.category} ${!upgrade.available ? 'is-locked' : ''}`}>
      <div className="upgrade-card__top">
        <span>{upgrade.level}</span>
        {upgrade.maxed && <b><Check size={13} /> Aktiv</b>}
      </div>
      <h3>{upgrade.name}</h3>
      <p>{upgrade.description}</p>
      {!upgrade.available && !upgrade.maxed ? (
        <span className="locked-note"><LockKeyhole size={13} /> Erst den Boten einstellen</span>
      ) : (
        <button className="buy-button" disabled={disabled} onClick={() => onBuy(upgrade.id)}>
          {upgrade.maxed ? 'Erledigt' : <><Coins size={15} /> {formatGold(upgrade.cost)}</>}
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
  const [tapPulse, setTapPulse] = useState(0)
  const lastTrips = useRef(state.tripCount)

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

  const upgrades = useMemo(() => getUpgrades(state), [state])
  const visibleUpgrades = filter === 'all' ? upgrades : upgrades.filter((upgrade) => upgrade.category === filter)
  const now = Date.now()
  const chestMax = chestCapacity(state)
  const vaultMax = vaultCapacity(state)
  const chestFull = state.chestGold >= chestMax - 0.001
  const isTravelling = state.transportEndsAt !== null
  const isExpressTravelling = state.expressEndsAt !== null
  const businessPaused = isTravelling && !state.courierUnlocked
  const tripPosition = roundTripPosition(state.transportStartedAt, state.transportEndsAt, now)
  const expressPosition = roundTripPosition(state.expressStartedAt, state.expressEndsAt, now)
  const secondsLeft = isTravelling ? Math.max(0, (state.transportEndsAt! - now) / 1000) : transportDuration(state)
  const currentTransport = TRANSPORTS[state.transportLevel]
  const mainAtVault = state.transportDeliveredAt !== null && now >= state.transportDeliveredAt
  const expressAtVault = state.expressDeliveredAt !== null && now >= state.expressDeliveredAt
  const vaultReserved = state.inTransitGold + state.expressGold
  const canStartTransport = !isTravelling && state.chestGold > 0 && state.vaultGold + vaultReserved < vaultMax
  const canStartExpress = state.courierUnlocked && !isExpressTravelling && state.chestGold > 0 && state.vaultGold + vaultReserved < vaultMax

  const handleTap = () => {
    if (businessPaused || chestFull) return
    setState((current) => tap(current))
    setTapPulse((value) => value + 1)
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

  const openPanel = (next: Panel) => setPanel((current) => current === next ? null : next)
  const confirmReset = () => {
    if (window.confirm('Den lokalen Spielstand wirklich löschen?')) setState(resetGame())
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-label="Vault Run"><Landmark size={22} /></div>
        <div className="header-wealth">
          <span>Vermögen im Tresor</span>
          <strong><Coins size={18} /> {formatGold(state.vaultGold)}</strong>
        </div>
        <div className="header-actions">
          <div className="live-status"><i /> {formatGold(passiveRate(state))}/s</div>
          <button className="sound-button" onClick={toggleSound} aria-label={sound ? 'Ton ausschalten' : 'Ton einschalten'}>
            {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </div>
      </header>

      <main className="app-layout">
        <section className="game-stage" aria-label="Deine Goldlogistik">
          <div className="scene-status">
            <span><i /> {businessPaused ? `Zurück in ${Math.ceil(secondsLeft)} Sek.` : 'Betriebsbereit'}</span>
          </div>

          <div className="game-scene">
            <div className="storage-row">
              <article className={`station chest-station ${chestFull ? 'is-full' : ''}`}>
                <div className="amount-display">
                  <span>Truhe</span>
                  <strong>{formatGold(state.chestGold)}</strong>
                  <small>von {formatGold(chestMax)}</small>
                </div>
                <div className="station-visual station-visual--chest" aria-hidden="true" style={{ '--fill': `${percentage(state.chestGold, chestMax)}%` } as CSSProperties}>
                  <PackageOpen size={49} strokeWidth={1.55} />
                </div>
                <Meter value={percentage(state.chestGold, chestMax)} />
                <div className="threat-line"><ShieldCheck size={13} /> Aufmerksamkeit <b>{Math.floor(state.threat)}%</b></div>
              </article>

              <div className="transport-lane" aria-label="Transportstrecke">
                <div className="lane-caption">
                  <span>{transportName(state)}</span>
                  <b>{Math.floor(cargoCapacity(state))} Ladung</b>
                </div>
                <div className="road">
                  <span className="road-dashes" />
                  <span className="direction direction--out">→</span>
                  <span className="direction direction--back">←</span>
                  {isTravelling && (
                    <div
                      className={`vehicle ${mainAtVault ? 'is-returning' : ''}`}
                      style={{ '--vehicle-position': `${tripPosition}%` } as CSSProperties}
                    >
                      <TransportGlyph kind={currentTransport.icon} size={20} />
                      {state.inTransitGold > 0 && <b>{formatGold(state.inTransitGold)}</b>}
                      {convoySize(state) > 1 && <em>×{convoySize(state)}</em>}
                    </div>
                  )}
                  {isExpressTravelling && (
                    <div
                      className={`vehicle vehicle--express ${expressAtVault ? 'is-returning' : ''}`}
                      style={{ '--vehicle-position': `${expressPosition}%` } as CSSProperties}
                    >
                      <Truck size={20} />
                      {state.expressGold > 0 && <b>{formatGold(state.expressGold)}</b>}
                    </div>
                  )}
                </div>
                <div className="trip-status">
                  <Clock3 size={13} />
                  {isTravelling
                    ? `${mainAtVault ? 'Rückweg' : 'Hinweg'} · ${Math.ceil(secondsLeft)} Sek.`
                    : state.courierUnlocked ? 'Bote wartet auf Gold' : `${transportDuration(state)} Sek. Rundfahrt`}
                </div>
              </div>

              <article className="station vault-station">
                <div className="station-heading">
                  <strong>Tresor</strong>
                  <span>Kapazität {formatGold(vaultMax)}</span>
                </div>
                <div className="station-visual station-visual--vault" aria-hidden="true">
                  <Landmark size={49} strokeWidth={1.55} />
                </div>
                <Meter value={percentage(state.vaultGold, vaultMax)} tone="safe" />
                <div className="security-line"><LockKeyhole size={13} /> {SECURITY[state.securityLevel].name}</div>
              </article>
            </div>

            {tapPulse > 0 && <i key={tapPulse} className="flying-coin">+{formatGold(tapValue(state))}</i>}

            <div className="action-dock">
              <button className="gold-button" disabled={businessPaused || chestFull} onClick={handleTap} aria-label={`Gold verdienen: ${formatGold(tapValue(state))}`}>
                <span className="gold-button__icon"><Coins size={31} /></span>
                <strong>{chestFull ? 'Truhe voll' : businessPaused ? 'Unterwegs' : `+${formatGold(tapValue(state))}`}</strong>
                <small>{chestFull ? 'Erst transportieren' : 'Gold verdienen'}</small>
              </button>

              <button
                className="transport-button"
                onClick={handleTransport}
                disabled={state.courierUnlocked ? !canStartExpress : !canStartTransport}
              >
                <span className="transport-icon" aria-hidden="true"><TransportGlyph kind={currentTransport.icon} size={23} /></span>
                <span>
                  <strong>{state.courierUnlocked ? (isExpressTravelling ? 'Express läuft' : 'Expressfahrt') : (isTravelling ? 'Du bist unterwegs' : 'Gold transportieren')}</strong>
                  <small>{state.courierUnlocked ? `${expressDuration(state).toLocaleString('de-DE')} Sek. Rundfahrt` : `${transportDuration(state)} Sek. hin & zurück`}</small>
                </span>
              </button>
            </div>
          </div>
        </section>

        <aside className={`management-sheet ${panel ? 'is-open' : ''}`} aria-label="Management">
          <button className="sheet-close" onClick={() => setPanel(null)} aria-label="Management schließen">×</button>
          <div className="sheet-tabs">
            <button className={(panel ?? 'upgrades') === 'upgrades' ? 'is-active' : ''} onClick={() => setPanel('upgrades')}>Upgrades</button>
            <button className={panel === 'stats' ? 'is-active' : ''} onClick={() => setPanel('stats')}>Statistik</button>
          </div>

          {(panel ?? 'upgrades') === 'upgrades' ? (
            <div className="sheet-content">
              <div className="sheet-heading"><span>INVESTIEREN</span><h2>Betrieb ausbauen</h2><p>Bezahlt wird mit Gold aus dem Tresor.</p></div>
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
              <div className="sheet-heading"><span>BETRIEBSDATEN</span><h2>Statistik</h2></div>
              <dl className="ledger">
                <div><dt>Gold insgesamt</dt><dd>{formatGold(state.lifetimeGold)}</dd></div>
                <div><dt>Fahrten</dt><dd>{state.tripCount}</dd></div>
                <div><dt>Einbrüche</dt><dd>{state.theftCount}</dd></div>
                <div><dt>Gestohlen</dt><dd>{formatGold(state.stolenGold)}</dd></div>
                <div><dt>Überfüllung</dt><dd>{formatGold(state.lostGold)}</dd></div>
              </dl>
              <button className="reset-button" onClick={confirmReset}><RotateCcw size={15} /> Spielstand löschen</button>
            </div>
          )}
        </aside>
      </main>

      <nav className="bottom-nav" aria-label="Spielmenü">
        <button className={panel === 'upgrades' ? 'is-active' : ''} onClick={() => openPanel('upgrades')}><SlidersHorizontal size={20} /><span>Upgrades</span></button>
        <button className={panel === 'stats' ? 'is-active' : ''} onClick={() => openPanel('stats')}><ChartNoAxesCombined size={20} /><span>Statistik</span></button>
      </nav>

      {panel && <button className="sheet-backdrop" aria-label="Management schließen" onClick={() => setPanel(null)} />}

      {state.lastOfflineReport && (
        <div className="modal-backdrop" role="presentation">
          <section className="offline-modal" role="dialog" aria-modal="true" aria-labelledby="offline-title">
            <div className="offline-icon"><Clock3 size={27} /></div>
            <span className="modal-kicker">WILLKOMMEN ZURÜCK</span>
            <h2 id="offline-title">Dein Betrieb war aktiv</h2>
            <p>{formatDuration(state.lastOfflineReport.seconds)} wurden nachberechnet.</p>
            <div className="offline-grid">
              <div><span>Verdient</span><strong>+{formatGold(state.lastOfflineReport.earned)}</strong></div>
              <div><span>Gesichert</span><strong>+{formatGold(state.lastOfflineReport.delivered)}</strong></div>
              <div className={state.lastOfflineReport.stolen ? 'has-loss' : ''}><span>Gestohlen</span><strong>–{formatGold(state.lastOfflineReport.stolen)}</strong></div>
            </div>
            <button onClick={() => setState((current) => dismissOfflineReport(current))}>Weiterarbeiten</button>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
