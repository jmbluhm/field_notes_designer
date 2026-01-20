import { useDocument } from '../hooks';
import type { TextObject, ImageObject } from '../model/types';
import { FONTS } from '../model/types';
import { calculateEffectiveDPI, isDPIAdequate } from '../utils';
import { CollapsibleSection } from './CollapsibleSection';
import './PropertyInspector.css';

export function PropertyInspector() {
  const { selection, getSelectedObject, dispatch } = useDocument();
  const selectedObject = getSelectedObject();

  if (!selectedObject || !selection.side) {
    return (
      <div className="property-inspector panel">
        <div className="panel-title">Properties</div>
        <p className="no-selection">Select an object to edit its properties</p>
      </div>
    );
  }

  const updateObject = (updates: Partial<typeof selectedObject>) => {
    dispatch({
      type: 'UPDATE_OBJECT',
      side: selection.side!,
      id: selectedObject.id,
      updates,
    });
  };

  if (selectedObject.type === 'text') {
    return <TextInspector object={selectedObject} updateObject={updateObject} />;
  }

  if (selectedObject.type === 'image') {
    return <ImageInspector object={selectedObject} updateObject={updateObject} />;
  }

  return null;
}

interface TextInspectorProps {
  object: TextObject;
  updateObject: (updates: Partial<TextObject>) => void;
}

function TextInspector({ object, updateObject }: TextInspectorProps) {
  return (
    <div className="property-inspector panel">
      <CollapsibleSection title="Text Content">
        <div className="form-group">
          <label>Content</label>
          <textarea
            value={object.content}
            onChange={(e) => updateObject({ content: e.target.value })}
            rows={3}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Typography">
        <div className="form-group">
          <label>Font Family</label>
          <select
            value={object.fontFamily}
            onChange={(e) => updateObject({ fontFamily: e.target.value })}
          >
            {FONTS.map((font) => (
              <option key={font.name} value={font.family}>
                {font.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Size (pt)</label>
            <input
              type="number"
              value={object.fontSize}
              onChange={(e) => updateObject({ fontSize: Number(e.target.value) })}
              min={6}
              max={200}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Weight</label>
            <select
              value={object.fontWeight}
              onChange={(e) => updateObject({ fontWeight: Number(e.target.value) })}
            >
              <option value={400}>Regular</option>
              <option value={500}>Medium</option>
              <option value={600}>SemiBold</option>
              <option value={700}>Bold</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Letter Spacing</label>
            <input
              type="number"
              value={object.letterSpacing}
              onChange={(e) => updateObject({ letterSpacing: Number(e.target.value) })}
              step={0.01}
              min={-0.5}
              max={1}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Line Height</label>
            <input
              type="number"
              value={object.lineHeight}
              onChange={(e) => updateObject({ lineHeight: Number(e.target.value) })}
              step={0.1}
              min={0.5}
              max={3}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Text Align</label>
          <div className="button-group">
            <button
              className={object.textAlign === 'left' ? 'active' : ''}
              onClick={() => updateObject({ textAlign: 'left' })}
            >
              Left
            </button>
            <button
              className={object.textAlign === 'center' ? 'active' : ''}
              onClick={() => updateObject({ textAlign: 'center' })}
            >
              Center
            </button>
            <button
              className={object.textAlign === 'right' ? 'active' : ''}
              onClick={() => updateObject({ textAlign: 'right' })}
            >
              Right
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Appearance">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Fill Color</label>
            <input
              type="color"
              value={object.fill}
              onChange={(e) => updateObject({ fill: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Opacity</label>
            <input
              type="range"
              value={object.opacity}
              onChange={(e) => updateObject({ opacity: Number(e.target.value) })}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Transform">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Width (in)</label>
            <input
              type="number"
              value={object.width}
              onChange={(e) => updateObject({ width: Number(e.target.value) })}
              step={0.125}
              min={0.25}
              max={7}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Rotation</label>
            <input
              type="number"
              value={object.rotation}
              onChange={(e) => updateObject({ rotation: Number(e.target.value) })}
              step={1}
              min={-180}
              max={180}
            />
          </div>
        </div>

        <div className="form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={object.locked}
              onChange={(e) => updateObject({ locked: e.target.checked })}
            />
            Locked
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={object.visible}
              onChange={(e) => updateObject({ visible: e.target.checked })}
            />
            Visible
          </label>
        </div>
      </CollapsibleSection>
    </div>
  );
}

interface ImageInspectorProps {
  object: ImageObject;
  updateObject: (updates: Partial<ImageObject>) => void;
}

function ImageInspector({ object, updateObject }: ImageInspectorProps) {
  const dpiInfo = calculateEffectiveDPI(
    object.originalWidth,
    object.originalHeight,
    object.size.width,
    object.size.height
  );

  const dpiOK = isDPIAdequate(dpiInfo.minDPI, 150);

  return (
    <div className="property-inspector panel">
      <CollapsibleSection title="Dimensions">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Width (in)</label>
            <input
              type="number"
              value={object.size.width.toFixed(3)}
              onChange={(e) =>
                updateObject({
                  size: { ...object.size, width: Number(e.target.value) },
                })
              }
              step={0.125}
              min={0.25}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Height (in)</label>
            <input
              type="number"
              value={object.size.height.toFixed(3)}
              onChange={(e) =>
                updateObject({
                  size: { ...object.size, height: Number(e.target.value) },
                })
              }
              step={0.125}
              min={0.25}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Fit Mode</label>
          <div className="button-group">
            <button
              className={object.fit === 'contain' ? 'active' : ''}
              onClick={() => updateObject({ fit: 'contain' })}
            >
              Contain
            </button>
            <button
              className={object.fit === 'cover' ? 'active' : ''}
              onClick={() => updateObject({ fit: 'cover' })}
            >
              Cover
            </button>
            <button
              className={object.fit === 'stretch' ? 'active' : ''}
              onClick={() => updateObject({ fit: 'stretch' })}
            >
              Stretch
            </button>
            <button
              className={object.fit === 'original' ? 'active' : ''}
              onClick={() => updateObject({ fit: 'original' })}
            >
              1:1
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Appearance">
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Opacity</label>
            <input
              type="range"
              value={object.opacity}
              onChange={(e) => updateObject({ opacity: Number(e.target.value) })}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Rotation</label>
            <input
              type="number"
              value={object.rotation}
              onChange={(e) => updateObject({ rotation: Number(e.target.value) })}
              step={1}
              min={-180}
              max={180}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Print Quality">
        <div className="dpi-info">
          <div className={`dpi-status ${dpiOK ? 'ok' : 'warning'}`}>
            <span className="dpi-value">{Math.round(dpiInfo.minDPI)} DPI</span>
            <span className="dpi-label">
              {dpiOK ? 'Good for print' : 'Low resolution'}
            </span>
          </div>
          <div className="dpi-details">
            Original: {object.originalWidth} x {object.originalHeight} px
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Layer Options">
        <div className="form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={object.locked}
              onChange={(e) => updateObject({ locked: e.target.checked })}
            />
            Locked
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={object.visible}
              onChange={(e) => updateObject({ visible: e.target.checked })}
            />
            Visible
          </label>
        </div>
      </CollapsibleSection>
    </div>
  );
}
