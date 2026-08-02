import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowDown,
  Bike,
  BriefcaseBusiness,
  Car,
  Check,
  ChevronRight,
  Clock3,
  Coins,
  Footprints,
  LockKeyhole,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  SECURITY,
  TRANSPORTS,
  cargoCapacity,
  chestCapacity,
  convoySize,
  getUpgrades,
  passiveRate,
  tapValue,
  transportDuration,
  transportName,
  vaultCapacity,
} from './game/config'
import { advanceGame, buyUpgrade, dismissOfflineReport, startTransport, tap } from './game/engine'
import { formatDuration, formatGold } from './game/format'
import { loadGame, resetGame, saveGame } from './game/storage'
import type { GameState, UpgradeId, UpgradeView } from './game/types'

type Panel = 'upgrades' | 'log'

function percentage(value: number, capacity: number) {
  return Math.max(0, Math.min(100, (value / capacity) * 100))
}

function playTone(kind: 'coin' | 'trip' | 'upgrade', enabled: boolean) {
  if (!enabled) return
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = kind === 'trip' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(kind === 'coin' ? 620 : kind === 'upgrade' ? 440 : 220, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'coin' ? 880 : kind === 'upgrade' ? 660 : 330, context.currentTime + 0.08)
    gain.gain.setValueAtTime(0.045, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.12)
    oscillator.addEventListener('ended', () => void context.close())
  } catch {
    // Audio is progressive enhancement and can be blocked by the browser.
  }
}

function haptic(duration = 10) {
  navigator.vibrate?.(duration)
}

