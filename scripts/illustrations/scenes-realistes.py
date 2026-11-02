# Scènes animées « réalistes » des services et de la Formation : dégradés, ombres douces, objets à leurs vraies proportions.
# Mêmes classes d'animation que les anciennes mini-scènes : a1 à a5, trait (tracé) et remplit (remplissage).
# Usage : python3 scripts/illustrations/scenes-realistes.py > scenes.json, puis remplacer les <svg> de public/index.html.
import json

def ciel(p, haut='#bfe0ff', bas='#fff4e4'):
    return f'<linearGradient id="{p}-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{haut}"/><stop offset="1" stop-color="{bas}"/></linearGradient>'

def grad(id_, a, b, vertical=True):
    xy = 'x1="0" y1="0" x2="0" y2="1"' if vertical else 'x1="0" y1="0" x2="1" y2="0"'
    return f'<linearGradient id="{id_}" {xy}><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'

def telephone(x, y, w, h, p, ecran):
    # Téléphone vu de face : cadre graphite, écran, île.
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w*.2:.1f}" fill="url(#{p}-cadre)"/>'
            f'<rect x="{x+1.6}" y="{y+1.6}" width="{w-3.2}" height="{h-3.2}" rx="{w*.15:.1f}" fill="#fff"/>'
            f'<rect x="{x+w*.36:.1f}" y="{y+3}" width="{w*.28:.1f}" height="2.6" rx="1.3" fill="#111"/>' + ecran)

def svg(p, defs, corps, vb='0 0 160 96', w=160, h=96, cls='mini__svg'):
    return (f'<svg class="{cls}" viewBox="{vb}" width="{w}" height="{h}" focusable="false"><defs>{defs}</defs>{corps}</svg>')

def wifi():
    p = 'rw'
    d = (ciel(p) + grad(p+'-mur', '#f1dcbc', '#d9b48a') + grad(p+'-sol', '#e3bd8a', '#c99459') + grad(p+'-ap', '#ffffff', '#d9dee5')
         + grad(p+'-cadre', '#3d3d40', '#0e0e10') + grad(p+'-vitre', '#9fd0f5', '#5d93c4'))
    c = (f'<rect width="160" height="96" rx="12" fill="url(#{p}-ciel)"/>'
         f'<path d="M0 74 H160 V84 Q160 96 148 96 H12 Q0 96 0 84Z" fill="url(#{p}-sol)"/>'
         '<ellipse cx="44" cy="75" rx="38" ry="3" fill="#000" opacity=".12"/>'
         f'<rect x="10" y="34" width="66" height="40" fill="url(#{p}-mur)"/><rect x="8" y="31" width="70" height="4" rx="1" fill="#b98d5f"/>'
         '<rect x="20" y="50" width="12" height="24" rx="1" fill="#7a4b26"/><circle cx="30" cy="62" r=".9" fill="#e8c27a"/>'
         f'<rect x="44" y="44" width="22" height="14" rx="1" fill="url(#{p}-vitre)" stroke="#8a6440" stroke-width="1.2"/><path d="M55 44 V58" stroke="#8a6440" stroke-width="1"/>'
         f'<g class="a1"><rect x="55" y="8" width="2.4" height="24" fill="#8f969e"/><rect x="50" y="10" width="12" height="17" rx="2.5" fill="url(#{p}-ap)" stroke="#c4cad1" stroke-width=".6"/>'
         '<circle cx="56" cy="23.5" r="1.1" fill="#22c55e"/><rect x="53.5" y="13" width="5" height=".8" rx=".4" fill="#c4cad1"/></g>'
         '<path class="a2 trait" d="M66 12 a7 7 0 0 1 0 11" fill="none" stroke="#f26a1b" stroke-width="2.4" stroke-linecap="round"/>'
         '<path class="a3 trait" d="M71 8 a13 13 0 0 1 0 19" fill="none" stroke="#f26a1b" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>'
         '<g class="a4"><ellipse cx="108" cy="84" rx="13" ry="2.2" fill="#000" opacity=".15"/>'
         + telephone(96, 26, 25, 54, p,
             '<rect x="98.6" y="34" width="19.8" height="10" rx="2" fill="#e8f7ee"/><path d="M103 40.5 a4 4 0 0 1 6 0 M104.4 42 a2 2 0 0 1 3.2 0" fill="none" stroke="#16a34a" stroke-width="1" stroke-linecap="round"/>'
             '<circle cx="106" cy="43" r=".6" fill="#16a34a"/><text x="108.5" y="51" text-anchor="middle" class="mini__texte" style="font-size:4.2px">Connecté</text>'
             '<rect x="99.5" y="55" width="18" height="2.2" rx="1.1" fill="#e5e7eb"/><rect x="99.5" y="59.5" width="13" height="2.2" rx="1.1" fill="#e5e7eb"/>'
             '<rect x="99.5" y="68" width="18" height="5" rx="2.5" fill="#f26a1b"/>') + '</g>'
         '<g class="a5"><rect x="129" y="15" width="27" height="19" rx="2" fill="#000" opacity=".12" transform="rotate(-6 142 25)"/>'
         '<g transform="rotate(-6 142 24)"><rect x="127" y="13" width="27" height="19" rx="2" fill="#fff" stroke="#f26a1b" stroke-width=".8" stroke-dasharray="2 1.4"/>'
         '<text x="140.5" y="21" text-anchor="middle" class="mini__texte" style="font-size:6px">200 F</text>'
         '<text x="140.5" y="28" text-anchor="middle" class="mini__texte" style="font-size:4.4px;letter-spacing:.4px">5530 182</text></g></g>')
    return svg(p, d, c)

