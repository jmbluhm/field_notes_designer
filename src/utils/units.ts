import { NOTEBOOK } from '../model/types';

// Convert inches to pixels for on-screen display
export function inchesToPixels(inches: number, scale: number): number {
  return inches * scale;
}

// Convert pixels to inches
export function pixelsToInches(pixels: number, scale: number): number {
  return pixels / scale;
}

// Convert inches to PDF points (72 points per inch)
export function inchesToPoints(inches: number): number {
  return inches * 72;
}

// Convert points to inches
export function pointsToInches(points: number): number {
  return points / 72;
}

// Convert font size from points to pixels for canvas
export function fontSizeToPixels(points: number, scale: number): number {
  // Font size in points, converted to inches, then to screen pixels
  return (points / 72) * scale;
}

// Get the total wrap width (back + spine + front)
export function getWrapWidth(spineWidth: number): number {
  return NOTEBOOK.WIDTH + spineWidth + NOTEBOOK.WIDTH;
}

// Get the wrap dimensions with optional bleed
export function getWrapDimensions(
  spineWidth: number,
  bleedEnabled: boolean,
  bleedAmount: number
): { width: number; height: number } {
  const baseWidth = getWrapWidth(spineWidth);
  const baseHeight = NOTEBOOK.HEIGHT;

  if (bleedEnabled) {
    return {
      width: baseWidth + bleedAmount * 2,
      height: baseHeight + bleedAmount * 2,
    };
  }

  return { width: baseWidth, height: baseHeight };
}

// Get positions for fold lines
export function getFoldLinePositions(spineWidth: number): { backFold: number; frontFold: number } {
  return {
    backFold: NOTEBOOK.WIDTH, // position where back meets spine
    frontFold: NOTEBOOK.WIDTH + spineWidth, // position where spine meets front
  };
}

// Calculate effective DPI of an image at a given placed size
export function calculateEffectiveDPI(
  originalWidthPx: number,
  originalHeightPx: number,
  placedWidthInches: number,
  placedHeightInches: number
): { widthDPI: number; heightDPI: number; minDPI: number } {
  const widthDPI = originalWidthPx / placedWidthInches;
  const heightDPI = originalHeightPx / placedHeightInches;

  return {
    widthDPI,
    heightDPI,
    minDPI: Math.min(widthDPI, heightDPI),
  };
}

// Check if DPI is adequate for print
export function isDPIAdequate(dpi: number, minRequired: number = 150): boolean {
  return dpi >= minRequired;
}

// Format inches for display (e.g., "3.5 in")
export function formatInches(inches: number, decimals: number = 3): string {
  return `${inches.toFixed(decimals)}"`;
}

// Format millimeters for display
export function formatMillimeters(inches: number): string {
  const mm = inches * 25.4;
  return `${mm.toFixed(1)} mm`;
}
