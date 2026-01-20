import { jsPDF } from 'jspdf';
import type { Document, TextObject, ImageObject } from '../model/types';
import { NOTEBOOK } from '../model/types';
import { getWrapWidth, getFoldLinePositions, inchesToPoints } from '../utils';

export interface ExportOptions {
  includeBleed: boolean;
  includeFoldLines: boolean;
  includeSafeArea: boolean;
  includeCenterline: boolean;
}

export async function exportToPDF(
  doc: Document,
  options: ExportOptions
): Promise<Blob> {
  const { settings, front, back, wrapImage } = doc;

  // Calculate dimensions
  const wrapWidth = getWrapWidth(settings.spineWidth);
  const bleed = options.includeBleed && settings.bleedEnabled ? settings.bleedAmount : 0;

  const pageWidth = wrapWidth + bleed * 2;
  const pageHeight = NOTEBOOK.HEIGHT + bleed * 2;

  // Convert to points (72 per inch)
  const pageWidthPt = inchesToPoints(pageWidth);
  const pageHeightPt = inchesToPoints(pageHeight);

  // Create PDF
  const pdf = new jsPDF({
    orientation: pageWidthPt > pageHeightPt ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pageWidthPt, pageHeightPt],
  });

  // Offset for bleed
  const offsetX = inchesToPoints(bleed);
  const offsetY = inchesToPoints(bleed);

  const coverWidthPt = inchesToPoints(NOTEBOOK.WIDTH);
  const coverHeightPt = inchesToPoints(NOTEBOOK.HEIGHT);
  const spineWidthPt = inchesToPoints(settings.spineWidth);
  const cornerRadiusPt = inchesToPoints(NOTEBOOK.CORNER_RADIUS);
  const wrapWidthPt = inchesToPoints(wrapWidth);

  // Wrap image will be drawn on the canvas below if enabled

  // The wrap is one continuous piece. We draw:
  // 1. Back cover (tan) - extends from left edge through spine
  // 2. Front cover (orange) - extends from spine|front fold line to right edge
  // Only the outer edges (left of back, right of front) have rounded corners

  // Use canvas-based rendering for reliable shape drawing
  const canvas = window.document.createElement('canvas');
  const dpi = 300;
  const scale = dpi / 72; // Scale factor from points to pixels at 300 DPI
  canvas.width = Math.round(wrapWidthPt * scale);
  canvas.height = Math.round(coverHeightPt * scale);
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.scale(scale, scale);

    // Draw back cover + spine background with rounded left corners
    ctx.fillStyle = back.backgroundColor;
    ctx.beginPath();
    drawPartialRoundedRectPath(ctx, 0, 0, coverWidthPt + spineWidthPt, coverHeightPt, cornerRadiusPt, true, false, false, true);
    ctx.fill();

    // Draw front cover background with rounded right corners
    ctx.fillStyle = front.backgroundColor;
    ctx.beginPath();
    drawPartialRoundedRectPath(ctx, coverWidthPt + spineWidthPt, 0, coverWidthPt, coverHeightPt, cornerRadiusPt, false, true, true, false);
    ctx.fill();

    // Draw wrap image if enabled (spans entire wrap)
    if (wrapImage.enabled && wrapImage.src) {
      await drawWrapImageToCanvas(
        ctx,
        wrapImage.src,
        inchesToPoints(wrapImage.position.x),
        inchesToPoints(wrapImage.position.y),
        inchesToPoints(wrapImage.size.width),
        inchesToPoints(wrapImage.size.height),
        wrapImage.opacity
      );
    }

    // Load and draw images for back cover objects
    for (const obj of back.objects) {
      if (obj.visible && obj.type === 'image') {
        await drawImageToCanvas(ctx, obj as ImageObject, 0, 0);
      }
    }

    // Load and draw images for front cover objects
    for (const obj of front.objects) {
      if (obj.visible && obj.type === 'image') {
        await drawImageToCanvas(ctx, obj as ImageObject, coverWidthPt + spineWidthPt, 0);
      }
    }

    // Draw text for back cover
    for (const obj of back.objects) {
      if (obj.visible && obj.type === 'text') {
        drawTextToCanvas(ctx, obj as TextObject, 0, 0);
      }
    }

    // Draw text for front cover
    for (const obj of front.objects) {
      if (obj.visible && obj.type === 'text') {
        drawTextToCanvas(ctx, obj as TextObject, coverWidthPt + spineWidthPt, 0);
      }
    }

    // Add the canvas as an image to the PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, wrapWidthPt, coverHeightPt);
  }

  // Draw fold lines
  if (options.includeFoldLines) {
    const { backFold, frontFold } = getFoldLinePositions(settings.spineWidth);

    pdf.setDrawColor(0, 153, 255); // Blue
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([4, 4], 0);

    // Back|Spine fold
    const backFoldX = offsetX + inchesToPoints(backFold);
    pdf.line(backFoldX, offsetY, backFoldX, offsetY + coverHeightPt);

    // Spine|Front fold
    const frontFoldX = offsetX + inchesToPoints(frontFold);
    pdf.line(frontFoldX, offsetY, frontFoldX, offsetY + coverHeightPt);

    pdf.setLineDashPattern([], 0);
  }

  // Draw safe area guide
  if (options.includeSafeArea) {
    const safeInset = inchesToPoints(settings.safeAreaInset);

    pdf.setDrawColor(0, 255, 102); // Green
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([2, 2], 0);

    drawRoundedRectPath(
      pdf,
      offsetX + safeInset,
      offsetY + safeInset,
      wrapWidthPt - safeInset * 2,
      coverHeightPt - safeInset * 2,
      Math.max(0, cornerRadiusPt - safeInset)
    );

    pdf.setLineDashPattern([], 0);
  }

  // Draw centerline
  if (options.includeCenterline) {
    const centerX = offsetX + wrapWidthPt / 2;

    pdf.setDrawColor(255, 204, 0); // Yellow
    pdf.setLineWidth(0.5);
    pdf.setLineDashPattern([2, 4], 0);

    pdf.line(centerX, offsetY, centerX, offsetY + coverHeightPt);

    pdf.setLineDashPattern([], 0);
  }

  // Draw cut line (always included, on top)
  pdf.setDrawColor(255, 0, 102); // Magenta/pink
  pdf.setLineWidth(1);
  pdf.setLineDashPattern([8, 4], 0);

  // Draw rounded rectangle cut line
  drawRoundedRectPath(
    pdf,
    offsetX,
    offsetY,
    wrapWidthPt,
    coverHeightPt,
    cornerRadiusPt
  );

  pdf.setLineDashPattern([], 0);

  return pdf.output('blob');
}

