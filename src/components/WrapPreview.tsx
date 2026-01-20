import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Line, Shape } from 'react-konva';
import type { Context } from 'konva/lib/Context';
import { useDocument } from '../hooks';
import type { TextObject, ImageObject, CanvasObject } from '../model/types';
import { NOTEBOOK } from '../model/types';
import { inchesToPixels, fontSizeToPixels, getWrapWidth, getFoldLinePositions } from '../utils';

interface WrapPreviewProps {
  previewScale?: number;
}

export function WrapPreview({ previewScale }: WrapPreviewProps) {
  const { document } = useDocument();
  const { settings, front, back, wrapImage } = document;

  // Use a smaller scale for the preview to fit in the panel
  const scale = previewScale ?? Math.min(settings.screenScale * 0.5, 72);

  const wrapWidth = getWrapWidth(settings.spineWidth);
  const stageWidth = inchesToPixels(wrapWidth, scale);
  const stageHeight = inchesToPixels(NOTEBOOK.HEIGHT, scale);
  const cornerRadius = inchesToPixels(NOTEBOOK.CORNER_RADIUS, scale);
  const spineWidth = inchesToPixels(settings.spineWidth, scale);
  const coverWidth = inchesToPixels(NOTEBOOK.WIDTH, scale);

  const { backFold, frontFold } = getFoldLinePositions(settings.spineWidth);
  const backFoldX = inchesToPixels(backFold, scale);
  const frontFoldX = inchesToPixels(frontFold, scale);

  const renderTextObject = (obj: TextObject, offsetX: number) => {
    const x = inchesToPixels(obj.position.x, scale) + offsetX;
    const y = inchesToPixels(obj.position.y, scale);
    const width = inchesToPixels(obj.width, scale);
    const fontSize = fontSizeToPixels(obj.fontSize, scale);

    return (
      <Text
        key={obj.id}
        x={x}
        y={y}
        width={width}
        text={obj.content}
        fontSize={fontSize}
        fontFamily={obj.fontFamily}
        fontStyle={obj.fontWeight >= 600 ? 'bold' : 'normal'}
        fill={obj.fill}
        stroke={obj.stroke}
        strokeWidth={obj.strokeWidth}
        opacity={obj.opacity}
        align={obj.textAlign}
        letterSpacing={obj.letterSpacing * fontSize}
        lineHeight={obj.lineHeight}
        rotation={obj.rotation}
        listening={false}
        visible={obj.visible}
      />
    );
  };

  const renderImageObject = (obj: ImageObject, offsetX: number) => {
    const x = inchesToPixels(obj.position.x, scale) + offsetX;
    const y = inchesToPixels(obj.position.y, scale);
    const width = inchesToPixels(obj.size.width, scale);
    const height = inchesToPixels(obj.size.height, scale);

    return (
      <ImageFromSrc
        key={obj.id}
        src={obj.src}
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={obj.opacity}
        rotation={obj.rotation}
      />
    );
  };

  const renderObject = (obj: CanvasObject, offsetX: number) => {
    if (!obj.visible) return null;

    switch (obj.type) {
      case 'text':
        return renderTextObject(obj, offsetX);
      case 'image':
        return renderImageObject(obj, offsetX);
      default:
        return null;
    }
  };

  // Create clip path for the wrap
  // Only the outer edges are rounded (left edge of back cover, right edge of front cover)
  // The spine area where covers meet has square corners
  const createWrapClipPath = (ctx: Context) => {
    ctx.beginPath();
    // Start top-left of back cover (rounded - outer edge)
    ctx.moveTo(cornerRadius, 0);
    // Top edge (all straight - spine area has no rounding)
    ctx.lineTo(stageWidth - cornerRadius, 0);
    // Top-right corner (rounded - outer edge of front cover)
    ctx.quadraticCurveTo(stageWidth, 0, stageWidth, cornerRadius);
    // Right edge
    ctx.lineTo(stageWidth, stageHeight - cornerRadius);
    // Bottom-right corner (rounded - outer edge of front cover)
    ctx.quadraticCurveTo(stageWidth, stageHeight, stageWidth - cornerRadius, stageHeight);
    // Bottom edge (all straight)
    ctx.lineTo(cornerRadius, stageHeight);
    // Bottom-left corner (rounded - outer edge of back cover)
    ctx.quadraticCurveTo(0, stageHeight, 0, stageHeight - cornerRadius);
    // Left edge
    ctx.lineTo(0, cornerRadius);
    // Top-left corner (rounded - outer edge of back cover)
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
  };

  return (
    <div className="wrap-preview-container">
      <Stage width={stageWidth} height={stageHeight}>
        <Layer>
          <Group clipFunc={createWrapClipPath}>
            {/* Back cover + spine background (continuous) */}
            <Rect
              x={0}
              y={0}
              width={coverWidth + spineWidth}
              height={stageHeight}
              fill={back.backgroundColor}
            />

            {/* Front cover background (overlaps slightly to prevent gaps) */}
            <Rect
              x={coverWidth + spineWidth}
              y={0}
              width={coverWidth}
              height={stageHeight}
              fill={front.backgroundColor}
            />

            {/* Wrap image if enabled */}
            {wrapImage.enabled && wrapImage.src && (
              <WrapImageLayer
                src={wrapImage.src}
                x={inchesToPixels(wrapImage.position.x, scale)}
                y={inchesToPixels(wrapImage.position.y, scale)}
                width={inchesToPixels(wrapImage.size.width, scale)}
                height={inchesToPixels(wrapImage.size.height, scale)}
                opacity={wrapImage.opacity}
              />
            )}

            {/* Back cover objects */}
            {back.objects.map((obj) => renderObject(obj, 0))}

            {/* Front cover objects */}
            {front.objects.map((obj) => renderObject(obj, coverWidth + spineWidth))}
          </Group>

          {/* Cut line outline - only outer corners rounded */}
          <Shape
            sceneFunc={(ctx, shape) => {
              const w = stageWidth - 2;
              const h = stageHeight - 2;
              const r = cornerRadius;
              ctx.beginPath();
              // Start top-left (rounded)
              ctx.moveTo(1 + r, 1);
              // Top edge
              ctx.lineTo(1 + w - r, 1);
              // Top-right corner (rounded)
              ctx.quadraticCurveTo(1 + w, 1, 1 + w, 1 + r);
              // Right edge
              ctx.lineTo(1 + w, 1 + h - r);
              // Bottom-right corner (rounded)
              ctx.quadraticCurveTo(1 + w, 1 + h, 1 + w - r, 1 + h);
              // Bottom edge
              ctx.lineTo(1 + r, 1 + h);
              // Bottom-left corner (rounded)
              ctx.quadraticCurveTo(1, 1 + h, 1, 1 + h - r);
              // Left edge
              ctx.lineTo(1, 1 + r);
              // Top-left corner (rounded)
              ctx.quadraticCurveTo(1, 1, 1 + r, 1);
              ctx.closePath();
              ctx.fillStrokeShape(shape);
            }}
            stroke="#ff0066"
            strokeWidth={2}
            dash={[8, 4]}
            listening={false}
          />

          {/* Fold lines */}
          {settings.showFoldLines && (
            <>
              <Line
                points={[backFoldX, 0, backFoldX, stageHeight]}
                stroke="#0099ff"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
              <Line
                points={[frontFoldX, 0, frontFoldX, stageHeight]}
                stroke="#0099ff"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            </>
          )}

          {/* Safe area guides */}
          {settings.showSafeArea && (
            <Rect
              x={inchesToPixels(settings.safeAreaInset, scale)}
              y={inchesToPixels(settings.safeAreaInset, scale)}
              width={stageWidth - inchesToPixels(settings.safeAreaInset * 2, scale)}
              height={stageHeight - inchesToPixels(settings.safeAreaInset * 2, scale)}
              stroke="#00ff66"
              strokeWidth={1}
              dash={[2, 2]}
              cornerRadius={Math.max(0, cornerRadius - inchesToPixels(settings.safeAreaInset, scale))}
              listening={false}
            />
          )}

          {/* Centerline */}
          {settings.showCenterline && (
            <Line
              points={[stageWidth / 2, 0, stageWidth / 2, stageHeight]}
              stroke="#ffcc00"
              strokeWidth={1}
              dash={[2, 4]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>

      <div className="wrap-preview-legend">
        <span className="legend-item">
          <span className="legend-color" style={{ background: '#ff0066' }}></span>
          Cut line
        </span>
        {settings.showFoldLines && (
          <span className="legend-item">
            <span className="legend-color" style={{ background: '#0099ff' }}></span>
            Fold lines
          </span>
        )}
        {settings.showSafeArea && (
          <span className="legend-item">
            <span className="legend-color" style={{ background: '#00ff66' }}></span>
            Safe area
          </span>
        )}
      </div>
    </div>
  );
}

// Helper components
interface ImageFromSrcProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation?: number;
}

function ImageFromSrc({ src, x, y, width, height, opacity, rotation = 0 }: ImageFromSrcProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImage(img);
    };
  }, [src]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={opacity}
      rotation={rotation}
      listening={false}
    />
  );
}

interface WrapImageLayerProps {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

function WrapImageLayer({ src, x, y, width, height, opacity }: WrapImageLayerProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
    };
  }, [src]);

  if (!image) return null;

  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={opacity}
      listening={false}
    />
  );
}
