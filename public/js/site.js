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
      3: '<strong>L\'intégration.</strong> Nos techniciens installent le matériel, l\'antenne et les panneaux solaires, relient les bâtiments et mettent les outils en service.',
      4: '<strong>L\'utilisation.</strong> Le commerçant gère ses ventes avec son logiciel, le bureau travaille sur ses ordinateurs, le propriétaire suit son activité depuis son téléphone.',
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
      // Robot détecté : on n'envoie rien et on ne confirme rien.
      if (form.elements.site_web.value) return;

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
})();
