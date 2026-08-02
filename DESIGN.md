# Vault Run – Produkt- und Technik-Spezifikation

## Vision

Der Spieler beginnt als einzelner Goldsucher mit einer rostigen Pickhacke. Aus der kleinen Mine entsteht schrittweise ein sagenhaftes Schatzreich mit Bergleuten, Lasttieren, Kutschen und einer immer prächtigeren Schatztruhe. Der Name „Vault Run“ bezeichnet die regelmäßige Reise mit dem frisch geschürften Gold zum sicheren Schatzlager.

Die erste Version ist ein optisch polierter Vertical Slice für Browser und PWA. Smartphone-Hochformat ist die primäre Oberfläche; Desktop erhält eine eigene vollwertige Anordnung. Die Architektur soll eine spätere Capacitor-App ermöglichen. Sprache ist zunächst Deutsch, das bevorzugte Monetarisierungsmodell wäre ein Einmalkauf.

## Kernloop ab dem ersten Schlag

```text
Mine → Goldbeutel → Reise → Schatztruhe → Ausbau
```

Alle vier Stationen sind von Anfang an sichtbar. Nur Gold in der Schatztruhe ist ausgebbar.

Zu Beginn übernimmt der Spieler den Transport selbst. Während er unterwegs ist, kann er nicht schürfen und auch seine Bergleute pausieren. Die Transport-Progression lautet:

1. Zu Fuß
2. Packpferd
3. Schatzkarren
4. Königliche Kutsche

Sie verkürzt die Reise und erhöht die Ladung, beseitigt aber nicht den Zielkonflikt. Der erste große Automatisierungssprung ist ein Fuhrknecht: Reisen starten danach automatisch und die Mine produziert währenddessen weiter. Anschließend skalieren Laderaum und Anzahl der Gespanne.

## Aktiv und idle

- Ein Schlag auf „Schürfen“ erzeugt Gold im Beutel.
- Pickhacken-Upgrades erhöhen den Wert eines Schlages.
- Bergleute fördern passiv Gold.
- Aktives Schürfen bleibt dauerhaft lohnend, wird aber relativ zum automatisierten Abbau weniger wichtig.
- Der Spieler soll in kurzen aktiven Phasen ausbauen und optimieren können, danach aber sinnvoll idle fortschreiten.
- Ein Run soll mehrere Tage tragen. Prestige ist noch nicht Teil des Vertical Slice; das Savegame ist dafür versioniert vorbereitet.

## Kette und Engpässe

| Station | Funktion | Typische Upgrades |
|---|---|---|
| Mine | Aktiver und passiver Abbau | Pickhacke, Bergleute |
| Goldbeutel | Ungesicherter Puffer | Lederbeutel bis königlicher Goldsack |
| Reise | Diskrete Lieferung | Packpferd, Karren, Kutsche, Fuhrknecht, Gespanne |
| Schatztruhe | Geschütztes und ausgebbares Vermögen | Holzkiste bis Juwelentruhe, Schutz |

Der Transport bleibt immer diskret. Die angegebene Reisezeit bezeichnet Hin- und Rückweg zusammen. Zu Reisebeginn wird eine feste Ladung aus dem Beutel genommen und ist bis zur Ankunft als `inTransitGold` gebunden. Nach der halben Zeit wird sie in der Schatztruhe abgelegt; erst nach der gleich langen Rückreise ist der Spieler beziehungsweise das Gespann wieder verfügbar. Neues Gold bleibt im Beutel. Eine Reise nimmt nie mehr mit, als noch in die Schatztruhe passt.

Ein Tap auf den Beutel startet die Reise. Nach Anheuern des Fuhrknechts löst derselbe Tap eine aktive Eilreise aus. Sie kann parallel zur automatischen Fuhre laufen und wird als zweites Gespann dargestellt.

## Oberfläche und Art Direction

