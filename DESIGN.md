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
| Truhe | Risiko senken (anfangs blockierend) | Schatztruhe | vier Wachen |

Der Transport bleibt immer diskret. Die angegebene Reisezeit bezeichnet Hin- und Rückweg zusammen. Zu Reisebeginn wird eine feste Ladung aus dem Beutel genommen und ist bis zur sichtbaren Ankunft des Goldhaufens als `inTransitGold` gebunden. Nach der 0,9-sekündigen Ankunftsanimation wird sie in der Schatztruhe abgelegt; der bestehende Reise-Cooldown läuft davon unabhängig bis zu seinem unveränderten Ende weiter. Neues Gold bleibt im Beutel. Eine Reise nimmt nie mehr mit, als noch in die Schatztruhe passt.

Die Transportaktion startet die Reise. Nach Anheuern des ersten Fuhrknechts löst derselbe Tap eine aktive Eilreise aus, die parallel zur automatischen Fuhre laufen kann. Die Reise bleibt vollständig zeitbasiert. Eine kurze fliegende Goldhaufen-Animation visualisiert nur die übertragene Menge; sie bildet bewusst nicht die gesamte Reisezeit ab.

## Oberfläche und Art Direction

Die Hauptszene ist auf Smartphones fest auf `100dvh` ausgelegt und scrollt nicht. Zwischen Header und Dock-Leiste liegen von oben nach unten Truhe, Beutel und Mine als drei exakt gleich hohe Abschnitte. Ein Pixel-Art-Trennstreifen benennt den Abschnitt. Darunter steht links eine einzige große Stat-Kachel über die volle Fläche, mittig die Hauptaktion sowie rechts vier Slot-Upgrades im 2×2-Raster. Jeder Abschnitt zeigt genau die Zahl, auf die man dort handelt — alles Weitere steht in den Upgrade-Karten:

- **Mine:** die Gesamtförderung in ganzen Gold pro Sekunde, also passive Bergleute plus aktives Schürfen.
- **Beutel:** der Durchsatz zur Truhe in ganzen Gold pro Sekunde. Nebeneinander gelesen sagen Minen- und Beutelrate sofort, ob der Transport mithält oder der Beutel überläuft.
- **Truhe:** die Aufmerksamkeit in Prozent. Sie startet bei 100 %, sinkt, solange Gold in der Schatztruhe liegt, und löst bei 0 % den Diebeszug aus; eine Sicherung hebt sie wieder an. Je voller der Hort, desto schneller fällt sie. Bewusst eine fallende Anzeige — „das musst du oben halten“ liest sich unmittelbarer als ein wachsendes Risiko.

Beide Raten sind nach demselben Muster gebaut: der automatisierte Dauerdurchsatz plus die selbst ausgelösten Aktionen, gemittelt über ein gleitendes Zeitfenster — drei Sekunden für Klicks, zwölf für Reisen, passend zur Basis-Reisedauer. Ohne Automatik und ohne Zutun ebben sie von selbst auf null ab. Sie zeigen zudem, was tatsächlich ankommt: Die Minenrate steht auf null, wenn der Beutel voll ist oder die Mine während einer eigenen Reise ruht, die Transportrate, wenn die Schatztruhe nichts mehr aufnimmt. Beutel und Mine zeigen den Fortschritt eines manuellen Transports direkt als von unten nach oben wachsende goldene Füllung ihrer Aktions-Buttons; der separate Minenbalken entfällt. Der Beutel- und Truhenbalken zeigen ihre Füllstände. Ist der Beutel voll, pulsiert die Transportaktion. Die Schatztruhe bleibt bis zur ersten Goldlieferung ausgegraut. Manuell erzeugtes Gold fliegt sofort, automatisch geschürftes Gold einmal pro Sekunde auf leicht variierenden Bahnen zum Beutel.

