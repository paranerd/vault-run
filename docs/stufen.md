# Vault Run – 10 Stufen je Strang

Die Namen und Beschreibungen aller Ausbaustränge. Sie sind die Quelle für `SLOT_STAGE_NAMES` und
die Ausrüstungstabellen in `src/game/config.ts`; wer hier etwas ändert, ändert es dort mit.

Ein Strang hat zehn benannte Stufen. Darüber hinaus zählt die Stufennummer weiter, der Name bleibt
der zehnte — das Spiel deckelt die Stufen nicht.

**Ausrüstung** ist alles, was der Spieler selbst benutzt, plus die beiden Behälter des Reiches.
Die vier Spielerstücke gehören zu je einer seiner Handlungen; die Stiefel gehören zu beiden, bei
denen er läuft:

| Strang | Attribut | Wirkt auf |
|---|---|---|
| Pickhacke | Fördermenge | seinen Schlag in der Mine |
| Beutel | Ladung | seine eigene Fuhre |
| Stiefel | Dauer | seine Fuhre **und** seinen Wachgang |
| Grubenlampe | Kraft | seinen Wachgang an der Truhe |
| Lager | Kapazität | den Puffer zwischen Förderung und Abtransport |
| Schatztruhe | Kapazität | den Hort, aus dem bezahlt wird |

## Pickhacke (Ausrüstung – Fördermenge)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Rostige Pickhacke** | Mehr Rost als Eisen, der Stiel mit Draht umwickelt. Sie hält, solange du nicht zu fest zuschlägst. |
| 2 | **Geflickte Pickhacke** | Neuer Stiel, alter Kopf, sauber verkeilt. Zum ersten Mal sitzt der Schlag da, wo du hinzielst. |
| 3 | **Eiserne Pickhacke** | Frisch geschmiedetes Eisen mit geschliffener Spitze. Der Fels gibt willig nach statt zu splittern. |
| 4 | **Gehärtete Stahlhaue** | Im Wasser abgeschreckter Stahl. Die Spitze bleibt scharf, auch nach der hundertsten Ader. |
| 5 | **Doppelspitzhaue** | Zwei Spitzen, zwei Bruchkanten je Schlag. Die Bergleute nennen sie den Zangenbiss. |
| 6 | **Silberstahlhaue** | Silber im Stahl lässt Goldadern aufleuchten, sobald die Spitze sie streift. Du triffst nichts Taubes mehr. |
| 7 | **Zwergenhaue** | Unter dem Berg geschmiedet und bewusst kopflastig gewuchtet. Sie fällt fast von allein in den Fels. |
| 8 | **Goldene Pickhacke** | Goldbeschlagen und rundum ausbalanciert. Gold findet Gold, sagen die Alten in der Grube. |
| 9 | **Runenhaue** | Eingeschlagene Runen glühen beim Aufprall auf und sprengen das Gestein von innen heraus. |
| 10 | **Drachenzahnhaue** | Ein echter Drachenzahn auf schwarzem Eichenstiel. Der Stein bricht schon, bevor sie ihn ganz erreicht. |

## Beutel (Ausrüstung – Ladung)

Was der Spieler selbst schultert und zur Truhe trägt. Nicht zu verwechseln mit dem **Lager**, in das
seine Bergleute fördern: Aus dem Lager füllt er den Beutel, mehr als dort liegt trägt er nie.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Löchriger Lederbeutel** | Am Boden fehlt eine Naht. Was zu viel hineinkommt, findest du später im Staub wieder. |
| 2 | **Genähter Lederbeutel** | Ordentlich zugenäht, mit festem Riemen über der Schulter. Nichts geht mehr unterwegs verloren. |
| 3 | **Verstärkter Goldbeutel** | Doppelte Lage Leder, Ziernaht am Rand. Er trägt bequem das, wovon der erste zerriss. |
| 4 | **Doppelte Gürteltasche** | Zwei Taschen am Gurt, links und rechts. Das Gewicht verteilt sich — und mit ihm die Menge. |
| 5 | **Großer Bergmannssack** | Der grobe Sack, den jeder Hauer über der Schulter trägt. Weit, zäh und schnell befüllt. |
| 6 | **Zunftranzen** | Von der Bergmannszunft ausgegeben, mit getrennten Fächern für Werkzeug und Ausbeute. |
| 7 | **Eisenbeschlagener Packsack** | Eisenringe halten die Öffnung weit, damit du im Gehen nachfüllen kannst, ohne stehen zu bleiben. |
| 8 | **Königlicher Goldsack** | Purpurstoff mit Goldkordel. Er fasst mehr, als ein einzelner Mann eigentlich tragen sollte. |
| 9 | **Runenbeutel** | Innen weiter als außen. Das Gold darin wiegt nur noch die Hälfte, passt aber doppelt hinein. |
| 10 | **Beutel der Leere** | Sein Boden ist eine gefaltete Leere. Fast alles passt hinein — der Weg zur Truhe bleibt dir trotzdem. |

