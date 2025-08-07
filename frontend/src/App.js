import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import Home from './pages/Home';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import RoomDetailPage from './pages/RoomDetailPage';
import VerificationSuccessPage from './pages/VerificationSuccessPage';
import UsersManagementPage from './pages/UsersManagementPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/room" element={<RoomDetailPage />} />
          <Route path="/verification-success" element={<VerificationSuccessPage />} />
          <Route path="/admin/users-management" element={<UsersManagementPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;