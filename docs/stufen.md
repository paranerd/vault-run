# Vault Run – 10 Stufen je Strang

Die Namen und Beschreibungen aller Ausbaustränge. Sie sind die Quelle für `SLOT_STAGE_NAMES` und
die Ausrüstungstabellen in `src/game/config.ts`; wer hier etwas ändert, ändert es dort mit. Sie sind
zugleich die Vorlage für die Sprites: Was hier steht, ist das, was auf dem Bild zu sehen sein soll.

Ein Strang hat zehn benannte Stufen. Darüber hinaus zählt die Stufennummer weiter, der Name bleibt
der zehnte — das Spiel deckelt die Stufen nicht.

**Ausrüstung** ist alles, was der Spieler selbst benutzt, plus die beiden Behälter des Reiches.
Die vier Spielerstücke gehören zu je einer seiner Handlungen; die Stiefel gehören zu beiden, bei
denen er läuft:

| Strang | Attribut | Wirkt auf |
|---|---|---|
| Pickhacke | Fördermenge | seinen Schlag in der Mine |
| Beutel | Ladung | seine eigene Fuhre |
| Stiefel | Geschwindigkeit | seine Fuhre **und** seinen Wachgang |
| Grubenlampe | Sichtweite | seinen Wachgang an der Truhe |
| Lager | Kapazität | den Puffer zwischen Förderung und Abtransport |
| Schatztruhe | Kapazität | den Hort, aus dem bezahlt wird |

**Wer dasselbe tut, trägt denselben Namen — und damit dieselbe Skala.** Jedem Attribut eines
Angestellten steht ein Ausrüstungsstück gegenüber, das dasselbe für den Spieler tut:

| Angestellter | seine Attribute | beim Spieler |
|---|---|---|
| Bergmann | Fördermenge | Pickhacke |
| Fuhrknecht | Ladung, Geschwindigkeit | Beutel, Stiefel |
| Wache | Sichtweite, Geschwindigkeit, Kraft | Lampe, Stiefel, — |

Die **Kraft** der Wachen steht als einzige allein: Sie wirkt erst als Summe des ganzen Trupps und
hat deshalb keine Entsprechung beim Einzelnen.

Alle **Geschwindigkeiten** messen an derselben Standardstrecke: Wer sie in zwölf Sekunden
zurücklegt, hat Tempo 1. Das ist keine Rechenkonvention, sondern fällt zusammen — die Fuhre des
Spielers, die Fuhre eines Fuhrknechts der ersten Stufe und die Runde einer Wache der ersten Stufe
dauern alle zwölf Sekunden. „Geschwindigkeit 1,9“ auf der Packesel-Karte ist damit unmittelbar
gegen „1,3“ auf der Stiefelkarte lesbar. Der Wachgang des Spielers ist demgegenüber kein
schnellerer Weg, sondern ein kürzerer (1,5 s): Er späht um die Truhe, statt sie zu umrunden.

Alle **Sichtweiten** zählen in denselben Punkten der Hundert-Punkte-Skala des Risikos, Lampe wie
Wache.

## Wie eine Leiter aussieht

Zehn Bilder eines Strangs müssen als **eine Reihe** lesbar sein. Was für jede Leiter gilt, steht
hier einmal; was nur für eine gilt, steht als **Hinweise** unter ihrer Tabelle.

- **Eine Reihe, eine Ansicht.** Alle zehn Bilder zeigen denselben Gegenstand aus demselben Winkel,
  in derselben Bildhöhe, ohne Boden, Kulisse und Beiwerk.
- **Eine Richtung für die ganze Tafel: nach rechts.** Gemeint ist die rechte *Bildseite*, aus Sicht
  des Betrachters — nicht die rechte Seite der Figur. Kein Bild dieser Tafel wendet sich nach links.
  Wie sich das zeigt, hängt an der Ansicht:
  - **Wer ein Gesicht hat, schaut nach vorn rechts.** Der Körper steht zum Betrachter, Kopf und
    Schultern sind eine Spur nach rechts gedreht, der Blick geht an ihm vorbei zur rechten
    Bildkante. Das gilt für jeden Menschen der Tafel — Bergleute, Wachen, den Laufbursche —, für den
    Steingolem und für jedes Zugtier. Nicht das strenge Profil und nicht der leere Blick geradeaus,
    sondern der Dreiviertelblick dazwischen.
  - **Was im Profil fährt oder geht, fährt nach rechts.** Kopf, Bug und Zugtier voran zur rechten
    Bildkante.
  - **Was im Dreiviertelblick steht, ist nach rechts gedreht:** Front zum Betrachter, die sichtbare
    Schmalseite rechts.
  - **Und wer nach rechts schaut, hält links.** Die Drehung bringt die eine Schulter nach vorn;
    Werkzeug und Waffe hängen an ihr und liegen deshalb über alle zehn Stufen auf derselben Seite —
    im Bild der linken. Was in der freien Hand dazukommt, bleibt auf der anderen.
