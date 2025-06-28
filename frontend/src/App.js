import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

import Login from './pages/user/Login';
import Register from './pages/user/Register';
import ForgotPassword from './pages/user/ForgetPassword';
import Home from './pages/user/Home';
import About from './pages/user/About';
import Contact from './pages/user/Contact';
import ChangePassword from './pages/user/ChangePassword';
import PaymentSuccess from './pages/user/PaymentSuccess';
import Products from './pages/user/Products';
import AddCart from './pages/user/AddCart';
import Orders from './pages/user/Orders';
import Coaching from './pages/user/Coaching';
import Checkout from './pages/user/Checkout';
import Dashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import Settings from './pages/admin/Settings';
import ManageCategories from './pages/admin/ManageCategories';
import ManageBooks from './pages/admin/ManageBooks';
import ManageOrders from './pages/admin/ManageOrders';
import BookDetails from './pages/user/BookDetails';
import ManageMessages from './pages/admin/ManageMessages';
import UploadAnalysis from './pages/user/UploadAnalysis';

import VideoAnalysis from './pages/user/VideoAnalysis';
import AudioAnalysis from './pages/user/AudioAnalysis';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/settings" element={<ChangePassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/products" element={<Products />} />
          <Route path="/book/:book_id" element={<BookDetails />} />
          <Route path="/coaching" element={<Coaching />} />
          <Route path="/coaching/upload" element={<UploadAnalysis />} />
          <Route path="/coaching/audio" element={<AudioAnalysis />} />
          <Route path="/coaching/video" element={<VideoAnalysis />} />
          <Route path="/add-cart" element={<AddCart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/manage-orders" element={<ManageOrders />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/manage-categories" element={<ManageCategories />} />
          <Route path="/admin/manage-books" element={<ManageBooks />} />      
          <Route path="/admin/manage-messages" element={<ManageMessages />} />    
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;