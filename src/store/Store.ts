import { create } from "zustand";
import type { Row } from "../types/Type";
import type { storetype } from "../types/Type";
export const useData =create<storetype>((set)=>({
    rows:[],
    columns:[],
    rowField:"",
    columnField:"",
    setrows: (rows:Row[])=>set({rows}),
    setcolumns:(columns:string[])=>set({columns}),
    setrowField:(rowField:string)=>set({rowField}),
    setcolumnField:(columnField:String)=>set({columnField})
}))