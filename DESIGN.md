# Vault Run – Produkt- und Technik-Spezifikation

## Vision

Der Spieler beginnt als einzelner Goldsucher mit einer rostigen Pickhacke. Aus der kleinen Mine entsteht schrittweise ein sagenhaftes Schatzreich mit Bergleuten, Lasttieren, Kutschen und einer immer prächtigeren Schatztruhe. Der Name „Vault Run“ bezeichnet die regelmäßige Reise mit dem frisch geschürften Gold zum sicheren Schatzlager.

Die erste Version ist ein optisch polierter Vertical Slice für Browser und PWA. Smartphone-Hochformat ist die primäre Oberfläche; Desktop erhält eine eigene vollwertige Anordnung. Die Architektur soll eine spätere Capacitor-App ermöglichen. Sprache ist zunächst Deutsch, das bevorzugte Monetarisierungsmodell wäre ein Einmalkauf.

## Kernloop ab dem ersten Schlag

```text
Mine → Goldbeutel → zeitlicher Transport → Schatztruhe → Ausbau
```

Mine, Beutel und Schatztruhe sind von Anfang an als drei gleich große Abschnitte sichtbar. Nur Gold in der Schatztruhe ist ausgebbar.

Zu Beginn übernimmt der Spieler den Transport selbst. Während er unterwegs ist, kann er nicht schürfen und auch seine Bergleute pausieren. Der erste Fuhrknecht automatisiert Reisen und beendet diese Abbaupause. Jeder der vier gleichwertigen Transport-Slots wird separat gelevelt und fährt seine eigene Fuhre: eigene Ladung, eigene Fahrzeit, eigene Ankunft. Die sichtbare Progression führt weiterhin vom Läufer über Packpferd und Schatzkarren zur königlichen Kutsche.

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

**Eine Person, eine Handlung.** Schürfen, die eigene Fuhre und die Sicherung von Hand sind die drei Aktionen des Spielers — und er hat nur ein Paar Hände. Jede laufende Aktion sperrt darum die beiden anderen: Wer die Fuhre zur Truhe trägt, steht nicht gleichzeitig Wache und schlägt nicht nebenbei Gold aus dem Fels. Der Schlag mit der Pickhacke sperrt selbst nichts, weil er keine Zeit dauert; gesperrt wird immer von der Aktion, die läuft. Alle drei Aktions-Buttons zeigen währenddessen denselben Fortschritt — den der Aktion, die den Spieler gerade belegt. Ohne diese Rückmeldung stünden zwei Buttons grundlos tot da, während der dritte sich füllt.

Davon zu trennen ist, was eine Aktion mit dem **Reich** macht. Seine Angestellten arbeiten weiter, während er beschäftigt ist: Trägt er selbst eine Fuhre zur Truhe, fördern seine Bergleute durch — sie legen die Hacke nicht weg, weil ihr Dienstherr einen Sack trägt, und das gilt auch, solange noch kein Fuhrknecht angestellt ist. Nur die **Sicherung von Hand** legt zusätzlich das Reich still, und auch das nur ohne Wachen: Mit Wachen bindet sie ihn 1,5 Sekunden, hält die Förderung aber nicht mehr an.

**Eigene und automatische Fuhre sind getrennte Größen.** Was der Spieler selbst zur Truhe trägt, ist seine eigene Tragkraft (20 Gold in 12 s) — kein Mindestmaß der Fuhrknechte, sondern eine Zahl daneben, so wie der eigene Schlag neben den Bergleuten steht. Er kann jederzeit zusätzlich losziehen, während die Fuhrknechte fahren. Solange beides ein gemeinsamer Boden war, deckte die eigene Tragkraft die ersten Fuhrknecht-Stufen mit ab: Sie kosteten Gold und veränderten die Fuhre nicht.

