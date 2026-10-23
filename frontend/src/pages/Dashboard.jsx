import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import api from '../api/axios';
import Loader from '../components/Loader';
import { formaterMontant } from '../components/ArticleCard';

const COULEURS_DEFAUT = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#eab308', '#ef4444'];

function CarteIndicateur({ icone, titre, valeur, couleurDe, couleurA, suffixe = '' }) {
  return (
    <div className="col-md-6 col-xl-3">
      <div
        className="card border-0 shadow-sm h-100 text-white indicateur-card"
        style={{ background: `linear-gradient(135deg, ${couleurDe}, ${couleurA})` }}
      >
        <div className="card-body d-flex align-items-center gap-3">
          <div className="indicateur-icone fs-3">
            <i className={`bi ${icone}`}></i>
          </div>
          <div>
            <div className="small opacity-75">{titre}</div>
            <div className="fs-3 fw-bold">{valeur}{suffixe}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.get('/dashboard/')
      .then(({ data }) => setDonnees(data))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <Loader texte="Calcul des statistiques..." />;
  if (!donnees) return <p className="text-center py-5 text-muted">Statistiques indisponibles.</p>;

  const evolutionFormatee = donnees.evolution_encheres.map((d) => ({
    ...d,
    jour: new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  }));

  // Calcul du total des articles présents dans la répartition par catégorie
  const totalArticlesCategories = donnees.repartition_categories.reduce((acc, curr) => acc + (curr.nb || 0), 0);

  // Fonction pour afficher le pourcentage directement sur chaque tranche de couleur
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, nb }) => {
    // Évite d'afficher si le pourcentage est nul ou insignifiant
    if (!percent || percent < 0.03) return null;

    const RADIAN = Math.PI / 180;
    // Positionnement du texte au milieu de l'anneau de la tranche
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const pourcentageReel = Math.round(percent * 100);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${pourcentageReel}%`}
      </text>
    );
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4">
        <i className="bi bi-bar-chart-line-fill me-2 text-gradient"></i>Tableau de bord
      </h3>

      {/* Cartes d'indicateurs clés */}
      <div className="row g-3 mb-4">
        <CarteIndicateur icone="bi-box-seam-fill" titre="Total des articles" valeur={donnees.total_articles} couleurDe="#6366f1" couleurA="#8b5cf6" />
        <CarteIndicateur icone="bi-broadcast" titre="Enchères actives" valeur={donnees.articles_actifs} couleurDe="#10b981" couleurA="#059669" />
        <CarteIndicateur icone="bi-hammer" titre="Offres totales" valeur={donnees.total_encheres} couleurDe="#f59e0b" couleurA="#ea580c" />
        <CarteIndicateur icone="bi-graph-up-arrow" titre="Taux de conversion" valeur={donnees.taux_conversion} suffixe="%" couleurDe="#ec4899" couleurA="#db2777" />
      </div>

      {/* Graphique évolution + Camembert avec pourcentages */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3"><i className="bi bi-graph-up me-2"></i>Évolution des enchères (14 derniers jours)</h6>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={evolutionFormatee}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="jour" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="nombre_encheres" name="Offres" stroke="#6366f1" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3"><i className="bi bi-pie-chart-fill me-2"></i>Répartition par catégorie</h6>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={donnees.repartition_categories}
                    dataKey="nb"
                    nameKey="nom"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={2}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {donnees.repartition_categories.map((entry, index) => (
                      <Cell key={index} fill={entry.couleur || COULEURS_DEFAUT[index % COULEURS_DEFAUT.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [
                    `${value} article(s) (${totalArticlesCategories ? Math.round((value / totalArticlesCategories) * 100) : 0}%)`,
                    name
                  ]} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 + Métriques détaillées */}
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3"><i className="bi bi-trophy-fill me-2"></i>Top 5 des articles les plus disputés</h6>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={donnees.top_articles} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis dataKey="titre" type="category" width={130} fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="nb" name="Nombre d'offres" fill="#ec4899" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-bold mb-3"><i className="bi bi-speedometer2 me-2"></i>Indicateurs clés</h6>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <span>Articles en attente</span>
                  <strong className="badge bg-warning text-dark fs-6">{donnees.articles_en_attente}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <span>Articles terminés</span>
                  <strong className="badge bg-secondary fs-6">{donnees.articles_termines}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <span>Articles annulés</span>
                  <strong className="badge bg-danger fs-6">{donnees.articles_annules}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <span>% d'enchères actives</span>
                  <strong className="text-primary">{donnees.taux_actives}%</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                  <span>Meilleure vente</span>
                  <strong className="text-success fs-6">{formaterMontant(donnees.meilleure_vente)}</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}