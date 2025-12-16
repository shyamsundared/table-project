// src/components/PivotTable.tsx
import React, { useMemo } from "react";
import {
  buildHierarchy,
  buildHeaderRows,
  collectColLeaves,
  treeDepth,
} from "../utils/pivotHierarchy";
import type { TreeNode, HeaderCell } from "../utils/pivotHierarchy";
import type { PivotResult, AggType } from "../types/Type";

type Props = {
  pivot: PivotResult | null;
  fullPivot?: PivotResult | null;
  rowField: string[];
  columnField?: string[];
  valueFields?: string[];
  pageStart?: number;
  aggType?: AggType;
};


/**
 * Pivot Table with Recursive Bottom-Up Rowspan
 * 
 * Algorithm:
 * 1. Start at leaf level (rightmost column)
 * 2. Each leaf data row = 1
 * 3. Each parent = sum of children rows + 1 (for its subtotal)
 * 4. Propagate up recursively
 */
export const PivotTable: React.FC<Props> = ({
  pivot,
  fullPivot = null,
  rowField,
  valueFields = [],
  pageStart = 0,
  aggType = "count",
}) => {
  const headerPivot = fullPivot ?? pivot ?? null;
  const vCount = Math.max(1, valueFields.length);

  const headerData = useMemo(() => {
    if (!headerPivot) {
      return {
        rowTree: [] as TreeNode[],
        colTree: [] as TreeNode[],
        colHeaderRows: [] as HeaderCell[][],
        colLeaves: [] as number[],
        headerDepth: 1,
      };
    }
    const rowTree = buildHierarchy(headerPivot.rowArray ?? [], "\x1F", true);
    const colTree = buildHierarchy(headerPivot.colArray ?? [], "\x1F", false);
    const colHeaderRows = buildHeaderRows(colTree);
    const colLeaves = collectColLeaves(colTree);
    const headerDepth = Math.max(1, treeDepth(colTree));
    return { rowTree, colTree, colHeaderRows, colLeaves, headerDepth };
  }, [headerPivot]);

  const totalsMatrix = useMemo(() => {
    return fullPivot?.matrix ?? pivot?.matrix ?? [];
  }, [fullPivot, pivot]);

  const grandTotals = useMemo(() => {
    const { colLeaves } = headerData;
    const out: number[][] = [];
    for (let i = 0; i < colLeaves.length; i++) {
      const cIdx = colLeaves[i];
      const colTotals = Array(vCount).fill(0);
      for (let r = 0; r < (totalsMatrix?.length ?? 0); r++) {
        const slot = totalsMatrix[r]?.[cIdx] ?? Array(vCount).fill(null);
        for (let vi = 0; vi < vCount; vi++) {
          const v = slot[vi];
          if (typeof v === "number") colTotals[vi] += v;
        }
      }
      out.push(colTotals);
    }
    return out;
  }, [totalsMatrix, headerData, vCount]);

  const colHeaderRowsRendered = useMemo(() => {
    const { colHeaderRows, colLeaves } = headerData;
    const rows: React.ReactNode[][] = [];

    colHeaderRows.forEach((row) => {
      const cells = row.map((cell) => (
        <th
          key={cell.key}
          colSpan={cell.colspan * vCount}
          rowSpan={cell.rowspan}
          className="table-head-2"
        >
          <div className="header-flex-center">{cell.label}</div>
        </th>
        
      ));
      rows.push(cells);
    });

    if (vCount >= 1) {
      const valCells: React.ReactNode[] = [];
      for (const cIdx of colLeaves) {
        for (let vi = 0; vi < vCount; vi++) {
          const label = vCount > 1 
            ? `${aggType}(${valueFields[vi] ?? 'Value'})`
            : `${aggType}(Value)`;
          valCells.push(
            <th 
              key={`val-${cIdx}-${vi}`} 
              className="table-head-3"
            >
              <div className="table-head-4">{label}</div>
            </th>
          );
        }
      }
      rows.push(valCells);
    }
    return rows;
  }, [headerData, vCount, valueFields, aggType]);

  if (!pivot && !fullPivot) {
    return <div className="p-4 text-sm text-gray-500">No pivot to show</div>;
  }

  const fullRowKeys = fullPivot?.rowArray ?? pivot?.rowArray ?? [];
  const fullPaths = fullRowKeys.map((k) => (k ?? "(blank)").split("\x1F"));
  const leftLevels = Math.max(1, rowField.length);
  const { colLeaves } = headerData;

  // Step 1: Build hierarchical structure with row counts
  type HierNode = {
    value: string;
    level: number;
    dataRows: number[];  // Indices of leaf data rows under this node
    totalRows: number;   // Total rows including all children + subtotal
    children: HierNode[];
    parent: HierNode | null;
  };

  const buildHierarchicalStructure = (): HierNode[] => {
    const roots: HierNode[] = [];
    const nodeMap = new Map<string, HierNode>();
    
    for (let dataIdx = 0; dataIdx < fullPaths.length; dataIdx++) {
      const path = fullPaths[dataIdx];
      let currentParent: HierNode | null = null;

      // Build path from root to leaf
      for (let level = 0; level < leftLevels; level++) {
        const value = path[level] ?? "(blank)";
        const key = path.slice(0, level + 1).join("\x1F");

        let node = nodeMap.get(key);
        if (!node) {
          node = {
            value,
            level,
            dataRows: [],
            totalRows: 0,
            children: [],
            parent: currentParent,
          };
          nodeMap.set(key, node);

          if (currentParent) {
            currentParent.children.push(node);
          } else {
            roots.push(node);
          }
        }

        // If this is a leaf level, record the data row
        if (level === leftLevels - 1) {
          node.dataRows.push(dataIdx);
        }

        currentParent = node;
      }
    }

    // Step 2: Calculate totalRows bottom-up (recursively)
    const calculateTotalRows = (node: HierNode): number => {
      if (node.children.length === 0) {
        // Leaf node: 1 row per data entry
        node.totalRows = node.dataRows.length;
      } else {
        // Parent node: sum of children + 1 for subtotal
        node.totalRows = node.children.reduce((sum, child) => sum + calculateTotalRows(child), 0) + 1;
      }
      return node.totalRows;
    };

    roots.forEach(calculateTotalRows);

    return roots;
  };

  const hierarchy = buildHierarchicalStructure();

  console.log('Hierarchy (first 2 roots):', hierarchy.slice(0, 2).map(r => ({
    value: r.value,
    level: r.level,
    totalRows: r.totalRows,
    childCount: r.children.length,
  })));

  // Step 3: Flatten hierarchy into renderable rows with rowspan info
  type RenderRow = {
    type: 'data' | 'subtotal';
    path: string[];
    dataIndex?: number;
    level?: number;
    rowspans: number[];  // rowspan for each level column
    parentValue?: string; // For subtotal label
  };

  const flattenHierarchy = (): RenderRow[] => {
    const rows: RenderRow[] = [];

    const traverse = (node: HierNode, path: string[], rowspans: number[]) => {
      const newRowspans = [...rowspans];
      newRowspans[node.level] = node.totalRows;

      if (node.children.length === 0) {
        // Leaf node - emit data rows
        for (const dataIdx of node.dataRows) {
          rows.push({
            type: 'data',
            path: fullPaths[dataIdx],
            dataIndex: dataIdx,
            rowspans: newRowspans,
          });
        }
      } else {
        // Parent node - traverse children first, then add subtotal
        for (const child of node.children) {
          traverse(child, [...path, node.value], newRowspans);
        }

        // Add subtotal row for this parent (but not for leaf level)
        // Leaf level is leftLevels - 1, so only add subtotals for levels < leftLevels - 1
        if (node.level < leftLevels - 1) {
          rows.push({
            type: 'subtotal',
            path: [...path, node.value],
            level: node.level,
            rowspans: new Array(leftLevels).fill(0), // Subtotals don't need rowspans
            parentValue: node.value,
          });
        }
      }
    };

    hierarchy.forEach(root => traverse(root, [], new Array(leftLevels).fill(0)));

    return rows;
  };

  const renderRows = flattenHierarchy();

  console.log('Render rows (first 30):', renderRows.slice(0, 30).map(r => ({
    type: r.type,
    level: r.level,
    path: r.path?.slice(0, 3),
    rowspans: r.rowspans,
    parentValue: r.parentValue,
  })));

  // PAGINATION: Filter visible rows based on pageStart
  const pagedRowKeys = pivot?.rowArray ?? [];
  const pageStartIdx = pageStart ?? 0;
  const pageEndIdx = pageStartIdx + pagedRowKeys.length;

  const visibleRows: RenderRow[] = [];
  const includedDataIndices = new Set<number>();
  
  // First pass: collect visible data rows
  for (const row of renderRows) {
    if (row.type === 'data') {
      if (row.dataIndex! >= pageStartIdx && row.dataIndex! < pageEndIdx) {
        visibleRows.push(row);
        includedDataIndices.add(row.dataIndex!);
      }
    }
  }

  // Second pass: include subtotals that have visible children
  for (const row of renderRows) {
    if (row.type === 'subtotal') {
      const subtotalLevel = row.level!;
      const subtotalPath = row.path.slice(0, subtotalLevel + 1);
      const subtotalKey = subtotalPath.join("\x1F");
      
      let hasVisibleChildren = false;
      for (const dataIdx of includedDataIndices) {
        const dataPath = fullPaths[dataIdx].slice(0, subtotalLevel + 1);
        if (dataPath.join("\x1F") === subtotalKey) {
          hasVisibleChildren = true;
          break;
        }
      }
      
      if (hasVisibleChildren) {
        visibleRows.push(row);
      }
    }
  }

  // Sort visible rows to maintain proper order (data rows, then their subtotals)
  visibleRows.sort((a, b) => {
    const aIdx = renderRows.indexOf(a);
    const bIdx = renderRows.indexOf(b);
    return aIdx - bIdx;
  });

  // Recalculate rowspans for visible rows only
  const pageRowspans = new Map<string, number>();
  
  for (let level = 0; level < leftLevels; level++) {
    let currentValue: string | null = null;
    let startIdx = 0;
    let rowCount = 0;
    
    for (let i = 0; i < visibleRows.length; i++) {
      const row = visibleRows[i];
      
      // For subtotal rows, check if they belong to current group at this level
      if (row.type === 'subtotal') {
        // If subtotal is for a level DEEPER than current level, include it in rowspan
        // If subtotal is for current level or shallower, it ends the group
        if (row.level! > level) {
          // Subtotal for deeper level - include in current level's rowspan
          rowCount++;
          continue;
        } else if (row.level! === level) {
          // Subtotal for current level - include it then end the group
          rowCount++;
          if (currentValue !== null && rowCount > 0) {
            pageRowspans.set(`${level}-${startIdx}`, rowCount);
          }
          currentValue = null;
          rowCount = 0;
          continue;
        } else {
          // Subtotal for shallower level - ends the group
          if (currentValue !== null && rowCount > 0) {
            pageRowspans.set(`${level}-${startIdx}`, rowCount);
          }
          currentValue = null;
          rowCount = 0;
          continue;
        }
      }
      
      const value = row.path[level] ?? "(blank)";
      
      if (currentValue !== value) {
        if (currentValue !== null) {
          pageRowspans.set(`${level}-${startIdx}`, rowCount);
        }
        currentValue = value;
        startIdx = i;
        rowCount = 0;
      }
      
      rowCount++;
    }
    
    if (currentValue !== null) {
      pageRowspans.set(`${level}-${startIdx}`, rowCount);
    }
  }

  console.log('Visible rows count:', visibleRows.length);
  console.log('Page rowspans (first 20):', Array.from(pageRowspans.entries()).slice(0, 20));

  // Helper to calculate subtotal values
  const calculateSubtotal = (level: number, path: string[]): number[][] => {
    const parentPath = path.slice(0, level + 1);
    const parentKey = parentPath.join("\x1F");
    
    const subtotals: number[][] = [];
    
    for (const cIdx of colLeaves) {
      const colTotals = Array(vCount).fill(0);
      
      for (let r = 0; r < fullPaths.length; r++) {
        const rowPath = fullPaths[r].slice(0, level + 1);
        const rowKey = rowPath.join("\x1F");
        
        if (rowKey === parentKey) {
          const slot = totalsMatrix[r]?.[cIdx] ?? Array(vCount).fill(null);
          for (let vi = 0; vi < vCount; vi++) {
            const v = slot[vi];
            if (typeof v === "number") colTotals[vi] += v;
          }
        }
      }
      
      subtotals.push(colTotals);
    }
    
    return subtotals;
  };

  // Step 4: Render table body
  const bodyRows: React.ReactNode[] = [];
  const renderedCells = new Set<string>();

  for (let rowIdx = 0; rowIdx < visibleRows.length; rowIdx++) {
    const row = visibleRows[rowIdx];
    
    if (row.type === 'data') {
      const leftCells: React.ReactNode[] = [];

      // Render hierarchy cells with rowspan
      for (let level = 0; level < leftLevels; level++) {
        const cellKey = `${level}-${rowIdx}`;
        
        if (!renderedCells.has(cellKey)) {
          const span = pageRowspans.get(cellKey) ?? 1; // Use page-aware rowspan!
          
          if (span > 0) {
            const value = row.path[level] ?? "(blank)";
            
            leftCells.push(
              <td
                key={cellKey}
                rowSpan={span}
                className="table-body-1"
                style={{ paddingLeft: `${16 + level * 16}px` }}
              >
                {value}
              </td>
            );
            
            // Mark cells as rendered
            for (let i = 0; i < span; i++) {
              renderedCells.add(`${level}-${rowIdx + i}`);
            }
          }
        }
      }

      // Data cells - use pageMatrix for paginated data
      const pageMatrix = pivot?.matrix ?? [];
      const pageRowIndex = row.dataIndex! - pageStartIdx; // Convert to page-local index
      
      const dataCells = colLeaves
        .map((cIdx) =>
          Array.from({ length: vCount }).map((_, vi) => {
            const slotRow = pageMatrix[pageRowIndex] ?? [];
            const cellValues = slotRow[cIdx];
            const value = Array.isArray(cellValues) ? cellValues[vi] : null;
            return (
              <td key={`cell-${rowIdx}-${cIdx}-${vi}`} className="table-cell">
                {typeof value === "number" ? value.toLocaleString() : ""}
              </td>
            );
          })
        )
        .flat();

      bodyRows.push(
        <tr key={`row-${rowIdx}`}>
          {leftCells}
          {dataCells}
        </tr>
      );
    } else {
      // Subtotal row
      const level = row.level!;
      const parentValue = row.parentValue!;
      const subtotalValues = calculateSubtotal(level, row.path);

      const leftCells: React.ReactNode[] = [];
      let labelPlaced = false;

      // Subtotal should appear in the NEXT column after its level (the child column)
      // and span from there to the end of left columns
      const targetColumn = level + 1; // Next column after the parent level

      for (let lvl = 0; lvl < leftLevels; lvl++) {
        const cellKey = `${lvl}-${rowIdx}`;

        // If this column is already covered by an active rowspan, skip it
        if (renderedCells.has(cellKey)) {
          continue;
        }

        // Place subtotal label at the target column (child of parent level)
        if (!labelPlaced && lvl >= targetColumn) {
          const colspan = leftLevels - lvl; // Span from current column to end
          leftCells.push(
            <td
              key={`subtotal-label-${rowIdx}`}
              colSpan={colspan}
              className="table-body-1 row-subtotal"
              style={{ paddingLeft: `${16 + lvl * 16}px` }}
            >
              Total {parentValue}
            </td>
          );
          labelPlaced = true;
          break; // remaining columns covered by colspan
        }

        // For other uncovered columns before target, render empty placeholder
        leftCells.push(
          <td
            key={`empty-${rowIdx}-${lvl}`}
            className="table-body-1 row-subtotal"
          />
        );
      }

      const subtotalDataCells = colLeaves
        .map((_, ci) =>
          Array.from({ length: vCount }).map((_, vi) => (
            <td
              key={`subtotal-${rowIdx}-${ci}-${vi}`}
              className="table-cell table-cell-total cell-subtotal-bg"
            >
              {(subtotalValues[ci]?.[vi] ?? 0).toLocaleString()}
            </td>
          ))
        )
        .flat();

      bodyRows.push(
        <tr key={`subtotal-${rowIdx}`} className="row-subtotal">
          {leftCells}
          {subtotalDataCells}
        </tr>
      );
    }
  }

  const grandTotalRow = (
    <tr>
      <td
        className="table-body-1 row-grand-total cell-grand-total-bg"
        colSpan={leftLevels}
        style={{ paddingLeft: "16px" }}
      >
        Grand Total
      </td>
      {colLeaves.map((_, ci) =>
        Array.from({ length: vCount }).map((_, vi) => (
          <td
            key={`gt-${ci}-${vi}`}
            className="table-cell table-cell-total cell-grand-total-bg"
          >
            {(grandTotals[ci]?.[vi] ?? 0).toLocaleString()}
          </td>
        ))
      ).flat()}
    </tr>
  );

  const topLeftHeaders = rowField.slice(0, leftLevels).map((rf, i) => (
    <th
      key={`th-left-${i}`}
      rowSpan={colHeaderRowsRendered.length + 1}
      className="table-head-1"
    >
      <div className="header-flex-container">
        <span>{rf}</span>
      </div>
    </th>
  ));

  const dataCols = Math.max(1, colLeaves.length * vCount);

  return (
    <div className="pivot-container">
      <table className="pivot-table">
        <thead>
          <tr>
            {topLeftHeaders}
            <th colSpan={dataCols} className="table-head-top"></th>
          </tr>

          {colHeaderRowsRendered.map((rowCells, idx) => (
            <tr key={`hdr-${idx}`}>{rowCells}</tr>
          ))}
        </thead>

        <tbody>
          {grandTotalRow}
          {bodyRows}
        </tbody>
      </table>

      <style>{`
        .pivot-container {
          width: 100%;
          height: 100%;
          overflow: auto;
        }
        
        .pivot-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 14px;
        }
        
        .pivot-table th,
        .pivot-table td {
          border: 1px solid #ddd;
        }
        
        .table-head-1 {
          background-color: white;
          border: 1px solid #ddd;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }
        
        .table-head-2 {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          padding: 12px 16px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
        }
        
        .table-head-3 {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          padding: 10px 16px;
          text-align: center;
          font-weight: 500;
          font-size: 13px;
        }
        
        .table-head-4 {
          font-size: 12px;
        }
        
        .table-head-top {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
        }
        
        .table-body-1 {
          border: 1px solid #ddd;
          padding: 10px 16px;
          background-color: white;
          vertical-align: middle;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .table-cell {
          border: 1px solid #ddd;
          padding: 10px 16px;
          text-align: right;
          background-color: white;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .table-cell-total {
          font-weight: 600;
        }
        
        .row-grand-total {
          background-color: #d4edda !important;
          font-weight: bold;
        }
        
        .cell-grand-total-bg {
          background-color: #d4edda !important;
        }
        
        .row-subtotal {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        
        .cell-subtotal-bg {
          background-color: #f8f9fa;
        }
        
        .header-flex-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .header-flex-center {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 40px;
        }
      `}</style>
    </div>
  );
};