def solaire():
    p = 'rs'
    d = (ciel(p, '#9fd2ff', '#fff1d6') + grad(p+'-mur', '#fbe8cf', '#e2c29b') + grad(p+'-toit', '#a0522d', '#7a3b1e')
         + grad(p+'-pv', '#2a5a96', '#14335f') + grad(p+'-bat', '#f4f5f7', '#b8bec6') + grad(p+'-sol', '#e3bd8a', '#c99459')
         + f'<radialGradient id="{p}-soleil"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#ffcc33"/><stop offset="1" stop-color="#ff9d1f"/></radialGradient>'
         + f'<radialGradient id="{p}-lueur"><stop offset="0" stop-color="#ffe680" stop-opacity=".9"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>')
    cellules = ''.join(f'<path d="M{29+i*7.4} 22 L{25+i*7.4} 36" stroke="#6f9bd1" stroke-width=".5"/>' for i in range(1, 5)) + '<path d="M27 29 H64" stroke="#6f9bd1" stroke-width=".5"/>'
    c = (f'<rect width="160" height="96" rx="12" fill="url(#{p}-ciel)"/>'
         f'<g class="a1"><circle cx="134" cy="20" r="17" fill="url(#{p}-lueur)"/><circle cx="134" cy="20" r="8.5" fill="url(#{p}-soleil)"/></g>'
         f'<path d="M0 76 H160 V84 Q160 96 148 96 H12 Q0 96 0 84Z" fill="url(#{p}-sol)"/>'
         '<ellipse cx="46" cy="77" rx="40" ry="3" fill="#000" opacity=".12"/>'
         f'<rect x="14" y="40" width="64" height="36" fill="url(#{p}-mur)"/>'
         f'<polygon points="8,41 22,18 70,18 84,41" fill="url(#{p}-toit)"/>'
         f'<g class="a2"><polygon points="28,21 66,21 63,37 24,37" fill="url(#{p}-pv)" stroke="#d7dde4" stroke-width="1.2" stroke-linejoin="round"/>{cellules}'
         '<polygon points="30,22 40,22 36,30 27,30" fill="#fff" opacity=".12"/></g>'
         '<rect x="24" y="54" width="11" height="22" rx="1" fill="#7a4b26"/>'
         '<rect x="48" y="50" width="16" height="12" rx="1" fill="#f6efe6" stroke="#8a6440" stroke-width="1.1"/>'
         '<path class="a3 trait" d="M78 30 C 96 30, 96 44, 104 52" fill="none" stroke="#1f2937" stroke-width="1.8" stroke-linecap="round"/>'
         '<ellipse cx="117" cy="80" rx="17" ry="2.4" fill="#000" opacity=".15"/>'
         f'<rect x="102" y="50" width="30" height="29" rx="3" fill="url(#{p}-bat)" stroke="#9aa1aa" stroke-width=".8"/>'
         '<rect x="107" y="46.5" width="5" height="4" rx="1" fill="#d12f2f"/><rect x="122" y="46.5" width="5" height="4" rx="1" fill="#2f2f33"/>'
         '<rect x="106" y="56" width="22" height="16" rx="1.5" fill="#1f2937"/>'
         '<rect class="a4 remplit" x="107.5" y="57.5" width="19" height="13" rx="1" fill="#22c55e"/>'
         '<text x="117" y="76.6" text-anchor="middle" class="mini__texte" style="font-size:3.8px;fill:#374151">12 V</text>'
         f'<g class="a5"><circle cx="56" cy="56" r="13" fill="url(#{p}-lueur)"/><rect x="48" y="50" width="16" height="12" rx="1" fill="#ffe27a" stroke="#8a6440" stroke-width="1.1"/>'
         '<path d="M56 50 V62 M48 56 H64" stroke="#8a6440" stroke-width=".8"/></g>')
    return svg(p, d, c)

