# Ensemble - Application d'Organisation Familiale

Ensemble est une application web mobile-first conçue pour simplifier la gestion du quotidien des familles.

## Fonctionnalités
- **Gestion de Foyer** : Création de foyer, invitation de membres.
- **Calendrier Partagé** : Vue mensuelle et journalière des événements.
- **Tâches Familiales** : Liste de tâches partagées avec statut.
- **Design Mobile-First** : Interface optimisée pour smartphone.

## Stack Technique
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Base de données** : SQLite (Local) / PostgreSQL (Prod) via Prisma
- **Styling** : Tailwind CSS + shadcn/ui
- **Auth** : Auth.js (NextAuth v5)

## Installation Locale

1.  **Cloner le projet**
    ```bash
    git clone <url-du-repo>
    cd ensemble
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Configurer l'environnement**
    Créer un fichier `.env` à la racine :
    ```env
    DATABASE_URL="file:./dev.db"
    AUTH_SECRET="secret-random-string-min-32-chars" # openssl rand -base64 32
    ```

4.  **Initialiser la base de données**
    ```bash
    npx prisma db push
    ```

5.  **Lancer le serveur de développement**
    ```bash
    npm run dev
    ```
    L'application sera accessible sur `http://localhost:3000`.

## Déploiement (Vercel)

1.  Pousser le code sur GitHub.
2.  Créer un projet sur Vercel et lier le repo.
3.  Configurer une base de données Postgres (ex: Vercel Postgres, Neon, Supabase).
4.  Mettre à jour les variables d'environnement sur Vercel :
    - `DATABASE_URL` : URL de connexion Postgres.
    - `AUTH_SECRET` : Une chaîne aléatoire sécurisée.
5.  Redéployer.

## Structure du Projet
- `/src/app` : Pages et routes (Next.js App Router).
- `/src/components` : Composants React (UI et features).
- `/src/server` : Server Actions (Backend logic).
- `/prisma` : Schéma de base de données.
