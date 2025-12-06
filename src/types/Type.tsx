export type Row=Record<string,string>;
export interface PivotResult{
    rowValues:string[];
    colValues:string[];
    matrix:number[][];

}
export type storetype ={
    rows:Row[]
    columns:string[]
    rowField:string
    columnField:string
    setrows :(rows:Row[])=>void
    setcolumns :(columns:string[])=>void
    
    setrowField:(rowField:string)=>void
    setcolumnField:(columnField:string)=>void


}