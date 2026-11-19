import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDirectory = path.join(frontendRoot, 'source-assets/homepage/models/raccoons');
const unitBox = new THREE.BoxGeometry(1, 1, 1);

const materialColors = {
  fur: 0x82776d,
  furLight: 0x9a8b7d,
  furDark: 0x625950,
  mask: 0x393430,
  muzzle: 0xd8c3a6,
  muzzleShadow: 0xb8a187,
  innerEar: 0xa7836d,
  eyeWhite: 0xf4ead9,
  eye: 0x241f1c,
  nose: 0x211c19,
  paw: 0x4e4540,
  note: 0xe4c99a,
  noteEdge: 0x9b7045,
};

const variants = [
  {
    fileName: 'raccoon-note-courier.glb',
    assetId: 'raccoon-note-courier',
    role: 'Note Courier',
    tailSide: -1,
    tailCurl: 0.02,
    headTilt: -0.025,
    greetingArmRotation: 0.16,
    carriesNote: true,
    activityName: 'offer-note',
  },
  {
    fileName: 'raccoon-washer-guide.glb',
    assetId: 'raccoon-washer-guide',
    role: 'Washer Guide',
    tailSide: 1,
    tailCurl: 0.105,
    headTilt: 0.055,
    greetingArmRotation: 2.8,
    carriesNote: false,
    activityName: 'greet',
  },
];

await mkdir(outputDirectory, { recursive: true });
installFileReaderPolyfill();

for (const variant of variants) {
  const scene = new THREE.Scene();
  scene.name = `${variant.assetId}-scene`;
  const raccoon = createRaccoon(variant);
  scene.add(raccoon);
  scene.updateMatrixWorld(true);

  const bytes = await new GLTFExporter().parseAsync(scene, {
    animations: [createActivityClip(variant, raccoon)],
    binary: true,
    trs: true,
  });
  if (!(bytes instanceof ArrayBuffer)) {
    throw new Error(`The exporter did not return binary GLB data for ${variant.fileName}.`);
  }

  const outputPath = path.join(outputDirectory, variant.fileName);
  await writeFile(outputPath, new Uint8Array(bytes));
  console.log(`Wrote ${path.relative(frontendRoot, outputPath)} (${bytes.byteLength} bytes).`);
}

function createRaccoon(variant) {
  const materials = createMaterials();
  const raccoon = new THREE.Group();
  raccoon.name = 'Raccoon';
  raccoon.scale.setScalar(0.86);
  raccoon.userData = {
    assetId: variant.assetId,
    role: variant.role,
    forwardAxis: '+Z',
    groundContact: 'y=0',
    activityClip: variant.activityName,
    authoring: 'Original procedural cuboid model authored for The Block Laundromat.',
  };

  addBody(raccoon, materials);
  addHead(raccoon, materials, variant.headTilt);
  addForelegs(raccoon, materials, variant.greetingArmRotation);
  addTail(raccoon, materials, variant.tailSide, variant.tailCurl);
  if (variant.carriesNote) addNoteCard(raccoon, materials);

  return raccoon;
}

function createActivityClip(variant, raccoon) {
  const sampleTimes = [0, 0.3, 0.6, 0.9, 1.2];
  const head = raccoon.getObjectByName('Head_BroadCheekMask');
  const tail = raccoon.getObjectByName('Tail_Banded');
  const foreleg = raccoon.getObjectByName('ForelegL');
  if (!head || !tail || !foreleg) {
    throw new Error(`The ${variant.role} model is missing an activity pivot.`);
  }

  const tracks = [
    createQuaternionTrack(head, 'x', [0, 0.045, 0, 0.035, 0], sampleTimes),
    createQuaternionTrack(tail, 'y', [0, 0.16, -0.12, 0.16, 0], sampleTimes),
  ];

  if (variant.carriesNote) {
    const note = raccoon.getObjectByName('ProjectNote');
    if (!note) throw new Error('The Note Courier model is missing its paper prop.');
    tracks.push(
      new THREE.VectorKeyframeTrack(
        'ProjectNote.position',
        sampleTimes,
        [0, 0.365, 0.225, 0, 0.365, 0.248, 0, 0.365, 0.225, 0, 0.365, 0.248, 0, 0.365, 0.225],
      ),
      createQuaternionTrack(note, 'z', [0, -0.045, 0.035, -0.045, 0], sampleTimes),
      createQuaternionTrack(foreleg, 'z', [0, 0.07, 0, 0.07, 0], sampleTimes),
    );
  } else {
    tracks.push(createQuaternionTrack(foreleg, 'z', [0, 0.24, -0.14, 0.24, 0], sampleTimes));
  }

  return new THREE.AnimationClip(variant.activityName, 1.2, tracks);
}

