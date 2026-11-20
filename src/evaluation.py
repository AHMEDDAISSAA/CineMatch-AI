"""Métriques d'évaluation communes à toute l'équipe CineMatch-AI.

- Régression (prédiction de la note) : rmse, mae, r2, regression_metrics
- Recommandation (top-K)             : precision_at_k, recall_at_k, ndcg_at_k, mean_at_k
- Classification "aime / n'aime pas" : classification_metrics

Exemple :
    from src.evaluation import rmse, mean_at_k, ndcg_at_k
"""

import math

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

K = 10  # valeur de k fixée dans docs/conventions.md


# ---------------------------------------------------------------------------
# Régression : prédiction de la note
# ---------------------------------------------------------------------------

def _as_pair(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    if y_true.shape != y_pred.shape:
        raise ValueError(f"Tailles différentes : {y_true.shape} vs {y_pred.shape}")
    if y_true.size == 0:
        raise ValueError("Les tableaux sont vides")
    return y_true, y_pred


def rmse(y_true, y_pred):
    """Racine de l'erreur quadratique moyenne : sqrt(mean((y_true - y_pred)^2))."""
    y_true, y_pred = _as_pair(y_true, y_pred)
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def mae(y_true, y_pred):
    """Erreur absolue moyenne : mean(|y_true - y_pred|)."""
    y_true, y_pred = _as_pair(y_true, y_pred)
    return float(np.mean(np.abs(y_true - y_pred)))


def r2(y_true, y_pred):
    """Coefficient de détermination : 1 - SS_res / SS_tot.

    1 = prédiction parfaite, 0 = aussi bon que prédire la moyenne,
    négatif = pire que la moyenne.
    """
    y_true, y_pred = _as_pair(y_true, y_pred)
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - y_true.mean()) ** 2)
    if ss_tot == 0:
        raise ValueError("R² indéfini : toutes les valeurs de y_true sont identiques")
    return float(1 - ss_res / ss_tot)


def regression_metrics(y_true, y_pred):
    """Renvoie {'MAE', 'RMSE', 'R2'} pour un tableau comparatif."""
    return {"MAE": mae(y_true, y_pred), "RMSE": rmse(y_true, y_pred), "R2": r2(y_true, y_pred)}


# ---------------------------------------------------------------------------
# Recommandation top-K (pertinence binaire)
#   recommended : liste ordonnée de movieId (le meilleur en premier, sans doublon)
#   relevant    : ensemble des movieId pertinents pour l'utilisateur
# ---------------------------------------------------------------------------

def _hits(recommended, relevant, k):
    if k <= 0:
        raise ValueError("k doit être strictement positif")
    relevant = set(relevant)
    return [1 if item in relevant else 0 for item in list(recommended)[:k]], relevant


def precision_at_k(recommended, relevant, k=K):
    """Part des k recommandations qui sont pertinentes : hits / k.

    On divise toujours par k, même si la liste contient moins de k films.
    """
    hits, _ = _hits(recommended, relevant, k)
    return sum(hits) / k


def recall_at_k(recommended, relevant, k=K):
    """Part des films pertinents retrouvés dans le top-k : hits / |relevant|.

    Renvoie nan si l'utilisateur n'a aucun film pertinent (métrique indéfinie).
    """
    hits, relevant = _hits(recommended, relevant, k)
    if not relevant:
        return float("nan")
    return sum(hits) / len(relevant)


def ndcg_at_k(recommended, relevant, k=K):
    """NDCG@k : DCG / IDCG avec DCG = somme des rel_i / log2(i + 1), i = rang (1 = premier).

    IDCG est le DCG du classement idéal (tous les pertinents en tête).
    Renvoie nan si l'utilisateur n'a aucun film pertinent.
    """
    hits, relevant = _hits(recommended, relevant, k)
    if not relevant:
        return float("nan")
    dcg = sum(h / math.log2(rank + 1) for rank, h in enumerate(hits, start=1))
    idcg = sum(1 / math.log2(rank + 1) for rank in range(1, min(len(relevant), k) + 1))
    return dcg / idcg


def mean_at_k(metric, recommendations, relevant_by_user, k=K):
    """Moyenne d'une métrique top-k sur tous les utilisateurs.

    metric           : precision_at_k, recall_at_k ou ndcg_at_k
    recommendations  : {userId: liste ordonnée de movieId recommandés}
    relevant_by_user : {userId: ensemble de movieId pertinents}

    Les utilisateurs sans film pertinent sont ignorés. Un utilisateur sans
    recommandation compte comme une liste vide (score 0).
    """
    scores = [
        metric(recommendations.get(user, []), relevant, k)
        for user, relevant in relevant_by_user.items()
        if relevant
    ]
    if not scores:
        raise ValueError("Aucun utilisateur avec au moins un film pertinent")
    return float(np.mean(scores))


# ---------------------------------------------------------------------------
# Classification binaire "aime (1) / n'aime pas (0)"
# ---------------------------------------------------------------------------

def classification_metrics(y_true, y_pred, y_score=None):
    """Renvoie accuracy, precision, recall, F1, AUC et la matrice de confusion.

    y_pred  : classes prédites (0/1)
    y_score : probabilité ou score de la classe 1 (predict_proba[:, 1] ou
              decision_function). Nécessaire pour l'AUC, sinon AUC = None.
    La matrice de confusion est [[TN, FP], [FN, TP]].
    """
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": None if y_score is None else float(roc_auc_score(y_true, y_score)),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=[0, 1]),
    }