- **Ausgenommen sind die vier Stücke, die der Spieler selbst in die Hand nimmt.** Pickhacke, Beutel
  und Grubenlampe haben weder Gesicht noch Fahrtrichtung: Sie hängen frontal im Bild, gleich gedreht
  über alle zehn Stufen. Der Stiefel bleibt im Profil, weil seine Leiter an Schafthöhe, Sohle und
  Vorwärtsneigung hängt — und wendet sich, wie alles andere, nach rechts. Für diese vier ist
  *gleich* wichtiger als *nach rechts*; keiner von ihnen wird gedreht, nur um der Richtung zu
  folgen. Lager und Schatztruhe sind davon **nicht** ausgenommen: Sie stehen als Bauwerke im Raum
  und folgen der Richtung der Tafel.
- **Jede Stufe schlägt ihren Vorgänger sichtbar.** Größer, massiver, heller, schwerer beladen,
  besser gepanzert — der Zuwachs steht im Bild, nicht nur im Namen. Keine Stufe darf kleiner,
  dunkler, ärmlicher oder schwächer wirken als die vorige, auch nicht durch einen Motivwechsel.
- **Was die Leiter misst, bleibt sichtbar.** Die Lampe zeigt ihren Schein, der Beutel seine Fülle,
  der Karren seine Ladung, die Wache ihre Waffe. Ein Deckel, der die Ladung verdeckt, nimmt der
  Stufe ihr Argument.
- **Keine zwei Stufen einer Leiter teilen dieselbe Silhouette.** Verwandte Stufen unterscheiden sich
  an einem Merkmal, das man auf Daumengröße noch sieht.
- **Eine Besonderheit ist entweder Regel oder Spitze.** Ein Merkmal, das nur eine einzige Stufe in
  der Mitte trägt, gehört auf die zehnte — oder es gilt ab seiner Stufe für alle folgenden.
- **Die Materialleiter läuft überall gleich:** roh → Eisen → Stahl → Zwergenarbeit → Gold → Rune →
  Mythos. Die **neunte** Stufe ist überall die Runenstufe; die **zehnte** ist überall die, die die
  Form der Reihe verlässt — und nur sie darf das.
- **Farbe zeigt den Rang, nicht die Laune.** Innerhalb einer Leiter wechselt die Farbe nur dort, wo
  die Stufe einen Rang wechselt: bei den Wachen die Uniform, bei den Lampen das Licht.

## Pickhacke (Ausrüstung – Fördermenge)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Rostige Pickhacke** | Mehr Rost als Eisen, der Stiel mit Draht umwickelt. Sie hält, solange du nicht zu fest zuschlägst. |
| 2 | **Geflickte Pickhacke** | Neuer Stiel, alter Kopf, sauber verkeilt. Zum ersten Mal sitzt der Schlag da, wo du hinzielst. |
| 3 | **Eiserne Pickhacke** | Frisch geschmiedetes Eisen, der Stiel bis zur Mitte umwickelt. Der Fels gibt nach, statt zu splittern. |
| 4 | **Gehärtete Stahlhaue** | Im Wasser abgeschreckter Stahl, nüchtern blank poliert. Die Spitze bleibt scharf, auch nach der hundertsten Ader. |
| 5 | **Doppelspitzhaue** | Die Hammerbahn ist einer zweiten Spitze gewichen: zwei Bruchkanten je Schlag. Von hier an trägt jede Haue zwei Spitzen. |
| 6 | **Silberstahlhaue** | Silber im Stahl zieht einen hellen Strich durch beide Schneiden. Goldadern leuchten auf, sobald die Spitze sie streift — du triffst nichts Taubes mehr. |
| 7 | **Zwergenhaue** | Unter dem Berg geschmiedet: mehr Kopf als Stiel, in Messingbändern gefasst, bewusst kopflastig gewuchtet. Sie fällt fast von allein in den Fels. |
| 8 | **Goldene Pickhacke** | Goldbeschlagener Kopf, Rubin im Auge, rundum ausbalanciert. Gold findet Gold, sagen die Alten in der Grube. |
| 9 | **Runenhaue** | Schwarzer Stahl mit eingeschlagenen Runen. Sie glühen beim Aufprall auf und sprengen das Gestein von innen heraus. |
| 10 | **Bergriss** | Kein Werkzeug mehr, sondern der Bruch selbst: ein Riss, der frei in der Luft steht, wo eben noch Kopf und Stiel waren — oben in zwei Spitzen aufgegabelt, innen goldglühend, an den Rändern rieselt Gestein, das es nicht mehr gibt. Er wird nicht geschwungen, sondern angesetzt; danach gibt der Berg seine Ader von selbst her. |

**Hinweise**

- Immer ein einzelnes Werkzeug, frontal zum Betrachter: Kopf oben, Stiel schräg nach unten, in allen
  zehn Bildern im selben Winkel und mit dem Blatt zur selben Seite. Kein Fels, kein Boden, keine
  Hand. Die zehnte Stufe hat weder Kopf noch Stiel, füllt das Bild aber genauso: Die Gabel steht,
  wo bisher der Kopf stand, und der Riss läuft im selben Winkel nach unten aus wie die Stiele davor.
- Kopfmasse und Stielbeschlag wachsen monoton — Wicklung, Ringe, Zwingen. Keine Stufe darf schlanker
  oder stumpfer wirken als ihr Vorgänger, auch keine dunklere.