def personne(x, y, peau, habit, echelle=1.0):
    # Personne vue de dos ou de trois quarts : tête, cheveux, épaules arrondies.
    e = echelle
    return (f'<path d="M{x-9*e} {y+18*e} Q{x-9*e} {y+6*e} {x} {y+6*e} Q{x+9*e} {y+6*e} {x+9*e} {y+18*e}Z" fill="{habit}"/>'
            f'<circle cx="{x}" cy="{y}" r="{5*e}" fill="{peau}"/><path d="M{x-5*e} {y-1*e} A{5*e} {5*e} 0 0 1 {x+5*e} {y-1*e} Q{x} {y-4*e} {x-5*e} {y-1*e}Z" fill="#1b1310"/>')

def formation():
    p = 'rf'
    d = (grad(p+'-mur', '#fbf3e8', '#efdcc3') + grad(p+'-sol', '#c99a66', '#a8794a') + grad(p+'-table', '#b07a46', '#8a5a30')
         + grad(p+'-alu', '#eceef1', '#a9afb7'))
    c = (f'<rect width="160" height="96" rx="12" fill="url(#{p}-mur)"/><path d="M0 70 H160 V84 Q160 96 148 96 H12 Q0 96 0 84Z" fill="url(#{p}-sol)"/>'
         '<rect x="28" y="8" width="90" height="46" rx="2" fill="#9ca3af"/><rect x="30" y="10" width="86" height="42" fill="#fff"/>'
         '<rect x="52" y="54" width="42" height="2.5" rx="1" fill="#9ca3af"/>'
         '<path class="a1 trait" d="M38 20 H92" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round"/>'
         '<path class="a2 trait" d="M38 29 H80" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round"/>'
         '<path class="a3 trait" d="M38 38 H100" stroke="#f26a1b" stroke-width="2.2" stroke-linecap="round"/>'
         f'<rect x="10" y="74" width="140" height="5" rx="1.5" fill="url(#{p}-table)"/>'
         '<g class="a4">'
         + personne(38, 64, '#6b4226', '#f26a1b') + personne(80, 63, '#4a2f1b', '#2f6f8f') + personne(122, 64, '#5b3a22', '#3f3f46')
         + f'<path d="M44 74 l6 -9 h14 l-4 9z" fill="url(#{p}-alu)"/><path d="M86 74 l6 -9 h14 l-4 9z" fill="url(#{p}-alu)"/>'
         '</g>'
         '<g class="a5"><rect x="122" y="10" width="30" height="21" rx="1.5" fill="#000" opacity=".1" transform="translate(1.5 1.5)"/><rect x="122" y="10" width="30" height="21" rx="1.5" fill="#fffdf7" stroke="#e5d6b8" stroke-width=".6"/>'
         '<text x="137" y="17" text-anchor="middle" class="mini__texte" style="font-size:4.2px">Attestation</text>'
         '<rect x="126" y="20" width="16" height="1.3" rx=".6" fill="#d1d5db"/><rect x="126" y="23.5" width="12" height="1.3" rx=".6" fill="#d1d5db"/>'
         '<circle cx="146" cy="25" r="3.6" fill="#f5b301"/><circle cx="146" cy="25" r="2.2" fill="none" stroke="#fff" stroke-width=".6"/></g>')
    return svg(p, d, c)

