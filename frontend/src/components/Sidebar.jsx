import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { utilisateur, deconnecter } = useAuth();
  const navigate = useNavigate();

  const seDeconnecter = async () => {
    await deconnecter();
    navigate('/connexion');
  };

  // Détermine si l'utilisateur connecté est un vendeur ou un administrateur
  const estVendeurOuAdmin = utilisateur && (
    utilisateur.is_staff || 
    utilisateur.is_vendeur || 
    utilisateur.role === 'vendeur' ||
    (utilisateur.username && utilisateur.username.toLowerCase().includes('vendeur')) ||
    utilisateur.username === 'admin'
  );

  return (
    <aside className="sidebar-vertical bg-dark text-white p-3 d-flex flex-column justify-content-between">
      <div>
        {/* Logo / Marque */}
        <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center gap-2 mb-4 text-white text-decoration-none" to="/">
          <i className="bi bi-hammer text-warning fs-3"></i>
          <span>Enchères<span className="text-warning">Live</span></span>
        </Link>

        <hr className="border-secondary mb-4" />

        {/* Menu de navigation vertical */}
        <ul className="nav nav-pills flex-column gap-2">
          {/* Lien visible par TOUT LE MONDE (Acheteurs, Vendeurs, Visiteurs) */}
          <li className="nav-item">
            <NavLink className="nav-link text-white d-flex align-items-center gap-2" to="/">
              <i className="bi bi-grid-fill"></i>
              <span>Articles</span>
            </NavLink>
          </li>

          {/* Liens réservés UNIQUEMENT aux Vendeurs et à l'Admin */}
          {utilisateur && estVendeurOuAdmin && (
            <>
              <li className="nav-item">
                <NavLink className="nav-link text-white d-flex align-items-center gap-2" to="/tableau-de-bord">
                  <i className="bi bi-bar-chart-line-fill"></i>
                  <span>Tableau de bord</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link text-white d-flex align-items-center gap-2" to="/mes-articles">
                  <i className="bi bi-person-badge-fill"></i>
                  <span>Mes articles</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link text-white d-flex align-items-center gap-2" to="/categories">
                  <i className="bi bi-tags-fill"></i>
                  <span>Catégories</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link text-white d-flex align-items-center gap-2" to="/articles/nouveau">
                  <i className="bi bi-plus-circle-fill"></i>
                  <span>Publier un lot</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Bas du Sidebar : Profil utilisateur et bouton de Déconnexion */}
      <div className="pt-3 border-top border-secondary mt-auto">
        {utilisateur ? (
          <div className="d-flex flex-column gap-2">
            <div className="small text-white-50 text-truncate">
              <i className="bi bi-person-circle me-1"></i>
              Connecté : <strong className="text-white">{utilisateur.username}</strong>
            </div>
            <button className="btn btn-sm btn-outline-danger w-100 rounded-pill mt-1" onClick={seDeconnecter}>
              <i className="bi bi-box-arrow-right me-1"></i>Déconnexion
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            <Link className="btn btn-sm btn-outline-light rounded-pill w-100" to="/connexion">
              Connexion
            </Link>
            <Link className="btn btn-sm btn-warning rounded-pill w-100 fw-semibold" to="/inscription">
              S'inscrire
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}