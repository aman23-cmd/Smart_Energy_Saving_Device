import json
import os
import pandas as pd
import numpy as np
from joblib import load

MODEL_DIR = os.environ.get("MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
MODEL_PATH = os.path.join(MODEL_DIR, "ridge_energy.joblib")


def prepare_dataframe(records):
    rows = []
    for r in records:
        ts = pd.to_datetime(r.get("timestamp"))
        usage = float(r.get("usageKWh", 0))
        rows.append({
            "timestamp": ts,
            "usageKWh": usage,
            "hour": ts.hour,
            "dayofweek": ts.dayofweek,
            "day": ts.day,
            "month": ts.month,
        })
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df.sort_values("timestamp", inplace=True)
    # Lag features
    df["lag1"] = df["usageKWh"].shift(1)
    df["lag2"] = df["usageKWh"].shift(2)
    df["rolling6"] = df["usageKWh"].rolling(window=6, min_periods=1).mean()
    df.dropna(inplace=True)
    return df


if __name__ == "__main__":
    payload = json.loads(input())
    records = payload.get("records", [])
    df = prepare_dataframe(records)

    if not os.path.exists(MODEL_PATH) or df.empty:
        # fallback: naive prediction and peak as recent max
        usage = [float(r.get("usageKWh", 0)) for r in records][-24:]
        avg = float(np.mean(usage)) if usage else 0.0
        peak = float(np.max(usage)) if usage else 0.0
        print(json.dumps({"ok": False, "predictedNext": avg, "predictedPeak": peak}))
        raise SystemExit(0)

    model = load(MODEL_PATH)

    X = df[["hour", "dayofweek", "day", "month", "lag1", "lag2", "rolling6"]]
    pred = model.predict(X)

    predicted_next = float(pred[-1]) if len(pred) else 0.0
    predicted_peak = float(np.max(pred)) if len(pred) else 0.0

    print(json.dumps({
        "ok": True,
        "predictedNext": predicted_next,
        "predictedPeak": predicted_peak
    }))
