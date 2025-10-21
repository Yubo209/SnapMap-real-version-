import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ViewportScaler from './components/ViewportScaler';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './utils/PrivateRoute';
import Dashboard from './pages/Dashboard';
import MyProfile from './pages/MyProfile';
import Home from './pages/Home';

export default function App() {
  return (
    <ViewportScaler
      designWidth={1024}   
      designHeight={680}   
      minScale={0.72}      
      maxScale={1}         
      mobileOnly={true}    
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<MyProfile />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </ViewportScaler>
  );
}


