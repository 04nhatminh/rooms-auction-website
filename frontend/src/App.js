import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import contexts
import { LocationProvider } from './contexts/LocationContext';

// Import pages
import HomePage from './pages/HomePage';
import SearchResult from './pages/SearchResult';
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
    <LocationProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/room" element={<RoomDetailPage />} />
            <Route path="/room/:roomId" element={<RoomDetailPage />} />
            <Route path="/verification-success" element={<VerificationSuccessPage />} />
            <Route path="/search" element={<SearchResult />} />
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
    </LocationProvider>
  );
}

export default App;