import * as THREE from 'three';
import { createRunner, createWorld, ROUTE } from './world.js';
import './style.css';

const TIME_LIMIT = 40;
const RUN_SPEED = 14.6;
const STEER_SPEED = 9.3;
const JUMP_SPEED = 13.5;
const GRAVITY = 27;
const FALL_PENALTY = 2.5;

const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, .1, 700);
const world = createWorld(scene);
const runner = createRunner(scene);
const particleGeometry = new THREE.BoxGeometry(.14, .14, .14);
const particles = [];
const random = Math.random;
const cameraLook = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const desiredLook = new THREE.Vector3();

const ui = {
  timer: document.getElementById('timer'),
  timerPanel: document.getElementById('timerPanel'),
  timerFill: document.getElementById('timerFill'),
  checkpointCount: document.getElementById('checkpointCount'),
  routeTicks: document.getElementById('routeTicks'),
  resetButton: document.getElementById('resetButton'),
  jumpButton: document.getElementById('jumpButton'),
  toast: document.getElementById('toast'),
  result: document.getElementById('result'),
  resultEyebrow: document.getElementById('resultEyebrow'),
  resultTitle: document.getElementById('resultTitle'),
  resultDescription: document.getElementById('resultDescription'),
  runAgain: document.getElementById('runAgain'),
  steerLeft: document.getElementById('steerLeft'),
  steerRight: document.getElementById('steerRight'),
};

for (let i = 0; i < 7; i++) ui.routeTicks.appendChild(document.createElement('span'));
const ticks = [...ui.routeTicks.children];
const keys = new Set();
const touchSteer = { left: false, right: false };

const game = {
  status: 'running',
  x: 0,
  y: ROUTE[0].height,
  z: 20,
  vy: 0,
  grounded: true,
  roofIndex: 0,
  checkpoint: 0,
  respawn: { x: 0, y: ROUTE[0].height, z: 20, roofIndex: 0 },
  elapsed: 0,
  jumpBuffer: 0,
  coyote: 0,
  steer: 0,
  misses: 0,
};

let worldTime = 0;
let toastTime = 0;
let previousFrame = performance.now();
let debugPaused = false;

function refreshCheckpointUI() {
  ui.checkpointCount.innerHTML = `${String(game.checkpoint).padStart(2, '0')} <small>/ 07</small>`;
  ticks.forEach((tick, index) => {
    tick.classList.toggle('done', index < game.checkpoint);
    tick.classList.toggle('current', index === game.checkpoint && game.checkpoint < 7);
  });
  world.setCheckpoint(game.checkpoint);
}

function updateTimerUI() {
  const timeLeft = Math.max(0, TIME_LIMIT - game.elapsed);
  const seconds = Math.ceil(timeLeft);
  ui.timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  ui.timerFill.style.transform = `scaleX(${timeLeft / TIME_LIMIT})`;
  ui.timerPanel.classList.toggle('urgent', timeLeft <= 10 && game.status !== 'won');
}

function showToast(message, miss = false) {
  ui.toast.innerHTML = message;
  ui.toast.classList.toggle('miss', miss);
  ui.toast.classList.add('visible');
  toastTime = 2;
}

function clearToast() {
  toastTime = 0;
  ui.toast.classList.remove('visible', 'miss');
  ui.toast.textContent = '';
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 700 ? 72 : 65;
  camera.updateProjectionMatrix();
}

function updateCamera(dt, snap = false) {
  const portrait = window.innerWidth / window.innerHeight < .85;
  const side = portrait ? 2.25 : 4.0;
  const back = portrait ? 12.2 : 10.7;
  const up = portrait ? 6.5 : 5.7;
  desiredCamera.set(game.x + side, game.y + up, game.z + back);
  desiredLook.set(game.x + game.steer * .45, game.y + 1.38, game.z - (portrait ? 16 : 13));
  if (snap) {
    camera.position.copy(desiredCamera);
    cameraLook.copy(desiredLook);
  } else {
    const smooth = 1 - Math.exp(-dt * 6.5);
    camera.position.lerp(desiredCamera, smooth);
    cameraLook.lerp(desiredLook, smooth);
  }
  camera.lookAt(cameraLook);
}

function spawnParticles(x, y, z, count, colors, energy = 1) {
  for (let i = 0; i < count; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length], transparent: true, opacity: 1, depthWrite: false,
    });
    const mesh = new THREE.Mesh(particleGeometry, material);
    mesh.position.set(x + (random() - .5) * 1.6, y + random() * .5, z + (random() - .5) * 1.4);
    mesh.rotation.set(random() * 5, random() * 5, random() * 5);
    const scale = .5 + random() * 1.5;
    mesh.scale.set(scale, scale * (.6 + random()), scale);
    scene.add(mesh);
    particles.push({
      mesh,
      velocity: new THREE.Vector3((random() - .5) * 5 * energy, (2 + random() * 4) * energy, (random() - .5) * 5 * energy),
      life: .55 + random() * .45,
      maxLife: 1,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= dt;
    particle.velocity.y -= 12 * dt;
    particle.mesh.position.addScaledVector(particle.velocity, dt);
    particle.mesh.rotation.x += dt * 4;
    particle.mesh.rotation.y += dt * 3;
    particle.mesh.material.opacity = Math.max(0, particle.life / particle.maxLife);
    if (particle.life <= 0) {
      scene.remove(particle.mesh);
      particle.mesh.material.dispose();
      particles.splice(i, 1);
    }
  }
}