Die Hauptszene ist auf Smartphones fest auf `100dvh` ausgelegt und scrollt nicht. Schürfaktion, Goldbeutel, Reise und Schatztruhe bleiben dauerhaft sichtbar. Beutel- und Truhenbetrag sind die prominentesten Zahlen. Der Beutel selbst startet die manuelle Reise beziehungsweise die Eilreise. Ist er voll, wird die Schürfaktion deaktiviert und ein Schlag erzeugt weder Gold noch Überfüllungsverlust. Ein Fortschrittsbalken im Schürf-Button zeigt die eigene Reise, während der Spieler nicht abbauen kann. Erzeugtes Gold fliegt langsam und auf leicht variierenden Bahnen zum Beutel.

Der Stil ist Fantasy-Pixel-Art mit warmem Pergament, dunklem Holz, Stein, Kupfer und Gold. Harte Rahmen, blockige Schatten und segmentierte Balken ersetzen die vorherigen weichen, modernen Flächen. Die lokal gebündelte `Pixelify Sans` bleibt kurzen Spielbegriffen, Überschriften und markanten Zahlen vorbehalten; Beschreibungen und längere Texte nutzen die Systemschrift für bessere Lesbarkeit. Eine kontrastarme Pixelminen-Kulisse mit Stollenbalken, Steinraster und vereinzelten Erzpunkten belebt den Hintergrund, ohne mit den Bedienelementen zu konkurrieren. Goldbeträge und Schürfanimationen verwenden dieselbe code-native 16×16-Pixelmünze.

Die Haupt- und Upgrade-Icons zeigen sichtbare Progression:

- Pickhacke: rostig → Eisen → Stahl → Gold
- Beutel: alter Lederbeutel → verstärkter Beutel → Bergmannssack → königlicher Goldsack
- Schatztruhe: Holzkiste → Eisentruhe → Prunktruhe → Juwelentruhe
- Reise: Läufer → Packpferd → Schatzkarren → königliche Kutsche
- Schutz: Eisenschloss → Wachhund → Wachturm → Königsgarde → Schatzfestung

Ein kompakter Header zeigt nur das App-Icon, das sichere Gold und die wichtigsten Statusaktionen. Upgrades und Statistik öffnen mobil in einem intern scrollbaren Ausbau-Panel. Die Kategorien heißen Alle, Abbau, Schätze, Transport und Schutz.

## Diebstahl und Schutz

Diebstahl findet aktiv und offline statt, greift aber nur ungesichertes Gold im Beutel an. Gold in der Schatztruhe und bereits transportierte Ladung sind sicher.

Die sichtbare Diebesgefahr steigt, solange Gold im Beutel liegt. Ein voller Beutel erhöht sie schneller. Bei 100 % wird ein prozentualer Anteil gestohlen; danach fällt die Anzeige auf einen kleinen Restwert zurück. Schutz-Upgrades verlangsamen den Anstieg und senken den Verlust.

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

Der Spielstand liegt lokal im Browser und enthält eine `schemaVersion`, Timestamps, Upgrades, Bestände, Lebenszeitstatistiken und Ereigniszähler. Das Fantasy-Retheme ändert keine gespeicherten Felder und bleibt daher mit bestehenden Spielständen kompatibel. Autosave erfolgt regelmäßig und beim Verlassen des Tabs.

Schläge, Käufe und abgeschlossene Reisen besitzen kurze synthetisierte Soundeffekte. Unterstützte Browser erhalten dezente Vibrationen. Reduzierte Bewegungseinstellungen des Betriebssystems werden respektiert.

- React, TypeScript und Vite
- UI-unabhängige TypeScript-Spielengine
- Vitest für Engine- und Offline-Regeln
- generierte PNG-Pixel-Sprites mit transparentem Hintergrund
- `vite-plugin-pwa` für Manifest und Service Worker
- GitHub Actions für Tests, Build und Pages-Deployment
- Local Storage mit versioniertem Savegame

Prestige, Cloud-Sync, App-Store-Pakete und Monetarisierung folgen erst, wenn der Kernloop anhand des Vertical Slice validiert wurde.
