#!/usr/bin/env bash
# Installe ou met à jour le site officiel NICRESI sur le serveur, à côté du NCC, sans le toucher.
#
#   sudo bash installer.sh --source /home/nicresi/nicresi-site --commit <empreinte>                          (plan seulement)
#   sudo bash installer.sh --source /home/nicresi/nicresi-site --commit <empreinte> --appliquer              (port HTTPS séparé)
#   sudo bash installer.sh --source /home/nicresi/nicresi-site --commit <empreinte> --domaine nicresi.ne --appliquer
#
# Le site est statique (HTML, CSS, images) : ni PHP, ni base de données.
#   - fichiers dans /var/www/nicresi-site/releases/<commit>, lien « current » basculé à la fin ;
#   - sans --domaine : site Apache sur son propre port HTTPS (8444 par défaut) avec le certificat du NCC ;
#   - avec --domaine : site Apache en HTTP sur ce nom de domaine ; le certificat se demande ensuite avec certbot.
# Il ne modifie ni le NCC, ni ses sites Apache, ni NICRESI Gestion, ni FreeRADIUS, ni WireGuard, ni le pare-feu.
# Si la vérification échoue après la bascule, l'ancienne version et l'ancienne configuration sont remises.
set -Eeuo pipefail
export LC_ALL=C

SOURCE=""
COMMIT=""
PORT="8444"
DOMAINE=""
CERT=""
CLE=""
APPLIQUER=0
RACINE="/var/www/nicresi-site"
SAUVEGARDES="/var/backups/nicresi-site"
SITE="/etc/apache2/sites-available/nicresi-site.conf"

arret() { printf '\nARRÊT : %s\nRien n’a été basculé.\n' "$1" >&2; exit 1; }
etape() { printf '\n== %s ==\n' "$1"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --source) SOURCE="${2:-}"; shift 2 ;;
    --commit) COMMIT="${2:-}"; shift 2 ;;
    --port) PORT="${2:-}"; shift 2 ;;
    --domaine) DOMAINE="${2:-}"; shift 2 ;;
    --cert) CERT="${2:-}"; shift 2 ;;
    --cle) CLE="${2:-}"; shift 2 ;;
    --appliquer) APPLIQUER=1; shift ;;
    *) arret "option inconnue : $1" ;;
  esac
done

etape "Contrôles préalables"
[ "$(id -u)" -eq 0 ] || arret "lancer avec sudo."
[ -n "$SOURCE" ] && [ -d "$SOURCE/.git" ] || arret "--source doit être une copie Git du dépôt Nicresi."
[ -n "$COMMIT" ] || arret "--commit est obligatoire (empreinte exacte à installer)."
COMMIT="$(git -C "$SOURCE" rev-parse --verify "$COMMIT^{commit}" 2>/dev/null)" || arret "commit introuvable dans $SOURCE (faire git fetch)."
git -C "$SOURCE" cat-file -e "$COMMIT:public/index.html" 2>/dev/null || arret "ce commit ne contient pas public/index.html."
for outil in apache2ctl a2ensite curl git tar; do
  command -v "$outil" >/dev/null || arret "outil manquant : $outil"
done
modules="$(apache2ctl -M 2>/dev/null)"
apache2ctl configtest >/dev/null 2>&1 || arret "la configuration Apache actuelle est déjà en erreur ; la corriger d'abord."