Der Stil ist Fantasy-Pixel-Art mit warmem Pergament, dunklem Holz, Stein, Kupfer und Gold. Harte Rahmen, blockige Schatten und segmentierte Balken ersetzen die vorherigen weichen, modernen Flächen. `Jersey 10` wird lokal gebündelt und durchgängig in ausreichend großen Rastergrößen eingesetzt. Eine kontrastarme Pixelminen-Kulisse mit Stollenbalken, Steinraster und vereinzelten Erzpunkten belebt den Hintergrund, ohne mit den Bedienelementen zu konkurrieren. Goldbeträge und Schürfanimationen verwenden dieselbe code-native 16×16-Pixelmünze.

Die Haupt- und Upgrade-Icons zeigen sichtbare Progression:

- Pickhacke: rostig → Eisen → Stahl → Gold
- Beutel: alter Lederbeutel → verstärkter Beutel → Bergmannssack → königlicher Goldsack
- Schatztruhe: Holzkiste → Eisentruhe → Prunktruhe → Juwelentruhe
- Reise: Läufer → Packpferd → Schatzkarren → Königskutsche
- Schutz: Eisenschloss → Wachhund → Wachturm → Königsgarde → Schatzfestung

Ein kompakter Header zeigt ausschließlich das sichere Gold. Die gesamte Navigation liegt in einer festen Dock-Leiste am unteren Rand: Statistik, mittig der Ausbau als häufigstes Ziel, Einstellungen. Sie berücksichtigt `env(safe-area-inset-bottom)` für die iOS-Home-Bar sowie die seitlichen Insets, sodass abgerundete Displayecken keinen Button beschneiden; ohne Insets bleibt ein Mindestabstand. Sounds und der zweistufig bestätigte Spielneustart liegen weiterhin ausschließlich im Einstellungs-Popup.

Alle Käufe laufen über ein einziges Ausbau-Popup. Sein Kopfbereich scrollt nicht mit: oben stehen das Ausbau-Icon mit dem Titel „Upgrades“ und rechts das Schließen-X, darunter die Filterzeile. Nur die Kartenliste darunter scrollt. Gefiltert wird über fünf Chips nach Alle, Ausrüstung (Pickhacke, Beutel, Truhe), Bergleute, Transport und Wachen. Die Chips stehen immer in einer einzigen Zeile, brechen nie um und teilen die volle Breite unter sich auf — proportional zur Länge ihrer Beschriftung, sodass rechts kein Rest frei bleibt. Eine Fläche trägt nur der aktive Chip. Ein kleiner roter Punkt hinter der Beschriftung meldet, dass eine Kategorie ein bezahlbares Upgrade enthält, das noch niemand angesehen hat: Wer den Chip auswählt, hakt die aktuellen Angebote dieser Kategorie ab und der Punkt verschwindet, bis ein weiteres Upgrade erreichbar wird — auch ein Kauf zählt, weil er den Preis der nächsten Stufe verändert. „Alle“ hat nie einen Punkt und hakt auch nichts ab, sonst löschte der Dock-Button beim Öffnen jede Meldung, bevor etwas gesehen wurde. Der Punkt liegt per negativem rechten Außenabstand ohne eigene Laufweite an der Beschriftung, sodass die Chip-Breite unverändert bleibt und die Zeile beim Wechsel des Goldstands nicht springt. Die genaue Anzahl steht im Vorlesenamen des Chips. „Alle“ listet die vier Kategorien untereinander mit eigenen Zwischenüberschriften. Der Dock-Button öffnet den Filter „Alle“, ein Tap auf einen der vier rechten Slots eines Abschnitts öffnet dasselbe Popup, wählt dessen Kategorie und scrollt den gewählten Slot fokussiert in den Blick. Die Abschnitte selbst haben deshalb keinen eigenen Ausbau-Button mehr. Jede Upgrade-Karte ist gleich aufgebaut: links das vertikal zentrierte Sprite, rechts daneben oben der sprechende Name der aktuellen Ausbaustufe (bei Slots gefolgt von einer kleinen Slot-Nummer, da vier Slots derselben Stufe sonst identisch hießen), darunter die zweispaltige Wertetabelle mit den Spaltentiteln „Stufe k“ und „Stufe k+1“, oben rechts der Kauf-Button und quer über die volle Breite darunter die Beschreibung. Slots zählen ab Stufe 0 (unbesetzt), Ausrüstung ab Stufe 1. Die Stufennamen laufen parallel zu den Sprite-Stufen — Tagelöhner bis Erzmeister, Läufer bis Königskutsche, Eisenschloss bis Schatzfestung — und darüber hinaus bleibt der höchste Name stehen, während die Stufennummer weiterzählt. Noch nicht gekaufte Slot-Karten sind mit Ausnahme ihres Kauf-Buttons ausgegraut. Das Ausbau-Popup fährt von unten ein und beim Schließen wieder nach unten aus; es legt sich dabei über die Dock-Leiste. In der Desktop-Ansicht hängt es rechts und fährt entsprechend seitlich ein. Weil ein Ausfahren einen Startzustand im DOM braucht, bleibt das Sheet dauerhaft montiert und wird nur über eine Klasse umgeschaltet; geschlossen ist es per `visibility` weder anklick- noch vorlesbar. Statistik und Einstellungen enden dagegen oberhalb der Dock-Leiste, damit sie sichtbar und direkt umschaltbar bleibt. Diese Ausbau-Seiten scrollen intern, die Hauptansicht selbst nie.

