import { PropertyBinding } from 'three';
import type { MiniDioramaFocus, MiniDioramaTarget } from './mini-diorama-contracts';

export type MiniDioramaSceneKind = 'integration-preview' | 'stage-3-production';

export interface MiniDioramaSceneContract {
  readonly assetPath: string;
  readonly interactionNodes: Readonly<Record<MiniDioramaTarget, string>>;
  readonly raccoonRoots: readonly string[];
  readonly raccoonControllerRoot?: string;
  readonly lanternLightNode: string;
  readonly boardBoundsAnchors: readonly string[];
  readonly cameraFocusAnchors: Readonly<Partial<Record<MiniDioramaFocus, string>>>;
  readonly requiredAnchors: readonly string[];
}

const sceneContracts: Readonly<Record<MiniDioramaSceneKind, MiniDioramaSceneContract>> = {
  'integration-preview': {
    assetPath: 'assets/homepage/runtime/models/laundromat/Laundromat.glb',
    interactionNodes: {
      washer: 'Washer',
      'project-board': 'Notice_board',
      raccoon: 'Raccoon',
    },
    raccoonRoots: ['Raccoon'],
    raccoonControllerRoot: 'Raccoon',
    lanternLightNode: 'Lantern',
    boardBoundsAnchors: [],
    cameraFocusAnchors: {},
    requiredAnchors: [],
  },
  'stage-3-production': {
    assetPath: 'assets/homepage/runtime/models/Room/Octagonal-Laundromat.glb',
    interactionNodes: {
      washer: 'Washer',
      'project-board': 'ProjectBoard',
      raccoon: 'Courier.Root',
    },
    raccoonRoots: ['Courier.Root', 'Guide.Root'],
    lanternLightNode: 'Anchor.NicheLantern.Light',
    boardBoundsAnchors: [
      'Anchor.Board.BottomLeft',
      'Anchor.Board.BottomRight',
      'Anchor.Board.TopLeft',
      'Anchor.Board.TopRight',
    ],
    cameraFocusAnchors: {
      overview: 'Anchor.Camera.Overview',
      washer: 'Anchor.Camera.Washer',
      'project-board': 'Anchor.Camera.Board',
      raccoon: 'Anchor.Camera.Portrait',
    },
    requiredAnchors: [
      'Anchor.Board.Center',
      'Anchor.Washer.Preview',
      'Anchor.Washer.Open',
      'Anchor.Washer.Delete',
      'Anchor.Camera.Recenter',
    ],
  },
};

export function miniDioramaSceneContract(kind: MiniDioramaSceneKind): MiniDioramaSceneContract {
  return sceneContracts[kind];
}

export function miniDioramaSceneNodeName(authoredName: string): string {
  return PropertyBinding.sanitizeNodeName(authoredName);
}

export function requiredMiniDioramaSceneNodes(
  contract: MiniDioramaSceneContract,
): readonly string[] {
  return [
    ...Object.values(contract.interactionNodes),
    ...contract.raccoonRoots,
    contract.lanternLightNode,
    ...contract.boardBoundsAnchors,
    ...Object.values(contract.cameraFocusAnchors).filter(
      (name): name is string => name !== undefined,
    ),
    ...contract.requiredAnchors,
  ];
}
