# Génère les quatre mini-scènes isométriques des services (flat design + line art).
# Usage : python3 scripts/illustrations/mini-scenes-iso.py > minis.json, puis remplacer les <svg class="mini__svg"> de public/index.html.
C=0.866
def P(x,y,z,o):
    cx,cy=o; return (round(cx+(x-y)*C,1), round(cy+(x+y)*0.5-z,1))
def poly(pts,fill,cls='',extra=''):
    s=' '.join(f'{a},{b}' for a,b in pts)
    c=f' class="{cls}"' if cls else ''
    return f'<polygon{c} points="{s}" fill="{fill}"{extra}/>'
def boite(x,y,z,w,d,h,o,top,gauche,droite):
    p=lambda a,b,c:P(a,b,c,o)
    t=[p(x,y,z+h),p(x+w,y,z+h),p(x+w,y+d,z+h),p(x,y+d,z+h)]
    g=[p(x,y+d,z),p(x+w,y+d,z),p(x+w,y+d,z+h),p(x,y+d,z+h)]
    r=[p(x+w,y,z),p(x+w,y+d,z),p(x+w,y+d,z+h),p(x+w,y,z+h)]
    return poly(g,gauche)+poly(r,droite)+poly(t,top)
def plan_x(x0,y,z,o):
    # repère 2D (u vers +x, v vers le bas) posé sur la face verticale y = cste
    a,b=P(x0,y,z,o); return f'matrix({C},0.5,0,1,{a},{b})'
def plan_y(x,y0,z,o):
    # face verticale x = cste (u vers +y)
    a,b=P(x,y0,z,o); return f'matrix({-C},0.5,0,1,{a},{b})'
def sol(o,W=64,D=64):
    return boite(0,0,-5,W,D,5,o,'#ffd88a','#e9a94f','#d98f33')
FOND='<rect width="160" height="96" rx="12" fill="#fff1e2"/><circle cx="138" cy="16" r="26" fill="#ffe0b8"/>'
import re
def svg(corps):
    # La transformation géométrique va sur un groupe parent : l'animation CSS (transform) ne doit pas l'écraser.
    corps=re.sub(r'<(rect|path) class="([^"]+)" ([^>]*?)transform="([^"]+)"([^>]*)/>', r'<g transform="\4"><\1 class="\2" \3\5/></g>', corps)
    return ('<svg class="mini__svg" viewBox="0 0 160 96" width="160" height="96" focusable="false">'
            + FOND + '<g stroke="#111" stroke-width="1.3" stroke-linejoin="round">' + corps + '</g></svg>')
O=(80,30)

def wifi():
    s=sol(O)
    s+=boite(6,22,0,26,22,18,O,'#f26a1b','#fff','#ececec')
    s+=f'<rect x="0" y="0" width="7" height="11" transform="{plan_x(14,44,11,O)}" fill="#111"/>'
    m=P(19,33,18,O); t=P(19,33,36,O)
    s+=f'<g class="a1"><path d="M{m[0]} {m[1]} V{t[1]}" stroke-width="2.5"/><circle cx="{t[0]}" cy="{t[1]}" r="3.5" fill="#f26a1b"/></g>'
    x,y=t
    s+=f'<path class="a2 trait" d="M{x-8} {y-6} a10 10 0 0 1 16 0" fill="none" stroke="#f26a1b" stroke-width="2.6" stroke-linecap="round"/>'
    s+=f'<path class="a3 trait" d="M{x-14} {y-12} a18 18 0 0 1 28 0" fill="none" stroke="#f26a1b" stroke-width="2.6" stroke-linecap="round"/>'
    tel=boite(42,40,0,10,3,22,O,'#333','#111','#111')
    tr=plan_x(43,43,21,O)
    tel+=f'<rect x="0" y="0" width="8" height="15" transform="{tr}" fill="#fff"/>'
    tel+=f'<path d="M2 8 l2 2.5 l3.5 -5" transform="{tr}" fill="none" stroke="#1e7a3c" stroke-width="1.8" stroke-linecap="round"/>'
    s+=f'<g class="a4">{tel}</g>'
    s+='<g class="a5"><rect x="114" y="14" width="34" height="17" rx="8" fill="#ffd34d"/><text x="131" y="26" text-anchor="middle" class="mini__texte" stroke="none">200 F</text></g>'
    return svg(s)

