import { schema } from "../schema";

/**
 * TypeScript types for custom blocks using schema-based typing pattern.
 * 
 * These types provide full type safety and autocompletion for custom blocks
 * when using the custom schema.
 * 
 * Documentation: docs/blocknote-documentation/docs/features/custom-schemas/index.mdx (lines 104-132)
 * Pattern: Use schema shorthands for type safety (per docs lines 128-132)
 */

/**
 * BlockNoteEditor type with custom schema.
 * Use this type when you need a typed editor instance.
 * 
 * Example:
 * ```typescript
 * const editor: CustomBlockNoteEditor = useCreateBlockNote({ schema });
 * ```
 */
export type CustomBlockNoteEditor = typeof schema.BlockNoteEditor;

/**
 * Block type with custom schema.
 * Use this type when working with block objects from the custom schema.
 * 
 * Example:
 * ```typescript
 * const block: CustomBlock = editor.getTextCursorPosition().block;
 * ```
 */
export type CustomBlock = typeof schema.Block;

/**
 * PartialBlock type with custom schema.
 * Use this type when creating or updating blocks.
 * 
 * Example:
 * ```typescript
 * const newBlock: CustomPartialBlock = {
 *   type: "alert",
 *   content: "This is an alert",
 * };
 * ```
 */
export type CustomPartialBlock = typeof schema.PartialBlock;
