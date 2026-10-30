# Site officiel NICRESI

Site vitrine de NICRESI, la Nigérienne des Créations et des Solutions Informatiques : Wi-Fi zones, cartes d'accès, Starlink, énergie solaire, réseaux et informatique, vente de matériel.

Le site est statique : tout ce qui est publié se trouve dans `public/` (HTML, CSS, un petit script pour le menu, images). Aucun PHP, aucune base de données.

## Voir le site en local

```sh
cd public && python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

## Modifier le contenu

Tout le contenu est dans `public/index.html`, organisé en huit sections : accueil (titre Wi-Fi, WhatsApp et appel, photo d'un technicien), services (quatre portes, le Wi-Fi en premier), réalisations, NICRESI Control (résumé ; le détail est dans `public/nicresi-control/`), comment ça se passe (méthode et animation), formation, à propos, contact.

- **Couleurs** (orange, noir, blanc) : variables en tête de `public/css/style.css`. Pour rester lisible (contraste WCAG AA), le texte posé sur l'orange vif est noir, et le texte orange sur fond clair utilise `--orange-fonce`.
- **Coordonnées** : elles apparaissent dans l'en-tête de la page (balises meta et bloc JSON-LD), la section contact, le pied de page, le bouton WhatsApp et `public/js/site.js` (constante `WHATSAPP`). Les changer partout à la fois.
- **Ajouter une réalisation** : copier un bloc `<article class="realisation">` dans la section réalisations, choisir `data-categorie` parmi `numerique`, `reseau`, `energie`, `informatique`, `accompagnement`, et mettre la photo dans `public/img/photos/` (720 px de large au plus). Pour une fiche complète, ajouter sous le texte :
  ```html
  <dl><dt>Besoin</dt><dd>…</dd><dt>Solution</dt><dd>…</dd><dt>Technologies</dt><dd>…</dd><dt>Résultat</dt><dd>…</dd></dl>
  ```
  Ne publier que des travaux réellement livrés, avec des photos ou captures authentiques. Un filtre n'apparaît que si sa catégorie contient au moins une réalisation.
- **Animations** : courtes, elles tournent en boucle tant qu'elles sont à l'écran et s'arrêtent dès qu'elles en sortent (IntersectionObserver dans `site.js`). La scène du quartier (section « Comment ça se passe », `#methode`) passe ses cinq phases en moins de 5 secondes, garde l'image finale 2 secondes, puis recommence ; un bouton « Mettre en pause » l'arrête (classes `el--…` et règles `.scene--animee.phase-N` dans le CSS, textes, `DUREE_PHASE` et `DUREE_FIN` dans `site.js`). Chaque service a une petite scène SVG (`.mini`) dont les éléments `a1` à `a5` apparaissent l'un après l'autre en 2,5 secondes, rejouée toutes les 4 secondes (`CYCLE_MINI`). Sans JavaScript ou avec « réduire les animations », les images finales s'affichent directement.
- **Style visuel** : titres très gras (police système, rien à télécharger), mot clé surligné en or (`<mark class="surligneur">`), accent or `--or` (#ffc21a, toujours avec du texte noir), formes plates derrière la photo de l'accueil. Les mini-scènes des services sont en isométrie (flat design, line art) et se régénèrent avec `scripts/illustrations/mini-scenes-iso.py`.
- **3D et néomorphisme** : la photo de l'accueil (`.relief`) s'incline en 3D selon la souris ou le défilement (CSS `perspective`, aucune bibliothèque) ; la section Formation (`.section--douce`, `.liste-douce`) utilise des surfaces en relief doux, avec un bord fin pour rester lisibles. L'illustration isométrique de la salle de formation (`.illus`) se régénère avec `python3 scripts/illustrations/mini-scenes-iso.py formation`. Avec « réduire les animations », rien ne bouge.
- **Petit jeu « Trouvez votre service »** (`#quiz`, dans la section services) : deux questions (lieu, priorité), une barre de progression, puis le service conseillé et une demande WhatsApp préremplie. Les réponses sont dans les `data-valeur` du HTML, les textes de résultat dans `textesQuiz` (`site.js`). Masqué sans JavaScript.

## Formulaire de contact

Le formulaire a un attribut `data-endpoint` :

- **vide** (réglage actuel) : la demande est mise en forme et ouverte dans WhatsApp vers le +227 93 19 19 20 ; le visiteur confirme l'envoi dans WhatsApp. Le bouton (« Préparer ma demande dans WhatsApp ») et la phrase au-dessus l'annoncent avant le clic. Rien n'est affiché comme « envoyé » à sa place. Après le clic, le visiteur peut aussi copier sa demande, l'envoyer par e-mail ou appeler.
- **adresse d'un service de réception** (par exemple un formulaire Formspree relié à servicenicresi@gmail.com) : envoi direct en JSON ; la confirmation ne s'affiche que si le service répond correctement, sinon un message d'erreur renvoie vers WhatsApp et l'e-mail.

Le visiteur indique s'il s'agit d'un nouveau projet ou d'une assistance ; ce choix figure dans le message et dans le sujet de l'e-mail. Les liens portant `data-service` (« Demander un devis Wi-Fi », « Parler de mon projet de site ou de logiciel », « Demander une démonstration »…) préremplissent le service : leur valeur doit être identique à une option du champ « Service demandé ». Chaque champ est vérifié avant l'envoi (nom, numéro d'au moins 8 chiffres, service, besoin d'au moins 10 caractères) et l'erreur s'affiche sous le champ concerné. Un champ invisible piège les robots : s'il est rempli, rien n'est envoyé. Une mention sous le formulaire précise l'usage des données.

Les liens « Espace propriétaire » et « Créer mon compte » pointent vers /owner et /start : sur le serveur, ces chemins sont relayés vers le NICRESI Control Center par `scripts/serveur/relier-ncc.sh`. Ils ne fonctionnent pas sur l'aperçu Netlify.

## Tests

Le rapport d'audit d'octobre 2026 décrit les tests T01 à T12 (appareils, menu, animation, filtres, formulaire, contacts, NICRESI Control, connexion lente, accessibilité, référencement). Avant chaque publication : vérifier l'aperçu Netlify de la PR sur téléphone et sur ordinateur.

## Mise en ligne

Le site s'installe sur le serveur NICRESI à côté du NCC, sans le modifier : [docs/INSTALLATION.md](docs/INSTALLATION.md).
