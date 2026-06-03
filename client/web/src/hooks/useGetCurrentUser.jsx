import { useEffect, useRef } from 'react'
import axios from 'axios'
import { serverUrl } from '../config'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

function useGetCurrentUser() {
    const dispatch = useDispatch()
    const hasFetched = useRef(false)

    useEffect(()=>{
        if (hasFetched.current) return
        hasFetched.current = true

        const getCurrentUser = async()=>{
            try{
                const result = await axios.get(`${serverUrl}/api/user/me`,{withCredentials:true})
                const normalizedUser = result.data?.user ?? result.data ?? null
                dispatch(setUserData(normalizedUser))

            }catch(error){
                if (axios.isAxiosError(error)) {
                    const status = error.response?.status

                    if (status === 400 || status === 401) {
                        dispatch(setUserData(null))
                        return
                    }

                    if (status === 404) {
                        console.error('Current user endpoint not found. Restart backend and verify /api/user/me route.')
                        return
                    }
                }

                console.error(error)
            }
        }
        getCurrentUser()
    },[dispatch])
}

export default useGetCurrentUser