def classe():
    p = 'rc'
    d = (grad(p+'-mur', '#fbf3e8', '#ecd5b6') + grad(p+'-sol', '#c99a66', '#9f7043') + grad(p+'-table', '#b07a46', '#83552d')
         + grad(p+'-alu', '#eceef1', '#9ea5ae') + grad(p+'-ecran', '#1f2937', '#111827'))
    tables = ''
    eleves = ''
    ordis = ''
    for i, (x, peau, habit) in enumerate([(44, '#6b4226', '#f26a1b'), (86, '#4a2f1b', '#2f6f8f'), (128, '#5b3a22', '#1e7a3c'), (170, '#7a4b2a', '#3f3f46')]):
        eleves += personne(x, 84, peau, habit, 1.25)
        ordis += f'<path d="M{x+6} 100 l7 -12 h19 l-5 12z" fill="url(#{p}-alu)"/><circle cx="{x+20}" cy="94" r="1.2" fill="#d1d5db"/>'
    c = (f'<rect width="200" height="120" rx="14" fill="url(#{p}-mur)"/>'
         '<rect x="150" y="12" width="36" height="44" rx="2" fill="#bfe0ff" stroke="#b98d5f" stroke-width="2"/><path d="M168 12 V56 M150 34 H186" stroke="#b98d5f" stroke-width="1.5"/>'
         f'<path d="M0 92 H200 V106 Q200 120 186 120 H14 Q0 120 0 106Z" fill="url(#{p}-sol)"/>'
         '<rect x="22" y="10" width="100" height="56" rx="2" fill="#9ca3af"/><rect x="24" y="12" width="96" height="52" fill="#fff"/>'
         '<rect x="30" y="18" width="38" height="24" rx="1.5" fill="#fff1e8" stroke="#f26a1b" stroke-width=".8"/>'
         '<path class="a1 trait" d="M74 22 H112 M74 30 H104 M74 38 H110" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>'
         '<path class="a1 trait" d="M34 36 l7 -8 6 5 8 -10 6 7" fill="none" stroke="#f26a1b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
         '<g class="a4">' + personne(134, 52, '#4a2f1b', '#f26a1b', 1.5)
         + '<path d="M125 79 h18 v16 h-4 v-10 h-10 v10 h-4z" fill="#2b2b2e"/><path d="M142 66 l-14 -12" stroke="#4a2f1b" stroke-width="2.4" stroke-linecap="round"/></g>'
         f'<g class="a3">{eleves}</g>'
         f'<rect x="8" y="98" width="184" height="6" rx="2" fill="url(#{p}-table)"/>'
         f'<g class="a2">{ordis}</g>'
         '<g class="a5"><rect x="153" y="62" width="42" height="14" rx="7" fill="#ffd34d" stroke="#e0a800" stroke-width=".6"/>'
         '<text x="174" y="71.6" text-anchor="middle" class="mini__texte" style="font-size:6.4px">Attestation</text></g>')
    return ('<svg class="illus__svg" viewBox="0 0 200 120" width="400" height="240" focusable="false"><defs>' + d + '</defs>' + c + '</svg>')

print(json.dumps({'sol-reseau': wifi(), 'sol-equipements': solaire(), 'sol-formation': formation(), 'classe': classe()}))
