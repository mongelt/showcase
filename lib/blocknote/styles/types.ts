import { schema } from "../schema";

/**
 * TypeScript types for custom styles using schema-based typing pattern.
 * 
 * These types provide full type safety and autocompletion for custom styles
 * when using the custom schema.
 * 
 * Documentation: docs/blocknote-documentation/docs/features/custom-schemas/index.mdx (lines 104-132)
 * Pattern: Use schema shorthands for type safety (per docs lines 128-132)
 * 
 * Note: The schema only exposes shorthands for BlockNoteEditor, Block, and PartialBlock.
 * Styles are typically used within text objects in blocks, and type safety is provided through
 * the editor and block types.
 */

/**
 * BlockNoteEditor type with custom schema (includes style types).
 * Use this type when you need a typed editor instance that supports custom styles.
 * 
 * Example:
 * ```typescript
 * const editor: CustomStyleEditor = useCreateBlockNote({ schema });
 * ```
 * 
 * When working with styles, use them within text objects in blocks:
 * ```typescript
 * const block: PartialBlock = {
 *   type: "paragraph",
 *   content: [
 *     {
 *       type: "text",
 *       text: "Styled text",
 *       styles: {
 *         font: "Comic Sans MS",
 *         bold: true,
 *       },
 *     },
 *   ],
 * };
 * ```
 */
export type CustomStyleEditor = typeof schema.BlockNoteEditor;
