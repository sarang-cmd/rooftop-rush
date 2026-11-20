import * as THREE from 'three';

export const ROUTE = [
  { near: 26, far: -12, x: 0, width: 18, height: 18.5, color: '#e8c9ab' },
  { near: -19, far: -42, x: -1.9, width: 16.5, height: 18.7, color: '#cadfda', checkpoint: 1 },
  { near: -49, far: -73, x: 2.6, width: 16, height: 19.4, color: '#ead1b7', checkpoint: 2 },
  { near: -80, far: -104, x: -2.2, width: 16, height: 19.0, color: '#d1dedf', checkpoint: 3 },
  { near: -111, far: -135, x: 2.4, width: 16, height: 19.7, color: '#eed4b7', checkpoint: 4 },
  { near: -142, far: -166, x: -2.5, width: 16.5, height: 20.0, color: '#cedbd9', checkpoint: 5 },
  { near: -173, far: -197, x: 2.8, width: 16, height: 20.5, color: '#e9c9ae', checkpoint: 6 },
  { near: -204, far: -228, x: -2.2, width: 17, height: 19.9, color: '#cbdcdd', checkpoint: 7 },
  { near: -235, far: -265, x: 0, width: 19, height: 20.6, color: '#f0d5b7', final: true },
];

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitPlane = new THREE.PlaneGeometry(1, 1);
const palette = {
  ink: '#19394d',
  dark: '#284b5d',
  pale: '#f8edda',
  lime: '#e0fb70',
  teal: '#36c9bd',
  coral: '#ff8165',
  road: '#516670',
};

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function standard(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.02, ...extra });
}

function unlit(color, extra = {}) {
  return new THREE.MeshBasicMaterial({ color, ...extra });
}

function box(parent, material, width, height, depth, x, y, z, shadows = true) {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(width, height, depth);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadows;
  mesh.receiveShadow = shadows;
  parent.add(mesh);
  return mesh;
}

function plane(parent, material, width, depth, x, y, z) {
  const mesh = new THREE.Mesh(unitPlane, material);
  mesh.scale.set(width, depth, 1);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, material, topRadius, bottomRadius, height, sides, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function texture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

function facadeTexture(width, height, color, seed, side = false) {
  const random = seeded(seed);
  return texture(512, 768, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(92, 66, 57, .12)';
    for (let y = 16; y < h; y += 17) {
      ctx.fillRect(0, y, w, 2);
      for (let x = (Math.floor(y / 17) % 2) * 42; x < w; x += 84) ctx.fillRect(x, y - 16, 2, 16);
    }

    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(0, 0, 10, h);
    ctx.fillRect(w - 11, 0, 11, h);
    ctx.fillStyle = 'rgba(25,57,77,.14)';
    ctx.fillRect(13, 0, 5, h);
    ctx.fillRect(w - 18, 0, 5, h);

    const floors = Math.max(4, Math.min(12, Math.round(height / 3.3)));
    const columns = Math.max(3, Math.min(9, Math.round(width / 3.0)));
    const cellW = (w - 34) / columns;
    const cellH = (h - 82) / floors;
    for (let row = 0; row < floors; row++) {
      for (let col = 0; col < columns; col++) {
        const wx = 17 + col * cellW + cellW * .24;
        const wy = 24 + row * cellH + cellH * .17;
        const ww = cellW * .52;
        const wh = cellH * .59;
        const lit = random() > .84;
        ctx.fillStyle = 'rgba(32, 55, 66, .24)';
        ctx.fillRect(wx - 5, wy - 4, ww + 10, wh + 9);
        ctx.fillStyle = '#f6e9d5';
        ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
        ctx.fillStyle = lit ? '#f9d693' : random() > .52 ? '#56849a' : '#355a70';
        ctx.fillRect(wx + 1, wy + 1, ww - 2, wh - 2);
        ctx.fillStyle = lit ? 'rgba(255,255,255,.2)' : 'rgba(201,235,238,.21)';
        ctx.fillRect(wx + 3, wy + 2, (ww - 6) * .35, wh - 4);
        ctx.fillStyle = '#e8dfce';
        ctx.fillRect(wx + ww * .49, wy, 3, wh);
        ctx.fillRect(wx, wy + wh * .49, ww, 3);
        ctx.fillStyle = 'rgba(36,60,68,.22)';
        ctx.fillRect(wx - 8, wy + wh + 5, ww + 16, 4);
      }
      ctx.fillStyle = 'rgba(255,255,255,.23)';
      ctx.fillRect(0, 24 + row * cellH + cellH * .88, w, 3);
    }

    ctx.fillStyle = '#345567';
    const entranceX = side ? w * .66 : w * .44;
    ctx.fillRect(entranceX, h - 58, 48, 58);
    ctx.fillStyle = '#c5dadd';
    ctx.fillRect(entranceX + 23, h - 53, 2, 52);
    ctx.fillStyle = '#efefe0';
    ctx.fillRect(0, h - 11, w, 11);
  });
}

