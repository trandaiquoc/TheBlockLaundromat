import { Material, Mesh } from 'three';
import type { GLTF, GLTFLoaderPlugin, GLTFParser } from 'three/addons/loaders/GLTFLoader.js';

export const dioramaMaterialVariantNames = ['Light', 'Minecraft', 'Raccoon', 'Dark'] as const;

export type DioramaMaterialVariantName = (typeof dioramaMaterialVariantNames)[number];

export interface DioramaMaterialVariantTarget {
  readonly mesh: Mesh;
  readonly baseMaterial: Material;
  readonly materialsByVariant: ReadonlyMap<DioramaMaterialVariantName, Material>;
}

export class DioramaMaterialVariants {
  constructor(
    readonly targets: readonly DioramaMaterialVariantTarget[],
    readonly ownedMaterials: readonly Material[],
  ) {}

  apply(name: DioramaMaterialVariantName): void {
    for (const target of this.targets) {
      target.mesh.material = target.materialsByVariant.get(name) ?? target.baseMaterial;
    }
  }
}

interface GltfPrimitiveDefinition {
  readonly extensions?: Readonly<Record<string, unknown>>;
}

interface GltfMeshDefinition {
  readonly primitives?: readonly GltfPrimitiveDefinition[];
}

interface GltfMaterialVariantDocument {
  readonly extensions?: Readonly<Record<string, unknown>>;
  readonly materials?: readonly unknown[];
  readonly meshes?: readonly GltfMeshDefinition[];
}

interface PendingVariantTarget {
  readonly mesh: Mesh;
  readonly baseMaterial: Material;
  readonly mappings: readonly {
    readonly materialIndex: number;
    readonly variantIndices: readonly number[];
  }[];
}

const extensionName = 'KHR_materials_variants';

export class DioramaMaterialsVariantsPlugin implements GLTFLoaderPlugin {
  readonly name = extensionName;
  private result?: DioramaMaterialVariants;

  constructor(private readonly parser: GLTFParser) {}

  get materialVariants(): DioramaMaterialVariants | undefined {
    return this.result;
  }

  async afterRoot(gltf: GLTF): Promise<void> {
    const document = this.parser.json as unknown as GltfMaterialVariantDocument;
    const variantExtension = readRecord(document.extensions?.[extensionName]);
    const variants = variantExtension?.['variants'];
    if (!Array.isArray(variants)) {
      throw new Error('The scene GLB does not define KHR_materials_variants.');
    }

    const variantNames = variants.map((variant) => readRecord(variant)?.['name']);
    assertVariantNames(variantNames);

    const pendingTargets: PendingVariantTarget[] = [];
    const ownedMaterials = new Set<Material>();
    const usedVariantIndices = new Set<number>();

    gltf.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const baseMaterial = object.material;
      if (Array.isArray(baseMaterial)) {
        throw new Error('The scene GLB contains a mesh with multiple base materials.');
      }
      ownedMaterials.add(baseMaterial);

      const reference = this.parser.associations.get(object);
      if (reference?.meshes === undefined || reference.primitives === undefined) return;
      const primitive = document.meshes?.[reference.meshes]?.primitives?.[reference.primitives];
      const primitiveExtension = readRecord(primitive?.extensions?.[extensionName]);
      const mappings = primitiveExtension?.['mappings'];
      if (!Array.isArray(mappings)) return;

      const variantMappings = mappings.map((mapping) => readVariantMapping(mapping));
      const localVariantIndices = new Set<number>();
      for (const mapping of variantMappings) {
        if (mapping.materialIndex >= (document.materials?.length ?? 0)) {
          throw new Error('The scene GLB references a material outside its material table.');
        }
        for (const variantIndex of mapping.variantIndices) {
          if (variantIndex >= variantNames.length || localVariantIndices.has(variantIndex)) {
            throw new Error('The scene GLB contains an invalid material variant mapping.');
          }
          localVariantIndices.add(variantIndex);
          usedVariantIndices.add(variantIndex);
        }
      }

      pendingTargets.push({ mesh: object, baseMaterial, mappings: variantMappings });
    });

    if (pendingTargets.length === 0 || usedVariantIndices.size !== variantNames.length) {
      throw new Error('The scene GLB has incomplete material variant assignments.');
    }

    const targets = await Promise.all(
      pendingTargets.map(async ({ mesh, baseMaterial, mappings }) => {
        const materialsByVariant = new Map<DioramaMaterialVariantName, Material>();
        for (const mapping of mappings) {
          const material = await this.parser.getDependency('material', mapping.materialIndex);
          if (!(material instanceof Material)) {
            throw new Error('The scene GLB contains an invalid variant material.');
          }
          ownedMaterials.add(material);
          for (const variantIndex of mapping.variantIndices) {
            materialsByVariant.set(
              variantNames[variantIndex] as DioramaMaterialVariantName,
              material,
            );
          }
        }
        return { mesh, baseMaterial, materialsByVariant };
      }),
    );

    this.result = new DioramaMaterialVariants(targets, [...ownedMaterials]);
  }
}

function assertVariantNames(
  names: readonly unknown[],
): asserts names is readonly DioramaMaterialVariantName[] {
  const expected = new Set<string>(dioramaMaterialVariantNames);
  if (
    names.length !== expected.size ||
    names.some((name) => typeof name !== 'string' || !expected.delete(name)) ||
    expected.size > 0
  ) {
    throw new Error('The scene GLB must define Light, Minecraft, Raccoon, and Dark variants.');
  }
}

function readVariantMapping(value: unknown): {
  readonly materialIndex: number;
  readonly variantIndices: readonly number[];
} {
  const mapping = readRecord(value);
  const materialIndex = mapping?.['material'];
  const variantIndices = mapping?.['variants'];
  if (
    !Number.isInteger(materialIndex) ||
    (materialIndex as number) < 0 ||
    !Array.isArray(variantIndices) ||
    variantIndices.length === 0 ||
    variantIndices.some((index) => !Number.isInteger(index) || index < 0)
  ) {
    throw new Error('The scene GLB contains an invalid material variant mapping.');
  }
  return { materialIndex: materialIndex as number, variantIndices };
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
