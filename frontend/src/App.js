import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';

import ArticleList from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';
import ArticleForm from './pages/ArticleForm';
import MyArticles from './pages/MyArticles';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Composant de restriction Vendeur/Admin
function VendeurRoute({ children }) {
  const { utilisateur, chargement } = useAuth();

  if (chargement) return null;

  const estVendeurOuAdmin = utilisateur && (
    utilisateur.is_staff || 
    utilisateur.is_vendeur || 
    utilisateur.role === 'vendeur' ||
    (utilisateur.username && utilisateur.username.toLowerCase().includes('vendeur')) ||
    utilisateur.username === 'admin'
  );

  return estVendeurOuAdmin ? children : <Navigate to="/" replace />;
}

// Composant interne pour gérer l'affichage conditionnel du Sidebar
function MainLayout() {
  const location = useLocation();

  // Masquer le Sidebar sur les pages connexion et inscription
  const masquerSidebar = ['/connexion', '/inscription'].includes(location.pathname);

  return (
    <div className="d-flex min-vh-100">
      {!masquerSidebar && <Sidebar />}

      <div className="flex-grow-1 d-flex flex-column bg-light overflow-auto" style={{ maxHeight: '100vh' }}>
        <main className="flex-grow-1 p-0">
          <Routes>
            <Route path="/" element={<ArticleList />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Register />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />

            <Route 
              path="/articles/nouveau" 
              element={
                <PrivateRoute>
                  <VendeurRoute>
                    <ArticleForm />
                  </VendeurRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/articles/:id/modifier" 
              element={
                <PrivateRoute>
                  <VendeurRoute>
                    <ArticleForm />
                  </VendeurRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/mes-articles" 
              element={
                <PrivateRoute>
                  <VendeurRoute>
                    <MyArticles />
                  </VendeurRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/categories" 
              element={
                <PrivateRoute>
                  <VendeurRoute>
                    <Categories />
                  </VendeurRoute>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/tableau-de-bord" 
              element={
                <PrivateRoute>
                  <VendeurRoute>
                    <Dashboard />
                  </VendeurRoute>
                </PrivateRoute>
              } 
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {!masquerSidebar && (
          <footer className="text-center py-3 text-muted small border-top bg-white mt-auto">
            © {new Date().getFullYear()} EnchèresLive — Système de Gestion de Ventes aux Enchères en Ligne
          </footer>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout />
        <ToastContainer position="top-right" autoClose={3500} />
      </BrowserRouter>
    </AuthProvider>
  );
}