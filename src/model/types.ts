// Physical dimensions in inches
export const NOTEBOOK = {
  WIDTH: 3.5,      // inches
  HEIGHT: 5.5,     // inches
  CORNER_RADIUS: 0.375, // 3/8 inch = 9.5mm
  DEFAULT_SPINE: 0.125, // default spine width, user adjustable
} as const;

// Available fonts (Jost is a Futura-like free alternative)
export const FONTS = [
  { name: 'Jost', family: 'Jost, sans-serif' },
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, Arial, sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Times New Roman', family: '"Times New Roman", serif' },
] as const;

export type FontName = typeof FONTS[number]['name'];

export interface Position {
  x: number; // inches from left
  y: number; // inches from top
}

export interface Size {
  width: number;  // inches
  height: number; // inches
}

// Base object type for all elements
export interface BaseObject {
  id: string;
  type: 'text' | 'image' | 'shape';
  position: Position;
  rotation: number; // degrees
  locked: boolean;
  visible: boolean;
  opacity: number; // 0-1
}

export interface TextObject extends BaseObject {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number; // points
  fontWeight: number; // 400, 500, 600, 700
  letterSpacing: number; // em units
  lineHeight: number; // multiplier
  textAlign: 'left' | 'center' | 'right';
  fill: string; // hex color
  stroke?: string; // hex color
  strokeWidth?: number;
  width: number; // text box width in inches
}

export type ImageFit = 'contain' | 'cover' | 'stretch' | 'original';

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string; // data URL or object URL
  size: Size;
  fit: ImageFit;
  originalWidth: number;  // original image pixels
  originalHeight: number; // original image pixels
  cropToCorners: boolean; // clip to rounded corners
}

export type ShapeType = 'rectangle' | 'line' | 'ellipse';

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shapeType: ShapeType;
  size: Size;
  fill?: string;
  stroke?: string;
  strokeWidth: number;
  cornerRadius?: number; // for rectangles
}

export type CanvasObject = TextObject | ImageObject | ShapeObject;

// Cover side (front or back)
export interface CoverSide {
  backgroundColor: string;
  objects: CanvasObject[];
}

// Wrap mode for images that span across both covers
export interface WrapImage {
  enabled: boolean;
  src: string;
  position: Position; // position relative to full wrap
  size: Size;
  fit: ImageFit;
  originalWidth: number;
  originalHeight: number;
  opacity: number;
}

// Document settings
export interface DocumentSettings {
  spineWidth: number; // inches, user adjustable
  bleedEnabled: boolean;
  bleedAmount: number; // inches
  showFoldLines: boolean;
  showSafeArea: boolean;
  showCenterline: boolean;
  safeAreaInset: number; // inches
  screenScale: number; // pixels per inch for editing (default 96)
}

// Complete document model
export interface Document {
  version: number;
  settings: DocumentSettings;
  front: CoverSide;
  back: CoverSide;
  wrapImage: WrapImage;
}

// Selection state
export interface Selection {
  side: 'front' | 'back' | null;
  objectId: string | null;
}

// App state
export interface AppState {
  document: Document;
  selection: Selection;
  isDirty: boolean;
}

// Action types for reducer
export type DocumentAction =
  | { type: 'SET_DOCUMENT'; document: Document }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<DocumentSettings> }
  | { type: 'UPDATE_FRONT'; updates: Partial<CoverSide> }
  | { type: 'UPDATE_BACK'; updates: Partial<CoverSide> }
  | { type: 'ADD_OBJECT'; side: 'front' | 'back'; object: CanvasObject }
  | { type: 'UPDATE_OBJECT'; side: 'front' | 'back'; id: string; updates: Partial<CanvasObject> }
  | { type: 'DELETE_OBJECT'; side: 'front' | 'back'; id: string }
  | { type: 'REORDER_OBJECTS'; side: 'front' | 'back'; objectIds: string[] }
  | { type: 'UPDATE_WRAP_IMAGE'; updates: Partial<WrapImage> }
  | { type: 'SET_SELECTION'; selection: Selection }
  | { type: 'CLEAR_SELECTION' };
