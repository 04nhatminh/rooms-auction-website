import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Import pages
import HomePage from './pages/HomePage';
import RoomDetailPage from './pages/RoomDetailPage';
import AuctionCheckPage from './pages/AuctionCheckPage'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* <Route path="/" element={<HomePage />} /> */}
          <Route path="/room/:UID" element={<RoomDetailPage />} />
          <Route path="/auction-check/:UID" element={<AuctionCheckPage/>} />
        </Routes>
      </div>
    </Router>
    
  );
}

export default App;