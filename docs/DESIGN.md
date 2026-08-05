# Vault Run – Produkt- und Technik-Spezifikation

## Vision

Der Spieler beginnt als einzelner Goldsucher mit einer rostigen Pickhacke. Aus der kleinen Mine entsteht schrittweise ein sagenhaftes Schatzreich mit Bergleuten, Lasttieren, Kutschen und einer immer prächtigeren Schatztruhe. Der Name „Vault Run“ bezeichnet die regelmäßige Reise mit dem frisch geschürften Gold zum sicheren Schatzlager.

Die erste Version ist ein optisch polierter Vertical Slice für Browser und PWA. Smartphone-Hochformat ist die primäre Oberfläche; Desktop erhält eine eigene vollwertige Anordnung. Die Architektur soll eine spätere Capacitor-App ermöglichen. Sprache ist zunächst Deutsch, das bevorzugte Monetarisierungsmodell wäre ein Einmalkauf.

## Kernloop ab dem ersten Schlag

```text
Mine → Lager → zeitlicher Transport → Schatztruhe → Ausbau
```

Mine, Lager und Schatztruhe sind von Anfang an als drei gleich große Abschnitte sichtbar. Nur Gold in der Schatztruhe ist ausgebbar.

Das **Lager** ist der Haufen am Stollenmund: Die Bergleute werfen hinein, der Spieler und seine Fuhrknechte laden daraus ab. Es hieß bis Schema 7 „Beutel“ — ein Name, der die Kette falsch erzählte, denn vier angestellte Bergleute füllen keine Gürteltasche. Der **Beutel** ist seither das, was der Spieler selbst schultert.

Zu Beginn übernimmt der Spieler den Transport selbst. Während er unterwegs ist, kann er nicht schürfen und auch seine Bergleute pausieren. Der erste Fuhrknecht automatisiert Reisen und beendet diese Abbaupause. Jeder der vier gleichwertigen Transport-Slots wird separat gelevelt und fährt seine eigene Fuhre: eigene Ladung, eigene Fahrzeit, eigene Ankunft. Die sichtbare Progression führt weiterhin vom Läufer über Packpferd und Schatzkarren zur königlichen Kutsche.

## Aktiv und idle

- Ein Schlag auf „Schürfen“ erzeugt Gold im Lager.
- Pickhacken-Upgrades erhöhen den Wert eines Schlages.
- Vier separat levelbare Bergleute fördern gemeinsam passiv Gold.
- Aktives Schürfen bleibt dauerhaft lohnend, wird aber relativ zum automatisierten Abbau weniger wichtig.
- Der Spieler soll in kurzen aktiven Phasen ausbauen und optimieren können, danach aber sinnvoll idle fortschreiten.
- Ein Run soll mehrere Tage tragen. Prestige ist noch nicht Teil des Vertical Slice; das Savegame ist dafür versioniert vorbereitet.

## Kette und Engpässe

| Abschnitt | Hauptaktion | Ausrüstung des Spielers | Behälter | Vier rechte Slots |
|---|---|---|---|---|
| Mine | Gold schürfen | Pickhacke | – | vier Bergleute |
| Lager | Transport starten | Beutel, Stiefel | Lager | vier Fuhrknechte/Gespanne |
| Truhe | Risiko senken (anfangs blockierend) | Grubenlampe, Stiefel | Schatztruhe | vier Wachen |

**Eine Person, eine Handlung.** Schürfen, die eigene Fuhre und die Sicherung von Hand sind die drei Aktionen des Spielers — und er hat nur ein Paar Hände. Jede laufende Aktion sperrt darum die beiden anderen: Wer die Fuhre zur Truhe trägt, steht nicht gleichzeitig Wache und schlägt nicht nebenbei Gold aus dem Fels. Der Schlag mit der Pickhacke sperrt selbst nichts, weil er keine Zeit dauert; gesperrt wird immer von der Aktion, die läuft. Ihren Fortschritt zeigt ausschließlich der Button, der sie ausgelöst hat — die beiden anderen sind für diese Zeit ausgegraut. So sagt die Szene in einem Blick, **welche** Handlung den Spieler bindet und wie lange noch.

Die Erschöpfung ist der vierte Zeitgeber und gehört allein der Mine: Bei 100 % steht der Spieler vier Sekunden am Fels und kann nicht schlagen. Sie sperrt Fuhre und Wachgang **nicht** — wer zu müde zum Hacken ist, kann immer noch laufen — und läuft darum als Füllung auf dem Minen-Button ab, ohne die anderen beiden anzurühren. Mit der früheren Dreiviertelsekunde war die Pause kürzer als die Reaktion, die sie erzwingen sollte: Wer schnell genug tippte, merkte sie kaum, und der einzige Preis des Dauerschürfens kostete nichts.

Davon zu trennen ist, was eine Aktion mit dem **Reich** macht — nämlich nichts. **Eine Handlung des Spielers hält keine Automatik an.** Trägt er selbst eine Fuhre zur Truhe oder steht er selbst Wache, fördern seine Bergleute weiter und seine Fuhrknechte fahren weiter; Angestellte legen die Arbeit nicht nieder, weil ihr Dienstherr mit anpackt. Das gilt auch, solange noch niemand angestellt ist: Die Sperre trifft immer nur seine eigenen drei Aktionen, nie das Reich. Was ihn eine manuelle Aktion kostet, ist damit genau ihre Dauer an eigener Handlungsfähigkeit — und nicht zusätzlich der Stillstand aller Angestellten.

**Eigene und automatische Fuhre sind getrennte Größen.** Was der Spieler selbst zur Truhe trägt, ist seine eigene Tragkraft (25 Gold in 12 s auf der ersten Stufe seiner Ausrüstung) — kein Mindestmaß der Fuhrknechte, sondern eine Zahl daneben, so wie der eigene Schlag neben den Bergleuten steht. Er kann jederzeit zusätzlich losziehen, während die Fuhrknechte fahren. Solange beides ein gemeinsamer Boden war, deckte die eigene Tragkraft die ersten Fuhrknecht-Stufen mit ab: Sie kosteten Gold und veränderten die Fuhre nicht.

