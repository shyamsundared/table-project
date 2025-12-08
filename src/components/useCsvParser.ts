// src/hooks/useCsvParser.ts
import Papa from "papaparse";
import type { Row } from "../types/Type";
import { useData } from "../store/Store";

export const useCsvParser = () => {
  const { setrows, setcolumns } = useData();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      },
      error: (err) => {
        console.log("cannot parse csv", err);
      },
    });
  };

  return { handleFileChange };
};
