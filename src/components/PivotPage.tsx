// src/components/PivotPage.tsx
import React, { useMemo, useState, useEffect } from "react";
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
    valueFields,
    aggType,
    setAggType,
    ClearrowField,
    ClearcolumnField,
    removeRowField,
    removeColumnField,
    removeValueField,
    clearValueFields,
  } = useData();

  const { handleFileChange, isLoading, error } = useCsvParser();
  const {
    onDragStartField,
    onDragOver,
    onDropRowField,
    onDropColField,
    onDropValueField,
  } = usePivotDnD();

  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [fieldSearch, setFieldSearch] = useState<string>("");

  // Use valueFields array consistently
  const valueFieldsArg: string[] | null = valueFields.length > 0 ? valueFields : null;

  // Build full pivot (memoized)
  const fullPivot = useMemo(
    () =>
      rows.length && rowField.length && columnField.length
        ? buildPivot(rows, rowField, columnField, valueFieldsArg, aggType)
        : null,
    [rows, rowField, columnField, valueFieldsArg, aggType]
  );

  // Reset to page 1 whenever pivot or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [fullPivot, pageSize]);

  // Pagination: create pagedPivot (slice of fullPivot)
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

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () =>
    setCurrentPage((p) => (fullPivot ? Math.min(totalPages, p + 1) : p));
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);

  // Filtered columns for the right-side list (search)
  const filteredColumns = useMemo(() => {
    const q = fieldSearch.trim().toLowerCase();
    if (!q) return columns;
    return columns.filter((c) => c.toLowerCase().includes(q));
  }, [columns, fieldSearch]);

  const pageStart = (currentPageDisplay - 1) * pageSize;

  // Export to CSV
  const exportToCSV = () => {
    if (!fullPivot) return;

    const headers = ["", ...fullPivot.colArray];
    const dataRows = fullPivot.rowArray.map((row, i) => {
      const rowData = [row];
      fullPivot.colArray.forEach((_, colIdx) => {
        const cellValues = fullPivot.matrix[i][colIdx];
        const value = Array.isArray(cellValues) ? cellValues[0] : 0;
        rowData.push(String(value ?? ""));
      });
      return rowData;
    });

    const csv = [headers, ...dataRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pivot-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const startRow = fullPivot ? pageStart + 1 : 0;
  const endRow = fullPivot ? Math.min(pageStart + pageSize, fullPivot.rowArray.length) : 0;
  const totalRows = fullPivot?.rowArray.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Pivot Matrix</h2>
        {fullPivot && (
          <button
            onClick={exportToCSV}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
          >
            Export to CSV
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-10">
        {/* LEFT: Table */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-x-auto">
            {!rows.length ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No data loaded</p>
                <p className="text-sm mt-2">Upload a CSV file to get started</p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold mb-2">
                  Pivot Result
                  {valueFields.length > 0 &&
                    ` (${aggType.toUpperCase()} of ${valueFields.join(", ")})`}
                </h3>

                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading...</p>
                  </div>
                ) : (
                  <PivotTable
                    pivot={pagedPivot}
                    fullPivot={fullPivot}
                    rowField={rowField}
                    columnField={columnField}
                    valueFields={valueFields}
                    pageStart={pageStart}
                    aggType={aggType}
                  />
                )}
              </>
            )}
          </div>

          {/* Enhanced Pagination Controls - Below Table */}
          {fullPivot && totalRows > 0 && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Left: Row info */}
                <div className="text-sm text-gray-700 font-medium">
                  Showing {startRow} to {endRow} of {totalRows} rows
                </div>

                {/* Center: Navigation buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFirstPage}
                    disabled={currentPageDisplay === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                    title="First page"
                  >
                    «
                  </button>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPageDisplay === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                    title="Previous page"
                  >
                    ‹ Prev
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-700 font-medium">
                    Page {currentPageDisplay} of {totalPages}
                  </span>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageDisplay === totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                    title="Next page"
                  >
                    Next ›
                  </button>
                  <button
                    onClick={handleLastPage}
                    disabled={currentPageDisplay === totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                    title="Last page"
                  >
                    »
                  </button>
                </div>

                {/* Right: Page size selector */}
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-gray-700 font-medium">
                    Rows per page:
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-3 py-2 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={totalRows}>All ({totalRows})</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Drag / Controls */}
        <div className="w-80 flex-none sticky top-4 self-start mt-6 overflow-y-auto max-h-screen">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Fields</h3>

            <input
              type="text"
              placeholder="Search fields..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className="w-full px-3 py-1 border border-gray-300 text-xs rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-wrap gap-2 mt-3">
              {filteredColumns.length ? (
                filteredColumns.map((col) => (
                  <div
                    key={col}
                    draggable
                    onDragStart={onDragStartField(col)}
                    className="px-3 py-1 border border-gray-300 text-xs rounded cursor-grab bg-gray-50 hover:bg-gray-200 transition"
                  >
                    {col}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">
                  No fields match "{fieldSearch}"
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <div
                onDragOver={onDragOver}
                onDrop={onDropRowField}
                className="mt-1 p-2 text-xs border-2 border-dashed border-gray-400 min-h-20 rounded bg-gray-50"
              >
                <div className="text-sm font-medium mb-2">Row fields:</div>
                <div className="flex flex-wrap gap-2">
                  {rowField.length ? (
                    rowField.map((x) => (
                      <div
                        key={x}
                        className="px-2 py-1 border border-gray-300 text-xs rounded bg-gray-200 flex items-center gap-1"
                      >
                        {x}
                        <button
                          onClick={() => removeRowField(x)}
                          className="text-red-600 hover:text-red-800 ml-1 font-bold"
                          title="Remove field"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">(drop here)</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div
                onDragOver={onDragOver}
                onDrop={onDropColField}
                className="mt-1 p-2 text-xs border-2 border-dashed border-gray-400 min-h-20 rounded bg-gray-50"
              >
                <div className="text-sm font-medium mb-2">Column fields:</div>
                <div className="flex flex-wrap gap-2">
                  {columnField.length ? (
                    columnField.map((x) => (
                      <div
                        key={x}
                        className="px-2 py-1 border border-gray-300 text-xs rounded bg-gray-200 flex items-center gap-1"
                      >
                        {x}
                        <button
                          onClick={() => removeColumnField(x)}
                          className="text-red-600 hover:text-red-800 ml-1 font-bold"
                          title="Remove field"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">(drop here)</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="text-sm font-medium mb-1">Value fields:</div>
            <div
              onDragOver={onDragOver}
              onDrop={onDropValueField}
              className="mt-1 p-2 text-xs border-2 border-dashed border-gray-400 min-h-16 rounded bg-gray-50"
            >
              <div className="flex flex-wrap gap-2">
                {valueFields.length ? (
                  valueFields.map((vf, idx) => (
                    <div
                      key={`vf-${idx}`}
                      className="px-2 py-1 border border-gray-300 text-xs rounded bg-gray-200 flex items-center gap-1"
                    >
                      {vf}
                      <button
                        onClick={() => removeValueField(vf)}
                        className="text-red-600 hover:text-red-800 ml-1 font-bold"
                        title="Remove field"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">(drop here)</div>
                )}
              </div>
            </div>

            <label className="text-xs block mt-2">
              Aggregation:
              <select
                value={aggType}
                onChange={(e) => setAggType(e.target.value as AggType)}
                className="w-full border rounded px-2 py-1 text-xs mt-1"
              >
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 text-xs mb-3">
            <button
              className="bg-gray-200 border px-2 py-1 rounded hover:bg-gray-300"
              onClick={ClearrowField}
            >
              Clear rows
            </button>
            <button
              className="bg-gray-200 border px-2 py-1 rounded hover:bg-gray-300"
              onClick={ClearcolumnField}
            >
              Clear columns
            </button>
            <button
              className="bg-gray-200 border px-2 py-1 rounded hover:bg-gray-300"
              onClick={clearValueFields}
            >
              Clear values
            </button>
          </div>

          <div className="border-t pt-3">
            <label className="text-sm font-medium block mb-2">Upload CSV:</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading}
              className="text-xs bg-gray-200 hover:bg-gray-300 border px-4 py-2 rounded w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PivotPage;