Der Transport bleibt immer diskret. Die angegebene Reisezeit bezeichnet Hin- und Rückweg zusammen. Zu Reisebeginn nimmt ein Träger seine Ladung aus dem Beutel; sie bleibt bis zur sichtbaren Ankunft seines Goldhaufens an ihm gebunden. Nach der 0,9-sekündigen Ankunftsanimation wird sie in der Schatztruhe abgelegt; seine Rückkehr läuft davon unabhängig bis zu ihrem unveränderten Ende weiter. Neues Gold bleibt im Beutel. Keine Reise nimmt mehr mit, als noch in die Schatztruhe passt — dabei zählt alles mit, was gerade unterwegs ist, sonst packten mehrere gleichzeitig fahrende Träger zusammen mehr ein als am Ziel hineinpasst.

Die Transportaktion startet die eigene Reise. Sie läuft jederzeit parallel zu den Fuhrknechten — nach dem ersten Fuhrknecht ändert sich an ihr nichts außer, dass sie die Mine nicht mehr anhält. Die Reise bleibt vollständig zeitbasiert. Eine kurze fliegende Goldhaufen-Animation visualisiert nur die übertragene Menge; sie bildet bewusst nicht die gesamte Reisezeit ab.

## Oberfläche und Art Direction

Die Hauptszene ist auf Smartphones fest auf `100dvh` ausgelegt und scrollt nicht. Zwischen Header und Dock-Leiste liegen von oben nach unten Truhe, Beutel und Mine als drei exakt gleich hohe Abschnitte. Ein Pixel-Art-Trennstreifen benennt den Abschnitt. Darunter steht links eine einzige große Stat-Kachel über die volle Fläche, mittig die Hauptaktion sowie rechts vier Slot-Upgrades im 2×2-Raster. Jeder Abschnitt zeigt genau die Zahl, auf die man dort handelt — alles Weitere steht in den Upgrade-Karten:

- **Mine:** die Gesamtförderung in ganzen Gold pro Sekunde, also passive Bergleute plus aktives Schürfen.
- **Beutel:** der Durchsatz zur Truhe in ganzen Gold pro Sekunde. Nebeneinander gelesen sagen Minen- und Beutelrate sofort, ob der Transport mithält oder der Beutel überläuft.
- **Truhe:** das Risiko in Prozent. Es startet bei 0 %, steigt, solange Gold in der Schatztruhe liegt, und löst bei 100 % den Diebeszug aus; eine Sicherung drückt es wieder herunter. Je voller der Hort, desto schneller steigt es.

Die Truhe zeigt bewusst ein **steigendes Risiko** statt einer fallenden Aufmerksamkeit. Entscheidend ist die Kausalität: „volle Truhe → hohes Risiko“ ist ein Schritt, während „volle Truhe → sinkende Aufmerksamkeit“ eine Geschichte bräuchte, warum die eigenen Leute nachlässiger werden, je mehr Gold da liegt. Die Aufmerksamkeit, die tatsächlich steigt, ist die der Diebe — das Label beschrieb den falschen Akteur. Dass diese Kachel als einzige nicht „höher ist besser“ liest, ist kein Bruch: Mine und Beutel zeigen **Raten**, die man gegeneinander liest, die Truhe zeigt einen **Füllstand, der auf ein Ereignis zuläuft**. Zwei Sorten Zahl dürfen verschieden aussehen, und ein Balken, der sich Richtung Rot füllt, ist dafür das gewohnte Bild.

Ab 50 % färbt sich die Kachel, ab 80 % pocht zusätzlich die Sicherung — die Vorwarnung, die dem Spieler ein Reaktionsfenster gibt, statt ihn von einer stillen Zahl überraschen zu lassen.

