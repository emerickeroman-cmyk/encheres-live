import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container text-center py-5">
      <i className="bi bi-emoji-dizzy display-1 text-gradient"></i>
      <h2 className="fw-bold mt-3">Page introuvable</h2>
      <p className="text-muted">La page que vous recherchez n'existe pas ou plus.</p>
      <Link to="/" className="btn btn-gradient rounded-pill px-4">Retour à l'accueil</Link>
    </div>
  );
}
