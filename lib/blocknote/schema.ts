import { BlockNoteSchema } from "@blocknote/core";
import { createAlert } from "./blocks/alert";
import { createColumnList } from "./blocks/column-list";
import { createColumn } from "./blocks/column";
import { createEmbed } from "./blocks/embed";
import { createButton } from "./blocks/button";
import { createLinkPreview } from "./blocks/link-preview";
import { createHeadingLine } from "./blocks/heading-line";
import { createAudio } from "./blocks/audio";
import { createTag } from "./inline-content/tag";

/**
 * Custom BlockNote schema for the portfolio website.
 * 
 * This schema extends the default BlockNote schema with custom blocks,
 * inline content, and styles as needed.
 * 
 * Pattern: BlockNoteSchema.create().extend({ ... })
 * - Start with empty extend initially
 * - Add blockSpecs, inlineContentSpecs, or styleSpecs keys only when custom elements are added
 * 
 * Documentation: docs/blocknote-documentation/docs/features/custom-schemas/index.mdx
 * Example: docs/blocknote-documentation/examples/06-custom-schema/05-alert-block-full-ux/src/App.tsx
 */
export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    // Alert block (first custom block, based on official Alert Block with Full UX example)
    alert: createAlert(),
    // Multi-column layout blocks (Step 7.3)
    columnList: createColumnList(),
    column: createColumn(),
    // Embed block for YouTube, Instagram, and generic iframes
    embed: createEmbed(),
    // Button block — clickable action button (external URL / download / internal tab)
    button: createButton(),
    // Link Preview block — fetches page metadata and renders a compact banner
    linkPreview: createLinkPreview(),
    // Heading Line block — H2–H6 heading with a full-width 5px burgundy rule
    headingLine: createHeadingLine(),
    // Audio block — wavesurfer.js waveform player with Cloudinary upload
    audio: createAudio(),
  },
  inlineContentSpecs: {
    // Text tag — inline pill with external URL / download / internal tab action
    tag: createTag(),
  },
  // styleSpecs: {
  //   // Custom styles will be added here as they are created
  //   // Example: font: createFont(),
  // },
});
