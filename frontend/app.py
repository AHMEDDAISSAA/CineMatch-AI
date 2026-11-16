"""CineMatch-AI — démonstrateur Streamlit.

Lancement, depuis la racine du projet :

    streamlit run frontend/app.py

Données nécessaires : movies.csv et ratings.csv de MovieLens Latest Small dans data/raw/.
"""
import sys
from collections import Counter
from pathlib import Path

import pandas as pd
import streamlit as st

FRONTEND = Path(__file__).resolve().parent
ROOT = FRONTEND.parent
for path in (ROOT, FRONTEND):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from src.hybrid import hybrid_scores, top_n  # noqa: E402

# --- Modèles ---------------------------------------------------------------
# Faux scores pour l'instant. Quand les vrais modèles sont prêts, remplacer ces
# deux imports par :
#     from src.collaborative import get_scores as collaborative_scores
#     from src.content_based import get_scores as content_scores
# et passer USING_FAKE_SCORES à False. Rien d'autre ne change.
from fake_scores import collaborative_get_scores as collaborative_scores  # noqa: E402
from fake_scores import content_get_scores as content_scores  # noqa: E402

USING_FAKE_SCORES = True
# ---------------------------------------------------------------------------

RAW = ROOT / "data" / "raw"
LIKE_THRESHOLD = 4.0
TOP_N = 10


@st.cache_data
def load_data():
    movies = pd.read_csv(RAW / "movies.csv").set_index("movieId")
    movies["genre_list"] = [
        [] if g == "(no genres listed)" else g.split("|") for g in movies["genres"]
    ]
    ratings = pd.read_csv(RAW / "ratings.csv", usecols=["userId", "movieId", "rating"])
    return movies, ratings


@st.cache_data
def model_scores(user_id, candidates):
    """Scores des deux modèles pour les films candidats (recalculés seulement si l'utilisateur change)."""
    return collaborative_scores(user_id, candidates), content_scores(user_id, candidates)


def out_of_range(scores):
    return sum(not 0.0 <= s <= 1.0 for s in scores.values())


st.set_page_config(page_title="CineMatch-AI", page_icon="🎬", layout="wide")
st.title("🎬 CineMatch-AI")
st.caption("Recommandation de films — démonstrateur")

if not (RAW / "movies.csv").exists() or not (RAW / "ratings.csv").exists():
    st.error("Données introuvables : placer movies.csv et ratings.csv de MovieLens Latest Small "
             "dans data/raw/ (voir README).")
    st.stop()

movies, ratings = load_data()

if USING_FAKE_SCORES:
    st.info("Scores **factices** : les vrais modèles (collaboratif, content-based) seront branchés "
            "plus tard, sans changer l'interface `get_scores(user_id, movie_ids)`.")

# --- Paramètres -------------------------------------------------------------
with st.sidebar:
    st.header("Paramètres")
    user_id = st.selectbox("Utilisateur (userId)", sorted(ratings["userId"].unique().tolist()))
    alpha = st.slider("alpha : poids du collaboratif", 0.0, 1.0, 0.5, 0.05,
                      help="score = alpha × collaboratif + (1 − alpha) × content-based")
    st.caption("0 = 100 % content-based · 1 = 100 % collaboratif")

# --- Profil de l'utilisateur ------------------------------------------------
user_ratings = ratings[ratings["userId"] == user_id]
liked = user_ratings[user_ratings["rating"] >= LIKE_THRESHOLD]
liked_genres = Counter(g for m in liked["movieId"] for g in movies.at[m, "genre_list"])

c1, c2, c3 = st.columns(3)
c1.metric("Films notés", len(user_ratings))
c2.metric(f"Films aimés (note ≥ {LIKE_THRESHOLD:g})", len(liked))
c3.markdown("**Genres préférés**  \n" + (", ".join(g for g, _ in liked_genres.most_common(3)) or "—"))

# --- Recommandations --------------------------------------------------------
seen = set(user_ratings["movieId"])
candidates = tuple(int(m) for m in movies.index if m not in seen)
collab, content = model_scores(int(user_id), candidates)

for name, scores in (("collaboratif", collab), ("content-based", content)):
    if bad := out_of_range(scores):
        st.warning(f"Modèle {name} : {bad} scores hors de [0, 1]. L'interface demande des scores normalisés.")

hybrid = hybrid_scores(collab, content, alpha)
top = top_n(hybrid, TOP_N)

st.subheader(f"Top {TOP_N} des films recommandés")
table = pd.DataFrame([
    {"Rang": rank, "Film": movies.at[m, "title"], "Genres": movies.at[m, "genres"].replace("|", ", "),
     "Score": score, "Collaboratif": collab.get(m, 0.0), "Content-based": content.get(m, 0.0)}
    for rank, (m, score) in enumerate(top, start=1)
])
st.dataframe(
    table, hide_index=True, width="stretch",
    column_config={
        "Score": st.column_config.ProgressColumn("Score hybride", min_value=0.0, max_value=1.0, format="%.3f"),
        "Collaboratif": st.column_config.NumberColumn(format="%.3f"),
        "Content-based": st.column_config.NumberColumn(format="%.3f"),
    },
)

# --- Explication ------------------------------------------------------------
st.subheader("Pourquoi cette recommandation ?")
movie_id = st.selectbox("Film recommandé", [m for m, _ in top],
                        format_func=lambda m: movies.at[m, "title"])

genres = set(movies.at[movie_id, "genre_list"])
common = [(g, liked_genres[g]) for g in sorted(genres, key=lambda g: -liked_genres[g]) if liked_genres[g]]

if common:
    st.markdown("**Genres en commun avec les films aimés** : "
                + ", ".join(f"{g} ({n} film{'s' if n > 1 else ''} aimé{'s' if n > 1 else ''})" for g, n in common))
    overlap = liked.assign(shared=[len(genres & set(movies.at[m, "genre_list"])) for m in liked["movieId"]])
    closest = overlap[overlap["shared"] > 0].sort_values(["shared", "rating"], ascending=False).head(3)
    st.markdown("**Films aimés les plus proches** :  \n" + "  \n".join(
        f"- {movies.at[m, 'title']} — note {r:g}" for m, r in zip(closest["movieId"], closest["rating"])))
else:
    st.markdown("Aucun genre en commun avec les films aimés : la recommandation vient surtout du score collaboratif.")

c, k = collab.get(movie_id, 0.0), content.get(movie_id, 0.0)
st.markdown(f"**Calcul du score** : {alpha:.2f} × {c:.3f} (collaboratif) + {1 - alpha:.2f} × {k:.3f} (content-based) "
            f"= **{hybrid[movie_id]:.3f}**")
