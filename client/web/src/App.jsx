import React from 'react';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home';
import useGetCurrentUser from './hooks/useGetCurrentUser';
import { useSelector } from 'react-redux';
import Dashboard from './pages/Dashboard';
import Generate from './pages/Generate';
import Editor from './pages/Editor';
import Pricing from './pages/Pricing';
import LiveSite from './pages/LiveSite';

export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";


function App(){

  useGetCurrentUser()
  //dashbard and generate page should only be accessible if user is logged in. we can check that using userData from redux store
  const {userData} = useSelector(state=>state.user)
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        {/* //this means if user tries to access dashboard or generate page without being logged in, they will be redirected to home page */}
        {/* //we dont use navgate to - because when we reload on the dashboard page we want it to stay on the dashboard only if the user is logged in  */}

        
        <Route path="/dashboard" element={userData ? <Dashboard /> : <Home/> } />
        <Route path="/generate" element={userData ? <Generate /> : <Home/> } />
        <Route path="/editor/:id" element={userData ? <Editor /> : <Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/site/:id" element={<LiveSite />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App;