## Stiefel (Ausrüstung – Dauer)

Das einzige Stück, das auf zwei Handlungen wirkt: Fuhre und Wachgang sind beide Wege, die der
Spieler zu Fuß zurücklegt. Ohne sie wäre der Wachgang der einzige Teil von ihm, der nie besser
wird — und damit spätestens ab der dritten Wache überflüssig.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Durchgelaufene Schuhe** | Die Sohle ist dünner als das Leder darüber. Jeder Stein auf dem Weg zählt einzeln mit. |
| 2 | **Genagelte Arbeitsschuhe** | Eisennägel in der Sohle, fester Sitz am Knöchel. Auf dem Geröll rutschst du nicht mehr. |
| 3 | **Geschnürte Lederstiefel** | Bis übers Schienbein geschnürt. Aus dem Klettern zur Truhe wird ein Gehen. |
| 4 | **Grubenstiefel** | Verstärkte Kappe, dicke Sohle. Sie tragen dich durch Nässe, Schutt und Schicht. |
| 5 | **Marschstiefel** | Von Söldnern abgeschaut, auf lange Wege genäht. Zwei Runden fühlen sich an wie eine. |
| 6 | **Federleichte Stiefel** | So leicht, dass du zweimal hinsiehst, ob du sie überhaupt anhast. Den Rückweg merken die Beine nicht mehr. |
| 7 | **Zwergenstiefel** | Schwer im Stand, schnell im Schritt. Unter dem Berg geht niemand zügiger. |
| 8 | **Siebenmeilenstiefel** | Nicht ganz sieben Meilen — aber jedes Mal fehlt der halbe Weg. |
| 9 | **Runenstiefel** | Laufrunen an der Ferse ziehen den Boden unter dir hindurch, statt dich darüber. |
| 10 | **Windschuhe** | Du setzt auf und bist da. Der Weg dazwischen ist eine Formsache. |

## Grubenlampe (Ausrüstung – Kraft)

Womit der Spieler seinen Wachgang macht. Der Hort wird nicht verteidigt, sondern ausgeleuchtet:
Was im Licht liegt, stiehlt niemand. Die Kraft zählt in denselben Punkten wie die der Wachen und
ist deshalb direkt gegen sie abwägbar.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Rußige Talgfunzel** | Ein Docht in Fett, mehr Qualm als Licht. Immerhin sieht man, dass jemand kommt. |
| 2 | **Blechlaterne** | Geschlossenes Blech mit Bügel. Der erste Windstoß löscht sie nicht mehr aus. |
| 3 | **Hornlaterne** | Geschliffenes Horn statt Glas, warm und weit. Der Schein reicht bis in die Ecken. |
| 4 | **Spiegelöllampe** | Ein poliertes Blech hinter der Flamme wirft alles Licht dorthin, wohin du gehst. |
| 5 | **Karbidlampe** | Zischt, stinkt und brennt weiß. Wer sie sieht, weiß: Hier geht jemand seine Runde. |
| 6 | **Zwergenleuchte** | Kristall in Messing, unter dem Berg gefasst. Sie brennt ruhig, wo jede Flamme flackert. |
| 7 | **Bannlaterne** | Geweihtes Öl, das nur für den brennt, der redlich damit geht. Diebe halten von selbst Abstand. |
| 8 | **Spiegelkranzlaterne** | Sechs Spiegel werfen den Schein rundum. Um dich herum bleibt kein Schatten stehen. |
| 9 | **Runenlicht** | Eine Rune im Glas, kein Docht darin. Sie erlischt nicht und wirft keinen Schatten. |
| 10 | **Sonnenstein** | Ein Splitter Tageslicht in der Faust. In diesem Licht arbeitet kein Dieb. |

