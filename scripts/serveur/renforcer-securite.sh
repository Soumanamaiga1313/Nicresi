#!/usr/bin/env bash
# Renforce la sécurité et la vitesse du site officiel NICRESI sur le serveur, sans toucher au NCC.
#
#   sudo bash renforcer-securite.sh --domaine nicresi.com              (plan seulement : ne modifie rien)
#   sudo bash renforcer-securite.sh --domaine nicresi.com --appliquer  (applique, vérifie, sinon remet tout)
#
# Ce que fait --appliquer :
#   1. écrit /etc/apache2/nicresi-site-securite.inc :
#        - HSTS : le navigateur n'utilise plus que HTTPS pour nicresi.com (6 mois, sans sous-domaines) ;
#        - Content-Security-Policy, Permissions-Policy : seuls les fichiers du site peuvent s'exécuter ;
#        - pages HTML toujours revalidées (une mise à jour se voit tout de suite), images 7 jours en cache ;
#        - compression des textes (HTML, CSS, JS, SVG) ;
#      La politique de contenu ne vise que les fichiers du site (bloc <Directory>) : les pages du NCC
#      relayées sous /start, /owner et /api/v2 ne sont pas concernées.
#   2. ajoute « Include /etc/apache2/nicresi-site-securite.inc » dans les sites Apache du domaine
#      (HTTP et HTTPS créé par certbot), après une sauvegarde dans /var/backups/nicresi-site ;
#   3. vérifie que HTTP redirige vers HTTPS, teste la configuration, recharge Apache et contrôle les en-têtes.
# En cas d'erreur, les fichiers d'origine sont remis et Apache n'est pas rechargé (ou est rechargé avec l'ancienne configuration).
# Pour revenir en arrière plus tard : sudo bash renforcer-securite.sh --domaine nicresi.com --retirer
set -Eeuo pipefail
export LC_ALL=C

DOMAINE=""
APPLIQUER=0
RETIRER=0
RACINE="/var/www/nicresi-site"
INC="/etc/apache2/nicresi-site-securite.inc"
SAUVEGARDES="/var/backups/nicresi-site"
LIGNE="    Include $INC"

arret() { printf '\nARRÊT : %s\n' "$1" >&2; exit 1; }
etape() { printf '\n== %s ==\n' "$1"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --domaine) DOMAINE="${2:-}"; shift 2 ;;
    --appliquer) APPLIQUER=1; shift ;;
    --retirer) RETIRER=1; shift ;;
    *) arret "option inconnue : $1" ;;
  esac
done

