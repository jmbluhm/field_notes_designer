import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group, Shape } from 'react-konva';
import type Konva from 'konva';
import { useDocument } from '../hooks';
import type { CanvasObject, TextObject, ImageObject, CoverSide } from '../model/types';
import { NOTEBOOK } from '../model/types';
import { inchesToPixels, fontSizeToPixels } from '../utils';
import { ZoomControls } from './ZoomControls';
import './CoverCanvas.css';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

interface CoverCanvasProps {
  side: 'front' | 'back';
  scale?: number;
}

export function CoverCanvas({ side, scale: customScale }: CoverCanvasProps) {
  const { document, selection, setSelection, dispatch } = useDocument();
  const coverData: CoverSide = side === 'front' ? document.front : document.back;
  const scale = customScale ?? document.settings.screenScale;

  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [textareaStyle, setTextareaStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stageWidth = inchesToPixels(NOTEBOOK.WIDTH, scale);
  const stageHeight = inchesToPixels(NOTEBOOK.HEIGHT, scale);
  const cornerRadius = inchesToPixels(NOTEBOOK.CORNER_RADIUS, scale);

  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const selectedShapeRef = useRef<Konva.Node | null>(null);

  // Calculate fit zoom on mount and when container resizes
  const hasInitializedZoom = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateFitZoom = (isInitial: boolean) => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate zoom that fits the canvas in the container with some padding
      const padding = 16;
      const availableWidth = containerWidth - padding * 2;
      const availableHeight = containerHeight - padding * 2;

      const scaleX = availableWidth / stageWidth;
      const scaleY = availableHeight / stageHeight;

      // Use the smaller scale to ensure both dimensions fit
      const newFitZoom = Math.min(scaleX, scaleY, 1); // Cap at 1 to not zoom in beyond 100%
      setFitZoom(newFitZoom);

      // Only set zoom on initial mount, not on every resize
      if (isInitial && !hasInitializedZoom.current) {
        setZoom(newFitZoom);
        hasInitializedZoom.current = true;
      }
    };

    // Calculate on mount
    calculateFitZoom(true);

    // Recalculate fitZoom on resize (but don't change current zoom)
    const resizeObserver = new ResizeObserver(() => calculateFitZoom(false));
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [stageWidth, stageHeight]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(fitZoom);
    // Scroll the container to center the canvas
    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, [fitZoom]);

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selection.side === side && selection.objectId) {
      const stage = stageRef.current;
      if (stage) {
        const node = stage.findOne(`#${selection.objectId}`);
        if (node) {
          selectedShapeRef.current = node;
          transformer.nodes([node]);
          transformer.getLayer()?.batchDraw();
          return;
        }
      }
    }

    transformer.nodes([]);
    selectedShapeRef.current = null;
  }, [selection, side]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click on empty area
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      setSelection({ side: null, objectId: null });
    }
  };

  const handleObjectClick = (objectId: string) => {
    setSelection({ side, objectId });
  };

  const handleTextDblClick = (obj: TextObject, e: Konva.KonvaEventObject<MouseEvent>) => {
    const textNode = e.target;
    const stage = stageRef.current;
    const stageWrapper = containerRef.current?.querySelector('.cover-canvas-stage-wrapper');

    if (!stage || !stageWrapper) return;

    // Hide the text node while editing
    textNode.hide();
    transformerRef.current?.hide();

    // Get the position of the text node relative to the stage
    const textPosition = textNode.getClientRect();
    const stageBox = stage.container().getBoundingClientRect();
    const wrapperBox = stageWrapper.getBoundingClientRect();

    // Calculate position relative to the stage wrapper (which has the zoom transform)
    const x = textPosition.x - stageBox.left + (stageBox.left - wrapperBox.left);
    const y = textPosition.y - stageBox.top + (stageBox.top - wrapperBox.top);

    const fontSize = fontSizeToPixels(obj.fontSize, scale);

    setEditingTextId(obj.id);
    setEditingTextValue(obj.content);
    setTextareaStyle({
      position: 'absolute',
      top: y,
      left: x,
      width: textPosition.width + 4,
      minHeight: textPosition.height + 4,
      fontSize: fontSize * zoom,
      fontFamily: obj.fontFamily,
      fontWeight: obj.fontWeight,
      color: obj.fill,
      textAlign: obj.textAlign as React.CSSProperties['textAlign'],
      lineHeight: obj.lineHeight,
      letterSpacing: obj.letterSpacing * fontSize * zoom,
      border: '2px solid #4a90d9',
      padding: '0px',
      margin: '0px',
      overflow: 'hidden',
      background: 'transparent',
      outline: 'none',
      resize: 'none',
      transformOrigin: 'left top',
      transform: `rotate(${obj.rotation}deg)`,
    });
  };

  const handleTextEditEnd = () => {
    if (!editingTextId) return;

    // Update the text content
    dispatch({
      type: 'UPDATE_OBJECT',
      side,
      id: editingTextId,
      updates: {
        content: editingTextValue,
      },
    });

    // Show the text node again
    const stage = stageRef.current;
    if (stage) {
      const textNode = stage.findOne(`#${editingTextId}`);
      if (textNode) {
        textNode.show();
      }
    }
    transformerRef.current?.show();

    setEditingTextId(null);
    setEditingTextValue('');
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape to cancel editing
    if (e.key === 'Escape') {
      // Restore original text and close
      const stage = stageRef.current;
      if (stage && editingTextId) {
        const textNode = stage.findOne(`#${editingTextId}`);
        if (textNode) {
          textNode.show();
        }
      }
      transformerRef.current?.show();
      setEditingTextId(null);
      setEditingTextValue('');
    }
  };

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingTextId]);

  const handleDragEnd = (objectId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    dispatch({
      type: 'UPDATE_OBJECT',
      side,
      id: objectId,
      updates: {
        position: {
          x: node.x() / scale,
          y: node.y() / scale,
        },
      },
    });
  };

  const handleTransformEnd = (objectId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to size
    node.scaleX(1);
    node.scaleY(1);

    const obj = coverData.objects.find((o) => o.id === objectId);
    if (!obj) return;

    if (obj.type === 'text') {
      dispatch({
        type: 'UPDATE_OBJECT',
        side,
        id: objectId,
        updates: {
          position: {
            x: node.x() / scale,
            y: node.y() / scale,
          },
          width: (node.width() * scaleX) / scale,
          rotation: node.rotation(),
        },
      });
    } else if (obj.type === 'image') {
      dispatch({
        type: 'UPDATE_OBJECT',
        side,
        id: objectId,
        updates: {
          position: {
            x: node.x() / scale,
            y: node.y() / scale,
          },
          size: {
            width: (node.width() * scaleX) / scale,
            height: (node.height() * scaleY) / scale,
          },
          rotation: node.rotation(),
        },
      });
    }
  };

  const renderTextObject = (obj: TextObject) => {
    const x = inchesToPixels(obj.position.x, scale);
    const y = inchesToPixels(obj.position.y, scale);
    const width = inchesToPixels(obj.width, scale);
    const fontSize = fontSizeToPixels(obj.fontSize, scale);

    return (
      <Text
        key={obj.id}
        id={obj.id}
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
        draggable={!obj.locked && obj.visible && !editingTextId}
        visible={obj.visible}
        onClick={() => handleObjectClick(obj.id)}
        onTap={() => handleObjectClick(obj.id)}
        onDblClick={(e) => handleTextDblClick(obj, e)}
        onDblTap={(e) => handleTextDblClick(obj, e as unknown as Konva.KonvaEventObject<MouseEvent>)}
        onDragEnd={(e) => handleDragEnd(obj.id, e)}
        onTransformEnd={(e) => handleTransformEnd(obj.id, e)}
      />
    );
  };

  const renderImageObject = (obj: ImageObject) => {
    const x = inchesToPixels(obj.position.x, scale);
    const y = inchesToPixels(obj.position.y, scale);
    const width = inchesToPixels(obj.size.width, scale);
    const height = inchesToPixels(obj.size.height, scale);

    return (
      <ImageFromSrc
        key={obj.id}
        id={obj.id}
        src={obj.src}
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={obj.opacity}
        rotation={obj.rotation}
        draggable={!obj.locked && obj.visible}
        visible={obj.visible}
        onClick={() => handleObjectClick(obj.id)}
        onDragEnd={(e) => handleDragEnd(obj.id, e)}
        onTransformEnd={(e) => handleTransformEnd(obj.id, e)}
      />
    );
  };

  const renderObject = (obj: CanvasObject) => {
    if (!obj.visible) return null;

    switch (obj.type) {
      case 'text':
        return renderTextObject(obj);
      case 'image':
        return renderImageObject(obj);
      default:
        return null;
    }
  };

  return (
    <div className="cover-canvas-container">
      <div className="cover-canvas-zoom-controls">
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
        />
      </div>
      <div className="cover-canvas-viewport" ref={containerRef}>
        <div
          className="cover-canvas-stage-wrapper"
          style={{
            width: stageWidth * zoom,
            height: stageHeight * zoom,
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              position: 'relative',
            }}
          >
            <Stage
              ref={stageRef}
              width={stageWidth}
              height={stageHeight}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer>
                {/* Background with rounded corners - only on outer edge */}
                <Group
                  clipFunc={(ctx) => {
                    ctx.beginPath();
                    if (side === 'front') {
                      // Front cover: rounded on RIGHT side only (outer edge when book is closed)
                      ctx.moveTo(0, 0);
                      ctx.lineTo(stageWidth - cornerRadius, 0);
                      ctx.quadraticCurveTo(stageWidth, 0, stageWidth, cornerRadius);
                      ctx.lineTo(stageWidth, stageHeight - cornerRadius);
                      ctx.quadraticCurveTo(stageWidth, stageHeight, stageWidth - cornerRadius, stageHeight);
                      ctx.lineTo(0, stageHeight);
                      ctx.lineTo(0, 0);
                    } else {
                      // Back cover: rounded on LEFT side only (outer edge when book is closed)
                      ctx.moveTo(cornerRadius, 0);
                      ctx.lineTo(stageWidth, 0);
                      ctx.lineTo(stageWidth, stageHeight);
                      ctx.lineTo(cornerRadius, stageHeight);
                      ctx.quadraticCurveTo(0, stageHeight, 0, stageHeight - cornerRadius);
                      ctx.lineTo(0, cornerRadius);
                      ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
                    }
                    ctx.closePath();
                  }}
                >
                  <Rect
                    name="background"
                    x={0}
                    y={0}
                    width={stageWidth}
                    height={stageHeight}
                    fill={coverData.backgroundColor}
                  />

                  {/* Render all objects */}
                  {coverData.objects.map(renderObject)}
                </Group>

                {/* Corner outline (not clipped) - matches cover shape */}
                <OutlineShape
                  side={side}
                  width={stageWidth}
                  height={stageHeight}
                  cornerRadius={cornerRadius}
                />

                {/* Transformer for selected objects */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit minimum size
                    if (newBox.width < 20 || newBox.height < 20) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  anchorSize={8}
                  anchorCornerRadius={2}
                  borderStroke="#4a90d9"
                  anchorStroke="#4a90d9"
                  anchorFill="#fff"
                />
              </Layer>
            </Stage>
            {/* Inline text editing textarea */}
            {editingTextId && (
              <textarea
                ref={textareaRef}
                value={editingTextValue}
                onChange={(e) => setEditingTextValue(e.target.value)}
                onBlur={handleTextEditEnd}
                onKeyDown={handleTextareaKeyDown}
                style={textareaStyle}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component to load and render images
interface ImageFromSrcProps {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  rotation: number;
  draggable: boolean;
  visible: boolean;
  onClick: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

function ImageFromSrc({
  id,
  src,
  x,
  y,
  width,
  height,
  opacity,
  rotation,
  draggable,
  visible,
  onClick,
  onDragEnd,
  onTransformEnd,
}: ImageFromSrcProps) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);

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
      id={id}
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      opacity={opacity}
      rotation={rotation}
      draggable={draggable}
      visible={visible}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

// Outline shape component for cover with correct corner rounding
interface OutlineShapeProps {
  side: 'front' | 'back';
  width: number;
  height: number;
  cornerRadius: number;
}

function OutlineShape({ side, width, height, cornerRadius }: OutlineShapeProps) {
  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath();
        if (side === 'front') {
          // Front cover: rounded on RIGHT side only
          ctx.moveTo(0, 0);
          ctx.lineTo(width - cornerRadius, 0);
          ctx.quadraticCurveTo(width, 0, width, cornerRadius);
          ctx.lineTo(width, height - cornerRadius);
          ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
          ctx.lineTo(0, height);
          ctx.lineTo(0, 0);
        } else {
          // Back cover: rounded on LEFT side only
          ctx.moveTo(cornerRadius, 0);
          ctx.lineTo(width, 0);
          ctx.lineTo(width, height);
          ctx.lineTo(cornerRadius, height);
          ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
          ctx.lineTo(0, cornerRadius);
          ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
        }
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      }}
      stroke="#666"
      strokeWidth={1}
      listening={false}
    />
  );
}
