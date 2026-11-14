import random
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src import hybrid

ROOT = Path(__file__).resolve().parent.parent
movies = pd.read_csv(ROOT / "data" / "raw" / "movies.csv")
ratings = pd.read_csv(ROOT / "data" / "raw" / "ratings.csv")
counts = ratings.groupby("movieId").size().reset_index(name="count")
movies = movies.merge(counts, on="movieId", how="left").fillna({"count": 0})

app = FastAPI(title="CineMatch AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def fake_scores(user_id, movie_ids, seed):
    """Faux scores entre 0 et 1, à remplacer par les vrais modèles."""
    rng = random.Random(f"{seed}-{user_id}")
    return {m: rng.random() for m in movie_ids}


def format_movies(ids_scores):
    by_id = movies.set_index("movieId")
    return [
        {"movie_id": int(m), "title": by_id.loc[m, "title"],
         "genres": by_id.loc[m, "genres"], "score": round(float(s), 4)}
        for m, s in ids_scores
    ]


@app.get("/recommendations/{user_id}")
def recommendations(user_id: int, alpha: float = 0.5, top_n: int = 10):
    ids = movies["movieId"].tolist()
    collab = fake_scores(user_id, ids, "collab")
    content = fake_scores(user_id, ids, "content")
    scores = hybrid.hybrid_scores(collab, content, alpha)
    return format_movies(hybrid.top_n(scores, top_n))


@app.get("/movies/search")
def search(q: str, limit: int = 20):
    found = movies[movies["title"].str.contains(q, case=False, regex=False)].head(limit)
    return [{"movie_id": int(r.movieId), "title": r.title, "genres": r.genres}
            for r in found.itertuples()]


@app.get("/movies/{movie_id}/similar")
def similar(movie_id: int, top_n: int = 10):
    row = movies.loc[movies["movieId"] == movie_id, "genres"]
    if row.empty:
        raise HTTPException(status_code=404, detail="Film introuvable")
    genres = set(row.iloc[0].split("|"))
    scores = {}
    for r in movies.itertuples():
        if r.movieId == movie_id:
            continue
        g = set(r.genres.split("|"))
        scores[r.movieId] = len(genres & g) / len(genres | g)  # Jaccard sur les genres
    return format_movies(hybrid.top_n(scores, top_n))


class NewUser(BaseModel):
    genres: list[str]
    top_n: int = 10


@app.post("/recommendations/new-user")
def new_user(body: NewUser):
    mask = movies["genres"].apply(lambda g: any(x in g.split("|") for x in body.genres))
    top = movies[mask].sort_values("count", ascending=False).head(body.top_n)
    return [{"movie_id": int(r.movieId), "title": r.title, "genres": r.genres,
             "score": 1.0} for r in top.itertuples()]


@app.get("/metrics")
def metrics():
    # Valeurs de démonstration : à remplacer par les vrais résultats des modèles
    return {"note": "valeurs de démonstration",
            "models": [{"name": "baseline", "rmse": None, "mae": None},
                       {"name": "svd", "rmse": None, "mae": None},
                       {"name": "hybrid", "rmse": None, "mae": None}]}