function resetGame() {
  game.status = 'running';
  game.x = 0;
  game.y = ROUTE[0].height;
  game.z = 20;
  game.vy = 0;
  game.grounded = true;
  game.roofIndex = 0;
  game.checkpoint = 0;
  game.respawn = { x: 0, y: ROUTE[0].height, z: 20, roofIndex: 0 };
  game.elapsed = 0;
  game.jumpBuffer = 0;
  game.coyote = 0;
  game.steer = 0;
  game.misses = 0;
  keys.clear();
  touchSteer.left = false;
  touchSteer.right = false;
  ui.result.hidden = true;
  ui.result.classList.remove('loss');
  clearToast();
  refreshCheckpointUI();
  updateTimerUI();
  runner.root.position.set(game.x, game.y, game.z);
  runner.shadow.position.set(game.x, game.y + .025, game.z);
  updateCamera(0, true);
}

function requestJump() {
  if (game.status !== 'running') {
    resetGame();
    return;
  }
  game.jumpBuffer = .17;
}

function finishRun(won) {
  game.status = won ? 'won' : 'lost';
  game.jumpBuffer = 0;
  ui.result.hidden = false;
  ui.result.classList.toggle('loss', !won);
  ui.resultEyebrow.textContent = won ? 'ALL 07 CHECKPOINTS CLEARED' : 'THE CLOCK RAN OUT';
  ui.resultTitle.textContent = won ? 'YOU OWN THE SKY.' : 'SO CLOSE. GO AGAIN.';
  ui.resultDescription.textContent = won
    ? `Billboard reached with ${Math.ceil(TIME_LIMIT - game.elapsed)} seconds to spare.`
    : 'The rooftops are ready for another run.';
  clearToast();
  if (won) spawnParticles(game.x, game.y + 3, game.z - 4, 65, ['#e7ff7a', '#ff8b71', '#ffffff', '#45d2c5'], 2.4);
  updateTimerUI();
}

function respawn() {
  game.elapsed += FALL_PENALTY;
  game.misses++;
  if (game.elapsed >= TIME_LIMIT) {
    game.elapsed = TIME_LIMIT;
    finishRun(false);
    return;
  }
  game.x = game.respawn.x;
  game.y = game.respawn.y;
  game.z = game.respawn.z;
  game.vy = 0;
  game.grounded = true;
  game.roofIndex = game.respawn.roofIndex;
  game.coyote = 0;
  game.jumpBuffer = 0;
  game.steer = 0;
  runner.root.position.set(game.x, game.y, game.z);
  runner.shadow.position.set(game.x, game.y + .025, game.z);
  updateCamera(0, true);
  showToast(`<b>ROOF MISSED</b> · BACK TO CHECKPOINT · −${FALL_PENALTY}S`, true);
  spawnParticles(game.x, game.y + .2, game.z, 12, ['#ffffff', '#e2fb75', '#50cbbf']);
}

function landOnRoof(roof, index) {
  game.y = roof.height;
  game.vy = 0;
  game.grounded = true;
  game.roofIndex = index;
  game.coyote = 0;
  spawnParticles(game.x, game.y + .1, game.z, 9, ['#ffffff', '#47d4c5', '#dffa72']);
  if (roof.checkpoint && roof.checkpoint > game.checkpoint) {
    game.checkpoint = roof.checkpoint;
    game.respawn = { x: roof.x, y: roof.height, z: roof.near - 4.7, roofIndex: index };
    refreshCheckpointUI();
    showToast(`<b>CHECKPOINT ${String(roof.checkpoint).padStart(2, '0')}</b> · CLEAN LANDING`);
    spawnParticles(game.x, game.y + 1.4, game.z, 21, ['#e4fd7a', '#46d1c4', '#ffffff'], 1.25);
  }
}

