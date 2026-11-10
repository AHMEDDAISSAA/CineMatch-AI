# Conventions du projet CineMatch-AI

## Données
- Dataset : **MovieLens Latest Small** (`movies.csv`, `ratings.csv`, `tags.csv`, `links.csv`), à placer dans `data/raw/`.
- Identifiants : `userId` et `movieId` en `int64` partout.
- Fichiers préparés (dans `data/processed/`, produits par Asma) :
  `movies_content.csv`, `ratings_cf.csv`, `train.csv`, `validation.csv`, `test.csv`.

## Protocole d'évaluation
- Split temporel par utilisateur : anciennes notes en Train, avant-dernière en Validation, dernière en Test.
- Les utilisateurs avec moins de 3 notes restent dans Train.
- Métriques : RMSE, MAE, Precision@10, Recall@10, NDCG@10.

## Règles anti Data Leakage
1. Le Test n'est jamais utilisé pour entraîner ni pour choisir un paramètre.
2. Les statistiques basées sur les notes sont calculées uniquement sur Train.
3. `alpha` du modèle hybride est réglé uniquement sur Validation.

## Interface des modèles (pour le moteur hybride)
Chaque modèle expose une fonction :

    get_scores(user_id, movie_ids) -> dict {movieId: score}

Les scores sont **normalisés entre 0 et 1**.

## Code
- Un fichier par modèle dans `src/` : `content_based.py`, `collaborative.py`, `evaluation.py`, `hybrid.py`.
- Notebooks : `01_data_analysis.ipynb`, `02_data_preprocessing.ipynb`, etc.
- Même version de Python pour toute l'équipe : à confirmer ensemble.

## Git
- Jamais de push direct sur `main`.
- Une branche par tâche : `prenom/sujet` (ex. `asma/eda`).
- Pull Request relue par Ahmed avant fusion.
- Messages de commit clairs, en une ligne.