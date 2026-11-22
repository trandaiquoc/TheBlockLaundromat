import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { GLTF, GLTFParser } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it, vi } from 'vitest';
import { DioramaMaterialsVariantsPlugin } from './diorama-material-variants';

describe('DioramaMaterialsVariantsPlugin', () => {
  it('maps all four GLB variants without replacing the primitive geometry', async () => {
    const geometry = new BoxGeometry(1, 1, 1);
    const [base, light, minecraft, raccoon, dark] = Array.from(
      { length: 5 },
      () => new MeshStandardMaterial(),
    );
    const mesh = new Mesh(geometry, base);
    const scene = new Group();
    scene.add(mesh);
    const parser = createParser(mesh, [base, light, minecraft, raccoon, dark]);
    const plugin = new DioramaMaterialsVariantsPlugin(parser);

    await plugin.afterRoot({ scene, scenes: [scene] } as GLTF);
    const variants = plugin.materialVariants;
    if (!variants) throw new Error('The variant plugin did not produce its mapping.');

    variants.apply('Light');
    expect(mesh.material).toBe(light);
    variants.apply('Minecraft');
    expect(mesh.material).toBe(minecraft);
    variants.apply('Raccoon');
    expect(mesh.material).toBe(raccoon);
    variants.apply('Dark');
    expect(mesh.material).toBe(dark);
    expect(mesh.geometry).toBe(geometry);
  });

  it('rejects an asset missing one of the required theme variants', async () => {
    const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial());
    const scene = new Group();
    scene.add(mesh);
    const parser = createParser(
      mesh,
      [mesh.material as MeshStandardMaterial],
      [{ name: 'Light' }, { name: 'Minecraft' }, { name: 'Raccoon' }],
    );
    const plugin = new DioramaMaterialsVariantsPlugin(parser);

    await expect(plugin.afterRoot({ scene, scenes: [scene] } as GLTF)).rejects.toThrow(
      'must define Light, Minecraft, Raccoon, and Dark variants',
    );
  });
});

function createParser(
  mesh: Mesh,
  materials: readonly MeshStandardMaterial[],
  variants = [{ name: 'Light' }, { name: 'Minecraft' }, { name: 'Raccoon' }, { name: 'Dark' }],
): GLTFParser {
  const parser = {
    json: {
      extensions: { KHR_materials_variants: { variants } },
      materials: materials.map(() => ({})),
      meshes: [
        {
          primitives: [
            {
              extensions: {
                KHR_materials_variants: {
                  mappings: [
                    { material: 1, variants: [0] },
                    { material: 2, variants: [1] },
                    { material: 3, variants: [2] },
                    { material: 4, variants: [3] },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    associations: new Map([[mesh, { meshes: 0, primitives: 0 }]]),
    getDependency: vi.fn(async (_type: string, index: number) => materials[index]),
  };
  return parser as unknown as GLTFParser;
}
