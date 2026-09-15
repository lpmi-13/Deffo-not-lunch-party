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
const moves = ['is-dodging', 'is-spinning', 'is-jumping', 'is-wobbling', 'is-shrinking'];
let recentTaps = [];
let speechTimer;
let finaleTimer;

function chooseMove() {
  return moves[Math.floor(Math.random() * moves.length)];
}

function launchCardStorm() {
  document.querySelector('.card-storm')?.remove();
  const storm = document.createElement('div');
  storm.className = 'card-storm';
  storm.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < 32; index += 1) {
    const card = document.createElement('i');
    card.textContent = ['VISA', 'MC', '101', 'BEEP'][index % 4];
    card.style.setProperty('--x', `${Math.random() * 100}vw`);
    card.style.setProperty('--delay', `${Math.random() * 0.7}s`);
    card.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
    storm.append(card);
  }

  document.body.append(storm);
  document.querySelector('.lars-stage').classList.add('is-amazing');
  speech.textContent = 'TRANSACTION APPROVED. REALITY DECLINED.';
  recentTaps = [];
  window.clearTimeout(finaleTimer);
  finaleTimer = window.setTimeout(() => {
    storm.remove();
    document.querySelector('.lars-stage').classList.remove('is-amazing');
  }, 4200);
}

function avoidConversation() {
  const now = Date.now();
  recentTaps = recentTaps.filter((tapTime) => now - tapTime < 1800);
  recentTaps.push(now);

  lars.classList.remove(...moves);
  void lars.offsetWidth;
  lars.classList.add(chooseMove());
  speech.textContent = excuses[Math.floor(Math.random() * excuses.length)].replace('\n', ' ');
  speech.classList.add('show');
  window.clearTimeout(speechTimer);
  speechTimer = window.setTimeout(() => speech.classList.remove('show'), 1800);

  if (recentTaps.length >= 5) {
    launchCardStorm();
  }
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
