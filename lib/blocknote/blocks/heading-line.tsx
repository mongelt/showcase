import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";

import "./heading-line.css";

/**
 * Heading Line Block for BlockNote
 *
 * A custom heading block (H2–H6) with a full-width 5px burgundy (#fc5454)
 * rule underneath the heading text. Text is always left-aligned.
 *
 * Props:
 * - level: "2" | "3" | "4" | "5" | "6" — heading level
 * - textColor: inherited from defaultProps
 *
 * Content: "inline" — editable rich text for the heading label.
 *
 * Usage in schema:
 * ```typescript
 * import { createHeadingLine } from './blocks/heading-line';
 *
 * const schema = BlockNoteSchema.create().extend({
 *   blockSpecs: {
 *     headingLine: createHeadingLine(),
 *   },
 * });
 * ```
 */
export const createHeadingLine = createReactBlockSpec(
  {
    type: "headingLine",
    propSchema: {
      textColor: defaultProps.textColor,
      level: {
        default: "2",
        values: ["2", "3", "4", "5", "6"],
      },
    },
    content: "inline",
  },
  {
    render: (props) => (
      <div className="heading-line-block">
        <div
          className={`heading-line-text heading-line-level-${props.block.props.level}`}
          ref={props.contentRef}
        />
        <div className="heading-line-rule" contentEditable={false} />
      </div>
    ),
  },
);
