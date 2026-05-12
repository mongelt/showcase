# BlockNote Customization Framework

This directory contains the foundational framework for customizing BlockNote in the portfolio website. The framework provides structure for creating custom blocks, inline content, styles, UI components, and utility functions.

## Overview

The BlockNote customization framework is organized into several key areas:

- **Schema**: Custom schema definition (`schema.ts`)
- **Types**: TypeScript type definitions for blocks, inline content, and styles
- **UI Components**: Framework for customizing UI components (slash menu, formatting toolbar, side menu, etc.)
- **Utilities**: HTML conversion and PDF export utilities
- **Integration**: Centralized export file (`index.ts`)

## Directory Structure

```
lib/blocknote/
├── schema.ts                    # Custom BlockNote schema
├── index.ts                     # Centralized exports (organizational convenience)
├── README.md                    # This file
│
├── blocks/                      # Custom blocks
│   └── types.ts                # Block TypeScript types
│
├── inline-content/              # Custom inline content
│   └── types.ts                # Inline content TypeScript types
│
├── styles/                      # Custom styles
│   └── types.ts                # Style TypeScript types
│
├── ui/                          # UI customization framework
│   ├── slash-menu.tsx          # Slash menu items
│   ├── block-type-select.tsx  # Block type select items
│   ├── side-menu.tsx          # Side menu factory
│   ├── drag-handle-menu.tsx  # Drag handle menu factory
│   ├── slash-menu-component.tsx # Slash menu component factory
│   └── grid-suggestion-menu.tsx # Grid suggestion menu (emoji picker) factory
│
└── utils/                       # Utility functions
    ├── html-conversion.ts      # HTML import/export utilities
    ├── pdf-export.ts           # PDF export utilities
    └── pdf-generator/          # Custom PDF generator (foundation only)
        ├── index.ts
        └── README.md
```

## Usage

### Importing Framework Components

All framework components can be imported from the centralized export file:

```typescript
import {
  schema,
  CustomBlockNoteEditor,
  CustomBlock,
  getCustomSlashMenuItems,
  convertBlocksToHTML,
  createPDFGenerator,
} from '@/lib/blocknote'
```

### Using the Custom Schema

The custom schema is already integrated into `BlockNoteEditor` and `BlockNoteRenderer` components. To use it in other places:

```typescript
import { schema } from '@/lib/blocknote'
import { useCreateBlockNote } from '@blocknote/react'

const editor = useCreateBlockNote({
  schema,
  initialContent: [...],
})
```

### TypeScript Types

Use schema-based types for type safety:

```typescript
import type {
  CustomBlockNoteEditor,
  CustomBlock,
  CustomPartialBlock,
} from '@/lib/blocknote'

// Editor instance
const editor: CustomBlockNoteEditor = useCreateBlockNote({ schema })

// Block objects
const block: CustomBlock = editor.document[0]

// Creating blocks
const newBlock: CustomPartialBlock = {
  type: 'paragraph',
  content: 'Hello, world!',
}
```

## Creating Custom Blocks

**Official Documentation:** `docs/blocknote-documentation/docs/features/custom-schemas/custom-blocks/`

**Example:** `docs/blocknote-documentation/examples/06-custom-schema/01-alert-block/src/App.tsx`

1. Create a block spec file in `lib/blocknote/blocks/` (e.g., `alert.tsx`)
2. Use `createReactBlockSpec` from `@blocknote/react`
3. Import and add to schema in `lib/blocknote/schema.ts`:

```typescript
// lib/blocknote/blocks/alert.tsx
import { createReactBlockSpec } from '@blocknote/react'

export const createAlert = () => {
  return createReactBlockSpec({
    type: 'alert',
    propSchema: {
      backgroundColor: {
        default: 'default',
        values: ['default', 'red', 'orange', 'yellow', 'green', 'blue'],
      },
    },
    content: 'inline',
  }, {
    render: (props) => {
      return <div className={`alert alert-${props.block.props.backgroundColor}`}>
        {props.content}
      </div>
    },
  })
}

// lib/blocknote/schema.ts
import { createAlert } from './blocks/alert'

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    alert: createAlert(),
  },
})
```

## Creating Custom Inline Content

**Official Documentation:** `docs/blocknote-documentation/docs/features/custom-schemas/custom-inline-content/`

**Example:** `docs/blocknote-documentation/examples/06-custom-schema/react-custom-inline-content/src/App.tsx`

1. Create an inline content spec file in `lib/blocknote/inline-content/` (e.g., `mention.tsx`)
2. Use `createReactInlineContentSpec` from `@blocknote/react`
3. Import and add to schema in `lib/blocknote/schema.ts`

## Creating Custom Styles

**Official Documentation:** `docs/blocknote-documentation/docs/features/custom-schemas/custom-styles/`

**Example:** `docs/blocknote-documentation/examples/06-custom-schema/react-custom-styles/src/App.tsx`

1. Create a style spec file in `lib/blocknote/styles/` (e.g., `font.tsx`)
2. Use `createReactStyleSpec` from `@blocknote/react`
3. Import and add to schema in `lib/blocknote/schema.ts`

## UI Customization

### Slash Menu

**Official Documentation:** `docs/blocknote-documentation/docs/react/components/suggestion-menus.mdx`