function createQuaternionTrack(object, axis, offsets, sampleTimes) {
  const values = offsets.flatMap((offset) => {
    const rotation = object.rotation.clone();
    rotation[axis] += offset;
    return new THREE.Quaternion().setFromEuler(rotation).toArray();
  });
  return new THREE.QuaternionKeyframeTrack(`${object.name}.quaternion`, sampleTimes, values);
}

function createMaterials() {
  return Object.fromEntries(
    Object.entries(materialColors).map(([name, color]) => [
      name,
      new THREE.MeshStandardMaterial({ color, roughness: 0.96, metalness: 0 }),
    ]),
  );
}

function addBody(root, materials) {
  const body = new THREE.Group();
  body.name = 'Body';
  root.add(body);

  addCuboid(body, 'Hindquarters', materials.fur, [0, 0.17, -0.035], [0.36, 0.25, 0.33]);
  addCuboid(body, 'Torso', materials.furLight, [0, 0.365, 0.005], [0.3, 0.34, 0.29]);
  addCuboid(body, 'Belly', materials.muzzle, [0, 0.33, 0.158], [0.205, 0.22, 0.035]);
  addCuboid(body, 'Chest', materials.muzzleShadow, [0, 0.465, 0.16], [0.16, 0.065, 0.025]);

  for (const [side, suffix] of [
    [-1, 'L'],
    [1, 'R'],
  ]) {
    const hindleg = new THREE.Group();
    hindleg.name = `Hindleg${suffix}`;
    hindleg.position.set(side * 0.13, 0.15, 0.035);
    body.add(hindleg);

    addCuboid(hindleg, `Thigh${suffix}`, materials.furLight, [0, 0.005, -0.01], [0.15, 0.2, 0.19]);
    addCuboid(hindleg, `Paw${suffix}`, materials.paw, [0, -0.075, 0.085], [0.145, 0.075, 0.19]);
    addCuboid(hindleg, `Toe${suffix}`, materials.furDark, [0, -0.073, 0.178], [0.12, 0.045, 0.025]);
  }
}

function addHead(root, materials, headTilt) {
  const head = new THREE.Group();
  head.name = 'Head_BroadCheekMask';
  head.position.set(0, 0.535, 0.105);
  head.rotation.z = headTilt;
  root.add(head);

  addCuboid(head, 'Cranium', materials.furLight, [0, 0.07, 0], [0.33, 0.265, 0.28]);

  for (const [side, suffix] of [
    [-1, 'L'],
    [1, 'R'],
  ]) {
    addCuboid(
      head,
      `Ear${suffix}`,
      materials.fur,
      [side * 0.112, 0.215, -0.04],
      [0.102, 0.11, 0.125],
    );
    addCuboid(
      head,
      `InnerEar${suffix}`,
      materials.innerEar,
      [side * 0.112, 0.215, 0.027],
      [0.052, 0.06, 0.018],
    );
    addCuboid(
      head,
      `EyeWhite${suffix}`,
      materials.eyeWhite,
      [side * 0.073, 0.082, 0.157],
      [0.056, 0.062, 0.024],
    );
    addCuboid(
      head,
      `Eye${suffix}`,
      materials.eye,
      [side * 0.073, 0.081, 0.176],
      [0.029, 0.038, 0.014],
    );
    addCuboid(
      head,
      `EyeGlint${suffix}`,
      materials.eyeWhite,
      [side * 0.066, 0.094, 0.185],
      [0.009, 0.011, 0.008],
    );
    addCuboid(
      head,
      `Cheek${suffix}`,
      materials.muzzle,
      [side * 0.052, 0.013, 0.163],
      [0.108, 0.074, 0.052],
    );
  }

  addCuboid(head, 'FaceMask', materials.mask, [0, 0.082, 0.14], [0.29, 0.12, 0.034]);
  addCuboid(head, 'MuzzleBridge', materials.muzzle, [0, 0.04, 0.169], [0.085, 0.045, 0.035]);
  addCuboid(head, 'Nose', materials.nose, [0, 0.038, 0.202], [0.048, 0.03, 0.025]);
}

