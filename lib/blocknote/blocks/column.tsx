import { useRef, useEffect } from "react";
import { createReactBlockSpec } from "@blocknote/react";

import "./column.css";

export const createColumn = createReactBlockSpec(
  {
    type: "column",
    propSchema: {
      width: {
        default: 50,
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const ref = useRef<HTMLDivElement>(null);

      // Set flex on the .bn-block-outer so each column takes its percentage of the
      // container. flex-shrink:1 allows slight shrink when gap pushes total over 100%.
      useEffect(() => {
        if (!ref.current) return;
        const blockOuter = ref.current.closest(".bn-block-outer") as HTMLElement | null;
        if (blockOuter) {
          blockOuter.style.flex = `0 1 ${props.block.props.width}%`;
        }
      }, [props.block.props.width]);

      return (
        <div
          ref={ref}
          className="column"
          data-column-width={props.block.props.width}
        />
      );
    },
    meta: {
      isolating: true,
    },
  }
);
