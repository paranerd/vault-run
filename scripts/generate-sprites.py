#!/usr/bin/env python3
"""Erzeugt die Sprites für Stiefel, Grubenlampe, Erzkammer, die beiden Aktions-Icons und die Ortsbrust.

PLATZHALTER. Die übrigen Reihen unter `public/sprites` sind gezeichnete 160x160-Bilder mit
mehreren tausend Farben; was dieses Skript ausgibt, ist bewusst einfacher: ein 32x32-Raster in der
Palette der vorhandenen Sprites, fünffach vergrößert. Es hält die neuen Karten lesbar, bis
richtige Grafik da ist — und dokumentiert zugleich, was auf ihnen zu sehen sein soll.

Alles, was dieses Skript schreibt, ist ein Platzhalter. Welche Sprites das sind und welche
gezeichnet, steht vollständig in `docs/DESIGN.md` unter „Stand der Sprites"; die Liste dort nennt
zusätzlich die eine gezeichnete Reihe, die inhaltlich veraltet ist.

Aufruf: python3 scripts/generate-sprites.py
"""

import struct
import zlib
from pathlib import Path

GRID = 32
SCALE = 5
OUT = Path(__file__).resolve().parent.parent / 'public' / 'sprites'

# Palette aus den vorhandenen Sprites: dunkle Konturen, Leder, Eisen, Gold, Flamme, Stein, Holz.
LINE = (0x1f, 0x0f, 0x09)
DARK = (0x29, 0x14, 0x0c)
LEATHER = [(0x5c, 0x40, 0x2a), (0x6a, 0x45, 0x24), (0x8a, 0x5a, 0x2b), (0x5a, 0x38, 0x1e)]
LEATHER_LIT = [(0x75, 0x53, 0x38), (0x86, 0x5a, 0x30), (0xa8, 0x74, 0x3c), (0x77, 0x4c, 0x28)]
IRON = (0x4a, 0x4f, 0x57)
IRON_LIT = (0x8b, 0x93, 0x9d)
BRASS = (0xa8, 0x7b, 0x2c)
BRASS_LIT = (0xd8, 0xa8, 0x48)
GOLD = (0xc9, 0x79, 0x17)
GOLD_LIT = (0xf7, 0xc6, 0x4d)
GOLD_HI = (0xff, 0xe8, 0x94)
FLAME = (0xff, 0x9b, 0x21)
FLAME_LIT = (0xff, 0xe0, 0x7a)
GLASS = [(0x6b, 0x5a, 0x33), (0x86, 0x70, 0x3c), (0xa8, 0x8c, 0x46), (0xcf, 0xac, 0x52)]
STONE = (0x5b, 0x5b, 0x57)
STONE_LIT = (0x84, 0x82, 0x79)
WOOD = (0x6d, 0x42, 0x1e)
WOOD_LIT = (0x93, 0x5e, 0x2c)
GROUND = (0x3a, 0x2a, 0x1a)
SKIN = (0xc2, 0x8c, 0x59)
SKIN_LIT = (0xe0, 0xac, 0x74)
CLOTH = (0x3f, 0x52, 0x6e)
CLOTH_LIT = (0x5b, 0x72, 0x95)


class Canvas:
    def __init__(self):
        self.px = [[None] * GRID for _ in range(GRID)]

    def set(self, x, y, colour):
        if 0 <= x < GRID and 0 <= y < GRID and colour is not None:
            self.px[y][x] = colour

    def clear(self, x, y):
        """Nimmt einen Punkt wieder heraus — so bekommen gerundete Formen ihre Ecken zurück."""
        if 0 <= x < GRID and 0 <= y < GRID:
            self.px[y][x] = None

    def rect(self, x0, y0, x1, y1, colour):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, colour)

    def outlined(self, x0, y0, x1, y1, fill, lit=None):
        """Fläche mit harter Kontur — der Look aller vorhandenen Sprites."""
        self.rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, LINE)
        self.rect(x0, y0, x1, y1, fill)
        if lit is not None:
            self.rect(x0, y0, x1, y0, lit)
            self.rect(x0, y0, x0, y1, lit)

    def write(self, name):
        rows = []
        for row in self.px:
            line = bytearray([0])
            for cell in row:
                r, g, b = cell if cell else (0, 0, 0)
                line += bytes((r, g, b, 255 if cell else 0)) * SCALE
            rows.extend([bytes(line)] * SCALE)
        raw = b''.join(rows)
        side = GRID * SCALE

        def chunk(tag, data):
            body = tag + data
            return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body))

        png = (b'\x89PNG\r\n\x1a\n'
               + chunk(b'IHDR', struct.pack('>IIBBBBB', side, side, 8, 6, 0, 0, 0))
               + chunk(b'IDAT', zlib.compress(raw, 9))
               + chunk(b'IEND', b''))
        (OUT / f'{name}.png').write_bytes(png)