function updateGame(dt) {
  if (game.status !== 'running') return;
  game.elapsed += dt;
  if (game.elapsed >= TIME_LIMIT) {
    game.elapsed = TIME_LIMIT;
    finishRun(false);
    return;
  }

  const left = keys.has('KeyA') || keys.has('ArrowLeft') || touchSteer.left;
  const right = keys.has('KeyD') || keys.has('ArrowRight') || touchSteer.right;
  const steering = Number(right) - Number(left);
  game.steer = THREE.MathUtils.damp(game.steer, steering, 13, dt);
  game.x = THREE.MathUtils.clamp(game.x + game.steer * STEER_SPEED * dt, -13, 13);
  game.z -= RUN_SPEED * dt;

  if (game.grounded) {
    const roof = ROUTE[game.roofIndex];
    if (game.z < roof.far - .1 || game.z > roof.near + .1 || Math.abs(game.x - roof.x) > roof.width / 2 - .22) {
      game.grounded = false;
      game.coyote = .13;
    } else {
      game.y = roof.height;
    }
  } else {
    game.coyote = Math.max(0, game.coyote - dt);
  }

  if (game.jumpBuffer > 0 && (game.grounded || game.coyote > 0)) {
    game.vy = JUMP_SPEED;
    game.grounded = false;
    game.coyote = 0;
    game.jumpBuffer = 0;
    spawnParticles(game.x, game.y + .15, game.z + .35, 13, ['#ecff82', '#ffffff', '#59d0be']);
  } else {
    game.jumpBuffer = Math.max(0, game.jumpBuffer - dt);
  }

  if (!game.grounded) {
    const previousY = game.y;
    game.vy -= GRAVITY * dt;
    game.y += game.vy * dt;
    if (game.vy <= 0) {
      for (let i = Math.max(0, game.roofIndex - 1); i < ROUTE.length; i++) {
        const roof = ROUTE[i];
        if (previousY >= roof.height - .04 && game.y <= roof.height &&
          game.z < roof.near - .1 && game.z > roof.far + .1 &&
          Math.abs(game.x - roof.x) < roof.width / 2 - .4) {
          landOnRoof(roof, i);
          break;
        }
      }
    }
  }

  if (game.grounded && game.roofIndex === ROUTE.length - 1 && game.z <= world.finishZ) {
    finishRun(true);
  } else if (game.y < 9.5 || game.z < ROUTE.at(-1).far - 5) {
    respawn();
  }
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - previousFrame) / 1000, .25);
  previousFrame = now;
  if (document.hidden) return;

  worldTime += dt;
  if (!debugPaused) {
    let remaining = dt;
    while (remaining > .00001) {
      const step = Math.min(remaining, 1 / 60);
      updateGame(step);
      remaining -= step;
    }
  }
  world.update(dt, worldTime, game.z);
  updateParticles(dt);
  if (toastTime > 0) {
    toastTime -= dt;
    if (toastTime <= 0) clearToast();
  }

  runner.root.position.set(game.x, game.y, game.z);
  const roofBelow = ROUTE[game.roofIndex];
  runner.shadow.position.set(game.x, roofBelow.height + .028, game.z);
  runner.shadow.visible = game.y > roofBelow.height - 1 &&
    game.z > roofBelow.far - 1 && game.z < roofBelow.near + 1;
  runner.update(game.status === 'lost' ? 0 : dt, game.grounded, game.steer,
    Math.max(0, game.y - roofBelow.height), game.status === 'won');
  updateCamera(dt);
  updateTimerUI();
  renderer.render(scene, camera);
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  if (event.code === 'KeyR') {
    if (!event.repeat) resetGame();
    return;
  }
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code) && !event.repeat) requestJump();
  keys.add(event.code);
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => {
  keys.clear();
  touchSteer.left = false;
  touchSteer.right = false;
});
canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  requestJump();
});
ui.jumpButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  ui.jumpButton.classList.add('pressed');
  requestJump();
});
for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
  ui.jumpButton.addEventListener(type, () => ui.jumpButton.classList.remove('pressed'));
}
ui.resetButton.addEventListener('click', resetGame);
ui.runAgain.addEventListener('click', resetGame);

function bindSteer(button, direction) {
  const set = (value) => { touchSteer[direction] = value; };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    set(true);
  });
  button.addEventListener('pointerup', () => set(false));
  button.addEventListener('pointercancel', () => set(false));
  button.addEventListener('lostpointercapture', () => set(false));
}
bindSteer(ui.steerLeft, 'left');
bindSteer(ui.steerRight, 'right');

if (import.meta.env.DEV) {
  window.__rooftopDebug = {
    pause: () => { debugPaused = true; },
    resume: () => { debugPaused = false; },
    reset: resetGame,
    jump: requestJump,
    state: () => ({
      x: game.x, y: game.y, z: game.z, grounded: game.grounded,
      roofIndex: game.roofIndex, checkpoint: game.checkpoint,
      elapsed: game.elapsed, status: game.status, misses: game.misses,
    }),
    advance(seconds) {
      const steps = Math.ceil(seconds * 120);
      for (let i = 0; i < steps; i++) updateGame(seconds / steps);
      runner.root.position.set(game.x, game.y, game.z);
      updateCamera(0, true);
      updateTimerUI();
      renderer.render(scene, camera);
      return this.state();
    },
  };
}

resetGame();
renderer.render(scene, camera);
requestAnimationFrame(animate);
