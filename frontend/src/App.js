import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import AuthenticatedHome from './pages/AuthenticatedHome';
import EntrepreneurList from './pages/customer/EntrepreneurList';
import EntrepreneurDetail from './pages/customer/EntrepreneurDetail';
import ProductDetail from './pages/customer/ProductDetail';
import MyOrders from './pages/customer/MyOrders';
import EntrepreneurDashboard from './pages/entrepreneur/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import ForgotPassword from './pages/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';

function AppShell() {
  const location = useLocation();
  const isPublicHome = location.pathname === '/';
  return (
    <div className={isPublicHome ? 'App app-home' : 'App'}>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        {/* Default entry: always show the landing page on fresh load. */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <AuthenticatedHome />
            </PrivateRoute>
          }
        />
        <Route path="/entrepreneurs" element={<EntrepreneurList />} />
        <Route path="/entrepreneurs/:id" element={<EntrepreneurDetail />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        <Route
          path="/orders/my"
          element={
            <PrivateRoute>
              <MyOrders />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />

        <Route
          path="/entrepreneur/*"
          element={
            <PrivateRoute allowedRoles={['ENTREPRENEUR', 'ADMIN']}>
              <EntrepreneurDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppShell />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
