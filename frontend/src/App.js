import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import contexts
import { LocationProvider } from './contexts/LocationContext';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Import components
import SimpleAdminGuard from './components/SimpleAdminGuard/SimpleAdminGuard';

// Import pages
import HomePage from './pages/HomePage/HomePage';
import AuctionHistoryPage from './pages/AuctionHistoryPage/AuctionHistoryPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage/TransactionHistoryPage';
import SearchResult from './pages/SearchResult/SearchResult';
import LoginPage from './pages/LoginPage/LoginPage';
import SignUpPage from './pages/SignupPage/SignUpPage';
import RoomDetailPage from './pages/RoomDetailPage/RoomDetailPage';
import VerificationSuccessPage from './pages/VerificationSuccessPage/VerificationSuccessPage';
import AdminLayout from './layouts/AdminLayout';
import UsersManagementPage from './pages/UsersManagementPage/UsersManagementPage';
import UsersManagementDetailPage from './pages/UsersManagementDetailPage/UsersManagementDetailPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminProductsManagementPage from './pages/AdminProductsManagementPage/AdminProductsManagementPage';
import AdminAddProductPage from './pages/AdminAddProductPage/AdminAddProductPage';
import AdminViewProductPage from './pages/AdminViewProductPage/AdminViewProductPage';
import AdminEditProductPage from './pages/AdminEditProductPage/AdminEditProductPage';
import AdminAuctionsManagementPage from './pages/AdminAuctionsManagementPage/AdminAuctionsManagementPage';
import SystemConfigPage from './pages/SystemConfigPage/SystemConfigPage';
import DataScrapingPage from './pages/DataScrapingPage/DataScrapingPage';
import AuctionPage from './pages/AuctionPage/AuctionPage';
import AuctionCheckPage from './pages/AuctionCheckPage/AuctionCheckPage'
import UserProfilePage from './pages/UserProfilePage/UserProfilePage';
import FavoritePage from './pages/FavoritePage/FavoritePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import CheckoutReturnPage from './pages/CheckoutPage/CheckoutReturnPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import FailedCheckoutPage from './pages/CheckoutPage/FailedCheckoutPage';
import SuccessfulCheckoutPage from './pages/CheckoutPage/SuccessfulCheckoutPage';
import NotificationPage from './pages/NotificationPage/NotificationPage';

function App() {
  return (
    <UserProvider>
      <LocationProvider>
        <NotificationProvider>
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
              <Route path="/notifications" element={<NotificationPage />} />
              <Route path="/checkout/success" element={<SuccessfulCheckoutPage />} />
              <Route path="/checkout/failed" element={<FailedCheckoutPage />} />
              <Route path="/checkout/booking/:bookingId" element={<CheckoutPage />} />
              <Route path="/checkout/paypal/return" element={<CheckoutReturnPage />} />
              <Route path="/checkout/zalopay/return" element={<CheckoutReturnPage />} />
              <Route path="/checkout/vnpay/return" element={<CheckoutReturnPage />} />            
              <Route path="/auction-history" element={<AuctionHistoryPage />} />
              <Route path="/transaction-history" element={<TransactionHistoryPage />} />
              <Route path="/auction/:UID" element={<AuctionPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/admin" element={
                <SimpleAdminGuard>
                  <AdminLayout />
                </SimpleAdminGuard>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users-management" element={<UsersManagementPage />} />
                <Route path="users-management/:id" element={<UsersManagementDetailPage />} />
                <Route path="products-management" element={<AdminProductsManagementPage />} />
                <Route path="products-management/add" element={<AdminAddProductPage />} />
                <Route path="products-management/edit/:id" element={<AdminEditProductPage />} />
                <Route path="products-management/view/:id" element={<AdminViewProductPage />} />
                <Route path="auctions-management" element={<AdminAuctionsManagementPage />} />
                <Route path="system-config" element={<SystemConfigPage />} />
                <Route path="data-scraping" element={<DataScrapingPage />} />
                {/* <Route path="edit-product/:id" element={<AdminEditProductPage />} /> */}
                {/* <Route path="bookings-management" element={<BookingsManagementPage />} /> */}
              </Route>
            </Routes>
          </div>
        </Router>
        </NotificationProvider>
      </LocationProvider>
    </UserProvider>
  );
}

export default App;