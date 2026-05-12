import { blockTypeSelectItems, BlockTypeSelectItem } from "@blocknote/react";
import { RiAlertFill, RiLayoutColumnLine, RiCursorLine, RiLinkM, RiH2, RiMusic2Line } from "react-icons/ri";
import { CustomBlockNoteEditor } from "../blocks/types";

/**
 * Block Type Select Framework
 * 
 * Provides a function to get custom block type select items that can be extended
 * with custom block types.
 * 
 * Documentation: docs/blocknote-documentation/docs/react/components/formatting-toolbar.mdx
 * Example: docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx
 */

/**
 * Gets custom block type select items for the editor.
 * 
 * Returns default items plus custom block type items (currently Alert block).
 * Custom items are appended to the default items array.
 * 
 * This function is designed to be used with FormattingToolbar's blockTypeSelectItems prop.
 * 
 * @param editor - The BlockNote editor instance with custom schema
 * @returns Array of block type select items (BlockTypeSelectItem[])
 * 
 * Usage in FormattingToolbar:
 * ```typescript
 * <FormattingToolbar
 *   blockTypeSelectItems={getCustomBlockTypeSelectItems(editor)}
 * />
 * ```
 * 
 * Documentation: docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx (lines 93-102)
 */
export function getCustomBlockTypeSelectItems(
  editor: CustomBlockNoteEditor
): BlockTypeSelectItem[] {
  // Get all default block type select items
  const defaultItems = blockTypeSelectItems(editor.dictionary);

  // Add custom block type select items
  const customItems: BlockTypeSelectItem[] = [
    {
      name: "Alert",
      type: "alert",
      icon: RiAlertFill,
    },
    {
      name: "Columns",
      type: "columnList",
      icon: RiLayoutColumnLine,
    },
    {
      name: "Button",
      type: "button",
      icon: RiCursorLine,
    },
    {
      name: "Link Preview",
      type: "linkPreview",
      icon: RiLinkM,
    },
    {
      name: "Heading ─",
      type: "headingLine",
      icon: RiH2,
    },
    {
      name: "Audio Waveform",
      type: "audio",
      icon: RiMusic2Line,
    },
  ];

  // Return default items plus custom items
  return [...defaultItems, ...customItems];
}
