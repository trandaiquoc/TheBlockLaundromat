import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { disposeDioramaResources } from './diorama-scene-resources';

describe('mini diorama scene resources', () => {
  it('disposes shared scene and inactive variant resources once, including image bitmaps', () => {
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const baseTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    const baseMaterial = new THREE.MeshStandardMaterial({ map: baseTexture });
    root.add(new THREE.Mesh(geometry, baseMaterial), new THREE.Mesh(geometry, baseMaterial));

    const closeBitmap = vi.fn();
    const bitmap = { close: closeBitmap } as unknown as ImageBitmap;
    const variantTexture = new THREE.Texture(bitmap);
    const inactiveVariantMaterial = new THREE.MeshStandardMaterial({ map: variantTexture });
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const baseMaterialDispose = vi.spyOn(baseMaterial, 'dispose');
    const inactiveMaterialDispose = vi.spyOn(inactiveVariantMaterial, 'dispose');
    const baseTextureDispose = vi.spyOn(baseTexture, 'dispose');
    const variantTextureDispose = vi.spyOn(variantTexture, 'dispose');

    disposeDioramaResources(root, [inactiveVariantMaterial]);
    disposeDioramaResources(root, [inactiveVariantMaterial]);

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(baseMaterialDispose).toHaveBeenCalledOnce();
    expect(inactiveMaterialDispose).toHaveBeenCalledOnce();
    expect(baseTextureDispose).toHaveBeenCalledOnce();
    expect(variantTextureDispose).toHaveBeenCalledOnce();
    expect(closeBitmap).toHaveBeenCalledOnce();
    expect(root.children).toHaveLength(0);
  });
});
