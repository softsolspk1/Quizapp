import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Categories from './components/Categories';
import Questions from './components/Questions';
import Pins from './components/Pins';
import Analytics from './components/Analytics';
import Banners from './components/Banners';
import Broadcast from './components/Broadcast';
import Layout from './components/Layout';


function AdminOnlyRoute({ children, feature }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'admin') {
    return children;
  }
  
  if (user.role === 'subadmin') {
    if (feature && user.permissions?.includes(feature)) {
      return children;
    }
    
    // Redirect to the first available feature if they don't have access to this one
    if (user.permissions && user.permissions.length > 0) {
      const fallback = user.permissions[0];
      return <Navigate to={`/${fallback === 'dashboard' ? '' : fallback.toLowerCase()}`} />;
    }
    
    return <Navigate to="/login" />;
  }
  
  return <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <AdminOnlyRoute feature="dashboard">
                <Layout>
                  <Dashboard />
                </Layout>
              </AdminOnlyRoute>
            } />
            <Route path="/users" element={
              <AdminOnlyRoute feature="users">
                <Layout>
                  <Users />
                </Layout>
              </AdminOnlyRoute>
            } />
            <Route path="/categories" element={
              <AdminOnlyRoute feature="categories">
                <Layout>
                  <Categories />
                </Layout>
              </AdminOnlyRoute>
            } />
            <Route path="/questions" element={
              <AdminOnlyRoute feature="questions">
                <Layout>
                  <Questions />
                </Layout>
              </AdminOnlyRoute>
            } />
            <Route path="/pins" element={
              <AdminOnlyRoute feature="pins">
                <Layout>
                  <Pins />
                </Layout>
              </AdminOnlyRoute>
            } />
            <Route path="/analytics" element={
              <AdminOnlyRoute feature="analytics">
                <Layout>
                  <Analytics />
                </Layout>
              </AdminOnlyRoute>
            } />
            <Route path="/banners" element={
              <AdminOnlyRoute feature="banners">
                <Layout>
                  <Banners />
                </Layout>
              </AdminOnlyRoute>
            } />
            <Route path="/broadcast" element={
              <AdminOnlyRoute feature="broadcast">
                <Layout>
                  <Broadcast />
                </Layout>
              </AdminOnlyRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


