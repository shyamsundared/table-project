// src/hooks/useCsvParser.ts
import { useState } from "react";
import Papa from "papaparse";
import type { Row } from "../types/Type";
import { useData } from "../store/Store";

export const useCsvParser = () => {
  const { setrows, setcolumns } = useData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const data = result.data;
        setrows(data);
        if (data.length > 0) {
          setcolumns(Object.keys(data[0]));
        } else {
          setcolumns([]);
        }
        setIsLoading(false);
      },
      error: (err) => {
        console.error("Cannot parse CSV:", err);
        setError("Failed to parse CSV file. Please check the file format.");
        setIsLoading(false);
      },
    });
  };

  return { handleFileChange, isLoading, error };
};

