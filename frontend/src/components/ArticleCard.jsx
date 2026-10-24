import React from 'react';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || '';

const BADGES_STATUT = {
  EN_ATTENTE: { classe: 'bg-secondary', label: 'En attente', icone: 'bi-hourglass-split' },
  ACTIVE: { classe: 'bg-success', label: 'Active', icone: 'bi-broadcast' },
  TERMINEE: { classe: 'bg-dark', label: 'Terminée', icone: 'bi-flag-fill' },
  ANNULEE: { classe: 'bg-danger', label: 'Annulée', icone: 'bi-x-octagon-fill' },
};

function formaterMontant(valeur) {
  return new Intl.NumberFormat('fr-FR').format(valeur || 0) + ' Ar';
}

export default function ArticleCard({ article }) {
  const badge = BADGES_STATUT[article.statut] || BADGES_STATUT.EN_ATTENTE;
  
  // Construction de l'URL absolue pour l'image
  const rawImage = article.image || article.image_url;
  const image = rawImage 
    ? (rawImage.startsWith('http') ? rawImage : `${API_URL}${rawImage}`)
    : null;

  return (
    <div className="col-md-6 col-lg-4">
      <div className="card article-card h-100 shadow-sm border-0 overflow-hidden">
        <div className="position-relative bg-light" style={{ height: '220px' }}>
          {image ? (
            <img 
              src={image} 
              alt={article.titre} 
              className="w-100 h-100" 
              style={{ objectFit: 'cover', display: 'block' }} 
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-secondary">
              <i className="bi bi-image fs-1"></i>
            </div>
          )}

          {/* Badges isolés avec un z-index suffisant */}
          <div className="position-absolute top-0 start-0 w-100 d-flex justify-content-between p-2" style={{ zIndex: 2, pointerEvents: 'none' }}>
            {article.categorie_nom && (
              <span
                className="badge shadow-sm"
                style={{ backgroundColor: article.categorie_couleur || '#6366f1' }}
              >
                {article.categorie_nom}
              </span>
            )}
            <span className={`badge shadow-sm ms-auto ${badge.classe}`}>
              <i className={`bi ${badge.icone} me-1`}></i>{badge.label}
            </span>
          </div>
        </div>

        <div className="card-body d-flex flex-column p-3">
          <h5 className="card-title fw-bold mb-1 text-truncate">{article.titre}</h5>
          <p className="text-muted small mb-2">
            <i className="bi bi-person-fill me-1"></i>{article.vendeur_nom || 'Vendeur'}
          </p>
          <div className="mt-auto pt-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Enchère actuelle</span>
              <span className="fw-bold text-success fs-5">{formaterMontant(article.prix_actuel)}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3 small text-muted">
              <span><i className="bi bi-hammer me-1"></i>{article.nombre_encheres || 0} offre(s)</span>
              <span>
                <i className="bi bi-clock-history me-1"></i>
                fin le {article.date_fin ? new Date(article.date_fin).toLocaleDateString('fr-FR') : '--'}
              </span>
            </div>
            <Link to={`/articles/${article.id}`} className="btn btn-gradient w-100 rounded-pill">
              Voir le lot <i className="bi bi-arrow-right-circle ms-1"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export { formaterMontant, BADGES_STATUT };