function makeBuilding(scene, spec, seed, detailed = true) {
  const depth = spec.near - spec.far;
  const centerZ = (spec.near + spec.far) / 2;
  const facade = standard('#ffffff', { map: facadeTexture(depth, spec.height, spec.color, seed + 1, true) });
  const front = standard('#ffffff', { map: facadeTexture(spec.width, spec.height, spec.color, seed + 2) });
  const roofMaterial = standard(spec.roofColor || '#e5e6d8');
  const sides = [facade, facade, roofMaterial, roofMaterial, front, front];
  box(scene, sides, spec.width, spec.height - .34, depth, spec.x, (spec.height - .34) / 2, centerZ);
  box(scene, standard('#d5c2ac'), spec.width + .14, .4, depth + .14, spec.x, .06, centerZ);
  box(scene, roofMaterial, spec.width + .42, .34, depth + .42, spec.x, spec.height - .17, centerZ);
  if (detailed) {
    const trim = standard('#f6ead7');
    box(scene, trim, spec.width + .5, .19, depth + .5, spec.x, spec.height - .77, centerZ);
  }
  return { centerZ, depth };
}

function arrowTexture() {
  return texture(512, 310, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#234a5a';
    ctx.beginPath();
    ctx.roundRect(122, 197, 268, 70, 18);
    ctx.fill();
    ctx.fillStyle = '#ecff95';
    ctx.font = '900 46px Arial, sans-serif';
    ctx.letterSpacing = '7px';
    ctx.fillText('JUMP', w / 2, 247);
    for (let i = 0; i < 2; i++) {
      const y = 39 + i * 64;
      ctx.fillStyle = i === 0 ? '#e0fb70' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(150, y + 40);
      ctx.lineTo(256, y - 5);
      ctx.lineTo(362, y + 40);
      ctx.lineTo(362, y + 63);
      ctx.lineTo(256, y + 18);
      ctx.lineTo(150, y + 63);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function landingTexture(number) {
  return texture(512, 350, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(37, 183, 178, .17)';
    ctx.beginPath();
    ctx.roundRect(16, 12, w - 32, h - 24, 30);
    ctx.fill();
    ctx.strokeStyle = '#31c8bc';
    ctx.lineWidth = 13;
    ctx.setLineDash([34, 16]);
    ctx.beginPath();
    ctx.roundRect(22, 18, w - 44, h - 36, 26);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#1e5362';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 16, 113, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e5ff80';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 16, 113, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 123px Arial, sans-serif';
    ctx.fillText(number === '★' ? '★' : String(number).padStart(2, '0'), w / 2, h / 2 + 25);
    ctx.fillStyle = '#214b59';
    ctx.font = '900 30px Arial, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText(number === '★' ? 'FINAL ROOF' : 'LAND HERE', w / 2, h - 23);
  });
}

function gateTexture(number) {
  return texture(600, 150, (ctx, w, h) => {
    ctx.fillStyle = '#21485b';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 17);
    ctx.fill();
    ctx.strokeStyle = '#e5fc7d';
    ctx.lineWidth = 11;
    ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.fillStyle = '#e5fc7d';
    ctx.textAlign = 'center';
    ctx.font = '900 58px Arial, sans-serif';
    ctx.fillText(`CHECKPOINT ${String(number).padStart(2, '0')}`, w / 2, 96);
  });
}

function billboardTexture(kind) {
  return texture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1b4053';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#225168';
    for (let i = -7; i < 20; i++) {
      ctx.save();
      ctx.translate(i * 84, 0);
      ctx.rotate(-.25);
      ctx.fillRect(0, -80, 28, h + 180);
      ctx.restore();
    }
    ctx.strokeStyle = '#e4fa76';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.textAlign = 'left';
    if (kind === 'finish') {
      ctx.fillStyle = '#ff8065';
      ctx.beginPath();
      ctx.arc(830, 230, 133, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e5fc7d';
      ctx.font = '900 54px Arial, sans-serif';
      ctx.fillText('✦  ROOFTOP RUSH  /  NYC', 66, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 174px Arial, sans-serif';
      ctx.fillText('FINISH', 55, 300);
      ctx.fillStyle = '#e5fc7d';
      ctx.font = '900 61px Arial, sans-serif';
      ctx.fillText('THE CITY IS YOURS  ↗', 69, 411);
    } else if (kind === 'coffee') {
      ctx.fillStyle = '#e6fa80';
      ctx.font = '900 42px Arial, sans-serif';
      ctx.fillText('YOUR 8AM LOOKS BETTER UP HERE', 55, 97);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 127px Arial, sans-serif';
      ctx.fillText('CITY', 50, 248);
      ctx.fillText('COFFEE.', 50, 376);
      ctx.fillStyle = '#ff8165';
      ctx.beginPath();
      ctx.arc(864, 320, 69, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'sky') {
      ctx.fillStyle = '#e4fa76';
      ctx.font = '900 45px Arial, sans-serif';
      ctx.fillText('NEW YORK / ALL THE WAY UP', 58, 95);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 119px Arial, sans-serif';
      ctx.fillText('CHASE', 51, 256);
      ctx.fillText('THE SKY.', 51, 383);
      ctx.fillStyle = '#ff8165';
      ctx.fillRect(751, 118, 85, 85);
      ctx.fillRect(835, 203, 85, 85);
    } else {
      ctx.fillStyle = '#e4fa76';
      ctx.font = '900 46px Arial, sans-serif';
      ctx.fillText('THIS IS YOUR CITY', 57, 102);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 120px Arial, sans-serif';
      ctx.fillText('GO BIG.', 50, 263);
      ctx.fillStyle = '#ff8165';
      ctx.font = '900 70px Arial, sans-serif';
      ctx.fillText('GO HIGHER.  ↗', 55, 389);
    }
  });
}

function addBillboard(scene, x, roofY, z, width, height, kind) {
  const ink = standard('#19394d');
  const lime = unlit('#e1fb76');
  const centerY = roofY + 4.35 + height / 2;
  const billboard = box(scene, ink, width + .35, height + .35, .43, x, centerY, z);
  billboard.castShadow = true;
  box(scene, lime, width + .52, .11, .53, x, centerY + height / 2 + .2, z);
  box(scene, lime, width + .52, .11, .53, x, centerY - height / 2 - .2, z);
  box(scene, lime, .11, height + .5, .53, x - width / 2 - .2, centerY, z);
  box(scene, lime, .11, height + .5, .53, x + width / 2 + .2, centerY, z);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), unlit('#ffffff', { map: billboardTexture(kind), side: THREE.DoubleSide }));
  face.position.set(x, centerY, z + .24);
  scene.add(face);
  for (const offset of [-width * .34, width * .34]) {
    box(scene, ink, .24, 4.45, .25, x + offset, roofY + 2.16, z - .04);
    box(scene, standard('#9fb6b4'), .3, .12, 1.2, x + offset, roofY + 1.2, z - .4);
  }
}

