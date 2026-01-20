import { useState } from 'react';
import { DocumentProvider } from './hooks';
import {
  CoverCanvas,
  WrapPreview,
  PropertyInspector,
  LayersPanel,
  Toolbar,
  SettingsPanel,
  ExportPanel,
  PreviewModal,
} from './components';
import './App.css';

function App() {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  return (
    <DocumentProvider>
      <div className="app">
        <header className="app-header">
          <h1>Field Notes Cover Studio</h1>
          <span className="subtitle">Design your own wraparound cover</span>
        </header>

        <main className="app-main">
          {/* Column A: Front Cover */}
          <section className="editor-column">
            <h2>Front Cover</h2>
            <Toolbar side="front" />
            <div className="canvas-wrapper">
              <CoverCanvas side="front" />
            </div>
            <LayersPanel side="front" />
            <PropertyInspector />
          </section>

          {/* Column B: Back Cover */}
          <section className="editor-column">
            <h2>Back Cover</h2>
            <Toolbar side="back" />
            <div className="canvas-wrapper">
              <CoverCanvas side="back" />
            </div>
            <LayersPanel side="back" />
          </section>

          {/* Column C: Preview & Export */}
          <section className="preview-column">
            <h2>Print Preview</h2>
            <div
              className="wrap-preview-wrapper clickable"
              onClick={() => setIsPreviewModalOpen(true)}
              title="Click to enlarge"
            >
              <WrapPreview />
            </div>
            <SettingsPanel />
            <ExportPanel />
          </section>
        </main>

        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      </div>
    </DocumentProvider>
  );
}

export default App;
