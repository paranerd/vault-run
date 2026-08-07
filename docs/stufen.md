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
| Pickhacke | Fördermenge | seinen Schlag an der Ortsbrust |
| Beutel | Ladung | seine eigene Ausfahrt |
| Stiefel | Geschwindigkeit | seine Ausfahrt **und** seinen Wachgang |
| Grubenlampe | Sichtweite | seinen Wachgang an der Truhe |
| Erzkammer | Kapazität | den Puffer zwischen Förderung und Abtransport |
| Schatztruhe | Kapazität | den Hort, aus dem bezahlt wird |

**Wer dasselbe tut, trägt denselben Namen — und damit dieselbe Skala.** Jedem Attribut einer
Einheit steht ein Ausrüstungsstück gegenüber, das dasselbe für den Spieler tut:

| Einheit | ihre Attribute | beim Spieler |
|---|---|---|
| Bergmann | Fördermenge | Pickhacke |
| Transport | Ladung, Geschwindigkeit | Beutel, Stiefel |
| Wache | Sichtweite, Geschwindigkeit, Kraft | Lampe, Stiefel, — |

Die **Kraft** der Wachen steht als einzige allein: Sie wirkt erst als Summe des ganzen Trupps und
hat deshalb keine Entsprechung beim Einzelnen.

Alle **Geschwindigkeiten** messen an derselben Standardstrecke — der Strecke von der Erzkammer ans
Tageslicht: Wer sie in zwölf Sekunden zurücklegt, hat Tempo 1. Das ist keine Rechenkonvention,
sondern fällt zusammen — die Ausfahrt des Spielers, die Fahrt eines Transports der ersten Stufe und
die Runde einer Wache der ersten Stufe dauern alle zwölf Sekunden. „Geschwindigkeit 1,9“ auf der
Schubkarren-Karte ist damit unmittelbar gegen „1,3“ auf der Stiefelkarte lesbar. Der Wachgang des
Spielers ist demgegenüber kein schnellerer Weg, sondern ein kürzerer (1,5 s): Er späht um die
Truhe, statt sie zu umrunden.

Alle **Sichtweiten** zählen in denselben Punkten der Hundert-Punkte-Skala des Risikos, Lampe wie
Wache.

## Wie eine Leiter aussieht

Zehn Bilder eines Strangs müssen als **eine Reihe** lesbar sein. Was für jede Leiter gilt, steht
hier einmal; was nur für eine gilt, steht als **Hinweise** unter ihrer Tabelle.

- **Eine Reihe, eine Ansicht.** Alle zehn Bilder zeigen denselben Gegenstand aus demselben Winkel,
  in derselben Bildhöhe, ohne Boden, Kulisse und Beiwerk.
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
| 10 | **Drachenzahnhaue** | Zwei Zähne desselben Drachen auf schwarzem Eichenstiel. Der Stein bricht schon, bevor sie ihn ganz erreicht. |

**Hinweise**

- Immer ein einzelnes Werkzeug: Kopf oben, Stiel schräg nach unten, in allen zehn Bildern gleich
  gedreht. Kein Fels, kein Boden, keine Hand.
- Kopfmasse und Stielbeschlag wachsen monoton — Wicklung, Ringe, Zwingen. Keine Stufe darf schlanker
  oder stumpfer wirken als ihr Vorgänger, auch keine dunklere.
- **Stufen 1–4 tragen Blatt und Hammerbahn, Stufen 5–10 zwei Spitzen.** Die Doppelspitze ist keine
  Marotte der fünften Stufe, sondern gilt ab ihr; auch die Drachenzahnhaue hat deshalb zwei Zähne
  und nicht einen.
- 4 und 6 sind beide blanker Stahl und dürfen sich nicht gleichen: 4 ist nüchtern poliert, 6 trägt
  den hellen Silberstrich in der Schneide und einen Goldschimmer an den Spitzen.
- Licht gibt erst 9. Nur 10 ist nicht aus Metall.

## Beutel (Ausrüstung – Ladung)

Was der Spieler selbst schultert und ans Tageslicht trägt. Nicht zu verwechseln mit der
**Erzkammer**, in die seine Bergleute fördern: Aus der Kammer füllt er den Beutel, mehr als dort
liegt trägt er nie.

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

- Zehnmal derselbe Gegenstand: ein Beutel oder Sack, aufrecht, prall, von vorn. **Kein Rucksack,
  keine Gürteltasche, nichts am Körper getragen** — was der Spieler schultert, steht im Bild für
  sich allein.
- Umfang und Fülle wachsen monoton; ab Stufe 3 schaut Gold über den Rand, und die Menge wächst mit.
- Kein Beutel ist doppelt und keiner wird am Gürtel getragen; die Gurte der vierten Stufe liegen um
  den Beutel, nicht um den Mann.
