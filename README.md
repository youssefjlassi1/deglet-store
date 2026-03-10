## Documentation du projet

Ce document explique à quoi servent les **principaux fichiers et dossiers** côté **frontend (Angular)** et **backend (NestJS)**, pour que quelqu’un qui découvre le projet puisse comprendre rapidement la structure.

---

## 1. Frontend – Angular (`frontend/`)

- **`frontend/src/main.ts`**  
  Point d’entrée Angular. Démarre l’application en important la configuration (`app.config.ts`) et le composant racine `App`.

- **`frontend/src/index.html`**  
  Fichier HTML “shell” de l’application (balise `<app-root>`), chargé par le navigateur.  

- **`frontend/src/styles.scss`**  
  Styles globaux de l’application (variables, resets, typographie, etc.).

### 1.1. App racine (`frontend/src/app/`)

- **`app.ts`**  
  Composant racine Angular (`App`). Gère :
  - l’affichage général (layout principal),
  - l’état d’authentification (via `AuthService`, `AuthUiService`),
  - le panier (via `CartService`),
  - l’ouverture/fermeture de la modale d’authentification,
  - le scroll vers la section panier.

- **`app.html`**  
  Template HTML du composant `App` (header, router-outlet, liens de navigation, boutons login/logout, etc.).

- **`app.scss`**  
  Styles spécifiques au layout/app racine (header, navigation, placement du contenu, etc.).

- **`app.config.ts`**  
  Configuration de l’application Angular (routes, providers globaux, etc. selon la version Angular utilisée).

- **`app.routes.ts`**  
  Définition des routes de l’application (par exemple `home`, `products`, `cart`, `about`, `contact`, éventuellement `admin`).

- **`app.spec.ts`**  
  Fichier de tests unitaires pour le composant racine `App`.

### 1.2. Cœur de l’app (`frontend/src/app/core/`)

Ce dossier contient la **logique métier partagée** (services, modèles, etc.).

- **`auth.service.ts`**  
  Service d’authentification : login, logout, gestion du token JWT / session, communication avec l’API NestJS.

- **`auth-ui.service.ts`**  
  Service UI pour l’authentification : ouvre/ferme la modale d’auth (état `isAuthModalOpen`, etc.).

- **`cart.service.ts`**  
  Service de panier : ajoute/supprime des produits, calcule le nombre d’articles, expose les données utilisées par le frontend.

- **`api.service.ts`**  
  Service générique pour communiquer avec le backend (requêtes HTTP centralisées : GET/POST/PUT/DELETE).

- **`toast.service.ts`**  
  Service pour gérer les messages/toasts (succès, erreurs, infos) affichés via le composant `ToastComponent`.

- **`models.ts`**  
  Définit les interfaces/types TypeScript utilisés dans l’app (ex : `Product`, `Order`, `User`, etc.), pour taper correctement les données.

### 1.3. Garde de route (`frontend/src/app/guards/`)

- **`admin.guard.ts`**  
  Garde de route Angular qui protège les pages réservées à l’admin. Vérifie probablement le rôle de l’utilisateur (admin) avant d’autoriser l’accès à certaines routes.

### 1.4. Composants partagés (`frontend/src/app/components/`)

#### 1.4.1. Composant Auth Modal

- **`components/auth-modal/auth-modal.ts`**  
  Composant Angular réutilisable qui affiche une modale de connexion/inscription (champs email/mot de passe, boutons, etc.). Utilise `AuthService` et `AuthUiService`.

- **`components/auth-modal/auth-modal.html`**  
  Template HTML de la modale d’authentification.

- **`components/auth-modal/auth-modal.scss`**  
  Styles de la modale (overlay, centering, boutons, formulaires).

- **`components/auth-modal/auth-modal.spec.ts`**  
  Tests unitaires du composant `AuthModal`.

#### 1.4.2. Composant Toast

- **`components/toast/toast.component.ts`**  
  Composant d’affichage des toasts (messages d’erreur, succès…). Il se connecte au `ToastService`.

- **`components/toast/toast.component.html`**  
  Template HTML des toasts (conteneur, message, icône, bouton de fermeture).

- **`components/toast/toast.component.scss`**  
  Styles des notifications (position, couleurs selon le type, animations).

#### 1.4.3. Composant Chatbot

- **`components/chatbot-widget/chatbot-widget.ts`**  
  Composant Angular “widget chatbot” (bouton flottant / fenêtre de chat pour l’utilisateur).

- **`components/chatbot-widget/chatbot-widget.html`**  
  Template HTML du widget (zone de messages, input, bouton envoyer, etc.).

- **`components/chatbot-widget/chatbot-widget.scss`**  
  Styles du widget (position fixe, bulles de dialogue, apparence générale).

### 1.5. Pages (`frontend/src/app/pages/`)

Les pages sont des composants reliés directement aux **routes**.

