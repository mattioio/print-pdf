import { createContext, useContext, useReducer, useCallback, useRef, useEffect, useState } from 'react';
import type { BrochureData } from '../types/brochure';
import { saveBrochure } from '../utils/storage';

/* ── Undo / redo constants ── */
const MAX_HISTORY = 30;
const MERGE_INTERVAL_MS = 500; // Rapid edits merge into a single undo step

/* ── Context interface ── */
interface BrochureContextValue {
  data: BrochureData;
  setData: (data: BrochureData) => void;
  updateField: <K extends keyof BrochureData>(key: K, value: BrochureData[K]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastSavedAt: Date | null;
}

const BrochureContext = createContext<BrochureContextValue | null>(null);

/* ── Helpers ── */
function deriveName(d: BrochureData): string {
  const parts = [d.locationName, d.headline].filter(Boolean);
  return parts.join(': ') || 'Untitled';
}

/* ── Reducer ── */
interface HistoryState {
  past: BrochureData[];
  present: BrochureData;
  future: BrochureData[];
  lastChangeTime: number;
}

type Action =
  | { type: 'SET'; data: BrochureData }
  | { type: 'UPDATE_FIELD'; key: keyof BrochureData; value: BrochureData[keyof BrochureData] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'SET': {
      const now = Date.now();
      const merging = now - state.lastChangeTime < MERGE_INTERVAL_MS && state.past.length > 0;
      return {
        past: merging ? state.past : [...state.past.slice(-(MAX_HISTORY - 1)), state.present],
        present: action.data,
        future: [],
        lastChangeTime: now,
      };
    }
    case 'UPDATE_FIELD': {
      const now = Date.now();
      const merging = now - state.lastChangeTime < MERGE_INTERVAL_MS && state.past.length > 0;
      const next = { ...state.present, [action.key]: action.value };
      if (action.key === 'headline' || action.key === 'locationName') {
        next.name = deriveName(next);
      }
      return {
        past: merging ? state.past : [...state.past.slice(-(MAX_HISTORY - 1)), state.present],
        present: next,
        future: [],
        lastChangeTime: now,
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
        lastChangeTime: 0,
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
        lastChangeTime: 0,
      };
    }
  }
}

/* ── Provider ── */
export function BrochureProvider({
  initial,
  children,
}: {
  initial: BrochureData;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: { ...initial, name: deriveName(initial) },
    future: [],
    lastChangeTime: 0,
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const setData = useCallback((data: BrochureData) => {
    dispatch({ type: 'SET', data });
  }, []);

  const updateField = useCallback(
    <K extends keyof BrochureData>(key: K, value: BrochureData[K]) => {
      dispatch({ type: 'UPDATE_FIELD', key, value });
    },
    []
  );

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  // ⌘Z / Ctrl+Z  →  undo
  // ⌘⇧Z / Ctrl+Y  →  redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-save to localStorage (debounced 1s)
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveBrochure(state.present);
      setLastSavedAt(new Date());
    }, 1000);
    return () => clearTimeout(saveTimer.current);
  }, [state.present]);

  return (
    <BrochureContext.Provider
      value={{
        data: state.present,
        setData,
        updateField,
        undo,
        redo,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        lastSavedAt,
      }}
    >
      {children}
    </BrochureContext.Provider>
  );
}

export function useBrochure() {
  const ctx = useContext(BrochureContext);
  if (!ctx) throw new Error('useBrochure must be used within BrochureProvider');
  return ctx;
}
