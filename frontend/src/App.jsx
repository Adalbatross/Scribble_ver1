import React from 'react'
import Board from './pages/Board'
import {BrowserRouter, Routes, Route } from "react-router-dom"
import Home from './pages/Homepage'



const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/board/:id" element={<Board />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App