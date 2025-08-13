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
import AdminLayout from './layouts/AdminLayout';
import UsersManagementPage from './pages/UsersManagementPage';
import UsersManagementDetailPage from './pages/UsersManagementDetailPage';
import AuctionPage from './pages/AuctionPage';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/room" element={<RoomDetailPage />} />
          <Route path="/verification-success" element={<VerificationSuccessPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="users-management" element={<UsersManagementPage />} />
            <Route path="users-management/:id" element={<UsersManagementDetailPage />} />
            {/* <Route path="products-management" element={<ProductsManagementPage />} /> */}
            {/* <Route path="bookings-management" element={<BookingsManagementPage />} /> */}
          </Route>
          <Route path="/auction" element={<AuctionPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;