import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import ArticleCard from '../components/ArticleCard';
import Loader from '../components/Loader';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [filtres, setFiltres] = useState({ recherche: '', categorie: '', statut: '' });

  // --- Gestion de la pagination serveur ---
  const [pageCourante, setPageCourante] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const articlesParPage = 9; // Correspond au PAGE_SIZE de Django

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const params = {
        page: pageCourante, // Envoie la page demandée à l'API Django
      };
      if (filtres.recherche) params.search = filtres.recherche;
      if (filtres.categorie) params.categorie = filtres.categorie;
      if (filtres.statut) params.statut = filtres.statut;

      const { data } = await api.get('/articles/', { params });

      if (data.results) {
        // En cas de pagination Django
        setArticles(data.results);
        setTotalArticles(data.count);
      } else {
        // Si l'API renvoie la liste directe sans pagination
        setArticles(data);
        setTotalArticles(data.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChargement(false);
    }
  }, [filtres, pageCourante]);

  // Chargement des catégories au montage
  useEffect(() => {
    api.get('/categories/').then(({ data }) => setCategories(data.results || data)).catch(() => {});
  }, []);

  // Déclenche le chargement lors d'un changement de filtre ou de page
  useEffect(() => {
    const debounce = setTimeout(charger, 300);
    return () => clearTimeout(debounce);
  }, [charger]);

  // Calcule le nombre total de pages en se basant sur le "count" de Django
  const totalPages = Math.ceil(totalArticles / articlesParPage);

  const changerPage = (numeroPage) => {
    setPageCourante(numeroPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Réinitialiser la page à 1 si l'utilisateur change un filtre
  const changerFiltre = (cle, valeur) => {
    setPageCourante(1);
    setFiltres((prev) => ({ ...prev, [cle]: valeur }));
  };

  return (
    <div className="container py-4">
      <div className="hero-banner rounded-4 p-4 p-md-5 mb-4 text-white">
        <h1 className="fw-bold display-6 mb-2">
          <i className="bi bi-hammer me-2"></i>Enchérissez, gagnez, collectionnez
        </h1>
        <p className="mb-0 opacity-75">Découvrez des lots uniques et placez vos offres en toute sécurité.</p>
      </div>

      <div className="card border-0 shadow-sm mb-4 filter-card">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label small text-muted">Recherche</label>
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input
                  className="form-control"
                  placeholder="Titre, description..."
                  value={filtres.recherche}
                  onChange={(e) => changerFiltre('recherche', e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Catégorie</label>
              <select
                className="form-select"
                value={filtres.categorie}
                onChange={(e) => changerFiltre('categorie', e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted">Statut</label>
              <select
                className="form-select"
                value={filtres.statut}
                onChange={(e) => changerFiltre('statut', e.target.value)}
              >
                <option value="">Tous</option>
                <option value="ACTIVE">Active</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="TERMINEE">Terminée</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {chargement ? (
        <Loader texte="Chargement des articles..." />
      ) : articles.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-inbox display-1"></i>
          <p className="mt-3">Aucun article ne correspond à votre recherche.</p>
        </div>
      ) : (
        <>
          {/* Liste des articles */}
          <div className="row g-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>

          {/* Barre de pagination */}
          {totalPages > 1 && (
            <nav className="d-flex justify-content-center mt-5">
              <ul className="pagination shadow-sm">
                <li className={`page-item ${pageCourante === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => changerPage(pageCourante - 1)}
                    disabled={pageCourante === 1}
                  >
                    <i className="bi bi-chevron-left me-1"></i> Précédent
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, index) => (
                  <li 
                    key={index + 1} 
                    className={`page-item ${pageCourante === index + 1 ? 'active' : ''}`}
                  >
                    <button 
                      className="page-link" 
                      onClick={() => changerPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${pageCourante === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => changerPage(pageCourante + 1)}
                    disabled={pageCourante === totalPages}
                  >
                    Suivant <i className="bi bi-chevron-right ms-1"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}