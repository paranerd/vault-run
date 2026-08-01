# Design-Doc: Goldspeicher-Idle-Game

**Zweck dieses Dokuments:** Vollständige Spezifikation für einen spielbaren Prototypen.
**Zielplattform:** Browser (TypeScript / Vite), später mobil via Capacitor.
**Status:** Kernmechanik und Balancing sind durchgerechnet und simulativ validiert. Prestige und Meta-Progression sind offen.

---

## 1. Kernidee

Ein Klick produziert Goldmünzen. Diese müssen durch eine **Logistikkette** transportiert werden, bevor sie als Vermögen zählen. Jedes Glied der Kette kann zum Engpass werden — der Reiz des Spiels besteht darin, permanent den aktuell schwächsten Engpass zu identifizieren und auszubauen.

Das Spiel ist bewusst **kein** reiner Zahlen-Zuwachs. Der Kern ist ein Durchsatzproblem mit drei konkurrierenden Achsen.

### Währung

**Fiktive Goldmünzen**, keine reale Währung.

Begründung: Reale Währung wird bei Beträgen jenseits von 10^15 unfreiwillig komisch und wirft Fragen auf (Inflation, Kaufkraft), die das Spiel nicht beantworten will. Goldmünzen sind abstrakt genug, um beliebig zu skalieren.

**1 Klick = 1 Münze** als Startwert. Bewusst nicht 0,10 € o. ä. — krumme Startwerte machen alle Folgeformeln unnötig hässlich.

---

## 2. Die Kette

```
Klick/Produktion  →  TRUHE  →  FAHRER  →  TRESOR
   (Münzen/s)      (Puffer)   (Fuhren)   (Vermögen)
```

| Glied | Rolle | Ausbaubar durch |
|---|---|---|
| **Produktion** | Münzen/s aus Klicks + Autoklick | Münzen pro Klick, Autoklicker |
| **Truhe** | Puffer, den der Fahrer abholt | Truhen-Kapazität |
| **Fahrer** | Transport in diskreten Fuhren | Ladung/Fuhre, Anzahl Fahrer |
| **Tresor** | Endlager, zählt als Vermögen | Tresor-Kapazität, Sicherheit |

### KRITISCH: Der Fahrer fährt in diskreten Fuhren

Dies ist die wichtigste Designentscheidung des Dokuments und darf beim Prototyping **nicht** vereinfacht werden.

Wenn der Fahrer als kontinuierlicher Fluss modelliert wird, ist die Truhe im Dauerbetrieb **vollständig wirkungslos** — ein Puffer zwischen zwei konstanten Raten limitiert nichts, es gilt schlicht `min(Produktion, Fahrer)`. Die Truhe wäre dann totes UI.

Erst durch diskrete Fuhren bekommt sie eine Rolle: Alle `TICK` Sekunden fährt der Fahrer los und nimmt `Ladung` Münzen mit. Zwischen zwei Fuhren muss die Truhe die gesamte Produktion aufnehmen können, sonst geht der Überschuss verloren.

---

## 3. Kernformel

Der effektive Durchsatz zum Tresor ist das schwächste Glied:

```
Rate = min(
  Produktion,                          // Münzen/s
  Fahrer × Ladung / TICK,              // Transportkapazität
  Truhe / TICK                         // Pufferkapazität
)
```

Drei Terme → es bindet immer genau einer. Der Spieler sieht idealerweise im UI, **welcher** gerade bindet.

Der **Tresor steht bewusst außerhalb** dieses `min()`. Er deckelt nicht die Rate, sondern das **Vermögen**. Läuft er voll, steht die gesamte Kette — das ist ein anders gelagerter Druck als die drei Durchsatz-Engpässe und braucht eigenes UI-Feedback.

---

## 4. Formeln und Konstanten

```ts
const TICK = 30;                          // Fuhrintervall in Sekunden

// Effekt-Kurven (n = Anzahl gekaufter Upgrades dieser Achse)
const prod   = (n: number) => 1    * 1.30 ** n;   // Münzen/s
const truhe  = (n: number) => 50   * 1.30 ** n;   // Kapazität in Münzen
const ladung = (n: number) => 20   * 1.30 ** n;   // Münzen pro Fuhre
const tresor = (n: number) => 5000 * 1.40 ** n;   // Vermögensdeckel

// Kosten-Kurven
const kosten = {
  klick:  (n: number) => 12  * 1.36 ** n,
  truhe:  (n: number) => 40  * 1.36 ** n,
  ladung: (n: number) => 90  * 1.36 ** n,
  fahrer: (n: number) => 600 * 1.90 ** n,   // Sprung-Upgrade: verdoppelt Durchsatz
  tresor: (n: number) => 300 * 1.35 ** n,
};
```

### Warum diese Zahlen

**Symmetrieregel (nicht verhandelbar):** Damit der Engpass dauerhaft rotiert, muss `ln(Kostenfaktor) / ln(Effektfaktor)` auf allen drei Durchsatz-Achsen gleich sein.

Ein Gegentest mit additivem Klick-Upgrade (`+1 Münze/Klick`) und flacherer Kostenkurve ergab eine Engpass-Verteilung von **90 / 16 / 14** — Produktion dominierte, das Spiel degenerierte zu „immer Klick kaufen". Additive Effekte werden relativ immer schwächer (Zuwachs `1/n`), was die Kostenkurve ausgleichen müsste.

Mit symmetrischen multiplikativen Kurven: **69 / 68 / 63** über 200 Käufe. Die Kaufreihenfolge rotiert sauber (`LA KL TR LA KL TR …`).

