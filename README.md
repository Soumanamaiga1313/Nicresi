# Site officiel NICRESI

Site vitrine de NICRESI, la Nigérienne des Créations et des Solutions Informatiques : Wi-Fi zones, cartes d'accès, Starlink, énergie solaire, réseaux et informatique, vente de matériel.

Le site est statique : tout ce qui est publié se trouve dans `public/` (HTML, CSS, un petit script pour le menu, images). Aucun PHP, aucune base de données.

## Voir le site en local

```sh
cd public && python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Modifier le contenu

Tout le contenu est dans `public/index.html`, organisé en huit sections dans l'ordre du cahier d'orientation : accueil (avec l'animation), solutions, méthode, réalisations, NICRESI Control, formation, à propos, contact.

- **Couleurs** (orange, noir, blanc) : variables en tête de `public/css/style.css`. Pour rester lisible (contraste WCAG AA), le texte posé sur l'orange vif est noir, et le texte orange sur fond clair utilise `--orange-fonce`.
- **Coordonnées** : elles apparaissent dans l'en-tête de la page (balises meta et bloc JSON-LD), la section contact, le pied de page, le bouton WhatsApp et `public/js/site.js` (constante `WHATSAPP`). Les changer partout à la fois.
- **Ajouter une réalisation** : copier un bloc `<article class="realisation">` dans la section réalisations, choisir `data-categorie` parmi `numerique`, `reseau`, `energie`, `informatique`, `accompagnement`, et mettre la photo dans `public/img/photos/` (720 px de large au plus). Pour une fiche complète, ajouter sous le texte :
  ```html
  <dl><dt>Besoin</dt><dd>…</dd><dt>Solution</dt><dd>…</dd><dt>Technologies</dt><dd>…</dd><dt>Résultat</dt><dd>…</dd></dl>
  ```
  Ne publier que des travaux réellement livrés, avec des photos ou captures authentiques. Une catégorie sans réalisation affiche automatiquement un message au lieu d'une zone vide.
- **Animation** : scène SVG dans la section accueil ; chaque élément porte une classe `el--…` qui apparaît à sa phase (règles `.scene--animee.phase-N` dans le CSS, textes des phases dans `site.js`). Sans JavaScript, la scène reste fixe dans son état final ; avec « réduire les animations » activé sur l'appareil, elle s'ouvre sur la dernière phase sans défilement.

## Formulaire de contact

Le formulaire a un attribut `data-endpoint` :

- **vide** (réglage actuel) : la demande est mise en forme et ouverte dans WhatsApp vers le +227 93 19 19 20 ; le visiteur confirme l'envoi dans WhatsApp. Rien n'est affiché comme « envoyé » à sa place.
- **adresse d'un service de réception** (par exemple un formulaire Formspree relié à servicenicresi@gmail.com) : envoi direct en JSON ; la confirmation ne s'affiche que si le service répond correctement, sinon un message d'erreur renvoie vers WhatsApp et l'e-mail.

Chaque champ est vérifié avant l'envoi (nom, numéro d'au moins 8 chiffres, service, besoin d'au moins 10 caractères) et l'erreur s'affiche sous le champ concerné. Un champ invisible piège les robots : s'il est rempli, rien n'est envoyé. Une mention sous le formulaire précise l'usage des données.

Les liens « Espace propriétaire » et « Créer mon compte » pointent vers /owner et /start : sur le serveur, ces chemins sont relayés vers le NICRESI Control Center par `scripts/serveur/relier-ncc.sh`. Ils ne fonctionnent pas sur l'aperçu Netlify.

## Tests

Le rapport d'audit d'octobre 2026 décrit les tests T01 à T12 (appareils, menu, animation, filtres, formulaire, contacts, NICRESI Control, connexion lente, accessibilité, référencement). Avant chaque publication : vérifier l'aperçu Netlify de la PR sur téléphone et sur ordinateur.

## Mise en ligne

Le site s'installe sur le serveur NICRESI à côté du NCC, sans le modifier : [docs/INSTALLATION.md](docs/INSTALLATION.md).