**Gold gehört einem Behälter, wenn es dort angekommen ist — auf beiden Strecken.** Was ein Bergmann aus dem Fels schlägt und was der Spieler selbst schlägt, liegt nicht sofort im Lager, sondern fliegt die 0,9 Sekunden seiner Animation dorthin; erst beim Aufschlag zählt es. Genau so legt eine Fuhre ihre Ladung erst nach der Ankunftsanimation in der Truhe ab. Bis eben galt die Regel nur für die Fuhre, während der Schlag sein Gold sofort ins Lager buchte und die fliegende Münze bloß hinterherflog — dieselbe Animation bedeutete an den beiden Enden der Kette Verschiedenes.

Der Platz im Ziel ist dabei **ab dem Losfliegen belegt**, auf beiden Strecken aus demselben Grund: Sonst schlüge der Spieler weiter gegen ein Lager, das gleich voll ist, und bezahlte jeden dieser Schläge mit Erschöpfung für Gold, das bei der Ankunft keinen Platz mehr fände — so wie mehrere gleichzeitig fahrende Fuhren zusammen mehr einpackten, als in die Truhe passt. Gezählt wird trotzdem am Fels: `lifetimeGold` ist, was **gefördert** wurde, und der Überlauf entsteht dort, wo er nicht mehr ins Lager passt. Weil der Platz reserviert ist, kommt jedes losgeschickte Goldstück auch an.

Anzeige und Sperre lesen deshalb zwei verschiedene Größen, und das mit Absicht. Die Kachel zeigt, was **drinliegt** — in beiden Behältern gleich und in beiden erst nach der Ankunft, sonst hinge dieselbe Animation wieder an zwei verschiedenen Regeln. Ob der nächste Schlag noch hineinpasst, entscheidet dagegen der **freie Platz**, in dem das Fliegende schon vergeben ist. Beide fallen nur für die knappe Sekunde eines Fluges auseinander: Der Minen-Button kann dann ausgegraut sein, während die Kachel noch 98 % meldet — die letzte Portion ist unterwegs und das Lager damit vergeben.

Der Transport bleibt immer diskret. Die angegebene Reisezeit bezeichnet Hin- und Rückweg zusammen. Zu Reisebeginn nimmt ein Träger seine Ladung aus dem Lager; sie bleibt bis zur sichtbaren Ankunft seines Goldhaufens an ihm gebunden. Nach der 0,9-sekündigen Ankunftsanimation wird sie in der Schatztruhe abgelegt; seine Rückkehr läuft davon unabhängig bis zu ihrem unveränderten Ende weiter. Neues Gold bleibt im Lager. Keine Reise nimmt mehr mit, als noch in die Schatztruhe passt — dabei zählt alles mit, was gerade unterwegs ist, sonst packten mehrere gleichzeitig fahrende Träger zusammen mehr ein als am Ziel hineinpasst.

Die Transportaktion startet die eigene Reise. Sie läuft jederzeit parallel zu den Fuhrknechten — nach dem ersten Fuhrknecht ändert sich an ihr nichts außer, dass sie die Mine nicht mehr anhält. Die Reise bleibt vollständig zeitbasiert. Eine kurze fliegende Goldhaufen-Animation visualisiert nur die übertragene Menge; sie bildet bewusst nicht die gesamte Reisezeit ab.

## Die Ausrüstung des Spielers

Der Spieler hat drei Handlungen — schürfen, seine eigene Fuhre tragen, von Hand Wache gehen — und für jede ein Ausrüstungsstück, das sie besser macht. Vorher war nur der Schlag ausbaubar: Fuhre und Wachgang standen als feste Zahlen (20 Gold in 12 s, 25 Punkte in 1,5 s) gegen eine Automatik, die unbegrenzt wächst. Aktives Spiel hörte damit zwangsläufig auf, sich zu lohnen — nicht als Balancing-Entscheidung, sondern weil eine Konstante gegen eine unbegrenzte Gegenkraft nur einmal ausgehen kann. Dasselbe Argument steht hinter dem Risiko-Faktor je Truhenstufe.

| Stück | Attribut | Wirkt auf | Kurve |
|---|---|---|---|
| Pickhacke | Fördermenge | den eigenen Schlag | ×1,42 je Stufe |
| Beutel | Ladung | die eigene Fuhre | ×1,5 je Stufe, gedeckelt aufs Lager |
| Stiefel | Dauer | Fuhre **und** Wachgang | ×0,88 je Stufe |
| Grubenlampe | Sichtweite | den Wachgang | ×1,25 je Stufe |

**Die Stiefel wirken bewusst auf zwei Handlungen.** Das ist kein Sonderfall, sondern dieselbe Regel: Fuhre und Wachgang sind beide Wege, die der Spieler zu Fuß zurücklegt. Wären sie nur der Fuhre zugeschlagen, bliebe die Dauer des Wachgangs der einzige Teil von ihm, der nie besser wird — und der Wachgang von Hand damit ab dem dritten Wachposten überflüssig, obwohl er als Reaktionsmittel zwischen zwei Wachtakten gebraucht wird.

Beide Wege haben einen Boden, aber nicht denselben: Die Fuhre liegt auf `MIN_CYCLE_SECONDS` wie jeder andere Takt, weil sie eine Ankunftsanimation auslöst. Der Wachgang liegt darunter, bei einer halben Sekunde — er ist kein Takt einer Automatik, sondern ein Tastendruck. Tiefer darf er nicht, weil die Sperre der beiden anderen Aktionen sonst nicht mehr zu spüren wäre, und genau diese Sperre ist sein Preis.

**Der Beutel ist auf die Lagergröße gedeckelt.** Mehr, als der Haufen fasst, schultert niemand. Ohne den Deckel wäre ein Beutel über der Lagergröße ein Kauf ohne Wirkung; mit ihm zeigt die Karte vorher und nachher dieselbe Zahl und sagt damit selbst, dass zuerst das Lager wachsen muss — nach derselben Regel, nach der jede wirkungslose Stufe sich zu erkennen gibt.

