import axios from 'axios';

// Si pas de variable d'environnement, on utilise '/api' (chemin relatif idéal pour le déploiement unifié Django/React)
export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injecte le jeton d'accès JWT dans chaque requête sortante
api.interceptors.request.use((config) => {
  const access = localStorage.getItem('access');
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Rafraîchit automatiquement le jeton d'accès expiré (401) une seule fois
let enCoursDeRafraichissement = false;
let filesAttente = [];

const traiterFileAttente = (erreur, token = null) => {
  filesAttente.forEach((prom) => (erreur ? prom.reject(erreur) : prom.resolve(token)));
  filesAttente = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requeteOriginale = error.config;
    if (error.response?.status === 401 && !requeteOriginale._retry) {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) {
        localStorage.clear();
        window.location.href = '/connexion';
        return Promise.reject(error);
      }

      if (enCoursDeRafraichissement) {
        return new Promise((resolve, reject) => {
          filesAttente.push({ resolve, reject });
        }).then((token) => {
          requeteOriginale.headers.Authorization = `Bearer ${token}`;
          return api(requeteOriginale);
        });
      }

      requeteOriginale._retry = true;
      enCoursDeRafraichissement = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/rafraichir/`, { refresh });
        localStorage.setItem('access', data.access);
        traiterFileAttente(null, data.access);
        requeteOriginale.headers.Authorization = `Bearer ${data.access}`;
        return api(requeteOriginale);
      } catch (err) {
        traiterFileAttente(err, null);
        localStorage.clear();
        window.location.href = '/connexion';
        return Promise.reject(err);
      } finally {
        enCoursDeRafraichissement = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;