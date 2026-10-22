export type HomepageArtworkTheme = 'minecraft' | 'light' | 'raccoon' | 'dark';

export type HomepageLayerKind =
  | 'inferred-hidden-fill'
  | 'source-visible-background'
  | 'source-visible'
  | 'source-visible-edge';

export interface HomepageSceneAsset {
  readonly id: string;
  readonly file: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
  readonly parent: string | null;
  readonly kind: HomepageLayerKind;
  readonly interactive: boolean;
}

export interface HomepageThemeManifest {
  readonly source: string;
  readonly assets: readonly HomepageSceneAsset[];
}

export interface HomepageSceneManifest {
  readonly canvas: { readonly width: number; readonly height: number };
  readonly groups: Readonly<Record<string, string>>;
  readonly themes: Readonly<Record<HomepageArtworkTheme, HomepageThemeManifest>>;
}

const artworkThemes: readonly HomepageArtworkTheme[] = [
  'minecraft',
  'light',
  'raccoon',
  'dark',
];

const layerKinds: readonly HomepageLayerKind[] = [
  'inferred-hidden-fill',
  'source-visible-background',
  'source-visible',
  'source-visible-edge',
];

export function parseHomepageSceneManifest(value: unknown): HomepageSceneManifest {
  if (!isRecord(value)) throw new Error('Homepage scene manifest must be an object.');

  const canvas = parseCanvas(value['canvas']);
  const groups = parseGroups(value['groups']);
  const rawThemes = value['themes'];
  if (!isRecord(rawThemes)) throw new Error('Homepage scene themes are missing.');

  const actualThemes = Object.keys(rawThemes).sort();
  if (actualThemes.join(',') !== [...artworkThemes].sort().join(',')) {
    throw new Error(`Unexpected homepage scene themes: ${actualThemes.join(', ')}.`);
  }

  const themes = Object.fromEntries(
    artworkThemes.map((theme) => [theme, parseTheme(theme, rawThemes[theme], canvas)]),
  ) as Record<HomepageArtworkTheme, HomepageThemeManifest>;

  return { canvas, groups, themes };
}

function parseCanvas(value: unknown): HomepageSceneManifest['canvas'] {
  if (!isRecord(value)) throw new Error('Homepage scene canvas is missing.');
  const width = positiveInteger(value['width'], 'canvas width');
  const height = positiveInteger(value['height'], 'canvas height');
  return { width, height };
}

function parseGroups(value: unknown): Readonly<Record<string, string>> {
  if (!isRecord(value)) throw new Error('Homepage scene groups are missing.');
  const groups: Record<string, string> = {};
  for (const [id, label] of Object.entries(value)) {
    if (!id || typeof label !== 'string' || label.length === 0) {
      throw new Error('Homepage scene group identifiers and labels must be non-empty.');
    }
    groups[id] = label;
  }
  return groups;
}

function parseTheme(
  theme: HomepageArtworkTheme,
  value: unknown,
  canvas: HomepageSceneManifest['canvas'],
): HomepageThemeManifest {
  if (!isRecord(value)) throw new Error(`Homepage scene theme ${theme} is invalid.`);
  const source = value['source'];
  if (typeof source !== 'string' || !source.startsWith('reference/')) {
    throw new Error(`Homepage scene theme ${theme} has an invalid reference path.`);
  }
  const rawAssets = value['assets'];
  if (!Array.isArray(rawAssets) || rawAssets.length === 0) {
    throw new Error(`Homepage scene theme ${theme} has no layers.`);
  }

  const assets = rawAssets.map((asset, index) => parseAsset(theme, asset, index, canvas));
  const assetIds = new Set(assets.map((asset) => asset.id));
  if (assetIds.size !== assets.length) {
    throw new Error(`Homepage scene theme ${theme} contains duplicate layer identifiers.`);
  }
  validateParentChains(theme, assets);
  return { source, assets };
}

function parseAsset(
  theme: HomepageArtworkTheme,
  value: unknown,
  index: number,
  canvas: HomepageSceneManifest['canvas'],
): HomepageSceneAsset {
  if (!isRecord(value)) throw new Error(`Homepage scene layer ${theme}[${index}] is invalid.`);
  const id = nonEmptyString(value['id'], `${theme} layer ${index} identifier`);
  const file = value['file'];
  if (
    typeof file !== 'string' ||
    file.includes('\\') ||
    file.startsWith('/') ||
    file.split('/').includes('..') ||
    !file.startsWith(`assets/${theme}/`)
  ) {
    throw new Error(`Homepage scene layer ${id} has an unsafe asset path.`);
  }

  const x = integer(value['x'], `${id} x coordinate`);
  const y = integer(value['y'], `${id} y coordinate`);
  const width = positiveInteger(value['width'], `${id} width`);
  const height = positiveInteger(value['height'], `${id} height`);
  if (x < 0 || y < 0 || x + width > canvas.width || y + height > canvas.height) {
    throw new Error(`Homepage scene layer ${id} falls outside the artboard.`);
  }

  const label = nonEmptyString(value['label'], `${id} label`);
  const parent = value['parent'];
  if (parent !== null && typeof parent !== 'string') {
    throw new Error(`Homepage scene layer ${id} has an invalid parent.`);
  }
  const kind = value['kind'];
  if (!layerKinds.includes(kind as HomepageLayerKind)) {
    throw new Error(`Homepage scene layer ${id} has an unknown kind.`);
  }
  if (typeof value['interactive'] !== 'boolean') {
    throw new Error(`Homepage scene layer ${id} has an invalid interaction flag.`);
  }

  return {
    id,
    file,
    x,
    y,
    width,
    height,
    label,
    parent,
    kind: kind as HomepageLayerKind,
    interactive: value['interactive'],
  };
}

function validateParentChains(theme: HomepageArtworkTheme, assets: readonly HomepageSceneAsset[]): void {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  for (const asset of assets) {
    const visited = new Set([asset.id]);
    let parentId = asset.parent;
    while (parentId !== null) {
      if (visited.has(parentId)) {
        throw new Error(`Homepage scene theme ${theme} contains a parent cycle at ${parentId}.`);
      }
      visited.add(parentId);
      parentId = byId.get(parentId)?.parent ?? null;
    }
  }
}

function positiveInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Homepage scene ${name} must be a positive integer.`);
  }
  return value;
}

function integer(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Homepage scene ${name} must be an integer.`);
  }
  return value;
}

function nonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Homepage scene ${name} must be a non-empty string.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