Ladung und Dauer multiplizieren sich zum manuellen Durchsatz (Ladung ÷ Dauer); an diesem Paar hängt die Skalierung des aktiven Spiels, und die Stiefel sind deshalb das teuerste Stück. Auf Stufe 5 beider Stücke trägt der Spieler 127 Gold in 7,2 s, also 17,6 Gold/s, für zusammen rund 2.700 Gold — vier Fuhrknechte auf Stufe 3 leisten dasselbe für rund 4.300 Gold. Aktives Spiel schlägt die Automatik pro Gold um gut ein Drittel und muss dafür anwesend sein.

Die Grubenlampe zählt in denselben Punkten wie eine Wache und trägt deshalb dieselbe Beschriftung: **Sichtweite**. Dieselbe Beschriftung heißt dieselbe Skala — Lampe und Wache sind unmittelbar gegeneinander abwägbar. Sie hieß bis zur Einführung der Wachen-Kraft „Kraft“: Eine Lampe hat keine Kraft, sie leuchtet, und was ein Wachgang abträgt, ist abgesuchtes Gelände. „Kraft“ beschreibt seither die Handfestigkeit der Wachen im Ernstfall — eine andere Größe, die auch anders heißen muss. Dass der Spieler dabei weit über jeder einzelnen Wache liegt, ist beabsichtigt: Er bezahlt seine Punkte mit eigener Zeit, in der er weder fördert noch trägt, die Wache bezahlt sie einmalig mit Gold.

Die sechs Ausrüstungskarten sind nach dieser Trennung auf die Reiter verteilt: Die vier Stücke am Körper des Spielers stehen zusammen unter **Ausrüstung**, die beiden Behälter des Reiches jeweils bei ihrem Abschnitt — das Lager unter **Lager**, die Schatztruhe unter **Truhe**. Sie gehören dem Reich, nicht dem Spieler, und wer sie in der Szene antippt, will sie ausbauen und nicht erst an einer Pickhacke vorbeiscrollen. Jede Karte trägt ein eigenes Sprite — zwei Karten mit demselben Bild wären nicht unterscheidbar.

## Oberfläche und Art Direction

Die Hauptszene ist auf Smartphones fest auf `100dvh` ausgelegt und scrollt nicht. Zwischen Header und Dock-Leiste liegen von oben nach unten Truhe, Lager und Mine als drei exakt gleich hohe Abschnitte. Ein Pixel-Art-Trennstreifen mit dem Balken des Abschnitts benennt ihn. Darunter steht links das **Bild des Ortes** samt seinem Stand, mittig die Hauptaktion sowie rechts vier Slot-Upgrades im 2×2-Raster.

Die linke Spalte trug bis eben eine große Stat-Kachel mit je einer Rate. Sie beschrieb den Durchsatz des Reiches — eine Zahl, die man gegen die des Nachbarabschnitts liest, während der Blick beim Spielen auf dem Button liegt. Die Kachel bleibt, ihr Inhalt wechselt: Auf ihr steht jetzt das Sprite, das vorher auf dem Aktions-Button saß, und darunter das, worauf man tatsächlich handelt. Dieselbe Kachel liegt auch unter dem 2×2-Raster rechts. Ein Abschnitt liest sich damit als drei Blöcke gleicher Bauart — **Ort, Handlung, Leute** —, statt als eine gerahmte Fläche neben vier frei schwebenden Knöpfen; und weil jeder Block eine sichtbare Grenze hat, hat auch jeder Goldflug einen sichtbaren Anfang und ein sichtbares Ende:

- **Truhe:** die Schatztruhe in ihrer aktuellen Ausbaustufe, darunter das Wort **Füllstand** und darunter, wie voll sie ist — in Prozent.
- **Lager:** der Erzhaufen in seiner aktuellen Ausbaustufe, ebenso mit seinem Füllstand.

Beide Kacheln trugen bis eben ihre **Kapazität** als absolute Zahl. Die war zwar größer, aber nie eine Handlungsaufforderung: Sie änderte sich nur beim Kauf, und was der Spieler wissen muss, ist nicht, wie viel hineinpasst, sondern wie viel noch hineinpasst. Genau das steht jetzt dort. Die Grenze selbst steht weiterhin auf der Upgrade-Karte des Behälters — dort mit ihrem Wert nach dem Kauf daneben, also da, wo sie überhaupt zu einer Entscheidung gehört.

Die Zahl trägt dieselbe Ampel wie die Balken — ruhig bis 75 %, gelb darüber, rot ab 90 %, kräftiges Rot bei 100 % —, allerdings in dunkleren Tönen: Die Balkenfarben sind für helle Schrift auf dunklem Braun gemischt und verschwänden auf dem hellen Pergament der Kachel. Gerundet wird abwärts, damit **100 %** ein Zustand bleibt und keine Rundung von 99,7 %; gefärbt wird ausschließlich die Zahl — die Beschriftung darüber steht in jedem Zustand da und hieße mitgefärbt nur, dass zweimal dasselbe gesagt wird.

Beschriftung **über** dem Wert, beides mittig: Nebeneinander teilten sich Wort und Zahl die Breite der Kachel, und die Beschriftung wäre als erstes weggeschnitten worden.
- **Mine:** das Bild der Goldmine. Sie ist der einzige Abschnitt ohne Behälter und trägt darum keine Zahlen: Was hier entsteht, liegt eine Sekunde später im Lager.

Der Balken über dem Abschnitt zeigt unverändert seinen einen Fehlermodus — Risiko, Lagerfüllung, Erschöpfung. Das Risiko startet bei 0 %, steigt, solange Gold in der Schatztruhe liegt, und löst bei 100 % den Diebeszug aus; eine Sicherung drückt es wieder herunter. Je voller der Hort, desto schneller steigt es.