Beide Raten sind nach demselben Muster gebaut: der automatisierte Dauerdurchsatz plus die selbst ausgelösten Aktionen, gemittelt über ein gleitendes Zeitfenster — drei Sekunden für Klicks, zwölf für Reisen, passend zur Basis-Reisedauer. Ohne Automatik und ohne Zutun ebben sie von selbst auf null ab. Sie zeigen zudem, was tatsächlich ankommt: Die Minenrate steht auf null, wenn der Beutel voll ist oder die Mine während einer Sicherung von Hand ruht, die Transportrate, wenn die Schatztruhe nichts mehr aufnimmt. Beutel und Mine zeigen den Fortschritt eines manuellen Transports direkt als von unten nach oben wachsende goldene Füllung ihrer Aktions-Buttons; der separate Minenbalken entfällt. Der Beutel- und Truhenbalken zeigen ihre Füllstände. Ist der Beutel voll, pulsiert die Transportaktion. Die Schatztruhe bleibt bis zur ersten Goldlieferung ausgegraut. Manuell erzeugtes Gold fliegt sofort; jede Förderung eines Bergmanns fliegt einzeln mit ihrer eigenen Menge, jede abfahrende Fuhre als eigener Goldhaufen, und jede Sicherung lässt die Truhe kurz aufleuchten. Weil kein Takt schneller als eine Sekunde läuft, bleibt die Zahl gleichzeitiger Animationen auch bei vollem Ausbau überschaubar.

Der Stil ist Fantasy-Pixel-Art mit warmem Pergament, dunklem Holz, Stein, Kupfer und Gold. Harte Rahmen, blockige Schatten und segmentierte Balken ersetzen die vorherigen weichen, modernen Flächen. `Jersey 10` wird lokal gebündelt und durchgängig in ausreichend großen Rastergrößen eingesetzt. Eine kontrastarme Pixelminen-Kulisse mit Stollenbalken, Steinraster und vereinzelten Erzpunkten belebt den Hintergrund, ohne mit den Bedienelementen zu konkurrieren. Goldbeträge und Schürfanimationen verwenden dieselbe code-native 16×16-Pixelmünze.

Die Haupt- und Upgrade-Icons zeigen sichtbare Progression:

- Pickhacke: rostig → Eisen → Stahl → Gold
- Beutel: alter Lederbeutel → verstärkter Beutel → Bergmannssack → königlicher Goldsack
- Schatztruhe: Holzkiste → Eisentruhe → Prunktruhe → Juwelentruhe
- Reise: Läufer → Packpferd → Schatzkarren → Königskutsche
- Schutz: Eisenschloss → Wachhund → Wachturm → Königsgarde → Schatzfestung

Ein kompakter Header zeigt ausschließlich das sichere Gold. Die gesamte Navigation liegt in einer festen Dock-Leiste am unteren Rand: Statistik, mittig der Ausbau als häufigstes Ziel, Einstellungen. Sie berücksichtigt `env(safe-area-inset-bottom)` für die iOS-Home-Bar sowie die seitlichen Insets, sodass abgerundete Displayecken keinen Button beschneiden; ohne Insets bleibt ein Mindestabstand. Sounds und der zweistufig bestätigte Spielneustart liegen weiterhin ausschließlich im Einstellungs-Popup.

