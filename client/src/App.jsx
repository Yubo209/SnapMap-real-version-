import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './utils/PrivateRoute';
import Dashboard from './pages/Dashboard';
import MyProfile from './pages/MyProfile';
import Home from './pages/Home';

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}