Auf den Aktions-Buttons steht deshalb die **Handlung**, nicht mehr der Gegenstand: die Pickhacke in der Mine (die dort schon immer die Handlung war), ein Goldsack mit Richtungspfeil für den Transport und ein Wächter mit Laterne für den Wachgang. Die beiden neuen Icons sind vorerst Platzhalter aus `scripts/generate-sprites.py` und werden später durch gezeichnete ersetzt.

Unter dem Bild steht **im Button** sein Verb: **Bewachen**, **Transportieren**, **Graben**. Darunter standen vorher Sichtweite, Ladung und Fördermenge — Werte der Ausrüstung, die auf ihren Upgrade-Karten ohnehin mit Vorher und Nachher stehen und die offenließen, was der Knopf überhaupt tut. Die Beschriftung gehört zum Knopf und sitzt deshalb auf ihm; während eines Cooldowns läuft die goldene Füllung durch sie hindurch, weshalb sie eine harte Kontur nach allen vier Seiten trägt und auf Holz wie auf Gold lesbar bleibt.

Die Truhe zeigt bewusst ein **steigendes Risiko** statt einer fallenden Aufmerksamkeit. Entscheidend ist die Kausalität: „volle Truhe → hohes Risiko“ ist ein Schritt, während „volle Truhe → sinkende Aufmerksamkeit“ eine Geschichte bräuchte, warum die eigenen Leute nachlässiger werden, je mehr Gold da liegt. Die Aufmerksamkeit, die tatsächlich steigt, ist die der Diebe — das Label beschrieb den falschen Akteur. Dass diese Anzeige als einzige nicht „höher ist besser“ liest, ist kein Bruch: Sie zeigt einen **Füllstand, der auf ein Ereignis zuläuft**, und ein Balken, der sich Richtung Rot füllt, ist dafür das gewohnte Bild.

Ab 75 % färbt sich der Balken, ab 90 % pocht zusätzlich die Sicherung — die Vorwarnung, die dem Spieler ein Reaktionsfenster gibt, statt ihn von einer stillen Zahl überraschen zu lassen.

**Ein Cooldown läuft nur auf dem Button, der ihn ausgelöst hat.** Die eigene Fuhre füllt den Lager-Button, der Wachgang den Truhen-Button, die Zwangspause bei voller Erschöpfung den Minen-Button — jeweils als von unten nach oben wachsende goldene Füllung. Die beiden jeweils anderen Buttons sind für diese Zeit schlicht ausgegraut. Vorher füllten sich alle drei gleichzeitig mit demselben Fortschritt: Das las sich, als liefen drei Dinge parallel, und verschwieg dabei genau die Information, auf die es ankommt — welche Aktion den Spieler gerade bindet. Ein ausgegrauter Button sagt „jetzt nicht“, und der eine laufende sagt, warum. Ist das Lager voll, pulsiert die Transportaktion. Die Schatztruhe bleibt bis zur ersten Goldlieferung ausgegraut. **Gold fliegt von dem, der es liefert, zu dem, der es aufnimmt.** Was der Spieler selbst tut, startet an seinem Button: der Schlag am Minen-Button, die eigene Fuhre am Lager-Button. Was seine Angestellten tun, startet an ihrem Slot-Raster rechts: die Förderung eines Bergmanns am Raster der Mine, die Fuhre eines Fuhrknechts am Raster des Lagers. Ziel ist in beiden Fällen der Behälter, in dem das Gold landet — die Kachel links im nächsten Abschnitt, Lager bzw. Truhe. Vorher flog alles zwischen den Aktions-Buttons, als käme die Förderung eines Bergmanns aus der Hand des Spielers und landete in seinem Beutel. Jede Förderung fliegt einzeln mit ihrer eigenen Menge, jede abfahrende Fuhre als eigener Goldhaufen, und jede Sicherung lässt die Truhe kurz aufleuchten. Weil kein Takt schneller als eine Sekunde läuft, bleibt die Zahl gleichzeitiger Animationen auch bei vollem Ausbau überschaubar.

**Die drei Spalten stehen symmetrisch zur Mittelachse — gemessen an dem, was man sieht.** Der harte Pixelschatten fällt nur nach rechts und gehört trotzdem zum Knopf: Bei gleichem Rand auf beiden Seiten stünde die rechte Kachel um seine drei Pixel näher am Rand als die linke. Der rechte Innenabstand des Abschnitts liegt deshalb um genau diese Schattenbreite höher, in jedem Breakpoint. Auf dem Desktop stehen die drei Spalten zusätzlich zentriert statt am linken Rand — die festen Spaltenbreiten ließen dort über hundert Pixel Luft, die vollständig rechts lag.

Ein **unbesetzter Slot** zeigt kein Bild, sondern das Wort **Leer** in der Pixelschrift. Vorher stand dort die ausgegraute Grafik des ersten Rangs — ein Bild von jemandem, der gar nicht da ist, und aus Armlänge kaum von einem besetzten Slot zu unterscheiden. Das „+“ in der Ecke bleibt: An seiner Stelle steht bei besetzten Slots die Stufe, und es sagt, dass hier jemand angeheuert wird.

**Alle drei Spalten sind Knöpfe und sehen auch so aus.** Rahmen, Radius, harter Pixelschatten und der Tastendruck von drei Pixeln nach unten sind dieselben wie beim Aktions-Button in der Mitte — was anklickbar ist, sieht im ganzen Spiel gleich aus. Die vier Slot-Kacheln haben dafür ihren eigenen Schlagschatten abgegeben: Zwei gestapelte Schattenebenen lasen sich als vier Knöpfe auf einem Brett statt als ein Knopf mit vier Feldern. Der Druck gilt der ganzen Fläche, auch wenn er eine einzelne Slot-Kachel trifft — gedrückt wird der Block, geöffnet die Karte darunter.

Der Stil ist Fantasy-Pixel-Art mit warmem Pergament, dunklem Holz, Stein, Kupfer und Gold. Harte Rahmen, blockige Schatten und segmentierte Balken ersetzen die vorherigen weichen, modernen Flächen. `Jersey 10` wird lokal gebündelt und durchgängig in ausreichend großen Rastergrößen eingesetzt. Eine kontrastarme Pixelminen-Kulisse mit Stollenbalken, Steinraster und vereinzelten Erzpunkten belebt den Hintergrund, ohne mit den Bedienelementen zu konkurrieren. Goldbeträge und Schürfanimationen verwenden dieselbe code-native 16×16-Pixelmünze.