- **Stufen 1–4 tragen Blatt und Hammerbahn, Stufen 5–10 zwei Spitzen.** Die Doppelspitze ist keine
  Marotte der fünften Stufe, sondern gilt ab ihr; auch der Bergriss gabelt sich deshalb oben in zwei
  Spitzen und nicht in eine.
- 4 und 6 sind beide blanker Stahl und dürfen sich nicht gleichen: 4 ist nüchtern poliert, 6 trägt
  den hellen Silberstrich in der Schneide und einen Goldschimmer an den Spitzen.
- Licht gibt erst 9. Stufe 10 ist als einzige überhaupt kein Gegenstand mehr: kein Metall, kein Holz,
  nichts, was man schmieden könnte — nur der Bruch, den die neun Stufen davor mit Mühe erzeugen.
  Ihr Gold ist deshalb nicht Beschlag, sondern das, was aus dem Riss selbst leuchtet.
- Der Bergriss steht breiter im Bild als die Runenhaue davor. Die Reihe wird auf der letzten Stufe
  nicht kleiner, nur körperlos.

## Beutel (Ausrüstung – Ladung)

Was der Spieler selbst schultert und zur Truhe trägt. Nicht zu verwechseln mit dem **Lager**, in das
seine Bergleute fördern: Aus dem Lager füllt er den Beutel, mehr als dort liegt trägt er nie.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Löchriger Lederbeutel** | Am Boden fehlt eine Naht. Was zu viel hineinkommt, findest du später im Staub wieder. |
| 2 | **Genähter Lederbeutel** | Ordentlich zugenäht, mit festem Riemen über der Schulter. Nichts geht mehr unterwegs verloren. |
| 3 | **Verstärkter Goldbeutel** | Doppelte Lage Leder, Ziernaht am Rand, und oben quillt zum ersten Mal Gold über. Er trägt bequem das, wovon der erste zerriss. |
| 4 | **Gegurteter Packbeutel** | Zwei Gurte legen sich um den Bauch des Beutels und halten ihn in Form. Er sackt nicht mehr zusammen, wenn du nachfüllst — und nimmt deshalb mehr an. |
| 5 | **Großer Bergmannssack** | Der grobe Sack, den jeder Hauer über der Schulter trägt. Weit, zäh und schnell befüllt. |
| 6 | **Zunftsack** | Von der Bergmannszunft ausgegeben und geeicht, das Zunftzeichen ins Leder gebrannt. Was hineinpasst, ist amtlich verbürgt. |
| 7 | **Eisenbeschlagener Packsack** | Eisenringe halten die Öffnung weit, damit du im Gehen nachfüllen kannst, ohne stehen zu bleiben. |
| 8 | **Königlicher Goldsack** | Purpurstoff mit Goldkordel. Er fasst mehr, als ein einzelner Mann eigentlich tragen sollte. |
| 9 | **Runenbeutel** | Innen weiter als außen, der Rand in blauem Runenlicht. Das Gold darin wiegt nur noch die Hälfte, passt aber doppelt hinein. |
| 10 | **Beutel der Leere** | Schwarz mit violettem Saum, sein Boden eine gefaltete Leere. Fast alles passt hinein — der Weg zur Truhe bleibt dir trotzdem. |

**Hinweise**

- Zehnmal derselbe Gegenstand: ein Beutel oder Sack, aufrecht, prall, frontal von vorn. **Kein
  Rucksack, keine Gürteltasche, nichts am Körper getragen** — was der Spieler schultert, steht im
  Bild für sich allein.
- Umfang und Fülle wachsen monoton; ab Stufe 3 schaut Gold über den Rand, und die Menge wächst mit.
- Kein Beutel ist doppelt und keiner wird am Gürtel getragen; die Gurte der vierten Stufe liegen um
  den Beutel, nicht um den Mann.
- Farbe folgt dem Rang: braunes Leder (1–4) → grobes Tuch und beschlagenes Leder (5–7) → Purpur mit
  Gold (8) → Runenblau (9) → Schwarz mit violettem Saum (10). Jede der letzten drei Farben trägt
  genau eine Stufe.

## Stiefel (Ausrüstung – Geschwindigkeit)

Das einzige Stück, das auf zwei Handlungen wirkt: Fuhre und Wachgang sind beide Wege, die der
Spieler zu Fuß zurücklegt. Ohne sie wäre der Wachgang der einzige Teil von ihm, der nie besser
wird — und damit spätestens ab der dritten Wache überflüssig.