if [ -n "$DOMAINE" ]; then
  [[ "$DOMAINE" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || arret "nom de domaine invalide : $DOMAINE"
  if grep -rlsE "^\s*Server(Name|Alias).*\b(www\.)?$DOMAINE\b" /etc/apache2/sites-enabled/ | grep -v "nicresi-site.conf" | grep -q .; then
    arret "le domaine $DOMAINE est déjà déclaré dans un autre site Apache ; vérifier à la main."
  fi
  MODE="domaine"
else
  [[ "$PORT" =~ ^[0-9]{4,5}$ ]] || arret "port invalide."
  echo "$modules" | grep -q ssl_module || arret "module Apache manquant : ssl (a2enmod ssl)"
  if [ -z "$CERT" ] || [ -z "$CLE" ]; then
    CERT="${CERT:-$(grep -hE '^\s*SSLCertificateFile' /etc/apache2/sites-enabled/nicresi-ssl.conf 2>/dev/null | awk '{print $2}' | head -1)}"
    CLE="${CLE:-$(grep -hE '^\s*SSLCertificateKeyFile' /etc/apache2/sites-enabled/nicresi-ssl.conf 2>/dev/null | awk '{print $2}' | head -1)}"
  fi
  [ -f "$CERT" ] && [ -f "$CLE" ] || arret "certificat introuvable ; préciser --cert et --cle."
  if ss -ltn "( sport = :$PORT )" | grep -q LISTEN && ! grep -qs "Listen $PORT" "$SITE"; then
    arret "le port $PORT est déjà utilisé par un autre service ; choisir --port."
  fi
  MODE="port"
fi

PREMIERE=1
[ -L "$RACINE/current" ] && PREMIERE=0
COURT="${COMMIT:0:12}"
VERSION="$RACINE/releases/$COURT"
IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ "$MODE" = "domaine" ]; then ADRESSE="http://$DOMAINE"; else ADRESSE="https://${IP:-<adresse du serveur>}:$PORT"; fi

etape "Plan"
echo "Commit installé : $COMMIT"
echo "Type            : $([ $PREMIERE -eq 1 ] && echo 'première installation' || echo "mise à jour (actuelle : $(readlink "$RACINE/current"))")"
echo "Dossier         : $VERSION"
echo "Adresse         : $ADRESSE"
[ "$MODE" = "port" ] && echo "Certificat      : $CERT"
echo "Site Apache     : $SITE ($([ -f "$SITE" ] && echo 'remplacé, ancienne copie sauvegardée' || echo 'créé'))"
if [ $APPLIQUER -eq 0 ]; then
  echo; echo "Plan seulement : rien n'a été modifié. Relancer avec --appliquer pour installer."
  exit 0
fi

recharger() {
  if systemctl is-active --quiet apache2 2>/dev/null; then systemctl reload apache2; else apache2ctl graceful; fi
  sleep 2
}
verifier() {
  local version code
  if [ "$MODE" = "domaine" ]; then
    version="$(curl -s -H "Host: $DOMAINE" "http://127.0.0.1/version.txt")"
    code="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $DOMAINE" "http://127.0.0.1/")"
  else
    version="$(curl -sk "https://127.0.0.1:$PORT/version.txt")"
    code="$(curl -sk -o /dev/null -w '%{http_code}' "https://127.0.0.1:$PORT/")"
  fi
  [ "$version" = "$1" ] || { echo "Le site sert la version « ${version:-aucune} » au lieu de $1." >&2; return 1; }
  [ "$code" = "200" ] || { echo "La page d'accueil répond $code au lieu de 200." >&2; return 1; }
}

ANCIENNE=""
COPIE_SITE=""
bascule_faite=0
retour_arriere() {
  [ $bascule_faite -eq 1 ] || return 0
  if [ -n "$ANCIENNE" ]; then
    ln -sfn "$ANCIENNE" "$RACINE/current.tmp" && mv -T "$RACINE/current.tmp" "$RACINE/current"
    echo "Ancienne version remise : $ANCIENNE" >&2
  fi
  if [ -n "$COPIE_SITE" ]; then
    cp -p "$COPIE_SITE" "$SITE"
    echo "Ancienne configuration Apache remise : $COPIE_SITE" >&2
  elif [ $PREMIERE -eq 1 ]; then
    a2dissite nicresi-site >/dev/null 2>&1 || true; rm -f "$SITE"
    echo "Nouveau site Apache retiré." >&2
  fi
  apache2ctl configtest >/dev/null 2>&1 && recharger
}
trap 'echo "ÉCHEC à la ligne $LINENO." >&2; retour_arriere' ERR

install -d -m 0750 -o root -g root "$SAUVEGARDES"

etape "Fichiers du site"
install -d -m 0755 -o root -g root "$RACINE" "$RACINE/releases"
if [ -d "$VERSION" ]; then
  echo "Dossier $VERSION déjà présent : réutilisé."