- **`home-page.component.ts` / `.html` / `.scss`**  
  Ancienne ou principale page d’accueil (présentation générale du site, mise en avant des produits).

- **`home-page-new.component.ts` / `.html` / `.scss`**  
  Nouvelle version de la page d’accueil (refonte ou design plus récent).  
  Peut coexister avec l’ancienne pour faciliter les tests ou la transition.

- **`products-page.component.ts` / `.html` / `.scss`**  
  Page de liste des produits (catalogue).  
  Affiche les produits récupérés via l’`ApiService` ou un service dédié, permet d’ajouter au panier, filtrer, etc.

- **`cart-page/cart-page.ts` / `.html` / `.scss`**  
  Page panier. Affiche le contenu du panier, permet de modifier les quantités, supprimer des items et passer à la commande.

- **`about-page.component.ts` / `.html` / `.scss`**  
  Page “À propos” : texte sur l’entreprise, l’origine des dattes, l’histoire, etc.

- **`contact-page.component.ts` / `.html` / `.scss`**  
  Page “Contact” : formulaire de contact, informations, carte éventuelle.

- **`admin-page.component.ts` / `.html` / `.scss`**  
  Page d’administration.  
  - Accès protégé (via `admin.guard.ts` + auth).  
  - Permet de gérer les produits, voir les commandes, statistiques, etc.  
  - Le fichier SCSS est volumineux car il contient tout le style du tableau de bord admin.

---

## 2. Backend – NestJS (`backend/`)

- **`backend/src/main.ts`**  
  Point d’entrée NestJS : démarre l’application, configure le port, CORS, etc.

- **`backend/src/app.module.ts`**  
  Module racine NestJS.  
  - Charge la config (`ConfigModule`),  
  - Configure TypeORM (connexion Postgres, autoLoadEntities, synchronize, etc.),  
  - Importe les modules fonctionnels : `UsersModule`, `AuthModule`, `ProductsModule`, `OrdersModule`, `DashboardModule`,  
  - Enregistre `AppController`, `AppService`, `SeedService`.

- **`backend/src/app.controller.ts` / `app.service.ts`**  
  Contrôleur et service génériques de l’app (routes simples de test ou endpoints racine comme `/`).

- **`backend/src/app.controller.spec.ts`**  
  Tests unitaires pour `AppController`.

- **`backend/src/seed.service.ts`**  
  Service pour insérer des données de test / initiales en base (produits, admin de base, etc.).

### 2.1. Authentification (`backend/src/auth/`)

- **`auth.module.ts`**  
  Module d’authentification. Regroupe service, contrôleur, stratégie JWT, guards, DTOs.

- **`auth.controller.ts`**  
  Contrôleur pour les routes d’auth (ex : `/auth/login`, `/auth/register`, `/auth/profile`, etc.).

- **`auth.service.ts`**  
  Service qui gère la logique d’authentification : vérification des identifiants, génération et validation du token JWT, enregistrement des utilisateurs, etc.

- **`jwt.strategy.ts`**  
  Stratégie JWT (Passport) utilisée par Nest pour valider les tokens sur les routes protégées.

- **`guards/jwt-auth.guard.ts`**  
  Guard qui protège les routes nécessitant un utilisateur authentifié. Vérifie le token JWT.

- **`guards/roles.guard.ts`**  
  Guard qui contrôle les rôles (admin, user, etc.) pour restreindre certaines routes.

- **`decorators/roles.decorator.ts`**  
  Décorateur personnalisé `@Roles(...)` utilisé dans les contrôleurs pour déclarer les rôles requis.

- **`interfaces/jwt-payload.interface.ts`**  
  Interface TypeScript qui décrit le contenu du payload JWT (ex : `sub`, `email`, `role`, etc.).

- **`dto/login.dto.ts`**  
  DTO pour la connexion (shape des données reçues au login : email, password, etc.).

- **`dto/register.dto.ts`**  
  DTO pour l’inscription (nom, email, mot de passe, etc.).

### 2.2. Utilisateurs (`backend/src/users/`)

- **`users.module.ts`**  
  Module qui encapsule toute la logique liée aux utilisateurs (service, entité, éventuellement contrôleur si présent).

- **`users.service.ts`**  
  Service pour les utilisateurs : création, recherche, mise à jour, etc.

- **`entities/user.entity.ts`**  
  Entité TypeORM représentant la table `users` (colonnes, relations avec orders, rôle, etc.).

### 2.3. Produits (`backend/src/products/`)

- **`products.module.ts`**  
  Module pour la gestion des produits.

- **`products.controller.ts`**  
  Contrôleur pour les routes produits (ex : `/products`, `/products/:id`).

- **`products.service.ts`**  
  Service qui contient la logique métier pour les produits (CRUD, recherche, etc.).

- **`entities/product.entity.ts`**  
  Entité TypeORM représentant la table `products` (nom, prix, description, stock, etc.).