Die Haupt- und Upgrade-Icons zeigen sichtbare Progression:

- Pickhacke: rostig → Eisen → Stahl → Gold
- Beutel: löchriger Lederbeutel → verstärkter Goldbeutel → Bergmannssack → königlicher Goldsack
- Stiefel: durchgelaufene Schuhe → genagelte Arbeitsschuhe → Lederstiefel → Grubenstiefel
- Grubenlampe: Talgfunzel → Blechlaterne → Hornlaterne → Spiegelöllampe
- Lager: loser Erzhaufen → Bretterverschlag → Erzkörbe → gezimmerter Schuppen
- Schatztruhe: Holzkiste → Eisentruhe → Prunktruhe → Juwelentruhe
- Reise: Läufer → Packpferd → Schatzkarren → Königskutsche
- Schutz: Eisenschloss → Wachhund → Wachturm → Königsgarde → Schatzfestung

Drei Bilder kennen dagegen keine Stufen, weil sich an ihnen nichts ausbauen lässt: die beiden Handlungs-Icons „Gold transportieren“ und „Wache gehen“ auf ihren Aktions-Buttons und die Goldmine in der linken Spalte des Minen-Abschnitts. Alle drei stammen vorerst aus `scripts/generate-sprites.py` und sind als Platzhalter gekennzeichnet.

Ein kompakter Header zeigt ausschließlich das sichere Gold. Die gesamte Navigation liegt in einer festen Dock-Leiste am unteren Rand: Statistik, mittig der Ausbau als häufigstes Ziel, Einstellungen. Sie berücksichtigt `env(safe-area-inset-bottom)` für die iOS-Home-Bar sowie die seitlichen Insets, sodass abgerundete Displayecken keinen Button beschneiden; ohne Insets bleibt ein Mindestabstand. Sounds und der zweistufig bestätigte Spielneustart liegen weiterhin ausschließlich im Einstellungs-Popup.

Alle Käufe laufen über ein einziges Ausbau-Popup. Sein Kopfbereich scrollt nicht mit: oben stehen das Ausbau-Icon mit dem Titel „Upgrades“ und rechts das Schließen-X, darunter die Filterzeile. Nur die Kartenliste darunter scrollt. Gefiltert wird über vier Chips: **Ausrüstung** (Pickhacke, Beutel, Stiefel, Grubenlampe), **Mine**, **Lager** und **Truhe**. Drei der vier Reiter heißen damit wie die Abschnitte der Szene und zeigen genau das, was dort steht — die Truhe mit ihren Wachen, das Lager mit seinen Fuhrknechten, die Mine mit ihren Bergleuten. Vorher waren sie nach den Angestellten benannt (Bergleute, Transport, Wachen): Dann führte ein Tap auf die Truhe zu einem Reiter „Wachen“, und der Behälter, den man gerade angetippt hatte, lag unter „Ausrüstung“ woanders. Ein Reiter zerfällt dafür in bis zu zwei Blöcke mit eigener Überschrift — erst der Behälter des Abschnitts, dann seine Angestellten. Getrennt, weil der Gruppenhinweis nur den Angestellten gilt: „Jeder Fuhrknecht fährt für sich“ erklärt keine Lagererweiterung.

Einen fünften Chip **Alle** gab es bis eben. Er zeigte alle vier Kategorien untereinander und war damit nur die längste Fassung dessen, was die vier anderen einzeln sagen; zugleich konnte er als einziger nichts abhaken, weil er auf keine Kategorie zeigte, und trug deshalb auch nie einen Punkt. Der Dock-Button öffnet seither den ersten Reiter, **Ausrüstung**. Die Chips stehen immer in einer einzigen Zeile, brechen nie um und teilen die volle Breite unter sich auf — proportional zur Länge ihrer Beschriftung, sodass rechts kein Rest frei bleibt. Eine Fläche trägt nur der aktive Chip. Ein kleiner roter Punkt hinter der Beschriftung meldet, dass eine Kategorie ein bezahlbares Upgrade enthält, das noch niemand angesehen hat: Wer den Chip auswählt, hakt die aktuellen Angebote dieser Kategorie ab und der Punkt verschwindet, bis ein weiteres Upgrade erreichbar wird — auch ein Kauf zählt, weil er den Preis der nächsten Stufe verändert. Der Punkt liegt per negativem rechten Außenabstand ohne eigene Laufweite an der Beschriftung, sodass die Chip-Breite unverändert bleibt und die Zeile beim Wechsel des Goldstands nicht springt. Die genaue Anzahl steht im Vorlesenamen des Chips. Der Punkt des Dock-Buttons zählt dagegen alles Ungesehene über alle Reiter hinweg — er ist der Weg ins Sheet, wenn man noch nicht weiß, wohin. Ein Tap auf einen der vier rechten Slots eines Abschnitts öffnet das Popup, wählt den Reiter dieses Abschnitts und scrollt den gewählten Slot fokussiert in den Blick; ein Tap auf die Kachel links öffnet **denselben** Reiter, wo ganz oben der Behälter steht, den man angetippt hat. Beide Spalten eines Abschnitts führen damit an denselben Ort, und jeder sichtbare Gegenstand der Szene führt zu der Karte, auf der er sich verbessern lässt — die Abschnitte brauchen keinen eigenen Ausbau-Button. Jede Upgrade-Karte beantwortet in fester Reihenfolge drei Fragen — *Was ist das? Was bringt der Aufstieg? Was kostet er?* — und ist dafür gleich aufgebaut: links das vertikal zentrierte Sprite, rechts daneben oben der sprechende Name der aktuellen Ausbaustufe (bei Slots gefolgt von einer kleinen Slot-Nummer, da vier Slots derselben Stufe sonst identisch hießen), darunter die Aufstiegszeile „Stufe k → k+1“, darunter der Zuwachs und rechts daneben der Kauf-Button. Der Name der **nächsten** Stufe stand bis eben rechts neben der Aufstiegszeile und ist entfallen: Er war die einzige Zeile der Tabelle, die keinen Wert verglich, und hielt damit ausgerechnet in der ersten Zeile die Spalte auf, in der überall darunter das Attribut steht. Wie die Einheit nach dem Kauf heißt, sagt die Karte unmittelbar danach selbst. Slots zählen ab Stufe 0 (unbesetzt), Ausrüstung ab Stufe 1.

