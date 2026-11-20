"""Tests de src/evaluation.py sur de petits exemples calculés à la main.

Lancer depuis la racine du projet :
    python tests/test_evaluation.py
(fonctionne aussi avec pytest s'il est installé)
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.evaluation import (  # noqa: E402
    classification_metrics,
    mae,
    mean_at_k,
    ndcg_at_k,
    precision_at_k,
    r2,
    recall_at_k,
    regression_metrics,
    rmse,
)


def close(a, b, tol=1e-9):
    return abs(a - b) < tol


# --- Régression -------------------------------------------------------------

def test_rmse_mae_hand_example():
    # erreurs = [3, 4, 0, 0]
    # MAE  = (3 + 4 + 0 + 0) / 4 = 1.75
    # RMSE = sqrt((9 + 16 + 0 + 0) / 4) = sqrt(6.25) = 2.5
    y_true = [1, 1, 5, 5]
    y_pred = [4, 5, 5, 5]
    assert close(mae(y_true, y_pred), 1.75)
    assert close(rmse(y_true, y_pred), 2.5)


def test_perfect_prediction():
    y = [0.5, 3.0, 4.5, 5.0]
    assert rmse(y, y) == 0.0
    assert mae(y, y) == 0.0
    assert r2(y, y) == 1.0


def test_r2_mean_prediction_is_zero():
    # Prédire la moyenne (2) : SS_res = 1 + 0 + 1 = SS_tot  ->  R² = 0
    assert close(r2([1, 2, 3], [2, 2, 2]), 0.0)


def test_regression_metrics_dict():
    m = regression_metrics([1, 1, 5, 5], [4, 5, 5, 5])
    assert set(m) == {"MAE", "RMSE", "R2"}
    assert close(m["RMSE"], 2.5)


def test_regression_bad_input():
    for bad in ([], [1, 2]):
        try:
            rmse(bad, [1])
        except ValueError:
            continue
        raise AssertionError("ValueError attendue")


# --- Recommandation top-K ---------------------------------------------------

RECO = [10, 20, 30, 40, 50]
RELEVANT = {20, 50, 99}  # 99 n'est pas recommandé


def test_precision_recall_at_5():
    # top-5 : 20 (rang 2) et 50 (rang 5) sont pertinents -> 2 hits
    assert close(precision_at_k(RECO, RELEVANT, k=5), 2 / 5)
    assert close(recall_at_k(RECO, RELEVANT, k=5), 2 / 3)


def test_ndcg_at_5():
    # DCG  = 1/log2(2+1) + 1/log2(5+1)               (hits aux rangs 2 et 5)
    # IDCG = 1/log2(2) + 1/log2(3) + 1/log2(4)       (3 pertinents en tête)
    dcg = 1 / math.log2(3) + 1 / math.log2(6)
    idcg = 1 + 1 / math.log2(3) + 1 / math.log2(4)
    assert close(ndcg_at_k(RECO, RELEVANT, k=5), dcg / idcg)  # ≈ 0.4776


def test_k_truncates_the_list():
    # k=2 -> on ne regarde que [10, 20] : 1 hit
    assert close(precision_at_k(RECO, RELEVANT, k=2), 1 / 2)
    assert close(recall_at_k(RECO, RELEVANT, k=2), 1 / 3)
    # IDCG@2 ne compte que 2 pertinents idéaux
    assert close(ndcg_at_k(RECO, RELEVANT, k=2), (1 / math.log2(3)) / (1 + 1 / math.log2(3)))


def test_single_relevant_at_rank_1():
    # Cas du protocole : un seul film en Validation/Test par utilisateur
    reco = [7] + list(range(100, 109))  # 10 films
    assert close(precision_at_k(reco, {7}), 1 / 10)
    assert recall_at_k(reco, {7}) == 1.0
    assert ndcg_at_k(reco, {7}) == 1.0


def test_no_hit_and_short_list():
    assert precision_at_k(RECO, {1, 2}) == 0.0
    assert recall_at_k(RECO, {1, 2}) == 0.0
    assert ndcg_at_k(RECO, {1, 2}) == 0.0
    # liste plus courte que k : on divise quand même par k
    assert close(precision_at_k([20], RELEVANT, k=10), 1 / 10)


def test_no_relevant_is_nan():
    assert math.isnan(recall_at_k(RECO, set()))
    assert math.isnan(ndcg_at_k(RECO, set()))


def test_mean_at_k():
    recos = {1: [5, 6], 2: [8, 9]}
    relevant = {1: {5}, 2: {7}, 3: set()}  # user 3 ignoré (aucun pertinent)
    # user 1 : recall 1, user 2 : recall 0  -> moyenne 0.5
    assert close(mean_at_k(recall_at_k, recos, relevant, k=2), 0.5)
    # user sans recommandation -> liste vide, score 0
    assert close(mean_at_k(recall_at_k, {}, {1: {5}}, k=2), 0.0)


# --- Classification ---------------------------------------------------------

def test_classification_hand_example():
    # TP = 2, FN = 1, FP = 0, TN = 3
    y_true = [1, 1, 1, 0, 0, 0]
    y_pred = [1, 1, 0, 0, 0, 0]
    m = classification_metrics(y_true, y_pred)
    assert close(m["accuracy"], 5 / 6)
    assert close(m["precision"], 1.0)           # 2 / (2 + 0)
    assert close(m["recall"], 2 / 3)            # 2 / (2 + 1)
    assert close(m["f1"], 0.8)                  # 2 * 1 * (2/3) / (1 + 2/3)
    assert m["confusion_matrix"].tolist() == [[3, 0], [1, 2]]
    assert m["roc_auc"] is None


def test_roc_auc_hand_example():
    # Paires (positif, négatif) bien ordonnées : 0.35>0.1, 0.8>0.1, 0.8>0.4 ; 0.35<0.4
    # AUC = 3 / 4
    m = classification_metrics([0, 0, 1, 1], [0, 1, 0, 1], y_score=[0.1, 0.4, 0.35, 0.8])
    assert close(m["roc_auc"], 0.75)


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    for name, fn in tests:
        fn()
        print(f"OK  {name}")
    print(f"\n{len(tests)} tests passés")