- **`dto/create-product.dto.ts`**  
  DTO pour la création d’un produit.

- **`dto/update-product.dto.ts`**  
  DTO pour la mise à jour d’un produit.

### 2.4. Commandes (`backend/src/orders/`)

- **`orders.module.ts`**  
  Module pour la gestion des commandes.

- **`orders.controller.ts`**  
  Contrôleur pour les routes de commandes (ex : `/orders`, `/orders/:id`, mise à jour du statut).

- **`orders.service.ts`**  
  Service qui gère la logique métier des commandes (création, changement de statut, récupération des listes, etc.).

- **`entities/order.entity.ts`**  
  Entité TypeORM pour la commande (référence utilisateur, items, total, statut, etc.).

- **`entities/order-item.entity.ts`**  
  Entité TypeORM pour les lignes d’une commande (produit, quantité, prix unitaire).

- **`dto/create-order.dto.ts`**  
  DTO pour créer une commande.

- **`dto/update-order-status.dto.ts`**  
  DTO pour mettre à jour le statut d’une commande.

- **`enums/order-status.enum.ts`**  
  Enumération TypeScript listant les différents statuts possibles d’une commande (ex : `PENDING`, `PAID`, `SHIPPED`, etc.).

### 2.5. Dashboard / Statistiques (`backend/src/dashboard/`)

- **`dashboard.module.ts`**  
  Module dédié au tableau de bord/admin (statistiques, agrégations, etc.).

- **`dashboard.controller.ts`**  
  Contrôleur pour les endpoints de dashboard (chiffre d’affaires, nombre de commandes, etc.).

- **`dashboard.service.ts`**  
  Service qui calcule les indicateurs et récupère les données nécessaires au dashboard.

### 2.6. Commun (`backend/src/common/`)

- **`common/enums/user-role.enum.ts`**  
  Enumération des rôles utilisateurs (`ADMIN`, `USER`, etc.), partagée dans tout le backend (auth, guards, modules).

---

## 3. Comment utiliser ce README

- **Pour comprendre le frontend (Angular)** :  
  1. Commencer par `app.ts`, `app.routes.ts`, puis regarder les pages dans `app/pages/`.  
  2. Regarder les services dans `app/core/` (auth, panier, API) pour voir la logique métier.  
  3. Voir les composants partagés dans `app/components/` (modale auth, toasts, chatbot).

- **Pour comprendre le backend (NestJS)** :  
  1. Lire `app.module.ts` pour voir les modules principaux.  
  2. Pour chaque domaine (auth, users, products, orders, dashboard), ouvrir le module correspondant et son `controller` + `service` + `entities` + `dto`.  
  3. Les enums et interfaces partagées se trouvent dans `auth/interfaces`, `orders/enums`, `common/enums`.

Si tu ajoutes de nouveaux modules/fichiers, tu peux suivre la même structure et les documenter ici pour garder le projet clair pour les futurs développeurs.

# Dhaoui Dattes Platform

Plateforme e-commerce complète pour une société de dattes avec:
- Frontend Angular moderne pour les clients
- Backend NestJS avec API REST
- PostgreSQL dans Docker
- Dashboard administrateur pour suivre les commandes, le stock et les KPI

## Structure
- frontend: application Angular
- backend: API NestJS
- docker-compose.yml: base PostgreSQL

## Comptes démo
- Admin: admin@dhaouidattes.com / Admin123!
- Client: client@dhaouidattes.com / Client123!

## Lancer le projet

### 1. Base de données PostgreSQL
Depuis la racine:
- `docker compose up -d`
- PostgreSQL Docker est exposé sur `localhost:5433` pour éviter un conflit avec un PostgreSQL local Windows sur `5432`

### 2. Backend NestJS
- Copier `backend/.env.example` vers `backend/.env`
- Aller dans `backend`
- `npm install`
- `npm run start:dev`

API: http://localhost:3000/api

### 3. Frontend Angular
- Aller dans `frontend`
- `npm install`
- `npm start`

Application: http://localhost:4200

## Fonctionnalités livrées

### Côté client
- Catalogue produits premium
- Inscription et connexion
- Panier local et checkout
- Création de commande
- Historique des commandes

### Côté admin
- Dashboard KPI
- Liste des commandes
- Changement de statut des commandes
- Création de produits
- Mise en avant de produits
- Réapprovisionnement rapide du stock

## API principale
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/products`
- `POST /api/orders`
- `GET /api/orders/mine`
- `GET /api/orders` admin
- `PATCH /api/orders/:id/status` admin
- `GET /api/dashboard/summary` admin

## Remarques
- Les données initiales sont injectées automatiquement au démarrage du backend.
- TypeORM est configuré avec `synchronize: true` pour accélérer le prototype.
- Pour la production, il faudra ajouter migrations, paiement, upload images, logs et sécurité avancée.
