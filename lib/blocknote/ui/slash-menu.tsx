import {
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core/extensions";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { RiAlertFill, RiLayoutColumnLine, RiLink, RiCursorLine, RiLinkM, RiH2, RiH3, RiH4, RiH5, RiH6, RiMusic2Line } from "react-icons/ri";
import { ReactElement } from "react";
import { CustomBlockNoteEditor } from "../blocks/types";

/**
 * Slash Menu Framework
 * 
 * Provides a function to get custom slash menu items that can be extended
 * with custom block menu items.
 * 
 * Documentation: docs/blocknote-documentation/docs/react/components/suggestion-menus.mdx
 * Example: docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx
 */

/**
 * Slash menu item to insert an Alert block.
 * 
 * Creates a slash menu item that inserts an Alert block when clicked.
 * Uses `insertOrUpdateBlockForSlashMenu` to handle block insertion logic.
 * 
 * @param editor - The BlockNote editor instance with custom schema
 * @returns A slash menu item object for the Alert block
 * 
 * Documentation: docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx (lines 32-54)
 */
const insertAlert = (editor: CustomBlockNoteEditor) => ({
  title: "Alert",
  subtext: "Alert for emphasizing text",
  onItemClick: () =>
    // If the block containing the text caret is empty, `insertOrUpdateBlockForSlashMenu`
    // changes its type to the provided block. Otherwise, it inserts the new
    // block below and moves the text caret to it. We use this function with an
    // Alert block.
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "alert",
    }),
  aliases: [
    "alert",
    "notification",
    "emphasize",
    "warning",
    "error",
    "info",
    "success",
  ],
  group: "Basic blocks",
  icon: <RiAlertFill />,
});

/**
 * Slash menu item to insert a 2-column layout.
 * 
 * Creates a slash menu item that inserts a `columnList` block with 2 `column` children
 * when clicked. This is the default multi-column layout (per user requirement).
 * 
 * Uses `insertOrUpdateBlockForSlashMenu` to handle block insertion logic.
 * 
 * @param editor - The BlockNote editor instance with custom schema
 * @returns A slash menu item object for the 2-column layout
 * 
 * Documentation: 
 * - docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx (lines 32-54)
 * - docs/blocknote-documentation/examples/01-basic/03-multi-column/src/App.tsx (lines 67-92)
 */
const insertTwoColumns = (editor: CustomBlockNoteEditor) => ({
  title: "Multi-columns",
  subtext: "Create a multi-column layout (2 columns, adjustable)",
  onItemClick: () => {
    // Get the current block (where the cursor is)
    const currentBlock = editor.getTextCursorPosition().block;
    
    // Check if current block is empty (no content and no children)
    const hasContent = Array.isArray(currentBlock.content) 
      ? currentBlock.content.length > 0
      : currentBlock.content !== undefined && currentBlock.content !== null;
    const hasChildren = currentBlock.children && currentBlock.children.length > 0;
    const isEmpty = !hasContent && !hasChildren;
    
    // Create the columnList with nested column children using replaceBlocks
    // This approach constructs the full structure at once, similar to initialContent
    const newColumnList: any = {
      type: "columnList",
      props: {},
      children: [
        {
          type: "column",
          props: { width: 50 },
          children: [{ type: "paragraph", content: [] }],
        },
        {
          type: "column",
          props: { width: 50 },
          children: [{ type: "paragraph", content: [] }],
        },
      ],
    };
    
    if (isEmpty) {
      // Replace the empty block with the full columnList structure
      editor.replaceBlocks([currentBlock.id], [newColumnList]);
    } else {
      // Insert columnList below current block
      editor.insertBlocks([newColumnList], currentBlock.id, "after");
    }
  },
  aliases: [
    "columns",
    "column",
    "2 columns",
    "two columns",
    "multi-column",
    "multi columns",
    "layout",
  ],
  group: "Basic blocks",
  icon: <RiLayoutColumnLine />,
});

/**
 * Slash menu item to insert an Embed block.
 *
 * Creates a slash menu item that inserts an Embed block when clicked.
 * Supports YouTube, Instagram, and generic iframes.
 *
 * @param editor - The BlockNote editor instance with custom schema
 * @returns A slash menu item object for the Embed block
 */
const insertEmbed = (editor: CustomBlockNoteEditor) => ({
  title: "Embed",
  subtext: "Embed YouTube, Instagram, or any URL",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "embed",
    }),
  aliases: ["embed", "youtube", "instagram", "video", "iframe", "url", "link"],
  group: "Embeds",
  icon: <RiLink />,
});

/**
 * Slash menu item to insert a Button block.
 *
 * @param editor - The BlockNote editor instance with custom schema
 * @returns A slash menu item object for the Button block
 */
const insertButton = (editor: CustomBlockNoteEditor) => ({
  title: "Button",
  subtext: "Clickable button — external URL, download, or internal tab",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "button",
    }),
  aliases: ["button", "link", "cta", "action", "download", "click"],
  group: "Basic blocks",
  icon: <RiCursorLine />,
});

/**
 * Slash menu item to insert a Link Preview block.
 *
 * @param editor - The BlockNote editor instance with custom schema
 * @returns A slash menu item object for the Link Preview block
 */
