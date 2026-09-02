import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, RotateCcw } from "lucide-react";

const MIN = 1;
const MAX = 5;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Full-screen zoomable image viewer with pinch-zoom (mobile), drag-pan,
// double-tap/double-click toggle, wheel zoom and on-screen zoom buttons.
export default function ImageZoomModal({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const gesture = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    baseTx: 0,
    baseTy: 0,
    pinchDist: null,
    pinchScale: 1,
    lastTap: 0,
  });

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // lock body scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const zoomBy = (delta) => setScale((s) => clamp(Number((s + delta).toFixed(2)), MIN, MAX));

  const dist = (t) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onTouchStart = (e) => {
    const g = gesture.current;
    if (e.touches.length === 2) {
      g.pinchDist = dist(e.touches);
      g.pinchScale = scale;
      g.dragging = false;
    } else if (e.touches.length === 1) {
      // double-tap detection
      const now = Date.now();
      if (now - g.lastTap < 300) {
        setScale((s) => (s > 1 ? 1 : 2.5));
        if (scale > 1) {
          setTx(0);
          setTy(0);
        }
        g.lastTap = 0;
        return;
      }
      g.lastTap = now;
      g.dragging = true;
      g.startX = e.touches[0].clientX;
      g.startY = e.touches[0].clientY;
      g.baseTx = tx;
      g.baseTy = ty;
    }
  };

  const onTouchMove = (e) => {
    const g = gesture.current;
    if (e.touches.length === 2 && g.pinchDist) {
      e.preventDefault();
      const ratio = dist(e.touches) / g.pinchDist;
      setScale(clamp(Number((g.pinchScale * ratio).toFixed(2)), MIN, MAX));
    } else if (e.touches.length === 1 && g.dragging && scale > 1) {
      e.preventDefault();
      setTx(g.baseTx + (e.touches[0].clientX - g.startX));
      setTy(g.baseTy + (e.touches[0].clientY - g.startY));
    }
  };

  const onTouchEnd = (e) => {
    const g = gesture.current;
    if (e.touches.length < 2) g.pinchDist = null;
    if (e.touches.length === 0) g.dragging = false;
  };

  // Mouse drag (desktop)
  const onMouseDown = (e) => {
    if (scale <= 1) return;
    const g = gesture.current;
    g.dragging = true;
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.baseTx = tx;
    g.baseTy = ty;
  };
  const onMouseMove = (e) => {
    const g = gesture.current;
    if (!g.dragging) return;
    setTx(g.baseTx + (e.clientX - g.startX));
    setTy(g.baseTy + (e.clientY - g.startY));
  };
  const onMouseUp = () => {
    gesture.current.dragging = false;
  };
  const onWheel = (e) => {
    zoomBy(e.deltaY < 0 ? 0.25 : -0.25);
  };
  const onDoubleClick = () => {
    if (scale > 1) reset();
    else setScale(2.5);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wide text-white/70">{alt}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 transition-colors hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* image area */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onClick={(e) => {
          if (e.target === e.currentTarget && scale <= 1) onClose();
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full select-none rounded-lg bg-white"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: gesture.current.dragging ? "none" : "transform 0.12s ease-out",
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
        />
      </div>

      <p className="pb-4 text-center text-[11px] font-medium text-white/50">
        Pinch or double-tap to zoom · drag to move
      </p>
    </div>
  );
}
