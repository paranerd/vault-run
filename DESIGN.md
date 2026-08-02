# Vault Run – Produkt- und Technik-Spezifikation

## Vision

Der Spieler beginnt als einzelner Goldsucher mit einer rostigen Pickhacke. Aus der kleinen Mine entsteht schrittweise ein sagenhaftes Schatzreich mit Bergleuten, Lasttieren, Kutschen und einer immer prächtigeren Schatztruhe. Der Name „Vault Run“ bezeichnet die regelmäßige Reise mit dem frisch geschürften Gold zum sicheren Schatzlager.

Die erste Version ist ein optisch polierter Vertical Slice für Browser und PWA. Smartphone-Hochformat ist die primäre Oberfläche; Desktop erhält eine eigene vollwertige Anordnung. Die Architektur soll eine spätere Capacitor-App ermöglichen. Sprache ist zunächst Deutsch, das bevorzugte Monetarisierungsmodell wäre ein Einmalkauf.

## Kernloop ab dem ersten Schlag

```text
Mine → Goldbeutel → zeitlicher Transport → Schatztruhe → Ausbau
```

Mine, Beutel und Schatztruhe sind von Anfang an als drei gleich große Abschnitte sichtbar. Nur Gold in der Schatztruhe ist ausgebbar.

Zu Beginn übernimmt der Spieler den Transport selbst. Während er unterwegs ist, kann er nicht schürfen und auch seine Bergleute pausieren. Der erste Fuhrknecht automatisiert Reisen und beendet diese Abbaupause. Jeder der vier gleichwertigen Transport-Slots wird separat gelevelt; gemeinsam erhöhen sie automatische Transportmenge und -häufigkeit. Die sichtbare Progression führt weiterhin vom Läufer über Packpferd und Schatzkarren zur königlichen Kutsche.

## Aktiv und idle

- Ein Schlag auf „Schürfen“ erzeugt Gold im Beutel.
- Pickhacken-Upgrades erhöhen den Wert eines Schlages.
- Vier separat levelbare Bergleute fördern gemeinsam passiv Gold.
- Aktives Schürfen bleibt dauerhaft lohnend, wird aber relativ zum automatisierten Abbau weniger wichtig.
- Der Spieler soll in kurzen aktiven Phasen ausbauen und optimieren können, danach aber sinnvoll idle fortschreiten.
- Ein Run soll mehrere Tage tragen. Prestige ist noch nicht Teil des Vertical Slice; das Savegame ist dafür versioniert vorbereitet.

## Kette und Engpässe

| Abschnitt | Hauptaktion | Mittlerer Ausbau | Vier rechte Slots |
|---|---|---|---|
| Mine | Gold schürfen | Pickhacke | vier Bergleute |
| Beutel | Transport starten | Beutel | vier Fuhrknechte/Gespanne |
| Truhe | Aufmerksamkeit senken | Schatztruhe | vier Wachen |

Der Transport bleibt immer diskret. Die angegebene Reisezeit bezeichnet Hin- und Rückweg zusammen. Zu Reisebeginn wird eine feste Ladung aus dem Beutel genommen und ist bis zur Ankunft als `inTransitGold` gebunden. Nach der halben Zeit wird sie in der Schatztruhe abgelegt; erst nach der gleich langen Rückreise ist der Spieler beziehungsweise das Gespann wieder verfügbar. Neues Gold bleibt im Beutel. Eine Reise nimmt nie mehr mit, als noch in die Schatztruhe passt.

Die Transportaktion startet die Reise. Nach Anheuern des ersten Fuhrknechts löst derselbe Tap eine aktive Eilreise aus, die parallel zur automatischen Fuhre laufen kann. Die Reise bleibt vollständig zeitbasiert, wird in der Hauptansicht aber nicht mehr als fahrendes Gespann animiert.

## Oberfläche und Art Direction

Die Hauptszene ist auf Smartphones fest auf `100dvh` ausgelegt und scrollt nicht. Unter dem Header liegen drei exakt gleich hohe Abschnitte. Ein Pixel-Art-Trennstreifen benennt den Abschnitt. Darunter stehen links vier Stats-Plätze im 2×2-Raster, mittig Hauptaktion, eigener Ausrüstungs-Button und Fortschrittsbalken sowie rechts vier Slot-Upgrades im 2×2-Raster. Der Mine-Balken zeigt bei einer eigenen Reise, wann man wieder schürfen kann; der Beutel- und Truhenbalken zeigen ihre Füllstände. Ist der Beutel voll, wird die Schürfaktion deaktiviert und ein Schlag erzeugt weder Gold noch Überfüllungsverlust. Erzeugtes Gold fliegt auf leicht variierenden Bahnen zum Beutel.

