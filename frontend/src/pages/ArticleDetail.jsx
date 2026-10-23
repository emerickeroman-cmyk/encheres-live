import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Loader from '../components/Loader';
import { formaterMontant, BADGES_STATUT } from '../components/ArticleCard';
import { useAuth } from '../context/AuthContext';

export default function ArticleDetail() {
  const { id } = useParams();
  const { utilisateur } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [montant, setMontant] = useState('');
  const [erreurMontant, setErreurMontant] = useState('');
  const [envoiEnchere, setEnvoiEnchere] = useState(false);
  const [changementStatut, setChangementStatut] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    api.get(`/articles/${id}/`)
      .then(({ data }) => setArticle(data))
      .catch(() => toast.error("Impossible de charger cet article."))
      .finally(() => setChargement(false));
  }, [id]);

  useEffect(() => { charger(); }, [charger]);

  const estProprietaire = utilisateur && article && article.vendeur === utilisateur.id;

  const validerMontant = (valeur) => {
    const v = parseFloat(valeur);
    if (!v || v <= 0) return 'Le montant doit être supérieur à zéro.';
    if (article && v <= parseFloat(article.prix_actuel)) {
      return `Votre offre doit dépasser ${formaterMontant(article.prix_actuel)}.`;
    }
    return '';
  };

  const placerEnchere = async (evt) => {
    evt.preventDefault();
    const err = validerMontant(montant);
    setErreurMontant(err);
    if (err) return;
    setEnvoiEnchere(true);
    try {
      await api.post(`/articles/${id}/encherir/`, { montant: parseFloat(montant) });
      toast.success('Votre offre a été enregistrée !');
      setMontant('');
      charger();
    } catch (e) {
      const msg = e.response?.data?.montant || e.response?.data?.detail || e.response?.data?.non_field_errors?.[0]
        || "Impossible de placer cette offre.";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setEnvoiEnchere(false);
    }
  };

  const changerStatutArticle = async (nouveauStatut) => {
    setChangementStatut(true);
    try {
      await api.patch(`/articles/${id}/`, { statut: nouveauStatut });
      toast.success(`Statut mis à jour : ${nouveauStatut}`);
      charger();
    } catch {
      toast.error("Impossible de modifier le statut de l'article.");
    } finally {
      setChangementStatut(false);
    }
  };

  const validerOffre = async (enchereId) => {
    if (!window.confirm("Confirmez-vous la validation de cette offre ? Cela clôtura l'enchère (statut TERMINEE).")) return;
    try {
      // Utilisation de l'endpoint dédié côté Django
      await api.post(`/encheres/${enchereId}/valider/`);
      toast.success("L'offre a été validée et la vente est désormais terminée !");
      charger();
    } catch {
      toast.error("Échec lors de la validation de l'offre.");
    }
  };

  const annulerOffre = async (enchereId) => {
    if (!window.confirm("Voulez-vous vraiment refuser/annuler cette offre ?")) return;
    try {
      // Utilisation de l'endpoint dédié côté Django
      await api.post(`/encheres/${enchereId}/refuser/`);
      toast.info("L'offre a été annulée.");
      charger();
    } catch {
      toast.error("Échec lors de l'annulation de l'offre.");
    }
  };

  const supprimer = async () => {
    if (!window.confirm('Confirmez-vous la suppression définitive de cet article ?')) return;
    try {
      await api.delete(`/articles/${id}/`);
      toast.success('Article supprimé.');
      navigate('/mes-articles');
    } catch {
      toast.error("Suppression impossible (des enchères sont peut-être déjà en cours).");
    }
  };

  if (chargement) return <Loader />;
  if (!article) return <p className="text-center py-5">Article introuvable.</p>;

  const badge = BADGES_STATUT[article.statut] || { classe: 'bg-secondary', label: article.statut, icone: 'bi-question-circle' };
  const image = article.image || article.image_url;

  // Détection de l'enchère validée
  const enchereValidee = article.encheres?.find((e) => e.statut === 'VALIDEE');

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Articles</Link></li>
          <li className="breadcrumb-item active">{article.titre}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="ratio ratio-1x1 bg-light rounded-4 overflow-hidden shadow-sm">
            {image ? (
              <img src={image} alt={article.titre} className="object-fit-cover" />
            ) : (
              <div className="d-flex align-items-center justify-content-center text-secondary">
                <i className="bi bi-image display-1"></i>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <span className="badge" style={{ backgroundColor: '#6366f1' }}>{article.categorie_nom}</span>
            <span className={`badge ${badge.classe}`}>
              <i className={`bi ${badge.icone} me-1`}></i>{badge.label}
            </span>

            {/* Modification du statut par le vendeur */}
            {estProprietaire && (
              <div className="ms-auto d-flex align-items-center gap-1">
                <label className="small text-muted fw-semibold me-1">Statut :</label>
                <select
                  className="form-select form-select-sm shadow-none"
                  style={{ width: 'auto' }}
                  value={article.statut}
                  disabled={changementStatut}
                  onChange={(e) => changerStatutArticle(e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="TERMINEE">Terminée</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
              </div>
            )}
          </div>

          <h2 className="fw-bold">{article.titre}</h2>
          <p className="text-muted"><i className="bi bi-person-fill me-1"></i>Vendu par <strong>{article.vendeur_nom}</strong></p>
          <p>{article.description}</p>

          <div className="card border-0 shadow-sm bg-light-subtle p-3 mb-3">
            <div className="row text-center">
              <div className="col-4 border-end">
                <div className="text-muted small">Prix de départ</div>
                <div className="fw-semibold">{formaterMontant(article.prix_depart)}</div>
              </div>
              <div className="col-4 border-end">
                <div className="text-muted small">Enchère actuelle</div>
                <div className="fw-bold text-success fs-5">{formaterMontant(article.prix_actuel)}</div>
              </div>
              <div className="col-4">
                <div className="text-muted small">Offres reçues</div>
                <div className="fw-semibold">{article.nombre_encheres}</div>
              </div>
            </div>
          </div>

          <p className="small text-muted">
            <i className="bi bi-calendar-event me-1"></i>
            Du {new Date(article.date_debut).toLocaleString('fr-FR')} au {new Date(article.date_fin).toLocaleString('fr-FR')}
          </p>

          {/* Actions / Zones de formulaire ou d'information */}
          {estProprietaire ? (
            <div className="d-flex gap-2 mt-3">
              <Link to={`/articles/${id}/modifier`} className="btn btn-outline-primary rounded-pill px-4">
                <i className="bi bi-pencil-square me-1"></i>Modifier
              </Link>
              <button className="btn btn-outline-danger rounded-pill px-4" onClick={supprimer}>
                <i className="bi bi-trash3 me-1"></i>Supprimer
              </button>
            </div>
          ) : article.statut === 'ACTIVE' && utilisateur ? (
            <form onSubmit={placerEnchere} className="mt-3">
              <label className="form-label fw-semibold">Placer une offre</label>
              <div className="input-group">
                <span className="input-group-text">Ar</span>
                <input
                  type="number" step="0.01"
                  className={`form-control ${erreurMontant ? 'is-invalid' : ''}`}
                  placeholder={`Supérieur à ${article.prix_actuel}`}
                  value={montant}
                  onChange={(e) => { setMontant(e.target.value); setErreurMontant(''); }}
                />
                <button className="btn btn-gradient" disabled={envoiEnchere}>
                  <i className="bi bi-hammer me-1"></i>Enchérir
                </button>
              </div>
              {erreurMontant && <div className="text-danger small mt-1">{erreurMontant}</div>}
            </form>
          ) : !utilisateur ? (
            <div className="alert alert-info mt-3">
              <Link to="/connexion">Connectez-vous</Link> pour placer une offre sur cet article.
            </div>
          ) : (
            <div className="mt-3">
              <div className="alert alert-secondary mb-2">
                Cet article n'est pas ouvert aux enchères actuellement.
              </div>

              {/* Message spécifique récapitulant l'achat validé */}
              {enchereValidee && (
                <div className="alert alert-success border-0 shadow-sm d-flex align-items-center gap-2 mt-2">
                  <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                  <div>
                    Cet article a été acheté par <strong>{enchereValidee.encherisseur_nom}</strong> au prix de <strong>{formaterMontant(enchereValidee.montant)}</strong> le {new Date(enchereValidee.date_enchere).toLocaleString('fr-FR')}.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <h5 className="fw-bold mb-3"><i className="bi bi-clock-history me-2"></i>Historique des offres</h5>
        {article.encheres && article.encheres.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle bg-white shadow-sm rounded">
              <thead className="table-light">
                <tr>
                  <th>Enchérisseur</th>
                  <th>Montant</th>
                  <th>Date</th>
                  {estProprietaire && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {[...article.encheres].sort((a, b) => b.montant - a.montant).map((e) => (
                  <tr key={e.id}>
                    <td><i className="bi bi-person-circle me-1"></i>{e.encherisseur_nom}</td>
                    <td>
                      <span className="fw-semibold text-success me-2">{formaterMontant(e.montant)}</span>
                      {e.statut === 'VALIDEE' && <span className="badge bg-success">Validée</span>}
                      {e.statut === 'REFUSEE' && <span className="badge bg-danger">Refusée</span>}
                    </td>
                    <td className="text-muted">{new Date(e.date_enchere).toLocaleString('fr-FR')}</td>
                    {estProprietaire && (
                      <td className="text-end">
                        {article.statut !== 'TERMINEE' && e.statut !== 'REFUSEE' ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-success"
                              title="Valider cette offre et terminer la vente"
                              onClick={() => validerOffre(e.id)}
                            >
                              <i className="bi bi-check-lg me-1"></i>Valider
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              title="Refuser/Annuler cette offre"
                              onClick={() => annulerOffre(e.id)}
                            >
                              <i className="bi bi-x-lg me-1"></i>Annuler
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">Aucune action</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">Aucune offre pour le moment. Soyez le premier à enchérir !</p>
        )}
      </div>
    </div>
  );
}