Gemessen wird das **Tempo**, nicht die Dauer: Die Zahl wächst mit jeder Stufe, und die Wege werden
trotzdem kürzer, weil eine Strecke `Länge ÷ Geschwindigkeit` kostet. Dieselbe Größe tragen der
Fuhrknecht und die Wache.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Durchgelaufene Schuhe** | Die Sohle ist dünner als das Leder darüber, der Schnitt endet unter dem Knöchel. Jeder Stein auf dem Weg zählt einzeln mit. |
| 2 | **Genagelte Arbeitsschuhe** | Eisennägel in der Sohle, fester Sitz am Knöchel. Auf dem Geröll rutschst du nicht mehr. |
| 3 | **Geschnürte Lederstiefel** | Bis über die Wade geschnürt. Aus dem Klettern zur Truhe wird ein Gehen. |
| 4 | **Grubenstiefel** | Kniehoch, verstärkte Kappe, harte Sohle. Sie tragen dich durch Nässe, Schutt und Schicht. |
| 5 | **Marschstiefel** | Von Söldnern abgeschaut, auf lange Wege genäht: schmaler Schaft, kein überflüssiges Beschlagwerk. Zwei Runden fühlen sich an wie eine. |
| 6 | **Hirschlederstiefel** | Aus dünnem, hellem Hirschleder genäht, ohne einen einzigen Nagel. So leicht, dass die Beine den Rückweg nicht mehr merken. |
| 7 | **Zwergenstiefel** | Messingbeschlagen, schwer im Stand, schnell im Schritt. Unter dem Berg geht niemand zügiger. |
| 8 | **Siebenmeilenstiefel** | Rot und golden, der Schaft nach vorn geneigt wie mitten im Lauf. Nicht ganz sieben Meilen — aber jedes Mal fehlt der halbe Weg. |
| 9 | **Runenstiefel** | Laufrunen an der Ferse ziehen den Boden unter dir hindurch, statt dich darüber. |
| 10 | **Sturmschritt** | Kein Leder mehr: ein silberweißer Wirbel aus Wind und Staub, der die Form eines Schritts behält und den Boden nicht mehr berührt. Weiter nach vorn geneigt als jeder Stiefel davor — der Weg ist vorbei, ehe er angefangen hat. |

**Hinweise**

- Ein einzelner Stiefel im Profil, in allen zehn Bildern **nach rechts** gewandt — Spitze zur rechten
  Bildkante, wie die Fuhrwerke und wie der Blick der Menschen —, in derselben Bildhöhe. Die zehnte
  Stufe hat keinen Stiefel mehr, steht aber an derselben Stelle, in derselben Höhe und mit der
  Spitze nach rechts.
- **Der Schaft wächst monoton:** 1–2 knöchelhoch, 3 wadenhoch, ab 4 kniehoch. Kein Stiefel ist
  niedriger als sein Vorgänger — die Reihe springt nie zwischen Halbschuh und Schaftstiefel hin und
  her. Der Wirbel der zehnten Stufe steht höher als der höchste Schaft davor; was der Schaft war,
  ist bei ihm die Höhe des Windes.
- **Und mit der Höhe wächst das Tempo:** engerer Schnitt, dünnere und härtere Sohle, weniger klobiges
  Beschlagwerk, stärkere Neigung nach vorn. Ein Stiefel dieser Reihe wird nicht schwerer, sondern
  schneller.
- **Keine Stufe trägt Gefieder.** Die sechste ist leicht durch dünnes Leder, nicht durch Schwingen,
  und die zehnte ist schnell durch Wind, nicht durch Flügel.
- Stufe 10 ist als einzige kein Stiefel mehr: von Schaft und Sohle bleibt nichts, von der Leiter nur
  die Neigung nach vorn und die Richtung. Sie ist auch die einzige, die den Boden nicht berührt —
  bis Stufe 9 steht jeder Stiefel auf, der Sturmschritt schwebt eine Handbreit darüber.
- Farbe: braunes Leder (1–3) → geschwärztes Leder mit Eisenkappe (4) → staubbraun mit Riemen (5) →
  helles Hirschleder (6) → dunkel mit Messing (7) → Rot mit Gold (8) → Schwarz mit blauen Runen (9)
  → silberweißer Wirbel ohne Leder (10).

## Grubenlampe (Ausrüstung – Sichtweite)

Womit der Spieler seinen Wachgang macht. Der Hort wird nicht verteidigt, sondern ausgeleuchtet:
Was im Licht liegt, stiehlt niemand. Die Sichtweite zählt in denselben Punkten wie die der Wachen
und ist deshalb direkt gegen sie abwägbar — dieselbe Beschriftung, dieselbe Skala.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Rußige Talgfunzel** | Ein Docht in Fett, offen in einer Schale, mehr Qualm als Licht. Immerhin sieht man, dass jemand kommt. |
| 2 | **Blechlaterne** | Geschlossenes Blech mit Bügel, ein Fenster nach vorn. Der erste Windstoß löscht sie nicht mehr aus. |
| 3 | **Hornlaterne** | Geschliffenes Horn statt Blech, ringsum warm und weit. Der Schein reicht bis in die Ecken. |
| 4 | **Spiegelöllampe** | Ein poliertes Blech hinter der Flamme bündelt allen Schein nach vorn — dorthin, wohin du gehst. |
| 5 | **Karbidlampe** | Zischt, stinkt und brennt weiß statt gelb: der erste harte Schein der Reihe. Wer ihn sieht, weiß, hier geht jemand seine Runde. |
| 6 | **Zwergenleuchte** | Kristall in Messing, unter dem Berg gefasst. Sie flackert nicht, und ihr grünweißes Licht steht im ganzen Raum statt in einem Kegel. |
| 7 | **Spiegelkranzlaterne** | Ein Kranz aus Spiegeln wirft den goldweißen Schein rundum. Um dich herum bleibt kein Schatten stehen. |
| 8 | **Bannlaterne** | Geweihtes Öl hinter Silber, weiß und ohne Flackern. Es brennt nur für den, der redlich damit geht — Diebe halten von selbst Abstand. |
| 9 | **Runenlicht** | Eine Rune im Glas, kein Docht darin. Sie erlischt nicht und wirft keinen Schatten. |
| 10 | **Sonnenstein** | Ein Splitter Tageslicht in der Faust, ohne Kammer und ohne Bügel. In diesem Licht arbeitet kein Dieb. |

