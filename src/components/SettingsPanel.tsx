import React, { useRef } from 'react';
import { useDocument } from '../hooks';
import { getWrapWidth, formatInches } from '../utils';
import { NOTEBOOK } from '../model/types';
import { CollapsibleSection } from './CollapsibleSection';
import './SettingsPanel.css';

export function SettingsPanel() {
  const { document, dispatch, exportAsJSON, importFromJSON, resetToDefault } = useDocument();
  const { settings, wrapImage } = document;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapImageInputRef = useRef<HTMLInputElement>(null);

  const wrapWidth = getWrapWidth(settings.spineWidth);

  const handleSpineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { spineWidth: Number(e.target.value) },
    });
  };

  const handleSaveProject = () => {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = 'field-notes-cover.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const success = importFromJSON(json);
      if (!success) {
        alert('Failed to load project. Invalid file format.');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleWrapImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      const img = new Image();
      img.onload = () => {
        dispatch({
          type: 'UPDATE_WRAP_IMAGE',
          updates: {
            enabled: true,
            src: dataUrl,
            originalWidth: img.width,
            originalHeight: img.height,
            size: { width: wrapWidth, height: NOTEBOOK.HEIGHT },
            position: { x: 0, y: 0 },
          },
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    if (wrapImageInputRef.current) {
      wrapImageInputRef.current.value = '';
    }
  };

  const handleRemoveWrapImage = () => {
    dispatch({
      type: 'UPDATE_WRAP_IMAGE',
      updates: {
        enabled: false,
        src: '',
      },
    });
  };

  return (
    <div className="settings-panel panel">
      <CollapsibleSection title="Dimensions">
        <div className="form-group">
          <label>
            Spine Width (in)
            <span className="hint">Measure your notebook thickness</span>
          </label>
          <input
            type="number"
            value={settings.spineWidth}
            onChange={handleSpineChange}
            step={0.0625}
            min={0.0625}
            max={0.5}
          />
        </div>

        <div className="dimensions-info">
          <div className="dim-row">
            <span>Cover size:</span>
            <span>{formatInches(NOTEBOOK.WIDTH)} × {formatInches(NOTEBOOK.HEIGHT)}</span>
          </div>
          <div className="dim-row">
            <span>Total wrap:</span>
            <span>{formatInches(wrapWidth)} × {formatInches(NOTEBOOK.HEIGHT)}</span>
          </div>
          <div className="dim-row">
            <span>Corner radius:</span>
            <span>{formatInches(NOTEBOOK.CORNER_RADIUS)}</span>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Guides">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.showFoldLines}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_SETTINGS', settings: { showFoldLines: e.target.checked } })
            }
          />
          Show fold lines
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.showSafeArea}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_SETTINGS', settings: { showSafeArea: e.target.checked } })
            }
          />
          Show safe area
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.showCenterline}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_SETTINGS', settings: { showCenterline: e.target.checked } })
            }
          />
          Show centerline
        </label>
      </CollapsibleSection>

      <CollapsibleSection title="Wrap Background Image" defaultExpanded={wrapImage.enabled}>
        {wrapImage.enabled ? (
          <div className="wrap-image-controls">
            <div className="wrap-image-preview">
              <img src={wrapImage.src} alt="Wrap background" />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Opacity</label>
                <input
                  type="range"
                  value={wrapImage.opacity}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_WRAP_IMAGE',
                      updates: { opacity: Number(e.target.value) },
                    })
                  }
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>
            <button onClick={handleRemoveWrapImage} className="remove-btn">
              Remove Wrap Image
            </button>
          </div>
        ) : (
          <button onClick={() => wrapImageInputRef.current?.click()}>
            Upload Wrap Image
          </button>
        )}

        <input
          ref={wrapImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleWrapImageUpload}
          style={{ display: 'none' }}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Project">
        <div className="button-stack">
          <button onClick={handleSaveProject}>Save Project</button>

          <button onClick={() => fileInputRef.current?.click()}>Load Project</button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleLoadProject}
            style={{ display: 'none' }}
          />

          <button onClick={resetToDefault} className="reset-btn">
            Reset to Default
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
