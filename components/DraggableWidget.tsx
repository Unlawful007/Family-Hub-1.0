import React, { useState, useRef, useCallback } from 'react';
import { WidgetPosition } from '../types';

interface DraggableWidgetProps {
  id: string;
  initialPos: WidgetPosition;
  onDragEnd: (id: string, newPos: WidgetPosition) => void;
  children: React.ReactNode;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ id, initialPos, onDragEnd, children }) => {
  const [pos, setPos] = useState<WidgetPosition>(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, audio')) {
      return; // Don't drag on interactive elements
    }
    e.preventDefault();
    e.stopPropagation();

    const el = containerRef.current;
    if (el) {
        const rect = el.getBoundingClientRect();
        offset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        setIsDragging(true);
    }
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newPos = {
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
    };
    setPos(newPos);
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    const newPos = {
        x: e.clientX - offset.current.x,
        y: e.clientY - offset.current.y,
    };
    onDragEnd(id, newPos);
  }, [id, onDragEnd]);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 10,
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease-in-out',
        boxShadow: isDragging ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
        // Define widths based on widget ID for grid-like but draggable layout
        width: id.includes('weather') || id.includes('suggestions') ? 'calc(50% - 36px)' :
               id.includes('map') || id.includes('messages') ? 'calc(25% - 36px)' :
               'calc(12.5% - 36px)',
      }}
      className="select-none"
    >
      {children}
    </div>
  );
};

export default DraggableWidget;
