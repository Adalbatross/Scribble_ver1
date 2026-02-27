import React from 'react'
import Board from './Board'
import {BrowserRouter, Routes, Route } from "react-router-dom"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/board/:id" element={<Board />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App