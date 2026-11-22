import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { DioramaSceneResources, disposeDioramaResources } from './diorama-scene-resources';

describe('Diorama scene resources', () => {
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
    const directionalLight = new THREE.DirectionalLight();
    const shadowMap = new THREE.WebGLRenderTarget(16, 16);
    const shadowMapPass = new THREE.WebGLRenderTarget(16, 16);
    directionalLight.shadow.map = shadowMap;
    directionalLight.shadow.mapPass = shadowMapPass;
    const geometryDispose = vi.spyOn(geometry, 'dispose');
    const baseMaterialDispose = vi.spyOn(baseMaterial, 'dispose');
    const inactiveMaterialDispose = vi.spyOn(inactiveVariantMaterial, 'dispose');
    const baseTextureDispose = vi.spyOn(baseTexture, 'dispose');
    const variantTextureDispose = vi.spyOn(variantTexture, 'dispose');
    const shadowMapDispose = vi.spyOn(shadowMap, 'dispose');
    const shadowMapPassDispose = vi.spyOn(shadowMapPass, 'dispose');
    root.add(directionalLight);

    disposeDioramaResources(root, [inactiveVariantMaterial]);
    disposeDioramaResources(root, [inactiveVariantMaterial]);

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(baseMaterialDispose).toHaveBeenCalledOnce();
    expect(inactiveMaterialDispose).toHaveBeenCalledOnce();
    expect(baseTextureDispose).toHaveBeenCalledOnce();
    expect(variantTextureDispose).toHaveBeenCalledOnce();
    expect(shadowMapDispose).toHaveBeenCalledOnce();
    expect(shadowMapPassDispose).toHaveBeenCalledOnce();
    expect(closeBitmap).toHaveBeenCalledOnce();
    expect(root.children).toHaveLength(0);
  });
});

describe('DioramaSceneResources', () => {
  it('disposes renderer resources before losing the context and removing its canvas', () => {
    const lifecycle: string[] = [];
    const canvas = { remove: vi.fn(() => lifecycle.push('remove')) };
    const renderer = {
      dispose: vi.fn(() => lifecycle.push('dispose')),
      forceContextLoss: vi.fn(() => lifecycle.push('context-loss')),
      domElement: canvas,
    } as unknown as THREE.WebGLRenderer;
    const resources = new DioramaSceneResources();

    resources.trackRenderer(renderer);
    resources.dispose();
    resources.dispose();

    expect(lifecycle).toEqual(['dispose', 'context-loss', 'remove']);
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(renderer.forceContextLoss).toHaveBeenCalledOnce();
    expect(canvas.remove).toHaveBeenCalledOnce();
  });

  it('releases a renderer that arrives after the owner has been disposed', () => {
    const lifecycle: string[] = [];
    const canvas = { remove: vi.fn(() => lifecycle.push('remove')) };
    const renderer = {
      dispose: vi.fn(() => lifecycle.push('dispose')),
      forceContextLoss: vi.fn(() => lifecycle.push('context-loss')),
      domElement: canvas,
    } as unknown as THREE.WebGLRenderer;
    const resources = new DioramaSceneResources();

    resources.dispose();
    resources.trackRenderer(renderer);

    expect(lifecycle).toEqual(['dispose', 'context-loss', 'remove']);
  });
});
