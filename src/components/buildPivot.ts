// src/hooks/buildPivot.ts
import type { Row, PivotResult, AggType } from "../types/Type";

type CellAgg = {
  sum: number;
  count: number;
  min: number;
  max: number;
};

export const buildPivot = (
  data: Row[],
  rowField: string[],
  colField: string[],
  valueField: string | null,
  aggType: AggType
): PivotResult | null => {
  // Need rows + row groups + col groups
  if (!data.length || !rowField.length || !colField.length) {
    return null;
  }

  // For SUM / AVG / MIN / MAX, we need a value field
  if (aggType !== "count" && !valueField) {
    return null;
  }

  const rowKeySet = new Set<string>();
  const colKeySet = new Set<string>();
  const cellMap = new Map<string, CellAgg>();

  data.forEach((row) => {
    const rowKey = rowField.map((f) => String(row[f as keyof Row] ?? "")).join("|");
    const colKey = colField.map((f) => String(row[f as keyof Row] ?? "")).join("|");

    rowKeySet.add(rowKey);
    colKeySet.add(colKey);

    const key = `${rowKey}__${colKey}`;

    // init aggregation slot if needed
    if (!cellMap.has(key)) {
      cellMap.set(key, {
        sum: 0,
        count: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
      });
    }

    const agg = cellMap.get(key)!;

    if (aggType === "count" || !valueField) {
      
      agg.count += 1;
      return;
    }

    const rawVal = row[valueField as keyof Row];
    const num = Number(rawVal);

    
    if (Number.isNaN(num)) {
      return;
    }

    agg.count += 1;
    agg.sum += num;
    if (num < agg.min) agg.min = num;
    if (num > agg.max) agg.max = num;
  });

  const rowArray = Array.from(rowKeySet);
  const colArray = Array.from(colKeySet);

  const matrix = rowArray.map((rKey) =>
    colArray.map((cKey) => {
      const agg = cellMap.get(`${rKey}__${cKey}`);

      if (!agg) return 0;

      switch (aggType) {
        case "count":
          return agg.count;
        case "sum":
          return agg.sum;
        case "avg":
          return agg.count ? agg.sum / agg.count : 0;
        case "min":
          return agg.count ? agg.min : 0;
        case "max":
          return agg.count ? agg.max : 0;
        default:
          return 0;
      }
    })
  );

  return { rowArray, colArray, matrix };
};

