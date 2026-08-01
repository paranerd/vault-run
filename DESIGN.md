# Vault Run – Produkt- und Technik-Spezifikation

## Vision

Der Spieler ist ein Geschäftsmann, der Gold verdient und daraus Schritt für Schritt einen hochautomatisierten, gesicherten Logistikbetrieb aufbaut. Er ist kein Räuber. Der Name „Vault Run“ bezeichnet die regelmäßige Fahrt zum Tresor.

Die erste Version ist ein optisch polierter Vertical Slice für Browser und PWA. Smartphone-Hochformat ist die primäre Oberfläche; Desktop erhält eine eigene vollwertige Anordnung. Die Architektur soll eine spätere Capacitor-App ermöglichen. Sprache ist zunächst Deutsch, das bevorzugte Monetarisierungsmodell wäre ein Einmalkauf.

## Kernloop ab dem ersten Tap

```text
Geschäft → Geschäftstruhe → Transport → Tresor → Investition
```

Alle vier Stationen sind von Anfang an sichtbar. Nur Gold im Tresor ist ausgebbar.

Zu Beginn übernimmt der Spieler den Transport selbst. Während er unterwegs ist, kann er keine weiteren Geschäfte abschließen und auch seine Mitarbeiter pausieren. Die ersten Transport-Upgrades sind deshalb:

1. Bessere Schuhe
2. Fahrrad
3. Auto

Sie verkürzen die Fahrt und erhöhen die Ladung, beseitigen aber nicht den Zielkonflikt. Der erste große Automatisierungssprung ist ein Bote: Fahrten starten danach automatisch und das Geschäft produziert während des Transports weiter. Anschließend skalieren Ladekapazität und Anzahl der gemeinsam fahrenden Fahrzeuge als Konvoi.

## Aktiv und idle

- Ein Tap auf „Geschäft abschließen“ erzeugt sofort Gold in der Truhe.
- Upgrades erhöhen den Wert eines Abschlusses.
- Mitarbeiter erzeugen passives Gold.
- Taps bleiben dauerhaft lohnend, werden aber relativ zur automatisierten Produktion weniger wichtig.
- Der Spieler soll in kurzen aktiven Phasen investieren und optimieren können, danach aber sinnvoll idle fortschreiten.
- Ein Run soll mehrere Tage tragen. Prestige ist noch nicht Teil des Vertical Slice; das Savegame ist dafür versioniert vorbereitet.

## Kette und Engpässe

| Station | Funktion | Typische Upgrades |
|---|---|---|
| Geschäft | Aktive und passive Produktion | bessere Abschlüsse, Mitarbeiter |
| Truhe | Ungesicherter Puffer | Kapazität |
| Transport | Diskrete Lieferung | Schuhe, Fahrrad, Auto, Bote, Transporter, Konvoi |
| Tresor | Geschütztes und ausgebbares Vermögen | Kapazität, Sicherheit |

Transport bleibt immer diskret. Zu Fahrtbeginn wird eine feste Ladung aus der Truhe genommen und ist bis zur Ankunft als `inTransitGold` gebunden. Neue Produktion bleibt in der Truhe. Der Transport nimmt nie mehr mit, als noch in den Tresor passt.

## Diebstahl und Sicherheit

Diebstahl findet aktiv und offline statt, greift aber nur ungesichertes Gold in der Truhe an. Tresorgold und bereits transportierte Ladung sind sicher.

Statt einer unsichtbaren Zufallswahrscheinlichkeit nutzt das Spiel eine sichtbare Aufmerksamkeitsanzeige:

- Sie steigt, solange Gold in der Truhe liegt.
- Eine vollere Truhe erhöht sie schneller.
- Bei 100 % wird ein prozentualer Anteil des Truheninhalts gestohlen.
- Danach fällt die Anzeige auf einen kleinen Restwert zurück.
- Sicherheitsstufen verlangsamen den Anstieg und senken den Verlust.

Sicherheitsstufen: Einfaches Schloss, Wachhund, Kameras, Wachdienst und Sicherheitszentrale. Sie werden im Tresorbereich ausgebaut und sind integraler Teil seiner Progression. Es gibt bewusst kein reales Nachtfenster; dadurch werden unterschiedliche Spielzeiten nicht benachteiligt und Manipulation über die Gerätezeit vermieden.

## Offline-Fortschritt

Beim Öffnen oder Zurückkehren in den Tab rekonstruiert dieselbe Engine maximal acht Stunden:

- passive Produktion,
- Produktionspausen beim eigenen Transport,
- diskrete Fahrten,
- automatisierte Folgefahrten,
- Überfüllungsverluste,
- Aufmerksamkeit und Einbrüche,
- Tresorgrenzen.

Ein Rückkehrdialog fasst verdientes, gesichertes und gestohlenes Gold zusammen. Die Simulationslogik ist zeitbasiert und unabhängig von der Bildrate.

## Savegame

Der Spielstand liegt zunächst lokal im Browser und enthält eine `schemaVersion`, Timestamps, Upgrades, Bestände, Lebenszeitstatistiken und Ereigniszähler. Autosave erfolgt regelmäßig und beim Verlassen des Tabs. Die PWA funktioniert nach dem ersten Laden auch ohne Netz.

## Audio und Haptik

Taps, Käufe und abgeschlossene Fahrten besitzen kurze synthetisierte Soundeffekte. Unterstützte Browser erhalten zusätzlich dezente Vibrationen. Eine spätere native App kann dieselben Ereignisse über Capacitor mit nativer Haptik verbinden. Reduzierte Bewegungseinstellungen des Betriebssystems werden respektiert.

## Technische Architektur

- React, TypeScript und Vite
- UI-unabhängige TypeScript-Spielengine
- Vitest für Engine- und Offline-Regeln
- SVG/CSS-basierte Darstellung ohne Game-Engine
- `vite-plugin-pwa` für Manifest und Service Worker
- GitHub Actions für Tests, Build und Pages-Deployment
- Local Storage mit versioniertem Savegame

Prestige, Cloud-Sync, App-Store-Pakete und Monetarisierung folgen erst, wenn der Kernloop anhand des Vertical Slice validiert wurde.