function addVent(scene, x, y, z, scale = 1) {
  const steel = standard('#a9bdba', { metalness: .22 });
  box(scene, standard('#e8eeeb'), 1.65 * scale, .78 * scale, 1.3 * scale, x, y + .39 * scale, z);
  box(scene, steel, 1.75 * scale, .11 * scale, 1.4 * scale, x, y + .82 * scale, z);
  const fan = new THREE.Mesh(new THREE.TorusGeometry(.39 * scale, .055 * scale, 6, 16), standard('#627e88'));
  fan.rotation.x = -Math.PI / 2;
  fan.position.set(x, y + .89 * scale, z);
  scene.add(fan);
  box(scene, standard('#587584'), .54 * scale, .045 * scale, .09 * scale, x, y + .9 * scale, z);
  box(scene, standard('#587584'), .09 * scale, .045 * scale, .54 * scale, x, y + .9 * scale, z);
}

function addWaterTower(scene, x, y, z, scale = 1) {
  const wood = standard('#af715b');
  const woodLight = standard('#c88b67');
  const iron = standard('#405663', { metalness: .35 });
  for (const dx of [-.92, .92]) {
    for (const dz of [-.92, .92]) {
      box(scene, iron, .13 * scale, 2.55 * scale, .13 * scale, x + dx * scale, y + 1.25 * scale, z + dz * scale);
    }
  }
  box(scene, iron, 2.6 * scale, .12 * scale, 2.6 * scale, x, y + 2.42 * scale, z);
  cylinder(scene, wood, 1.55 * scale, 1.55 * scale, 2.15 * scale, 16, x, y + 3.62 * scale, z);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI * 2 / 16;
    const slat = box(scene, woodLight, .1 * scale, 2.1 * scale, .13 * scale,
      x + Math.sin(a) * 1.53 * scale, y + 3.62 * scale, z + Math.cos(a) * 1.53 * scale);
    slat.rotation.y = a;
  }
  for (const offset of [-.66, .69]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.57 * scale, .075 * scale, 5, 24), iron);
    band.rotation.x = Math.PI / 2;
    band.position.set(x, y + (3.62 + offset) * scale, z);
    band.castShadow = true;
    scene.add(band);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.84 * scale, .9 * scale, 16), standard('#365367'));
  roof.position.set(x, y + 5.14 * scale, z);
  roof.castShadow = true;
  scene.add(roof);
  cylinder(scene, iron, .07 * scale, .07 * scale, .55 * scale, 7, x, y + 5.83 * scale, z);
}

function addFireEscape(scene, spec, side, seed) {
  const metal = standard('#395869', { metalness: .35 });
  const x = spec.x + side * (spec.width / 2 + .63);
  const z = (spec.near + spec.far) / 2 + ((seed % 2) ? 2 : -2);
  const floors = Math.min(4, Math.floor((spec.height - 3) / 4));
  for (let i = 0; i < floors; i++) {
    const y = 4.4 + i * 4;
    box(scene, metal, 1.25, .14, 5.1, x, y, z);
    for (const zEdge of [-2.45, 2.45]) box(scene, metal, 1.28, .07, .09, x, y + .92, z + zEdge);
    for (const zPost of [-2.35, 0, 2.35]) {
      box(scene, metal, .06, 1, .06, x + side * .55, y + .48, z + zPost);
    }
    box(scene, metal, .07, .08, 5.05, x + side * .55, y + .99, z);
    if (i < floors - 1) {
      const stair = box(scene, metal, .73, .12, 5.2, x + side * .25, y + 2.04, z);
      stair.rotation.x = (i % 2 ? 1 : -1) * .48;
      for (let t = 0; t < 5; t++) {
        box(scene, metal, .8, .06, .3, x + side * .25,
          y + .7 + t * .62, z + (i % 2 ? -1 : 1) * (1.8 - t * .9));
      }
    }
  }
}

