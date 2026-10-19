// NICRESI — menu mobile, animation signature, filtres des réalisations et formulaire de contact.
(function () {
  'use strict';

  var reduireMouvements = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu sur téléphone
  var bouton = document.querySelector('.menu-bouton');
  var menu = document.getElementById('menu');
  if (bouton && menu) {
    bouton.addEventListener('click', function () {
      var ouvert = menu.classList.toggle('ouvert');
      bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('ouvert');
        bouton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var annee = document.getElementById('annee');
  if (annee) annee.textContent = new Date().getFullYear();

  // Animation signature : cinq phases, en boucle. Sans JavaScript, la scène reste complète et immobile.
  var scene = document.querySelector('.scene');
  if (scene) {
    var svg = scene.querySelector('.scene__svg');
    var legende = scene.querySelector('.scene__etape');
    var controles = scene.querySelector('.scene__controles');
    var boutonsPhase = scene.querySelectorAll('[data-phase]');
    var pause = scene.querySelector('.scene__pause');
    var textes = {
      1: '<strong>Le besoin.</strong> Une boutique, une école, un bureau : chacun cherche un logiciel, un accès à Internet ou de l\'énergie.',
      2: '<strong>La conception.</strong> Nous imaginons la solution et concevons le site, l\'application ou le logiciel sur mesure.',
      3: '<strong>L\'intégration.</strong> Nos techniciens installent l\'antenne, les panneaux solaires et relient les bâtiments.',
      4: '<strong>L\'utilisation.</strong> Le commerçant utilise son logiciel, le propriétaire suit son réseau depuis son téléphone.',
      5: '<strong>L\'accompagnement.</strong> Nous formons, conseillons et restons disponibles. Créer. Connecter. Construire.'
    };
    var phase = 1, minuteur = null, enPause = reduireMouvements;

    function afficher(n) {
      phase = n;
      for (var i = 1; i <= 5; i++) svg.classList.toggle('phase-' + i, i === n);
      svg.classList.add('scene--animee');
      legende.innerHTML = textes[n];
      boutonsPhase.forEach(function (b) {
        if (Number(b.dataset.phase) === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
    function suivante() { afficher(phase % 5 + 1); }
    function demarrer() { arreter(); minuteur = setInterval(suivante, 4200); }
    function arreter() { if (minuteur) clearInterval(minuteur); minuteur = null; }
    function majPause() {
      pause.setAttribute('aria-pressed', enPause ? 'true' : 'false');
      pause.textContent = enPause ? 'Lecture' : 'Pause';
    }

    controles.hidden = false;
    boutonsPhase.forEach(function (b) {
      b.addEventListener('click', function () {
        enPause = true; arreter(); majPause(); afficher(Number(b.dataset.phase));
      });
    });
    pause.addEventListener('click', function () {
      enPause = !enPause; majPause();
      if (enPause) arreter(); else demarrer();
    });

    // Mouvements réduits : la scène s'ouvre sur la dernière phase, sans défilement automatique.
    afficher(reduireMouvements ? 5 : 1);
    majPause();
    if (!enPause) demarrer();

    // Pas d'animation hors de l'écran (économie de batterie et de données).
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          if (!e.isIntersecting) arreter(); else if (!enPause) demarrer();
        });
      }).observe(svg);
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

  // Filtres des réalisations
  var filtres = document.querySelector('.filtres');
  if (filtres) {
    var cartes = document.querySelectorAll('.realisation');
    filtres.hidden = false;
    filtres.addEventListener('click', function (e) {
      var b = e.target.closest('.filtre');
      if (!b) return;
      filtres.querySelectorAll('.filtre').forEach(function (f) {
        f.classList.toggle('actif', f === b);
        f.setAttribute('aria-pressed', f === b ? 'true' : 'false');
      });
      cartes.forEach(function (c) {
        c.hidden = b.dataset.filtre !== 'tout' && c.dataset.categorie !== b.dataset.filtre;
      });
    });
  }

  // Boutons qui préremplissent le service demandé
  document.querySelectorAll('[data-service]').forEach(function (lien) {
    lien.addEventListener('click', function () {
      var choix = document.getElementById('f-service');
      if (choix) choix.value = lien.dataset.service;
    });
  });

  // Formulaire de contact.
  // - data-endpoint vide : la demande est préparée dans WhatsApp ; le visiteur appuie sur « Envoyer » dans WhatsApp.
  // - data-endpoint renseigné : envoi direct (JSON). La confirmation ne s'affiche que si le service répond « OK ».
  var form = document.getElementById('formulaire-contact');
  if (form) {
    var message = form.querySelector('.formulaire__message');
    var envoyer = form.querySelector('button[type="submit"]');
    var WHATSAPP = '22793191920';

    function afficherMessage(texte, type) {
      message.textContent = texte;
      message.className = 'formulaire__message ' + (type || '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var champs = ['nom', 'telephone', 'service', 'besoin'];
      var manquant = null;
      champs.forEach(function (nom) {
        var c = form.elements[nom];
        var vide = !c.value.trim();
        c.setAttribute('aria-invalid', vide ? 'true' : 'false');
        if (vide && !manquant) manquant = c;
      });
      if (manquant) {
        afficherMessage('Merci de remplir tous les champs.', 'erreur');
        manquant.focus();
        return;
      }
      // Robot détecté : on n'envoie rien et on ne confirme rien.
      if (form.elements.site_web.value) return;

      var donnees = {
        nom: form.elements.nom.value.trim(),
        telephone: form.elements.telephone.value.trim(),
        service: form.elements.service.value,
        besoin: form.elements.besoin.value.trim()
      };
      var endpoint = form.dataset.endpoint;

      if (!endpoint) {
        var texte = 'Bonjour NICRESI,\n\nNom : ' + donnees.nom + '\nTéléphone : ' + donnees.telephone +
          '\nService : ' + donnees.service + '\n\n' + donnees.besoin;
        window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texte), '_blank', 'noopener');
        afficherMessage('Votre demande est prête dans WhatsApp : appuyez sur « Envoyer » dans WhatsApp pour nous la transmettre.', 'ok');
        return;
      }

      envoyer.disabled = true;
      afficherMessage('Envoi en cours…');
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(donnees)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        afficherMessage('Merci, votre demande a bien été envoyée. Nous vous recontactons rapidement.', 'ok');
      }).catch(function () {
        afficherMessage('L\'envoi a échoué. Écrivez-nous sur WhatsApp au +227 93 19 19 20 ou à servicenicresi@gmail.com.', 'erreur');
      }).then(function () { envoyer.disabled = false; });
    });
  }
})();
