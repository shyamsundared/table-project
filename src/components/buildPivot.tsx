import type { Row } from "../types/Type";
import type{ PivotResult } from "../types/Type";
const buildPivot=(data:Row[],
    rowField:string,
    colField:string):PivotResult |null=>{
        if(!rowField ||!colField || data.length===0){
            return null;
        }
        const colSet= new Set<string>;
        const rowSet=new Set<string>;
        
        data.forEach((row)=>{
            rowSet.add(row[rowField])
            colSet.add(row[colField])
        }
        )
        const colArray =Array.from(colSet)
        const rowArray=Array.from(rowSet)
        const matrix:number[][]=rowArray.map(()=>colArray.map(()=>0))
        data.forEach((row)=>{
        const r=rowArray.indexOf(row[rowField])
        const c=colArray.indexOf(row[colField])
        if (r!==-1 && c!==-1){
            matrix[r][c]+=1
        }
        }
        
    )
    return {colArray,rowArray,matrix}

    }