function addCheckpointGate(scene, roof, number, animated) {
  const gateZ = roof.near - 12.2;
  const gateMat = unlit('#42d5ca');
  const frame = standard('#315668');
  for (const side of [-1, 1]) {
    box(scene, frame, .28, 3.15, .3, roof.x + side * 4.9, roof.height + 1.55, gateZ);
    box(scene, gateMat, .095, 3.08, .34, roof.x + side * 4.9, roof.height + 1.55, gateZ + .17, false);
    box(scene, unlit('#e2fc79'), .43, .25, .45, roof.x + side * 4.9, roof.height + 3.16, gateZ);
  }
  box(scene, frame, 10.1, .3, .32, roof.x, roof.height + 3.18, gateZ);
  box(scene, gateMat, 9.75, .095, .35, roof.x, roof.height + 3.28, gateZ + .1, false);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.0), unlit('#ffffff', { map: gateTexture(number), side: THREE.DoubleSide }));
  plaque.position.set(roof.x, roof.height + 3.76, gateZ + .2);
  scene.add(plaque);
  const diamond = box(scene, unlit('#e5fc7d'), .27, .27, .27, roof.x, roof.height + 4.65, gateZ, false);
  diamond.rotation.z = Math.PI / 4;
  animated.push({ mesh: diamond, y: diamond.position.y, phase: number * .8 });
  return gateMat;
}

function addFinishGate(scene, roof, animated) {
  const z = roof.far + 9;
  const ink = standard('#1d4154');
  const lime = unlit('#e3fb74');
  for (const side of [-1, 1]) {
    box(scene, ink, .4, 5, .5, roof.x + side * 6.4, roof.height + 2.5, z);
    box(scene, lime, .14, 4.7, .52, roof.x + side * 6.4, roof.height + 2.5, z + .23, false);
    box(scene, unlit('#ff8469'), .75, .8, .65, roof.x + side * 6.4, roof.height + 5.05, z);
  }
  box(scene, ink, 13.2, .5, .5, roof.x, roof.height + 4.94, z);
  box(scene, lime, 12.8, .12, .52, roof.x, roof.height + 4.85, z + .28, false);
  for (let i = -4; i <= 4; i++) {
    const flag = box(scene, i % 2 ? unlit('#ffffff') : unlit('#ff8469'), .8, .22, .35,
      roof.x + i * 1.22, roof.height + 4.65, z + .25, false);
    animated.push({ mesh: flag, y: flag.position.y, phase: i * .7 });
  }
  return z;
}

function addRoofDetails(scene, roof, index, animated, jumpMap) {
  const centerZ = (roof.near + roof.far) / 2;
  const depth = roof.near - roof.far;
  const cap = standard('#f5ead4');
  const parapet = standard(index % 2 ? '#dbe6dc' : '#e6d9c5');
  const ink = standard('#22495b');
  const lime = unlit('#dfff70');
  const cyan = unlit('#44d7cb');

  for (const side of [-1, 1]) {
    const x = roof.x + side * (roof.width / 2 - .12);
    box(scene, parapet, .35, .55, depth + .3, x, roof.height + .27, centerZ);
    box(scene, cap, .48, .12, depth + .42, x, roof.height + .59, centerZ);
  }
  const opening = index === 0 ? 10 : 9;
  const sideLength = (roof.width - opening) / 2;
  for (const z of [roof.near - .12, roof.far + .12]) {
    for (const side of [-1, 1]) {
      const x = roof.x + side * (opening / 2 + sideLength / 2);
      box(scene, parapet, sideLength + .15, .55, .36, x, roof.height + .27, z);
      box(scene, cap, sideLength + .2, .12, .5, x, roof.height + .6, z);
    }
  }

  plane(scene, unlit('#6bb9b2', { transparent: true, opacity: .18, depthWrite: false }), 5.5, depth - 3,
    roof.x, roof.height + .018, centerZ);
  const lane = unlit('#46bfb5', { transparent: true, opacity: .65 });
  for (let z = roof.near - 5; z > roof.far + 4; z -= 5.3) {
    for (const side of [-1, 1]) {
      box(scene, lane, .12, .025, 2.45, roof.x + side * 3.15, roof.height + .035, z, false);
    }
  }
  for (let z = roof.near - 10; z > roof.far + 8; z -= 4.5) {
    box(scene, unlit('#5cbab0', { transparent: true, opacity: .7 }), .12, .025, 1.5, roof.x, roof.height + .034, z, false);
  }
  for (const side of [-1, 1]) {
    box(scene, cyan, .18, .055, 2.6, roof.x + side * 2.9, roof.height + .04, roof.near - 3.7, false);
  }

  if (!roof.final) {
    plane(scene, unlit('#ffffff', { map: jumpMap, transparent: true, depthWrite: false }), 7, 4.25,
      roof.x, roof.height + .055, roof.far + 4.2);
    const hazardCount = Math.round(roof.width / .75);
    for (let i = 0; i < hazardCount; i++) {
      const x = roof.x - roof.width / 2 + (i + .5) * roof.width / hazardCount;
      box(scene, i % 2 ? ink : lime, roof.width / hazardCount + .01, .038, .8,
        x, roof.height + .045, roof.far + .54, false);
    }
    box(scene, lime, roof.width - .3, .15, .18, roof.x, roof.height + .16, roof.far + .18, false);
    const glowMat = unlit('#ddff6f', { transparent: true, opacity: .23, depthWrite: false });
    plane(scene, glowMat, roof.width + 1.1, 2.25, roof.x, roof.height + .024, roof.far + 1.1);
    animated.push({ material: glowMat, phase: index * .67 });
    const edgePostX = roof.x + roof.width / 2 - 1.05;
    box(scene, standard('#31566b'), .15, 1.38, .15, edgePostX, roof.height + .75, roof.far + 1.3);
    box(scene, lime, .65, .64, .1, edgePostX, roof.height + 1.49, roof.far + 1.4, false);
  } else {
    plane(scene, unlit('#ffffff', { map: landingTexture('★'), transparent: true, depthWrite: false }), 9.0, 6.0,
      roof.x, roof.height + .06, roof.near - 5.2);
  }

  if (roof.checkpoint) {
    plane(scene, unlit('#ffffff', { map: landingTexture(roof.checkpoint), transparent: true, depthWrite: false }), 8.2, 5.5,
      roof.x, roof.height + .06, roof.near - 4.25);
  }

  if (index % 2 === 0) {
    addVent(scene, roof.x + roof.width / 2 - 2.1, roof.height, roof.near - 11, .85);
    addVent(scene, roof.x + roof.width / 2 - 2.8, roof.height, roof.far + 11, .55);
    if (index === 0 || index === 4) addWaterTower(scene, roof.x - roof.width / 2 + 2.4, roof.height, centerZ + 3, .74);
  } else {
    addVent(scene, roof.x - roof.width / 2 + 2.2, roof.height, roof.near - 12, .8);
    addVent(scene, roof.x - roof.width / 2 + 2.5, roof.height, roof.far + 7, .55);
    if (index === 3 || index === 7) addWaterTower(scene, roof.x + roof.width / 2 - 2.5, roof.height, centerZ + 2, .7);
  }
}

