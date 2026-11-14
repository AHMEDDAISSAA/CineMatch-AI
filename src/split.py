def temporal_split(ratings, train_frac=0.8, val_frac=0.1):
    """Split temporel par utilisateur : anciennes notes en Train, récentes en Test."""
    r = ratings.sort_values(["userId", "timestamp", "movieId"], kind="mergesort")
    n = r.groupby("userId")["movieId"].transform("size")
    frac = r.groupby("userId").cumcount() / n

    train = r[frac < train_frac].copy()
    val = r[(frac >= train_frac) & (frac < train_frac + val_frac)].copy()
    test = r[frac >= train_frac + val_frac].copy()
    return train, val, test