else
  tmp="$(mktemp -d "$RACINE/releases/.tmp-XXXXXX")"
  git -C "$SOURCE" archive "$COMMIT" public | tar -x -C "$tmp"
  echo "$COMMIT" > "$tmp/public/version.txt"
  chmod -R a+rX "$tmp"
  mv "$tmp" "$VERSION"
  chmod 0755 "$VERSION"
fi

etape "Site Apache ($MODE)"
if [ -f "$SITE" ]; then
  COPIE_SITE="$SAUVEGARDES/nicresi-site.conf.$(date +%Y%m%d-%H%M%S)"
  cp -p "$SITE" "$COPIE_SITE"
  echo "Configuration actuelle sauvegardée : $COPIE_SITE"
fi
COMMUN="    DocumentRoot $RACINE/current/public
    <Directory $RACINE/current/public>
        AllowOverride None
        Require all granted
        Options -Indexes +FollowSymLinks
    </Directory>
    ErrorDocument 404 /404.html
    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options \"nosniff\"
        Header always set X-Frame-Options \"SAMEORIGIN\"
        Header always set Referrer-Policy \"strict-origin-when-cross-origin\"
        <FilesMatch \"\\.(css|js|png|jpg|svg)\$\">
            Header set Cache-Control \"public, max-age=604800\"
        </FilesMatch>
    </IfModule>
    ErrorLog \${APACHE_LOG_DIR}/nicresi-site-erreurs.log
    CustomLog \${APACHE_LOG_DIR}/nicresi-site-acces.log combined"
if [ "$MODE" = "domaine" ]; then
  cat > "$SITE" <<SITE
# Site officiel NICRESI — séparé du NCC. Créé par scripts/serveur/installer.sh.
<VirtualHost *:80>
    ServerName $DOMAINE
    ServerAlias www.$DOMAINE
$COMMUN
</VirtualHost>
SITE
else
  cat > "$SITE" <<SITE
# Site officiel NICRESI — séparé du NCC. Créé par scripts/serveur/installer.sh.
Listen $PORT
<VirtualHost *:$PORT>
    SSLEngine on
    SSLCertificateFile $CERT
    SSLCertificateKeyFile $CLE
$COMMUN
</VirtualHost>
SITE
fi
a2ensite nicresi-site >/dev/null
if ! apache2ctl configtest >/dev/null 2>&1; then
  if [ -n "$COPIE_SITE" ]; then cp -p "$COPIE_SITE" "$SITE"; else a2dissite nicresi-site >/dev/null; rm -f "$SITE"; fi
  arret "Apache refuse la nouvelle configuration ; l'ancienne a été remise, Apache n'a pas été rechargé."
fi

etape "Bascule"
[ $PREMIERE -eq 0 ] && ANCIENNE="$(readlink -f "$RACINE/current")"
ln -sfn "$VERSION" "$RACINE/current.tmp" && mv -T "$RACINE/current.tmp" "$RACINE/current"
bascule_faite=1
recharger
verifier "$COMMIT"
echo "Version servie vérifiée ($COURT) ; page d'accueil : HTTP 200."
trap - ERR

etape "Nettoyage"
ls -1dt "$RACINE"/releases/*/ 2>/dev/null | tail -n +4 | while read -r ancien; do
  [ "$(readlink -f "$RACINE/current")/" = "$ancien" ] || rm -rf "$ancien"
done
echo "Trois dernières versions conservées."

etape "Terminé"
echo "Version en service : $COMMIT"
echo "Adresse            : $ADRESSE"
if [ "$MODE" = "domaine" ]; then
  echo
  echo "Pour le HTTPS, une fois que le domaine pointe vers ce serveur :"
  echo "  sudo certbot --apache -d $DOMAINE -d www.$DOMAINE"
elif command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q '^Status: active'; then
  echo
  echo "Le pare-feu ufw est actif : autoriser le port avec « sudo ufw allow $PORT/tcp » pour y accéder depuis l'extérieur."
fi