const insertLinkPreview = (editor: CustomBlockNoteEditor) => ({
  title: "Link Preview",
  subtext: "Fetch page metadata and show a link banner",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "linkPreview",
    }),
  aliases: ["link", "preview", "url", "bookmark", "card", "meta"],
  group: "Basic blocks",
  icon: <RiLinkM />,
});

/**
 * Slash menu items to insert Heading Line blocks (H2–H6).
 * Each entry inserts a headingLine block at the appropriate level.
 */
const insertHeadingLine = (
  editor: CustomBlockNoteEditor,
  level: "2" | "3" | "4" | "5" | "6",
  icon: ReactElement,
) => ({
  title: `Heading ${level} ─`,
  subtext: `H${level} heading with burgundy underline`,
  onItemClick: () => {
    const currentBlock = editor.getTextCursorPosition().block;
    const hasContent = Array.isArray(currentBlock.content)
      ? currentBlock.content.length > 0
      : currentBlock.content !== undefined && currentBlock.content !== null;
    const isEmpty = !hasContent && (!currentBlock.children || currentBlock.children.length === 0);
    const newBlock = { type: "headingLine" as const, props: { level } };
    if (isEmpty) {
      editor.replaceBlocks([currentBlock.id], [newBlock]);
    } else {
      editor.insertBlocks([newBlock], currentBlock.id, "after");
    }
  },
  aliases: [`h${level}`, `heading${level}`, `heading ${level}`, "heading line", "underline heading"],
  group: "Heading Lines",
  icon,
});

/**
 * Slash menu item to insert an Audio block.
 *
 * @param editor - The BlockNote editor instance with custom schema
 * @returns A slash menu item object for the Audio block
 */
const insertAudio = (editor: CustomBlockNoteEditor) => ({
  title: "Audio Waveform",
  subtext: "Embed an audio file with wavesurfer waveform player",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "audio",
    }),
  aliases: ["audio", "waveform", "sound", "music", "podcast", "mp3"],
  group: "Media",
  icon: <RiMusic2Line />,
});

/**
 * Gets custom slash menu items for the editor.
 * 
 * Returns default items plus custom block menu items (Alert block and
 * Multi-columns layout block).
 * Custom items are inserted into the appropriate groups (e.g., "Basic blocks").
 * 
 * This function is designed to be used with SuggestionMenuController's getItems prop,
 * which expects an async function that takes a query string.
 * 
 * @param editor - The BlockNote editor instance with custom schema
 * @param query - Query string for filtering items (provided by SuggestionMenuController)
 * @returns Promise resolving to array of filtered slash menu items (DefaultReactSuggestionItem[])
 * 
 * Usage in SuggestionMenuController:
 * ```typescript
 * <SuggestionMenuController
 *   triggerCharacter="/"
 *   getItems={async (query) => getCustomSlashMenuItems(editor, query)}
 * />
 * ```
 * 
 * Documentation: docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx (lines 109-121)
 */
export async function getCustomSlashMenuItems(
  editor: CustomBlockNoteEditor,
  query: string,
): Promise<DefaultReactSuggestionItem[]> {
  // Get all default slash menu items
  const defaultItems = getDefaultReactSlashMenuItems(editor);

  // Find index of last item in "Basic blocks" group
  const lastBasicBlockIndex = defaultItems.findLastIndex(
    (item) => item.group === "Basic blocks",
  );

  // Insert the Alert item as the last item in the "Basic blocks" group
  defaultItems.splice(lastBasicBlockIndex + 1, 0, insertAlert(editor));

  // Insert the Multi-columns layout item
  defaultItems.splice(lastBasicBlockIndex + 2, 0, insertTwoColumns(editor));

  // Insert the Button item
  defaultItems.splice(lastBasicBlockIndex + 3, 0, insertButton(editor));

  // Insert the Link Preview item
  defaultItems.splice(lastBasicBlockIndex + 4, 0, insertLinkPreview(editor));

  // Insert the Embed item into the "Media" group
  defaultItems.push(insertEmbed(editor));

  // Insert the Audio Waveform item into the native "Media" group.
  // Must splice adjacent to existing "Media" items — pushing at the end
  // creates a second "Media" group header which causes a React duplicate-key warning.
  const lastMediaIndex = defaultItems.findLastIndex((item) => item.group === "Media");
  if (lastMediaIndex >= 0) {
    defaultItems.splice(lastMediaIndex + 1, 0, insertAudio(editor));
  } else {
    defaultItems.push(insertAudio(editor));
  }

  // Insert Heading Line items (H2–H6) as their own group
  defaultItems.push(insertHeadingLine(editor, "2", <RiH2 />));
  defaultItems.push(insertHeadingLine(editor, "3", <RiH3 />));
  defaultItems.push(insertHeadingLine(editor, "4", <RiH4 />));
  defaultItems.push(insertHeadingLine(editor, "5", <RiH5 />));
  defaultItems.push(insertHeadingLine(editor, "6", <RiH6 />));

  // Filter items based on query and return
  return filterSuggestionItems(defaultItems, query);
}
