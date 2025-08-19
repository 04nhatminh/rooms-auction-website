import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import contexts
import { LocationProvider } from './contexts/LocationContext';
import { UserProvider } from './contexts/UserContext';

// Import pages
import HomePage from './pages/HomePage/HomePage';
import SearchResult from './pages/SearchResult/SearchResult';
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from './pages/SignupPage/SignUpPage';
import RoomDetailPage from './pages/RoomDetailPage/RoomDetailPage';
import VerificationSuccessPage from './pages/VerificationSuccessPage/VerificationSuccessPage';
import AdminLayout from './layouts/AdminLayout';
import UsersManagementPage from './pages/UsersManagementPage/UsersManagementPage';
import UsersManagementDetailPage from './pages/UsersManagementDetailPage/UsersManagementDetailPage';
import AdminProductsManagementPage from './pages/AdminProductsManagementPage/AdminProductsManagementPage';
import AdminAddProductPage from './pages/AdminAddProductPage/AdminAddProductPage';
import AuctionPage from './pages/AuctionPage/AuctionPage';
import AuctionCheckPage from './pages/AuctionCheckPage/AuctionCheckPage'
import UserProfilePage from './pages/UserProfilePage/UserProfilePage';
import FavoritePage from './pages/FavoritePage/FavoritePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

function App() {
  return (
    <UserProvider>
      <LocationProvider>
        <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/room/:UID" element={<RoomDetailPage />} />
            <Route path="/auction-check/:UID" element={<AuctionCheckPage />} />
            <Route path="/verification-success" element={<VerificationSuccessPage />} />
            <Route path="/search" element={<SearchResult />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/favorite" element={<FavoritePage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="users-management" element={<UsersManagementPage />} />
              <Route path="users-management/:id" element={<UsersManagementDetailPage />} />
              <Route path="products-management" element={<AdminProductsManagementPage />} />
              <Route path="add-product" element={<AdminAddProductPage />} />
              {/* <Route path="edit-product/:id" element={<AdminEditProductPage />} /> */}
              {/* <Route path="bookings-management" element={<BookingsManagementPage />} /> */}
            </Route>
            <Route path="/auction/:UID" element={<AuctionPage />} />
          </Routes>
        </div>
      </Router>
    </LocationProvider>
  </UserProvider>
  );
}

export default App;