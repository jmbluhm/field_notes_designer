import { useDocument } from '../hooks';
import type { CanvasObject } from '../model/types';
import { CollapsibleSection } from './CollapsibleSection';
import './LayersPanel.css';

interface LayersPanelProps {
  side: 'front' | 'back';
}

export function LayersPanel({ side }: LayersPanelProps) {
  const { document, selection, setSelection, dispatch } = useDocument();
  const coverData = side === 'front' ? document.front : document.back;
  const objects = [...coverData.objects].reverse(); // Show top layer first

  const handleSelect = (objectId: string) => {
    setSelection({ side, objectId });
  };

  const handleToggleVisibility = (objectId: string, visible: boolean) => {
    dispatch({
      type: 'UPDATE_OBJECT',
      side,
      id: objectId,
      updates: { visible },
    });
  };

  const handleToggleLock = (objectId: string, locked: boolean) => {
    dispatch({
      type: 'UPDATE_OBJECT',
      side,
      id: objectId,
      updates: { locked },
    });
  };

  const handleDelete = (objectId: string) => {
    dispatch({
      type: 'DELETE_OBJECT',
      side,
      id: objectId,
    });
    if (selection.objectId === objectId) {
      setSelection({ side: null, objectId: null });
    }
  };

  const handleMoveUp = (objectId: string) => {
    const currentIndex = coverData.objects.findIndex((o) => o.id === objectId);
    if (currentIndex < coverData.objects.length - 1) {
      const newOrder = [...coverData.objects];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
        newOrder[currentIndex + 1],
        newOrder[currentIndex],
      ];
      dispatch({
        type: 'REORDER_OBJECTS',
        side,
        objectIds: newOrder.map((o) => o.id),
      });
    }
  };

  const handleMoveDown = (objectId: string) => {
    const currentIndex = coverData.objects.findIndex((o) => o.id === objectId);
    if (currentIndex > 0) {
      const newOrder = [...coverData.objects];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [
        newOrder[currentIndex - 1],
        newOrder[currentIndex],
      ];
      dispatch({
        type: 'REORDER_OBJECTS',
        side,
        objectIds: newOrder.map((o) => o.id),
      });
    }
  };

  const getObjectLabel = (obj: CanvasObject): string => {
    if (obj.type === 'text') {
      const preview = obj.content.substring(0, 20);
      return preview + (obj.content.length > 20 ? '...' : '');
    }
    if (obj.type === 'image') {
      return 'Image';
    }
    return 'Shape';
  };

  const getObjectIcon = (obj: CanvasObject): string => {
    if (obj.type === 'text') return 'T';
    if (obj.type === 'image') return '🖼';
    return '■';
  };

  const sideLabel = side === 'front' ? 'Front' : 'Back';

  return (
    <div className="layers-panel panel">
      <CollapsibleSection title={`Layers (${sideLabel})`}>
        {objects.length === 0 ? (
          <p className="no-layers">No objects yet</p>
        ) : (
          <ul className="layers-list">
            {objects.map((obj) => {
              const isSelected = selection.side === side && selection.objectId === obj.id;

              return (
                <li
                  key={obj.id}
                  className={`layer-item ${isSelected ? 'selected' : ''} ${!obj.visible ? 'hidden' : ''}`}
                  onClick={() => handleSelect(obj.id)}
                >
                  <span className="layer-icon">{getObjectIcon(obj)}</span>
                  <span className="layer-name">{getObjectLabel(obj)}</span>

                  <div className="layer-actions">
                    <button
                      className="layer-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(obj.id, !obj.visible);
                      }}
                      title={obj.visible ? 'Hide' : 'Show'}
                    >
                      {obj.visible ? '👁' : '👁‍🗨'}
                    </button>
                    <button
                      className="layer-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLock(obj.id, !obj.locked);
                      }}
                      title={obj.locked ? 'Unlock' : 'Lock'}
                    >
                      {obj.locked ? '🔒' : '🔓'}
                    </button>
                    <button
                      className="layer-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(obj.id);
                      }}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="layer-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(obj.id);
                      }}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="layer-action delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(obj.id);
                      }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleSection>
    </div>
  );
}
