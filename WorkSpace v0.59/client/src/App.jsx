import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from './components/Navbar/Navbar';
import { AuthProvider, useAuth } from './components/Authentication/AuthContext';
import ProtectedRoute from './components/Authentication/ProtectedRoute';
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Documents from "./pages/Documents/Documents.jsx";
import TextEditor from "./pages/Documents/TextEditor.jsx";
import Mail from "./pages/Mail/Mail.jsx";
import Drive from "./pages/Drive/Drive.jsx";
import NoPages from "./pages/NoPages/NoPages.jsx";
import Tasks from "./pages/Tasks/Tasks.jsx";
import Signup from './components/Authentication/Signup';
import Login from './components/Authentication/Login';
import Profile from "./components/Profile/Profile.jsx";


const App = () => {
  return (
    <AuthProvider>
      <Main />
    </AuthProvider>
  );
};

const Main = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/Dashboard" /> : <Signup />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/Dashboard" /> : <Login />
          }
        />
        <Route
          path="Dashboard"
          element={
            <ProtectedRoute>
              <div>
                <Navbar />
                <Dashboard />
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="/mail/:id" element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <Mail />
            </div>
          </ProtectedRoute>
        } />
        <Route path="Documents/*" element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <Documents />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/documents/:id" element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <TextEditor />
            </div>
          </ProtectedRoute>
        } />
        <Route path="Mail" element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <Mail />
            </div>
          </ProtectedRoute>
        } />
        <Route path="Tasks" element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <Tasks />
            </div>
          </ProtectedRoute>
        } />
        <Route path="Files" element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <Drive />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <div>
              <Navbar />
              <Profile />
            </div>
          </ProtectedRoute>
        } />
        <Route path="/" element={isAuthenticated ? <Navigate to="/Dashboard" /> : <Navigate to="/login" />} />
        <Route path="*" element={<NoPages />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
