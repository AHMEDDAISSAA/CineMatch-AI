# CineMatch-AI

Système intelligent de recommandation de films et de séries, basé sur le dataset MovieLens.

## Approches

- **Content-Based Filtering** : recommandation selon les genres et les tags (TF-IDF + similarité cosinus).
- **Collaborative Filtering** : recommandation selon les interactions utilisateurs-films (SVD).
- **Hybrid Recommendation** : combinaison pondérée des deux approches, avec `alpha` réglé sur le jeu de validation.

## Équipe

| Membre | Rôle |
|---|---|
| Ahmed Aissa | Chef de projet et moteur hybride |
| Asma Limayem | Data Engineer (EDA, préparation des données) |
| Eya Hmad | Content-Based Filtering |
| Aziz Jomma | Collaborative Filtering et évaluation |

## Structure du projet

```text
CineMatch-AI/
├── data/
│   ├── raw/          # données brutes (non versionnées)
│   └── processed/    # données préparées
├── notebooks/        # notebooks d'analyse et d'expérimentation
├── src/              # code Python (modèles, évaluation)
├── backend/          # API FastAPI
├── frontend/         # interface React
├── docs/             # documentation et conventions
└── requirements.txt
```

## Installation

```bash
pip install -r requirements.txt
```

## Données

Télécharger **MovieLens Latest Small** depuis https://grouplens.org/datasets/movielens/ puis placer `movies.csv`, `ratings.csv`, `tags.csv` et `links.csv` dans `data/raw/`.

## Workflow Git

- Ne jamais pousser directement sur `main`.
- Une branche par tâche (ex. `asma/eda`, `eya/content`, `aziz/svd`).
- Passer par une Pull Request relue par le chef de projet.