function addRoads(scene) {
  const asphalt = standard(palette.road);
  const stripe = unlit('#e6e5d6');
  const sidewalk = standard('#e9d4bd');
  box(scene, standard('#e1ccba'), 380, .12, 760, 0, -.38, -135, false);
  for (const x of [-21.5, 21.5]) {
    box(scene, asphalt, 16, .12, 400, x, -.27, -120, false);
    for (let z = -306; z <= 63; z += 7) {
      box(scene, stripe, .16, .015, 2.8, x, -.197, z, false);
    }
    for (const edge of [-8.6, 8.6]) {
      box(scene, sidewalk, 1.65, .19, 400, x + edge, -.14, -120, false);
    }
  }
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const z = (ROUTE[i].far + ROUTE[i + 1].near) / 2;
    box(scene, asphalt, 155, .115, 7.25, 0, -.17, z, false);
    for (let x = -67; x < 67; x += 8) {
      box(scene, stripe, 3.2, .018, .13, x, -.102, z, false);
    }
    for (const roadX of [-21.5, 21.5]) {
      for (let j = -5; j <= 5; j++) {
        box(scene, unlit('#f3efe0'), .86, .018, 2.3, roadX + j * 1.25, -.098, z + 5.0, false);
      }
    }
  }
  for (const x of [-11.8, 11.8, -31.2, 31.2]) {
    box(scene, standard('#faf0dc'), .22, .2, 400, x, -.14, -120, false);
  }
}

function addCar(scene, x, z, direction, paint, speed, cars) {
  const group = new THREE.Group();
  const body = standard(paint, { metalness: .08 });
  const dark = standard('#28485a');
  const tire = standard('#253a43');
  box(group, body, 1.55, .55, 3.05, 0, .52, 0);
  box(group, body, 1.32, .43, 1.75, 0, .98, -.14);
  box(group, dark, 1.34, .32, 1.38, 0, 1.03, -.14);
  box(group, body, 1.38, .11, 1.83, 0, 1.22, -.14);
  box(group, unlit('#fff6d7'), 1.18, .12, .055, 0, .55, -1.55, false);
  box(group, unlit('#e67865'), 1.18, .12, .055, 0, .55, 1.55, false);
  for (const wx of [-.79, .79]) {
    for (const wz of [-.93, .93]) {
      const wheel = cylinder(group, tire, .28, .28, .13, 8, wx, .3, wz);
      wheel.rotation.z = Math.PI / 2;
    }
  }
  if (paint === '#f7c84d') {
    box(group, standard('#f8efe0'), .75, .28, .38, 0, 1.49, .05);
    box(group, dark, .48, .025, .025, 0, 1.55, -.16, false);
  }
  group.position.set(x, 0, z);
  if (direction > 0) group.rotation.y = Math.PI;
  scene.add(group);
  cars.push({ group, direction, speed });
}

function addStreetProps(scene, random) {
  const pole = standard('#446170');
  const lamp = unlit('#ffe9ac');
  for (const x of [-11.9, 11.9, -30.8, 30.8]) {
    for (let z = 33; z > -260; z -= 31) {
      if (random() > .45) {
        cylinder(scene, pole, .055, .075, 4.1, 6, x, 1.92, z);
        box(scene, pole, 1.25, .075, .075, x + (x < 0 ? .58 : -.58), 3.9, z);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(.19, 8, 6), lamp);
        bulb.position.set(x + (x < 0 ? 1.1 : -1.1), 3.76, z);
        scene.add(bulb);
      } else {
        cylinder(scene, standard('#967960'), .16, .21, 2.5, 7, x, 1.13, z);
        const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1), standard(random() > .5 ? '#7abf96' : '#93c29c'));
        foliage.position.set(x, 3.45, z);
        foliage.castShadow = true;
        scene.add(foliage);
      }
    }
  }
}

