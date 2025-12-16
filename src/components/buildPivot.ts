// src/components/buildPivot.ts
import type { Row, PivotResult, AggType } from "../types/Type";

type CellAggMulti = {
  sum: number[];
  count: number[];
  min: number[];
  max: number[];
};

export const buildPivot = (
  data: Row[],
  rowField: string[],
  colField: string[],
  valueFields: string[] | null,
  aggType: AggType
): PivotResult | null => {
  if (!data.length || !rowField.length || !colField.length) return null;

  const vCount = valueFields ? valueFields.length : 0;
  if (aggType !== "count" && vCount === 0) return null;

  // Validate fields exist in data
  const sampleRow = data[0];
  const allFields = [...rowField, ...colField];
  if (valueFields && valueFields.length > 0) {
    allFields.push(...valueFields);
  }
  
  const missingFields = allFields.filter(f => !(f in sampleRow));
  
  if (missingFields.length > 0) {
    console.warn(`Missing fields in data: ${missingFields.join(', ')}`);
    return null;
  }

  const rowKeySet = new Set<string>();
  const colKeySet = new Set<string>();
  const cellMap = new Map<string, CellAggMulti>();

  data.forEach((row) => {
    const rowKey = rowField.map((f) => String(row[f] ?? "")).join("\x1F");
    const colKey = colField.map((f) => String(row[f] ?? "")).join("\x1F");

    rowKeySet.add(rowKey);
    colKeySet.add(colKey);

    const key = `${rowKey}__${colKey}`;

    if (!cellMap.has(key)) {
      cellMap.set(key, {
        sum: Array(vCount).fill(0),
        count: Array(vCount).fill(0),
        min: Array(vCount).fill(Number.POSITIVE_INFINITY),
        max: Array(vCount).fill(Number.NEGATIVE_INFINITY),
      });
    }

    const agg = cellMap.get(key)!;

    // count-only (no value fields): increment a synthetic count slot
    if (aggType === "count" && vCount === 0) {
      if (agg.count.length === 0) {
        agg.count = [1];
        agg.sum = [0];
        agg.min = [Number.POSITIVE_INFINITY];
        agg.max = [Number.NEGATIVE_INFINITY];
      } else {
        agg.count[0] = (agg.count[0] || 0) + 1;
      }
      return;
    }

    // Otherwise handle each value field
    for (let vi = 0; vi < vCount; vi++) {
      const vf = valueFields![vi];
      const raw = row[vf];
      const num = Number(raw);
      if (Number.isNaN(num)) continue;
      agg.count[vi] += 1;
      agg.sum[vi] += num;
      if (num < agg.min[vi]) agg.min[vi] = num;
      if (num > agg.max[vi]) agg.max[vi] = num;
    }
  });

  const rowArray = Array.from(rowKeySet).sort((a, b) => {
    const aParts = a.split("\x1F");
    const bParts = b.split("\x1F");
    
    // Compare level by level
    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aVal = aParts[i];
      const bVal = bParts[i];
      
      // Try to parse as numbers for proper numeric sorting
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Both are numbers - sort numerically
        if (aNum !== bNum) return aNum - bNum;
      } else {
        // At least one is not a number - sort alphabetically
        if (aVal !== bVal) return aVal.localeCompare(bVal);
      }
    }
    
    // If all parts equal, shorter key comes first
    return aParts.length - bParts.length;
  });
  
  const colArray = Array.from(colKeySet).sort((a, b) => {
    const aParts = a.split("\x1F");
    const bParts = b.split("\x1F");
    
    // Compare level by level
    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aVal = aParts[i];
      const bVal = bParts[i];
      
      // Try to parse as numbers for proper numeric sorting
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Both are numbers - sort numerically
        if (aNum !== bNum) return aNum - bNum;
      } else {
        // At least one is not a number - sort alphabetically
        if (aVal !== bVal) return aVal.localeCompare(bVal);
      }
    }
    
    // If all parts equal, shorter key comes first
    return aParts.length - bParts.length;
  });

  // Build matrix: matrix[row][col] => array of values per valueField
  const matrix = rowArray.map((rKey) =>
    colArray.map((cKey) => {
      const agg = cellMap.get(`${rKey}__${cKey}`);
      if (!agg) {
        return vCount ? Array(vCount).fill(null) : [0];
      }

      const out: (number | null)[] = [];
      const slots = Math.max(1, vCount);
      for (let vi = 0; vi < slots; vi++) {
        switch (aggType) {
          case "count":
            out.push(agg.count[vi] || 0);
            break;
          case "sum":
            out.push(agg.sum[vi] || 0);
            break;
          case "avg":
            out.push(agg.count[vi] ? agg.sum[vi] / agg.count[vi] : 0);
            break;
          case "min":
            out.push(agg.count[vi] ? agg.min[vi] : 0);
            break;
          case "max":
            out.push(agg.count[vi] ? agg.max[vi] : 0);
            break;
          default:
            out.push(0);
        }
      }
      return out;
    })
  );

  return { rowArray, colArray, matrix };
};