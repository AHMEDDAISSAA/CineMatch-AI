"""User and movie clustering helpers for the unsupervised notebook."""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN, KMeans
from sklearn.metrics import silhouette_score
from sklearn.neighbors import NearestNeighbors

RANDOM_STATE = 42


def find_project_root(start: Path | None = None) -> Path:
    """Find the repository root from a notebook or source-file directory."""
    location = Path.cwd() if start is None else Path(start)
    for path in (location, *location.parents):
        if (path / "data" / "raw" / "movies.csv").exists():
            return path
    raise FileNotFoundError("Could not locate data/raw/movies.csv.")


def load_user_genre_data(
    project_root: Path | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, str, Path]:
    """Load Asma's matrix when present, otherwise derive genre shares from MovieLens."""
    root = find_project_root(project_root)
    raw_dir = root / "data" / "raw"
    processed_dir = root / "data" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    movies = pd.read_csv(raw_dir / "movies.csv")
    ratings = pd.read_csv(raw_dir / "ratings.csv")

    required_movie_columns = {"movieId", "genres"}
    required_rating_columns = {"userId", "movieId", "rating"}
    if not required_movie_columns.issubset(movies.columns):
        raise ValueError(f"movies.csv must contain {sorted(required_movie_columns)}")
    if not required_rating_columns.issubset(ratings.columns):
        raise ValueError(f"ratings.csv must contain {sorted(required_rating_columns)}")

    movies["movieId"] = movies["movieId"].astype(int)
    ratings["movieId"] = ratings["movieId"].astype(int)
    ratings["userId"] = ratings["userId"].astype(int)
    asma_path = processed_dir / "user_genre_matrix.csv"
    fallback_path = processed_dir / "user_genre_matrix_derived.csv"

    if asma_path.exists():
        matrix = pd.read_csv(asma_path)
        id_column = next(
            (
                column
                for column in ("userId", "user_id", "userid", "UserID")
                if column in matrix.columns
            ),
            None,
        )
        if id_column is None and len(matrix.columns) and str(matrix.columns[0]).startswith(
            "Unnamed:"
        ):
            id_column = matrix.columns[0]
        if id_column is None:
            raise ValueError(
                "Asma's matrix needs a userId/user_id column or an exported index column."
            )
        matrix = matrix.rename(columns={id_column: "userId"})
        source = "data/processed/user_genre_matrix.csv (Asma)"
    else:
        movie_genres = movies[["movieId", "genres"]].copy()
        movie_genres["genres"] = movie_genres["genres"].fillna("")
        exploded = ratings.merge(
            movie_genres, on="movieId", how="inner", validate="many_to_one"
        )
        exploded["genre"] = exploded["genres"].str.split("|")
        exploded = exploded.explode("genre")
        exploded["genre"] = exploded["genre"].str.strip()
        exploded = exploded[
            exploded["genre"].ne("") & exploded["genre"].ne("(no genres listed)")
        ].copy()
        exploded["genre_weight"] = 1 / exploded.groupby(
            ["userId", "movieId"]
        )["genre"].transform("count")

        matrix = exploded.pivot_table(
            index="userId",
            columns="genre",
            values="genre_weight",
            aggfunc="sum",
            fill_value=0,
        )
        rated_movie_counts = ratings.groupby("userId")["movieId"].nunique()
        matrix = matrix.div(rated_movie_counts, axis="index").fillna(0)
        matrix = matrix.reindex(index=sorted(ratings["userId"].unique()), fill_value=0)
        matrix.index.name = "userId"
        matrix = matrix.reset_index()
        matrix.to_csv(fallback_path, index=False, lineterminator="\n")
        source = "ratings.csv + movies.csv (derived fallback)"

    if "userId" not in matrix.columns:
        raise ValueError("The user genre matrix is missing its userId column.")
    if matrix["userId"].duplicated().any():
        raise ValueError("The user genre matrix must contain one row per user.")
    matrix["userId"] = matrix["userId"].astype(int)
    matrix = matrix.sort_values("userId").reset_index(drop=True)
    genre_columns = [column for column in matrix.columns if column != "userId"]
    if not genre_columns:
        raise ValueError("The user genre matrix has no genre feature columns.")
    matrix[genre_columns] = matrix[genre_columns].apply(pd.to_numeric, errors="coerce")
    if matrix[genre_columns].isna().any().any():
        raise ValueError("Genre feature columns must contain only numeric values.")
    if not np.isfinite(matrix[genre_columns].to_numpy(dtype=float)).all():
        raise ValueError("The user genre matrix contains infinite values.")
    if len(matrix) < 3 or len(genre_columns) < 2:
        raise ValueError("Clustering needs at least 3 users and 2 genre features.")

    return matrix, movies, ratings, source, fallback_path


