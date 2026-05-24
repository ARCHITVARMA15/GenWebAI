import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../config'

function Editor(){
    const {id} = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [website, setWebsite] = useState(null)

    useEffect(()=>{
        const handleGetWebsite = async()=>{
            try{
               
                
                const result = await axios.get(`${serverUrl}/api/website/get-by-id/${id}`,{withCredentials:true})
                setWebsite(result.data)
            }catch(error){
                console.log(error)
                setError(error.response.data.message)
                
            } finally {
                setLoading(false)
            }
        }
        handleGetWebsite()
    },[id])

  if (error) {
        return (
            <div className='h-screen flex items-center justify-center bg-black text-red-400'>
                {error}
            </div>
        )
    }

      if (!website) {
        return (
            <div className='h-screen flex items-center justify-center bg-black text-white'>
                Loading...
            </div>
        )
    }

    return(
        <div className='h-screen w-screen flex bg-black text-white overflow-hidden'>
            <aside className='hidden lg:flex w-95 flex-col border-r border-white/10 bg-black/80'>
                <Header/>
                <Chat/>

                
            </aside>

        </div>
    )

    function Header(){
    return(
        <div className='h-14 px-4 flex items-center justify-between border-b border-white/10'>

        </div>
    )
}


function Chat(){

}
}


export default Editor