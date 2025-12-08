
import React from "react";
import type { PivotResult } from "../types/Type";

type PivotTableProps = {
  pivot: PivotResult | null;
  rowField: string[];
  columnField: string[];
};

export const PivotTable: React.FC<PivotTableProps> = ({
  pivot,
  rowField,
  columnField,
}) => {
  if (!pivot) {
    return <p>Select row + column fields to see pivot table.</p>;
  }

  return (
    <table border={1} cellPadding={4}>
      <thead>
        <tr>
          <th>
            {rowField.join(',')} ↓  / {columnField.join(',')} →
          </th>
          {pivot.colArray.map((col,index) => (
            <th key={index}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pivot.rowArray.map((rVal, rIndex) => (
          <tr key={rIndex}>
            <td>
              <strong>{rVal}</strong>
            </td>
            {pivot.colArray.map((_, cIndex) => (
              <td key={cIndex}>{pivot.matrix[rIndex][cIndex]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
