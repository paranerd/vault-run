# Vault Run

Vault Run ist ein mobile-first Idle-Game über ein wachsendes Goldgeschäft. Verdientes Gold ist erst ausgebbar, nachdem es von der Geschäftstruhe in den Tresor transportiert wurde.

Die helle Pixel-Art-Hauptszene passt ohne Seitenscrollen auf ein Smartphone-Display. Goldmünze, Truhe, Hin- und Rückfahrt, Expressfahrt und Tresor bleiben jederzeit erreichbar; Upgrades liegen in einem gefilterten Bottom Sheet.

## Kernloop

1. Geschäfte abschließen und Gold verdienen.
2. Ungesichertes Gold in der Geschäftstruhe sammeln.
3. Das Gold zunächst selbst zum Tresor transportieren.
4. Mit Schuhen, Fahrrad und Auto die eigene Ausfallzeit verkürzen.
5. Einen Boten einstellen und den Transport automatisieren.
6. Transporter, Konvoi, Tresor und Sicherheit ausbauen.

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

Die Anwendung wird nach Änderungen an `main` automatisch über GitHub Pages veröffentlicht. Das lokale Savegame wird versioniert im Browser gespeichert; bis zu acht Stunden Offline-Fortschritt werden nachberechnet.

Die vollständigen Produktregeln und Architekturentscheidungen stehen in [DESIGN.md](./DESIGN.md).
