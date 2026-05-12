"use client";

import { SideMenuExtension } from "@blocknote/core/extensions";
import {
  BlockColorsItem,
  DragHandleMenu,
  RemoveBlockItem,
  SideMenu,
  SideMenuController,
  useBlockNoteEditor,
  useComponentsContext,
  useExtensionState,
} from "@blocknote/react";
import { Menu, NumberInput } from "@mantine/core";
import { useEffect, useState } from "react";

/** Distribute 100% equally across `count` columns, giving any remainder to the first. */
function distributeEqually(count: number): number[] {
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, i) => (i === 0 ? base + remainder : base));
}

/**
 * Isolated width input for a single column.
 * Uses local state so typing / spinner clicks never call editor.updateBlock()
 * mid-keystroke (which would trigger a re-render and close the menu).
 * The editor is only updated on blur or Enter.
 */
function ColumnWidthInput({
  column,
  maxForThis,
  editor,
}: {
  column: any;
  maxForThis: number;
  editor: any;
}) {
  const [localWidth, setLocalWidth] = useState<number>(column.props?.width ?? 50);

  // Sync if an external action (add/remove column) changes the stored width
  useEffect(() => {
    setLocalWidth(column.props?.width ?? 50);
  }, [column.props?.width]);

  const commit = (val: number) => {
    const clamped = Math.min(Math.max(10, val), maxForThis);
    editor.updateBlock(column.id, { props: { width: clamped } });
  };

  return (
    <NumberInput
      size="xs"
      label="Width"
      value={localWidth}
      min={10}
      max={maxForThis}
      step={5}
      suffix="%"
      contentEditable={false}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(value) => {
        // Only update local state — do NOT call editor.updateBlock here,
        // as that would trigger a re-render that closes the Mantine menu.
        const num = typeof value === "number" ? value : parseFloat(value as string);
        if (!isNaN(num)) setLocalWidth(num);
      }}
      onBlur={() => commit(localWidth)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit(localWidth);
      }}
    />
  );
}

/**
 * Extra section shown in the drag-handle dropdown ONLY for columnList blocks.
 * Shows width controls for each column, plus add/remove actions.
 * Returns null for every other block type.
 */
function ColumnSettingsSection() {
  const editor = useBlockNoteEditor() as any;
  const Components = useComponentsContext()!;

  const block = useExtensionState(SideMenuExtension, {
    selector: (state: any) => state?.block,
  }) as any;

  if (!block || block.type !== "columnList") return null;

  // Read columns FRESH from the editor each render.
  // block.children from useExtensionState is a stale snapshot captured on hover;
  // editor.getBlock() always returns the current live state.
  const freshBlock = editor.getBlock(block.id);
  const columns = (freshBlock?.children || []) as any[];
  const maxColumns = 5;

  return (
    <>
      <Menu.Divider />
      <Menu.Label>Column Settings</Menu.Label>

      {/* Add Column — hidden when the column limit is reached */}
      {columns.length < maxColumns && (
        <Components.Generic.Menu.Item
          onClick={() => {
            const newCount = columns.length + 1;
            const widths = distributeEqually(newCount);
            columns.forEach((col: any, i: number) => {
              editor.updateBlock(col.id, { props: { width: widths[i] } });
            });
            const newColumn: any = {
              type: "column",
              props: { width: widths[newCount - 1] },
              children: [{ type: "paragraph", content: [] }],
            };
            editor.insertBlocks([newColumn], columns[columns.length - 1], "after");
          }}
        >
          Add Column
        </Components.Generic.Menu.Item>
      )}

      {/* Per-column width controls */}
      {columns.map((column: any, index: number) => {
        const otherTotal = columns
          .filter((c: any) => c.id !== column.id)
          .reduce((sum: number, c: any) => sum + (c.props?.width ?? 50), 0);
        const maxForThis = Math.max(10, 100 - otherTotal);

        return (
          <div
            key={column.id}
            style={{ padding: "4px 12px 8px", display: "flex", flexDirection: "column", gap: 6 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>
                Column {index + 1}
              </span>
              {columns.length > 1 && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--mantine-color-red-6, #fa5252)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    marginLeft: "auto",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const remaining = columns.filter((c: any) => c.id !== column.id);
                    const widths = distributeEqually(remaining.length);
                    remaining.forEach((col: any, i: number) => {
                      editor.updateBlock(col.id, { props: { width: widths[i] } });
                    });
                    editor.removeBlocks([column.id]);
                  }}
                >
                  Remove
                </span>
              )}
            </div>
            <ColumnWidthInput column={column} maxForThis={maxForThis} editor={editor} />
          </div>
        );
      })}
    </>
  );
}

/** Custom drag-handle dropdown — adds Column Settings for columnList blocks. */
const CustomDragHandleMenu = () => (
  <DragHandleMenu>
    <RemoveBlockItem>Delete</RemoveBlockItem>
    <BlockColorsItem>Colors</BlockColorsItem>
    <ColumnSettingsSection />
  </DragHandleMenu>
);

/** Drop-in replacement for BlockNote's default SideMenuController. */
export function CustomSideMenuController() {
  return (
    <SideMenuController
      sideMenu={(props) => (
        <SideMenu {...props} dragHandleMenu={CustomDragHandleMenu} />
      )}
    />
  );
}
