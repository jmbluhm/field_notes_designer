import React, { useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDocument } from '../hooks';
import { createTextObject } from '../model/defaults';
import type { ImageObject } from '../model/types';
import './Toolbar.css';

interface ToolbarProps {
  side: 'front' | 'back';
}

export function Toolbar({ side }: ToolbarProps) {
  const { dispatch, document } = useDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverData = side === 'front' ? document.front : document.back;

  const handleAddText = () => {
    const newText = createTextObject({
      position: { x: 0.5, y: 2.5 },
      content: 'New Text',
    });
    dispatch({ type: 'ADD_OBJECT', side, object: newText });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        // Calculate size to fit within cover (max 3 inches wide or tall)
        const maxDim = 3;
        let width = img.width / 150; // Assume 150 DPI as starting point
        let height = img.height / 150;

        if (width > maxDim) {
          height = height * (maxDim / width);
          width = maxDim;
        }
        if (height > maxDim) {
          width = width * (maxDim / height);
          height = maxDim;
        }

        const imageObject: ImageObject = {
          id: uuidv4(),
          type: 'image',
          position: { x: 0.25, y: 1 },
          rotation: 0,
          locked: false,
          visible: true,
          opacity: 1,
          src: dataUrl,
          size: { width, height },
          fit: 'cover',
          originalWidth: img.width,
          originalHeight: img.height,
          cropToCorners: true,
        };

        dispatch({ type: 'ADD_OBJECT', side, object: imageObject });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackgroundColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    if (side === 'front') {
      dispatch({ type: 'UPDATE_FRONT', updates: { backgroundColor: color } });
    } else {
      dispatch({ type: 'UPDATE_BACK', updates: { backgroundColor: color } });
    }
  };

  return (
    <div className="toolbar">
      <button onClick={handleAddText} title="Add text">
        + Text
      </button>

      <button onClick={() => fileInputRef.current?.click()} title="Add image">
        + Image
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      <div className="toolbar-divider" />

      <div className="toolbar-color">
        <label>BG</label>
        <input
          type="color"
          value={coverData.backgroundColor}
          onChange={handleBackgroundColor}
          title="Background color"
        />
      </div>
    </div>
  );
}
