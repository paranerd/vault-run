#!/usr/bin/env python3
"""Erzeugt die Sprites für Stiefel, Grubenlampe und Lager.

PLATZHALTER. Die übrigen Reihen unter `public/sprites` sind gezeichnete 160x160-Bilder mit
mehreren tausend Farben; was dieses Skript ausgibt, ist bewusst einfacher: ein 32x32-Raster in der
Palette der vorhandenen Sprites, fünffach vergrößert. Es hält die neuen Karten lesbar, bis
richtige Grafik da ist — und dokumentiert zugleich, was auf ihnen zu sehen sein soll.

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


class Canvas:
    def __init__(self):
        self.px = [[None] * GRID for _ in range(GRID)]

    def set(self, x, y, colour):
        if 0 <= x < GRID and 0 <= y < GRID and colour is not None:
            self.px[y][x] = colour

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


def stock(stage):
    """Loser Erzhaufen → gezimmerter Schuppen: erst der Haufen, dann Wände, Körbe, Dach."""
    cv = Canvas()
    cv.rect(2, 26, 29, 28, GROUND)
    heap = [6, 8, 9, 10][stage]
    for row in range(heap):                                          # Haufen aus Stein und Gold
        y = 25 - row
        half = max(1, heap - row + 2)
        cv.rect(16 - half, y, 15 + half, y, STONE if row % 2 else STONE_LIT)
        for x in range(16 - half, 16 + half, 4):
            cv.set(x + row % 3, y, GOLD if row % 2 else GOLD_LIT)
    cv.set(16, 25 - heap, GOLD_HI)
    if stage >= 1:                                                   # Bretterverschlag
        cv.outlined(2, 18, 4, 26, WOOD, WOOD_LIT)
        cv.outlined(27, 18, 29, 26, WOOD, WOOD_LIT)
    if stage >= 2:                                                   # Erzkörbe davor
        for x in (5, 21):
            cv.outlined(x, 21, x + 5, 26, WOOD, WOOD_LIT)
            cv.rect(x, 23, x + 5, 23, WOOD_LIT)
            cv.rect(x + 1, 20, x + 4, 20, GOLD_LIT)
    if stage >= 3:                                                   # Dach auf zwei Pfosten
        cv.rect(3, 10, 4, 18, WOOD)
        cv.rect(27, 10, 28, 18, WOOD)
        for row in range(3):
            cv.rect(2 + row * 2, 8 + row, 29 - row * 2, 8 + row, WOOD_LIT if row else WOOD)
        cv.rect(1, 11, 30, 11, LINE)
        cv.rect(2, 12, 29, 12, WOOD)
    return cv


for index in range(4):
    boots(index).write(f'boots-{index}')
    lamp(index).write(f'lamp-{index}')
    stock(index).write(f'stock-{index}')
print(f'12 Platzhalter-Sprites nach {OUT} geschrieben.')
