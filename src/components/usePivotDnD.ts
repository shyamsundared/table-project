// src/components/usePivotDnD.ts
import { useCallback } from "react";
import { useData } from "../store/Store";

/**
 * usePivotDnD
 *
 * Returns DnD handlers for dragging field names into Row / Column / Value targets.
 * - onDragStartField(field) -> attach field name to dataTransfer
 * - onDragOver -> allow drop
 * - onDropRowField -> add field to rowField (no duplicates)
 * - onDropColField -> add field to columnField (no duplicates)
 * - onDropValueField -> add field to valueFields (multiple allowed)
 *
 * All handlers are stable via useCallback.
 */
export function usePivotDnD() {
  const setrowField = useData((s) => s.setrowField);
  const setcolumnField = useData((s) => s.setcolumnField);
  const addValueField = useData((s) => s.addValueField);

  // Called onDragStart for a draggable field chip
  const onDragStartField = useCallback((field: string) => {
    return (e: React.DragEvent) => {
      try {
        e.dataTransfer.setData("text/plain", field);
      } catch {
        // some browsers may throw if types aren't supported; fallback
        (e.dataTransfer as any).setData("text", field);
      }
      e.dataTransfer.effectAllowed = "copy";
    };
  }, []);

  // Allow dropping
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Helper to read the dragged field safely
  const readDraggedField = (e: React.DragEvent) => {
    const dt = e.dataTransfer;
    let field = "";
    // try a couple of common keys
    field = dt.getData("text/plain") || dt.getData("text") || "";
    return field.trim();
  };

  const onDropRowField = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const field = readDraggedField(e);
      if (!field) return;
      setrowField(field);
    },
    [setrowField]
  );

  const onDropColField = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const field = readDraggedField(e);
      if (!field) return;
      setcolumnField(field);
    },
    [setcolumnField]
  );

  const onDropValueField = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const field = readDraggedField(e);
      if (!field) return;
      // addValueField will dedupe if already present
      addValueField(field);
    },
    [addValueField]
  );

  return {
    onDragStartField,
    onDragOver,
    onDropRowField,
    onDropColField,
    onDropValueField,
  };
}