- Farbe folgt dem Rang: braunes Leder (1–4) → grobes Tuch und beschlagenes Leder (5–7) → Purpur mit
  Gold (8) → Runenblau (9) → Schwarz mit violettem Saum (10). Jede der letzten drei Farben trägt
  genau eine Stufe.

## Stiefel (Ausrüstung – Geschwindigkeit)

Das einzige Stück, das auf zwei Handlungen wirkt: Ausfahrt und Wachgang sind beide Wege, die der
Spieler zu Fuß zurücklegt. Ohne sie wäre der Wachgang der einzige Teil von ihm, der nie besser
wird — und damit spätestens ab der dritten Wache überflüssig.

Gemessen wird das **Tempo**, nicht die Dauer: Die Zahl wächst mit jeder Stufe, und die Wege werden
trotzdem kürzer, weil eine Strecke `Länge ÷ Geschwindigkeit` kostet. Dieselbe Größe tragen der
Transport und die Wache.

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
| 10 | **Windstiefel** | Silberweiß, mit Schwingen an den Fersen — die einzigen der Reihe, die nicht mehr laufen. Du setzt auf und bist da. |

**Hinweise**

- Ein einzelner Stiefel im Profil, in allen zehn Bildern nach derselben Seite gewandt, in derselben
  Bildhöhe.
- **Der Schaft wächst monoton:** 1–2 knöchelhoch, 3 wadenhoch, ab 4 kniehoch. Kein Stiefel ist
  niedriger als sein Vorgänger — die Reihe springt nie zwischen Halbschuh und Schaftstiefel hin und
  her.
- **Und mit der Höhe wächst das Tempo:** engerer Schnitt, dünnere und härtere Sohle, weniger klobiges
  Beschlagwerk, stärkere Neigung nach vorn. Ein Stiefel dieser Reihe wird nicht schwerer, sondern
  schneller.
- **Schwingen trägt allein die zehnte Stufe.** Die sechste ist leicht durch dünnes Leder, nicht durch
  Gefieder.
- Farbe: braunes Leder (1–3) → geschwärztes Leder mit Eisenkappe (4) → staubbraun mit Riemen (5) →
  helles Hirschleder (6) → dunkel mit Messing (7) → Rot mit Gold (8) → Schwarz mit blauen Runen (9)
  → Silberweiß (10).

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

- Jede Lampe hängt frei im Bild, aufrecht, von vorn, in derselben Bildhöhe.
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

## Erzkammer (Ausrüstung – Kapazität)

Der Hohlraum im Fels, gleich hinter der Ortsbrust. Die Bergleute werfen hinein, der Spieler und
seine Transporte laden daraus ab. Ist sie voll, ruht die Mine — die Kammer ist die Grenze der
Förderung, nicht bloß ein Trichter.

Sie wächst, indem der Berg zurückweicht: Jede Stufe ist mehr ausgehauener Raum, nicht mehr
gebautes Haus. Ein Gebäude fände im Stollen keinen Platz — ein Hohlraum wird einfach größer.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Haufwerk** | Was aus der Wand bricht, bleibt liegen, wo es fällt. Wer den Fuß falsch setzt, verteilt die halbe Schicht über die Sohle. |
| 2 | **Erztrog** | Ein ausgehöhlter Stamm an der Stollenwand. Der Haufen läuft nicht mehr auseinander, und du siehst zum ersten Mal, wie viel es ist. |
| 3 | **Ausgehauene Nische** | Eine Weitung in die Seitenwand geschlagen. Zum ersten Mal gibt der Fels Platz her, statt welchen zu nehmen. |
| 4 | **Verzimmerte Kammer** | Türstöcke und Stempel halten die Firste. Die Kammer darf höher werden als ein Mann, ohne dass der Berg nachrutscht. |
| 5 | **Gemauerte Erzkammer** | Bruchstein im Verband gegen den Gebirgsdruck. Der Berg hört auf, sich zurückzuholen, was du ihm abgerungen hast. |
| 6 | **Gewölbekammer** | Ein Tonnengewölbe aus Quadern, mannshoch und trocken. Darin stehen mehrere Schüttungen nebeneinander statt eine über der anderen. |
| 7 | **Rollkammer** | Rolllöcher aus den oberen Sohlen münden in die Firste. Was dort oben gehauen wird, fällt von selbst herein. |
| 8 | **Zwergensaal** | Auf den Zoll genau geschlagen, die Kanten messinggefasst, die Schütthöhe zwei Mann. Zwerge hauen Säle, wo Menschen Löcher hauen. |
| 9 | **Runenkammer** | Bannzeichen in den Pfeilern dehnen den Raum zwischen ihnen. Von der Strecke aus bleibt es ein Türstock. |
| 10 | **Berghalle** | Der Berg selbst ausgehöhlt, ganze Lorenzüge nebeneinander darin. Er gibt kaum so schnell her, wie sie fasst. |

