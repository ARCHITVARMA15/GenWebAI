import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState:{
        userData:null
 },
//reducers are functions that take the current state and an action as arguments, and return a new state based on the action type and payload. They are used to update the state in response to actions dispatched by components or other parts of the application.
//payload is the data that is sent along with an action when it is dispatched. It can be any type of data, such as a string, number, object, or array, and is used to provide additional information to the reducer about how to update the state. 
reducers:{
        setUserData:(state, action)=>{
            state.userData = action.payload
        }
 }

    
})

export const {setUserData} = userSlice.actions
export default userSlice.reducer



