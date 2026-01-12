//import { useState } from 'react'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import React from 'react';
import {Routes,Route} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
//import ProjectDetails from './pages/ProjetDetails'

import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectDetails from './pages/ProjectDetails';
import TaskDetails from './pages/TaskDetails';

function App() {
 // const [count, setCount] = useState(0)

  return (
     
     <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />} />
      <Route path="/projects/:projectId" element={<ProtectedRoute component={ProjectDetails} />} />
      <Route path="/tasks/:taskId" element={<ProtectedRoute component={TaskDetails} />} />
      </Routes>
      </>
  );
}

export default App;