def evaluate_kmeans(
    features: np.ndarray,
    max_k: int = 10,
) -> tuple[pd.DataFrame, KMeans]:
    """Evaluate K-Means with inertia and silhouette, then refit the best k."""
    upper_k = min(max_k, len(features) - 1)
    if upper_k < 2:
        raise ValueError("At least 3 user rows are required to evaluate K-Means.")

    rows = []
    for k in range(2, upper_k + 1):
        model = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=20)
        labels = model.fit_predict(features)
        rows.append(
            {
                "k": k,
                "inertia": float(model.inertia_),
                "silhouette": float(silhouette_score(features, labels)),
            }
        )
    scores = pd.DataFrame(rows)
    best_k = int(scores.loc[scores["silhouette"].idxmax(), "k"])
    best_model = KMeans(
        n_clusters=best_k, random_state=RANDOM_STATE, n_init=20
    ).fit(features)
    return scores, best_model


def fit_dbscan(
    features: np.ndarray,
    min_samples_values: tuple[int, ...] = (4, 5, 8, 10),
) -> tuple[DBSCAN, pd.DataFrame, dict[int, np.ndarray]]:
    """Choose DBSCAN parameters by non-noise silhouette weighted by coverage."""
    quantiles = np.linspace(0.80, 0.98, 10)
    candidate_rows = []
    distance_curves: dict[int, np.ndarray] = {}

    for min_samples in min_samples_values:
        if min_samples >= len(features):
            continue
        neighbors = NearestNeighbors(n_neighbors=min_samples).fit(features)
        distances = np.sort(neighbors.kneighbors(features)[0][:, -1])
        distance_curves[min_samples] = distances
        eps_values = np.unique(np.quantile(distances, quantiles))

        for eps in eps_values:
            model = DBSCAN(eps=float(eps), min_samples=min_samples)
            labels = model.fit_predict(features)
            clustered = labels != -1
            cluster_count = len(set(labels[clustered]))
            coverage = float(clustered.mean())
            if cluster_count < 2 or clustered.sum() <= cluster_count:
                continue
            score = float(silhouette_score(features[clustered], labels[clustered]))
            candidate_rows.append(
                {
                    "eps": float(eps),
                    "min_samples": min_samples,
                    "clusters": cluster_count,
                    "coverage": coverage,
                    "silhouette": score,
                    "selection_score": score * coverage,
                }
            )

    candidates = pd.DataFrame(candidate_rows)
    if not candidates.empty:
        best = candidates.sort_values(
            ["selection_score", "coverage", "silhouette"],
            ascending=False,
        ).iloc[0]
        selected = DBSCAN(
            eps=float(best["eps"]), min_samples=int(best["min_samples"])
        ).fit(features)
    else:
        fallback_min_samples = min(5, len(features) - 1)
        fallback_distances = distance_curves.get(fallback_min_samples)
        if fallback_distances is None:
            neighbors = NearestNeighbors(n_neighbors=fallback_min_samples).fit(features)
            fallback_distances = np.sort(
                neighbors.kneighbors(features)[0][:, -1]
            )
            distance_curves[fallback_min_samples] = fallback_distances
        fallback_eps = float(np.quantile(fallback_distances, 0.90))
        selected = DBSCAN(
            eps=fallback_eps, min_samples=fallback_min_samples
        ).fit(features)

    return selected, candidates, distance_curves


def compare_clusterings(
    features: np.ndarray,
    label_sets: dict[str, np.ndarray],
) -> pd.DataFrame:
    """Compare cluster count, noise share, and silhouette for each algorithm."""
    rows = []
    for algorithm, labels in label_sets.items():
        labels = np.asarray(labels)
        clustered = labels != -1
        cluster_count = len(set(labels[clustered]))
        score = np.nan
        if cluster_count >= 2 and clustered.sum() > cluster_count:
            score = float(silhouette_score(features[clustered], labels[clustered]))
        rows.append(
            {
                "algorithm": algorithm,
                "clusters_excluding_noise": cluster_count,
                "noise_share": float((~clustered).mean()),
                "silhouette_excluding_noise": score,
            }
        )
    return pd.DataFrame(rows)


