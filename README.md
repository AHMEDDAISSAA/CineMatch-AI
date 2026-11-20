# CineMatch-AI

Système intelligent de recommandation de films et de séries, basé sur le dataset MovieLens. Le projet combine du Machine Learning (supervisé, non supervisé, recommandation), une API FastAPI et une application web React.

## Approches

- **Content-Based Filtering** : recommandation selon les genres et les tags (TF-IDF + similarité cosinus).
- **Collaborative Filtering** : recommandation selon les interactions utilisateurs-films (SVD).
- **Hybrid Recommendation** : `score = alpha × collaboratif + (1 − alpha) × content`, avec `alpha` réglé sur le jeu de validation.
- **Volet A (supervisé)** : classification « aime / n'aime pas » (note ≥ 4) et régression de la note.
- **Volet B (non supervisé)** : segmentation des utilisateurs (ACP, K-Means, CAH, DBSCAN).

## Équipe

| Membre | Rôle |
|---|---|
| Ahmed Aissa | Chef de projet, moteur hybride, API FastAPI, rapport |
| Asma Limayem | Data Engineer (EDA, préparation des données, variables des volets A et B) |
| Eya Hmad | Content-Based Filtering, volet B (clustering) |
| Aziz Jomma | Évaluation, volet A (supervisé), SVD, **frontend React** |

## Structure du projet

```text
CineMatch-AI/
├── data/
│   ├── raw/          # données brutes (non versionnées)
│   └── processed/    # données préparées
├── notebooks/        # notebooks d'analyse et d'expérimentation
├── src/              # code Python (split, modèles, évaluation, hybride)
├── tests/            # tests automatiques
├── backend/          # API FastAPI
├── frontend/         # application React (Vite)
├── docs/             # documentation, conventions, plan du rapport
└── requirements.txt
```

## Installation

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows PowerShell (la ligne doit commencer par (.venv))
pip install -r requirements.txt
```

## Données

Télécharger **MovieLens Latest Small** : https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
puis placer `movies.csv`, `ratings.csv`, `tags.csv` et `links.csv` dans `data/raw/`.

Vérification : `ratings.csv` doit avoir **100 836 lignes**, **610 utilisateurs** et `movies.csv` **9 742 films**. Si ce n'est pas le cas, ce n'est pas la bonne version (32M, 25M...).

## Règles du projet

Voir `docs/conventions.md`. L'essentiel :

- Split **temporel par utilisateur** : 80 % des notes les plus anciennes en Train, 10 % en Validation, 10 % les plus récentes en Test (`from src.split import temporal_split`).
- Le Test n'est jamais utilisé pour entraîner ni pour choisir un paramètre. Les statistiques basées sur les notes sont calculées uniquement sur Train.
- Chaque modèle expose `get_scores(user_id, movie_ids) -> {movieId: score}` avec des scores entre 0 et 1.

## API (backend)

Lancer l'API depuis la **racine** du projet, avec `(.venv)` actif :

```bash
uvicorn backend.main:app --reload
```

- API : http://localhost:8000
- Documentation interactive (tester les endpoints) : http://localhost:8000/docs

Pour l'instant, les scores sont **faux** (valeurs aléatoires reproductibles). Les vrais modèles seront branchés plus tard **sans changer les endpoints ni le format des réponses** : le frontend n'aura donc rien à modifier.

### Endpoints

| Méthode | URL | Rôle |
|---|---|---|
| GET | `/recommendations/{user_id}?alpha=0.5&top_n=10` | Top N films pour un utilisateur (`user_id` de 1 à 610, `alpha` de 0 à 1) |
| GET | `/movies/search?q=matrix&limit=20` | Recherche de films par titre |
| GET | `/movies/{movie_id}/similar?top_n=10` | Films proches d'un film donné |
| POST | `/recommendations/new-user` | Nouvel utilisateur (cold start) : recommandations selon des genres choisis |
| GET | `/metrics` | Résultats des modèles pour la page de démonstration |

### Format des réponses

`GET /recommendations/{user_id}` et `GET /movies/{movie_id}/similar` :
```json
[
  {"movie_id": 1, "title": "Toy Story (1995)", "genres": "Adventure|Animation|Children|Comedy|Fantasy", "score": 0.8231}
]
```

`GET /movies/search` (sans score) :
```json
[
  {"movie_id": 2571, "title": "Matrix, The (1999)", "genres": "Action|Sci-Fi|Thriller"}
]
```

`POST /recommendations/new-user`, corps de la requête :
```json
{"genres": ["Sci-Fi", "Comedy"], "top_n": 10}
```
Réponse : même liste que les recommandations (avec `score`).

`GET /metrics` :
```json
{"note": "valeurs de démonstration", "models": [{"name": "baseline", "rmse": null, "mae": null}]}
```
Les valeurs `null` seront remplies quand les modèles seront évalués : l'interface doit afficher « non disponible » pour une valeur `null`.

Le champ `genres` est une chaîne séparée par `|` : à découper côté frontend (`genres.split("|")`).

Genres disponibles pour le cold start : Action, Adventure, Animation, Children, Comedy, Crime, Documentary, Drama, Fantasy, Film-Noir, Horror, IMAX, Musical, Mystery, Romance, Sci-Fi, Thriller, War, Western.

## Frontend (React) : tâches d'Aziz

Branche : `aziz/front`. Dossier : `frontend/`.

### Démarrage

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```
Si Vite signale que le dossier n'est pas vide (il contient un `.gitkeep`), choisir **Ignore files and continue**. L'application tourne sur http://localhost:5173, l'API sur http://localhost:8000 (le CORS est déjà autorisé pour les ports 5173 et 3000).

Ne jamais commiter `node_modules` ni `dist` (le `.gitignore` généré par Vite dans `frontend/` s'en charge).

### Appeler l'API

```js
const API = "http://localhost:8000";

const res = await fetch(`${API}/recommendations/${userId}?alpha=${alpha}&top_n=10`);
const films = await res.json();
```

### Écrans à réaliser

1. **Recommandations** : choisir un `userId` (1 à 610), un curseur `alpha` (0 à 1, pas de 0,1), afficher le top 10 (titre, genres, score).
2. **Recherche** : barre de recherche par titre, liste de résultats.
3. **Films similaires** : en cliquant sur un film, afficher `/movies/{id}/similar`.
4. **Nouvel utilisateur (cold start)** : cases à cocher de genres, bouton qui envoie `POST /recommendations/new-user`.
5. **Résultats des modèles** : tableau à partir de `/metrics` (afficher « non disponible » pour `null`).

À gérer partout : état de chargement, message d'erreur si l'API est arrêtée, liste vide.

### Ordre de travail conseillé

1. Écran 1 (recommandations) avec les faux scores de l'API.
2. Écrans 2 et 3.
3. Écran 4 (cold start).
4. Écran 5 (métriques).
5. Plus tard : explication de chaque recommandation (genres communs) et mise en forme finale pour la démonstration.

Le mobile (React Native) n'est fait que s'il reste du temps à la fin.

## Tests

```bash
python -m pytest tests -q
```

## Workflow Git

- Ne jamais pousser directement sur `main`.
- Une branche par tâche, nommée `prenom/sujet` (ex. `asma/features`, `eya/content`, `aziz/front`).
- Avant de commencer : `git checkout main`, `git pull`, puis `git checkout -b prenom/sujet`.
- Passer par une Pull Request relue par le chef de projet.
- Ne pas lancer les notebooks d'une autre personne sur sa branche : cela modifie le fichier.