## Lager (Ausrüstung – Kapazität)

Der Haufen am Stollenmund. Die Bergleute werfen hinein, der Spieler und seine Fuhrknechte laden
daraus ab. Ist es voll, ruht die Mine — das Lager ist die Grenze der Förderung, nicht bloß ein
Trichter.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Loser Erzhaufen** | Was aus dem Stollen kommt, liegt einfach da. Ein kräftiger Wind, und ein Teil davon liegt woanders. |
| 2 | **Bretterverschlag** | Vier Bretter, in den Boden gerammt. Der Haufen bleibt jetzt liegen, wo du ihn hingeschüttet hast. |
| 3 | **Geflochtene Erzkörbe** | Weidenkörbe in Reihe, jeder schulterhoch. Wer abholt, greift sich einen und ist wieder weg. |
| 4 | **Gezimmerter Schuppen** | Dach über dem Gold, Tür davor. Zum ersten Mal regnet es nicht in die Ausbeute. |
| 5 | **Steinernes Erzlager** | Aus Bruchstein in den Hang gemauert. Es hält den Berg auf seiner Seite und das Gold auf deiner. |
| 6 | **Grubenspeicher** | Getrennte Kammern für Erz, Bruch und Staub. Nichts vermischt sich, nichts geht im Haufen unter. |
| 7 | **Zunftdepot** | Von der Zunft abgenommen und verzeichnet. Was hier lagert, gilt als gezählt. |
| 8 | **Gewölbelager** | Ein Tonnengewölbe aus Quadern, kühl und trocken. Darin türmt sich, was einmal ein Haufen war. |
| 9 | **Runenspeicher** | Bannzeichen an den Pfosten dehnen den Raum zwischen ihnen. Von außen bleibt der Schuppen ein Schuppen. |
| 10 | **Hallenlager** | Eine Halle am Stollenmund, in der ganze Fuhren nebeneinander stehen. Der Berg gibt kaum so schnell her, wie sie fasst. |

## Schatztruhe (Ausrüstung – Kapazität)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Morsche Holzkiste** | Ein Fund aus dem alten Stollen. Der Deckel schließt, mehr kann man von ihr nicht verlangen. |
| 2 | **Beschlagene Holztruhe** | Frisches Holz mit Eisenbändern an den Kanten. Sie steht fest und lässt sich hoch schichten. |
| 3 | **Eisentruhe** | Ganz aus Eisen genietet. Zwei Männer brauchen es, um sie auch nur zu verrücken. |
| 4 | **Riegeltruhe** | Drei Riegel, drei Schlüssel, einer davon bei dir. Der Inhalt wächst schneller als das Vertrauen. |
| 5 | **Steinschrein** | In den Fels gehauen statt daraufgestellt. Was hier hineinkommt, bleibt auch dort. |
| 6 | **Vergoldete Prunktruhe** | Goldblatt auf Eichenholz. Sie zeigt jedem, dass sich der Aufstieg gelohnt hat — auch den Falschen. |
| 7 | **Zwergentresor** | Ein Mechanismus aus siebzehn Zahnrädern gibt ihn frei. Zwerge zählen ihre Sicherheit anders. |
| 8 | **Juwelentruhe** | Edelsteine in jeder Fuge, der Hort füllt einen ganzen Raum. Solcher Glanz spricht sich herum. |
| 9 | **Runentruhe** | Ein Bannkreis im Deckel dehnt den Innenraum weit über die Wände hinaus. |
| 10 | **Drachenhort** | Kein Möbelstück mehr, sondern eine Halle voll Gold. Ein Berg dieser Größe zieht Blicke aus dem ganzen Land an. |