**Hinweise**

- Jede Lampe hängt frei im Bild, aufrecht, frontal von vorn, in derselben Bildhöhe. Wo eine Lampe ein
  Fenster nach vorn hat, zeigt es auf den Betrachter, nicht zur Seite.
- **Der Schein ist die einzige Größe, die diese Reihe zeigt, und wächst monoton:** heller Kern,
  weiterer Hof, mehr ausgeleuchtete Fläche. Keine Lampe darf dunkler wirken als ihr Vorgänger — auch
  dann nicht, wenn ihr Licht die Farbe wechselt.
- Lichtfarbe nach Rang: rußiges Orange (1) → warmes Gelb (2–4) → hartes Weiß (5) → grünweißer
  Kristall (6) → Goldweiß rundum (7) → reines Weiß (8) → Blauweiß (9) → gleißendes Tageslicht (10).
- Nur 1 brennt offen. 2–8 sind geschlossene Laternen mit Bügel; 9 hat keinen Docht mehr, 10 keine
  Kammer.
- Die Bannlaterne ist als einzige in **Silber** gefasst, wo die ganze Reihe Messing trägt — sie darf
  der Hornlaterne in nichts gleichen außer der Bauform.
- Stufe 4 ist eine Lampe mit Spiegelblech hinter der Flamme — kein Mond, keine offene Schale.

## Lager (Ausrüstung – Kapazität)

Der Haufen am Stollenmund. Die Bergleute werfen hinein, der Spieler und seine Fuhrknechte laden
daraus ab. Ist es voll, ruht die Mine — das Lager ist die Grenze der Förderung, nicht bloß ein
Trichter.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Loser Erzhaufen** | Was aus dem Stollen kommt, liegt einfach da. Ein kräftiger Wind, und ein Teil davon liegt woanders. |
| 2 | **Geflochtene Erzkörbe** | Weidenkörbe in Reihe, jeder schulterhoch und randvoll. Was im Staub lag, steht nun gestapelt. |
| 3 | **Bretterverschlag** | Vier Bohlenwände, in den Boden gerammt und höher als jeder Korb. Der Haufen bleibt liegen, wo du ihn hingeschüttet hast, und darf endlich wachsen. |
| 4 | **Gezimmerter Schuppen** | Dach über dem Gold, Tür davor. Zum ersten Mal regnet es nicht in die Ausbeute. |
| 5 | **Steinernes Erzlager** | Aus Bruchstein in den Hang gemauert. Es hält den Berg auf seiner Seite und das Gold auf deiner. |
| 6 | **Grubenspeicher** | Getrennte Kammern für Erz, Bruch und Staub. Nichts vermischt sich, nichts geht im Haufen unter. |
| 7 | **Zunftdepot** | Von der Zunft abgenommen und verzeichnet, mit eigenem Vordach über der Rampe. Was hier lagert, gilt als gezählt. |
| 8 | **Gewölbelager** | Ein begehbares Tonnengewölbe aus Quadern, das Tor mannshoch, kühl und trocken. Darin türmt sich, was einmal ein Haufen war. |
| 9 | **Runenspeicher** | Bannzeichen an den Pfosten dehnen den Raum zwischen ihnen. Von außen bleibt der Speicher ein Speicher. |
| 10 | **Hallenlager** | Eine Halle am Stollenmund, in der ganze Fuhren nebeneinander stehen. Der Berg gibt kaum so schnell her, wie sie fasst. |

**Hinweise**

- Zehnmal dasselbe Bauwerk am Stollenmund, in derselben Isometrie und **nach rechts gedreht** — die
  offene Seite zum Betrachter, die sichtbare Schmalseite rechts —, mit **sichtbarem Vorrat darin**.
  Grundfläche, Höhe und Schütthöhe wachsen monoton.
- **Kein Lager hat Deckel oder Schloss** — beides gehört der Truhe. Das Gewölbelager ist ein Gebäude
  mit mannshohem Tor, in das man hineingeht, keine große beschlagene Kiste.
- Die zehnte ist die größte Bauform der Reihe und muss es auch sein: mehrere Tore, ganze Fuhren
  nebeneinander darin.
- Baustoff nach Rang: Boden → Weide → Bohlen → Zimmerholz → Bruchstein → Quader → Rune.

