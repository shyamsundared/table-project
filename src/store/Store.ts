import { create } from "zustand";
import type { AggType, Row } from "../types/Type";
import type { storetype } from "../types/Type";
export const useData =create<storetype>((set)=>({
    rows:[],
    columns:[],
    rowField:[],
    columnField:[],
    aggType:"count",
    valueField:null,
    setrows: (rows:Row[])=>set({rows}),
    setcolumns:(columns:string[])=>set({columns}),
    setrowField:(Field:string)=>set((state)=>state.rowField.includes(Field)?state :{rowField: [...state.rowField,Field]}),
    setcolumnField:(Field:string)=>set((state)=>state.columnField.includes(Field)?state:{columnField:[...state.columnField,Field]}),
    ClearrowField:()=>set({rowField:[]}),
    ClearcolumnField:()=>set({columnField:[]}),
    setvalueField :(field:string |null)=>set({valueField: field}),
    setAggType:(agg:AggType)=>set({aggType:agg})
}))