etape "Contrôles préalables"
[ "$(id -u)" -eq 0 ] || arret "lancer avec sudo."
[[ "$DOMAINE" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || arret "--domaine obligatoire (ex. nicresi.com)."
for outil in apache2ctl a2enmod curl; do command -v "$outil" >/dev/null || arret "outil manquant : $outil"; done
apache2ctl configtest >/dev/null 2>&1 || arret "la configuration Apache actuelle est déjà en erreur ; la corriger d'abord."

# Uniquement les sites Apache du site officiel qui déclarent ce domaine (jamais ceux du NCC).
mapfile -t SITES < <(grep -lsE "^\s*ServerName\s+$DOMAINE\s*$" /etc/apache2/sites-available/nicresi-site*.conf || true)
[ "${#SITES[@]}" -gt 0 ] || arret "aucun site Apache nicresi-site*.conf avec « ServerName $DOMAINE »."
echo "Sites Apache concernés :"; printf '  %s\n' "${SITES[@]}"

HTTP_SITE=""; HTTPS_SITE=""
for s in "${SITES[@]}"; do
  if grep -qE '^\s*<VirtualHost\s+\S*:443>' "$s"; then HTTPS_SITE="$s"; else HTTP_SITE="$s"; fi
done
[ -n "$HTTPS_SITE" ] || arret "pas de site HTTPS pour $DOMAINE (lancer d'abord certbot --apache)."

etape "État actuel"
if [ -n "$HTTP_SITE" ] && grep -qE "RewriteRule .*https://|Redirect(Match)? +(permanent|301)? *.*https://" "$HTTP_SITE"; then
  echo "HTTP → HTTPS : redirection présente dans $HTTP_SITE."
  REDIRIGE=1
else
  echo "HTTP → HTTPS : AUCUNE redirection trouvée ; elle sera ajoutée."
  REDIRIGE=0
fi
for s in "${SITES[@]}"; do
  if grep -qF "Include $INC" "$s"; then echo "Renforcement déjà inclus dans $s"; else echo "Renforcement absent de $s"; fi
done
modules="$(apache2ctl -M 2>/dev/null)"
for m in headers deflate; do
  echo "$modules" | grep -q "${m}_module" && echo "Module $m : actif" || echo "Module $m : inactif (sera activé)"
done

if [ $RETIRER -eq 1 ]; then
  etape "Retrait"
  [ $APPLIQUER -eq 1 ] || { echo "Plan : retirer la ligne Include des sites ci-dessus, puis recharger Apache. Ajouter --appliquer."; exit 0; }
  install -d -m 0700 "$SAUVEGARDES"
  for s in "${SITES[@]}"; do cp -p "$s" "$SAUVEGARDES/$(basename "$s").$(date +%Y%m%d-%H%M%S)"; sed -i "\#Include $INC#d" "$s"; done
  apache2ctl configtest && systemctl reload apache2
  echo "Renforcement retiré (le fichier $INC est conservé, inutilisé)."
  exit 0
fi

if [ $APPLIQUER -eq 0 ]; then
  etape "Plan (rien n'a été modifié)"
  echo "1. Écrire $INC (HSTS, politique de contenu, cache, compression)."
  echo "2. Ajouter « Include $INC » dans : ${SITES[*]}"
  [ $REDIRIGE -eq 0 ] && echo "3. Ajouter la redirection HTTP → HTTPS dans $HTTP_SITE."
  echo "Relancer avec --appliquer pour le faire."
  exit 0
fi

etape "Application"
install -d -m 0700 "$SAUVEGARDES"
HORO="$(date +%Y%m%d-%H%M%S)"
declare -A COPIES
for s in "${SITES[@]}"; do COPIES["$s"]="$SAUVEGARDES/$(basename "$s").$HORO"; cp -p "$s" "${COPIES[$s]}"; done
[ -f "$INC" ] && cp -p "$INC" "$SAUVEGARDES/$(basename "$INC").$HORO"
echo "Sauvegardes : $SAUVEGARDES/*.$HORO"

remettre() {
  for s in "${!COPIES[@]}"; do cp -p "${COPIES[$s]}" "$s"; done
  if [ -f "$SAUVEGARDES/$(basename "$INC").$HORO" ]; then cp -p "$SAUVEGARDES/$(basename "$INC").$HORO" "$INC"; else rm -f "$INC"; fi
}
echec() { remettre; apache2ctl configtest >/dev/null 2>&1 && systemctl reload apache2 || true; arret "$1 — fichiers d'origine remis."; }
trap 'echec "erreur inattendue à la ligne $LINENO"' ERR

for m in headers deflate; do echo "$modules" | grep -q "${m}_module" || a2enmod -q "$m"; done

cat > "$INC" <<INC
# Renforcement du site officiel NICRESI ($DOMAINE). Créé par scripts/serveur/renforcer-securite.sh.
# Ne vise pas le NCC : la politique de contenu ne s'applique qu'aux fichiers du site (bloc Directory).
<IfModule mod_headers.c>
    # HTTPS obligatoire pendant 6 mois pour ce domaine (envoyé seulement en HTTPS).
    Header always set Strict-Transport-Security "max-age=15552000" "expr=%{HTTPS} == 'on'"
</IfModule>
AddType application/manifest+json .webmanifest
AddType image/webp .webp
<Directory $RACINE/current/public>
    <IfModule mod_headers.c>
        Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests"
        Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
        Header always set Cross-Origin-Opener-Policy "same-origin-allow-popups"
        <FilesMatch "\.html$">
            Header set Cache-Control "no-cache"
        </FilesMatch>
        <FilesMatch "\.(webp|ico|webmanifest|png|jpg|svg)$">
            Header set Cache-Control "public, max-age=604800"
        </FilesMatch>
        <Files "sw.js">
            Header set Cache-Control "no-cache"
        </Files>
    </IfModule>
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/xml application/javascript text/javascript image/svg+xml application/manifest+json
    </IfModule>
</Directory>
INC
chmod 0644 "$INC"

for s in "${SITES[@]}"; do
  grep -qF "Include $INC" "$s" && continue
  # Juste après DocumentRoot, dans chaque VirtualHost du fichier.
  sed -i -E "/^\s*DocumentRoot\s/a\\
$LIGNE" "$s"
done
if [ $REDIRIGE -eq 0 ] && [ -n "$HTTP_SITE" ]; then
  sed -i -E "/^\s*ServerName\s+$DOMAINE\s*$/a\\
    Redirect permanent / https://$DOMAINE/" "$HTTP_SITE"
fi

apache2ctl configtest >/dev/null 2>&1 || echec "Apache refuse la nouvelle configuration"
systemctl reload apache2
sleep 1

etape "Vérification"
entetes="$(curl -sI --resolve "$DOMAINE:443:127.0.0.1" "https://$DOMAINE/")" || echec "le site ne répond plus en HTTPS"
echo "$entetes" | grep -qi '^HTTP/[0-9.]* 200' || echec "la page d'accueil ne répond pas 200"
for e in strict-transport-security content-security-policy; do
  echo "$entetes" | grep -qi "^$e:" || echec "en-tête $e absent"
done
code_http="$(curl -s -o /dev/null -w '%{http_code}' --resolve "$DOMAINE:80:127.0.0.1" "http://$DOMAINE/")"
case "$code_http" in 301|302|308) echo "HTTP → HTTPS : redirection $code_http." ;; *) echec "HTTP ne redirige pas vers HTTPS (code $code_http)" ;; esac
code_404="$(curl -s -o /dev/null -w '%{http_code}' --resolve "$DOMAINE:443:127.0.0.1" "https://$DOMAINE/page-qui-n-existe-pas")"
[ "$code_404" = "404" ] && echo "Page 404 personnalisée : servie avec le code 404."
code_ncc="$(curl -s -o /dev/null -w '%{http_code}' --resolve "$DOMAINE:443:127.0.0.1" "https://$DOMAINE/owner")"
echo "NCC /owner : code $code_ncc (doit rester comme avant : 200 ou 302)."
trap - ERR

etape "Terminé"
echo "$entetes" | grep -iE '^(strict-transport-security|content-security-policy|permissions-policy|cache-control|content-encoding):' || true
echo "Pour revenir en arrière : sudo bash $0 --domaine $DOMAINE --retirer --appliquer"