## Bergleute (4 Slots, Mine)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Tagelöhner** | Arbeitet für Brot und Bettstatt. Er kratzt zusammen, was ohne richtiges Werkzeug zu holen ist. |
| 2 | **Grubenknappe** | Seine Lernjahre unter Tage. Er kennt inzwischen den Unterschied zwischen totem Fels und Ader. |
| 3 | **Hauer** | Ausgelernt und mit eigener Haue. Er schlägt gleichmäßig durch, Schicht für Schicht. |
| 4 | **Steinbrecher** | Breite Schultern, kurzer Stiel. Er nimmt sich den Brocken vor, an dem die anderen scheitern. |
| 5 | **Sprengmeister** | Setzt seine Ladungen genau in die Bruchkante. Ein Knall spart ihm eine Stunde Handarbeit. |
| 6 | **Erzmeister** | Liest die Adern im Gestein wie eine Karte und schlägt deshalb nie mehr daneben. |
| 7 | **Zwergenhauer** | Aus den Tiefenhallen angeworben. Im Dunkeln arbeitet er schneller als jeder Mensch im Licht. |
| 8 | **Rutengänger** | Seine Wünschelrute zuckt über verborgenen Adern. Er gräbt nur noch dort, wo es sich wirklich lohnt. |
| 9 | **Runenbrecher** | Ritzt Sprengrunen in die Wand und wartet. Das Gestein blättert danach von selbst ab. |
| 10 | **Steingolem** | Aus dem Berg geweckt und an den Stollen gebunden. Er kennt weder Schichtende noch Pause. |

## Fuhrknechte (4 Slots, Lager)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Laufbursche** | Nimmt, was in zwei Hände passt, und rennt los. Zurück kommt er außer Atem, aber pünktlich. |
| 2 | **Packesel** | Stur, aber ausdauernd. Er trägt das Mehrfache und beschwert sich nur bergauf. |
| 3 | **Schubkarre** | Ein Rad, zwei Griffe. Aus Tragen wird Rollen, aus Mühe wird Strecke. |
| 4 | **Packpferd** | Zwei volle Körbe am Sattel und ein Trab, der den Weg zur Truhe halbiert. |
| 5 | **Ochsenkarren** | Langsam angefahren, dafür schwer beladen. Der Karren ächzt unter dem Gold, der Ochse nicht. |
| 6 | **Panzerkarren** | Eisenbeschlagene Ladefläche mit verschlossenem Deckel. Unterwegs sieht niemand, was darin liegt. |
| 7 | **Vierspänner** | Vier Pferde vor einem Wagen. Aus dem Weg zur Truhe wird eine kurze Fahrt. |
| 8 | **Königskutsche** | Gefedert, bewacht, mit Wappen an der Tür. Sie hält erst wieder an, wenn sie angekommen ist. |
| 9 | **Greifengespann** | Zwei Greifen ziehen die Ladung über den Berg statt mühsam um ihn herum. |
| 10 | **Torstein** | Ein offenes Portal am Stollenende. Das Gold liegt in der Truhe, kaum dass es hineingefallen ist. |

## Wachen (4 Slots, Truhe)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Nachtwächter** | Geht mit Laterne und Stock seine Runde. Meist genügt es schon, dass überhaupt jemand wach ist. |
| 2 | **Wachhund** | Läuft die Truhe unermüdlich ab und schlägt an, lange bevor ein Fremder sie überhaupt sieht. |
| 3 | **Speerknecht** | Ein bezahlter Posten mit langem Speer. Er geht seine Runde, bis ihn jemand ablöst. |
| 4 | **Söldnerwache** | Kämpft für Sold, dafür aber gut. Sie schafft zwei Runden, ohne einmal stehen zu bleiben. |
| 5 | **Rüdenmeister** | Führt drei Hunde an der Leine. Die Meute nimmt jede Fährte auf, die um den Hort herumführt. |
| 6 | **Wachhauptmann** | Legt die Runden so, dass nie zweimal dieselbe Ecke unbeobachtet liegen bleibt. |
| 7 | **Schattenspäher** | Läuft die Runde, die niemand sieht. Diebe bemerken ihn erst, wenn er sie längst bemerkt hat. |
| 8 | **Ordensritter** | Volle Rüstung, feste Zeiten, kein Wort zu viel. Sein Rundgang klingt wie ein Urteil. |
| 9 | **Königsgardist** | Aus der Leibwache abgestellt. Er geht seine Runde, als hinge eine Krone daran. |
| 10 | **Greifenreiter** | Zieht seine Kreise hoch über dem Hort. Von dort oben bleibt keine Ecke lange dunkel. |