## Diebstahl und Schutz

Diebstahl findet aktiv und offline statt und greift ausschließlich die **Schatztruhe** an. Gold im Beutel und Ladung unterwegs sind zu kleine Beute, um jemanden zu interessieren — Diebe überfallen Schatzkammern, keine Gürteltaschen.

Damit wirkt jeder Abschnitt genau auf die Ressource, die er besitzt: Die Wachen stehen im Truhen-Abschnitt und verteidigen dessen Gold. Jeder Abschnitt trägt außerdem genau einen Fehlermodus — der Beutel setzt unter **Zeitdruck** (er läuft über, wenn niemand transportiert), die Truhe unter **Sicherheitsdruck** (sie wird bestohlen, wenn niemand sichert).

Der Transport zahlt deshalb nicht mehr in Sicherheit, sondern in **Handlungsfähigkeit**: Nur Truhengold lässt sich ausgeben. Umgekehrt ist ausgegebenes Gold unangreifbar — Ausbauen ist damit immer auch Verteidigen, und Horten hat einen Preis. Wer trotzdem auf ein teures Upgrade sparen will, kauft vorher Wachen.

Die Aufmerksamkeit sinkt, sobald Gold in der Schatztruhe liegt; ein voller Hort treibt sie schneller. Vor der ersten Lieferung entsteht überhaupt kein Risiko — der Abschnitt ist zu diesem Zeitpunkt ohnehin ausgegraut, sodass niemand unter Druck gerät, bevor er die Truhe kennt. Bei 0 % wird ein Anteil der Truhe gestohlen, danach springt die Anzeige auf einen kleinen Restwert zurück. Wie hoch dieser Anteil ausfällt, hängt an der Wachstärke — sie ist die Schadensbegrenzung, wenn es doch knallt.

Der Anteil ist bewusst klein: Bezugsgröße ist das gesamte Vermögen, nicht der Inhalt einer Tasche. Ohne Wachen nimmt ein Diebeszug 8 % der Truhe, ein ausgebauter Trupp drückt das bis auf 1,5 %. Weil es ein Anteil bleibt, ist der Verlust auf jedem Ausbaustand gleich spürbar und verliert nie an Bedeutung — anders als eine feste Summe, die im späteren Spiel verschwindet.

Ein Gegenmittel steckt in der Truhe selbst: Weil das Risiko am Füllstand hängt, senkt jeder Ausbau der Schatztruhe den Druck. Die Ausrüstungskarte hat damit einen zweiten Zweck neben reiner Kapazität.

Das Sichern durchläuft denselben Bogen wie der Transport: erst mühsam von Hand, dann von Angestellten übernommen.

