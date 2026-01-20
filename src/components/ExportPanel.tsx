import { useState } from 'react';
import { useDocument } from '../hooks';
import { exportToPDF } from '../export';
import type { ExportOptions } from '../export';
import { CollapsibleSection } from './CollapsibleSection';
import './ExportPanel.css';

export function ExportPanel() {
  const { document } = useDocument();
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeBleed: false,
    includeFoldLines: document.settings.showFoldLines,
    includeSafeArea: document.settings.showSafeArea,
    includeCenterline: document.settings.showCenterline,
  });

  const handleExportPDF = async () => {
    setExporting(true);

    try {
      const blob = await exportToPDF(document, options);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = 'field-notes-cover.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    // Open print dialog with the wrap preview
    // This is a simplified version - a full implementation would
    // create a print-optimized view
    window.print();
  };

  return (
    <div className="export-panel panel">
      <CollapsibleSection title="Export Options">
        <div className="export-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.includeFoldLines}
              onChange={(e) =>
                setOptions({ ...options, includeFoldLines: e.target.checked })
              }
            />
            Include fold lines
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.includeSafeArea}
              onChange={(e) =>
                setOptions({ ...options, includeSafeArea: e.target.checked })
              }
            />
            Include safe area guide
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.includeCenterline}
              onChange={(e) =>
                setOptions({ ...options, includeCenterline: e.target.checked })
              }
            />
            Include centerline
          </label>
        </div>

        <div className="export-info">
          <p>
            Export creates a print-ready PDF at exact real-world scale.
            Print at 100% scale (no fit-to-page), then cut along the
            cut line (magenta dashed).
          </p>
        </div>

        <div className="button-stack">
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="export-btn primary"
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>

          <button onClick={handlePrint} className="export-btn">
            Print
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
