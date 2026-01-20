import { v4 as uuidv4 } from 'uuid';
import type { Document, TextObject, DocumentSettings, CoverSide, WrapImage } from './types';
import { NOTEBOOK } from './types';

// Classic Field Notes colors
export const KRAFT_COLOR = '#c9b896';
export const BLACK_INK = '#1a1a1a';

export const createDefaultSettings = (): DocumentSettings => ({
  spineWidth: NOTEBOOK.DEFAULT_SPINE,
  bleedEnabled: false,
  bleedAmount: 0.125,
  showFoldLines: true,
  showSafeArea: false,
  showCenterline: false,
  safeAreaInset: 0.125,
  screenScale: 96, // pixels per inch for on-screen editing
});

export const createTextObject = (overrides: Partial<TextObject> = {}): TextObject => ({
  id: uuidv4(),
  type: 'text',
  position: { x: 0.5, y: 0.5 },
  rotation: 0,
  locked: false,
  visible: true,
  opacity: 1,
  content: 'Text',
  fontFamily: 'Jost, sans-serif',
  fontSize: 24,
  fontWeight: 400,
  letterSpacing: 0,
  lineHeight: 1.2,
  textAlign: 'left',
  fill: BLACK_INK,
  width: 2.5,
  ...overrides,
});

// Classic Field Notes front cover layout
export const createDefaultFrontCover = (): CoverSide => ({
  backgroundColor: KRAFT_COLOR,
  objects: [
    createTextObject({
      id: uuidv4(),
      content: 'FIELD NOTES',
      position: { x: 0.375, y: 0.5 },
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: 0.15,
      width: 2.75,
    }),
    createTextObject({
      id: uuidv4(),
      content: 'MEMO BOOK',
      position: { x: 0.375, y: 0.9 },
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: 0.2,
      width: 2.75,
    }),
    createTextObject({
      id: uuidv4(),
      content: 'YOUR EDITION',
      position: { x: 0.375, y: 4.5 },
      fontSize: 12,
      fontWeight: 400,
      letterSpacing: 0.1,
      width: 2.75,
    }),
  ],
});

// Classic Field Notes back cover layout
export const createDefaultBackCover = (): CoverSide => ({
  backgroundColor: KRAFT_COLOR,
  objects: [
    createTextObject({
      id: uuidv4(),
      content: 'PRACTICAL APPLICATIONS',
      position: { x: 0.375, y: 0.5 },
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: 0.15,
      width: 2.75,
    }),
    createTextObject({
      id: uuidv4(),
      content: '• Ideas & Sketches\n• Lists & Tasks\n• Notes & Reminders\n• Observations',
      position: { x: 0.375, y: 0.8 },
      fontSize: 9,
      fontWeight: 400,
      letterSpacing: 0.02,
      lineHeight: 1.6,
      width: 2.75,
    }),
    createTextObject({
      id: uuidv4(),
      content: 'fieldnotes.com',
      position: { x: 0.375, y: 4.8 },
      fontSize: 8,
      fontWeight: 400,
      letterSpacing: 0.05,
      textAlign: 'left',
      width: 2.75,
    }),
  ],
});

export const createDefaultWrapImage = (): WrapImage => ({
  enabled: false,
  src: '',
  position: { x: 0, y: 0 },
  size: { width: 7.125, height: 5.5 }, // full wrap width
  fit: 'cover',
  originalWidth: 0,
  originalHeight: 0,
  opacity: 1,
});

export const createDefaultDocument = (): Document => ({
  version: 1,
  settings: createDefaultSettings(),
  front: createDefaultFrontCover(),
  back: createDefaultBackCover(),
  wrapImage: createDefaultWrapImage(),
});