def numerique():
    s=sol(O)
    s+=boite(8,14,0,40,28,3,O,'#555','#333','#222')
    ecran=plan_x(8,14,33,O)
    s+=f'<rect x="0" y="0" width="40" height="30" transform="{ecran}" fill="#111"/>'
    s+=f'<rect class="a1" x="4" y="4" width="32" height="6" transform="{ecran}" fill="#f26a1b" stroke="none"/>'
    s+=f'<rect class="a2" x="4" y="13" width="16" height="13" transform="{ecran}" fill="#ffd34d" stroke="none"/>'
    s+=f'<g class="a3" stroke="none"><rect x="23" y="13" width="13" height="3" transform="{ecran}" fill="#fff"/><rect x="23" y="19" width="13" height="3" transform="{ecran}" fill="#9a9a9a"/></g>'
    s+=f'<rect class="a4" x="23" y="23" width="9" height="4" rx="2" transform="{ecran}" fill="#f26a1b" stroke="none"/>'
    tel=boite(52,40,0,10,3,22,O,'#333','#111','#111')
    tr=plan_x(53,43,21,O)
    tel+=f'<rect x="0" y="0" width="8" height="4" transform="{tr}" fill="#f26a1b"/><rect x="0" y="6" width="8" height="9" transform="{tr}" fill="#fff"/>'
    s+=f'<g class="a5">{tel}</g>'
    return svg(s)

def solaire():
    s=sol(O)
    s+='<circle class="a1" cx="28" cy="18" r="9" fill="#ffd34d"/>'
    s+=boite(4,10,0,28,26,16,O,'#f3c38a','#fff','#ececec')
    s+=f'<rect x="0" y="0" width="7" height="10" transform="{plan_x(12,36,10,O)}" fill="#7a4b26"/>'
    toit=f'matrix({C},0.5,{-C},0.5,{P(4,10,16,O)[0]},{P(4,10,16,O)[1]})'
    s+=f'<g transform="{toit}"><g class="a2"><rect x="3" y="3" width="22" height="20" fill="#1f3550"/><path d="M14 3 V23 M3 13 H25" stroke="#7fb2e5" stroke-width="1"/></g></g>'
    a=P(32,24,12,O); b=P(44,24,12,O); c=P(44,30,8,O)
    s+=f'<path class="a3 trait" d="M{a[0]} {a[1]} L{b[0]} {b[1]} L{c[0]} {c[1]}" fill="none" stroke="#f26a1b" stroke-width="2.2" stroke-dasharray="3 3"/>'
    s+=boite(40,30,0,12,12,16,O,'#ddd','#fff','#ececec')
    bat=plan_x(40,42,14,O)
    s+=f'<rect class="a4 remplit" x="2" y="1" width="8" height="12" transform="{bat}" fill="#1e7a3c" stroke="none"/>'
    fen=plan_x(22,36,12,O)
    s+=f'<rect x="0" y="0" width="6" height="6" transform="{fen}" fill="#fff"/>'
    s+=f'<g class="a5"><rect x="0" y="0" width="6" height="6" transform="{fen}" fill="#ffd34d"/><path d="M3 -3 v-3 M8 -1 l3 -2 M-2 -1 l-3 -2" transform="{fen}" stroke="#f26a1b" stroke-width="1.6" stroke-linecap="round"/></g>'
    return svg(s)

def formation():
    s=sol(O)
    tb=plan_x(4,8,31,O)
    s+=f'<rect x="0" y="0" width="52" height="26" transform="{tb}" fill="#2d3b2d"/>'
    for i,(w,cl) in enumerate([(34,'a1'),(26,'a2'),(40,'a3')]):
        s+=f'<path class="{cl} trait" d="M5 {7+i*8} H{5+w}" transform="{tb}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>'
    el=''
    for (x,y,col) in [(16,40,'#f26a1b'),(32,46,'#2f6f8f'),(48,52,'#333')]:
        el+=boite(x,y,0,8,8,9,O,col,col,col)
        h=P(x+4,y+4,14,O); el+=f'<circle cx="{h[0]}" cy="{h[1]}" r="4" fill="#5b3a22"/>'
    s+=f'<g class="a4">{el}</g>'
    c=P(50,8,30,O)
    s+=f'<g class="a5"><circle cx="{c[0]+10}" cy="{c[1]-4}" r="8" fill="#1e7a3c"/><path d="M{c[0]+6} {c[1]-4} l3 3 l5 -6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>'
    return svg(s)

import json,sys
print(json.dumps({'sol-reseau':wifi(),'sol-numerique':numerique(),'sol-equipements':solaire(),'sol-formation':formation()}))
