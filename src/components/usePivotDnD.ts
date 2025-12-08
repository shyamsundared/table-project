// src/hooks/usePivotDnD.ts
import { useData } from "../store/Store";

export const usePivotDnD = () => {
  const { setrowField, setcolumnField ,setvalueField} = useData();

  const onDragStartField = (field: string) =>
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("text/plain", field);
    };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDropRowField = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fieldval = e.dataTransfer.getData("text/plain");
    if (fieldval) setrowField(fieldval);
  };

  const onDropColField = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fieldval = e.dataTransfer.getData("text/plain");
    if (fieldval) setcolumnField(fieldval);
  };
  const onDropValueField = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fieldval = e.dataTransfer.getData("text/plain");
    if (fieldval) setvalueField(fieldval);
  };


  return {
    onDragStartField,
    onDragOver,
    onDropRowField,
    onDropColField,
    onDropValueField
  };
};