Der Stil ist Fantasy-Pixel-Art mit warmem Pergament, dunklem Holz, Stein, Kupfer und Gold. Harte Rahmen, blockige Schatten und segmentierte Balken ersetzen die vorherigen weichen, modernen Flächen. Die lokal gebündelte `Pixelify Sans` bleibt kurzen Spielbegriffen, Überschriften und markanten Zahlen vorbehalten; Beschreibungen und längere Texte nutzen die Systemschrift für bessere Lesbarkeit. Eine kontrastarme Pixelminen-Kulisse mit Stollenbalken, Steinraster und vereinzelten Erzpunkten belebt den Hintergrund, ohne mit den Bedienelementen zu konkurrieren. Goldbeträge und Schürfanimationen verwenden dieselbe code-native 16×16-Pixelmünze.

Die Haupt- und Upgrade-Icons zeigen sichtbare Progression:

- Pickhacke: rostig → Eisen → Stahl → Gold
- Beutel: alter Lederbeutel → verstärkter Beutel → Bergmannssack → königlicher Goldsack
- Schatztruhe: Holzkiste → Eisentruhe → Prunktruhe → Juwelentruhe
- Reise: Läufer → Packpferd → Schatzkarren → königliche Kutsche
- Schutz: Eisenschloss → Wachhund → Wachturm → Königsgarde → Schatzfestung

Ein kompakter Header zeigt nur das App-Icon, das sichere Gold und die Tonaktion. Der mittlere Ausbau-Button jedes Abschnitts öffnet ausschließlich dessen Ausrüstungs-Upgrade. Ein Tap auf einen der vier rechten Slots öffnet die jeweilige Vierergruppe und fokussiert den gewählten Slot. Diese Ausbau-Seiten scrollen intern, die Hauptansicht selbst nie.

## Diebstahl und Schutz

Diebstahl findet aktiv und offline statt, greift aber nur ungesichertes Gold im Beutel an. Gold in der Schatztruhe und bereits transportierte Ladung sind sicher.

Die sichtbare Aufmerksamkeit steigt, solange Gold im Beutel liegt. Ein voller Beutel erhöht sie schneller. Bei 100 % wird ein prozentualer Anteil gestohlen; danach fällt die Anzeige auf einen kleinen Restwert zurück. Vier separat levelbare Wachen verlangsamen den Anstieg und senken den Verlust. Zusätzlich senkt jeder aktive Klick auf die Truhe die Aufmerksamkeit sofort.

## Offline-Fortschritt

Beim Öffnen oder Zurückkehren in den Tab rekonstruiert dieselbe Engine maximal acht Stunden:

- passiven Abbau,
- Abbaupausen bei der eigenen Reise,
- diskrete Reisen,
- automatisierte Folgereisen,
- Überfüllungsverluste,
- Diebesgefahr und Diebeszüge,
- Grenzen der Schatztruhe.

Ein Rückkehrdialog fasst geschürftes, gesichertes und gestohlenes Gold zusammen. Die Simulationslogik ist zeitbasiert und unabhängig von der Bildrate.

## Savegame, Audio und Technik

Der Spielstand liegt lokal im Browser und enthält eine `schemaVersion`, Timestamps, Upgrades, Bestände, Lebenszeitstatistiken und Ereigniszähler. Schema 4 speichert für Bergleute, Transporteure und Wachen jeweils vier Level. Ältere Fortschritte aus Schema 1–3 werden gleichmäßig auf die passenden vier Slots verteilt. Autosave erfolgt regelmäßig und beim Verlassen des Tabs.

Schläge, Käufe und abgeschlossene Reisen besitzen kurze synthetisierte Soundeffekte. Unterstützte Browser erhalten dezente Vibrationen. Reduzierte Bewegungseinstellungen des Betriebssystems werden respektiert.

- React, TypeScript und Vite
- UI-unabhängige TypeScript-Spielengine
- Vitest für Engine- und Offline-Regeln
- generierte PNG-Pixel-Sprites mit transparentem Hintergrund
- `vite-plugin-pwa` für Manifest und Service Worker
- GitHub Actions für Tests, Build und Pages-Deployment
- Local Storage mit versioniertem Savegame

Prestige, Cloud-Sync, App-Store-Pakete und Monetarisierung folgen erst, wenn der Kernloop anhand des Vertical Slice validiert wurde.
