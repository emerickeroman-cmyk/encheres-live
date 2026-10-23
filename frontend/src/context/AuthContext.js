import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const stocke = localStorage.getItem('utilisateur');
    return stocke ? JSON.parse(stocke) : null;
  });
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const access = localStorage.getItem('access');
    if (access) {
      // Recharger systématiquement le profil pour maintenir à jour les autorisations (is_staff, username, etc.)
      api.get('/auth/profil/')
        .then(({ data }) => {
          setUtilisateur(data);
          localStorage.setItem('utilisateur', JSON.stringify(data));
        })
        .catch(() => {
          localStorage.clear();
          setUtilisateur(null);
        })
        .finally(() => setChargement(false));
    } else {
      setChargement(false);
    }
  }, []);

  const connecter = async (username, password) => {
    const { data } = await api.post('/auth/connexion/', { username, password });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);

    let userObj = data.user;
    if (!userObj) {
      // Si le backend ne renvoie pas directement l'objet user dans la réponse du token, on charge le profil
      const resProfil = await api.get('/auth/profil/');
      userObj = resProfil.data;
    }

    localStorage.setItem('utilisateur', JSON.stringify(userObj));
    setUtilisateur(userObj);
    return userObj;
  };

  const inscrire = async (payload) => {
    const { data } = await api.post('/auth/inscription/', payload);
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);

    let userObj = data.user;
    if (!userObj) {
      const resProfil = await api.get('/auth/profil/');
      userObj = resProfil.data;
    }

    localStorage.setItem('utilisateur', JSON.stringify(userObj));
    setUtilisateur(userObj);
    return userObj;
  };

  const deconnecter = async () => {
    try {
      await api.post('/auth/deconnexion/', { refresh: localStorage.getItem('refresh') });
    } catch (e) {
      /* silencieux */
    }
    localStorage.clear();
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, connecter, inscrire, deconnecter, chargement }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);