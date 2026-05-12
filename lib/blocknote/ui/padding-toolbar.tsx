'use client'

import { useBlockNoteEditor, useComponentsContext, useEditorState } from "@blocknote/react";
import { RiContrastLine } from "react-icons/ri";

/**
 * Formatting toolbar button that toggles block-level top/bottom padding.
 *
 * - embed / button blocks: toggles the `noPadding` prop directly.
 * - image / video blocks: uses `backgroundColor="no-padding"` as a
 *   persistence signal (the value is not a known BlockNote color so it
 *   renders no visual background; CSS in theme.css targets the resulting
 *   data-background-color="no-padding" attribute to zero the padding).
 *
 * Self-hides when the selected block doesn't support padding toggling.
 */
export const BlockPaddingButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();

  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      try {
        const block = editor.getTextCursorPosition().block;

        if ((block.type as string) === "embed" || (block.type as string) === "button") {
          return {
            visible: true,
            noPadding: !!(block.props as any).noPadding,
            blockType: block.type,
          };
        }

        if (block.type === "image" || block.type === "video") {
          return {
            visible: true,
            noPadding: (block.props as any).backgroundColor === "no-padding",
            blockType: block.type,
          };
        }
      } catch {
        /* no cursor position */
      }
      return { visible: false, noPadding: false, blockType: "" };
    },
  });

  if (!state.visible) return null;

  const handleClick = () => {
    try {
      const block = editor.getTextCursorPosition().block;

      if ((block.type as string) === "embed" || (block.type as string) === "button") {
        editor.updateBlock(block, {
          props: { noPadding: !state.noPadding } as any,
        });
        return;
      }

      if (block.type === "image" || block.type === "video") {
        editor.updateBlock(block, {
          props: { backgroundColor: state.noPadding ? "default" : "no-padding" } as any,
        });
      }
    } catch {
      /* block may have changed */
    }
  };

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      label={state.noPadding ? "Add block padding" : "Remove block padding"}
      mainTooltip={state.noPadding ? "Add 10px top/bottom spacing" : "Remove top/bottom spacing"}
      icon={<RiContrastLine />}
      isSelected={!state.noPadding}
      onClick={handleClick}
    />
  );
};