def boots(stage):
    """Durchgelaufener Schuh → Grubenstiefel: höherer Schaft, Nägel, Schnürung, Eisenkappe.

    Ein einzelner Stiefel im Profil. Zwei überlappende verwaschen auf 32 Rasterpunkten zu einer
    Fläche; die anderen Ausrüstungssprites zeigen ebenfalls genau einen Gegenstand.
    """
    cv = Canvas()
    fill, lit = LEATHER[stage], LEATHER_LIT[stage]
    top = 18 - [3, 6, 9, 12][stage]
    cv.outlined(8, top, 17, 18, fill, lit)                           # Schaft
    cv.rect(8, top, 17, top + 1, lit)                                # Stulpe
    cv.outlined(6, 19, 25, 24, fill, lit)                            # Fuß
    cv.rect(6, 19, 25, 19, lit)                                      # Rist im Licht
    cv.outlined(5, 25, 26, 26, DARK)                                 # Sohle
    cv.rect(5, 22, 8, 24, DARK)                                      # Absatz
    if stage >= 1:                                                   # Nägel in der Sohle
        for nail in range(7, 26, 3):
            cv.set(nail, 26, IRON_LIT)
    if stage >= 2:                                                   # Schnürung
        for lace in range(top + 3, 18, 3):
            cv.rect(9, lace, 16, lace, GOLD_LIT if stage >= 3 else lit)
            cv.set(9, lace, LINE)
            cv.set(16, lace, LINE)
    if stage >= 3:                                                   # Eisenkappe vorn
        cv.outlined(20, 19, 25, 24, IRON, IRON_LIT)
    return cv