## Schatztruhe (Ausrüstung – Kapazität)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Morsche Holzkiste** | Ein Fund aus dem alten Stollen. Der Deckel schließt, mehr kann man von ihr nicht verlangen. |
| 2 | **Beschlagene Holztruhe** | Frisches Holz mit Eisenbändern an den Kanten. Sie steht fest und lässt sich hoch schichten. |
| 3 | **Eisentruhe** | Ganz aus Eisen genietet. Zwei Männer brauchen es, um sie auch nur zu verrücken. |
| 4 | **Riegeltruhe** | Drei Riegel, drei Schlüssel, einer davon bei dir. Der Inhalt wächst schneller als das Vertrauen. |
| 5 | **Steinschrein** | In den Fels gehauen statt daraufgestellt. Was hier hineinkommt, bleibt auch dort. |
| 6 | **Vergoldete Prunktruhe** | Goldblatt auf Eichenholz. Sie zeigt jedem, dass sich der Aufstieg gelohnt hat — auch den Falschen. |
| 7 | **Zwergentresor** | Ein Mechanismus aus siebzehn Zahnrädern gibt die runde Tür an der Front frei. Zwerge zählen ihre Sicherheit anders. |
| 8 | **Juwelentruhe** | Edelsteine in jeder Fuge, und breiter als der Tresor davor: Was hier hineinpasst, füllt einen ganzen Raum. Solcher Glanz spricht sich herum. |
| 9 | **Runentruhe** | Ein Bannkreis im geschlossenen Deckel dehnt den Innenraum weit über die Wände hinaus. Sein Licht steht durch das Holz. |
| 10 | **Drachenhort** | Kein Möbelstück mehr, sondern eine Halle voll Gold. Ein Berg dieser Größe zieht Blicke aus dem ganzen Land an. |

**Hinweise**

- Alle Truhen im selben Dreiviertelblick, **nach rechts gedreht** — Schloss und Front zum Betrachter,
  die sichtbare Schmalseite rechts —, gleicher Standfuß, und **alle geschlossen**, auch die
  Runentruhe: Ihr Bannkreis liegt im zu und leuchtet durch den Deckel.
- Die Größe wächst monoton. Die Juwelentruhe ist damit die **zweitgrößte** der Reihe: breiter als der
  Zwergentresor davor, schmaler als die Runentruhe danach.
- Beschlag nach Rang: nacktes Holz → Eisenband → Nietwerk → Riegel → Fels → Gold → Zwergenmechanik →
  Edelstein → Rune.
- Gold zeigt nur die zehnte Stufe, weil nur sie keinen Deckel mehr hat. Sie ist auch die einzige, die
  aufhört, ein Möbelstück zu sein.

## Bergleute (4 Slots, Mine)

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Tagelöhner** | Arbeitet für Brot und Bettstatt, in Hemdsärmeln und mit geliehener Haue. Er kratzt zusammen, was ohne richtiges Werkzeug zu holen ist. |
| 2 | **Grubenknappe** | Seine Lernjahre unter Tage: Lederschurz, eigene Lampe, eigene Haue. Er kennt inzwischen den Unterschied zwischen totem Fels und Ader. |
| 3 | **Hauer** | Ausgelernt, einen Kopf breiter als der Knappe und mit doppelt so schwerer Haue. Er schlägt gleichmäßig durch, Schicht für Schicht. |
| 4 | **Steinbrecher** | Breite Schultern, Eisenschienen am Arm, kurzer Stiel. Er nimmt sich den Brocken vor, an dem die anderen scheitern. |
| 5 | **Sprengmeister** | Haue in der einen Hand, Ladung in der anderen. Er setzt sie genau in die Bruchkante — ein Knall spart ihm eine Stunde Handarbeit. |
| 6 | **Erzmeister** | Liest die Adern im Gestein wie eine Karte und schlägt deshalb nie mehr daneben. Sein Panzer ist beschlagen wie seine Haue. |
| 7 | **Zwergenhauer** | Aus den Tiefenhallen angeworben, den Bart geflochten und in Ringe gefasst. Im Dunkeln arbeitet er schneller als jeder Mensch im Licht. |
| 8 | **Doppelhauer** | Zwei Hauen, ein Takt: Er schlägt links und rechts, ohne abzusetzen. Neben ihm wirkt jeder andere, als hätte er eine Hand frei. |
| 9 | **Runenbrecher** | Runenbeschlagene Platte, Sprengrunen auf dem Blatt. Er ritzt sie in die Wand und wartet; das Gestein blättert danach von selbst ab. |
| 10 | **Steingolem** | Aus dem Berg geweckt und an den Stollen gebunden, einen Kopf größer als jeder Hauer, die Haue Teil seines Arms. Er kennt weder Schichtende noch Pause. |

**Hinweise**

- Zehnmal dieselbe Standpose, in derselben Bildhöhe: aufrecht zum Betrachter, Kopf und Schultern
  eine Spur nach rechts gedreht, **der Blick nach vorn rechts aus dem Bild**. Kein Bergmann schaut
  nach links, keiner steht im vollen Profil, und keiner starrt geradeaus.
- **Jeder hält seine Pickhacke, ausnahmslos** — über alle zehn Stufen in derselben Hand, der zum
  Betrachter gedrehten (im Bild links). Wer noch etwas anderes zu zeigen hat, trägt es in der freien
  Hand auf der anderen Seite: der Sprengmeister seine Ladung, der Doppelhauer seine zweite Haue.
