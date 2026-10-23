import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { connecter } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const valider = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Le nom d'utilisateur est requis.";
    if (!form.password) e.password = 'Le mot de passe est requis.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const soumettre = async (evt) => {
    evt.preventDefault();
    if (!valider()) return;
    setEnvoi(true);
    try {
      await connecter(form.username, form.password);
      toast.success('Connexion réussie ! Bienvenue.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.detail || "Identifiants incorrects. Veuillez réessayer.";
      toast.error(msg);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="auth-wrapper d-flex align-items-center justify-content-center">
      <div className="card shadow-lg border-0 auth-card">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <i className="bi bi-hammer display-4 text-gradient"></i>
            <h3 className="fw-bold mt-2">Connexion</h3>
            <p className="text-muted">Accédez à votre espace d'enchères</p>
          </div>
          <form onSubmit={soumettre} noValidate>
            <div className="mb-3">
              <label className="form-label">Nom d'utilisateur</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person-fill"></i></span>
                <input
                  type="text" className={`form-control ${erreurs.username ? 'is-invalid' : ''}`}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="ex: vendeur1"
                />
                {erreurs.username && <div className="invalid-feedback">{erreurs.username}</div>}
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label">Mot de passe</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                <input
                  type="password" className={`form-control ${erreurs.password ? 'is-invalid' : ''}`}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
                {erreurs.password && <div className="invalid-feedback">{erreurs.password}</div>}
              </div>
            </div>
            <button className="btn btn-gradient w-100 rounded-pill py-2 fw-semibold" disabled={envoi}>
              {envoi ? 'Connexion...' : 'Se connecter'} <i className="bi bi-box-arrow-in-right ms-1"></i>
            </button>
          </form>
          <p className="text-center mt-4 mb-0 text-muted">
            Pas encore de compte ? <Link to="/inscription" className="fw-semibold">Inscrivez-vous</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
