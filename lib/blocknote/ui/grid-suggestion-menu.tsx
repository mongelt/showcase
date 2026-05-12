// TEMPORARILY INACTIVE — as of initial deployment this file is dead code.
// The emoji picker / grid suggestion menu has not been implemented in this
// project. BlockNoteEditor.tsx has no GridSuggestionMenuController registered.
// This file is kept as the scaffold for when the feature is built.
//
// TODO (future rewrite): Implement a custom emoji picker or grid suggestion
// menu here using the documented GridSuggestionMenuController pattern, then
// register it in BlockNoteEditor.tsx.
// See: docs/website-development/final-audit.md — "Skipped Issues"

import {
  DefaultReactGridSuggestionItem,
  GridSuggestionMenuProps,
} from "@blocknote/react";
import React from "react";

/**
 * Grid Suggestion Menu (Emoji Picker) Component Framework
 * 
 * Provides a factory function to create custom grid suggestion menu components that can replace
 * the default emoji picker or create new grid menus.
 * 
 * Documentation: docs/blocknote-documentation/docs/react/components/grid-suggestion-menus.mdx
 * Example: docs/blocknote-documentation/examples/03-ui-components/09-suggestion-menus-emoji-picker-component/src/App.tsx
 * 
 * Note: Per documentation, there are two mutually exclusive states:
 * - Default: Don't set `emojiPicker={false}` on BlockNoteView, don't use GridSuggestionMenuController (default emoji picker shows)
 * - Custom: Set `emojiPicker={false}` on BlockNoteView AND provide a component to `gridSuggestionMenuComponent` prop
 * 
 * There is no "null = default" pattern - if `emojiPicker={false}` is set, a component must be provided.
 */

/**
 * Creates a custom grid suggestion menu component (e.g., emoji picker).
 * 
 * This function returns a React component that can replace the default emoji picker
 * or create new grid menus for other purposes.
 * Initially returns null (not used), but can be extended to provide a custom component.
 * 
 * When used, this component will receive GridSuggestionMenuProps and should render the menu items
 * in a grid layout.
 * 
 * @param props - GridSuggestionMenuProps from GridSuggestionMenuController
 * @returns React component for the grid suggestion menu, or null if not using custom component
 * 
 * Usage in GridSuggestionMenuController:
 * ```typescript
 * <GridSuggestionMenuController
 *   triggerCharacter=":"
 *   gridSuggestionMenuComponent={createCustomGridSuggestionMenu}
 *   columns={10}
 *   minQueryLength={2}
 * />
 * ```
 * 
 * Example pattern (from emoji-picker-component example):
 * ```typescript
 * function CustomEmojiPicker(
 *   props: GridSuggestionMenuProps<DefaultReactGridSuggestionItem>
 * ) {
 *   return (
 *     <div
 *       className="emoji-picker"
 *       style={{
 *         gridTemplateColumns: `repeat(${props.columns || 1}, 1fr)`,
 *       }}
 *     >
 *       {props.items.map((item, index) => (
 *         <div
 *           className={`emoji-picker-item ${
 *             props.selectedIndex === index ? "selected" : ""
 *           }`}
 *           onClick={() => {
 *             props.onItemClick?.(item);
 *           }}
 *         >
 *           {item.icon}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function createCustomGridSuggestionMenu(
  props: GridSuggestionMenuProps<DefaultReactGridSuggestionItem>
): React.ReactElement | null {
  // TODO: Implement custom grid suggestion menu component when needed
  // Return null by default - this means the framework file exists but custom component is not yet implemented
  // When implementing, return a React component that renders the menu items in a grid layout
  // See example pattern above
  
  return null;
}
