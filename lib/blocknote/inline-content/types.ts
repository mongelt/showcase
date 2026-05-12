import { schema } from "../schema";

/**
 * TypeScript types for custom inline content using schema-based typing pattern.
 * 
 * These types provide full type safety and autocompletion for custom inline content
 * when using the custom schema.
 * 
 * Documentation: docs/blocknote-documentation/docs/features/custom-schemas/index.mdx (lines 104-132)
 * Pattern: Use schema shorthands for type safety (per docs lines 128-132)
 * 
 * Note: The schema only exposes shorthands for BlockNoteEditor, Block, and PartialBlock.
 * Inline content is typically used within blocks, and type safety is provided through
 * the editor and block types.
 */

/**
 * BlockNoteEditor type with custom schema (includes inline content types).
 * Use this type when you need a typed editor instance that supports custom inline content.
 * 
 * Example:
 * ```typescript
 * const editor: CustomInlineContentEditor = useCreateBlockNote({ schema });
 * ```
 * 
 * When working with inline content, use the editor's methods which provide type safety:
 * ```typescript
 * editor.insertInlineContent([
 *   { type: "textTag", props: { url: "https://example.com" } },
 *   " ",
 * ]);
 * ```
 */
export type CustomInlineContentEditor = typeof schema.BlockNoteEditor;