**Hinweise**

- Zehnmal derselbe Ausschnitt der Stollenwand, in derselben Isometrie, mit **sichtbarem Vorrat
  darin**. Grundfläche, Höhe und Schütthöhe wachsen monoton.
- **Die Kammer wird ausgehauen, nicht gebaut.** Kein Dach, keine freistehende Wand, kein Gebäude —
  jede Stufe ist ein Hohlraum im Fels, und was an Holz oder Stein hinzukommt, kleidet ihn aus,
  statt ihn zu umbauen.
- **Keine Kammer hat Tür, Deckel oder Schloss** — die gehören der Truhe. Zur Strecke hin steht sie
  offen, sonst käme kein Hunt hinein.
- Die zehnte ist die größte Form der Reihe und muss es auch sein: mehrere Weitungen, ganze
  Lorenzüge nebeneinander darin.
- Baustoff nach Rang: Sohle → Holz → nackter Fels → Zimmerholz → Bruchstein → Quader →
  Zwergenwerk → Rune → der Berg selbst.

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

- Alle Truhen im selben Dreiviertelblick, gleich gedreht, gleicher Standfuß — und **alle
  geschlossen**, auch die Runentruhe: Ihr Bannkreis liegt im zu und leuchtet durch den Deckel.
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

- Zehnmal dieselbe Standpose, frontal, in derselben Bildhöhe.
- **Jeder hält seine Pickhacke, ausnahmslos.** Wer noch etwas anderes zu zeigen hat, trägt es in der
  freien Hand: der Sprengmeister seine Ladung, der Doppelhauer seine zweite Haue.
- **Statur und Ausrüstung wachsen monoton:** Hemdsärmel (1) → Lederschurz (2–3) → Eisen am Arm (4–5)
  → beschlagener Panzer (6–8) → runenbeschlagene Platte (9). Kein Bergmann ist schmaler als sein
  Vorgänger; der Hauer muss den Knappen überragen, so wie der Doppelhauer den Zwergenhauer.
- Stufe 7 hebt sich durch Zwergenwerk ab — geflochtener Bart, Ringe, Messingbeschlag —, nicht durch
  eine andere Körpergröße.
- Stufe 10 ist als einzige kein Mensch mehr: Stein statt Fleisch, größer als alle anderen.

## Transporte (4 Slots, Erzkammer)

Jeder Transport hat zwei Attribute: **Ladung** — was er je Fahrt aus der Erzkammer mitnimmt — und
**Geschwindigkeit**, wie schnell er die Strecke ans Tageslicht zurücklegt. Beim Spieler stehen
dafür Beutel und Stiefel. Jeder fährt für sich, mit eigener Ladung und eigenem Tempo; die eigene
Ausfahrt des Spielers läuft unabhängig daneben.

Die Leiter heißt nach dem Fördermittel, nicht nach dem Mann davor: Ab Stufe 3 ist kein Mensch mehr
im Bild, und ein Personenname („Fuhrknecht“, wie der Strang bis zur Verlegung unter Tage hieß)
beschriebe sieben von zehn Stufen falsch.

| # | Name | Beschreibung |
|---|------|--------------|
| 1 | **Sackträger** | Ein Sack über der Schulter, die freie Hand an der Wand. Mehr geht nicht, und zweimal gehen kostet zweimal Zeit. |
| 2 | **Jochträger** | Ein Schulterjoch, an jedem Ende ein praller Sack. Die Hände bleiben frei, und die doppelte Last hängt, statt getragen zu werden. |
| 3 | **Schubkarre** | Ein Rad, zwei Griffe, überhäuft geschaufelt. Aus Tragen wird Rollen — von hier an schleppt niemand mehr. |
| 4 | **Holzhunt** | Ein Bohlenkasten auf vier kleinen Rädern, an einem Spurnagel durch die Strecke geschoben. Er fasst, wofür du dreimal gefahren wärst. |
| 5 | **Eisenhunt** | Eisenbeschlagen und erstmals auf Schienen. Wo die Schiene liegt, rollt er von allein weiter — und höher geschüttet als der Holzhunt davor. |
| 6 | **Kipplore** | Ein eisernes Kippgefäß auf einem Drehkranz: an der Kammer volllaufen lassen, am Tageslicht umlegen. Auf der ganzen Strecke wird nicht mehr umgeladen. |
| 7 | **Lorenzug** | Drei Loren aneinandergekuppelt, ein endloses Seil zieht sie die Strecke hinauf. Ein Seil ermüdet nicht, also hält der Zug auch nicht an. |
| 8 | **Zwergenbahn** | Messingschiene, Zahnradantrieb, Zwerge an den Hebeln. Sie hält einen Takt, den kein Seil hält, und lädt im Fahren. |
| 9 | **Runenbahn** | Die Loren schweben eine Handbreit über dem Gleis, die Schiene ist nur noch ein Lichtstrich im Fels. Nichts reibt, nichts bremst. |
| 10 | **Tagestor** | Ein offenes Portal in der Kammerwand. Das Gold liegt oben in der Truhe, kaum dass es hineingefallen ist. |

