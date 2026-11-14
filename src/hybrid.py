def normalize(scores):
    """Ramène des scores entre 0 et 1 (min-max)."""
    if not scores:
        return {}
    lo, hi = min(scores.values()), max(scores.values())
    if hi == lo:
        return {k: 0.0 for k in scores}
    return {k: (v - lo) / (hi - lo) for k, v in scores.items()}


def hybrid_scores(collab, content, alpha):
    """alpha * collaboratif + (1 - alpha) * content. Film absent d'un modèle : score 0."""
    ids = set(collab) | set(content)
    return {m: alpha * collab.get(m, 0.0) + (1 - alpha) * content.get(m, 0.0) for m in ids}


def top_n(scores, n=10):
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]


if __name__ == "__main__":
    import random

    rng = random.Random(0)
    ids = list(range(1, 21))
    collab = {m: rng.random() for m in ids}
    content = {m: rng.random() for m in ids}

    for alpha in [0.0, 0.5, 1.0]:
        print(alpha, top_n(hybrid_scores(collab, content, alpha), 3))