Alle Käufe laufen über ein einziges Ausbau-Popup. Sein Kopfbereich scrollt nicht mit: oben stehen das Ausbau-Icon mit dem Titel „Upgrades“ und rechts das Schließen-X, darunter die Filterzeile. Nur die Kartenliste darunter scrollt. Gefiltert wird über fünf Chips nach Alle, Ausrüstung (Pickhacke, Beutel, Truhe), Bergleute, Transport und Wachen. Die Chips stehen immer in einer einzigen Zeile, brechen nie um und teilen die volle Breite unter sich auf — proportional zur Länge ihrer Beschriftung, sodass rechts kein Rest frei bleibt. Eine Fläche trägt nur der aktive Chip. Ein kleiner roter Punkt hinter der Beschriftung meldet, dass eine Kategorie ein bezahlbares Upgrade enthält, das noch niemand angesehen hat: Wer den Chip auswählt, hakt die aktuellen Angebote dieser Kategorie ab und der Punkt verschwindet, bis ein weiteres Upgrade erreichbar wird — auch ein Kauf zählt, weil er den Preis der nächsten Stufe verändert. „Alle“ hat nie einen Punkt und hakt auch nichts ab, sonst löschte der Dock-Button beim Öffnen jede Meldung, bevor etwas gesehen wurde. Der Punkt liegt per negativem rechten Außenabstand ohne eigene Laufweite an der Beschriftung, sodass die Chip-Breite unverändert bleibt und die Zeile beim Wechsel des Goldstands nicht springt. Die genaue Anzahl steht im Vorlesenamen des Chips. „Alle“ listet die vier Kategorien untereinander mit eigenen Zwischenüberschriften. Der Dock-Button öffnet den Filter „Alle“, ein Tap auf einen der vier rechten Slots eines Abschnitts öffnet dasselbe Popup, wählt dessen Kategorie und scrollt den gewählten Slot fokussiert in den Blick. Die Abschnitte selbst haben deshalb keinen eigenen Ausbau-Button mehr. Jede Upgrade-Karte beantwortet in fester Reihenfolge drei Fragen — *Was ist das? Was bringt der Aufstieg? Was kostet er?* — und ist dafür gleich aufgebaut: links das vertikal zentrierte Sprite, rechts daneben oben der sprechende Name der aktuellen Ausbaustufe (bei Slots gefolgt von einer kleinen Slot-Nummer, da vier Slots derselben Stufe sonst identisch hießen), darunter die Aufstiegszeile „Stufe k → k+1“ samt dem Namen der nächsten Stufe, darunter der Zuwachs und rechts daneben der Kauf-Button. Slots zählen ab Stufe 0 (unbesetzt), Ausrüstung ab Stufe 1.

Der mittlere Teil jeder Karte ist eine **Attributtabelle**: je Zeile ein Wert vor und nach dem Kauf, dahinter sein Name. Die Stufe führt sie an und trägt den Rang, den die Einheit danach hat.

```text
Stufe 2   →  Stufe 3    Wachturm
8         →  10         Kraft
8,9       →  7,1        Dauer
```

Die drei Wertespalten sind inhaltsbreit und über alle Zeilen geteilt, sodass die Pfeile untereinander stehen und man die Karte in einer Blickachse hinunterliest. In den Zellen stehen **reine Zahlen**: Die Einheit stand hinter jedem Nachher-Wert und wiederholte, was der Attributname rechts daneben längst sagt — „Kraft“ braucht kein `%`, „Dauer“ kein `s`, „Fördermenge“ kein `/s`. Ein unbesetzter Slot hat keinen Vorher-Wert und zeigt dort einen Strich statt einer erfundenen Null. Bringt eine Stufe rechnerisch nichts, steht links dieselbe Zahl wie rechts — eine Karte, die zum Kauf auffordert, muss das zeigen.

Benannt wird jeweils die Größe, die sich bewegt: Eine Wache hat **Kraft** und **Dauer** — was eine Sicherung abträgt und wie lange sie bis zur nächsten braucht —, nicht „Risiko -x %“. Pickhacke und Bergmann heißen beide **Fördermenge**, weil beide dasselbe tun; Truhe und Beutel heißen **Kapazität**, wie die Zeile unter ihrem Aktions-Button.

Aufgeführt sind die Eigenschaften der Einheit selbst, nicht deren Quotient: Ein Fuhrknecht nennt **Ladung** und **Dauer**. Die Dauerleistung in Gold bzw. Prozent je Sekunde steht nicht zusätzlich dabei — sie folgt aus beiden Zeilen und wäre nur eine dritte Schreibweise derselben Sache. Bergleute takten fest im Sekundentakt und brauchen deshalb keine Zeile dafür; bei ihnen sind Menge und Rate dasselbe.

Auf schmalen Geräten rückt die Tabelle unter Bild, Name und Preis über die volle Kartenbreite — in der mittleren Spalte bliebe für die Namen sonst zu wenig Platz.

