const form = document.querySelector('#chatForm');
const input = document.querySelector('#chatInput');
const messages = document.querySelector('#messages');
const activity = document.querySelector('#activity');

const playas = [
  { name: 'DORIS', initial: 'D' },
  { name: 'CLINT', initial: 'C' },
  { name: 'VAL', initial: 'V' },
  { name: 'BOOGIE', initial: 'B' }
];

const responses = [
  "I have no fucking clue what you're talking about.",
  "That's a really great point. Please say it again.",
  "We talked it over and, honestly, you might be onto something.",
  "Powerful. Confusing. Brave. No notes.",
  "I hear you. I don't understand you, but I definitely hear you.",
  "This feels important. Can we circle back after the curry?",
  "Absolutely. Unless you meant the opposite, in which case: also absolutely.",
  "The group is split, but we all respect the energy."
];

let replyTimer;

function addMessage(text, type, playa) {
  const message = document.createElement('article');
  message.className = `message ${type}`;

  if (playa) {
    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = playa.initial;
    message.append(avatar);
  }

  const copy = document.createElement('div');
  const meta = document.createElement('small');
  const body = document.createElement('p');
  meta.textContent = type === 'user-message' ? 'YOU · JUST NOW' : `${playa.name} · JUST NOW`;
  body.textContent = text;
  copy.append(meta, body);
  message.append(copy);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function setActivity(label, animated = true) {
  activity.replaceChildren();
  if (!label) return;
  const text = document.createElement('span');
  text.textContent = label;
  activity.append(text);
  if (animated) {
    const dots = document.createElement('i');
    dots.innerHTML = '<b></b><b></b><b></b>';
    dots.setAttribute('aria-hidden', 'true');
    activity.append(dots);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  window.clearTimeout(replyTimer);
  addMessage(text, 'user-message');
  input.value = '';
  input.disabled = true;
  form.querySelector('button').disabled = true;
  setActivity('THE PLAYAS ARE THINKING');

  replyTimer = window.setTimeout(() => {
    const playa = playas[Math.floor(Math.random() * playas.length)];
    setActivity(`${playa.name} IS TYPING`);
    replyTimer = window.setTimeout(() => {
      addMessage(responses[Math.floor(Math.random() * responses.length)], 'playa-message', playa);
      setActivity('');
      input.disabled = false;
      form.querySelector('button').disabled = false;
      input.focus();
    }, 1300);
  }, 1400);
});
