(function () {
  var scrim = document.getElementById('scrim');
  var sheet = document.getElementById('sheet');
  var more = document.getElementById('more');
  if (!scrim || !sheet || !more) return;

  function setOpen(open) {
    scrim.classList.toggle('is-open', open);
    sheet.classList.toggle('is-open', open);
    more.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  scrim.addEventListener('click', function () {
    setOpen(false);
  });
  more.addEventListener('click', function () {
    setOpen(!sheet.classList.contains('is-open'));
  });
})();
