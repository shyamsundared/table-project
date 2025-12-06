import { useData } from "../store/Store";
import Papa from 'papaparse'
import type { Row } from "../types/Type";
export const ParseFilehandler =(e:React.ChangeEvent<HTMLInputElement>)=>{
        const {
            setrows,
            setcolumns,
           
  } = useData();
        const files=e.target.files?.[0]
        if (!files){
            return
        }
        Papa.parse<Row>(files,{
            header:true,
            skipEmptyLines:true,
            complete:(result)=>{
                const data =result.data;
                setrows(data)
                if (data.length>0){
                    setcolumns(Object.keys(data[0]))
                }
                else{
                    setcolumns([])
                }

            },
            error:(err)=>{
                console.log("cannot parse csv",err)
            }
           
        })

    }