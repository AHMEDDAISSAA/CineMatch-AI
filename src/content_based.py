
"""
CineMatch-AI
Content-Based Filtering
Author: Eya Hmad

User profiles are built exclusively from train.csv.
"""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# --------------------------------------------------
# 1. Load datasets
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

MOVIES_PATH = PROJECT_ROOT / "data" / "raw" / "movies.csv"
TRAIN_PATH = PROJECT_ROOT / "data" / "processed" / "train.csv"

movies = pd.read_csv(MOVIES_PATH)
train = pd.read_csv(TRAIN_PATH)

# Keep identifiers consistent
movies["movieId"] = movies["movieId"].astype("int64")
train["userId"] = train["userId"].astype("int64")
train["movieId"] = train["movieId"].astype("int64")

# Check required columns
required_movie_columns = {"movieId", "genres"}
required_train_columns = {"userId", "movieId", "rating"}

if not required_movie_columns.issubset(movies.columns):
    raise ValueError("movies.csv must contain movieId and genres")

if not required_train_columns.issubset(train.columns):
    raise ValueError("train.csv must contain userId, movieId and rating")


# --------------------------------------------------
# 2. Prepare movie content
# --------------------------------------------------

movies["genres"] = movies["genres"].fillna("")

movies["content_text"] = (
    movies["genres"]
    .str.replace("|", " ", regex=False)
)

# Remove duplicate movie IDs
movies = movies.drop_duplicates(subset="movieId")
movies = movies.reset_index(drop=True)

# TF-IDF representation
tfidf = TfidfVectorizer()

tfidf_matrix = tfidf.fit_transform(movies["content_text"])

# Movie similarity matrix
cosine_sim = cosine_similarity(tfidf_matrix)

# Map movie IDs to matrix positions
movie_id_to_index = {
    int(movie_id): index
    for index, movie_id in enumerate(movies["movieId"])
}


# --------------------------------------------------
# 3. Generate user recommendations
# --------------------------------------------------

def get_scores(user_id, movie_ids) -> dict:
    """
    Calculate Content-Based scores for candidate movies.

    Parameters
    ----------
    user_id : int
        User identifier.

    movie_ids : iterable
        Candidate movie IDs.

    Returns
    -------
    dict
        {movieId: score}, with scores between 0 and 1.

    Rules
    -----
    - User profile uses TRAIN ratings only.
    - Already-rated movies are excluded.
    - Scores are cosine similarities between the
      user profile and candidate movie vectors.
    """

    user_id = int(user_id)

    candidates = [int(movie_id) for movie_id in movie_ids]

    # Get this user's TRAIN ratings only
    user_train = train[train["userId"] == user_id].copy()

    if user_train.empty:
        return {}

    # Exclude movies already rated in TRAIN
    rated_movie_ids = set(user_train["movieId"].astype(int))

    # Keep only rated movies present in movies.csv
    user_train = user_train[
        user_train["movieId"].isin(movie_id_to_index)
    ]

    if user_train.empty:
        return {}

    # Build a weighted user profile
    # Higher ratings contribute more to the profile
    profile_weights = (
        user_train["rating"].astype(float).to_numpy()
    )

    profile_weights = np.maximum(profile_weights, 0)

    if profile_weights.sum() == 0:
        profile_weights = np.ones(len(user_train))

    profile_weights = profile_weights / profile_weights.sum()

    rated_indices = [
        movie_id_to_index[int(movie_id)]
        for movie_id in user_train["movieId"]
    ]

    user_profile = (
        tfidf_matrix[rated_indices].multiply(
            profile_weights[:, np.newaxis]
        ).sum(axis=0)
    )

    user_profile = np.asarray(user_profile)

    # Calculate scores for eligible candidates
    scores = {}

    for movie_id in candidates:

        # Exclude movies already rated by the user
        if movie_id in rated_movie_ids:
            continue

        # Ignore unknown movies
        if movie_id not in movie_id_to_index:
            continue

        movie_index = movie_id_to_index[movie_id]

        movie_vector = tfidf_matrix[movie_index]

        score = cosine_similarity(
            user_profile,
            movie_vector
        )[0, 0]

        scores[movie_id] = float(
            np.clip(score, 0.0, 1.0)
        )

    return scores
