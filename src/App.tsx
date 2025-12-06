
import './App.css'
import { ParseFilehandler } from './components/Parsing'
import { useData } from './store/Store'
function App() {
  const {columns,rows}=useData()
  
  
  return (
    <><div className='p-3 flex flex-col font-serif'>
      <p>pivot table </p>
        
        
    </div>
      <input type="file" accept='.csv' onChange={ParseFilehandler}/>
    {columns.length===0 && rows.length===0 && (
      <p className='bg-slate-100 mt-4'>
        upload a csv file
      </p>
    )}

    {columns.length>0 && (<div className=''>
      field list 
    </div>)}
    </>
    
  )
}


export default App
