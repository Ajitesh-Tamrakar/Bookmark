import hashlib


def compute_fingerprint(ids):
    """Short, order-independent hash of a golden set's entry ids — used to tag an
    EvalRun with exactly which entries it ran against."""
    joined = ','.join(sorted(str(i) for i in ids))
    return hashlib.sha256(joined.encode()).hexdigest()[:16]
