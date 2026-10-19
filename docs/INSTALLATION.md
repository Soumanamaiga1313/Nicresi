# Installer le site officiel sur le serveur

Le site s'installe **à côté** du NCC et de NICRESI Gestion, sans les modifier : son propre dossier (`/var/www/nicresi-site`) et son propre site Apache (`nicresi-site.conf`). Le script ne touche ni aux sites Apache existants, ni aux bases, ni à FreeRADIUS, ni à WireGuard, ni au pare-feu.

Toutes les commandes se lancent depuis le terminal SSH du serveur, avec le compte `nicresi`.

## 1. Récupérer le code

Première fois :

```sh
git clone https://github.com/Soumanamaiga1313/Nicresi.git /home/nicresi/nicresi-site
```

Les fois suivantes :

```sh
git -C /home/nicresi/nicresi-site pull --ff-only origin main
```

## 2. Choisir l'adresse

- **Sans nom de domaine** (par défaut) : le site est servi en HTTPS sur un port séparé, `https://185.217.127.103:8444`, avec le certificat déjà utilisé par le NCC. Option `--port` si 8444 est pris.
- **Avec un nom de domaine** : faire pointer le domaine (enregistrements A de `nicresi.xx` et `www.nicresi.xx`) vers 185.217.127.103, puis ajouter `--domaine nicresi.xx`. Le NCC reste accessible par l'adresse IP.

On peut commencer sans domaine et relancer plus tard avec `--domaine` : la configuration du site est remplacée, l'ancienne est sauvegardée dans `/var/backups/nicresi-site`.

## 3. Plan, puis installation

Afficher le plan sans rien modifier :

```sh
cd /home/nicresi/nicresi-site
sudo bash scripts/serveur/installer.sh --source /home/nicresi/nicresi-site --commit "$(git rev-parse origin/main)"
```

Installer :

```sh
sudo bash scripts/serveur/installer.sh --source /home/nicresi/nicresi-site --commit "$(git rev-parse origin/main)" --appliquer
```

Ce que fait le script :

1. contrôles (outils, configuration Apache actuelle valide, port libre ou domaine non utilisé ailleurs, certificat) ; il s'arrête au moindre doute ;
2. copie du dossier `public/` du commit choisi dans `/var/www/nicresi-site/releases/<commit>` ;
3. création ou remplacement de `nicresi-site.conf`, refusé et annulé si `apache2ctl configtest` échoue ;
4. bascule, rechargement d'Apache, puis vérification que **la nouvelle version est bien servie** et que l'accueil répond 200. En cas d'échec, l'ancienne version et l'ancienne configuration sont remises automatiquement ;
5. conservation des trois dernières versions.

## 4. Après l'installation

- Sans domaine, si le pare-feu `ufw` est actif : `sudo ufw allow 8444/tcp`.
- Avec domaine, pour le HTTPS, une seule fois : `sudo certbot --apache -d nicresi.xx -d www.nicresi.xx`. Les mises à jour suivantes avec le même `--domaine` conservent la configuration de certbot et ne changent que la version servie.
- Vérifier depuis un téléphone que la page s'affiche et que les boutons WhatsApp et téléphone fonctionnent.

## Situation actuelle

Depuis le 19 octobre 2026, le site est servi sur https://nicresi.com (certificat Let's Encrypt renouvelé automatiquement). Mise à jour :

```sh
cd /home/nicresi/nicresi-site && git pull --ff-only origin main
sudo bash scripts/serveur/installer.sh --source /home/nicresi/nicresi-site --commit "$(git rev-parse origin/main)" --domaine nicresi.com --appliquer
```

## Retour arrière

```sh
ls -1t /var/www/nicresi-site/releases/
sudo ln -sfn /var/www/nicresi-site/releases/<version précédente> /var/www/nicresi-site/current
sudo systemctl reload apache2
```
