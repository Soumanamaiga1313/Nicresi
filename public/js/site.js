// NICRESI — menu mobile, animation signature, filtres des réalisations et formulaire de contact.
(function () {
  'use strict';

  var reduireMouvements = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mode léger : activé tout seul si le téléphone demande d'économiser les données ou si la connexion est en 2G,
  // ou choisi par le visiteur (bouton en bas de page, mémorisé sur cet appareil). Pas d'animation, images à la demande.
  var CLE_LEGER = 'nicresi-mode-leger', choixLeger = null;
  try { choixLeger = localStorage.getItem(CLE_LEGER); } catch (e) { /* stockage indisponible : on suit la connexion */ }
  var connexion = navigator.connection || {};
  var legerAuto = !!(connexion.saveData || /(^|-)2g$/.test(connexion.effectiveType || ''));
  var modeLeger = choixLeger ? choixLeger === '1' : legerAuto;
  var choisirLeger = function (actif) {
    try { localStorage.setItem(CLE_LEGER, actif ? '1' : '0'); } catch (e) { /* tant pis : le choix vaut pour cette page */ }
    location.reload();
  };
  if (modeLeger) {
    document.documentElement.classList.add('leger');
    reduireMouvements = true;
    // Les images plus bas dans la page ne sont pas encore téléchargées : on les garde en attente.
    var enAttenteImages = [];
    document.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      if (img.complete && img.naturalWidth) return;
      img.dataset.src = img.getAttribute('src');
      // Image vide aux mêmes proportions (aucun téléchargement) : la mise en page ne bouge pas.
      img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' +
        (img.getAttribute('width') || 4) + '" height="' + (img.getAttribute('height') || 3) + '"/>');
      img.classList.add('img-leger');
      img.title = 'Toucher pour afficher l\'image';
      img.addEventListener('click', function charger() { afficherImage(img); img.removeEventListener('click', charger); });
      enAttenteImages.push(img);
    });
    var afficherImage = function (img) {
      if (!img.dataset.src) return;
      img.src = img.dataset.src; delete img.dataset.src; img.classList.remove('img-leger'); img.removeAttribute('title');
    };
    var bandeau = document.createElement('div');
    bandeau.className = 'bandeau-leger';
    bandeau.setAttribute('role', 'status');
    bandeau.innerHTML = '<div class="conteneur"><p><strong>' + (choixLeger === '1' ? 'Mode léger activé.' : 'Connexion lente ou économie de données détectée : mode léger activé.') +
      '</strong> Animations coupées, images affichées seulement si vous les touchez.</p>' +
      '<button type="button" data-action="tout-afficher">Afficher les images</button><button type="button" data-action="quitter-leger">Mode normal</button></div>';
    var entete = document.querySelector('.entete');
    if (entete) entete.appendChild(bandeau); else document.body.insertBefore(bandeau, document.body.firstChild);
    bandeau.querySelector('[data-action="tout-afficher"]').addEventListener('click', function () {
      enAttenteImages.forEach(afficherImage); this.hidden = true;
    });
    bandeau.querySelector('[data-action="quitter-leger"]').addEventListener('click', function () { choisirLeger(false); });
  }

  // Outils en bas de page : mode léger et installation du site comme une application.
  var basDePage = document.querySelector('.pied__bas');
  if (basDePage) {
    var outils = document.createElement('div');
    outils.className = 'pied__outils';
    outils.innerHTML = '<button type="button" data-action="mode-leger" aria-pressed="' + modeLeger + '">Mode léger (économise vos données)</button>' +
      '<button type="button" data-action="installer" hidden>Installer l\'application NICRESI</button>';
    basDePage.appendChild(outils);
    outils.querySelector('[data-action="mode-leger"]').addEventListener('click', function () { choisirLeger(!modeLeger); });
    var boutonInstaller = outils.querySelector('[data-action="installer"]'), invitation = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); invitation = e; boutonInstaller.hidden = false;
    });
    boutonInstaller.addEventListener('click', function () {
      if (!invitation) return;
      invitation.prompt();
      invitation.userChoice.then(function () { invitation = null; boutonInstaller.hidden = true; });
    });
    window.addEventListener('appinstalled', function () { boutonInstaller.hidden = true; });
  }

  // Site disponible hors connexion (sw.js) : pages déjà visitées et contacts restent accessibles sans Internet.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () { /* le site marche sans */ }); });
  }

  // Menu sur téléphone
  var bouton = document.querySelector('.menu-bouton');
  var menu = document.getElementById('menu');
  if (bouton && menu) {
    bouton.addEventListener('click', function () {
      var ouvert = menu.classList.toggle('ouvert');
      bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
    function fermerMenu() {
      menu.classList.remove('ouvert');
      bouton.setAttribute('aria-expanded', 'false');
    }
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') fermerMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('ouvert')) { fermerMenu(); bouton.focus(); }
    });
  }

  var annee = document.getElementById('annee');
  if (annee) annee.textContent = new Date().getFullYear();

  // Animation signature, courte : les cinq phases défilent (moins de 5 secondes), l'image finale reste
  // un instant, puis tout recommence. Elle tourne tant que la scène est à l'écran et s'arrête dès qu'elle en sort.
  // Un bouton permet de la mettre en pause. Sans JavaScript ou avec « réduire les animations »,
  // la scène s'affiche directement complète.
  var scene = document.querySelector('.scene');
  if (scene) {
    var svg = scene.querySelector('.scene__svg');
    var legende = scene.querySelector('.scene__etape');
    var controles = scene.querySelector('.scene__controles');
    var pause = scene.querySelector('.scene__pause');
    var textes = {
      1: '<strong>Le besoin.</strong> Une boutique, une école, un bureau : chacun cherche un logiciel, un accès à Internet ou de l\'énergie.',
      2: '<strong>La conception.</strong> Nous imaginons la solution et concevons le site, l\'application ou le logiciel sur mesure.',
      3: '<strong>L\'installation.</strong> Nos techniciens posent l\'antenne et les panneaux solaires, relient les bâtiments et mettent les outils en service.',
      4: '<strong>L\'utilisation.</strong> Le commerçant gère ses ventes, le bureau travaille, le propriétaire suit son activité depuis son téléphone.',
      5: '<strong>L\'accompagnement.</strong> Nous formons, conseillons et restons disponibles. Créer. Connecter. Construire.'
    };
    var DUREE_PHASE = 900, DUREE_FIN = 2000, minuteur = null, phase = 1, visible = false, enPause = false;

    function afficher(n) {
      for (var i = 1; i <= 5; i++) svg.classList.toggle('phase-' + i, i === n);
      svg.classList.add('scene--animee');
      legende.innerHTML = textes[n];
    }
    function arreter() { clearTimeout(minuteur); minuteur = null; }
    function suivante() {
      arreter();
      minuteur = setTimeout(function () {
        phase = phase >= 5 ? 1 : phase + 1;
        afficher(phase);
        suivante();
      }, phase === 5 ? DUREE_FIN : DUREE_PHASE);
    }
    function mettreAJour() {
      if (visible && !enPause) { if (!minuteur) suivante(); } else { arreter(); }
    }

    if (reduireMouvements || !('IntersectionObserver' in window)) {
      afficher(5);
    } else {
      afficher(1);
      controles.hidden = false;
      pause.addEventListener('click', function () {
        enPause = !enPause;
        pause.setAttribute('aria-pressed', enPause ? 'true' : 'false');
        pause.textContent = enPause ? 'Reprendre l\'animation' : 'Mettre en pause';
        mettreAJour();
      });
      // Tourne seulement pendant que la scène est à l'écran ; reprend au début quand on y revient.
      new IntersectionObserver(function (entrees) {
        var etaitVisible = visible;
        visible = entrees[0].isIntersecting;
        if (visible && !etaitVisible && !enPause) { phase = 1; afficher(1); }
        mettreAJour();
      }, { threshold: 0.4 }).observe(svg);
    }

    // Éléments cliquables : chaque bâtiment mène à l'activité correspondante.
    svg.querySelectorAll('[data-cible]').forEach(function (el) {
      function aller() {
        var cible = document.querySelector(el.dataset.cible);
        if (!cible) return;
        cible.scrollIntoView({ behavior: reduireMouvements ? 'auto' : 'smooth' });
        cible.classList.remove('surligne'); void cible.offsetWidth; cible.classList.add('surligne');
      }
      el.addEventListener('click', aller);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aller(); }
      });
    });
  }

  // Petites animations des services : chaque scène (2,5 secondes) se rejoue en boucle tant que la carte
  // est à l'écran, et s'arrête dès qu'elle en sort.
  if (!reduireMouvements && 'IntersectionObserver' in window) {
    var CYCLE_MINI = 4000;
    var boucles = new Map();
    function rejouerMini(m) {
      m.classList.remove('mini--joue');
      void m.getBoundingClientRect();
      m.classList.add('mini--joue');
    }
    var observateurMini = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var m = e.target;
        if (e.isIntersecting && !boucles.has(m)) {
          m.classList.remove('mini--attente');
          rejouerMini(m);
          boucles.set(m, setInterval(function () { rejouerMini(m); }, CYCLE_MINI));
        } else if (!e.isIntersecting && boucles.has(m)) {
          clearInterval(boucles.get(m));
          boucles.delete(m);
          m.classList.replace('mini--joue', 'mini--attente');
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.mini').forEach(function (m) {
      m.classList.add('mini--attente');
      observateurMini.observe(m);
    });
  }

  // Petit jeu « Trouvez votre service » : deux questions, puis le service conseillé et une demande WhatsApp préremplie.
  var quiz = document.getElementById('quiz');
  if (quiz) {
    var textesQuiz = {
      '#sol-reseau': 'Nous installons la connexion, l\'antenne et les points d\'accès, puis nous vous montrons comment vendre vos cartes et suivre vos ventes.',
      '#sol-numerique': 'Nous concevons avec vous le site, l\'application ou le logiciel qui remplace les cahiers et les tableurs, puis nous l\'entretenons.',
      '#sol-equipements': 'Nous choisissons et installons le matériel, et nous dimensionnons panneaux et batteries selon ce que vous devez alimenter.',
      '#sol-formation': 'Nous formons les personnes qui utiliseront les outils et nous vous aidons à choisir avant d\'investir.'
    };
    var etapes = quiz.querySelectorAll('.quiz__etape');
    var resultat = quiz.querySelector('.quiz__resultat');
    var barre = quiz.querySelector('.quiz__progression span');
    var lieu = '';
    function montrer(bloc, avancement) {
      etapes.forEach(function (e) { e.hidden = e !== bloc; });
      resultat.hidden = bloc !== resultat;
      barre.style.width = avancement;
      var focus = bloc.querySelector('[tabindex="-1"]');
      if (focus) focus.focus({ preventScroll: true });
    }
    etapes[0].querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { lieu = b.dataset.valeur; montrer(etapes[1], '50%'); });
    });
    etapes[1].querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var cible = document.querySelector(b.dataset.cible);
        quiz.querySelector('.quiz__nom').textContent = cible.querySelector('h3').textContent;
        quiz.querySelector('.quiz__texte').textContent = textesQuiz[b.dataset.cible];
        quiz.querySelector('.quiz__detail').href = b.dataset.cible;
        quiz.querySelector('[data-action="quiz-whatsapp"]').href = 'https://wa.me/22793191920?text=' +
          encodeURIComponent('Bonjour NICRESI, pour ' + lieu + ', je souhaite ' + b.dataset.valeur + '. Pouvez-vous me conseiller ?');
        montrer(resultat, '100%');
      });
    });
    quiz.querySelector('.quiz__detail').addEventListener('click', function () {
      var cible = document.querySelector(this.getAttribute('href'));
      cible.classList.remove('surligne'); void cible.offsetWidth; cible.classList.add('surligne');
    });
    quiz.querySelector('.quiz__recommencer').addEventListener('click', function () { montrer(etapes[0], '8%'); });
    quiz.hidden = false;
  }

  // 3D légère de l'accueil : la photo s'incline vers la souris, ou selon le défilement sur téléphone.
  var relief = document.querySelector('.relief');
  if (relief && !reduireMouvements) {
    relief.classList.add('relief--actif');
    var incliner = function (rx, ry) {
      relief.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      relief.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    };
    if (window.matchMedia('(hover: hover)').matches) {
      var zone = document.querySelector('.accueil');
      zone.addEventListener('pointermove', function (e) {
        var b = relief.getBoundingClientRect();
        var x = (e.clientX - (b.left + b.width / 2)) / window.innerWidth;
        var y = (e.clientY - (b.top + b.height / 2)) / window.innerHeight;
        incliner(-y * 14, x * 18);
      });
      zone.addEventListener('pointerleave', function () { incliner(0, 0); });
    } else {
      // Une mesure par image affichée (requestAnimationFrame) : pas de recalcul forcé de la page à chaque défilement.
      var reliefEnAttente = false;
      var auDefilement = function () {
        reliefEnAttente = false;
        var b = relief.getBoundingClientRect();
        var p = Math.max(-1, Math.min(1, (b.top + b.height / 2 - window.innerHeight / 2) / window.innerHeight));
        incliner(p * 12, p * -6);
      };
      window.addEventListener('scroll', function () {
        if (!reliefEnAttente) { reliefEnAttente = true; requestAnimationFrame(auDefilement); }
      }, { passive: true });
      requestAnimationFrame(auDefilement);
    }
  }

  // Simulateur de recettes : clients par jour × prix moyen × jours d'ouverture, avec un montant qui défile.
  var sim = document.getElementById('simulateur');
  if (sim) {
    sim.addEventListener('submit', function (e) { e.preventDefault(); }); // calcul en direct, rien à envoyer
    var champClients = sim.querySelector('#sim-clients'), champPrix = sim.querySelector('#sim-prix'), champJours = sim.querySelector('#sim-jours');
    var montant = sim.querySelector('.simulateur__montant'), lienSim = sim.querySelector('[data-action="sim-whatsapp"]');
    var affiche = 0, animation = null;
    var format = function (n) { return Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' F CFA'; };
    var calculer = function () {
      var clients = +champClients.value, prix = +champPrix.value, jours = +champJours.value, total = clients * prix * jours;
      sim.querySelector('[data-valeur="clients"]').textContent = clients;
      sim.querySelector('[data-valeur="jours"]').textContent = jours;
      lienSim.href = 'https://wa.me/22793191920?text=' + encodeURIComponent('Bonjour NICRESI, je pense ouvrir une Wi-Fi zone : environ ' + clients +
        ' clients par jour, cartes à ' + prix + ' F, ' + jours + ' jours par mois (estimation ' + format(total) + ' par mois). Pouvez-vous étudier mon projet ?');
      cancelAnimationFrame(animation);
      if (reduireMouvements) { affiche = total; montant.textContent = format(total); return; }
      var depart = affiche, t0 = null;
      (function pas(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 400);
        affiche = depart + (total - depart) * (1 - Math.pow(1 - p, 3));
        montant.textContent = format(affiche);
        if (p < 1) animation = requestAnimationFrame(pas);
      })(performance.now());
    };
    [champClients, champPrix, champJours].forEach(function (c) { c.addEventListener('input', calculer); });
    sim.hidden = false;
    calculer();
  }

  // Calculateur solaire : énergie par jour = somme (puissance × nombre × heures).
  // Hypothèses volontairement prudentes, à ajuster ici si NICRESI change de matériel de référence.
  var CALCUL_SOLAIRE = { soleil: 5.5, rendement: 0.75, panneau: 400, decharge: 0.8, rendementBatterie: 0.9, marge: 1.25,
    onduleurs: [1, 1.5, 2, 3, 5, 8, 10] };
  var solaire = document.getElementById('calcul-solaire');
  if (solaire) {
    solaire.addEventListener('submit', function (e) { e.preventDefault(); });
    var lignes = solaire.querySelectorAll('.solaire__appareils li');
    var sortie = function (n) { return solaire.querySelector('[data-sortie="' + n + '"]'); };
    var virgule = function (n, d) { return n.toFixed(d).replace('.', ','); };
    var lienSolaire = solaire.querySelector('[data-action="solaire-whatsapp"]'), jauge = solaire.querySelector('.solaire__jauge span');
    var calculerSolaire = function () {
      var energie = 0, pointe = 0, liste = [];
      lignes.forEach(function (li) {
        var p = +li.dataset.puissance;
        var champN = li.querySelector('[data-champ="nombre"]'), champH = li.querySelector('[data-champ="heures"]');
        var n = Math.max(0, Math.min(99, Math.round(+champN.value || 0))), h = Math.max(0, Math.min(24, +champH.value || 0));
        energie += p * n * h; pointe += p * n * (+li.dataset.demarrage || 1);
        if (n > 0 && h > 0) liste.push(n + ' × ' + li.querySelector('.solaire__nom').firstChild.textContent.trim() + ' (' + h + ' h/j)');
      });
      var C = CALCUL_SOLAIRE, kwh = energie / 1000;
      var crete = energie / (C.soleil * C.rendement);
      var panneaux = energie > 0 ? Math.max(1, Math.ceil(crete / C.panneau)) : 0;
      var batterie = energie > 0 ? Math.ceil(energie / (C.decharge * C.rendementBatterie) / 500) * 0.5 : 0;
      var besoinOnduleur = pointe * C.marge / 1000, onduleur = null;
      for (var i = 0; i < C.onduleurs.length; i++) if (C.onduleurs[i] >= besoinOnduleur) { onduleur = C.onduleurs[i]; break; }
      sortie('conso').textContent = virgule(kwh, 1) + ' kWh';
      var texteCrete = virgule(panneaux * C.panneau / 1000, 1) + ' kWc';
      sortie('panneaux').textContent = panneaux ? panneaux + ' × ' + C.panneau + ' W' : '—';
      if (panneaux) { var petit = document.createElement('small'); petit.textContent = ' ' + texteCrete; sortie('panneaux').appendChild(petit); }
      sortie('batterie').textContent = batterie ? virgule(batterie, batterie % 1 ? 1 : 0) + ' kWh (lithium)' : '—';
      sortie('onduleur').textContent = pointe === 0 ? '—' : onduleur ? virgule(onduleur, onduleur % 1 ? 1 : 0) + ' kVA' : 'plus de 10 kVA, sur étude';
      jauge.style.width = Math.min(100, Math.max(4, kwh / 15 * 100)) + '%';
      lienSolaire.href = 'https://wa.me/22793191920?text=' + encodeURIComponent('Bonjour NICRESI, je voudrais un devis solaire. Mes appareils : ' +
        (liste.join(', ') || 'à préciser') + '. Estimation du site : ' + virgule(kwh, 1) + ' kWh par jour, panneaux ' + (panneaux ? panneaux + ' × ' + C.panneau + ' W (' + texteCrete + ')' : 'aucun') +
        ', batterie ' + sortie('batterie').textContent + ', onduleur ' + sortie('onduleur').textContent + '.');
    };
    solaire.addEventListener('input', calculerSolaire);
    solaire.hidden = false;
    calculerSolaire();
  }

  // Démo cliquable de NICRESI Control : choisir un forfait et un nombre de pages, puis « créer » des cartes d'exemple.
  var demo = document.getElementById('demo-ncc');
  if (demo) {
    var CARTES_PAR_PAGE = 40, pages = 1;
    var forfaits = demo.querySelectorAll('.demo-ncc__forfaits button');
    var sortieQuantite = demo.querySelector('.demo-ncc__quantite output');
    var etapesDemo = demo.querySelectorAll('.demo-ncc__etape');
    var choisi = function () { return demo.querySelector('.demo-ncc__forfaits [aria-pressed="true"]'); };
    var majQuantite = function () { sortieQuantite.textContent = pages + (pages > 1 ? ' pages · ' : ' page · ') + (pages * CARTES_PAR_PAGE) + ' cartes'; };
    forfaits.forEach(function (b) {
      b.addEventListener('click', function () { forfaits.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
    });
    demo.querySelectorAll('[data-pas]').forEach(function (b) {
      b.addEventListener('click', function () { pages = Math.min(10, Math.max(1, pages + (+b.dataset.pas))); majQuantite(); });
    });
    demo.querySelector('.demo-ncc__creer').addEventListener('click', function () {
      var f = choisi(), nombre = pages * CARTES_PAR_PAGE, prix = +f.dataset.prix;
      demo.querySelector('.demo-ncc__resume').textContent = nombre + ' cartes de ' + f.dataset.duree + ' à ' + prix + ' F, soit ' +
        (nombre * prix).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' F de ventes possibles.';
      var liste = demo.querySelector('.demo-ncc__cartes'); liste.innerHTML = '';
      for (var i = 0; i < 6; i++) {
        var li = document.createElement('li'), code = String(Math.floor(100000 + Math.random() * 900000));
        li.style.setProperty('--delai', (i * 80) + 'ms');
        li.innerHTML = '<strong>' + code + '</strong>' + f.dataset.duree;
        liste.appendChild(li);
      }
      demo.querySelector('.demo-ncc__note').textContent = '';
      etapesDemo[0].hidden = true; etapesDemo[1].hidden = false;
      etapesDemo[1].querySelector('[tabindex="-1"]').focus({ preventScroll: true });
    });
    demo.querySelector('.demo-ncc__imprimer').addEventListener('click', function () {
      demo.querySelector('.demo-ncc__note').textContent = 'Dans NICRESI Control, un fichier prêt à imprimer se télécharge ici. Ensuite, il suffit de découper les cartes.';
    });
    demo.querySelector('.demo-ncc__recommencer').addEventListener('click', function () {
      etapesDemo[1].hidden = true; etapesDemo[0].hidden = false; forfaits[2].focus();
    });
    majQuantite();
    demo.hidden = false;
  }

  // Barre de lecture et bouton « retour en haut ».
  var barreLecture = document.querySelector('.lecture span'), boutonHaut = document.querySelector('.haut');
  if (barreLecture || boutonHaut) {
    var enAttente = false;
    var majDefilement = function () {
      enAttente = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (barreLecture) barreLecture.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      if (boutonHaut) boutonHaut.hidden = window.scrollY < window.innerHeight;
    };
    window.addEventListener('scroll', function () { if (!enAttente) { enAttente = true; requestAnimationFrame(majDefilement); } }, { passive: true });
    majDefilement();
  }

  // Écrans d'appareils qui défilent seulement quand ils sont visibles.
  if ('IntersectionObserver' in window) {
    var observateurAppareils = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { e.target.classList.toggle('en-vue', e.isIntersecting); });
    }, { threshold: 0.3 });
    document.querySelectorAll('.pc__vue, .tel__vue').forEach(function (v) { observateurAppareils.observe(v); });
  }

  // Apparition au défilement : titres, textes, cartes et photos glissent à leur place quand ils arrivent à l'écran,
  // en descendant comme en remontant, et repartent quand ils en sortent. Rien n'est caché sans JavaScript
  // ni avec « réduire les animations ».
  if (!reduireMouvements && 'IntersectionObserver' in window) {
    var cibles = [
      ['#solutions .surtitre, #solutions h2, #realisations .surtitre, #realisations h2, #realisations .section__intro, .filtres', 'bas'],
      ['.porte-accueil, .quiz, .simulateur, .realisation, .methode, .liste-douce li, .faq details, #questions .surtitre, #questions h2', 'bas'],
      ['.control__grille > div:first-child > *, .demo-ncc', 'bas'],
      ['#methode .surtitre, #methode h2, #methode .section__intro, .scene', 'bas'],
      ['#formation .deux-colonnes > div > *', 'gauche'],
      ['.apropos__logo, .illus', 'gauche'],
      ['#a-propos .apropos > div > *, #contact .conteneur > * > *', 'bas']
    ];
    var vus = [];
    cibles.forEach(function (c) {
      document.querySelectorAll(c[0]).forEach(function (el) {
        if (vus.indexOf(el) !== -1 || el.closest('.accueil')) return;
        vus.push(el);
        el.classList.add('apparait', 'apparait--' + c[1]);
        // Léger décalage entre éléments voisins (cartes d'une même rangée, étapes d'une liste).
        var rang = Array.prototype.indexOf.call(el.parentElement.children, el) % 4;
        el.style.setProperty('--delai', (rang * 90) + 'ms');
      });
    });
    var observateurApparition = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          el.classList.add('apparait--visible');
        } else {
          el.classList.remove('apparait--visible');
          // Sorti par le haut : il reviendra depuis le haut quand on remonte.
          el.classList.toggle('apparait--au-dessus', e.boundingClientRect.top < 0);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    vus.forEach(function (el) { observateurApparition.observe(el); });
  }

  // Bouton WhatsApp flottant : discret quand les boutons de contact de l'accueil ou le formulaire sont visibles,
  // pour ne jamais recouvrir un autre bouton ni un message.
  var flottant = document.querySelector('.whatsapp');
  var zonesContact = document.querySelectorAll('.actions--accueil, #contact');
  if (flottant && zonesContact.length && 'IntersectionObserver' in window) {
    var enVue = new Map();
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { enVue.set(e.target, e.isIntersecting); });
      flottant.classList.toggle('discret', Array.from(enVue.values()).some(Boolean));
    });
    zonesContact.forEach(function (z) { observateur.observe(z); });
  }

  // Filtres des réalisations. Une catégorie sans réalisation publiée affiche un message, jamais une zone vide.
  var filtres = document.querySelector('.filtres');
  if (filtres) {
    var cartes = document.querySelectorAll('.realisation');
    var vide = document.querySelector('.realisations__vide');
    // N'afficher que les filtres qui ont au moins une réalisation publiée.
    filtres.querySelectorAll('.filtre').forEach(function (f) {
      if (f.dataset.filtre === 'tout') return;
      f.hidden = !document.querySelector('.realisation[data-categorie="' + f.dataset.filtre + '"]');
    });
    filtres.hidden = false;
    filtres.addEventListener('click', function (e) {
      var b = e.target.closest('.filtre');
      if (!b) return;
      filtres.querySelectorAll('.filtre').forEach(function (f) {
        f.classList.toggle('actif', f === b);
        f.setAttribute('aria-pressed', f === b ? 'true' : 'false');
      });
      var visibles = 0;
      cartes.forEach(function (c) {
        c.hidden = b.dataset.filtre !== 'tout' && c.dataset.categorie !== b.dataset.filtre;
        if (!c.hidden) visibles++;
      });
      if (vide) vide.hidden = visibles > 0;
    });
  }

  // Boutons qui préremplissent le service demandé (et repassent la demande en « nouveau projet »).
  document.querySelectorAll('[data-service]').forEach(function (lien) {
    lien.addEventListener('click', function () {
      var choix = document.getElementById('f-service');
      if (choix) choix.value = lien.dataset.service;
      var projet = document.querySelector('#formulaire-contact input[name="type"]');
      if (projet) projet.checked = true;
    });
  });

  // Formulaire de contact.
  // - data-endpoint vide : la demande est préparée dans WhatsApp ; le visiteur appuie sur « Envoyer » dans WhatsApp.
  //   Le bouton et la phrase au-dessus l'annoncent avant le clic ; copie, e-mail et appel restent proposés ensuite.
  // - data-endpoint renseigné : envoi direct (JSON). La confirmation ne s'affiche que si le service répond « OK ».
  var form = document.getElementById('formulaire-contact');
  var arriveeFormulaire = Date.now();
  if (form) {
    var message = form.querySelector('.formulaire__message');
    var envoyer = form.querySelector('button[type="submit"]');
    var annonce = document.getElementById('annonce-whatsapp');
    var repli = form.querySelector('.formulaire__repli');
    var copie = form.querySelector('.formulaire__copie');
    var lienEmail = form.querySelector('[data-action="email"]');
    var WHATSAPP = '22793191920';
    var EMAIL = 'servicenicresi@gmail.com';
    var endpoint = form.dataset.endpoint;

    if (endpoint) {
      envoyer.textContent = 'Envoyer ma demande';
      envoyer.removeAttribute('aria-describedby');
      annonce.hidden = true;
    }

    function afficherMessage(texte, type) {
      message.textContent = texte;
      message.className = 'formulaire__message ' + (type || '');
    }

    // Autres moyens d'envoi : le texte de la demande est prêt à copier ou à envoyer par e-mail.
    function proposerRepli(texte, sujet) {
      copie.value = texte;
      copie.hidden = true;
      lienEmail.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(texte);
      repli.hidden = false;
    }
    form.querySelector('[data-action="copier"]').addEventListener('click', function () {
      var bouton = this;
      function selectionner() {
        copie.hidden = false;
        copie.focus();
        copie.select();
        afficherMessage('Sélectionnez le texte ci-dessous, copiez-le, puis collez-le dans un message au +227 93 19 19 20 ou à ' + EMAIL + '.', 'info');
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copie.value).then(function () {
          bouton.textContent = 'Demande copiée';
          afficherMessage('Votre demande est copiée : collez-la dans un SMS, un e-mail ou WhatsApp au +227 93 19 19 20.', 'info');
        }, selectionner);
      } else {
        selectionner();
      }
    });

    // Règles de chaque champ : un message précis s'affiche sous le champ concerné.
    var regles = {
      nom: function (v) { return v.length >= 2 ? '' : 'Indiquez votre nom.'; },
      telephone: function (v) {
        var chiffres = v.replace(/\D/g, '').length;
        return /^[0-9+().\s-]+$/.test(v) && chiffres >= 8 && chiffres <= 15 ? '' :
          'Indiquez un numéro de téléphone valide (8 chiffres au moins), par exemple +227 90 00 00 00.';
      },
      service: function (v) { return v ? '' : 'Choisissez le service qui vous intéresse.'; },
      besoin: function (v) { return v.length >= 10 ? '' : 'Décrivez votre besoin en quelques mots (10 caractères au moins).'; }
    };
    function verifier(nom) {
      var c = form.elements[nom];
      var erreur = regles[nom](c.value.trim());
      var zone = document.getElementById('e-' + nom);
      c.setAttribute('aria-invalid', erreur ? 'true' : 'false');
      if (zone) { zone.textContent = erreur; zone.hidden = !erreur; }
      return erreur;
    }
    Object.keys(regles).forEach(function (nom) {
      // Une fois signalé, le champ se corrige pendant la saisie.
      form.elements[nom].addEventListener('input', function () {
        if (this.getAttribute('aria-invalid') === 'true') verifier(nom);
      });
      form.elements[nom].addEventListener('change', function () {
        if (this.getAttribute('aria-invalid') === 'true') verifier(nom);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var premier = null;
      Object.keys(regles).forEach(function (nom) {
        if (verifier(nom) && !premier) premier = form.elements[nom];
      });
      if (premier) {
        afficherMessage('Vérifiez les champs signalés ci-dessus.', 'erreur');
        premier.focus();
        return;
      }
      // Robot détecté (champ piège rempli) : on n'envoie rien et on ne confirme rien.
      if (form.elements.site_web.value) return;
      // Anti-spam sans captcha : un envoi moins de 3 secondes après l'arrivée sur la page,
      // ou un message rempli de liens, n'est pas celui d'une personne.
      var besoinTexte = form.elements.besoin.value;
      if (Date.now() - arriveeFormulaire < 3000 || (besoinTexte.match(/https?:\/\/|www\./gi) || []).length > 2) {
        afficherMessage('Votre demande n\'a pas pu être préparée. Relisez-la puis réessayez, ou écrivez-nous directement sur WhatsApp.', 'erreur');
        return;
      }

      var type = form.querySelector('input[name="type"]:checked');
      var donnees = {
        type: type ? type.value : 'Nouveau projet ou devis',
        nom: form.elements.nom.value.trim(),
        telephone: form.elements.telephone.value.trim(),
        service: form.elements.service.value,
        besoin: form.elements.besoin.value.trim()
      };
      var sujet = (donnees.type === 'Assistance sur une installation existante' ? 'Assistance' : 'Demande') +
        ' depuis nicresi.com : ' + donnees.service;
      var texte = 'Bonjour NICRESI,\n\nType de demande : ' + donnees.type + '\nNom : ' + donnees.nom +
        '\nTéléphone : ' + donnees.telephone + '\nService : ' + donnees.service + '\n\n' + donnees.besoin;

      if (!endpoint) {
        proposerRepli(texte, sujet);
        var lien = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texte);
        // Si le navigateur bloque la nouvelle fenêtre, WhatsApp s'ouvre dans la page.
        // (Pas d'option « noopener » : avec elle, window.open renvoie toujours null.)
        var fenetre = window.open(lien, '_blank');
        if (fenetre) fenetre.opener = null; else window.location.href = lien;
        // Le site ne peut pas savoir si le message est parti : il ne confirme donc pas l'envoi.
        afficherMessage('Votre demande est prête dans WhatsApp : appuyez sur « Envoyer » pour nous la transmettre.', 'info');
        return;
      }

      envoyer.disabled = true;
      repli.hidden = true;
      afficherMessage('Envoi en cours…');
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.assign({ _subject: sujet }, donnees))
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        afficherMessage('Merci, votre demande a bien été envoyée. Nous vous recontactons rapidement.', 'ok');
      }).catch(function () {
        afficherMessage('L\'envoi a échoué : votre demande ne nous est pas parvenue. Utilisez un des moyens ci-dessous.', 'erreur');
        proposerRepli(texte, sujet);
      }).then(function () { envoyer.disabled = false; });
    });
  }

  // Mesure d'audience sans cookie (Cloudflare Web Analytics) : inactive tant que le jeton est vide.
  // Pour l'activer, coller ici le jeton fourni par Cloudflare, puis mettre à jour la page Confidentialité.
  var MESURE_AUDIENCE = '';
  if (MESURE_AUDIENCE && location.hostname === 'nicresi.com') {
    var balise = document.createElement('script');
    balise.defer = true;
    balise.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    balise.setAttribute('data-cf-beacon', JSON.stringify({ token: MESURE_AUDIENCE }));
    document.body.appendChild(balise);
  }
})();