- **Statur und Ausrüstung wachsen monoton:** Hemdsärmel (1) → Lederschurz (2–3) → Eisen am Arm (4–5)
  → beschlagener Panzer (6–8) → runenbeschlagene Platte (9). Kein Bergmann ist schmaler als sein
  Vorgänger; der Hauer muss den Knappen überragen, so wie der Doppelhauer den Zwergenhauer.
- Stufe 7 hebt sich durch Zwergenwerk ab — geflochtener Bart, Ringe, Messingbeschlag —, nicht durch
  eine andere Körpergröße.
- Stufe 10 ist als einzige kein Mensch mehr: Stein statt Fleisch, größer als alle anderen.

## Fuhrknechte (4 Slots, Lager)

Jeder Fuhrknecht hat zwei Attribute: **Ladung** — was er je Fahrt aus dem Lager mitnimmt — und
**Geschwindigkeit**, wie schnell er die Strecke zur Truhe zurücklegt. Beim Spieler stehen dafür
Beutel und Stiefel. Jeder fährt für sich, mit eigener Ladung und eigenem Tempo; die eigene Fuhre
des Spielers läuft unabhängig daneben.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Laufbursche** | Nimmt den Sack über die Schulter und rennt los. Zurück kommt er außer Atem, aber pünktlich. |
| 2 | **Schubkarre** | Ein Rad, zwei Griffe, randvoll geschaufelt. Aus Tragen wird Rollen, aus Mühe wird Strecke. |
| 3 | **Packesel** | Stur, aber ausdauernd, mit zwei prall gefüllten Körben am Gurt. Er trägt das Mehrfache und beschwert sich nur bergauf. |
| 4 | **Packpferd** | Zwei hohe Körbe am Sattel und ein Trab, der den Weg zur Truhe halbiert. |
| 5 | **Ochsenkarren** | Langsam angefahren, dafür schwer beladen. Der Karren ächzt unter dem Gold, der Ochse nicht. |
| 6 | **Panzerkarren** | Eisenbeschlagene Bordwände, höher aufgetürmt als der Ochsenkarren, zwei Pferde davor. Was hier liegt, holt unterwegs niemand heraus. |
| 7 | **Vierspänner** | Vier Pferde vor einem Leiterwagen voller Säcke. Aus dem Weg zur Truhe wird eine kurze Fahrt. |
| 8 | **Königskutsche** | Gefedert, bewacht, mit Wappen an der Tür und Goldkisten auf Dach und Heck. Sie hält erst wieder an, wenn sie angekommen ist. |
| 9 | **Greifengespann** | Zwei Greifen ziehen den beladenen Schlitten über den Berg statt mühsam um ihn herum. |
| 10 | **Torstein** | Ein offenes Portal am Stollenende. Das Gold liegt in der Truhe, kaum dass es hineingefallen ist. |

**Hinweise**

- Jede Stufe fährt im Profil **nach rechts**, in derselben Bildhöhe: Zugtier und Bug voran zur
  rechten Bildkante, die Ladung dahinter. Keine Fuhre zieht nach links. Ab Stufe 2 zeigt das Bild nur
  Fuhrwerk und Zugtier — der Fuhrknecht selbst ist nur auf der ersten Stufe zu sehen, weil er dort
  das Fuhrwerk *ist*.
- Der Laufbursche der ersten Stufe ist der einzige Mensch dieser Leiter und steht deshalb wie die
  Bergleute und die Wachen: zum Betrachter, **den Blick nach vorn rechts** — dorthin, wohin die neun
  Fuhren nach ihm fahren. Sein Sack liegt über der hinteren Schulter, damit der Blick frei bleibt.
- **Die Ladung wächst monoton und bleibt sichtbar.** Der Panzerkarren fährt deshalb mit offener
  Bordwand und höher aufgetürmt als der Ochsenkarren davor; die Königskutsche trägt ihr Gold in
  Kisten auf Dach und Heck. Keine Stufe ab 5 zeigt weniger Fuhre als der Ochsenkarren.
- **Das Tempo wächst mit:** schwerfälliges Zugtier und stehendes Rad unten, gestreckter Galopp oben.
  Die Beine der Tiere zeigen, was die Karte als Geschwindigkeit ausweist.
- Stufe 10 hat kein Fuhrwerk mehr; das Gold fällt durch das Portal. Sie ist die einzige Stufe ohne
  Zugtier und ohne Rad.

## Wachen (4 Slots, Truhe)

