# Vault Run

Vault Run ist ein mobile-first Fantasy-Idle-Game in Pixel-Art. Mit einer rostigen Pickhacke beginnt der Spieler Gold zu schürfen, sammelt es zunächst in einem kleinen Beutel und bringt es anschließend in die Schatztruhe — nur dort lässt es sich ausgeben, aber nur dort lockt es auch Diebe an.

Die Hauptansicht passt ohne Seitenscrollen auf ein Smartphone-Display. Zwischen Header und Dock-Leiste teilen sich Truhe, Beutel und Mine von oben nach unten den verfügbaren Platz zu exakt gleichen Teilen. Jeder Abschnitt bündelt seine Aktion, vier Stats-Plätze und vier einzeln levelbare Spezialisten-Slots. Die Dock-Leiste am unteren Rand führt zu Ausbau, Statistik und Einstellungen und hält Abstand zu iOS-Home-Bar und runden Displayecken.

## Kernloop

1. Mit der Pickhacke Gold aus dem Fels schlagen.
2. Frisch geschürftes Gold im Beutel sammeln.
3. Das Gold per zeitlich laufendem Transport zur Schatztruhe bringen.
4. Bis zu vier Fuhrknechte einzeln anheuern und aufleveln; der erste automatisiert die Fahrten.
5. Vier Bergleute und vier Wachen unabhängig voneinander verbessern.
6. Pickhacke, Goldbeutel und Schatztruhe im Ausbau-Popup unter „Ausrüstung“ aufwerten.
7. Die Truhe von Hand sichern, um das Diebstahlrisiko zu senken — anfangs ruht dabei das ganze Reich. Wachen übernehmen das später selbstständig.

## Gestaltung

- konsistente 32-Bit-Fantasy-Sprites für alle sichtbaren Upgrade-Stufen
- durchgängige, lokal gebündelte `Jersey 10` für eine besser lesbare Pixel-Typografie
- ruhige Pixelminen-Kulisse und eine code-native 16×16-Pixelmünze für Beträge und Schürfanimationen
- warme Pergament-, Holz-, Stein- und Goldpalette
- drei Pixel-Trennstreifen, kompakte 2×2-Raster, harte Pixel-Schatten, gerasterte Fortschrittsbalken und PWA-App-Icon im selben Stil
- feste Dock-Leiste mit Safe-Zones für Home-Bar und runde Ecken
- ein einziges Ausbau-Popup, gefiltert nach Ausrüstung, Bergleuten, Transport und Wachen
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

Die Anwendung wird nach Änderungen an `main` automatisch über GitHub Pages veröffentlicht. Savegames aus Schema 1–4 werden auf Schema 5 migriert; bis zu acht Stunden Offline-Fortschritt werden nachberechnet.

Die vollständigen Produktregeln und Architekturentscheidungen stehen in [DESIGN.md](./DESIGN.md).
