import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Quaternion,
  Raycaster,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  RepeatWrapping,
  Texture,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Theme } from '../../../core/ui/theme/theme.service';
import { replaceSemanticModel } from './scene-attachment';
import { firstSemanticHit } from './scene-hit-test';

type MaterialRole =
  'wood' | 'woodDark' | 'wall' | 'floor' | 'cream' | 'metal' | 'leaf' | 'glass' | 'linen';

interface Palette {
  readonly wood: string;
  readonly woodDark: string;
  readonly wall: string;
  readonly floor: string;
  readonly cream: string;
  readonly metal: string;
  readonly leaf: string;
  readonly glass: string;
  readonly linen: string;
  readonly sky: string;
  readonly daylight: string;
}

const palettes: Record<Theme, Palette> = {
  craft: {
    wood: '#a9612d',
    woodDark: '#61391f',
    wall: '#d4a878',
    floor: '#bb7640',
    cream: '#f1d5ad',
    metal: '#637b55',
    leaf: '#588a2d',
    glass: '#62c5e9',
    linen: '#e8ddbd',
    sky: '#82c9ef',
    daylight: '#fff0b9',
  },
  light: {
    wood: '#c6a17a',
    woodDark: '#79614c',
    wall: '#eee4d4',
    floor: '#d9b58b',
    cream: '#fff8eb',
    metal: '#8ea3a7',
    leaf: '#719d73',
    glass: '#a5dbe7',
    linen: '#fff7e8',
    sky: '#a8dcf4',
    daylight: '#fff7db',
  },
  raccoon: {
    wood: '#967865',
    woodDark: '#5b4c45',
    wall: '#d2c2b5',
    floor: '#aa8e79',
    cream: '#e9dcd0',
    metal: '#7b7773',
    leaf: '#718669',
    glass: '#aad6df',
    linen: '#efe8df',
    sky: '#c0d6dd',
    daylight: '#ffe3ad',
  },
  dark: {
    wood: '#4b5260',
    woodDark: '#29313e',
    wall: '#647080',
    floor: '#455263',
    cream: '#a6b3c2',
    metal: '#74869b',
    leaf: '#45687b',
    glass: '#80abd8',
    linen: '#aeb9c7',
    sky: '#172c56',
    daylight: '#aecaff',
  },
};

const detailNames = [
  'washer-body',
  'washer-portal',
  'shelf-wood',
  'outside-door',
  'outside-window',
  'awning',
  'chalkboard',
  'vine-left',
  'board-top-vines',
  'basket-body',
  'raccoon-standing',
  'raccoon-seated',
] as const;
type DetailName = (typeof detailNames)[number];

export interface HomeSceneMetrics {
  readonly calls: number;
  readonly triangles: number;
  readonly textures: number;
  readonly geometries: number;
}

