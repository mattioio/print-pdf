import { useCallback, useRef, useState } from 'react';
import { uploadImage } from '../../lib/api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  height?: string;
  /** When set, the container uses aspect-ratio instead of a fixed height. */
  aspectRatio?: number;
  position?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  /** Zoom level, 100 = fill, up to 125 = 25% zoom. */
  zoom?: number;
  /** Compact mode for small cards — icon-only delete, no drag overlay text. */
  compact?: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function ImageUploader({
  value,
  onChange,
  label,
  height = '120px',
  aspectRatio,
  position,
  onPositionChange,
  zoom = 100,
  compact = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const didDrag = useRef(false);
  const [hovered, setHovered] = useState(false);

  const posX = position?.x ?? 50;
  const posY = position?.y ?? 50;

  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const img = new window.Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1600;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Upload to Vercel Blob
          setUploading(true);
          try {
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
            });
            const url = await uploadImage(blob, `img-${Date.now()}.jpg`);
            onChange(url);
          } catch {
            // Fallback to base64 if upload fails
            onChange(canvas.toDataURL('image/jpeg', 0.85));
          } finally {
            setUploading(false);
          }
          // Reset position to center on new image
          onPositionChange?.({ x: 50, y: 50 });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onChange, onPositionChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith('image/')) handleFile(file);
    },
    [handleFile]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!onPositionChange || !value) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      didDrag.current = false;
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: { x: posX, y: posY },
      };
      setDragging(true);
    },
    [onPositionChange, value, posX, posY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      // Mark as a real drag once cursor moves more than 3px
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
      // Convert pixel drag to percentage — scale by 2 for responsive feel
      const newX = clamp(dragState.current.startPos.x - (dx / rect.width) * 100, 0, 100);
      const newY = clamp(dragState.current.startPos.y - (dy / rect.height) * 100, 0, 100);
      onPositionChange?.({ x: Math.round(newX), y: Math.round(newY) });
    },
    [onPositionChange]
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setDragging(false);
  }, []);

  const canReposition = !!onPositionChange && !!value;
  const showHint = canReposition && hovered && !dragging;

  return (
    <div
      ref={containerRef}
      className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative group"
      style={aspectRatio ? { aspectRatio, maxHeight: height } : { height }}
      onClick={() => {
        if (didDrag.current) { didDrag.current = false; return; }
        inputRef.current?.click();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {value ? (
        <>
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover select-none"
            style={{
              objectPosition: zoom > 100 ? '50% 50%' : `${posX}% ${posY}%`,
              cursor: canReposition ? (dragging ? 'grabbing' : 'grab') : 'pointer',
              transform: zoom > 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: zoom > 100 ? `${posX}% ${posY}%` : undefined,
            }}
            draggable={false}
            onPointerDown={canReposition ? handlePointerDown : undefined}
            onPointerMove={canReposition ? handlePointerMove : undefined}
            onPointerUp={canReposition ? handlePointerUp : undefined}
          />
          {/* Drag hint — skip on compact cards, grab cursor is enough */}
          {showHint && !compact && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none transition-opacity">
              <span className="text-white text-xs font-medium bg-black/50 px-2.5 py-1 rounded-full">
                Drag to reposition
              </span>
            </div>
          )}
          {/* Delete button — icon-only on compact cards */}
          <button
            className={
              compact
                ? 'absolute top-1 right-1 bg-black/50 backdrop-blur-sm text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600/90 z-10 transition-all opacity-0 group-hover:opacity-100'
                : 'absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 hover:bg-red-600/90 z-10 transition-colors'
            }
            onClick={(e) => {
              e.stopPropagation();
              if (!confirm('Delete this image?')) return;
              onChange('');
            }}
          >
            <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
              <path d="M6.5 7v4M9.5 7v4" />
            </svg>
            {!compact && <span className="text-xs font-medium">Delete</span>}
          </button>
        </>
      ) : uploading ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-1">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Uploading…</span>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm cursor-pointer hover:border-gray-400">
          {label}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
