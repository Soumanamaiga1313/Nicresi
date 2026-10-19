#!/usr/bin/env bash
# Sert les pages du NICRESI Control Center sous le domaine du site officiel :
# https://nicresi.com/start, /owner et l'API /api/v2 qu'elles utilisent.
#
#   sudo bash relier-ncc.sh               (plan seulement)
#   sudo bash relier-ncc.sh --appliquer
#
# Ajoute une ligne Include dans les sites Apache du site officiel (HTTP et HTTPS de certbot) vers
# /etc/apache2/nicresi-site-ncc.inc, qui transmet ces chemins au backend interne du NCC (127.0.0.1:8082).
# Ne modifie ni les fichiers du NCC, ni nicresi-ssl.conf : l'accès par adresse IP reste inchangé.
# Les routes /api/v2/internal ne sont pas exposées sous ce domaine.
# En cas d'échec, les fichiers d'origine sont remis.
set -Eeuo pipefail
export LC_ALL=C

BACKEND="http://127.0.0.1:8082"
INC="/etc/apache2/nicresi-site-ncc.inc"
SITES=(/etc/apache2/sites-available/nicresi-site.conf /etc/apache2/sites-available/nicresi-site-le-ssl.conf)
SAUVEGARDES="/var/backups/nicresi-site"
APPLIQUER=0

arret() { printf '\nARRÊT : %s\n' "$1" >&2; exit 1; }
etape() { printf '\n== %s ==\n' "$1"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --appliquer) APPLIQUER=1; shift ;;
    *) arret "option inconnue : $1" ;;
  esac
done

etape "Contrôles préalables"
[ "$(id -u)" -eq 0 ] || arret "lancer avec sudo."
for outil in apache2ctl curl; do command -v "$outil" >/dev/null || arret "outil manquant : $outil"; done
modules="$(apache2ctl -M 2>/dev/null)"
for m in proxy proxy_http headers; do
  echo "$modules" | grep -q "${m}_module" || arret "module Apache manquant : $m (a2enmod $m)"
done
apache2ctl configtest >/dev/null 2>&1 || arret "la configuration Apache actuelle est déjà en erreur ; la corriger d'abord."
code="$(curl -s -o /dev/null -w '%{http_code}' "$BACKEND/start")"
[ "$code" = "200" ] || arret "le backend du NCC ($BACKEND/start) répond $code au lieu de 200."
present=()
for f in "${SITES[@]}"; do [ -f "$f" ] && present+=("$f"); done
[ ${#present[@]} -gt 0 ] || arret "aucun site Apache du site officiel trouvé ; lancer d'abord installer.sh --domaine."
DOMAINE="$(grep -hE '^\s*ServerName\s' "${present[@]}" | awk '{print $2}' | head -1)"
[ -n "$DOMAINE" ] || arret "nom de domaine introuvable dans ${present[*]}."

etape "Plan"
echo "Domaine        : $DOMAINE"
echo "Chemins relayés : /start, /owner, /api/v2 (sauf /api/v2/internal) vers $BACKEND"
echo "Règles         : $INC ($([ -f "$INC" ] && echo 'remplacé' || echo 'créé'))"
for f in "${present[@]}"; do
  echo "Site modifié   : $f ($(grep -q "Include $INC" "$f" && echo 'Include déjà présent' || echo 'ajout de la ligne Include'))"
done
echo "Inchangés      : nicresi-ssl.conf, 000-default.conf, l'application du NCC"
if [ $APPLIQUER -eq 0 ]; then
  echo; echo "Plan seulement : rien n'a été modifié. Relancer avec --appliquer."
  exit 0
fi

etape "Sauvegarde"
install -d -m 0750 "$SAUVEGARDES"
dossier="$SAUVEGARDES/relier-ncc-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$dossier"
for f in "${present[@]}"; do cp -p "$f" "$dossier/"; done
[ -f "$INC" ] && cp -p "$INC" "$dossier/"
echo "Copies dans $dossier"

restaurer() {
  for f in "${present[@]}"; do cp -p "$dossier/$(basename "$f")" "$f"; done
  if [ -f "$dossier/$(basename "$INC")" ]; then cp -p "$dossier/$(basename "$INC")" "$INC"; else rm -f "$INC"; fi
  apache2ctl configtest >/dev/null 2>&1 && systemctl reload apache2
  echo "Fichiers d'origine remis ; Apache est revenu à l'état précédent." >&2
}
trap 'echo "ÉCHEC à la ligne $LINENO." >&2; restaurer' ERR

etape "Configuration"
cat > "$INC" <<INC
# Pages du NICRESI Control Center servies sous le domaine du site officiel.
# Créé par scripts/serveur/relier-ncc.sh (dépôt Nicresi) ; inclus dans nicresi-site*.conf.
ProxyPreserveHost On
ProxyRequests Off
RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}
ProxyPass /api/v2/internal !
ProxyPass /api/v2 $BACKEND/api/v2
ProxyPassReverse /api/v2 $BACKEND/api/v2
ProxyPass /start $BACKEND/start
ProxyPassReverse /start $BACKEND/start
ProxyPass /owner $BACKEND/owner
ProxyPassReverse /owner $BACKEND/owner
INC
chmod 0644 "$INC"
for f in "${present[@]}"; do
  if ! grep -q "Include $INC" "$f"; then
    # Juste après chaque DocumentRoot du site officiel.
    sed -i "s|^\(\s*\)DocumentRoot /var/www/nicresi-site/current/public\s*$|&\n\1Include $INC|" "$f"
    grep -q "Include $INC" "$f" || { echo "DocumentRoot attendu absent de $f." >&2; false; }
  fi
done
apache2ctl configtest >/dev/null 2>&1 || { echo "Apache refuse la nouvelle configuration." >&2; false; }
systemctl reload apache2
sleep 2

etape "Vérification"
local_="--resolve $DOMAINE:80:127.0.0.1 --resolve $DOMAINE:443:127.0.0.1"
for chemin in /start /owner /; do
  code="$(curl -skL $local_ -o /dev/null -w '%{http_code}' "http://$DOMAINE$chemin")"
  echo "$DOMAINE$chemin : HTTP $code"
  [ "$code" = "200" ] || { echo "$chemin devrait répondre 200." >&2; false; }
done
code="$(curl -skL $local_ -o /dev/null -w '%{http_code}' "http://$DOMAINE/api/v2/owner/offers")"
echo "$DOMAINE/api/v2/owner/offers sans connexion : HTTP $code (401 attendu)"
[ "$code" = "401" ] || { echo "L'API devrait répondre 401 sans connexion." >&2; false; }
trap - ERR

etape "Terminé"
echo "https://$DOMAINE/start et https://$DOMAINE/owner affichent le NCC."
echo "Retour arrière : copies dans $dossier"
