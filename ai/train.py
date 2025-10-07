import json
import os
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from joblib import dump

MODEL_DIR = os.environ.get("MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
MODEL_PATH = os.path.join(MODEL_DIR, "ridge_energy.joblib")

os.makedirs(MODEL_DIR, exist_ok=True)

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
    if df.empty or len(df) < 12:
        print(json.dumps({"ok": False, "message": "Not enough data to train"}))
        raise SystemExit(0)

    X = df[["hour", "dayofweek", "day", "month", "lag1", "lag2", "rolling6"]]
    y = df["usageKWh"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, pred))

    dump(model, MODEL_PATH)

    print(json.dumps({
        "ok": True,
        "model": os.path.basename(MODEL_PATH),
        "mae": mae
    }))