function addClothesline(scene, x1, x2, z, y) {
  const lineMaterial = standard('#657d7d');
  const line = box(scene, lineMaterial, Math.abs(x2 - x1), .035, .035, (x1 + x2) / 2, y, z, false);
  line.rotation.z = -.015;
  const colors = ['#fff2d6', '#f79077', '#89c5d3', '#f5d075', '#b7dcbc'];
  for (let i = 0; i < 5; i++) {
    const x = x1 + (x2 - x1) * (i + 1) / 6;
    const cloth = box(scene, standard(colors[i]), .95 + (i % 2) * .3, .9 + (i % 3) * .22, .055,
      x, y - .53, z + .02, false);
    cloth.rotation.z = (i - 2) * .035;
    box(scene, standard('#385766'), .08, .18, .1, x - .28, y - .08, z + .04, false);
    box(scene, standard('#385766'), .08, .18, .1, x + .28, y - .08, z + .04, false);
  }
}

function addClouds(scene, random, clouds) {
  const cloudMaterials = [
    unlit('#fffdf0', { transparent: true, opacity: .72, depthWrite: false, fog: false }),
    unlit('#eaf6ee', { transparent: true, opacity: .78, depthWrite: false, fog: false }),
  ];
  for (let i = 0; i < 19; i++) {
    const group = new THREE.Group();
    const width = 5 + random() * 8;
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), cloudMaterials[i % 2]);
      puff.scale.set(width * (.4 + random() * .25), 1.6 + random() * 1.5, 1.4 + random());
      puff.position.set((j - 1.5) * width * .4, random() * 1.1, random() * 2);
      group.add(puff);
    }
    group.position.set((random() - .5) * 270, 44 + random() * 30, -100 - random() * 290);
    scene.add(group);
    clouds.push({ group, startX: group.position.x, phase: random() * 10 });
  }
}

function addSkyline(scene, random) {
  const tones = ['#b5cfcf', '#b9d4d1', '#c5d3ca', '#a8c5cb', '#d7d3be'];
  for (let i = 0; i < 31; i++) {
    const x = -180 + i * 12 + random() * 5;
    const z = -315 - random() * 60;
    const width = 9 + random() * 11;
    const height = 28 + random() * 52;
    const facade = standard(tones[i % tones.length]);
    box(scene, facade, width, height, 10 + random() * 13, x, height / 2, z, false);
    if (i % 4 === 0) {
      box(scene, standard('#b1c9c8'), width * .68, 5, 8, x, height + 2.5, z, false);
      cylinder(scene, standard('#a7bec0'), .24, .24, 11, 6, x, height + 9, z);
    }
  }
  const spire = standard('#afc7c7');
  box(scene, spire, 12, 62, 12, -7, 31, -356, false);
  box(scene, spire, 8, 13, 8, -7, 68, -356, false);
  box(scene, spire, 4, 9, 4, -7, 79, -356, false);
  cylinder(scene, spire, .4, .4, 23, 8, -7, 95, -356);
}

