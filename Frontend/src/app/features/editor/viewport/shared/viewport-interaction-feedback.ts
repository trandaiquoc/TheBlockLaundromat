import type { EditorTool } from '../../../../core/editor/state/tool.service';

export function shouldClearInteractionFeedbackForToolChange(
  previousTool: EditorTool | undefined,
  nextTool: EditorTool,
): boolean {
  return previousTool !== nextTool;
}