Der mittlere Teil jeder Karte ist eine **Attributtabelle**: je Zeile ein Wert vor und nach dem Kauf, dahinter sein Name. Die Stufe führt sie an und trägt den Rang, den die Einheit danach hat.

```text
Stufe 2   →  Stufe 3    Wachturm
8         →  10         Sichtweite
8,9       →  7,1        Dauer
```

Die drei Wertespalten sind inhaltsbreit und über alle Zeilen geteilt, sodass die Pfeile untereinander stehen und man die Karte in einer Blickachse hinunterliest. In den Zellen stehen **reine Zahlen**: Die Einheit stand hinter jedem Nachher-Wert und wiederholte, was der Attributname rechts daneben längst sagt — „Kraft“ braucht kein `%`, „Dauer“ kein `s`, „Fördermenge“ kein `/s`. Ein unbesetzter Slot hat keinen Vorher-Wert und zeigt dort einen Strich statt einer erfundenen Null. Bringt eine Stufe rechnerisch nichts, steht links dieselbe Zahl wie rechts — eine Karte, die zum Kauf auffordert, muss das zeigen.

Benannt wird jeweils die Größe, die sich bewegt: Eine Wache hat **Sichtweite**, **Dauer** und **Kraft** — was eine Sicherung abträgt, wie lange sie bis zur nächsten braucht und was sie beiträgt, wenn es doch knallt —, nicht „Risiko -x %“. Pickhacke und Bergmann heißen beide **Fördermenge**, weil beide dasselbe tun; Beutel und Fuhrknecht beide **Ladung**, Grubenlampe und Wache beide **Sichtweite**. Lager und Truhe heißen **Kapazität** — auf ihrer Karte, wo die Grenze zu einer Entscheidung gehört; in der Szene steht statt ihrer der **Füllstand**. Die Stiefel führen zwei Dauerzeilen, weil sie zwei Wege verkürzen: **Dauer Fuhre** und **Dauer Wachgang**.

Aufgeführt sind die Eigenschaften der Einheit selbst, nicht deren Quotient: Ein Fuhrknecht nennt **Ladung** und **Dauer**. Die Dauerleistung in Gold bzw. Prozent je Sekunde steht nicht zusätzlich dabei — sie folgt aus beiden Zeilen und wäre nur eine dritte Schreibweise derselben Sache. Bergleute takten fest im Sekundentakt und brauchen deshalb keine Zeile dafür; bei ihnen sind Menge und Rate dasselbe.

Auf schmalen Geräten rückt die Tabelle unter Bild, Name und Preis über die volle Kartenbreite — in der mittleren Spalte bliebe für die Namen sonst zu wenig Platz.

Diese Zeilen **dürfen sich nicht ändern, wenn nebenan gekauft wird**. Fördermenge und Ladung gehören dem Slot allein und erfüllen das von selbst; die Sicherungskraft ist wenigstens additiv und wächst je Stufe um denselben Betrag. Was mehrere Slots dagegen nur gemeinsam bewirken — die kürzere Fahrzeit, der Takt des Wachtrupps, der Schadensdeckel — hätte auf keiner einzelnen Karte eine Zahl, die nur zu ihr gehört, und steht darum im Hinweis über der Gruppe.

So lassen sich zwei Angebote ohne Kopfrechnen vergleichen: Vier Wachen-Karten bringen alle zwei Punkte Sichtweite, also entscheidet allein der Preis — 150 statt 487. Ein unbesetzter Fuhrknecht bringt für 180 Gold 12 Ladung, der Aufstieg des besten für 571 nur 10 mehr.

Fließtext steht nur dort, wo keine Zahl ihn ersetzt, und nur einmal. Was für alle vier Karten einer Gruppe gilt, steht als ein Satz unter der Gruppenüberschrift statt viermal auf den Karten; die Gruppenüberschrift trennt deshalb auch innerhalb eines Reiters den Behälter von den Angestellten. Die sechs Ausrüstungskarten tun jeweils etwas anderes und tragen ihren Hinweis darum selbst — und er nennt bewusst keine Zahl aus der Tabelle, sondern die Folge, die aus ihr nicht hervorgeht („Ist das Lager voll, ruht die Mine bis zur nächsten Fuhre“). Bei der Spielerausrüstung steht dort zuerst, dass sie nur wirkt, wenn er selbst zugreift. Jeder Strang hat zehn benannte Stufen — sie stehen mit ihren Beschreibungen in [`stufen.md`](./stufen.md) —, während die vier Sprite-Stufen schon vorher austauchen; oberhalb der zehnten bleibt der höchste Name stehen, während die Stufennummer weiterzählt. Noch nicht gekaufte Slot-Karten sind mit Ausnahme ihres Kauf-Buttons ausgegraut. Das Ausbau-Popup fährt von unten ein und beim Schließen wieder nach unten aus; es legt sich dabei über die Dock-Leiste. In der Desktop-Ansicht hängt es rechts und fährt entsprechend seitlich ein. Weil ein Ausfahren einen Startzustand im DOM braucht, bleibt das Sheet dauerhaft montiert und wird nur über eine Klasse umgeschaltet; geschlossen ist es per `visibility` weder anklick- noch vorlesbar. Statistik und Einstellungen enden dagegen oberhalb der Dock-Leiste, damit sie sichtbar und direkt umschaltbar bleibt. Diese Ausbau-Seiten scrollen intern, die Hauptansicht selbst nie.