function addSun(scene) {
  const sun = new THREE.Mesh(new THREE.SphereGeometry(12, 20, 16), unlit('#ffedb0', { fog: false }));
  sun.position.set(-111, 94, -285);
  scene.add(sun);
  const glowTexture = texture(128, 128, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, 'rgba(255,237,174,.55)');
    gradient.addColorStop(.35, 'rgba(255,231,169,.23)');
    gradient.addColorStop(1, 'rgba(255,231,169,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, depthWrite: false, fog: false }));
  halo.position.copy(sun.position);
  halo.scale.set(60, 60, 1);
  scene.add(halo);
}

export function createWorld(scene) {
  const random = seeded(20841);
  const animated = [];
  const cars = [];
  const clouds = [];
  const gates = [];
  const jumpMap = arrowTexture();

  scene.background = new THREE.Color('#a5dbea');
  scene.fog = new THREE.Fog('#c5e5e8', 110, 355);
  scene.add(new THREE.HemisphereLight('#fffdf0', '#adc0b7', 1.55));
  const sunLight = new THREE.DirectionalLight('#fff7d8', 2.15);
  sunLight.position.set(-45, 88, -42);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1536, 1536);
  sunLight.shadow.camera.left = -65;
  sunLight.shadow.camera.right = 65;
  sunLight.shadow.camera.top = 65;
  sunLight.shadow.camera.bottom = -65;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 210;
  sunLight.shadow.bias = -.00015;
  sunLight.shadow.normalBias = .025;
  sunLight.target.position.set(0, 0, -35);
  scene.add(sunLight, sunLight.target);

  addRoads(scene);
  addSkyline(scene, random);
  addSun(scene);
  addClouds(scene, random, clouds);

  const sideTones = ['#dfbba9', '#c3d7d2', '#d8c0ae', '#bdd0d1', '#e2cdb4', '#bad1c5'];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const centerZ = 24 - i * 26.3 + (random() - .5) * 3;
      const depth = 20 + random() * 4;
      const height = 17 + random() * 23;
      const spec = {
        x: side * (39 + random() * 3.2), width: 18 + random() * 7,
        near: centerZ + depth / 2, far: centerZ - depth / 2,
        height, color: sideTones[(i + (side + 1) * 2) % sideTones.length],
        roofColor: i % 2 ? '#d9dfd2' : '#e6ddcd',
      };
      makeBuilding(scene, spec, 1200 + i * 13 + side * 103);
      const trim = standard('#f0e8d7');
      box(scene, trim, spec.width + .4, .38, depth + .4, spec.x, spec.height + .12, centerZ);
      if (i % 3 !== 1) addFireEscape(scene, spec, -side, i + (side + 1) * 17);
      if (i % 3 === 0) {
        const towerX = spec.x + side * (spec.width / 2 - 3.7);
        addWaterTower(scene, towerX, height + .32, centerZ - 2, .76 + random() * .18);
      } else {
        addVent(scene, spec.x - side * (spec.width / 2 - 3.1), height + .3, centerZ, .85);
      }
      if (side > 0 && [2, 5, 8].includes(i)) {
        const kind = i === 2 ? 'coffee' : i === 5 ? 'sky' : 'high';
        addBillboard(scene, spec.x, height + .3, spec.near - 3.2, 11.8, 5.5, kind);
      }
      if (side < 0 && [3, 7].includes(i)) {
        addBillboard(scene, spec.x, height + .3, spec.near - 3.2, 11, 5.1, i === 3 ? 'high' : 'coffee');
      }
    }
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 11; i++) {
      const depth = 21 + random() * 7;
      const centerZ = 28 - i * 29 + (random() - .5) * 4;
      const spec = {
        x: side * (70 + random() * 7), width: 20 + random() * 9,
        near: centerZ + depth / 2, far: centerZ - depth / 2,
        height: 23 + random() * 29,
        color: sideTones[(i + 3) % sideTones.length],
        roofColor: '#d7dfd7',
      };
      makeBuilding(scene, spec, 3400 + i * 17 + side * 89, false);
      if (i % 3 === 0) addWaterTower(scene, spec.x, spec.height, centerZ, .62);
    }
  }

  addStreetProps(scene, random);
  for (let i = 0; i < 20; i++) {
    const x = (i % 2 ? 1 : -1) * (17.5 + (i % 4) * 2.6);
    const paint = i % 3 === 0 ? '#f7c84d' : ['#e47d69', '#a5cbc4', '#f6ead6', '#4d8aa0'][i % 4];
    addCar(scene, x, 32 - i * 16, i % 2 ? -1 : 1, paint, 4 + random() * 4, cars);
  }
  addClothesline(scene, 12.4, 28.4, -64, 15.8);
  addClothesline(scene, -28.5, -12.3, -127, 17.1);
  addClothesline(scene, 12.2, 28.3, -186, 16.6);

  ROUTE.forEach((roof, index) => {
    makeBuilding(scene, { ...roof, roofColor: index % 2 ? '#c8dcd5' : '#e1d9c4' }, 700 + index * 47);
    addRoofDetails(scene, roof, index, animated, jumpMap);
    if (roof.checkpoint) gates.push(addCheckpointGate(scene, roof, roof.checkpoint, animated));
  });
  const finishZ = addFinishGate(scene, ROUTE.at(-1), animated);
  addBillboard(scene, ROUTE.at(-1).x, ROUTE.at(-1).height, ROUTE.at(-1).far + 2.1, 14.3, 6.15, 'finish');

  return {
    roofs: ROUTE,
    finishZ,
    sunLight,
    update(dt, time, playerZ) {
      for (const car of cars) {
        car.group.position.z += car.direction * car.speed * dt;
        if (car.group.position.z < -304) car.group.position.z = 58;
        if (car.group.position.z > 58) car.group.position.z = -304;
      }
      for (const cloud of clouds) cloud.group.position.x = cloud.startX + Math.sin(time * .09 + cloud.phase) * 2.4;
      for (const item of animated) {
        if (item.material) item.material.opacity = .18 + Math.sin(time * 4.5 + item.phase) * .08;
        if (item.mesh) item.mesh.position.y = item.y + Math.sin(time * 2.8 + item.phase) * .12;
      }
      sunLight.position.z = playerZ - 48;
      sunLight.target.position.z = playerZ - 20;
      sunLight.target.updateMatrixWorld();
    },
    setCheckpoint(count) {
      gates.forEach((gate, index) => gate.color.set(index < count ? '#e0fb70' : '#42d5ca'));
    },
  };
}

