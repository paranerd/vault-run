# Vault Run

Vault Run ist ein mobile-first Fantasy-Idle-Game in Pixel-Art. Mit einer rostigen Pickhacke beginnt der Spieler tief im Stollen Gold zu schürfen, sammelt es in der Erzkammer hinter der Ortsbrust und fährt es die Strecke hinauf ans Tageslicht in die Schatztruhe — nur dort lässt es sich ausgeben, aber nur dort lockt es auch Diebe an.

Die Hauptansicht passt ohne Seitenscrollen auf ein Smartphone-Display. Zwischen Header und Dock-Leiste teilen sich Truhe, Erzkammer und Mine von oben nach unten den verfügbaren Platz zu exakt gleichen Teilen — die drei Abschnitte sind ein Querschnitt durch den Berg, von der Schatzkammer am Tageslicht bis zur Ortsbrust im Stollen. Jeder Abschnitt zeigt links das Bild seines Ortes — Truhe und Erzkammer mit ihrem Füllstand in Prozent darunter, rot bei 100 % —, mittig seine Aktion und rechts vier einzeln levelbare Spezialisten-Slots auf derselben Kachel. Die Dock-Leiste am unteren Rand führt zu Ausbau, Statistik und Einstellungen und hält Abstand zu iOS-Home-Bar und runden Displayecken.

## Kernloop

1. Mit der Pickhacke Gold aus dem Fels schlagen.
2. Frisch geschürftes Gold in der Erzkammer sammeln.
3. Das Gold per zeitlich laufender Ausfahrt zur Schatztruhe am Tageslicht bringen — es zählt für den Behälter, sobald es dort angekommen ist, in der Kammer wie in der Truhe.
4. Bis zu vier Transporte einzeln anschaffen und aufleveln; der erste automatisiert die Fahrten.
5. Vier Bergleute und vier Wachen unabhängig voneinander verbessern.
6. Pickhacke, Goldbeutel, Stiefel und Grubenlampe im Ausbau-Popup unter „Ausrüstung“ aufwerten, Erzkammer und Schatztruhe unter ihrem eigenen Abschnitt.
7. Die Truhe von Hand sichern, um das Diebstahlrisiko zu senken — anfangs ruht dabei das ganze Reich. Wachen übernehmen das später selbstständig.

## Gestaltung

- konsistente 32-Bit-Fantasy-Sprites für alle sichtbaren Upgrade-Stufen
- durchgängige, lokal gebündelte `Jersey 10` für eine besser lesbare Pixel-Typografie
- ruhige Pixelstollen-Kulisse und eine code-native 16×16-Pixelmünze für Beträge und Schürfanimationen
- warme Pergament-, Holz-, Stein- und Goldpalette
- drei Pixel-Trennstreifen, kompakte 2×2-Raster, harte Pixel-Schatten, gerasterte Fortschrittsbalken und PWA-App-Icon im selben Stil
- feste Dock-Leiste mit Safe-Zones für Home-Bar und runde Ecken
- ein einziges Ausbau-Popup, gefiltert nach Ausrüstung, Mine, Erzkammer und Truhe — jeder Ort der Szene führt in seinen eigenen Reiter
- Einstellungen mit Soundsteuerung und doppelter Neustart-Bestätigung sowie eine eigene Statistikübersicht

## Entwicklung

```bash
npm install
npm run dev
```

Tests und Produktions-Build:

```bash
npm test
npm run build
```

Die Anwendung wird nach Änderungen an `main` automatisch über GitHub Pages veröffentlicht. Savegames aus Schema 1–8 werden auf Schema 9 migriert; bis zu acht Stunden Offline-Fortschritt werden nachberechnet.

Die vollständigen Produktregeln und Architekturentscheidungen stehen in [docs/DESIGN.md](./docs/DESIGN.md), die Namen und Beschreibungen aller Ausbaustufen in [docs/stufen.md](./docs/stufen.md).