**Example:** `docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx`

Use `getCustomSlashMenuItems` from `@/lib/blocknote` to customize slash menu items:

```typescript
import { getCustomSlashMenuItems } from '@/lib/blocknote'
import { SuggestionMenuController } from '@blocknote/react'

<SuggestionMenuController
  triggerCharacter="/"
  getItems={getCustomSlashMenuItems}
/>
```

### Block Type Select

**Official Documentation:** `docs/blocknote-documentation/docs/react/components/formatting-toolbar.mdx`

**Example:** `docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx`

Use `getCustomBlockTypeSelectItems` from `@/lib/blocknote`:

```typescript
import { getCustomBlockTypeSelectItems } from '@/lib/blocknote'
import { FormattingToolbar, FormattingToolbarController } from '@blocknote/react'

<FormattingToolbarController
  formattingToolbar={() => (
    <FormattingToolbar
      blockTypeSelectItems={getCustomBlockTypeSelectItems(editor)}
    />
  )}
/>
```

### Side Menu

**Official Documentation:** `docs/blocknote-documentation/docs/react/components/side-menu.mdx`

**Example:** `docs/blocknote-documentation/examples/03-ui-components/04-side-menu-buttons/src/App.tsx`

Use `createCustomSideMenu` from `@/lib/blocknote`:

```typescript
import { createCustomSideMenu } from '@/lib/blocknote'
import { SideMenuController } from '@blocknote/react'

<SideMenuController sideMenu={createCustomSideMenu(editor)} />
```

## HTML Conversion

**Official Documentation:**
- Export: `docs/blocknote-documentation/docs/features/export/html.mdx`
- Import: `docs/blocknote-documentation/docs/features/import/html.mdx`

**Examples:**
- `docs/blocknote-documentation/examples/05-interoperability/01-converting-blocks-to-html/src/App.tsx`
- `docs/blocknote-documentation/examples/05-interoperability/02-converting-blocks-from-html/src/App.tsx`

```typescript
import {
  convertHTMLToBlocks,
  convertBlocksToHTMLLossy,
  convertBlocksToFullHTML,
} from '@/lib/blocknote'

// Convert HTML to blocks
const blocks = convertHTMLToBlocks(editor, '<p>Hello, world!</p>')

// Convert blocks to interoperable HTML
const html = convertBlocksToHTMLLossy(editor, editor.document)

// Convert blocks to full BlockNote HTML
const fullHTML = convertBlocksToFullHTML(editor, editor.document)
```

## PDF Export

**Official Documentation:** `docs/blocknote-documentation/docs/features/export/pdf.mdx`

**Example:** `docs/blocknote-documentation/examples/05-interoperability/05-converting-blocks-to-pdf/src/App.tsx`

**Note:** This uses a custom PDF generator (`pdf-generator`) instead of `@blocknote/xl-pdf-exporter` (which is a licensed product).

```typescript
import {
  createPDFGenerator,
  convertBlocksToPDF,
} from '@/lib/blocknote'
import { pdf, PDFViewer } from '@react-pdf/renderer'

// Convert blocks to PDF
const pdfDocument = await convertBlocksToPDF(editor, editor.document, {
  header: <Text>Header</Text>,
  footer: <Text>Footer</Text>,
})

// Render in viewer
<PDFViewer>{pdfDocument}</PDFViewer>

// Download as file
const blob = await pdf(pdfDocument).toBlob()
```

**Status:** PDF generator is foundation only - full implementation will be completed in later phases.

## Important Notes

### Official Documentation is Authoritative

All framework code follows patterns from the official BlockNote documentation located in `docs/blocknote-documentation/`. When in doubt, refer to the official documentation rather than training data.

### Schema Pattern

Custom blocks/inline content/styles are added directly to schema `blockSpecs`/`inlineContentSpecs`/`styleSpecs` objects (per `custom-schemas/index.mdx` lines 40-58), NOT through wrapper functions.

### Type Safety

Use TypeScript types from schema (per `custom-schemas/index.mdx` lines 104-132):
- `typeof schema.BlockNoteEditor` → `CustomBlockNoteEditor`
- `typeof schema.Block` → `CustomBlock`
- `typeof schema.PartialBlock` → `CustomPartialBlock`

### File Organization

Each custom block/inline content/style should be in its own file and imported into `schema.ts` (per example patterns).

### UI Customization

All UI customization is optional - you can use defaults or provide custom components. Only set flags like `slashMenu={false}` when providing custom components (per documentation).

## Framework Status

- ✅ Schema framework: Complete
- ✅ Type definitions: Complete
- ✅ UI customization framework: Complete (ready for custom blocks)
- ✅ HTML conversion utilities: Complete
- ✅ PDF export framework: Foundation only (full implementation pending)
- ✅ Integration file: Complete

## Next Steps

1. Create custom blocks as needed (see "Creating Custom Blocks" above)
2. Create custom inline content as needed (see "Creating Custom Inline Content" above)
3. Create custom styles as needed (see "Creating Custom Styles" above)
4. Implement full PDF generator functionality (currently foundation only)

## References

- **Official Documentation:** `docs/blocknote-documentation/`
- **Examples:** `docs/blocknote-documentation/examples/`
- **Development Plan:** `docs/website-development/blocknote.md`
