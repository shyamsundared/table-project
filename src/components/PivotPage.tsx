// src/components/PivotPage.tsx
import React, { useState } from "react";
import { useData } from "../store/Store";
import { useCsvParser } from "../components/useCsvParser";
import { usePivotDnD } from "../components/usePivotDnD";
import { buildPivot } from "../components/buildPivot";
import { PivotTable } from "./PivotTable";
import type { AggType } from "../types/Type";

export const PivotPage: React.FC = () => {
  const {
    rows,
    columns,
    rowField,
    columnField,
    valueField,
    aggType,
    setAggType,
  } = useData();

  const { handleFileChange } = useCsvParser();
  const {
    onDragStartField,
    onDragOver,
    onDropRowField,
    onDropColField,
    onDropValueField,
  } = usePivotDnD();

  
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  
  const fullPivot =
    rows.length && rowField.length && columnField.length
      ? buildPivot(rows, rowField, columnField, valueField, aggType)
      : null;

  
  let pagedPivot = fullPivot;
  let totalPages = 1;
  let currentPageDisplay = 1;

  if (fullPivot) {
    const totalRows = fullPivot.rowArray.length;
    totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    currentPageDisplay = Math.min(currentPage, totalPages);

    const start = (currentPageDisplay - 1) * pageSize;
    const end = start + pageSize;

    pagedPivot = {
      rowArray: fullPivot.rowArray.slice(start, end),
      colArray: fullPivot.colArray,
      matrix: fullPivot.matrix.slice(start, end),
    };
  }

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) =>
      fullPivot ? Math.min(totalPages, p + 1) : p
    );
  };

  return (
    <div className="p-20">
      <h2>Pivot Table Builder</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      <h3>Fields</h3>
      <div className="flex flex-wrap gap-8">
        {columns.map((col) => (
          <div
            key={col}
            draggable
            onDragStart={onDragStartField(col)}
            style={{
              border: "1px solid #ccc",
              padding: "4px 8px",
              borderRadius: 4,
              cursor: "grab",
            }}
          >
            {col}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
        <div>
          <strong>Row fields:</strong>{" "}
          {rowField.length ? rowField.join(" , ") : "(drop here)"}
          <div
            onDragOver={onDragOver}
            onDrop={onDropRowField}
            style={{
              marginTop: 4,
              border: "2px dashed #888",
              minWidth: 150,
              minHeight: 40,
              padding: 8,
            }}
          >
            Drop fields here for rows
          </div>
        </div>

        <div>
          <strong>Column fields:</strong>{" "}
          {columnField.length ? columnField.join(" , ") : "(drop here)"}
          <div
            onDragOver={onDragOver}
            onDrop={onDropColField}
            style={{
              marginTop: 4,
              border: "2px dashed #888",
              minWidth: 150,
              minHeight: 40,
              padding: 8,
            }}
          >
            Drop fields here for columns
          </div>
        </div>

        <div>
          <strong>Value field:</strong>{" "}
          {valueField ?? "(drop a numeric field here)"}
          <div
            onDragOver={onDragOver}
            onDrop={onDropValueField}
            style={{
              marginTop: 4,
              border: "2px dashed #888",
              minWidth: 180,
              minHeight: 40,
              padding: 8,
            }}
          >
            Drop field here for values
          </div>

          <div style={{ marginTop: 8 }}>
            <label>
              Aggregation:&nbsp;
              <select
                value={aggType}
                onChange={(e) => setAggType(e.target.value as AggType)}
              >
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      
      {fullPivot && (
        <div
          style={{
            marginTop: 16,
            marginBottom: 8,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <button
            onClick={handlePrevPage}
            disabled={currentPageDisplay === 1}
          >
            Prev
          </button>
          <span>
            Page {currentPageDisplay} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPageDisplay === totalPages}
          >
            Next
          </button>

          <span style={{ marginLeft: 16 }}>
            Rows per page:{" "}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1); // reset page when page size changes
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </span>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3>
          Pivot Result{" "}
          {valueField && `(${aggType.toUpperCase()} of ${valueField})`}
        </h3>
        <PivotTable
          pivot={pagedPivot}
          rowField={rowField}
          columnField={columnField}
        />
      </div>
    </div>
  );
};

