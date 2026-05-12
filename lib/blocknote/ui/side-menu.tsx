// TEMPORARILY INACTIVE — as of initial deployment this file is dead code.
// The side menu is currently handled by column-drag-menu.tsx, which uses
// internal BlockNote APIs (SideMenuExtension, useExtensionState) to add
// column settings to the drag handle. That implementation bypassed this
// documented-pattern scaffold.
//
// TODO (future rewrite): Rewrite column-drag-menu.tsx to avoid internal APIs,
// then wire the column settings logic through this file using the documented
// SideMenuController + SideMenu pattern. This file should become the active
// implementation and column-drag-menu.tsx should be deleted.
// See: docs/website-development/final-audit.md — "Skipped Issues"

import { SideMenu, SideMenuController } from "@blocknote/react";
import type { SideMenuProps } from "@blocknote/react";

/**
 * Side Menu Framework
 * 
 * Provides a factory function to create custom side menu components that can be extended
 * with custom buttons.
 * 
 * Documentation: docs/blocknote-documentation/docs/react/components/side-menu.mdx
 * Example: docs/blocknote-documentation/examples/03-ui-components/04-side-menu-buttons/src/App.tsx
 */

/**
 * Creates a custom side menu component factory function.
 * 
 * Initially returns default side menu. Custom buttons can be added by extending
 * this function or by modifying the returned component.
 * 
 * This function is designed to be used with SideMenuController's sideMenu prop.
 * 
 * @param props - SideMenuProps from SideMenuController
 * @returns React component for the side menu
 * 
 * Usage in SideMenuController:
 * ```typescript
 * <SideMenuController
 *   sideMenu={(props) => createCustomSideMenu(props)}
 * />
 * ```
 * 
 * Note: Per documentation, there are two mutually exclusive states:
 * - Default: Don't set `sideMenu={false}` on BlockNoteView, don't use SideMenuController (default menu shows)
 * - Custom: Set `sideMenu={false}` on BlockNoteView AND provide a component to sideMenu prop
 */
export function createCustomSideMenu(
  props: SideMenuProps
): React.ReactElement {
  // TODO: Add custom side menu buttons here as needed
  // Example pattern (from side-menu-buttons example):
  // const Components = useComponentsContext()!;
  // return (
  //   <SideMenu {...props}>
  //     <Components.SideMenu.Button
  //       label="Remove Block"
  //       onClick={() => props.editor.removeBlocks([props.block])}
  //     />
  //   </SideMenu>
  // );

  // Return default side menu (ready to extend with custom buttons)
  return <SideMenu {...props} />;
}