## Einheiten: eigene Menge, eigener Takt

Bergmann, Fuhrknecht und Wache folgen demselben Muster: **eine eigene Menge in einem eigenen Takt**, unabhängig von allen anderen. Es gibt keine gemeinsame Fuhre, keinen Trupp-Bonus und keinen Sammel-Teiler; der Durchsatz einer Gruppe ist schlicht die Summe ihrer Einheiten. Bei Fuhrknechten und Wachen erhöht ein Stufenaufstieg die Menge **und** verkürzt den Takt. Bergleute takten dagegen fest im Sekundentakt — bei ihnen wächst allein die Fördermenge, und ihre Menge ist damit zugleich ihre Rate.

**Ein Bergmann fördert ganze Goldstücke**: 1, 2, 3, 4, 6, 8, 12, 18, 26 … — dieselbe Kurve wie zuvor (Faktor 1,5), aber auf ganze Stücke aufgerundet, damit jeder Takt ein sichtbares Goldstück liefert statt eines Bruchteils. Aufgerundet wird, nicht gerundet: Nur so wächst die Reihe auf jeder Stufe echt an, statt in den unteren Stufen zweimal denselben Wert zu zeigen. Der Aufschlag von gut der Hälfte steckt im Preis, sodass ein Bergmann pro Gold unverändert dasselbe leistet. Das Lager führt damit nur noch ganze Zahlen; der Rest-Mechanismus im Zustand (`minerCarry`) bleibt als Garantie erhalten, falls eine Rate je wieder gebrochen wäre.

Daraus folgt die Eigenschaft, an der die ganze Anzeige hängt: Der Zuwachs einer Karte hängt nur an der Einheit, die aufsteigt. Kauft man nebenan, bleibt die Zahl stehen. Bergleute und Fuhrknechte tragen dadurch sogar dieselbe Einheit — beide liefern Gold pro Sekunde — und sind über Kategoriegrenzen hinweg direkt vergleichbar.

**Kein Takt läuft schneller als eine Sekunde.** Das hält die Ankünfte einzeln sichtbar, statt sie zu einem Flimmern zu verschmelzen, und deckelt zugleich die Animationslast: Bei vollem Ausbau liefern höchstens zwölf Einheiten je Sekunde je einmal. Oberhalb dieses Bodens trägt ausschließlich die Menge das weitere Wachstum.

Nachgeholt wird immer in ganzen Takten. Eine durchschlafene Nacht ergibt deshalb exakt dieselbe Menge wie durchgehendes Zusehen, und das Nachrechnen einer vollen Acht-Stunden-Strecke bei Maximalausbau bleibt im Bereich weniger hundert Millisekunden.

**Eine ruhende Einheit hält keinen Takt.** Die Mine ruht, sobald das Lager voll ist — und nur dann. Ein Bergmann verliert dabei seinen Takt und beginnt ihn neu, sobald es weitergeht. Das ist der Unterschied zwischen *ruhen* und *später nachholen*: Liefe die Uhr während der Ruhe weiter, stünde jede stillgelegte Sekunde danach als fällige Förderung an und käme in einem Schwall auf einmal. Ein stehengelassener Takt wäre außerdem der einzige Weg, auf dem die Tick-Schleife einen fälligen Zeitpunkt hinter ihrem eigenen Cursor fände und nicht mehr von der Stelle käme.

Das volle Lager bremst die Förderung damit wirklich, statt sie in den Verlust laufen zu lassen: Die letzte Förderung füllt es bis zum Rand auf, was in dieser einen Portion darüber hinausgeht, ist der Überlauf, den der Zeitdruck des Lagers vorsieht. Alles Weitere wartet auf die nächste Fuhre — die Mine fördert nicht stundenlang an einem vollen Lager vorbei.

## Diebstahl und Schutz

Diebstahl findet aktiv und offline statt und greift ausschließlich die **Schatztruhe** an. Gold im Lager und Ladung unterwegs sind zu kleine Beute, um jemanden zu interessieren — Diebe überfallen Schatzkammern, keine Erzhaufen.

Damit wirkt jeder Abschnitt genau auf die Ressource, die er besitzt: Die Wachen stehen im Truhen-Abschnitt und verteidigen dessen Gold. Jeder Abschnitt trägt außerdem genau einen Fehlermodus — das Lager setzt unter **Zeitdruck** (es läuft über, wenn niemand transportiert), die Truhe unter **Sicherheitsdruck** (sie wird bestohlen, wenn niemand sichert).

Der Transport zahlt deshalb nicht mehr in Sicherheit, sondern in **Handlungsfähigkeit**: Nur Truhengold lässt sich ausgeben. Umgekehrt ist ausgegebenes Gold unangreifbar — Ausbauen ist damit immer auch Verteidigen, und Horten hat einen Preis. Wer trotzdem auf ein teures Upgrade sparen will, kauft vorher Wachen.

Das Risiko steigt, sobald Gold in der Schatztruhe liegt; ein voller Hort treibt es schneller. Vor der ersten Lieferung entsteht überhaupt keines — der Abschnitt ist zu diesem Zeitpunkt ohnehin ausgegraut, sodass niemand unter Druck gerät, bevor er die Truhe kennt. Bei 100 % wird ein Anteil der Truhe gestohlen, danach fällt die Anzeige auf einen kleinen Restwert zurück. Wie hoch dieser Anteil ausfällt, hängt an der Wachstärke — sie ist die Schadensbegrenzung, wenn es doch knallt.

Ein Diebeszug und die volle Schatztruhe blenden sich als kurze Meldung über der Szene ein. Nur Warnungen erscheinen dort: Lieferungen und Käufe zeigen ihre Wirkung ohnehin selbst und liefen als Dauerfeuer, sobald die Automatik steht.

Der Anteil ist bewusst klein: Bezugsgröße ist das gesamte Vermögen, nicht der Inhalt eines Haufens. Ohne Wachen nimmt ein Diebeszug 8 % der Truhe, ein ausgebauter Trupp drückt das bis auf 1,5 %. Weil es ein Anteil bleibt, ist der Verlust auf jedem Ausbaustand gleich spürbar und verliert nie an Bedeutung — anders als eine feste Summe, die im späteren Spiel verschwindet.

