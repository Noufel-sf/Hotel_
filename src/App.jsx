import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HotelSearch from './pages/HotelSearch.jsx';
import BookingRecords from './pages/BookingRecords.jsx';
import OrderTracking from './pages/OrderTracking.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HotelSearch />} />
      <Route path="/bookings" element={<BookingRecords />} />
      <Route path="/tracking" element={<OrderTracking />} />
    </Routes>
  );
}