def lamp(stage):
    """Talgfunzel → Spiegelöllampe: geschlossener Korpus, größeres Glas, hellere Flamme."""
    cv = Canvas()
    width = [4, 5, 6, 7][stage]
    left, right = 15 - width, 16 + width
    cv.rect(15, 3, 16, 5, IRON)                                      # Bügel
    for step in range(width + 1):                                    # Aufhängung
        cv.set(15 - step, 5 + step // 2, IRON)
        cv.set(16 + step, 5 + step // 2, IRON)
    cap = BRASS if stage >= 2 else IRON
    cap_lit = BRASS_LIT if stage >= 2 else IRON_LIT
    cv.outlined(left, 8, right, 10, cap, cap_lit)                    # Haube
    cv.outlined(left, 11, right, 21, GLASS[stage], None)             # Glas
    cv.outlined(left, 22, right, 24, cap, cap_lit)                   # Fuß
    flame_top = 19 - [2, 3, 4, 5][stage]
    cv.rect(15, flame_top, 16, 20, FLAME)                            # Flamme
    cv.rect(15, flame_top + 1, 16, 18, FLAME_LIT)
    if stage >= 1:                                                   # Streben im Glas
        cv.rect(left, 11, left, 21, cap)
        cv.rect(right, 11, right, 21, cap)
    if stage >= 3:                                                   # Spiegel hinter der Flamme
        cv.rect(left + 1, 12, left + 2, 20, BRASS_LIT)
        cv.rect(right - 2, 12, right - 1, 20, BRASS_LIT)
    return cv


def rock_block(cv, top=5):
    """Ein Stück anstehendes Gebirge mit gebrochener Kante — der Träger von Kammer und Ortsbrust.

    Beide Bilder liegen im Fels, stehen aber wie jedes andere Sprite frei auf Transparenz: Der
    Block hat deshalb eine eigene, unregelmäßige Silhouette, statt das Feld randlos zu füllen.
    Die Körnung ist bewusst grob und unregelmäßig — ein gleichmäßiges Raster läse sich als Mauer
    oder Gewebe, und gemauert ist an dieser Stelle nichts.
    """
    edges = [0, 1, 1, 2, 2, 1, 0, 1]
    for x in range(1, 31):
        edge = top + edges[(x // 2) % len(edges)]
        for y in range(edge, 29):
            if (x * 3 + y * 7) % 9 == 0:
                cv.set(x, y, STONE_LIT)                              # Glimmer im Bruch
            elif (x * 5 + y * 11) % 13 == 0:
                cv.set(x, y, DARK)                                   # Kluft
            else:
                cv.set(x, y, STONE)
        cv.set(x, edge - 1, LINE)                                    # Kontur nach oben
    cv.rect(1, 29, 30, 30, GROUND)                                   # Sohle


def stock(stage):
    """Haufwerk → Berghalle: nicht ein wachsendes Bauwerk, sondern ein wachsender Hohlraum.

    Die Kammer liegt im Fels und wird ausgehauen, nicht gebaut — ein Schuppen oder eine Halle
    fänden im Stollen keinen Platz. Der Block bleibt darum über alle vier Stufen derselbe; was
    wächst, ist der Raum darin und die Schüttung. Was an Holz und Stein hinzukommt, kleidet den
    Hohlraum aus: Türstock (1), Quadergewölbe (2), Pfeilerhalle (3). Deckel oder Tür hat keine
    Stufe — nach vorn steht die Kammer offen, sonst käme kein Hunt hinein.
    """
    cv = Canvas()
    rock_block(cv)
    x0, x1, top = [(12, 19, 22), (9, 22, 17), (6, 25, 12), (3, 28, 8)][stage]
    heap = [4, 8, 11, 14][stage]

    cv.rect(x0 - 1, top - 1, x1 + 1, 28, LINE)                       # Kontur des Ausbruchs
    cv.rect(x0, top, x1, 28, DARK)                                   # der ausgehauene Raum
    for x in range(x0, x1 + 1, 3):                                   # Schrämspuren an der Firste
        cv.set(x, top, STONE)

    if stage == 1:                                                   # Türstock: zwei Stempel, ein Sturz
        for x in (x0, x1 - 1):
            cv.rect(x, top + 2, x + 1, 28, WOOD)
            cv.rect(x, top + 2, x, 28, WOOD_LIT)
        cv.rect(x0, top, x1, top + 1, WOOD)
        cv.rect(x0, top, x1, top, WOOD_LIT)
    if stage >= 2:                                                   # Gewölbe bzw. Halle aus Quadern
        pillars = (x0, x1 - 1) if stage == 2 else (x0, x1 - 1, 11, 20)
        for x in pillars:
            cv.rect(x, top + 2, x + 1, 28, STONE_LIT)
            cv.rect(x + 1, top + 2, x + 1, 28, STONE)
        cv.rect(x0, top, x1, top + 1, STONE_LIT)
        cv.rect(x0, top + 1, x1, top + 1, STONE)
        for x in range(x0 + 2, x1 - 1, 4):                           # Fugen
            cv.rect(x, top, x, top + 1, LINE)

    limit = (x1 - x0) // 2
    for row in range(heap):                                          # Haufwerk aus Erz und Gold
        y = 28 - row
        half = min(limit, max(1, heap - row + 2))
        cv.rect(16 - half, y, 15 + half, y, STONE if row % 2 else STONE_LIT)
        for x in range(16 - half, 16 + half, 4):
            cv.set(x + row % 3, y, GOLD if row % 2 else GOLD_LIT)
    cv.set(16, 28 - heap, GOLD_HI)
    return cv


def action_guard():
    """Platzhalter „Wache gehen": Wächter im Schritt, Speer geschultert, Laterne erhoben.

    Anders als die Ausrüstungssprites kennt dieses Bild keine Stufen — der Wachgang wird nicht
    ausgebaut, nur die Lampe, mit der er gegangen wird. Es steht auf dem Aktions-Button der Truhe
    und zeigt deshalb die Handlung, nicht den Behälter.
    """
    cv = Canvas()
    cv.rect(1, 29, 30, 30, GROUND)                                   # Boden
    cv.outlined(8, 20, 11, 25, CLOTH, CLOTH_LIT)                     # hinteres Bein
    cv.rect(6, 26, 11, 27, DARK)                                     # Stiefel hinten
    cv.outlined(14, 20, 17, 26, CLOTH, CLOTH_LIT)                    # vorderes Bein im Schritt
    cv.rect(14, 27, 20, 28, DARK)                                    # Stiefel vorn
    cv.outlined(9, 12, 17, 19, CLOTH, CLOTH_LIT)                     # Rumpf
    cv.rect(9, 18, 17, 19, LEATHER[2])                               # Gürtel
    cv.rect(9, 18, 17, 18, LEATHER_LIT[2])
    cv.outlined(11, 8, 17, 11, SKIN, SKIN_LIT)                       # Gesicht
    cv.set(16, 9, LINE)                                              # Auge
    cv.outlined(10, 4, 18, 7, IRON, IRON_LIT)                        # Helm
    cv.rect(9, 7, 19, 7, IRON_LIT)                                   # Krempe
    cv.rect(13, 2, 15, 3, BRASS_LIT)                                 # Helmbusch
    cv.outlined(18, 13, 20, 14, SKIN, SKIN_LIT)                      # Arm zur Laterne
    cv.rect(22, 12, 22, 16, IRON)                                    # Aufhängung
    cv.rect(20, 12, 22, 12, IRON)
    cv.outlined(19, 17, 25, 18, BRASS, BRASS_LIT)                    # Haube
    cv.outlined(19, 19, 25, 24, GLASS[3], None)                      # Glas
    cv.rect(21, 20, 23, 24, FLAME)                                   # Flamme
    cv.rect(21, 21, 22, 23, FLAME_LIT)
    cv.outlined(19, 25, 25, 26, BRASS, BRASS_LIT)                    # Fuß
    for step in range(23):                                           # Speer quer über der Schulter
        cv.set(2 + step, 28 - step, WOOD_LIT if step % 3 else WOOD)
        cv.set(3 + step, 28 - step, WOOD)
    cv.rect(24, 4, 25, 6, IRON_LIT)                                  # Speerspitze
    cv.set(25, 3, IRON_LIT)
    return cv


def action_transport():
    """Platzhalter „Ausfahren": praller Goldsack, daneben ein Pfeil nach oben ans Tageslicht."""
    cv = Canvas()
    cv.rect(1, 29, 30, 30, GROUND)
    cv.outlined(3, 13, 17, 27, LEATHER[2], LEATHER_LIT[2])           # Sack
    for corner in ((2, 12), (3, 12), (2, 13), (18, 12), (17, 12), (18, 13), (2, 28), (18, 28)):
        cv.clear(*corner)                                            # gerundete Ecken
    cv.outlined(7, 9, 13, 12, LEATHER[1], LEATHER_LIT[1])            # Hals
    cv.rect(6, 11, 14, 11, DARK)                                     # Schnur
    cv.rect(8, 6, 12, 8, GOLD)                                       # Münzen im offenen Hals
    cv.rect(8, 6, 11, 7, GOLD_LIT)
    cv.rect(9, 5, 11, 6, GOLD_HI)
    cv.rect(5, 19, 15, 21, GOLD)                                     # Goldband auf dem Bauch
    cv.rect(6, 20, 14, 20, GOLD_LIT)
    def arrow(colour, grow):                                         # Pfeil nach oben: ans Tageslicht
        cv.rect(22 - grow, 13, 26 + grow, 27 + grow, colour)         # Schaft
        for step in range(6 + grow):                                 # Spitze
            half = 5 + grow - step
            cv.rect(24 - half, 13 - step, 24 + half, 13 - step, colour)

    arrow(LINE, 1)                                                   # Kontur wie bei jedem Sprite
    arrow(GOLD_LIT, 0)
    cv.rect(22, 14, 22, 26, GOLD_HI)
    return cv


def goldmine():
    """Platzhalter „Ortsbrust": die Wand vor dem Hauer, mit der Goldader darin.

    Steht links im Minen-Abschnitt an der Stelle, an der vorher die Förderrate stand — der Ort
    statt seiner Kennzahl, wie Truhe und Erzkammer auch ihr eigenes Bild tragen. Bis zur Verlegung
    unter Tage war das die Goldmine von außen: der einzige Blick der Szene, der im Querschnitt
    nicht mehr passt, denn von außen sieht man einen Berg und nicht die Ader, auf die der Spieler
    einschlägt. Derselbe Felsblock trägt die Erzkammer — beide Bilder zeigen denselben Berg, das
    eine vor dem Schlag, das andere hinter ihm.
    """
    cv = Canvas()
    rock_block(cv, top=3)
    for step in range(12):                                           # Goldader quer durch die Brust
        x, y = 2 + step * 2, 22 - step
        cv.rect(x, y, x + 2, y + 1, GOLD)
        cv.rect(x, y, x + 1, y, GOLD_LIT)
        if step % 3 == 0:
            cv.set(x + 1, y, GOLD_HI)
    for x, y in ((6, 8), (25, 19), (14, 26), (21, 11)):              # Schlagspuren der Haue
        cv.rect(x, y, x + 2, y, LINE)
        cv.set(x + 1, y + 1, LINE)
    cv.rect(3, 27, 10, 28, STONE)                                    # frisch hereingewonnenes Haufwerk
    cv.rect(4, 27, 9, 27, STONE_LIT)
    cv.set(6, 27, GOLD_LIT)
    cv.rect(19, 28, 27, 28, STONE)
    cv.set(23, 28, GOLD)
    return cv


for index in range(4):
    boots(index).write(f'boots-{index}')
    lamp(index).write(f'lamp-{index}')
    stock(index).write(f'stock-{index}')
action_guard().write('action-guard')
action_transport().write('action-transport')
goldmine().write('goldmine')
print(f'15 Platzhalter-Sprites nach {OUT} geschrieben.')
