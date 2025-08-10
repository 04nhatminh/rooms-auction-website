import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import HomePage from './pages/HomePage';
import RoomDetailPage from './pages/RoomDetailPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* <Route path="/" element={<HomePage />} /> */}
          <Route path="/room/:id" element={<RoomDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;