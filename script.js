const lars = document.querySelector('#lars');
const clickLars = document.querySelector('#clickLars');
const speech = document.querySelector('#speech');

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