export function createRunner(scene) {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  root.add(visual);
  scene.add(root);

  const navy = standard('#233f56');
  const coral = standard('#ff785e');
  const coralShade = standard('#de6755');
  const skin = standard('#dba884');
  const mint = standard('#cffa75');
  const white = standard('#fcf6e7');
  const teal = standard('#3ab9b2');

  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * .22, 1.24, 0);
    box(leg, navy, .32, .62, .36, 0, -.31, 0);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(.17, 9, 7), navy);
    knee.position.y = -.62;
    leg.add(knee);
    const lower = new THREE.Group();
    lower.position.y = -.64;
    box(lower, navy, .25, .51, .28, 0, -.25, .01);
    box(lower, white, .39, .12, .66, 0, -.55, -.13);
    box(lower, teal, .36, .2, .61, 0, -.47, -.14);
    box(lower, white, .37, .05, .2, 0, -.36, -.38);
    leg.add(lower);
    visual.add(leg);
    legs.push({ upper: leg, lower });
  }

  const torso = new THREE.Group();
  torso.position.y = 1.23;
  visual.add(torso);
  const jacket = new THREE.Mesh(new THREE.CylinderGeometry(.41, .34, 1.1, 10), coral);
  jacket.position.y = .58;
  jacket.castShadow = true;
  torso.add(jacket);
  box(torso, coralShade, .64, .18, .48, 0, 1.08, .01);
  box(torso, white, .07, .85, .035, 0, .58, -.388);
  box(torso, navy, .73, .22, .48, 0, .08, 0);

  box(torso, navy, .83, .91, .27, 0, .59, .44);
  box(torso, mint, .64, .67, .095, 0, .58, .605);
  box(torso, navy, .13, .63, .07, -.25, .63, -.42);
  box(torso, navy, .13, .63, .07, .25, .63, -.42);
  const backpackMark = box(torso, navy, .19, .36, .04, 0, .59, .67, false);
  backpackMark.rotation.z = -.4;
  const backpackMark2 = box(torso, navy, .19, .36, .04, .08, .52, .69, false);
  backpackMark2.rotation.z = .55;

  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * .47, 1.02, 0);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(.2, 9, 8), coral);
    shoulder.castShadow = true;
    arm.add(shoulder);
    box(arm, coral, .26, .54, .28, 0, -.29, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -.56;
    box(elbow, coralShade, .23, .42, .25, 0, -.19, -.03);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.14, 9, 7), skin);
    hand.position.set(0, -.42, -.06);
    elbow.add(hand);
    arm.add(elbow);
    torso.add(arm);
    arms.push({ upper: arm, lower: elbow });
  }

  cylinder(torso, skin, .15, .15, .23, 9, 0, 1.18, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 10), skin);
  head.position.y = 1.49;
  head.castShadow = true;
  torso.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.325, 12, 10, 0, Math.PI * 2, 0, Math.PI * .51), navy);
  hair.position.set(0, 1.53, .01);
  torso.add(hair);
  cylinder(torso, navy, .34, .35, .14, 12, 0, 1.79, 0);
  box(torso, navy, .48, .075, .25, 0, 1.75, -.33);
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.034, 7, 6), navy);
    eye.position.set(side * .115, 1.5, -.3);
    torso.add(eye);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.77, 24),
    unlit('#244556', { transparent: true, opacity: .22, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = 2;
  scene.add(shadow);

  let runTime = 0;
  return {
    root,
    shadow,
    update(dt, grounded, steer, altitude, celebrating = false) {
      runTime += dt * (celebrating ? 5 : grounded ? 18.5 : 8);
      const smooth = 1 - Math.exp(-dt * 15);
      if (celebrating) {
        for (const leg of legs) {
          leg.upper.rotation.x = THREE.MathUtils.lerp(leg.upper.rotation.x, 0, smooth);
          leg.lower.rotation.x = THREE.MathUtils.lerp(leg.lower.rotation.x, 0, smooth);
        }
        for (const arm of arms) arm.upper.rotation.x = THREE.MathUtils.lerp(arm.upper.rotation.x, -2.5, smooth);
        visual.position.y = .07 + Math.sin(runTime) * .055;
        torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, -.1, smooth);
      } else if (grounded) {
        const stride = Math.sin(runTime);
        legs[0].upper.rotation.x = THREE.MathUtils.lerp(legs[0].upper.rotation.x, stride * .58, smooth);
        legs[1].upper.rotation.x = THREE.MathUtils.lerp(legs[1].upper.rotation.x, -stride * .58, smooth);
        legs[0].lower.rotation.x = THREE.MathUtils.lerp(legs[0].lower.rotation.x, Math.max(0, -stride) * .7, smooth);
        legs[1].lower.rotation.x = THREE.MathUtils.lerp(legs[1].lower.rotation.x, Math.max(0, stride) * .7, smooth);
        arms[0].upper.rotation.x = THREE.MathUtils.lerp(arms[0].upper.rotation.x, -stride * .75, smooth);
        arms[1].upper.rotation.x = THREE.MathUtils.lerp(arms[1].upper.rotation.x, stride * .75, smooth);
        visual.position.y = Math.abs(Math.sin(runTime)) * .065;
        torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, -.15, smooth);
      } else {
        legs[0].upper.rotation.x = THREE.MathUtils.lerp(legs[0].upper.rotation.x, .43, smooth);
        legs[1].upper.rotation.x = THREE.MathUtils.lerp(legs[1].upper.rotation.x, -.35, smooth);
        legs[0].lower.rotation.x = THREE.MathUtils.lerp(legs[0].lower.rotation.x, -.48, smooth);
        legs[1].lower.rotation.x = THREE.MathUtils.lerp(legs[1].lower.rotation.x, .43, smooth);
        arms[0].upper.rotation.x = THREE.MathUtils.lerp(arms[0].upper.rotation.x, -1.0, smooth);
        arms[1].upper.rotation.x = THREE.MathUtils.lerp(arms[1].upper.rotation.x, -.8, smooth);
        visual.position.y = 0;
        torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, .05, smooth);
      }
      arms[0].lower.rotation.x = celebrating ? -.35 : -.2;
      arms[1].lower.rotation.x = celebrating ? -.35 : -.2;
      visual.rotation.z = THREE.MathUtils.lerp(visual.rotation.z, -steer * .09, smooth);
      shadow.material.opacity = Math.max(.05, .23 - altitude * .035);
      const shadowScale = 1 + Math.min(altitude, 7) * .17;
      shadow.scale.setScalar(shadowScale);
    },
  };
}
