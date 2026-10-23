import React from 'react';

export default function Loader({ texte = 'Chargement en cours...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border text-primary" role="status" style={{ width: 48, height: 48 }}>
        <span className="visually-hidden">Chargement...</span>
      </div>
      <p className="mt-3 text-muted">{texte}</p>
    </div>
  );
}
