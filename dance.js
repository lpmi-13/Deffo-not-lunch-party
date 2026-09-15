const video = document.querySelector('#camera');
const canvas = document.querySelector('#poseCanvas');
const context = canvas.getContext('2d');
const startButton = document.querySelector('#startDance');
const terminal = document.querySelector('#danceTerminal');
const viewport = document.querySelector('#viewport');
const scoreOutput = document.querySelector('#score');
const ratingOutput = document.querySelector('#rating');
const meterFill = document.querySelector('#meterFill');
const timeOutput = document.querySelector('#danceTime');
const motionOutput = document.querySelector('#motionSignal');
const errorOutput = document.querySelector('#cameraError');
const statusOutput = document.querySelector('#systemStatus');
const effects = document.querySelector('#effects');
const menuToggle = document.querySelector('.menu-toggle');

let detector;
let stream;
let previousPoints;
let smoothedScore = 0;
let activeSeconds = 0;
let previousFrameTime = 0;
let effectCooldown = 0;
let finaleStarted = false;
let movementGrace = 0;
const motionCanvas = document.createElement('canvas');
const motionContext = motionCanvas.getContext('2d', {willReadFrequently:true});
let previousPixels;

menuToggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});

function setScore(value) {
  const score = Math.max(0, Math.min(100, Math.round(value)));
  scoreOutput.textContent = String(score).padStart(2, '0');
  meterFill.style.width = `${score}%`;
  if (score >= 88) ratingOutput.innerHTML = 'BEST DANCE<br>IN THIS POSTCODE';
  else if (score >= 70) ratingOutput.innerHTML = 'SUPER<br>GOOD';
  else if (score >= 45) ratingOutput.innerHTML = 'REALLY<br>GOOD';
  else if (score >= 20) ratingOutput.innerHTML = 'PROMISING<br>WIGGLES';
  else ratingOutput.innerHTML = 'MORE LIMBS,<br>PLEASE';
}

function launchEffect(type, falling = Math.random() < .42) {
  const item = document.createElement('i');
  item.className = `effect ${type}${falling ? ' falling' : ''}`;
  item.textContent = type === 'diamond' ? '◆' : type === 'star' ? '★' : '♥';
  if (falling) {
    item.style.left = `${Math.random() < .5 ? 1 + Math.random() * 17 : 78 + Math.random() * 17}%`;
    item.style.setProperty('--x', `${-35 + Math.random() * 70}px`);
  } else {
    const angle = Math.random() * Math.PI * 2;
    const distance = 190 + Math.random() * 290;
    item.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
    item.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
  }
  item.style.setProperty('--spin', `${-300 + Math.random() * 600}deg`);
  item.style.animationDelay = `${Math.random() * .1}s`;
  effects.append(item);
  window.setTimeout(() => item.remove(), 2800);
}

function launchBurst(count, diamonds = false) {
  for (let index = 0; index < count; index += 1) {
    window.setTimeout(() => launchEffect(diamonds && index % 3 === 0 ? 'diamond' : 'heart'), index * 65);
  }
}

function drawPose(keypoints) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f3b91f';
  context.strokeStyle = '#f2e8d2';
  context.lineWidth = Math.max(3, canvas.width / 220);
  const links = [[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]];
  links.forEach(([a,b]) => {
    if ((keypoints[a].score || 0) > .3 && (keypoints[b].score || 0) > .3) {
      context.beginPath();context.moveTo(keypoints[a].x,keypoints[a].y);context.lineTo(keypoints[b].x,keypoints[b].y);context.stroke();
    }
  });
  keypoints.forEach((point) => { if ((point.score || 0) > .3) { context.beginPath();context.arc(point.x,point.y,5,0,Math.PI*2);context.fill(); } });
}

function calculateMotion(points) {
  if (!previousPoints) { previousPoints = points; return 0; }
  const visible = points.map((point,index) => ({point,previous:previousPoints[index]})).filter(({point,previous}) => (point.score || 0) > .35 && (previous?.score || 0) > .35);
  previousPoints = points;
  if (!visible.length) return 0;
  const travel = visible.reduce((sum,{point,previous}) => sum + Math.hypot(point.x-previous.x,point.y-previous.y),0) / visible.length;
  const xs = visible.map(({point}) => point.x);
  const ys = visible.map(({point}) => point.y);
  const bodySize = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 80);
  return Math.min(100, travel / bodySize * 900);
}

