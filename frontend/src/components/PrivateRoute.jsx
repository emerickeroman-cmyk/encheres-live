import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function PrivateRoute({ children }) {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return <Loader />;
  return utilisateur ? children : <Navigate to="/connexion" replace />;
}