- **Ohne Wachen** senkt ein Tap auf die Truhe das Risiko um 25 Punkte der Hundert-Punkte-Skala. Währenddessen ruht das ganze Reich für 1,5 Sekunden — Schürfen, Transport und ein zweiter Sicherungs-Tap sind gesperrt, sichtbar als Füllung des Truhen-Buttons. Das Sichern kostet also echte Spielzeit.
- **Ab der ersten Wache** sichert sie selbstständig in festem Takt. Mehr Wachen verkürzen den Takt, höhere Stufen zusätzlich; die abgetragenen Punkte wachsen mit der Gesamtstärke. Die Sperre entfällt damit vollständig.
- **Der Tap bleibt danach nützlich** — wie die Eilreise beim Transport: Läuft das Risiko zwischen zwei Takten hoch, senkt ein Tap es sofort zusätzlich, ohne irgendetwas zu blockieren.

Die Wachen bremsen den Anstieg des Risikos bewusst **nicht** mehr. Bremsen, automatisch senken und den Schaden deckeln wären drei sich stapelnde Effekte, und die Bedrohung verschwände schon nach den ersten Käufen aus dem Spiel. Ihr Wert steckt jetzt in Takt und Stärke der Sicherung.

Eine einzelne Wache der ersten Stufe trägt das Risiko bei voller Truhe noch nicht allein; ab etwa zwei Wachen kippt das Verhältnis, und ein ausgebauter Trupp hält die Anzeige dauerhaft unten.

## Offline-Fortschritt

Beim Öffnen oder Zurückkehren in den Tab rekonstruiert dieselbe Engine maximal acht Stunden:

- passiven Abbau,
- Abbaupausen bei der eigenen Reise,
- diskrete Reisen,
- automatisierte Folgereisen,
- Überfüllungsverluste,
- Diebesgefahr, automatische Sicherungen der Wachen und Diebeszüge,
- Grenzen der Schatztruhe.

Weil der Diebstahl jetzt die Schatztruhe trifft, braucht die Offline-Strecke einen Deckel: Ein Aufenthalt nimmt höchstens ein Viertel dessen mit, was auf der Strecke Truhengold war — also der Stand beim Verlassen plus alles, was die Fuhren inzwischen angeliefert haben. Ohne diesen Bezug auf die Lieferungen wäre eine bei Abschied leere Truhe die ganze Nacht über unantastbar. Läuft das Budget aus, ebbt die Aufmerksamkeit weiterhin ab, damit die Rückkehr nicht in einem sofortigen Überfall endet.

Ein Rückkehrdialog fasst geschürftes, gesichertes und gestohlenes Gold zusammen. Die Simulationslogik ist zeitbasiert und unabhängig von der Bildrate.

## Savegame, Audio und Technik

Der Spielstand liegt lokal im Browser und enthält eine `schemaVersion`, Timestamps, Upgrades, Bestände, Lebenszeitstatistiken und Ereigniszähler. Schema 5 speichert für Bergleute, Transporteure und Wachen jeweils vier Level sowie die Zeitstempel der laufenden und der letzten automatischen Sicherung. Schema 4 wird um diese Zeitstempel ergänzt, ältere Fortschritte aus Schema 1–3 werden zusätzlich gleichmäßig auf die passenden vier Slots verteilt. Autosave erfolgt regelmäßig und beim Verlassen des Tabs.

Schläge, Käufe und abgeschlossene Reisen besitzen kurze synthetisierte Soundeffekte. Unterstützte Browser erhalten dezente Vibrationen. Reduzierte Bewegungseinstellungen des Betriebssystems werden respektiert.

- React, TypeScript und Vite
- UI-unabhängige TypeScript-Spielengine
- Vitest für Engine- und Offline-Regeln
- generierte PNG-Pixel-Sprites mit transparentem Hintergrund
- `vite-plugin-pwa` für Manifest und Service Worker
- GitHub Actions für Tests, Build und Pages-Deployment
- Local Storage mit versioniertem Savegame

Prestige, Cloud-Sync, App-Store-Pakete und Monetarisierung folgen erst, wenn der Kernloop anhand des Vertical Slice validiert wurde.
