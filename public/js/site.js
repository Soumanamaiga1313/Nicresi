// Menu sur téléphone : ouverture, fermeture après un choix, année du pied de page.
(function () {
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
})();