Diese Zeilen **dürfen sich nicht ändern, wenn nebenan gekauft wird**. Fördermenge und Ladung gehören dem Slot allein und erfüllen das von selbst; die Sicherungskraft ist wenigstens additiv und wächst je Stufe um denselben Betrag. Was mehrere Slots dagegen nur gemeinsam bewirken — die kürzere Fahrzeit, der Takt des Wachtrupps, der Schadensdeckel — hätte auf keiner einzelnen Karte eine Zahl, die nur zu ihr gehört, und steht darum im Hinweis über der Gruppe.

So lassen sich zwei Angebote ohne Kopfrechnen vergleichen: Vier Wachen-Karten bringen alle zwei Punkte Kraft, also entscheidet allein der Preis — 150 statt 487. Ein unbesetzter Fuhrknecht bringt für 180 Gold 12 Ladung, der Aufstieg des besten für 571 nur 10 mehr.

Fließtext steht nur dort, wo keine Zahl ihn ersetzt, und nur einmal. Was für alle vier Karten einer Gruppe gilt, steht als ein Satz unter der Gruppenüberschrift statt viermal auf den Karten; die Gruppenüberschrift bleibt deshalb auch im gefilterten Sheet stehen. Die drei Ausrüstungskarten tun jeweils etwas anderes und tragen ihren Hinweis darum selbst — und er nennt bewusst keine Zahl aus der Tabelle, sondern die Folge, die aus ihr nicht hervorgeht („Ist der Beutel voll, ruht die Mine bis zur nächsten Fuhre“). Die Stufennamen laufen parallel zu den Sprite-Stufen — Tagelöhner bis Erzmeister, Läufer bis Königskutsche, Eisenschloss bis Schatzfestung — und darüber hinaus bleibt der höchste Name stehen, während die Stufennummer weiterzählt. Noch nicht gekaufte Slot-Karten sind mit Ausnahme ihres Kauf-Buttons ausgegraut. Das Ausbau-Popup fährt von unten ein und beim Schließen wieder nach unten aus; es legt sich dabei über die Dock-Leiste. In der Desktop-Ansicht hängt es rechts und fährt entsprechend seitlich ein. Weil ein Ausfahren einen Startzustand im DOM braucht, bleibt das Sheet dauerhaft montiert und wird nur über eine Klasse umgeschaltet; geschlossen ist es per `visibility` weder anklick- noch vorlesbar. Statistik und Einstellungen enden dagegen oberhalb der Dock-Leiste, damit sie sichtbar und direkt umschaltbar bleibt. Diese Ausbau-Seiten scrollen intern, die Hauptansicht selbst nie.

## Einheiten: eigene Menge, eigener Takt

Bergmann, Fuhrknecht und Wache folgen demselben Muster: **eine eigene Menge in einem eigenen Takt**, unabhängig von allen anderen. Es gibt keine gemeinsame Fuhre, keinen Trupp-Bonus und keinen Sammel-Teiler; der Durchsatz einer Gruppe ist schlicht die Summe ihrer Einheiten. Bei Fuhrknechten und Wachen erhöht ein Stufenaufstieg die Menge **und** verkürzt den Takt. Bergleute takten dagegen fest im Sekundentakt — bei ihnen wächst allein die Fördermenge, und ihre Menge ist damit zugleich ihre Rate.

**Ein Bergmann fördert ganze Goldstücke**: 1, 2, 3, 4, 6, 8, 12, 18, 26 … — dieselbe Kurve wie zuvor (Faktor 1,5), aber auf ganze Stücke aufgerundet, damit jeder Takt ein sichtbares Goldstück liefert statt eines Bruchteils. Aufgerundet wird, nicht gerundet: Nur so wächst die Reihe auf jeder Stufe echt an, statt in den unteren Stufen zweimal denselben Wert zu zeigen. Der Aufschlag von gut der Hälfte steckt im Preis, sodass ein Bergmann pro Gold unverändert dasselbe leistet. Der Beutel führt damit nur noch ganze Zahlen; der Rest-Mechanismus im Zustand (`minerCarry`) bleibt als Garantie erhalten, falls eine Rate je wieder gebrochen wäre.

