import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import NewRecord from './pages/NewRecord';
import RecordDetail from './pages/RecordDetail';
import Shifts from './pages/Shifts';
import ShiftSwaps from './pages/ShiftSwaps';
import Timeline from './pages/Timeline';
import AdminUsers from './pages/AdminUsers';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/records" element={
            <ProtectedRoute roles={['farmaceutico', 'chefe', 'admin']}>
              <Records />
            </ProtectedRoute>
          } />
          
          <Route path="/records/new" element={
            <ProtectedRoute roles={['farmaceutico', 'chefe', 'admin']}>
              <NewRecord />
            </ProtectedRoute>
          } />
          
          <Route path="/records/:id" element={
            <ProtectedRoute roles={['farmaceutico', 'chefe', 'admin']}>
              <RecordDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/shifts" element={
            <ProtectedRoute roles={['chefe', 'admin']}>
              <Shifts />
            </ProtectedRoute>
          } />
          
          <Route path="/swaps" element={
            <ProtectedRoute>
              <ShiftSwaps />
            </ProtectedRoute>
          } />
          
          <Route path="/timeline" element={
            <ProtectedRoute roles={['chefe', 'admin']}>
              <Timeline />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
