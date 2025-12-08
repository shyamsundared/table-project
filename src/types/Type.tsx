export type Row=Record<string,string>;
export interface PivotResult{
    rowArray:string[];
    colArray:string[];
    matrix:number[][];

}
export type storetype ={
    rows:Row[]
    columns:string[]
    rowField:string[]
    columnField:string[]
    setrows :(rows:Row[])=>void
    setcolumns :(columns:string[])=>void
    valueField:string |null
    aggType:AggType
    setrowField:(rowField:string)=>void
    setcolumnField:(columnField:string)=>void
    ClearrowField:()=>void
    ClearcolumnField:()=>void
    setvalueField:(field:string)=>void
    setAggType:(agg:AggType)=>void

}
export type AggType=  "count"| "min"|"max"|"sum"|"avg"
export type cellAgg= {
    min:number,
    max:number,
    count:number,
    sum:number,
    avg:number
}