Daraus folgt die Eigenschaft, an der die ganze Anzeige hängt: Der Zuwachs einer Karte hängt nur an der Einheit, die aufsteigt. Kauft man nebenan, bleibt die Zahl stehen. Bergleute und Fuhrknechte tragen dadurch sogar dieselbe Einheit — beide liefern Gold pro Sekunde — und sind über Kategoriegrenzen hinweg direkt vergleichbar.

**Kein Takt läuft schneller als eine Sekunde.** Das hält die Ankünfte einzeln sichtbar, statt sie zu einem Flimmern zu verschmelzen, und deckelt zugleich die Animationslast: Bei vollem Ausbau liefern höchstens zwölf Einheiten je Sekunde je einmal. Oberhalb dieses Bodens trägt ausschließlich die Menge das weitere Wachstum.

Nachgeholt wird immer in ganzen Takten. Eine durchschlafene Nacht ergibt deshalb exakt dieselbe Menge wie durchgehendes Zusehen, und das Nachrechnen einer vollen Acht-Stunden-Strecke bei Maximalausbau bleibt im Bereich weniger hundert Millisekunden.

**Eine ruhende Einheit hält keinen Takt.** Die Mine ruht, sobald der Beutel voll ist — und ohne Wachen zusätzlich, solange der Spieler von Hand sichert. Ein Bergmann verliert dabei seinen Takt und beginnt ihn neu, sobald es weitergeht. Das ist der Unterschied zwischen *ruhen* und *später nachholen*: Liefe die Uhr während der Ruhe weiter, stünde jede stillgelegte Sekunde danach als fällige Förderung an und käme in einem Schwall auf einmal. Ein stehengelassener Takt wäre außerdem der einzige Weg, auf dem die Tick-Schleife einen fälligen Zeitpunkt hinter ihrem eigenen Cursor fände und nicht mehr von der Stelle käme.

Der volle Beutel bremst die Förderung damit wirklich, statt sie in den Verlust laufen zu lassen: Die letzte Förderung füllt ihn bis zum Rand auf, was in dieser einen Portion darüber hinausgeht, ist der Überlauf, den der Zeitdruck des Beutels vorsieht. Alles Weitere wartet auf die nächste Fuhre — die Mine fördert nicht stundenlang an einem vollen Beutel vorbei.

## Diebstahl und Schutz

Diebstahl findet aktiv und offline statt und greift ausschließlich die **Schatztruhe** an. Gold im Beutel und Ladung unterwegs sind zu kleine Beute, um jemanden zu interessieren — Diebe überfallen Schatzkammern, keine Gürteltaschen.

Damit wirkt jeder Abschnitt genau auf die Ressource, die er besitzt: Die Wachen stehen im Truhen-Abschnitt und verteidigen dessen Gold. Jeder Abschnitt trägt außerdem genau einen Fehlermodus — der Beutel setzt unter **Zeitdruck** (er läuft über, wenn niemand transportiert), die Truhe unter **Sicherheitsdruck** (sie wird bestohlen, wenn niemand sichert).

Der Transport zahlt deshalb nicht mehr in Sicherheit, sondern in **Handlungsfähigkeit**: Nur Truhengold lässt sich ausgeben. Umgekehrt ist ausgegebenes Gold unangreifbar — Ausbauen ist damit immer auch Verteidigen, und Horten hat einen Preis. Wer trotzdem auf ein teures Upgrade sparen will, kauft vorher Wachen.

Das Risiko steigt, sobald Gold in der Schatztruhe liegt; ein voller Hort treibt es schneller. Vor der ersten Lieferung entsteht überhaupt keines — der Abschnitt ist zu diesem Zeitpunkt ohnehin ausgegraut, sodass niemand unter Druck gerät, bevor er die Truhe kennt. Bei 100 % wird ein Anteil der Truhe gestohlen, danach fällt die Anzeige auf einen kleinen Restwert zurück. Wie hoch dieser Anteil ausfällt, hängt an der Wachstärke — sie ist die Schadensbegrenzung, wenn es doch knallt.

