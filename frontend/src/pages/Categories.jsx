import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import Loader from '../components/Loader';

const ICONES = ['bi-tag', 'bi-laptop', 'bi-palette', 'bi-car-front', 'bi-bag-heart', 'bi-house-door', 'bi-gem', 'bi-controller', 'bi-watch'];
const COULEURS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#eab308', '#ef4444', '#14b8a6'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [form, setForm] = useState({ nom: '', icone: ICONES[0], couleur: COULEURS[0] });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const charger = () => {
    setChargement(true);
    api.get('/categories/').then(({ data }) => setCategories(data.results || data)).finally(() => setChargement(false));
  };

  useEffect(charger, []);

  const soumettre = async (evt) => {
    evt.preventDefault();
    const e = {};
    if (form.nom.trim().length < 2) e.nom = 'Le nom doit contenir au moins 2 caractères.';
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      await api.post('/categories/', form);
      toast.success('Catégorie créée avec succès.');
      setForm({ nom: '', icone: ICONES[0], couleur: COULEURS[0] });
      charger();
    } catch (err) {
      setErreurs(err.response?.data || {});
      toast.error('Impossible de créer cette catégorie.');
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/categories/${id}/`);
      toast.success('Catégorie supprimée.');
      charger();
    } catch {
      toast.error('Suppression impossible (des articles y sont peut-être rattachés).');
    }
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4"><i className="bi bi-tags-fill me-2 text-gradient"></i>Gestion des catégories</h3>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Nouvelle catégorie</h5>
              <form onSubmit={soumettre} noValidate>
                <div className="mb-3">
                  <label className="form-label">Nom *</label>
                  <input
                    className={`form-control ${erreurs.nom ? 'is-invalid' : ''}`}
                    value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  />
                  {erreurs.nom && <div className="invalid-feedback">{erreurs.nom}</div>}
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label">Icône</label>
                    <select className="form-select" value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })}>
                      {ICONES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Couleur</label>
                    <input
                      type="color" className="form-control form-control-color w-100"
                      value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })}
                    />
                  </div>
                </div>
                <button className="btn btn-gradient rounded-pill w-100" disabled={envoi}>
                  <i className="bi bi-plus-circle me-1"></i>{envoi ? 'Création...' : 'Ajouter'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {chargement ? <Loader /> : (
            <div className="row g-3">
              {categories.map((c) => (
                <div className="col-md-6" key={c.id}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{ backgroundColor: c.couleur, width: 48, height: 48, minWidth: 48 }}
                      >
                        <i className={`bi ${c.icone} fs-5`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-0">{c.nom}</h6>
                        <small className="text-muted">{c.nombre_articles || 0} article(s)</small>
                      </div>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => supprimer(c.id)}>
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}