Ein Gegenmittel steckt in der Truhe selbst: Weil das Risiko am Füllstand hängt, senkt jeder Ausbau der Schatztruhe den Druck. Die Ausrüstungskarte hat damit einen zweiten Zweck neben reiner Kapazität.

Das Sichern durchläuft denselben Bogen wie der Transport: erst mühsam von Hand, dann von Angestellten übernommen.

- **Ohne Wachen** senkt ein Tap auf die Truhe das Risiko um die **Sichtweite der Grubenlampe** — 25 Punkte der Hundert-Punkte-Skala auf ihrer ersten Stufe. Für die **Dauer eines Wachgangs** (1,5 Sekunden in durchgelaufenen Schuhen) sind danach Schürfen, Transport und ein zweiter Sicherungs-Tap gesperrt, sichtbar als Füllung des Truhen-Buttons — das Sichern kostet also eigene Spielzeit. Die Angestellten arbeiten währenddessen weiter; angehalten wird nie das Reich, immer nur er selbst.
- **Ab der ersten Wache** sichert sie selbstständig in ihrem eigenen Takt. Jede Wache trägt ihre eigenen Punkte ab und wird mit jeder Stufe stärker und schneller; ein Trupp-Bonus existiert nicht. Das Reich steht dabei nicht mehr still: Die Mine fördert durch.
- **Der Tap bleibt danach nützlich** — wie die eigene Fuhre neben den Fuhrknechten: Läuft das Risiko zwischen zwei Takten hoch, senkt ein Tap es sofort zusätzlich, ohne die Förderung anzuhalten. Die 1,5 Sekunden belegen weiterhin den Spieler selbst, wie jede seiner Aktionen die beiden anderen belegt.
- **Unterwegs geht keine Wache.** Solange der Spieler seine eigene Fuhre trägt, kann er nicht von Hand sichern. Wer bei hohem Risiko selbst losläuft, geht das bewusst ein — und kauft sich mit der ersten Wache genau davon frei.

Die Wachen-Karte nennt deshalb **Sichtweite** und **Dauer** — die Punkte, die diese eine Wache je Sicherung abträgt, in derselben Einheit, in der das Risiko steigt, und den Takt, in dem sie das tut. Beides gehört ihr allein.

Dazu kommt als dritte Zeile die **Kraft**: was diese Wache beiträgt, wenn die Diebe trotz aller Runden zuschlagen. Sie stand vorher als „jede Stufe senkt den Verlust um 14 %“ im Hinweis über der Gruppe und war damit der einzige Effekt im Spiel, der Gold kostete, ohne irgendwo als Zahl zu erscheinen. Jetzt ist sie ein Attribut wie jedes andere: zwei Punkte je Stufe, additiv, und damit eine Zeile, die stehen bleibt, wenn nebenan gekauft wird. Nur ihre Wirkung ist eine Trupp-Größe — jeder Punkt lässt 93 % des Verlusts übrig —, und das steht weiterhin als ein Satz über der Gruppe. Sichtweite und Dauer verhindern den Diebeszug, Kraft begrenzt ihn: der einzige Effekt, den man ausschließlich im Moment des Scheiterns sieht.

Die Wachen bremsen den Anstieg des Risikos bewusst **nicht**. Bremsen, automatisch senken und den Schaden deckeln wären drei sich stapelnde Effekte. Ihr Wert steckt in Takt und Sichtweite der Sicherung — und im Ernstfall in ihrer Kraft.

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

Der Spielstand liegt lokal im Browser und enthält eine `schemaVersion`, Timestamps, Upgrades, Bestände, Lebenszeitstatistiken und Ereigniszähler. Schema 9 lässt gefördertes Gold erst bei der Ankunft ins Lager zählen und führt dafür `stockArrivals`, die Liste der Ladungen, die gerade dorthin unterwegs sind; ältere Spielstände starten mit einer leeren Liste, weil dort nie etwas flog. Schema 8 trennt das Lager vom Beutel des Spielers: Die alten Felder `chestGold`/`chestLevel` beschreiben das **Lager** und wandern auf `stockGold`/`stockLevel`; Beutel, Stiefel und Grubenlampe beginnen für Rückkehrer auf ihrer ersten Stufe. Schema 6 speichert für Bergleute, Transporteure und Wachen jeweils vier Level und dazu deren eigene Takte: je Bergmann und je Wache den Zeitpunkt der letzten Lieferung, je Fuhrknecht die laufende Fuhre, dazu die eigene Fuhre des Spielers. Schema 4 und 5 kannten stattdessen eine einzige gemeinsame Fuhre; beim Übergang wandert Gold, das noch auf der Straße lag, zurück ins Lager — die einzige Variante, bei der weder etwas verschwindet noch ungeprüft in der Truhe auftaucht. Ältere Fortschritte aus Schema 1–3 werden zusätzlich gleichmäßig auf die passenden vier Slots verteilt. Autosave erfolgt regelmäßig und beim Verlassen des Tabs.

Schläge, Käufe und abgeschlossene Reisen besitzen kurze synthetisierte Soundeffekte. Unterstützte Browser erhalten dezente Vibrationen. Reduzierte Bewegungseinstellungen des Betriebssystems werden respektiert.

- React, TypeScript und Vite
- UI-unabhängige TypeScript-Spielengine
- Vitest für Engine- und Offline-Regeln
- generierte PNG-Pixel-Sprites mit transparentem Hintergrund
- `vite-plugin-pwa` für Manifest und Service Worker
- GitHub Actions für Tests, Build und Pages-Deployment
- Local Storage mit versioniertem Savegame

Prestige, Cloud-Sync, App-Store-Pakete und Monetarisierung folgen erst, wenn der Kernloop anhand des Vertical Slice validiert wurde.

Alle Stufennamen und ihre Beschreibungen stehen in [`stufen.md`](./stufen.md).