**Kostenfaktor muss größer als Effektfaktor sein.** Bei `g = e` beschleunigt sich das Spiel unbegrenzt: Der Testlauf erreichte nach 1,2 h bereits 1,4 Mio Münzen/s ohne jede Verlangsamung. Der gewählte Spread (1.36 vs. 1.30) bremst sanft.

**Unterschiedliche Basiskosten (12 / 40 / 90) sind Absicht.** Sie erzeugen die interessante Frühphase: In den ersten 20 Minuten wechselte der Engpass sechsmal, weil die Achsen unterschiedlich teuer starten, aber gleich schnell wachsen.

**Der Extra-Fahrer (Faktor 1.90) ist bewusst ein seltenes Sprung-Upgrade.** Er verdoppelt den Durchsatz auf einen Schlag, überholt kurzzeitig alles und macht danach sofort Ladung oder Truhe zum Engpass. Setzt Akzente in einer sonst gleichmäßigen Kurve.

### Referenz-Zielwerte aus der Simulation

Greedy-Agent (kauft immer das effizienteste Upgrade), Parameter wie oben:

| Käufe | Zeit | Rate |
|---|---|---|
| 25 | 28 min | 10 Münzen/s |
| 50 | 44 min | 62 Münzen/s |
| 100 | 1,3 h | 1.550 Münzen/s |
| 150 | 2,1 h | 38.374 Münzen/s |
| 200 | 3,3 h | 846.434 Münzen/s |

Das ist eine gute Länge für die erste Prestige-Runde. Wenn der Prototyp deutlich davon abweicht, stimmt etwas mit der Implementierung nicht.

---

## 5. Phasen-Gating

Das Spiel öffnet seine Systeme gestaffelt, statt alles sofort zu zeigen:

1. **Start:** Nur Klicken und Truhe. Truhe füllt sich, Spieler baut Kapazität aus.
2. **Trigger:** Truhen-Kapazität wird zu teuer (empirisch: ab ca. Upgrade-Stufe 8–10 spürbar).
3. **Freischaltung Tresor:** Jetzt wird sichtbar, dass die Truhe nur Puffer ist. Das Vermögen zieht in den Tresor um.
4. **Freischaltung Fahrer:** Sofort mit dem Tresor, sonst kommt kein Gold an.
5. **Freischaltung Sicherheit:** Sobald ein Schwellenvermögen erreicht ist (Vorschlag: 10.000 Münzen im Tresor).

Neue Systeme sind stärkere Motivatoren als größere Zahlen. Freischaltungen an Meilensteine binden, nicht an Zeit.

---

## 6. Diebstahl und Sicherheit

### Grundregel: Diebe plündern NUR die Truhe, niemals den Tresor

Dies ist eine harte Designregel. Begründung:

- Der klassische Frustmoment „8 Stunden weg, alles verloren" führt zur Deinstallation. Verlustaversion ist bei Idle Games ein sehr scharfes Werkzeug.
- Wenn nur die Truhe betroffen ist, wird der **Fahrer zur Sicherheitsmaßnahme**: Gold schnell wegbringen = geschützt. Das verzahnt die drei Systeme, statt ein viertes danebenzustellen.
- Der Tresor wird dadurch zum echten Safe Haven — thematisch stimmig und mechanisch entlastend.

### Mechanik

- Einbruchswahrscheinlichkeit steigt mit dem **Truheninhalt** (nicht mit dem Gesamtvermögen).
- Sicherheits-Upgrades senken die Wahrscheinlichkeit und/oder den prozentualen Verlust.
- Verlust immer als **Prozentsatz des Truheninhalts**, nie als absoluter Betrag.
- **Nachtfenster:** Zwischen 22:00 und 08:00 Uhr Ortszeit finden keine Einbrüche statt.

### Falls Tresor-Risiko später gewünscht

Nur als abwehrbares Event mit Vorwarnung, nie als stiller Prozentabzug. Für den Prototypen ausdrücklich **nicht** einbauen.

---

## 7. Datenmodell und Tick-Loop

```ts
interface GameState {
  // Upgrade-Stufen
  klickLvl: number;
  truheLvl: number;
  ladungLvl: number;
  fahrerCount: number;      // startet bei 1
  tresorLvl: number;
  sicherheitLvl: number;

  // Bestände
  truheInhalt: number;      // Münzen im Puffer
  tresorInhalt: number;     // Vermögen
  guthaben: number;         // ausgebbar

  // Timing
  letzteFuhre: number;      // Timestamp
  letzterTick: number;      // Timestamp für Offline-Berechnung
}
```

**Tick-Loop (Vorschlag: 10 Hz für UI, Logik zeitbasiert per Delta):**

1. Produktion auf `truheInhalt` addieren, gedeckelt auf `truhe(truheLvl)`. Überschuss verfällt (mit sichtbarem UI-Feedback — der Spieler muss merken, dass er verliert).
2. Wenn `now - letzteFuhre >= TICK`: Fuhre abwickeln. `min(truheInhalt, fahrerCount × ladung(ladungLvl))` von Truhe in Tresor verschieben, gedeckelt auf `tresor(tresorLvl)`.
3. Einbruchs-Roll (nur außerhalb des Nachtfensters, Wahrscheinlichkeit abhängig von `truheInhalt` und `sicherheitLvl`).

**Wichtig:** Der Tick-Loop muss zeitbasiert (`delta`) rechnen, nicht frame-basiert. Sonst driftet das Spiel je nach Framerate und Offline-Progress wird inkonsistent.

---
