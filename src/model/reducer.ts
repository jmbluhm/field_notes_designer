import type { Document, DocumentAction, CanvasObject } from './types';

export function documentReducer(state: Document, action: DocumentAction): Document {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return action.document;

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };

    case 'UPDATE_FRONT':
      return {
        ...state,
        front: { ...state.front, ...action.updates },
      };

    case 'UPDATE_BACK':
      return {
        ...state,
        back: { ...state.back, ...action.updates },
      };

    case 'ADD_OBJECT': {
      const side = action.side === 'front' ? 'front' : 'back';
      return {
        ...state,
        [side]: {
          ...state[side],
          objects: [...state[side].objects, action.object],
        },
      };
    }

    case 'UPDATE_OBJECT': {
      const side = action.side === 'front' ? 'front' : 'back';
      return {
        ...state,
        [side]: {
          ...state[side],
          objects: state[side].objects.map((obj) =>
            obj.id === action.id ? { ...obj, ...action.updates } as CanvasObject : obj
          ),
        },
      };
    }

    case 'DELETE_OBJECT': {
      const side = action.side === 'front' ? 'front' : 'back';
      return {
        ...state,
        [side]: {
          ...state[side],
          objects: state[side].objects.filter((obj) => obj.id !== action.id),
        },
      };
    }

    case 'REORDER_OBJECTS': {
      const side = action.side === 'front' ? 'front' : 'back';
      const objectMap = new Map(state[side].objects.map((obj) => [obj.id, obj]));
      const reorderedObjects = action.objectIds
        .map((id) => objectMap.get(id))
        .filter((obj): obj is CanvasObject => obj !== undefined);

      return {
        ...state,
        [side]: {
          ...state[side],
          objects: reorderedObjects,
        },
      };
    }

    case 'UPDATE_WRAP_IMAGE':
      return {
        ...state,
        wrapImage: { ...state.wrapImage, ...action.updates },
      };

    default:
      return state;
  }
}
