import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import ArticleCard from '../components/ArticleCard';

export default function MyArticles() {
  const [articles, setArticles] = useState([]);
  const [chargement, setChargement] = useState(true);

  // État de la pagination côté frontend
  const [page, setPage] = useState(1);
  const ARTICLES_PAR_PAGE = 6; // Nombres d'articles par page (ex: 6)

  useEffect(() => {
    api.get('/articles/mes_articles/')
      .then(({ data }) => setArticles(data.results || data))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <Loader />;

  // Calculs pour le découpage paginé
  const totalPages = Math.ceil(articles.length / ARTICLES_PAR_PAGE);
  const indexDebut = (page - 1) * ARTICLES_PAR_PAGE;
  const articlesAffiches = articles.slice(indexDebut, indexDebut + ARTICLES_PAR_PAGE);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">
          <i className="bi bi-person-badge-fill me-2 text-gradient"></i>
          Mes articles publiés récemment
        </h3>
        <Link to="/articles/nouveau" className="btn btn-gradient rounded-pill px-4">
          <i className="bi bi-plus-circle me-1"></i>Publier un lot
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-box-seam display-1"></i>
          <p className="mt-3">Vous n'avez publié aucun article pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="row g-4">
            {articlesAffiches.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>

          {/* Barre de pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <nav aria-label="Pagination mes articles">
                <ul className="pagination shadow-sm">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    >
                      &lt; Précédent
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <li key={n} className={`page-item ${page === n ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(n)}>
                        {n}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    >
                      Suivant &gt;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}