function addForelegs(root, materials, greetingArmRotation) {
  for (const [side, suffix] of [
    [-1, 'L'],
    [1, 'R'],
  ]) {
    const foreleg = new THREE.Group();
    foreleg.name = `Foreleg${suffix}`;
    foreleg.position.set(side * 0.13, 0.43, 0.135);
    foreleg.rotation.z = suffix === 'L' ? greetingArmRotation : -0.1;
    root.add(foreleg);

    addCuboid(foreleg, `Arm${suffix}`, materials.furLight, [0, -0.075, 0.015], [0.09, 0.17, 0.105]);
    addCuboid(foreleg, `Wrist${suffix}`, materials.fur, [0, -0.145, 0.055], [0.095, 0.08, 0.09]);
    addCuboid(foreleg, `Hand${suffix}`, materials.paw, [0, -0.17, 0.095], [0.105, 0.065, 0.085]);
  }
}

function addTail(root, materials, tailSide, tailCurl) {
  const tail = new THREE.Group();
  tail.name = 'Tail_Banded';
  tail.position.set(tailSide * 0.105, 0.11, -0.1);
  root.add(tail);

  const tailSegments = [
    { offset: 0, height: 0, depth: 0, size: 0.18, material: materials.furDark },
    { offset: 0.1, height: -0.005, depth: 0, size: 0.17, material: materials.muzzle },
    { offset: 0.2, height: -0.015, depth: 0.01, size: 0.16, material: materials.furLight },
    {
      offset: 0.3,
      height: 0.005 + tailCurl,
      depth: 0.015,
      size: 0.15,
      material: materials.muzzle,
    },
    {
      offset: 0.4,
      height: 0.025 + tailCurl,
      depth: 0.02,
      size: 0.14,
      material: materials.furDark,
    },
  ];

  tailSegments.forEach((segment, index) => {
    const centerX = tailSide * segment.offset;
    const centerY = segment.height;
    const angle = tailSide * (index < 2 ? 0.22 : -0.16);
    const stripe = addCuboid(
      tail,
      `TailBand${index + 1}`,
      segment.material,
      [centerX, centerY, segment.depth],
      [segment.size, segment.size * 0.92, segment.size],
      [0, angle, 0],
    );
    stripe.userData.tailBandIndex = index;
  });
}

function addNoteCard(root, materials) {
  const card = new THREE.Group();
  card.name = 'ProjectNote';
  card.position.set(0, 0.365, 0.225);
  card.rotation.y = -0.06;
  root.add(card);

  addCuboid(card, 'Paper', materials.note, [0, 0, 0], [0.215, 0.205, 0.028]);
  addCuboid(card, 'PaperEdge', materials.noteEdge, [0, -0.087, 0.017], [0.17, 0.012, 0.008]);
  addCuboid(card, 'HouseBody', materials.noteEdge, [0, 0.005, 0.02], [0.072, 0.057, 0.008]);
  addCuboid(card, 'HouseDoor', materials.note, [0, -0.009, 0.025], [0.018, 0.032, 0.006]);
  addCuboid(
    card,
    'HouseRoofLeft',
    materials.noteEdge,
    [-0.022, 0.044, 0.02],
    [0.048, 0.012, 0.008],
    [0, 0, -0.62],
  );
  addCuboid(
    card,
    'HouseRoofRight',
    materials.noteEdge,
    [0.022, 0.044, 0.02],
    [0.048, 0.012, 0.008],
    [0, 0, 0.62],
  );
}

function addCuboid(parent, name, material, position, size, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function installFileReaderPolyfill() {
  if (typeof globalThis.FileReader !== 'undefined') return;

  globalThis.FileReader = class NodeFileReader {
    result = null;
    error = null;
    onload = null;
    onloadend = null;
    onerror = null;

    readAsArrayBuffer(blob) {
      void blob.arrayBuffer().then(
        (buffer) => this.finish(buffer),
        (error) => this.fail(error),
      );
    }

    readAsDataURL(blob) {
      void blob.arrayBuffer().then(
        (buffer) =>
          this.finish(`data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`),
        (error) => this.fail(error),
      );
    }

    finish(result) {
      this.result = result;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    }

    fail(error) {
      this.error = error;
      this.onerror?.({ target: this });
      this.onloadend?.({ target: this });
    }
  };
}
