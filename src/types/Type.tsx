// src/types/Type.ts
export type AggType = "count" | "sum" | "avg" | "min" | "max";

export type Row = {
  // generic object with string keys and any values
  [key: string]: unknown;
};

// Pivot result: matrix[rowIndex][colIndex][valueIndex] => number | null
export type PivotResult = {
  rowArray: string[]; // joined keys for rows
  colArray: string[]; // joined keys for cols
  matrix: (number | null)[][][]; // 3D matrix to support multiple value fields
};

export type NumberFormat = "decimal" | "currency" | "percentage";

// storetype for zustand
export type storetype = {
  rows: Row[];
  columns: string[];
  rowField: string[];
  columnField: string[]; 
  aggType: AggType;

  // backward-compatible single value field
  valueField: string | null;

  // new: multiple value fields
  valueFields: string[];

  // actions
  setrows: (rows: Row[]) => void;
  setcolumns: (columns: string[]) => void;
  setrowField: (field: string) => void;
  setcolumnField: (field: string) => void;
  removeRowField: (field: string) => void;  // NEW: remove individual row field
  removeColumnField: (field: string) => void;  // NEW: remove individual column field
  ClearrowField: () => void;
  ClearcolumnField: () => void;
  setvalueField: (field: string | null) => void;
  setValueFields: (fields: string[]) => void;
  addValueField: (field: string) => void;
  removeValueField: (field: string) => void;
  clearValueFields: () => void;
  setAggType: (agg: AggType) => void;
};
