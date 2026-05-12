/**
 * Layout Constants - Single Source of Truth
 *
 * CRITICAL: These constants are fixed layout constraints that cannot be changed
 * without breaking functionality.
 */

// ============================================================================
// ⚠️ CRITICAL CONSTANTS - DO NOT CHANGE (Will Break Functionality)
// ============================================================================

/**
 * Resume Tab - Side Card Width
 * ⚠️ CRITICAL: Used in timeline marker height calculations, cascade positioning, overlap detection
 * Changing this breaks all timeline math
 */
export const RESUME_SIDE_CARD_WIDTH_PX = 560

/**
 * Resume Tab - Center Card Width
 * ⚠️ CRITICAL: Used in center entry positioning calculations
 * Changing this breaks center entry placement
 */
export const RESUME_CENTER_CARD_WIDTH_PX = 384

/**
 * Resume Tab - Side Card Positioning Offset
 * ⚠️ CRITICAL: Fixed offset from center for timeline alignment
 * Left cards: right: calc(50% + 70px), Right cards: left: calc(50% + 70px)
 * Changing this breaks timeline alignment
 */
export const RESUME_SIDE_CARD_OFFSET_PX = 70

// ============================================================================
// Layout Constants
// ============================================================================

/**
 * Bottom Navigation Height
 * Note: must match --tab-bar-height in globals.css (64px)
 */
export const BOTTOM_NAV_HEIGHT_PX = 64