export interface HomeBoardRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export class HomeSceneView {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 100);
  private readonly renderer: WebGLRenderer;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly materials = new Map<MaterialRole, MeshStandardMaterial>();
  private readonly geometry = new Set<import('three').BufferGeometry>();
  private readonly anchors = new Map<string, Object3D>();
  private readonly detailSurfaces = new Map<DetailName, Mesh>();
  private readonly paintedTextures = new Map<MaterialRole, CanvasTexture>();
  private exteriorTexture?: CanvasTexture;
  private readonly moon = new DirectionalLight('#b3d4ff', 0);
  private readonly sun = new DirectionalLight('#fff0c0', 2);
  private readonly lamp = new PointLight('#ffc86b', 0, 20);
  private readonly bulbs: MeshStandardMaterial[] = [];
  private readonly resizeObserver: ResizeObserver;
  private activeTextures: Texture[] = [];
  private loadAbort?: AbortController;
  private activeTheme: Theme = 'craft';
  private epoch = 0;
  private frame = 0;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onBoardLayout: (rect: HomeBoardRect) => void,
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.camera.position.set(0, 5.8, 17.5);
    this.camera.lookAt(0, 3.8, -2.3);
    this.sun.position.set(-6, 10, 7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -12;
    this.sun.shadow.camera.right = 12;
    this.sun.shadow.camera.top = 12;
    this.sun.shadow.camera.bottom = -12;
    this.moon.position.set(8, 8, -10);
    this.lamp.position.set(-1, 8, 1);
    this.scene.add(new AmbientLight('#ffffff', 0.8), this.sun, this.moon, this.lamp);
    this.buildRoom();
    this.buildWasher();
    this.buildBoard();
    this.buildShelf();
    this.buildBasket();
    this.buildPlants();
    this.buildMascots();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  async setTheme(theme: Theme): Promise<void> {
    const epoch = ++this.epoch;
    this.loadAbort?.abort();
    const loadAbort = new AbortController();
    this.loadAbort = loadAbort;
    const palette = palettes[theme];
    const paths = detailNames.map(
      (name) => `assets/homepage/runtime/${theme === 'craft' ? 'minecraft' : theme}/${name}.png`,
    );
    const loaded = await Promise.allSettled(
      paths.map((path) => this.loadTexture(path, loadAbort.signal)),
    );
    const failure = loaded.find((result) => result.status === 'rejected');
    if (failure) {
      loaded.forEach((result) => {
        if (result.status === 'fulfilled') result.value.dispose();
      });
      if (this.disposed || epoch !== this.epoch) return;
      throw new Error('Homepage theme assets could not be loaded', { cause: failure.reason });
    }
    const textures = loaded.map((result) => {
      if (result.status !== 'fulfilled') throw new Error('Unexpected theme load state');
      return result.value;
    });
    if (this.disposed || epoch !== this.epoch) {
      textures.forEach((texture) => texture.dispose());
      return;
    }
    textures.forEach((texture, index) => {
      texture.colorSpace = SRGBColorSpace;
      const surface = this.detailSurfaces.get(detailNames[index]);
      if (surface) {
        (surface.material as MeshStandardMaterial).dispose();
        surface.material = new MeshStandardMaterial({
          map: texture,
          transparent: true,
          side: DoubleSide,
          roughness: 0.9,
        });
      }
    });
    const previous = this.activeTextures;
    this.activeTextures = textures;
    this.activeTheme = theme;
    this.canvas.dataset['theme'] = theme;
    previous.forEach((texture) => texture.dispose());
    for (const [role, material] of this.materials) {
      material.color.set(palette[role]);
    }
    this.exteriorTexture?.dispose();
    this.exteriorTexture = this.paintExterior(palette);
    const exterior = this.scene.getObjectByName('exterior.sky');
    if (exterior instanceof Mesh && exterior.material instanceof MeshStandardMaterial) {
      exterior.material.map = this.exteriorTexture;
      exterior.material.color.set('#ffffff');
      exterior.material.needsUpdate = true;
    }
    this.scene.background = new Color(this.canvas.clientWidth < 700 ? palette.wall : palette.sky);
    this.sun.intensity = theme === 'dark' ? 0 : theme === 'raccoon' ? 1.35 : 2;
    this.moon.intensity = theme === 'dark' ? 1.65 : 0;
    this.lamp.intensity = theme === 'dark' ? 0 : 1.15;
    this.bulbs.forEach((bulb) => {
      bulb.color.set(theme === 'dark' ? '#263644' : '#ffe6a6');
      bulb.emissiveIntensity = theme === 'dark' ? 0 : 2.5;
    });
    this.requestRender();
  }

  hitTest(clientX: number, clientY: number): string | undefined {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return firstSemanticHit(this.raycaster, this.scene.children);
  }

  getMetrics(): HomeSceneMetrics {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      textures: this.renderer.info.memory.textures,
      geometries: this.renderer.info.memory.geometries,
    };
  }

  getAnchor(id: string): Object3D | undefined {
    return this.anchors.get(id);
  }

  replaceModel(id: string, replacement: Object3D, attachmentIds: readonly string[]): void {
    const previous = this.anchors.get(id);
    if (!previous) throw new Error(`Unknown semantic model: ${id}`);
    replaceSemanticModel(previous, replacement, attachmentIds);
    this.anchors.set(id, replacement);
    for (const anchorId of attachmentIds) {
      const anchor = replacement.getObjectByName(anchorId);
      if (anchor) this.anchors.set(anchorId, anchor);
    }
    this.requestRender();
  }

  dispose(): void {
    this.disposed = true;
    this.canvas.dataset['disposed'] = 'true';
    ++this.epoch;
    this.loadAbort?.abort();
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.scene.traverse((node) => {
      if (node instanceof Mesh) {
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.geometry.forEach((geometry) => geometry.dispose());
    this.activeTextures.forEach((texture) => texture.dispose());
    this.paintedTextures.forEach((texture) => texture.dispose());
    this.exteriorTexture?.dispose();
    this.sun.shadow.map?.dispose();
    this.renderer.dispose();
  }

  private async loadTexture(path: string, signal: AbortSignal): Promise<Texture> {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error(`Could not load homepage texture: ${path}`);
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: 'flipY' });
    if (signal.aborted) {
      bitmap.close();
      throw new DOMException('Homepage texture load canceled', 'AbortError');
    }
    const texture = new Texture(bitmap);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    texture.addEventListener('dispose', () => bitmap.close());
    return texture;
  }

  private material(role: MaterialRole): MeshStandardMaterial {
    let material = this.materials.get(role);
    if (!material) {
      const map = this.paintSurface(role);
      this.paintedTextures.set(role, map);
      material = new MeshStandardMaterial({
        color: palettes.craft[role],
        map,
        roughness: role === 'glass' ? 0.25 : 0.85,
        metalness: role === 'metal' ? 0.32 : 0,
      });
      this.materials.set(role, material);
    }
    return material;
  }

  private add(
    parent: Object3D,
    id: string,
    geometry: import('three').BufferGeometry,
    role: MaterialRole,
    x: number,
    y: number,
    z: number,
  ): Mesh {
    const mesh = new Mesh(geometry, this.material(role));
    mesh.name = id;
    mesh.position.set(x, y, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    parent.add(mesh);
    this.geometry.add(geometry);
    return mesh;
  }

  private box(
    parent: Object3D,
    id: string,
    role: MaterialRole,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    radius = 0,
  ): Mesh {
    const geometry = radius ? new RoundedBoxGeometry(w, h, d, 3, radius) : new BoxGeometry(w, h, d);
    return this.add(parent, id, geometry, role, x, y, z);
  }

  private paintedSurface(
    parent: Object3D,
    id: string,
    detail: DetailName,
    width: number,
    height: number,
    x: number,
    y: number,
    z: number,
  ): Mesh {
    const geometry = new PlaneGeometry(width, height);
    const surface = new Mesh(
      geometry,
      new MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        roughness: 0.9,
      }),
    );
    surface.name = id;
    surface.position.set(x, y, z);
    parent.add(surface);
    this.geometry.add(geometry);
    this.detailSurfaces.set(detail, surface);
    return surface;
  }

  private instances(
    parent: Object3D,
    id: string,
    geometry: import('three').BufferGeometry,
    role: MaterialRole,
    transforms: readonly { position: Vector3; rotationY?: number; scale?: Vector3 }[],
  ): InstancedMesh {
    const mesh = new InstancedMesh(geometry, this.material(role), transforms.length);
    mesh.name = id;
    mesh.receiveShadow = true;
    const matrix = new Matrix4();
    const axis = new Vector3(0, 1, 0);
    for (const [index, transform] of transforms.entries()) {
      matrix.compose(
        transform.position,
        new Quaternion().setFromAxisAngle(axis, transform.rotationY ?? 0),
        transform.scale ?? new Vector3(1, 1, 1),
      );
      mesh.setMatrixAt(index, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    parent.add(mesh);
    this.geometry.add(geometry);
    return mesh;
  }

  private group(id: string, parent: Object3D = this.scene): Group {
    const group = new Group();
    group.name = id;
    group.userData['semanticId'] = id;
    parent.add(group);
    this.anchors.set(id, group);
    return group;
  }

  private buildRoom(): void {
    const room = this.group('room');
    this.box(room, 'floor', 'floor', 16, 0.35, 12, 0, -0.2, 0);
    for (const role of ['wood', 'floor'] as const) {
      const positions = Array.from({ length: 16 }, (_, index) => index)
        .filter((index) => (index % 3 === 0 ? 'wood' : 'floor') === role)
        .map((index) => ({ position: new Vector3(-7.5 + index, 0, 0) }));
      this.instances(
        room,
        `floor.planks.${role}`,
        new BoxGeometry(1.01, 0.035, 12),
        role,
        positions,
      );
    }
    this.box(room, 'wall.left', 'wall', 0.38, 9, 12, -8, 4.5, 0);
    this.box(room, 'wall.right', 'wall', 0.38, 9, 12, 8, 4.5, 0);
    this.box(room, 'ceiling', 'woodDark', 16, 0.3, 12, 0, 9, 0);
    for (let z = -5.8; z <= 5.8; z += 3.8)
      this.box(room, `ceiling.beam.${z}`, 'wood', 16, 0.42, 0.5, 0, 8.72, z);
    // The rear wall has physical door and window gaps; exterior sits behind them.
    this.box(room, 'wall.rear.left', 'wall', 1, 9, 0.35, -7.5, 4.5, -6);
    this.box(room, 'wall.rear.middle', 'wall', 8.2, 9, 0.35, -0.3, 4.5, -6);
    this.box(room, 'wall.rear.right', 'wall', 1, 9, 0.35, 7.5, 4.5, -6);
    this.box(room, 'wall.over-door', 'wall', 2.3, 2.6, 0.35, -5.85, 7.7, -6);
    this.box(room, 'wall.below-window', 'wall', 3.8, 2.35, 0.35, 5.35, 1.175, -6);
    this.box(room, 'wall.above-window', 'wall', 3.8, 2.5, 0.35, 5.35, 7.75, -6);
    const exterior = this.group('exterior');
    exterior.name = 'exterior';
    const sky = this.box(exterior, 'exterior.sky', 'glass', 16, 9, 0.1, 0, 4.5, -8);
    sky.material = new MeshStandardMaterial({ color: '#ffffff', roughness: 1, side: DoubleSide });
    this.paintedSurface(
      exterior,
      'exterior.door-painting',
      'outside-door',
      2.4,
      6.35,
      -5.85,
      3.18,
      -6.85,
    );
    this.paintedSurface(
      exterior,
      'exterior.window-painting',
      'outside-window',
      3.2,
      4.4,
      5.35,
      4.35,
      -6.85,
    );
    for (let i = 0; i < 7; i++) {
      const tree = this.add(
        exterior,
        `exterior.tree.${i}`,
        new ConeGeometry(0.7 + (i % 3) * 0.25, 3 + (i % 2), 7),
        'leaf',
        -8 + i * 2.7,
        2.2,
        -7.5,
      );
      tree.castShadow = false;
    }
    const door = this.group('room.door-opening', room);
    door.position.set(-5.85, 0, -5.65);
    this.paintedSurface(door, 'door.painted-awning', 'awning', 2.8, 1.35, 0, 6.95, 0.48);
    this.box(door, 'door.jamb.left', 'woodDark', 0.28, 6.5, 0.4, -1.2, 3.25, 0);
    this.box(door, 'door.jamb.right', 'woodDark', 0.28, 6.5, 0.4, 1.2, 3.25, 0);
    this.box(door, 'door.lintel', 'wood', 2.7, 0.32, 0.45, 0, 6.5, 0);
    const leaf = this.box(door, 'door.leaf', 'wood', 1.85, 5.9, 0.18, -1.05, 2.95, 0.75);
    leaf.castShadow = true;
    leaf.rotation.y = -0.78;
    for (let y = 1.5; y < 5.8; y += 1.45)
      this.box(
        door,
        `door.crosspiece.${y}`,
        'woodDark',
        1.8,
        0.16,
        0.24,
        -1.05,
        y,
        0.88,
      ).rotation.y = -0.78;
    const window = this.group('room.window-opening', room);
    window.position.set(5.35, 4.35, -5.6);
    this.box(window, 'window.frame.left', 'woodDark', 0.28, 4.2, 0.48, -2, 0, 0);
    this.box(window, 'window.frame.right', 'woodDark', 0.28, 4.2, 0.48, 2, 0, 0);
    this.box(window, 'window.frame.top', 'woodDark', 4.25, 0.3, 0.48, 0, 2.1, 0);
    this.box(window, 'window.sill', 'wood', 4.4, 0.34, 0.7, 0, -2.1, 0.1);
    for (const x of [-0.7, 0.7])
      this.box(window, `window.mullion.${x}`, 'wood', 0.16, 4, 0.3, x, 0, 0.2);
    this.box(window, 'window.crossbar', 'wood', 4, 0.17, 0.3, 0, 0.35, 0.2);
    this.paintedSurface(room, 'wall.chalkboard', 'chalkboard', 0.95, 1.9, -3.65, 5.55, -5.62);
    for (const x of [-3.8, 3.7]) {
      const light = this.group(`lamp.${x}`, room);
      light.position.set(x, 8.7, 1.7);
      this.add(
        light,
        'lamp.cord',
        new CylinderGeometry(0.045, 0.045, 1.25, 8),
        'woodDark',
        0,
        -0.65,
        0,
      );
      this.add(
        light,
        'lamp.shade',
        new ConeGeometry(0.62, 0.65, 16, 1, true),
        'leaf',
        0,
        -1.38,
        0,
      ).rotation.z = Math.PI;
      const bulbMaterial = new MeshStandardMaterial({
        color: '#ffe6a6',
        emissive: '#ffcb5c',
        emissiveIntensity: 2.5,
      });
      const bulb = new Mesh(new SphereGeometry(0.22, 16, 12), bulbMaterial);
      bulb.position.y = -1.68;
      light.add(bulb);
      this.geometry.add(bulb.geometry);
      this.bulbs.push(bulbMaterial);
    }
  }

  private paintSurface(role: MaterialRole): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is required for painted homepage materials');
    ctx.fillStyle = '#f7f2e9';
    ctx.fillRect(0, 0, 256, 256);
    let seed =
      role.split('').reduce((value, letter) => value * 33 + letter.charCodeAt(0), 19) >>> 0;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const wood = role === 'wood' || role === 'woodDark' || role === 'floor';
    if (wood) {
      for (let i = 0; i < 75; i++) {
        const y = random() * 256;
        ctx.strokeStyle = i % 4 ? 'rgba(95,47,19,.11)' : 'rgba(255,255,255,.22)';
        ctx.lineWidth = 0.5 + random() * 2.3;
        ctx.beginPath();
        ctx.moveTo(-10, y);
        ctx.bezierCurveTo(
          65,
          y - 9 + random() * 18,
          175,
          y - 8 + random() * 16,
          266,
          y - 5 + random() * 10,
        );
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const x = random() * 256,
          y = random() * 256;
        ctx.strokeStyle = 'rgba(75,38,15,.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 6 + random() * 13, 2 + random() * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 1300; i++) {
        const shade = role === 'wall' ? 'rgba(104,71,51,.075)' : 'rgba(68,61,49,.10)';
        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.ellipse(
          random() * 256,
          random() * 256,
          0.4 + random() * 2.2,
          0.4 + random() * 1.2,
          random() * Math.PI,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      if (role === 'wall' || role === 'linen') {
        for (let i = 0; i < 36; i++) {
          ctx.strokeStyle = 'rgba(255,255,255,.16)';
          ctx.lineWidth = 3 + random() * 8;
          ctx.beginPath();
          const x = random() * 256,
            y = random() * 256;
          ctx.moveTo(x, y);
          ctx.lineTo(x + random() * 32, y - random() * 8);
          ctx.stroke();
        }
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  private paintExterior(palette: Palette): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is required for homepage exterior');
    const gradient = ctx.createLinearGradient(0, 0, 0, 576);
    gradient.addColorStop(0, palette.sky);
    gradient.addColorStop(0.75, palette.daylight);
    gradient.addColorStop(1, palette.leaf);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 576);
    ctx.fillStyle = 'rgba(255,251,228,.7)';
    for (const [x, y, size] of [
      [130, 130, 1],
      [400, 190, 0.8],
      [720, 95, 1.15],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 70 * size, 22 * size, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 25 * size, y - 14 * size, 32 * size, 27 * size, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 28 * size, y - 9 * size, 43 * size, 24 * size, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = palette.woodDark;
    for (const [x, height, width] of [
      [290, 250, 42],
      [620, 335, 58],
      [775, 285, 38],
    ]) {
      ctx.fillRect(x, 520 - height, width, height);
      ctx.beginPath();
      ctx.moveTo(x - 13, 520 - height);
      ctx.lineTo(x + width / 2, 485 - height);
      ctx.lineTo(x + width + 13, 520 - height);
      ctx.fill();
    }
    ctx.fillStyle = palette.leaf;
    for (let i = 0; i < 44; i++) {
      const x = ((i * 137) % 1100) - 30;
      const y = 480 + ((i * 37) % 100);
      ctx.beginPath();
      ctx.arc(x, y, 24 + (i % 4) * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  private buildWasher(): void {
    const washer = this.group('washer');
    washer.position.set(-3.35, 0, -1.8);
    this.box(washer, 'washer.body', 'cream', 4.5, 3.9, 2.75, 0, 1.95, 0, 0.22).castShadow = true;
    this.box(washer, 'washer.base', 'metal', 4.45, 0.22, 2.8, 0, 0.14, 0);
    this.box(washer, 'washer.control-panel', 'linen', 4.25, 0.65, 0.08, 0, 3.42, 1.42, 0.08);
    const bodyFace = this.add(
      washer,
      'washer.painted-front',
      new PlaneGeometry(4.5, 3.9),
      'cream',
      0,
      1.95,
      1.49,
    );
    bodyFace.material = new MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });
    this.detailSurfaces.set('washer-body', bodyFace);
    const portal = this.add(
      washer,
      'washer.portal',
      new CircleGeometry(1.48, 64),
      'glass',
      -0.42,
      1.78,
      1.46,
    );
    portal.material = new MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      roughness: 0.2,
      side: DoubleSide,
    });
    this.detailSurfaces.set('washer-portal', portal);
    this.add(
      washer,
      'washer.door.rim',
      new TorusGeometry(1.58, 0.17, 12, 64),
      'metal',
      -0.42,
      1.78,
      1.52,
    );
    this.add(
      washer,
      'washer.door.outer-rim',
      new TorusGeometry(1.84, 0.07, 8, 64),
      'woodDark',
      -0.42,
      1.78,
      1.41,
    );
    const dial = this.add(
      washer,
      'washer.dial',
      new CylinderGeometry(0.34, 0.34, 0.18, 32),
      'metal',
      1.4,
      3.43,
      1.52,
    );
    dial.rotation.x = Math.PI / 2;
    for (let y = 3.1; y < 3.6; y += 0.32)
      this.add(
        washer,
        `washer.button.${y}`,
        new SphereGeometry(0.105, 12, 8),
        'leaf',
        0.85,
        y,
        1.51,
      );
    const top = this.group('washer.top.surface', washer);
    top.position.set(0, 3.94, 0);
    this.box(top, 'towel.fold.green', 'leaf', 1.1, 0.13, 0.72, -0.6, 0.08, 0, 0.07);
    this.box(top, 'towel.fold.white', 'linen', 1.1, 0.12, 0.72, 0.57, 0.08, 0, 0.06);
    this.add(
      top,
      'washer.plant.pot',
      new CylinderGeometry(0.23, 0.19, 0.35, 9),
      'wood',
      -1.65,
      0.2,
      0.12,
    );
    this.instances(
      top,
      'washer.plant.leaves',
      new SphereGeometry(0.17, 8, 6),
      'leaf',
      Array.from({ length: 8 }, (_, i) => ({
        position: new Vector3(
          -1.65 + Math.cos(i) * 0.24,
          0.48 + (i % 3) * 0.1,
          0.12 + Math.sin(i) * 0.24,
        ),
      })),
    );
  }

  private buildBoard(): void {
    const board = this.group('board');
    board.position.set(2.3, 3.35, -3.6);
    this.box(board, 'board.substrate', 'woodDark', 7.55, 5.3, 0.4, 0, 0, 0.12).castShadow = true;
    this.box(board, 'board.surface', 'wood', 7.1, 4.86, 0.08, 0, 0, 0.24);
    for (const x of [-3.7, 3.7])
      this.box(board, `board.frame.side.${x}`, 'woodDark', 0.24, 5.5, 0.48, x, 0, 0.2);
    for (const y of [-2.62, 2.62])
      this.box(board, `board.frame.edge.${y}`, 'woodDark', 7.55, 0.25, 0.48, 0, y, 0.2);
    this.box(board, 'board.ledge', 'wood', 7.7, 0.24, 0.8, 0, -2.76, 0.55);
    this.paintedSurface(
      board,
      'board.painted-vines',
      'board-top-vines',
      2.15,
      0.55,
      1.75,
      2.75,
      0.55,
    );
  }

  private buildShelf(): void {
    const shelf = this.group('shelf');
    shelf.position.set(-6.7, 0, -3.8);
    for (const x of [-0.83, 0.83])
      this.box(shelf, `shelf.post.${x}`, 'woodDark', 0.2, 6.25, 1.65, x, 3.12, 0).castShadow = true;
    for (let i = 0; i < 4; i++) {
      const surface = this.group(`shelf.surface.${i}`, shelf);
      surface.position.set(0, 1.15 + i * 1.43, 0);
      this.box(surface, 'shelf.plank', 'wood', 1.9, 0.18, 1.85, 0, 0, 0);
      if (i < 3) {
        for (let j = 0; j < 3; j++)
          this.box(
            surface,
            `shelf.towel.${j}`,
            j % 2 ? 'leaf' : 'linen',
            0.4,
            0.12,
            0.75,
            -0.5 + j * 0.48,
            0.17,
            0,
            0.05,
          );
      } else {
        this.add(
          surface,
          'shelf.bottle',
          new CylinderGeometry(0.18, 0.17, 0.72, 10),
          'glass',
          0,
          0.44,
          0,
        );
      }
    }
    const paintedFront = this.add(
      shelf,
      'shelf.painted-front',
      new PlaneGeometry(1.9, 6.1),
      'wood',
      0,
      3.12,
      0.96,
    );
    paintedFront.material = new MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });
    this.detailSurfaces.set('shelf-wood', paintedFront);
    this.paintedSurface(shelf, 'shelf.painted-vine', 'vine-left', 1.25, 3.1, 0.05, 5.18, 1.02);
  }

  private buildBasket(): void {
    const basket = this.group('basket');
    basket.position.set(0.25, 0, 2.25);
    this.box(basket, 'basket.shell', 'linen', 1.72, 1.15, 1.28, 0, 0.58, 0, 0.18).castShadow = true;
    this.box(basket, 'basket.inner-shadow', 'woodDark', 1.3, 0.07, 0.93, 0, 1.16, 0);
    this.box(basket, 'basket.top-lip', 'linen', 1.82, 0.14, 1.4, 0, 1.18, 0, 0.06);
    this.paintedSurface(basket, 'basket.painted-front', 'basket-body', 1.75, 1.22, 0, 0.61, 0.67);
    this.box(basket, 'basket.laundry', 'linen', 0.85, 0.35, 0.62, 0, 1.32, 0, 0.15);
  }

  private buildPlants(): void {
    for (const [index, x, z] of [
      [0, -7.3, 2.8],
      [1, 7.1, 1.8],
      [2, 6.7, -4.7],
    ]) {
      const plant = this.group(`plant.${index}`);
      plant.position.set(x, 0, z);
      this.add(plant, 'pot', new CylinderGeometry(0.36, 0.28, 0.65, 8), 'wood', 0, 0.32, 0);
      this.instances(
        plant,
        'plant.leaves',
        new SphereGeometry(0.23, 8, 6),
        'leaf',
        Array.from({ length: 11 }, (_, i) => {
          const angle = i * 2.4;
          return {
            position: new Vector3(
              Math.cos(angle) * (0.25 + i * 0.035),
              0.85 + (i % 4) * 0.25,
              Math.sin(angle) * (0.25 + i * 0.035),
            ),
            scale: new Vector3(0.7, 1.4, 0.65),
          };
        }),
      );
    }
  }

  private buildMascots(): void {
    for (const [name, x, z, scale] of [
      ['raccoon-standing', -6.45, 3.7, 1.8],
      ['raccoon-seated', 6.35, 3.35, 1.65],
    ] as const) {
      const mascot = this.group(name);
      mascot.position.set(x, 0, z);
      this.add(
        mascot,
        `${name}.body`,
        new SphereGeometry(0.55, 20, 16),
        'linen',
        0,
        scale * 0.46,
        -0.15,
      ).scale.set(1, 1.25, 0.6);
      for (const side of [-1, 1]) {
        this.add(
          mascot,
          `${name}.ear.${side}`,
          new SphereGeometry(0.22, 12, 10),
          'woodDark',
          side * 0.34,
          scale * 0.84,
          -0.1,
        );
        this.add(
          mascot,
          `${name}.foot.${side}`,
          new SphereGeometry(0.24, 12, 10),
          'woodDark',
          side * 0.3,
          0.15,
          0.15,
        );
      }
      const card = this.add(
        mascot,
        `${name}.illustration`,
        new PlaneGeometry(scale * 1.24, scale * 1.25),
        'linen',
        0,
        scale * 0.62,
        0.35,
      );
      card.material = new MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        side: DoubleSide,
      });
      this.detailSurfaces.set(name, card);
    }
  }

  private resize(): void {
    if (this.disposed) return;
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.camera.aspect = width / height;
    if (width < 700) {
      this.camera.position.set(-1.2, 5.4, 24);
      this.camera.fov = 42;
    } else {
      this.camera.position.set(0, 5.8, 17.5);
      this.camera.fov = 38;
    }
    this.camera.lookAt(width < 700 ? -1.2 : 0, 3.8, -2.3);
    this.camera.updateProjectionMatrix();
    const palette = palettes[this.activeTheme];
    this.scene.background = new Color(width < 700 ? palette.wall : palette.sky);
    this.renderer.setSize(width, height, false);
    this.onBoardLayout(this.projectBoardRect());
    this.requestRender();
  }

  private projectBoardRect(): HomeBoardRect {
    const board = this.anchors.get('board');
    if (!board) throw new Error('Homepage board anchor is missing');
    board.updateWorldMatrix(true, false);
    this.camera.updateMatrixWorld();
    const bounds = this.canvas.getBoundingClientRect();
    const points = [
      new Vector3(-3.42, 2.32, 0.55),
      new Vector3(3.42, 2.32, 0.55),
      new Vector3(-3.42, -2.3, 0.55),
      new Vector3(3.42, -2.3, 0.55),
    ].map((point) => {
      point.applyMatrix4(board.matrixWorld).project(this.camera);
      return {
        x: bounds.left + ((point.x + 1) * bounds.width) / 2,
        y: bounds.top + ((1 - point.y) * bounds.height) / 2,
      };
    });
    const left = Math.min(...points.map((point) => point.x));
    const right = Math.max(...points.map((point) => point.x));
    const top = Math.min(...points.map((point) => point.y));
    const bottom = Math.max(...points.map((point) => point.y));
    return { left, top, width: right - left, height: bottom - top };
  }

  private requestRender(): void {
    if (this.frame || this.disposed) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.renderer.render(this.scene, this.camera);
      const metrics = this.getMetrics();
      this.canvas.dataset['drawCalls'] = String(metrics.calls);
      this.canvas.dataset['triangles'] = String(metrics.triangles);
      this.canvas.dataset['textureCount'] = String(metrics.textures);
      this.canvas.dataset['geometryCount'] = String(metrics.geometries);
    });
  }
}
