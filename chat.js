const form = document.querySelector('#chatForm');
const input = document.querySelector('#chatInput');
const messages = document.querySelector('#messages');
const activity = document.querySelector('#activity');
const micButton = document.querySelector('#micButton');
const sendButton = document.querySelector('#sendButton');
const voiceStatus = document.querySelector('#voiceStatus');

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
let recognition;
let isListening = false;
let voiceBaseText = '';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function setListening(listening) {
  isListening = listening;
  micButton.classList.toggle('is-listening', listening);
  micButton.setAttribute('aria-pressed', String(listening));
  micButton.setAttribute('aria-label', listening ? 'Stop voice input' : 'Start voice input');
  micButton.title = listening ? 'Stop voice input' : 'Start voice input';
}

function stopListening() {
  if (recognition && isListening) recognition.stop();
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = document.documentElement.lang || 'en';

  recognition.addEventListener('start', () => {
    setListening(true);
    voiceStatus.textContent = 'LISTENING… TAP THE MIC WHEN YOU’RE DONE.';
  });

  recognition.addEventListener('result', (event) => {
    let transcript = '';
    for (let index = 0; index < event.results.length; index += 1) {
      transcript += event.results[index][0].transcript;
    }
    const separator = voiceBaseText && transcript ? ' ' : '';
    input.value = `${voiceBaseText}${separator}${transcript}`.slice(0, input.maxLength);
  });

  recognition.addEventListener('end', () => {
    setListening(false);
    if (voiceStatus.textContent.startsWith('LISTENING')) {
      voiceStatus.textContent = input.value.trim()
        ? 'VOICE CAPTURED. EDIT IT OR HIT SEND.'
        : 'NO SPEECH HEARD. TAP THE MIC TO TRY AGAIN.';
    }
  });

  recognition.addEventListener('error', (event) => {
    setListening(false);
    const messagesByError = {
      'not-allowed': 'MICROPHONE ACCESS WAS BLOCKED. ENABLE IT IN YOUR BROWSER SETTINGS.',
      'service-not-allowed': 'VOICE INPUT ISN’T AVAILABLE IN THIS BROWSER.',
      'audio-capture': 'NO MICROPHONE WAS FOUND.',
      'no-speech': 'NO SPEECH HEARD. TAP THE MIC TO TRY AGAIN.'
    };
    voiceStatus.textContent = messagesByError[event.error] || 'VOICE INPUT STOPPED. TAP THE MIC TO TRY AGAIN.';
  });

  micButton.addEventListener('click', () => {
    if (isListening) {
      stopListening();
      return;
    }

    voiceBaseText = input.value.trim();
    voiceStatus.textContent = 'REQUESTING MICROPHONE ACCESS…';
    try {
      recognition.start();
    } catch (error) {
      voiceStatus.textContent = 'VOICE INPUT IS ALREADY STARTING…';
    }
  });
} else {
  micButton.disabled = true;
  micButton.title = 'Voice input is not supported by this browser';
  voiceStatus.textContent = 'VOICE INPUT ISN’T SUPPORTED IN THIS BROWSER.';
}

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

  stopListening();
  window.clearTimeout(replyTimer);
  addMessage(text, 'user-message');
  input.value = '';
  input.disabled = true;
  sendButton.disabled = true;
  micButton.disabled = true;
  setActivity('THE PLAYAS ARE THINKING');

  replyTimer = window.setTimeout(() => {
    const playa = playas[Math.floor(Math.random() * playas.length)];
    setActivity(`${playa.name} IS TYPING`);
    replyTimer = window.setTimeout(() => {
      addMessage(responses[Math.floor(Math.random() * responses.length)], 'playa-message', playa);
      setActivity('');
      input.disabled = false;
      sendButton.disabled = false;
      micButton.disabled = !SpeechRecognition;
      input.focus();
    }, 1300);
  }, 1400);
});