**Hinweise**

- Jede Stufe im Profil, in derselben Richtung — zum Tageslicht hin — und in derselben Bildhöhe.
  Kein Fels, kein Gleisbett über die Stufe hinaus, keine Kulisse.
- **Ab Stufe 3 zeigt das Bild nur das Fördermittel.** Ein Mensch steht nur auf 1 und 2 darin, weil
  er dort das Fördermittel *ist*. Die Zwerge der achten Stufe sind keine Ausnahme: Sie bedienen die
  Bahn, sie tragen nicht — eine Stufe, die wieder jemanden schleppen ließe, wäre eine Stufe zurück.
- **Keine zwei Stufen teilen dieselbe Silhouette**, und die Reihe wechselt dafür bewusst ab, *was*
  sie zeigt: ein Sack (1), ein Joch mit zwei Säcken (2), ein Rad (3), ein Kasten ohne Schiene (4),
  ein Kasten auf Schiene (5), ein Kippgefäß auf Drehkranz (6), drei Wagen an einem Seil (7),
  Zahnräder (8), ein Schweben (9), ein Bogen (10). „Dasselbe, nur besser“ ist auf dieser Leiter
  nirgends der Unterschied zwischen zwei Stufen — sonst wären 4/5 und 6/7 auf Daumengröße
  dieselbe Kiste.
- **Die Ladung wächst monoton und bleibt sichtbar.** Alle Kästen sind offen und überhäuft
  geschüttet; ein Deckel nimmt der Stufe ihr Argument.
- **Das Tempo zeigt die Bahn, nicht das Bein.** In dieser Reihe steht kein Zugtier, also tragen es
  Schiene und Seil: dichtere Schwellen, straff gezogenes Seil, nach vorn geneigter Kasten,
  Staubfahne hinter dem Rad.
- Baustoff nach Rang: Sackleinen (1–2) → Holz (3–4) → Eisen (5–7) → Messing und Zwergenwerk (8) →
  Rune (9) → Fels und Licht (10).
- **„Hunt“ immer mit t** — der Förderwagen, nicht das Tier.
- Stufe 10 hat kein Fördermittel mehr; das Gold fällt durch das Portal. Sie ist die einzige Stufe
  ohne Rad.

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
| 10 | **Greifenreiter** | Weiß-roter Waffenrock, Lanze quer, unter ihm ein Greif. Er zieht seine Kreise hoch über dem Hort — von dort oben bleibt keine Ecke lange dunkel. |

**Hinweise**

- Gleiche Standpose, frontal, in derselben Bildhöhe. Nur die zehnte Stufe sitzt auf.

**Die Uniform wechselt genau dreimal, und jeder Wechsel ist ein Rang:**

| Stufen | Farbe | wer |
|---|---|---|
| 1 | keine Uniform, keine Waffe | der Nachtwächter, der nur wach ist |
| 2–4 | Blau | die bezahlte Wache des Reichs |
| 5–7 | Rot | die angeworbene Söldnerkompanie |
| 8–10 | Weiß mit Rot | Orden, Garde und Reiter |

- **Innerhalb jedes Blocks wachsen Panzer und Waffe:** Tuch → Kettenhemd → Brustpanzer →
  Vollrüstung, und Speer → Speer und Schild → Stangenwaffe → Schlachtschwert → Turmschild und
  Hellebarde. **Kraft** ist im Bild nichts anderes als die Masse der Rüstung und die Größe der Waffe;
  wer weiter oben steht, sieht gefährlicher aus, nicht nur teurer.
- **Jede Wache steht aufrecht, offen und bewaffnet** — nichts Verhülltes, Geducktes oder Verborgenes
  in einer Leiter, deren ganzer Sinn sichtbare Gefahr ist.
- Der Greif der zehnten Stufe ist das einzige Tier der Reihe — und er trägt eine Wache, statt eine zu
  sein.
