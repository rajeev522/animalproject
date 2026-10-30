import React, { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeftRight, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  animalName,
  allowCollapse = true,
}: {
  beforeSrc: string;
  afterSrc: string;
  animalName: string;
  allowCollapse?: boolean;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    updateSlider(e.clientX);
  };
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging) updateSlider(e.clientX);
    },
    [dragging, updateSlider]
  );
  const handleMouseUp = useCallback(() => setDragging(false), []);
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (dragging) updateSlider(e.touches[0].clientX);
    },
    [dragging, updateSlider]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-lg">
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          <span className="text-white/80 text-sm font-semibold tracking-wide">
            Recovery — {animalName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isCollapsed && <span className="text-white/30 text-xs hidden sm:inline">Drag to compare</span>}
          {allowCollapse && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-all"
              title={isCollapsed ? "Show Comparison" : "Hide Comparison"}
            >
              {isCollapsed ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Show</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-white/50" />
                  <span>Hide</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div
          ref={containerRef}
          className="relative aspect-video cursor-col-resize select-none overflow-hidden"
          onMouseDown={handleMouseDown}
          onTouchStart={(e) => {
            setDragging(true);
            updateSlider(e.touches[0].clientX);
          }}
        >
          <img
            src={afterSrc}
            alt="After recovery"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={beforeSrc}
              alt="Before rescue"
              className="w-full h-full object-cover pointer-events-none"
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
            style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center z-20 border border-black/10">
              <ArrowLeftRight className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-black/60 backdrop-blur-sm text-red-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-500/30 uppercase tracking-wider">
              Before
            </span>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/30 uppercase tracking-wider">
              After
            </span>
          </div>
          {!dragging && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm text-white/70 text-[10px] px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-1.5 shadow-md">
                <ArrowLeftRight className="w-3 h-3" /> Slide to compare
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