Ein Diebeszug und die volle Schatztruhe blenden sich als kurze Meldung über der Szene ein. Nur Warnungen erscheinen dort: Lieferungen und Käufe zeigen ihre Wirkung ohnehin selbst und liefen als Dauerfeuer, sobald die Automatik steht.

Der Anteil ist bewusst klein: Bezugsgröße ist das gesamte Vermögen, nicht der Inhalt einer Tasche. Ohne Wachen nimmt ein Diebeszug 8 % der Truhe, ein ausgebauter Trupp drückt das bis auf 1,5 %. Weil es ein Anteil bleibt, ist der Verlust auf jedem Ausbaustand gleich spürbar und verliert nie an Bedeutung — anders als eine feste Summe, die im späteren Spiel verschwindet.

Ein Gegenmittel steckt in der Truhe selbst: Weil das Risiko am Füllstand hängt, senkt jeder Ausbau der Schatztruhe den Druck. Die Ausrüstungskarte hat damit einen zweiten Zweck neben reiner Kapazität.

Das Sichern durchläuft denselben Bogen wie der Transport: erst mühsam von Hand, dann von Angestellten übernommen.

- **Ohne Wachen** senkt ein Tap auf die Truhe das Risiko um 25 Punkte der Hundert-Punkte-Skala. Währenddessen ruht das ganze Reich für 1,5 Sekunden — die Mine steht still, und Schürfen, Transport und ein zweiter Sicherungs-Tap sind gesperrt, sichtbar als Füllung des Truhen-Buttons. Das Sichern kostet also echte Spielzeit.
- **Ab der ersten Wache** sichert sie selbstständig in ihrem eigenen Takt. Jede Wache trägt ihre eigenen Punkte ab und wird mit jeder Stufe stärker und schneller; ein Trupp-Bonus existiert nicht. Das Reich steht dabei nicht mehr still: Die Mine fördert durch.
- **Der Tap bleibt danach nützlich** — wie die eigene Fuhre neben den Fuhrknechten: Läuft das Risiko zwischen zwei Takten hoch, senkt ein Tap es sofort zusätzlich, ohne die Förderung anzuhalten. Die 1,5 Sekunden belegen weiterhin den Spieler selbst, wie jede seiner Aktionen die beiden anderen belegt.
- **Unterwegs geht keine Wache.** Solange der Spieler seine eigene Fuhre trägt, kann er nicht von Hand sichern. Wer bei hohem Risiko selbst losläuft, geht das bewusst ein — und kauft sich mit der ersten Wache genau davon frei.

Die Wachen-Karte nennt deshalb **„x % alle y s“** — die Punkte, die diese eine Wache je Sicherung abträgt, in derselben Einheit, in der die Risikokachel steigt, und den Takt, in dem sie das tut. Beides gehört ihr allein. Der Schadensdeckel gilt dagegen für den ganzen Trupp und steht als ein Satz über der Gruppe: Es ist der Effekt, den man ausschließlich im Moment des Scheiterns sieht.

Die Wachen bremsen den Anstieg des Risikos bewusst **nicht**. Bremsen, automatisch senken und den Schaden deckeln wären drei sich stapelnde Effekte. Ihr Wert steckt allein in Takt und Stärke der Sicherung.

**Der Anstieg wächst mit der Truhenstufe** (+25 % je Stufe), und zwar aus genau diesem Grund. Ohne den Faktor stand ein fester Deckel von 1,05 %/s gegen Wachen, deren Rate mit jeder Stufe quadratisch zulegt: Drei Wachen der ersten Stufe für 450 Gold stellten das Risiko dauerhaft auf null — und mit ihm den Sicherungs-Tap, den Schadensdeckel und den ganzen Diebstahl-Teil des Spiels. Eine Konstante gegen eine unbegrenzte Gegenkraft kann nur einmal ausgehen.

