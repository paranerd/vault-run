# Vault Run

Vault Run ist ein mobile-first Fantasy-Idle-Game in Pixel-Art. Mit einer rostigen Pickhacke beginnt der Spieler Gold zu schürfen, sammelt es zunächst in einem kleinen Beutel und bringt es anschließend in eine sichere Schatztruhe.

Die Hauptansicht passt ohne Seitenscrollen auf ein Smartphone-Display. Pickhacke, Goldbeutel, Transport und Schatztruhe bleiben jederzeit erreichbar; Upgrades liegen in einem gefilterten Ausbau-Panel.

## Kernloop

1. Mit der Pickhacke Gold aus dem Fels schlagen.
2. Frisch geschürftes Gold im Beutel sammeln.
3. Den Beutel antippen und das Gold zunächst selbst zur Schatztruhe bringen.
4. Über Packpferd und Schatzkarren bis zur königlichen Kutsche aufsteigen.
5. Einen Fuhrknecht anheuern und den Transport automatisieren.
6. Pickhacke, Bergleute, Goldsack, Gespanne, Schatztruhe und Schutz ausbauen.

## Gestaltung

- konsistente 32-Bit-Fantasy-Sprites für alle sichtbaren Upgrade-Stufen
- `Pixelify Sans` als lokal gebündelte, gut lesbare Pixel-Schrift
- warme Pergament-, Holz-, Stein- und Goldpalette
- harte Pixel-Schatten, gerasterte Fortschrittsbalken und PWA-App-Icon im selben Stil

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

Die Anwendung wird nach Änderungen an `main` automatisch über GitHub Pages veröffentlicht. Das lokale Savegame bleibt kompatibel; bis zu acht Stunden Offline-Fortschritt werden nachberechnet.

Die vollständigen Produktregeln und Architekturentscheidungen stehen in [DESIGN.md](./DESIGN.md).
