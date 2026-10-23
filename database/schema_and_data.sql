-- ============================================================================
-- Système de Gestion de Ventes aux Enchères en Ligne
-- Script de création du schéma + données de test (compatible MySQL & PostgreSQL)
-- NOTE : En développement, Django génère automatiquement ce schéma via
--        `python manage.py migrate`. Ce script est fourni à titre de référence
--        et pour une mise en place manuelle du SGBDR.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS encheres_db;   -- (ligne ignorée par PostgreSQL, créez la base via psql/pgAdmin)
USE encheres_db;                             -- (ignorée par PostgreSQL)

-- ------------------------------------------------------------------
-- Table : catégories
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encheres_categorie (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    nom             VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    icone           VARCHAR(50) DEFAULT 'bi-tag',
    couleur         VARCHAR(20) DEFAULT '#6366f1',
    date_creation   DATETIME NOT NULL
);

-- ------------------------------------------------------------------
-- Table : utilisateurs (simplifiée — Django gère auth_user en réalité)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_user (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(150) NOT NULL UNIQUE,
    email           VARCHAR(254) NOT NULL,
    password        VARCHAR(255) NOT NULL,
    first_name      VARCHAR(150),
    last_name       VARCHAR(150),
    is_staff        BOOLEAN DEFAULT FALSE,
    is_superuser    BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    date_joined     DATETIME NOT NULL
);

-- ------------------------------------------------------------------
-- Table : articles aux enchères
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encheres_articleenchere (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    titre           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    prix_depart     DECIMAL(12, 2) NOT NULL CHECK (prix_depart > 0),
    prix_actuel     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    image           VARCHAR(255),
    image_url       VARCHAR(255),
    categorie_id    INTEGER NOT NULL,
    vendeur_id      INTEGER NOT NULL,
    date_debut      DATETIME NOT NULL,
    date_fin        DATETIME NOT NULL,
    statut          VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                    CHECK (statut IN ('EN_ATTENTE', 'ACTIVE', 'TERMINEE', 'ANNULEE')),
    date_creation   DATETIME NOT NULL,
    date_maj        DATETIME NOT NULL,
    CONSTRAINT fk_article_categorie FOREIGN KEY (categorie_id) REFERENCES encheres_categorie(id),
    CONSTRAINT fk_article_vendeur FOREIGN KEY (vendeur_id) REFERENCES auth_user(id),
    CONSTRAINT chk_dates CHECK (date_fin > date_debut)
);

-- ------------------------------------------------------------------
-- Table : enchères (offres placées)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encheres_enchere (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    article_id      INTEGER NOT NULL,
    encherisseur_id INTEGER NOT NULL,
    montant         DECIMAL(12, 2) NOT NULL CHECK (montant > 0),
    date_enchere    DATETIME NOT NULL,
    CONSTRAINT fk_enchere_article FOREIGN KEY (article_id) REFERENCES encheres_articleenchere(id) ON DELETE CASCADE,
    CONSTRAINT fk_enchere_user FOREIGN KEY (encherisseur_id) REFERENCES auth_user(id)
);

-- ------------------------------------------------------------------
-- Table : favoris
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS encheres_favori (
    id              INTEGER PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id  INTEGER NOT NULL,
    article_id      INTEGER NOT NULL,
    date_ajout      DATETIME NOT NULL,
    CONSTRAINT fk_favori_user FOREIGN KEY (utilisateur_id) REFERENCES auth_user(id),
    CONSTRAINT fk_favori_article FOREIGN KEY (article_id) REFERENCES encheres_articleenchere(id) ON DELETE CASCADE,
    CONSTRAINT uq_favori UNIQUE (utilisateur_id, article_id)
);

-- ============================================================================
-- DONNÉES DE TEST
-- ============================================================================

INSERT INTO auth_user (username, email, password, first_name, last_name, is_staff, is_superuser, is_active, date_joined)
VALUES
('admin',     'admin@encheres.mg',     'à-remplacer-par-un-hash-argon2', 'Admin',  'Système', TRUE,  TRUE,  TRUE, NOW()),
('vendeur1',  'vendeur1@encheres.mg',  'à-remplacer-par-un-hash-argon2', 'Rija',   'Rakoto',  FALSE, FALSE, TRUE, NOW()),
('acheteur1', 'acheteur1@encheres.mg', 'à-remplacer-par-un-hash-argon2', 'Fara',   'Rasoa',   FALSE, FALSE, TRUE, NOW());

INSERT INTO encheres_categorie (nom, description, icone, couleur, date_creation) VALUES
('Électronique',       'Ordinateurs, smartphones, gadgets',      'bi-laptop',    '#6366f1', NOW()),
('Art & Antiquités',   'Tableaux, sculptures, objets anciens',    'bi-palette',   '#ec4899', NOW()),
('Véhicules',          'Voitures, motos, utilitaires',            'bi-car-front', '#f59e0b', NOW()),
('Mode & Accessoires', 'Vêtements, sacs, chaussures de marque',   'bi-bag-heart', '#10b981', NOW()),
('Immobilier',         'Maisons, terrains, appartements',         'bi-house-door','#3b82f6', NOW()),
('Bijoux',             'Bagues, colliers, montres de luxe',       'bi-gem',       '#eab308', NOW());

INSERT INTO encheres_articleenchere
(titre, description, prix_depart, prix_actuel, categorie_id, vendeur_id, date_debut, date_fin, statut, date_creation, date_maj)
VALUES
('MacBook Pro M3 16 pouces', 'Ordinateur portable Apple, état neuf, garantie internationale.', 2200000, 2420000, 1, 2, NOW() - INTERVAL '5' DAY, NOW() + INTERVAL '5' DAY, 'ACTIVE', NOW(), NOW()),
('Toyota Land Cruiser 2019', 'Véhicule 4x4 entretenu, faible kilométrage, carnet à jour.', 85000000, 93500000, 3, 2, NOW() + INTERVAL '1' DAY, NOW() + INTERVAL '11' DAY, 'EN_ATTENTE', NOW(), NOW()),
('Villa vue mer Nosy Be', 'Villa 4 chambres avec accès direct à la plage.', 250000000, 250000000, 5, 2, NOW() + INTERVAL '2' DAY, NOW() + INTERVAL '17' DAY, 'EN_ATTENTE', NOW(), NOW());

-- Fin du script.