def profile_segments(
    matrix: pd.DataFrame,
    ratings: pd.DataFrame,
    label_sets: dict[str, np.ndarray],
) -> pd.DataFrame:
    """Summarize genre preferences, rating activity, and a business label."""
    genre_columns = [column for column in matrix.columns if column != "userId"]
    user_stats = ratings.groupby("userId")["rating"].agg(
        mean_rating="mean", ratings_count="count"
    )
    user_stats["mean_rating"] = user_stats["mean_rating"].round(2)
    user_stats["ratings_count"] = user_stats["ratings_count"].astype(int)
    matrix_by_user = matrix.set_index("userId")[genre_columns]
    rows = []

    for algorithm, labels in label_sets.items():
        assignment = pd.DataFrame({"userId": matrix["userId"], "cluster": labels})
        for cluster_id, members in assignment.groupby("cluster", sort=True):
            user_ids = members["userId"].tolist()
            genre_means = matrix_by_user.loc[user_ids].mean().sort_values(
                ascending=False
            )
            top_genres = [
                str(genre)
                for genre in genre_means.head(3).index
                if genre_means[genre] > 0
            ]
            if cluster_id == -1:
                business_name = "Profils atypiques (bruit DBSCAN)"
            elif len(user_ids) < 5:
                business_name = "Micro-segment à investiguer"
            elif len(top_genres) >= 2 and len(
                set(top_genres) & {"Action", "Adventure", "Thriller", "Crime"}
            ) >= 2:
                business_name = "Amateurs de sensations fortes"
            elif len(top_genres) >= 2 and len(
                set(top_genres) & {"Comedy", "Romance", "Children", "Animation"}
            ) >= 2:
                business_name = "Recherche de divertissement familial"
            elif len(top_genres) >= 2 and len(
                set(top_genres) & {"Documentary", "War", "History"}
            ) >= 2:
                business_name = "Curieux et passionnés d'histoire"
            elif {"Comedy", "Drama"}.issubset(top_genres):
                business_name = "Cinéphiles grand public"
            elif set(top_genres) & {"Drama", "Romance"}:
                business_name = "Amateurs d'émotions et de récits"
            else:
                business_name = "Cinéphiles éclectiques"
            if cluster_id != -1 and top_genres:
                business_name = f"{business_name} — {', '.join(top_genres)}"

            stats = user_stats.reindex(user_ids)
            rows.append(
                {
                    "algorithm": algorithm,
                    "cluster": int(cluster_id),
                    "business_name": business_name,
                    "users": len(user_ids),
                    "top_genres": ", ".join(top_genres) if top_genres else "Aucun genre dominant",
                    "mean_rating": round(float(stats["mean_rating"].mean()), 2),
                    "mean_ratings_per_user": round(
                        float(stats["ratings_count"].mean()), 1
                    ),
                }
            )
    return pd.DataFrame(rows)


def cluster_movies(
    movies: pd.DataFrame,
    n_clusters: int = 8,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Bonus: cluster movies from binary genre indicators and summarize groups."""
    movie_data = movies[["movieId", "title", "genres"]].copy()
    movie_data["genres"] = movie_data["genres"].fillna("")
    exploded = movie_data[["movieId", "genres"]].assign(
        genre=lambda frame: frame["genres"].str.split("|")
    ).explode("genre")
    exploded["genre"] = exploded["genre"].str.strip()
    exploded = exploded[
        exploded["genre"].ne("") & exploded["genre"].ne("(no genres listed)")
    ]
    features = pd.crosstab(exploded["movieId"], exploded["genre"]).clip(upper=1)
    features = features.reindex(movie_data["movieId"], fill_value=0)
    cluster_count = min(n_clusters, len(features) - 1)
    if cluster_count < 2:
        raise ValueError("Movie clustering needs at least 3 movies.")

    labels = KMeans(
        n_clusters=cluster_count, random_state=RANDOM_STATE, n_init=10
    ).fit_predict(features.to_numpy(dtype=float))
    movie_data["cluster"] = labels
    summaries = []
    for cluster_id, group in movie_data.groupby("cluster", sort=True):
        member_ids = group["movieId"]
        genre_counts = features.loc[member_ids].sum().sort_values(ascending=False)
        summaries.append(
            {
                "cluster": int(cluster_id),
                "movies": len(group),
                "top_genres": ", ".join(genre_counts.head(3).index.astype(str)),
                "example_titles": " | ".join(group["title"].head(5).tolist()),
            }
        )
    return movie_data, pd.DataFrame(summaries)
