import './ZoomControls.css';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  minZoom = 0.25,
  maxZoom = 4,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="zoom-controls">
      <button
        className="zoom-btn"
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        className="zoom-reset-btn"
        onClick={onResetZoom}
        title="Reset zoom (fit to view)"
        aria-label="Reset zoom"
      >
        {zoomPercent}%
      </button>
      <button
        className="zoom-btn"
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}