Jede Wache hat drei Attribute: **Sichtweite** — was eine Runde an Risiko abträgt —,
**Geschwindigkeit**, wie schnell sie ihre Runde um die Truhe geht, und **Kraft**, die als Summe des
ganzen Trupps begrenzt, wie viel ein Diebeszug mitnimmt, wenn er trotz aller Runden gelingt. Für
Sichtweite und Geschwindigkeit stehen beim Spieler Lampe und Stiefel; die Kraft hat als einzige
keine Entsprechung, weil sie erst im Trupp wirkt.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Nachtwächter** | Ein alter Mann im Kittel, Laterne in der einen Hand, Stock in der anderen. Keine Uniform, keine Waffe — meist genügt es schon, dass überhaupt jemand wach ist. |
| 2 | **Speerknecht** | Der erste bezahlte Posten und der erste im Blau des Reichs. Langer Speer, kein Panzer: Er hält Abstand, mehr nicht. |
| 3 | **Schildwache** | Kettenhemd unter dem blauen Waffenrock, Rundschild am Arm. Sie hält, wo der Speerknecht ausgewichen wäre. |
| 4 | **Hellebardier** | Blau über blankem Brustpanzer, die Hellebarde zwei Köpfe höher als er selbst. Auf Armlänge kommt niemand mehr an die Truhe. |
| 5 | **Söldnerwache** | Kämpft für Sold, dafür aber gut — und trägt das Rot ihrer Kompanie statt das Blau des Reichs. Schwert, Schild und zwei Runden, ohne einmal stehen zu bleiben. |
| 6 | **Zweihandsöldner** | Roter Waffenrock über dem Brustpanzer, das Schlachtschwert länger als der Mann. Er braucht kein Schild, weil er niemanden herankommen lässt. |
| 7 | **Wachhauptmann** | Vollrüstung unter rotem Umhang, Federbusch am Helm. Er legt die Runden so, dass nie zweimal dieselbe Ecke unbeobachtet liegen bleibt. |
| 8 | **Ordensritter** | Weißer Waffenrock mit rotem Kreuz über voller Platte. Feste Zeiten, kein Wort zu viel; sein Rundgang klingt wie ein Urteil. |
| 9 | **Königsgardist** | Dasselbe Weiß und Rot, dazu Gold: Turmschild, Hellebarde, Helmzier. Er geht seine Runde, als hinge eine Krone daran. |
| 10 | **Bannsiegel** | Keine Gestalt mehr, sondern ein Zeichen: drei ineinanderliegende Runenringe, die frei über dem Hort stehen und sich gegeneinander drehen, weißes Licht mit rotem Kern. Niemand geht mehr eine Runde — der Bann liegt in allen Ecken zugleich, und wer hineingreift, findet die Luft über dem Gold so fest wie Fels. |

**Hinweise**

- Gleiche Standpose, in derselben Bildhöhe: aufrecht zum Betrachter, Kopf und Schultern eine Spur
  nach rechts gedreht, **der Blick nach vorn rechts aus dem Bild** — derselbe Dreiviertelblick wie
  bei den Bergleuten, damit Mine und Truhe in dieselbe Richtung schauen. Das gilt für die neun
  Stufen, die ein Gesicht haben; die zehnte hat keines mehr. Das Bannsiegel hängt in derselben
  Bildhöhe wie die Köpfe vor ihm und folgt der Richtung der Tafel wie die Truhen: die Ringe nach
  rechts gekippt, die sichtbare Schmalseite rechts.
- **Waffenhand und Schildhand wechseln nie.** Die Waffe steht über die ersten neun Stufen auf
  derselben Seite — der zum Betrachter gedrehten, im Bild links —, Schild und Laterne auf der
  anderen. Die zehnte hat weder Hand noch Waffe; mit ihr hört die Regel auf, wie alles andere an
  ihr.

**Die Uniform wechselt genau dreimal, und jeder Wechsel ist ein Rang:**

| Stufen | Farbe | wer |
|---|---|---|
| 1 | keine Uniform, keine Waffe | der Nachtwächter, der nur wach ist |
| 2–4 | Blau | die bezahlte Wache des Reichs |
| 5–7 | Rot | die angeworbene Söldnerkompanie |
| 8–10 | Weiß mit Rot | Orden, Garde und der Bann — beim Siegel als Licht statt als Tuch |

- **Innerhalb jedes Blocks wachsen Panzer und Waffe:** Tuch → Kettenhemd → Brustpanzer →
  Vollrüstung, und Speer → Speer und Schild → Stangenwaffe → Schlachtschwert → Turmschild und
  Hellebarde. **Kraft** ist im Bild nichts anderes als die Masse der Rüstung und die Größe der Waffe;
  wer weiter oben steht, sieht gefährlicher aus, nicht nur teurer. Beim Bannsiegel tragen das die
  Zahl der Ringe und die Dichte der Runen darin.
- **Jede Wache steht aufrecht, offen und bewaffnet** — nichts Verhülltes, Geducktes oder Verborgenes
  in einer Leiter, deren ganzer Sinn sichtbare Gefahr ist. Das gilt für die neun, die einen Körper
  haben; das Siegel verbirgt trotzdem nichts, sondern steht offen und hell über dem Hort und ist von
  weiter weg zu sehen als jede Wache vor ihm.
- Stufe 10 ist als einzige keine Gestalt mehr — weder Mensch noch Tier noch Rüstung, sondern reine
  Bannarbeit: das, wofür die neun Stufen davor ihre Runden gehen, ohne jemanden, der sie geht. Kein
  Körper, keine Hände, keine Waffe.
- **Sie geht auch keine Runde, sie dreht sich.** Was bei den neun davor die Schrittfolge ist, ist bei
  ihr die Umdrehung der Ringe — und sie ist größer als jede Gestalt davor: Das Siegel steht über dem
  ganzen Hort, nicht neben ihm.