function calculateCameraMotion() {
  const width = 64;
  const height = 40;
  if (motionCanvas.width !== width) {
    motionCanvas.width = width;
    motionCanvas.height = height;
  }
  motionContext.drawImage(video, 0, 0, width, height);
  const pixels = motionContext.getImageData(0, 0, width, height).data;
  if (!previousPixels) {
    previousPixels = new Uint8ClampedArray(pixels);
    return 0;
  }
  let changed = 0;
  for (let index = 0; index < pixels.length; index += 16) {
    const difference = Math.abs(pixels[index] - previousPixels[index]) + Math.abs(pixels[index + 1] - previousPixels[index + 1]) + Math.abs(pixels[index + 2] - previousPixels[index + 2]);
    if (difference > 32) changed += Math.min(difference / 90, 3);
  }
  previousPixels.set(pixels);
  return Math.min(100, changed / (pixels.length / 16) * 115);
}

async function analyseFrame(timestamp) {
  if (!detector || video.readyState < 2) { requestAnimationFrame(analyseFrame); return; }
  const poses = await detector.estimatePoses(video, {maxPoses:1, flipHorizontal:false});
  const elapsed = previousFrameTime ? Math.min((timestamp-previousFrameTime)/1000,.2) : 0;
  previousFrameTime = timestamp;
  const cameraMovement = calculateCameraMotion();
  if (poses[0]) {
    drawPose(poses[0].keypoints);
    const movement = Math.max(calculateMotion(poses[0].keypoints), cameraMovement);
    smoothedScore = smoothedScore * .86 + movement * .14;
    const displayScore = Math.min(100, smoothedScore * 1.7);
    setScore(displayScore);
    motionOutput.textContent = movement > 35 ? 'CHAOTIC' : movement > 16 ? 'STRONG' : movement > 5 ? 'DETECTED' : 'SUBTLE';
    if (movement > 1.1) movementGrace = .9;
    else movementGrace = Math.max(0, movementGrace - elapsed);
    viewport.classList.toggle('is-dancing', movementGrace > 0);
    if (movementGrace > 0) activeSeconds += elapsed;
    timeOutput.textContent = `${activeSeconds.toFixed(1).padStart(4,'0')}s`;
    effectCooldown -= elapsed;
    viewport.classList.toggle('is-hot', displayScore >= 58);
    if (movementGrace > 0 && effectCooldown <= 0) {
      const iconPool = displayScore >= 55 ? ['heart','diamond','star'] : ['heart','heart','star'];
      const amount = displayScore >= 70 ? 4 : displayScore >= 40 ? 3 : 2;
      for (let index = 0; index < amount; index += 1) launchEffect(iconPool[Math.floor(Math.random() * iconPool.length)]);
      effectCooldown = displayScore >= 70 ? .08 : displayScore >= 40 ? .12 : .18;
    }
  } else {
    movementGrace = cameraMovement > 1.1 ? .9 : Math.max(0, movementGrace - elapsed);
    viewport.classList.toggle('is-dancing', movementGrace > 0);
    if (movementGrace > 0) {
      activeSeconds += elapsed;
      effectCooldown -= elapsed;
      motionOutput.textContent = cameraMovement > 20 ? 'CHAOTIC' : cameraMovement > 7 ? 'STRONG' : 'DETECTED';
      if (effectCooldown <= 0) {
        launchEffect(['heart','diamond','star'][Math.floor(Math.random() * 3)]);
        launchEffect(Math.random() > .5 ? 'heart' : 'star');
        effectCooldown = .16;
      }
    }
    timeOutput.textContent = `${activeSeconds.toFixed(1).padStart(4,'0')}s`;
  }
  if (activeSeconds >= 10 && !finaleStarted) {
    finaleStarted = true;
    viewport.classList.add('is-finale');
    setScore(100);
    statusOutput.textContent = 'DANCE TERMINAL ON FIRE';
    launchBurst(24, true);
  }
  requestAnimationFrame(analyseFrame);
}

async function startCamera() {
  startButton.disabled = true;
  errorOutput.textContent = '';
  statusOutput.textContent = 'LOADING MOVE ANALYST…';
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported by this browser.');
    if (!window.poseDetection || !window.tf) throw new Error('The dance brain could not load. Check your connection and try again.');
    await tf.setBackend('webgl');
    await tf.ready();
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {modelType:poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING});
    stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}});
    video.srcObject = stream;
    await video.play();
    terminal.classList.add('is-running');
    startButton.querySelector('span').textContent = 'CAMERA IS LIVE';
    startButton.querySelector('small').textContent = 'GIVE IT EVERYTHING';
    statusOutput.textContent = 'ANALYSING MOVES LOCALLY';
    requestAnimationFrame(analyseFrame);
  } catch (error) {
    errorOutput.textContent = `${error.message} Please allow camera access and try again.`;
    statusOutput.textContent = 'CAMERA NEEDS ATTENTION';
    startButton.disabled = false;
  }
}

startButton.addEventListener('click', startCamera);
window.addEventListener('pagehide', () => stream?.getTracks().forEach((track) => track.stop()));
