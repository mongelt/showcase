import { createReactBlockSpec } from "@blocknote/react";
import "./column.css";

/**
 * ColumnList block — the container that holds column blocks in a horizontal layout.
 *
 * In editor mode: renders a thin .column-list-handle bar that gives the block
 * a hover target so BlockNote's side menu (⠿ and +) can appear for it.
 * Hovering the bar → drag handle appears → click ⠿ → Column Settings section.
 *
 * In renderer (read-only): renders an invisible .column-list div (display:none via CSS)
 * that still exists in the DOM so :has(.column-list) selectors remain active.
 */
export const createColumnList = createReactBlockSpec(
  {
    type: "columnList",
    propSchema: {},
    content: "none",
  },
  {
    render: (props) => (
      <div className="column-list" contentEditable={false}>
        {props.editor.isEditable && <div className="column-list-handle" />}
      </div>
    ),
  }
);