function Meter({ value, tone = 'gold' }: { value: number; tone?: 'gold' | 'danger' | 'safe' }) {
  return (
    <div className={`meter meter--${tone}`} aria-hidden="true">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function UpgradeCard({ upgrade, state, onBuy }: { upgrade: UpgradeView; state: GameState; onBuy: (id: UpgradeId) => void }) {
  const affordable = state.vaultGold >= upgrade.cost
  const disabled = !upgrade.available || !affordable || upgrade.maxed
  return (
    <article className={`upgrade-card upgrade-card--${upgrade.accent} ${!upgrade.available ? 'is-locked' : ''}`}>
      <div className="upgrade-card__head">
        <span className="eyebrow">{upgrade.level}</span>
        {upgrade.maxed && <span className="maxed"><Check size={12} /> Aktiv</span>}
      </div>
      <h3>{upgrade.name}</h3>
      <p>{upgrade.description}</p>
      {!upgrade.available && !upgrade.maxed ? (
        <div className="unlock-note"><LockKeyhole size={14} /> Erst den Boten einstellen</div>
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
  const [panel, setPanel] = useState<Panel>('upgrades')
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
  const now = Date.now()
  const isTravelling = state.transportEndsAt !== null
  const tripProgress = isTravelling && state.transportStartedAt
    ? percentage(now - state.transportStartedAt, state.transportEndsAt! - state.transportStartedAt)
    : 0
  const secondsLeft = isTravelling ? Math.max(0, (state.transportEndsAt! - now) / 1000) : transportDuration(state)
  const businessPaused = isTravelling && !state.courierUnlocked
  const chestMax = chestCapacity(state)
  const vaultMax = vaultCapacity(state)
  const currentTransport = TRANSPORTS[state.transportLevel]
  const VehicleIcon = currentTransport.icon === 'bike' ? Bike : currentTransport.icon === 'car' ? Car : Footprints

  const handleTap = () => {
    if (businessPaused) return
    setState((current) => tap(current))
    setTapPulse((value) => value + 1)
    playTone('coin', sound)
    haptic(8)
  }

  const handleTransport = () => {
    const before = state.transportEndsAt
    setState((current) => startTransport(current, Date.now()))
    if (before === null && state.chestGold > 0 && state.vaultGold < vaultMax) {
      playTone('trip', sound)
      haptic(18)
    }
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

  const confirmReset = () => {
    if (window.confirm('Den lokalen Spielstand wirklich löschen?')) setState(resetGame())
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark"><LockKeyhole size={19} /></div>
          <div><span className="eyebrow">Gold & Logistik</span><strong>Vault Run</strong></div>
        </div>
        <div className="wealth">
          <span>Gesichertes Vermögen</span>
          <strong><Coins size={18} /> {formatGold(state.vaultGold)}</strong>
        </div>
        <button className="icon-button" onClick={toggleSound} aria-label={sound ? 'Ton ausschalten' : 'Ton einschalten'}>
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </header>

      <main className="workspace">
        <section className="game-column" aria-label="Deine Goldlogistik">
          <div className="run-status">
            <div><span className="status-dot" /> Standort in Betrieb</div>
            <span>{formatGold(passiveRate(state))} Gold/s passiv</span>
          </div>

          <div className="facility">
            <article className={`station station--business ${businessPaused ? 'is-paused' : ''}`}>
              <div className="station__header">
                <div className="station-icon"><BriefcaseBusiness size={22} /></div>
                <div><span className="eyebrow">01 · Geschäft</span><h2>Gold verdienen</h2></div>
                <span className="stat-pill">+{formatGold(tapValue(state))}</span>
              </div>
              <p className="station-copy">Schließe lukrative Geschäfte ab. Das Gold landet zunächst ungesichert in deiner Truhe.</p>
              <button className={`deal-button ${businessPaused ? 'is-paused' : ''}`} onClick={handleTap} disabled={businessPaused}>
                <span className="deal-button__shine" />
                <span className="deal-button__icon"><BriefcaseBusiness size={25} /></span>
                <span><strong>{businessPaused ? 'Du bist unterwegs' : 'Geschäft abschließen'}</strong><small>{businessPaused ? `Zurück in ${Math.ceil(secondsLeft)} Sek.` : `+${formatGold(tapValue(state))} Gold`}</small></span>
                <Sparkles size={18} />
                <i key={tapPulse} className="coin-pop">+{formatGold(tapValue(state))}</i>
              </button>
              <div className="micro-stats"><span><Users size={14} /> {state.staffLevel || 'Kein'} Team</span><span>{formatGold(passiveRate(state))}/s</span></div>
            </article>

            <div className="chain-arrow"><ArrowDown size={18} /><span>ungesichert</span></div>

            <article className="station station--chest">
              <div className="station__header">
                <div className="station-icon"><PackageOpen size={22} /></div>
                <div><span className="eyebrow">02 · Zwischenlager</span><h2>Geschäftstruhe</h2></div>
                <strong className="station-value">{formatGold(state.chestGold)}</strong>
              </div>
              <div className="chest-visual">
                <div className="chest-lid" />
                <div className="chest-body"><span style={{ height: `${percentage(state.chestGold, chestMax)}%` }} /></div>
                <Coins className="chest-emblem" size={24} />
              </div>
              <div className="capacity-line"><span>Füllstand</span><span>{formatGold(state.chestGold)} / {formatGold(chestMax)}</span></div>
              <Meter value={percentage(state.chestGold, chestMax)} />
              <div className="risk-block">
                <div className="capacity-line"><span><ShieldCheck size={14} /> Aufmerksamkeit</span><strong>{Math.floor(state.threat)} %</strong></div>
                <Meter value={state.threat} tone="danger" />
                <small>Viel ungesichertes Gold zieht Einbrecher an – auch offline.</small>
              </div>
            </article>

            <div className="chain-arrow"><ArrowDown size={18} /><span>{state.courierUnlocked ? 'automatisch' : 'selbst transportieren'}</span></div>

            <article className="station station--route">
              <div className="station__header">
                <div className="station-icon"><Truck size={22} /></div>
                <div><span className="eyebrow">03 · Transport</span><h2>{transportName(state)}</h2></div>
                <span className="stat-pill">{Math.floor(cargoCapacity(state))} Ladung</span>
              </div>
              <div className={`route ${isTravelling ? 'is-moving' : ''}`}>
                <div className="route__origin"><PackageOpen size={16} /></div>
                <div className="route__line"><span style={{ width: `${tripProgress}%` }} /></div>
                <div className="vehicle" style={{ '--trip-progress': `${tripProgress}%` } as CSSProperties}>
                  <VehicleIcon size={24} />
                  {convoySize(state) > 1 && <b>×{convoySize(state)}</b>}
                </div>
                <div className="route__target"><LockKeyhole size={16} /></div>
              </div>
              <div className="trip-readout">
                <span><Clock3 size={14} /> {isTravelling ? `Noch ${Math.ceil(secondsLeft)} Sek.` : `${transportDuration(state)} Sek. Fahrzeit`}</span>
                <strong>{isTravelling ? `${formatGold(state.inTransitGold)} unterwegs` : 'Bereit'}</strong>
              </div>
              <button className="transport-button" onClick={handleTransport} disabled={isTravelling || state.chestGold <= 0 || state.courierUnlocked || state.vaultGold >= vaultMax}>
                {state.courierUnlocked ? <><Check size={17} /> Bote fährt automatisch</> : isTravelling ? 'Transport läuft …' : <><ChevronRight size={17} /> Transport starten</>}
              </button>
            </article>

            <div className="chain-arrow chain-arrow--safe"><ArrowDown size={18} /><span>gesichert</span></div>

            <article className="station station--vault">
              <div className="station__header">
                <div className="station-icon"><LockKeyhole size={22} /></div>
                <div><span className="eyebrow">04 · Vermögen</span><h2>Dein Tresor</h2></div>
                <strong className="station-value">{formatGold(state.vaultGold)}</strong>
              </div>
              <div className="vault-visual">
                <div className="vault-door"><div className="vault-wheel"><span /><span /><span /><i /></div></div>
                <div className="vault-glow" style={{ opacity: Math.max(.08, percentage(state.vaultGold, vaultMax) / 100) }} />
              </div>
              <div className="capacity-line"><span>Kapazität</span><span>{formatGold(state.vaultGold)} / {formatGold(vaultMax)}</span></div>
              <Meter value={percentage(state.vaultGold, vaultMax)} tone="safe" />
              <div className="security-label"><ShieldCheck size={16} /><span>{SECURITY[state.securityLevel].name}</span><small>–{Math.round((1 - SECURITY[state.securityLevel].loss / SECURITY[0].loss) * 100)} % Verlust</small></div>
            </article>
          </div>
        </section>

        <aside className="management-panel">
          <div className="panel-tabs">
            <button className={panel === 'upgrades' ? 'is-active' : ''} onClick={() => setPanel('upgrades')}>Investitionen</button>
            <button className={panel === 'log' ? 'is-active' : ''} onClick={() => setPanel('log')}>Logbuch</button>
          </div>

          {panel === 'upgrades' ? (
            <div className="upgrade-list">
              <div className="panel-intro"><span className="eyebrow">Wachstum finanzieren</span><h2>Dein Betrieb</h2><p>Nur Gold im Tresor kann investiert werden.</p></div>
              {upgrades.map((upgrade) => <UpgradeCard key={upgrade.id} upgrade={upgrade} state={state} onBuy={handleBuy} />)}
            </div>
          ) : (
            <div className="log-panel">
              <div className="panel-intro"><span className="eyebrow">Betriebsdaten</span><h2>Logbuch</h2></div>
              <dl className="ledger">
                <div><dt>Gold insgesamt</dt><dd>{formatGold(state.lifetimeGold)}</dd></div>
                <div><dt>Erfolgreiche Fahrten</dt><dd>{state.tripCount}</dd></div>
                <div><dt>Einbrüche</dt><dd>{state.theftCount}</dd></div>
                <div><dt>Gestohlen</dt><dd>{formatGold(state.stolenGold)}</dd></div>
                <div><dt>Wegen Überfüllung verloren</dt><dd>{formatGold(state.lostGold)}</dd></div>
              </dl>
              <h3 className="event-title">Letzte Ereignisse</h3>
              <div className="event-list">
                {state.events.length ? state.events.map((event) => (
                  <div key={event.id} className={`event event--${event.kind}`}><span />{event.message}</div>
                )) : <p className="empty-log">Noch ist es ruhig. Zeit für das erste Geschäft.</p>}
              </div>
              <button className="reset-button" onClick={confirmReset}><RotateCcw size={15} /> Lokalen Spielstand löschen</button>
            </div>
          )}
        </aside>
      </main>

      {state.lastOfflineReport && (
        <div className="modal-backdrop" role="presentation">
          <section className="offline-modal" role="dialog" aria-modal="true" aria-labelledby="offline-title">
            <div className="offline-icon"><Clock3 size={28} /></div>
            <span className="eyebrow">Willkommen zurück</span>
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
