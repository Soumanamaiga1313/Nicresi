# Site officiel NICRESI

Site vitrine de NICRESI, la Nigérienne des Créations et des Solutions Informatiques : Wi-Fi zones, cartes d'accès, Starlink, énergie solaire, réseaux et informatique, vente de matériel.

Le site est statique : tout ce qui est publié se trouve dans `public/` (HTML, CSS, un petit script pour le menu, images). Aucun PHP, aucune base de données.

## Voir le site en local

```sh
cd public && python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Modifier le contenu

- Textes, téléphone, liens : `public/index.html`.
- Couleurs (noir, or et orange du logo) : variables en tête de `public/css/style.css`.
- Photos : `public/img/photos/`, au plus 720 px de large.

Les liens « Espace propriétaire » et « Créer mon compte » pointent vers le NICRESI Control Center (https://185.217.127.103/owner et /start). Les mettre à jour si le NCC change d'adresse.

## Mise en ligne

Le site s'installe sur le serveur NICRESI à côté du NCC, sans le modifier : [docs/INSTALLATION.md](docs/INSTALLATION.md).
