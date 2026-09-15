const lars = document.querySelector('#lars');
const clickLars = document.querySelector('#clickLars');
const speech = document.querySelector('#speech');
const menuToggle = document.querySelector('.menu-toggle');
const siteMenu = document.querySelector('.site-menu');

const excuses = [
  "PLEASE DON'T ASK\nABOUT MY WEEKEND.",
  "SORRY, I'M PROFILING\nTHIS CHUTNEY.",
  "EYE CONTACT\nISN'T IN THE DATA.",
  "MY CARD HAS\nBETTER SOCIAL SKILLS."
];
let excuse = 0;

function avoidConversation() {
  lars.classList.remove('is-avoiding');
  void lars.offsetWidth;
  lars.classList.add('is-avoiding');
  speech.textContent = excuses[excuse].replace('\n', ' ');
  speech.classList.add('show');
  excuse = (excuse + 1) % excuses.length;
  window.setTimeout(() => speech.classList.remove('show'), 1800);
}

lars.addEventListener('click', avoidConversation);
clickLars.addEventListener('click', avoidConversation);

menuToggle.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});
