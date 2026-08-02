# Vault Run

Vault Run ist ein mobile-first Fantasy-Idle-Game in Pixel-Art. Mit einer rostigen Pickhacke beginnt der Spieler Gold zu schürfen, sammelt es zunächst in einem kleinen Beutel und bringt es anschließend in eine sichere Schatztruhe.

Die Hauptansicht passt ohne Seitenscrollen auf ein Smartphone-Display. Unter dem Header teilen sich Truhe, Beutel und Mine von oben nach unten den verfügbaren Platz zu exakt gleichen Teilen. Jeder Abschnitt bündelt seine Aktion, vier Stats-Plätze, den Ausrüstungs-Ausbau und vier einzeln levelbare Spezialisten-Slots.

## Kernloop

1. Mit der Pickhacke Gold aus dem Fels schlagen.
2. Frisch geschürftes Gold im Beutel sammeln.
3. Das Gold per zeitlich laufendem Transport zur Schatztruhe bringen.
4. Bis zu vier Fuhrknechte einzeln anheuern und aufleveln; der erste automatisiert die Fahrten.
5. Vier Bergleute und vier Wachen unabhängig voneinander verbessern.
6. Pickhacke, Goldbeutel und Schatztruhe über den eigenen Ausbau-Button jedes Abschnitts aufwerten.
7. Die Truhe aktiv sichern, um Aufmerksamkeit und Diebstahlrisiko zu senken.

## Gestaltung

- konsistente 32-Bit-Fantasy-Sprites für alle sichtbaren Upgrade-Stufen
- durchgängige, lokal gebündelte `Jersey 10` für eine besser lesbare Pixel-Typografie
- ruhige Pixelminen-Kulisse und eine code-native 16×16-Pixelmünze für Beträge und Schürfanimationen
- warme Pergament-, Holz-, Stein- und Goldpalette
- drei Pixel-Trennstreifen, kompakte 2×2-Raster, harte Pixel-Schatten, gerasterte Fortschrittsbalken und PWA-App-Icon im selben Stil
- Einstellungen mit Soundsteuerung und doppelter Neustart-Bestätigung sowie eine eigene Statistikübersicht im Header

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

Die Anwendung wird nach Änderungen an `main` automatisch über GitHub Pages veröffentlicht. Savegames aus Schema 1–3 werden auf die neuen vier Slot-Reihen migriert; bis zu acht Stunden Offline-Fortschritt werden nachberechnet.

Die vollständigen Produktregeln und Architekturentscheidungen stehen in [DESIGN.md](./DESIGN.md).
