#!/usr/bin/env python3
"""Génère public/img/appareils/clavier.svg : base d'ordinateur portable vue en perspective
(plateau alu, clavier, pavé tactile, tranche avant). Largeur 1160 = écran (1000) + 8 % de chaque côté."""
import pathlib

W, H = 1160, 200
HAUT_G, HAUT_D = 80, 1080      # bord charnière (même largeur que l'écran)
BAS_G, BAS_D = 0, 1160         # bord avant, plus proche donc plus large
Y_HAUT, Y_BAS = 6, 168         # plateau ; tranche avant de 168 à 186

def pt(u, v):
    """u, v dans [0, 1] sur le plateau -> coordonnées (perspective simple, v déformé)."""
    v2 = v ** 1.18  # les rangées lointaines sont plus serrées
    g = HAUT_G + (BAS_G - HAUT_G) * v2
    d = HAUT_D + (BAS_D - HAUT_D) * v2
    return g + (d - g) * u, Y_HAUT + (Y_BAS - Y_HAUT) * v2

def quad(u0, v0, u1, v1):
    pts = [pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)]
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)

touches = []
# zone clavier : u 0.085 -> 0.915, v 0.06 -> 0.60 ; 6 rangées
rangees = [
    [1] * 14,                                   # fonctions (fines)
    [1] * 13 + [1.5],
    [1.5] + [1] * 12 + [1],
    [1.75] + [1] * 11 + [1.75],
    [2.25] + [1] * 10 + [2.25],
    [1, 1, 1, 1.25, 5.25, 1.25, 1, 1, 1, 1],    # espace + flèches
]
u_g, u_d, v_h, v_b = 0.085, 0.915, 0.05, 0.60
hauteurs = [0.55, 1, 1, 1, 1, 1]
tot_h = sum(hauteurs)
v = v_h
jeu_u, jeu_v = 0.0032, 0.012
for r, h in zip(rangees, hauteurs):
    dv = (v_b - v_h) * h / tot_h
    total = sum(r)
    u = u_g
    for w in r:
        du = (u_d - u_g) * w / total
        touches.append(quad(u + jeu_u, v + jeu_v, u + du - jeu_u, v + dv - jeu_v))
        u += du
    v += dv

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">',
       '<defs>',
       '<linearGradient id="plateau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bbc0"/><stop offset=".25" stop-color="#d9dbdf"/><stop offset="1" stop-color="#e9eaed"/></linearGradient>',
       '<linearGradient id="reflet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>',
       '<linearGradient id="tranche" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f6"/><stop offset=".35" stop-color="#c3c5ca"/><stop offset="1" stop-color="#8d9096"/></linearGradient>',
       '<linearGradient id="touche" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3b3f"/><stop offset="1" stop-color="#1d1e21"/></linearGradient>',
       '<linearGradient id="pave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd1d5"/><stop offset="1" stop-color="#dcdee2"/></linearGradient>',
       '</defs>',
       # tranche avant (épaisseur) avec encoche d'ouverture
       f'<path d="M{BAS_G},{Y_BAS} L{BAS_D},{Y_BAS} L{BAS_D-6},{Y_BAS+16} Q{BAS_D-12},{Y_BAS+22} {BAS_D-30},{Y_BAS+22} L{BAS_G+30},{Y_BAS+22} Q{BAS_G+12},{Y_BAS+22} {BAS_G+6},{Y_BAS+16} Z" fill="url(#tranche)"/>',
       f'<path d="M500,{Y_BAS} L660,{Y_BAS} Q655,{Y_BAS+9} 640,{Y_BAS+9} L520,{Y_BAS+9} Q505,{Y_BAS+9} 500,{Y_BAS} Z" fill="#7d8086" opacity=".55"/>',
       # plateau
       f'<polygon points="{HAUT_G},{Y_HAUT} {HAUT_D},{Y_HAUT} {BAS_D},{Y_BAS} {BAS_G},{Y_BAS}" fill="url(#plateau)"/>',
       f'<polygon points="{HAUT_G},{Y_HAUT} {HAUT_D},{Y_HAUT} {BAS_D},{Y_BAS} {BAS_G},{Y_BAS}" fill="url(#reflet)"/>',
       f'<line x1="{BAS_G+2}" y1="{Y_BAS-.5}" x2="{BAS_D-2}" y2="{Y_BAS-.5}" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/>',
       # charnière
       f'<rect x="{HAUT_G+70}" y="0" width="{HAUT_D-HAUT_G-140}" height="{Y_HAUT+2}" rx="3" fill="#2a2b2e"/>',
       # cuvette du clavier (légèrement plus sombre)
       f'<polygon points="{quad(0.075, 0.035, 0.925, 0.615)}" fill="#a9acb2" opacity=".45"/>',
       '<g fill="url(#touche)">' + "".join(f'<polygon points="{q}"/>' for q in touches) + '</g>',
       # haut-parleurs (deux grilles fines)
       f'<polygon points="{quad(0.02, 0.06, 0.07, 0.6)}" fill="#9a9da3" opacity=".35"/>',
       f'<polygon points="{quad(0.93, 0.06, 0.98, 0.6)}" fill="#9a9da3" opacity=".35"/>',
       # pavé tactile
       f'<polygon points="{quad(0.33, 0.67, 0.67, 0.97)}" fill="url(#pave)" stroke="#b3b6bb" stroke-width="1.2"/>',
       '</svg>']
sortie = pathlib.Path(__file__).resolve().parents[2] / "public/img/appareils/clavier.svg"
sortie.write_text("\n".join(svg) + "\n")
print(sortie, sortie.stat().st_size)
