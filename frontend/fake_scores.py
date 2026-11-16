"""Faux modèles pour le démonstrateur, en attendant les vrais.

Chaque fonction respecte l'interface commune (docs/conventions.md) :

    get_scores(user_id, movie_ids) -> {movieId: score}, score entre 0 et 1

Les scores sont pseudo-aléatoires mais reproductibles : même utilisateur et
même film donnent toujours le même score. Ils ne veulent rien dire.
"""
import hashlib


def _unit_score(model, user_id, movie_id):
    digest = hashlib.blake2b(f"{model}:{user_id}:{movie_id}".encode(), digest_size=8).digest()
    return int.from_bytes(digest, "big") / 2**64  # dans [0, 1)


def collaborative_get_scores(user_id, movie_ids):
    """Faux score collaboratif (remplacé plus tard par src.collaborative.get_scores)."""
    return {int(m): _unit_score("collaborative", int(user_id), int(m)) for m in movie_ids}


def content_get_scores(user_id, movie_ids):
    """Faux score content-based (remplacé plus tard par src.content_based.get_scores)."""
    return {int(m): _unit_score("content", int(user_id), int(m)) for m in movie_ids}
