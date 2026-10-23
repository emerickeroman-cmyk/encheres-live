import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { inscrire } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '', password: '', password2: '',
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const champ = (nom) => (e) => setForm({ ...form, [nom]: e.target.value });

  const valider = () => {
    const e = {};
    if (form.username.trim().length < 3) e.username = "Minimum 3 caractères.";
    if (!REGEX_EMAIL.test(form.email)) e.email = 'Adresse email invalide.';
    if (form.password.length < 8) e.password = 'Minimum 8 caractères.';
    if (form.password !== form.password2) e.password2 = 'Les mots de passe ne correspondent pas.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = async (evt) => {
    evt.preventDefault();
    if (!valider()) return;
    setEnvoi(true);
    try {
      await inscrire(form);
      toast.success('Compte créé avec succès ! Bienvenue.');
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const erreursApi = {};
        Object.entries(data).forEach(([champ, val]) => {
          erreursApi[champ] = Array.isArray(val) ? val[0] : val;
        });
        setErreurs(erreursApi);
        toast.error("Veuillez corriger les erreurs du formulaire.");
      } else {
        toast.error("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="auth-wrapper d-flex align-items-center justify-content-center py-4">
      <div className="card shadow-lg border-0 auth-card auth-card-lg">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-person-plus-fill display-4 text-gradient"></i>
            <h3 className="fw-bold mt-2">Créer un compte</h3>
            <p className="text-muted">Rejoignez la plateforme d'enchères en ligne</p>
          </div>
          <form onSubmit={soumettre} noValidate>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Prénom</label>
                <input className="form-control" value={form.first_name} onChange={champ('first_name')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nom</label>
                <input className="form-control" value={form.last_name} onChange={champ('last_name')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nom d'utilisateur *</label>
                <input
                  className={`form-control ${erreurs.username ? 'is-invalid' : ''}`}
                  value={form.username} onChange={champ('username')} required
                />
                {erreurs.username && <div className="invalid-feedback">{erreurs.username}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Email *</label>
                <input
                  type="email" className={`form-control ${erreurs.email ? 'is-invalid' : ''}`}
                  value={form.email} onChange={champ('email')} required
                />
                {erreurs.email && <div className="invalid-feedback">{erreurs.email}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Mot de passe *</label>
                <input
                  type="password" className={`form-control ${erreurs.password ? 'is-invalid' : ''}`}
                  value={form.password} onChange={champ('password')} required
                />
                {erreurs.password && <div className="invalid-feedback">{erreurs.password}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Confirmer le mot de passe *</label>
                <input
                  type="password" className={`form-control ${erreurs.password2 ? 'is-invalid' : ''}`}
                  value={form.password2} onChange={champ('password2')} required
                />
                {erreurs.password2 && <div className="invalid-feedback">{erreurs.password2}</div>}
              </div>
            </div>
            <button className="btn btn-gradient w-100 rounded-pill py-2 fw-semibold mt-4" disabled={envoi}>
              {envoi ? 'Création...' : 'Créer mon compte'} <i className="bi bi-check-circle ms-1"></i>
            </button>
          </form>
          <p className="text-center mt-4 mb-0 text-muted">
            Déjà inscrit ? <Link to="/connexion" className="fw-semibold">Connectez-vous</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
