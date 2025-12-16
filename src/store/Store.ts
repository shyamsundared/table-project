// src/store/Store.ts
import { create } from "zustand";
import type { AggType, Row } from "../types/Type";
import type { storetype } from "../types/Type";

/**
 * useData store
 *
 * - Keeps backward-compatible `valueField` (single) for current UI code,
 *   and also supports `valueFields` (array) for multi-value support.
 * - When you call setValueField (single) we keep valueFields in sync.
 * - Exposes helpers to add/remove/clear valueFields for DnD multiple-values UX.
 */
export const useData = create<storetype>((set, get) => ({
  rows: [],
  columns: [],
  rowField: [],
  columnField: [],
  // aggregation type
  aggType: "count",
  // single-field compatibility (legacy)
  valueField: null,
  // new: multiple value fields support
  valueFields: [],

  // setters
  setrows: (rows: Row[]) => set({ rows }),
  setcolumns: (columns: string[]) => set({ columns }),

  // add field to rowField if not exists
  setrowField: (Field: string) =>
    set((state) => (state.rowField.includes(Field) ? state : { rowField: [...state.rowField, Field] })),

  // add field to columnField if not exists
  setcolumnField: (Field: string) =>
    set((state) => (state.columnField.includes(Field) ? state : { columnField: [...state.columnField, Field] })),

  // NEW: remove individual row field
  removeRowField: (field: string) =>
    set((state) => ({
      rowField: state.rowField.filter((f) => f !== field),
    })),

  // NEW: remove individual column field
  removeColumnField: (field: string) =>
    set((state) => ({
      columnField: state.columnField.filter((f) => f !== field),
    })),

  ClearrowField: () => set({ rowField: [] }),
  ClearcolumnField: () => set({ columnField: [] }),

  // single value field setter (keeps valueFields in sync)
  setvalueField: (field: string | null) =>
    set((state) => {
      const newValueFields = field ? [field] : [];
      return { valueField: field, valueFields: newValueFields };
    }),

  // set entire valueFields array (useful when implementing multi-drop)
  setValueFields: (fields: string[]) => set(() => ({ valueFields: fields, valueField: fields[0] ?? null })),

  // add a value field (if not already present)
  addValueField: (field: string) =>
    set((state) => {
      if (state.valueFields.includes(field)) return state;
      const newFields = [...state.valueFields, field];
      return { valueFields: newFields, valueField: newFields[0] ?? null };
    }),

  // remove one value field
  removeValueField: (field: string) =>
    set((state) => {
      const newFields = state.valueFields.filter((f) => f !== field);
      return { valueFields: newFields, valueField: newFields[0] ?? null };
    }),

  // clear all value fields
  clearValueFields: () => set({ valueFields: [], valueField: null }),

  // agg type setter
  setAggType: (agg: AggType) => set({ aggType: agg }),
}));
