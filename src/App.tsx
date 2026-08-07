import { Routes, Route } from 'react-router-dom';
import HotelSearch from './pages/HotelSearch';
import BookingRecords from './pages/BookingRecords';
import OrderTracking from './pages/OrderTracking';
import ToastContainer from './components/ToastContainer';

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<HotelSearch />} />
        <Route path="/bookings" element={<BookingRecords />} />
        <Route path="/tracking" element={<OrderTracking />} />
      </Routes>
    </>
  );
}
