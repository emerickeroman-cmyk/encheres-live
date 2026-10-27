import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Loader from '../components/Loader';

const VIDE = {
  titre: '', description: '', prix_depart: '', categorie: '',
  date_debut: '', date_fin: '',
};

export default function ArticleForm() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(VIDE);
  const [imageFile, setImageFile] = useState(null); // Pour stocker le fichier sélectionné
  const [imagePreview, setImagePreview] = useState(null); // Pour afficher un aperçu de l'image
  const [categories, setCategories] = useState([]);
  const [erreurs, setErreurs] = useState({});
  const [chargement, setChargement] = useState(modeEdition);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api.get('/categories/').then(({ data }) => setCategories(data.results || data));
  }, []);

  useEffect(() => {
    if (modeEdition) {
      api.get(`/articles/${id}/`).then(({ data }) => {
        setForm({
          titre: data.titre,
          description: data.description,
          prix_depart: data.prix_depart,
          categorie: data.categorie,
          date_debut: data.date_debut?.slice(0, 16),
          date_fin: data.date_fin?.slice(0, 16),
        });
        if (data.image) {
          setImagePreview(data.image); // Afficher l'image actuelle si disponible
        }
        setChargement(false);
      }).catch(() => {
        toast.error("Impossible de charger cet article.");
        navigate('/mes-articles');
      });
    }
  }, [id, modeEdition, navigate]);

  const champ = (nom) => (e) => setForm({ ...form, [nom]: e.target.value });

  // Gérer la sélection du fichier image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Créer un lien temporaire pour l'aperçu
    }
  };

  const valider = () => {
    const e = {};
    if (form.titre.trim().length < 3) e.titre = 'Le titre doit contenir au moins 3 caractères.';
    if (!form.description.trim()) e.description = 'La description est requise.';
    if (!form.categorie) e.categorie = 'Veuillez choisir une catégorie.';
    const prix = parseFloat(form.prix_depart);
    if (!prix || prix <= 0) e.prix_depart = 'Le prix de départ doit être supérieur à zéro.';
    if (!form.date_debut) e.date_debut = 'La date de début est requise.';
    if (!form.date_fin) e.date_fin = 'La date de fin est requise.';
    if (form.date_debut && form.date_fin && new Date(form.date_fin) <= new Date(form.date_debut)) {
      e.date_fin = 'La date de fin doit être postérieure à la date de début.';
    }
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = async (evt) => {
    evt.preventDefault();
    if (!valider()) {
      toast.warn('Veuillez corriger les champs invalides.');
      return;
    }
    setEnvoi(true);

    // Création du FormData pour gérer les fichiers et données brutes
    const formData = new FormData();
    formData.append('titre', form.titre);
    formData.append('description', form.description);
    formData.append('prix_depart', parseFloat(form.prix_depart));
    formData.append('categorie', parseInt(form.categorie, 10));
    formData.append('date_debut', form.date_debut);
    formData.append('date_fin', form.date_fin);

    // Si une nouvelle image a été choisie
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (modeEdition) {
        await api.put(`/articles/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Article mis à jour avec succès.');
      } else {
        await api.post('/articles/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Article publié avec succès.');
      }
      navigate('/mes-articles');
    } catch (err) {
      console.error("Erreur complète:", err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setErreurs(data);
        // Afficher un message plus précis si disponible
        const premierMessage = Object.values(data)[0];
        if (Array.isArray(premierMessage)) {
          toast.error(premierMessage[0]);
        } else if (typeof premierMessage === 'string') {
          toast.error(premierMessage);
        } else {
          toast.error("Veuillez vérifier les informations saisies.");
        }
      } else {
        toast.error("Erreur serveur, veuillez réessayer.");
      }
    }
  };

  if (chargement) return <Loader />;

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-4 px-4">
          <h4 className="fw-bold mb-0">
            <i className={`bi ${modeEdition ? 'bi-pencil-square' : 'bi-plus-circle'} me-2 text-gradient`}></i>
            {modeEdition ? "Modifier l'article" : 'Publier un nouveau lot'}
          </h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={soumettre} noValidate>
            <div className="mb-3">
              <label className="form-label">Titre du lot *</label>
              <input
                className={`form-control ${erreurs.titre ? 'is-invalid' : ''}`}
                value={form.titre} onChange={champ('titre')} placeholder="ex: iPhone 15 Pro Max neuf"
              />
              {erreurs.titre && <div className="invalid-feedback">{erreurs.titre}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Description *</label>
              <textarea
                className={`form-control ${erreurs.description ? 'is-invalid' : ''}`} rows="4"
                value={form.description} onChange={champ('description')}
                placeholder="Décrivez l'état, les caractéristiques, la provenance..."
              />
              {erreurs.description && <div className="invalid-feedback">{erreurs.description}</div>}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Catégorie *</label>
                <select
                  className={`form-select ${erreurs.categorie ? 'is-invalid' : ''}`}
                  value={form.categorie} onChange={champ('categorie')}
                >
                  <option value="">-- Choisir --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                {erreurs.categorie && <div className="invalid-feedback">{erreurs.categorie}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Prix de départ (Ar) *</label>
                <input
                  type="number" min="0.01" step="0.01"
                  className={`form-control ${erreurs.prix_depart ? 'is-invalid' : ''}`}
                  value={form.prix_depart} onChange={champ('prix_depart')} placeholder="ex: 500000"
                />
                {erreurs.prix_depart && <div className="invalid-feedback">{erreurs.prix_depart}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Date et heure de début *</label>
                <input
                  type="datetime-local"
                  className={`form-control ${erreurs.date_debut ? 'is-invalid' : ''}`}
                  value={form.date_debut} onChange={champ('date_debut')}
                />
                {erreurs.date_debut && <div className="invalid-feedback">{erreurs.date_debut}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Date et heure de fin *</label>
                <input
                  type="datetime-local"
                  className={`form-control ${erreurs.date_fin ? 'is-invalid' : ''}`}
                  value={form.date_fin} onChange={champ('date_fin')}
                />
                {erreurs.date_fin && <div className="invalid-feedback">{erreurs.date_fin}</div>}
              </div>

              {/* CHAMP D'IMAGE MIS À JOUR (SÉLECTION DE FICHIER) */}
              <div className="col-12">
                <label className="form-label">Image du lot (optionnel)</label>
                <input
                  type="file"
                  accept="image/*"
                  className={`form-control ${erreurs.image ? 'is-invalid' : ''}`}
                  onChange={handleImageChange}
                />
                {erreurs.image && <div className="invalid-feedback">{erreurs.image}</div>}
                
                {/* Aperçu de l'image sélectionnée ou existante */}
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-muted mb-1 small">Aperçu :</p>
                    <img 
                      src={imagePreview} 
                      alt="Aperçu" 
                      style={{ maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-gradient rounded-pill px-4" disabled={envoi}>
                {envoi ? 'Enregistrement...' : 'Enregistrer'} <i className="bi bi-check-circle ms-1"></i>
              </button>
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => navigate(-1)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}