Mit dem Faktor bleibt der Trupp gefordert, ohne je aussichtslos zu werden — der nötige Ausbau wächst deutlich langsamer als der der Truhe selbst:

| Truhenstufe | Anstieg bei voller Truhe | Truhe kostete bis dahin | nötiger Trupp |
|---|---|---|---|
| 0 | 1,05 %/s | – | 3× Stufe 1 (450 Gold) |
| 4 | 2,10 %/s | 3.782 Gold | 3× Stufe 2 (1.260 Gold) |
| 8 | 3,15 %/s | 48.075 Gold | 4× Stufe 2 (1.680 Gold) |

Der Gegenzug bleibt trotzdem der **Truhenausbau selbst**: Er vervielfacht die Kapazität, der Füllstand fällt damit auf gut 40 % und der Anstieg auf knapp 60 % — mehr, als der Stufenfaktor von höchstens 25 % dagegenhält. Wer ausbaut, verschafft sich also weiterhin sofort Luft und handelt sie gegen einen höheren Sockel ein.

## Offline-Fortschritt

Beim Öffnen oder Zurückkehren in den Tab rekonstruiert dieselbe Engine maximal acht Stunden:

- passiven Abbau,
- Abbaupausen bei der eigenen Reise,
- diskrete Reisen,
- automatisierte Folgereisen,
- Überfüllungsverluste,
- Diebesgefahr, automatische Sicherungen der Wachen und Diebeszüge,
- Grenzen der Schatztruhe.

Weil der Diebstahl jetzt die Schatztruhe trifft, braucht die Offline-Strecke einen Deckel: Ein Aufenthalt nimmt höchstens ein Viertel dessen mit, was auf der Strecke Truhengold war — also der Stand beim Verlassen plus alles, was die Fuhren inzwischen angeliefert haben. Ohne diesen Bezug auf die Lieferungen wäre eine bei Abschied leere Truhe die ganze Nacht über unantastbar. Läuft das Budget aus, fällt das Risiko weiterhin zurück, damit die Rückkehr nicht in einem sofortigen Überfall endet.

Ein Rückkehrdialog fasst geschürftes, gesichertes und gestohlenes Gold zusammen. Die Simulationslogik ist zeitbasiert und unabhängig von der Bildrate.

## Savegame, Audio und Technik

Der Spielstand liegt lokal im Browser und enthält eine `schemaVersion`, Timestamps, Upgrades, Bestände, Lebenszeitstatistiken und Ereigniszähler. Schema 6 speichert für Bergleute, Transporteure und Wachen jeweils vier Level und dazu deren eigene Takte: je Bergmann und je Wache den Zeitpunkt der letzten Lieferung, je Fuhrknecht die laufende Fuhre, dazu die eigene Fuhre des Spielers. Schema 4 und 5 kannten stattdessen eine einzige gemeinsame Fuhre; beim Übergang wandert Gold, das noch auf der Straße lag, zurück in den Beutel — die einzige Variante, bei der weder etwas verschwindet noch ungeprüft in der Truhe auftaucht. Ältere Fortschritte aus Schema 1–3 werden zusätzlich gleichmäßig auf die passenden vier Slots verteilt. Autosave erfolgt regelmäßig und beim Verlassen des Tabs.

Schläge, Käufe und abgeschlossene Reisen besitzen kurze synthetisierte Soundeffekte. Unterstützte Browser erhalten dezente Vibrationen. Reduzierte Bewegungseinstellungen des Betriebssystems werden respektiert.

- React, TypeScript und Vite
- UI-unabhängige TypeScript-Spielengine
- Vitest für Engine- und Offline-Regeln
- generierte PNG-Pixel-Sprites mit transparentem Hintergrund
- `vite-plugin-pwa` für Manifest und Service Worker
- GitHub Actions für Tests, Build und Pages-Deployment
- Local Storage mit versioniertem Savegame

Prestige, Cloud-Sync, App-Store-Pakete und Monetarisierung folgen erst, wenn der Kernloop anhand des Vertical Slice validiert wurde.