// Draw a partial rounded rect path on a canvas context
function drawPartialRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  roundTopLeft: boolean,
  roundTopRight: boolean,
  roundBottomRight: boolean,
  roundBottomLeft: boolean
): void {
  const r = radius;

  ctx.moveTo(x + (roundTopLeft ? r : 0), y);

  // Top edge
  ctx.lineTo(x + width - (roundTopRight ? r : 0), y);

  // Top-right corner
  if (roundTopRight) {
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  }

  // Right edge
  ctx.lineTo(x + width, y + height - (roundBottomRight ? r : 0));

  // Bottom-right corner
  if (roundBottomRight) {
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  }

  // Bottom edge
  ctx.lineTo(x + (roundBottomLeft ? r : 0), y + height);

  // Bottom-left corner
  if (roundBottomLeft) {
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  }

  // Left edge
  ctx.lineTo(x, y + (roundTopLeft ? r : 0));

  // Top-left corner
  if (roundTopLeft) {
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  ctx.closePath();
}

// Draw text to canvas
function drawTextToCanvas(
  ctx: CanvasRenderingContext2D,
  obj: TextObject,
  offsetX: number,
  offsetY: number
): void {
  const x = offsetX + inchesToPoints(obj.position.x);
  const y = offsetY + inchesToPoints(obj.position.y);
  const width = inchesToPoints(obj.width);

  ctx.save();
  ctx.globalAlpha = obj.opacity;
  ctx.fillStyle = obj.fill;

  // Set font
  const fontWeight = obj.fontWeight >= 600 ? 'bold' : 'normal';
  ctx.font = `${fontWeight} ${obj.fontSize}pt sans-serif`;
  ctx.textBaseline = 'top';

  // Handle text alignment
  if (obj.textAlign === 'center') {
    ctx.textAlign = 'center';
  } else if (obj.textAlign === 'right') {
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'left';
  }

  // Calculate x position based on alignment
  let textX = x;
  if (obj.textAlign === 'center') {
    textX = x + width / 2;
  } else if (obj.textAlign === 'right') {
    textX = x + width;
  }

  // Draw each line
  const lines = obj.content.split('\n');
  const lineHeight = obj.fontSize * obj.lineHeight;

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, y + index * lineHeight);
  });

  ctx.restore();
}

// Draw image to canvas
async function drawImageToCanvas(
  ctx: CanvasRenderingContext2D,
  obj: ImageObject,
  offsetX: number,
  offsetY: number
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const x = offsetX + inchesToPoints(obj.position.x);
      const y = offsetY + inchesToPoints(obj.position.y);
      const width = inchesToPoints(obj.size.width);
      const height = inchesToPoints(obj.size.height);

      ctx.save();
      ctx.globalAlpha = obj.opacity;
      ctx.drawImage(img, x, y, width, height);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = obj.src;
  });
}

// Draw wrap image to canvas (for images that span the entire wrap)
async function drawWrapImageToCanvas(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: number
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, x, y, width, height);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

// Draw a rounded rectangle path (stroke only) using jsPDF
function drawRoundedRectPath(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  // Use jsPDF's built-in roundedRect for stroke
  pdf.roundedRect(x, y, width, height, radius, radius, 'S');
}

export async function exportToPNG(
  doc: Document,
  scale: number = 300 / 72 // 300 DPI
): Promise<Blob> {
  const { settings } = doc;

  // Calculate dimensions
  const wrapWidth = getWrapWidth(settings.spineWidth);

  // Create canvas at high DPI
  const canvas = document.createElement('canvas');
  const widthPx = Math.round(wrapWidth * scale * 72);
  const heightPx = Math.round(NOTEBOOK.HEIGHT * scale * 72);

  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // For now, return a placeholder - full PNG export would require
  // rendering the Konva stage to canvas
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
}
