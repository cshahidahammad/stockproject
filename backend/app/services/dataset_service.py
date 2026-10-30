import io
import json
import math
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from threadpoolctl import threadpool_limits

from app.core.config import (
    DEFAULT_DATASET_PATH,
    ORIGINAL_PROJECT_DIR,
    UPLOADS_DIR,
)

# Ensure original project root is in sys.path to import original src logic
if str(ORIGINAL_PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(ORIGINAL_PROJECT_DIR))

from src.data_analysis import add_indicators  # type: ignore # noqa: E402
from src.data_preprocessing import (  # type: ignore # noqa: E402
    NUMERIC_COLUMNS,
    REQUIRED_COLUMNS,
    load_and_clean,
)
from src.prediction import (  # type: ignore # noqa: E402
    FEATURE_COLUMNS,
    prepare_target,
    train_model,
)

DEFAULT_DATASET_ID = "default"


def _clean_nan(value: Any) -> Any:
    """Helper to convert float('nan') or np.nan to None for JSON serialization."""
    if value is None:
        return None
    if isinstance(value, (float, np.floating)):
        return None if (math.isnan(value) or math.isinf(value)) else float(value)
    if isinstance(value, (int, np.integer)):
        return int(value)
    return value


def _clean_dict_nan(data_dict: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _clean_nan(v) for k, v in data_dict.items()}


class DatasetEntry:
    def __init__(
        self,
        dataset_id: str,
        filename: str,
        file_path: Path,
        is_default: bool = False,
    ):
        self.dataset_id = dataset_id
        self.filename = filename
        self.file_path = file_path
        self.is_default = is_default
        self.raw_df: Optional[pd.DataFrame] = None
        self.processed_df: Optional[pd.DataFrame] = None
        self.cached_prediction: Optional[Dict[str, Any]] = None
        self.created_at = datetime.now(timezone.utc)


class DatasetService:
    def __init__(self):
        self._datasets: Dict[str, DatasetEntry] = {}
        self._initialize_default_dataset()

    def _initialize_default_dataset(self) -> None:
        """Register the project default dataset if it exists on disk."""
        if DEFAULT_DATASET_PATH.is_file():
            entry = DatasetEntry(
                dataset_id=DEFAULT_DATASET_ID,
                filename="stock_data.csv",
                file_path=DEFAULT_DATASET_PATH,
                is_default=True,
            )
            self._datasets[DEFAULT_DATASET_ID] = entry
            try:
                self._load_and_process_dataset(entry)
            except Exception as e:
                print(f"Warning: Failed to pre-process default dataset: {e}")

    def get_dataset_entry(self, dataset_id: str) -> DatasetEntry:
        """Retrieve dataset entry by ID or raise ValueError."""
        entry = self._datasets.get(dataset_id)
        if not entry:
            raise ValueError(f"Dataset with ID '{dataset_id}' not found.")
        return entry

    def _load_and_process_dataset(self, entry: DatasetEntry) -> pd.DataFrame:
        """Load, clean and prepare target and indicators using original logic."""
        if entry.processed_df is not None:
            return entry.processed_df

        # Use load_and_clean from original project
        raw_df = load_and_clean(entry.file_path)
        entry.raw_df = raw_df

        # Calculate indicators and next observation target
        processed_df = prepare_target(raw_df)
        entry.processed_df = processed_df
        return processed_df

    def normalize_csv_columns(self, content: bytes) -> bytes:
        """
        Normalize column headers by trimming whitespace and matching case-insensitively
        to the expected columns (Date, Open, High, Low, Close, Volume).
        Raises ValueError if required columns are missing.
        """
        try:
            sample_df = pd.read_csv(io.BytesIO(content), nrows=5)
        except Exception as e:
            raise ValueError(f"Unable to parse CSV file: {str(e)}")

        if sample_df.empty and len(sample_df.columns) == 0:
            raise ValueError("Uploaded CSV is empty.")

        # Build column mapping
        raw_cols = [str(c).strip() for c in sample_df.columns]
        lower_to_canonical = {col.lower(): col for col in REQUIRED_COLUMNS}
        col_rename_map = {}

        for orig_col in raw_cols:
            cleaned = orig_col.strip()
            low = cleaned.lower()
            if low in lower_to_canonical:
                canonical = lower_to_canonical[low]
                col_rename_map[orig_col] = canonical

        # Check missing
        mapped_canonical = set(col_rename_map.values())
        missing = [col for col in REQUIRED_COLUMNS if col not in mapped_canonical]
        if missing:
            raise ValueError(
                f"Missing required columns in CSV: {', '.join(missing)}. "
                f"Required columns: {', '.join(REQUIRED_COLUMNS)}."
            )

        # Re-read full CSV and apply rename
        full_df = pd.read_csv(io.BytesIO(content))
        full_df = full_df.rename(columns=lambda c: col_rename_map.get(str(c).strip(), str(c).strip()))

        out_buffer = io.BytesIO()
        full_df.to_csv(out_buffer, index=False)
        return out_buffer.getvalue()

    def process_uploaded_file(self, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Validates and registers an uploaded CSV, ensuring file isolation.
        Returns preview metadata.
        """
        # Validate filename and size
        if not filename.lower().endswith(".csv"):
            raise ValueError("Only CSV files (.csv) are supported.")

        if len(content) == 0:
            raise ValueError("Uploaded file is empty.")

        # Normalize column names
        normalized_content = self.normalize_csv_columns(content)

        # Generate unique isolated dataset_id
        dataset_id = str(uuid.uuid4())[:12]
        safe_filename = re.sub(r"[^\w\-.]", "_", Path(filename).name)
        saved_path = UPLOADS_DIR / f"{dataset_id}_{safe_filename}"

        # Write isolated file
        saved_path.write_bytes(normalized_content)

        # Attempt to load and clean using original data preprocessing logic
        try:
            entry = DatasetEntry(
                dataset_id=dataset_id,
                filename=safe_filename,
                file_path=saved_path,
                is_default=False,
            )
            processed_df = self._load_and_process_dataset(entry)
            self._datasets[dataset_id] = entry
        except Exception as e:
            # Clean up the file if validation fails
            if saved_path.exists():
                saved_path.unlink()
            raise ValueError(f"CSV Validation Error: {str(e)}")

        preview_rows = []
        for _, row in processed_df.head(5).iterrows():
            preview_rows.append({
                "Date": row["Date"].strftime("%Y-%m-%d"),
                "Open": _clean_nan(row["Open"]),
                "High": _clean_nan(row["High"]),
                "Low": _clean_nan(row["Low"]),
                "Close": _clean_nan(row["Close"]),
                "Volume": _clean_nan(row["Volume"]),
            })

        return {
            "dataset_id": dataset_id,
            "filename": safe_filename,
            "filesize": len(content),
            "total_rows": len(entry.raw_df) if entry.raw_df is not None else 0,
            "valid_rows": len(processed_df),
            "columns_detected": list(REQUIRED_COLUMNS),
            "preview": preview_rows,
            "message": "Dataset successfully uploaded, cleaned, and processed.",
        }

    def get_dataset_summary(self, dataset_id: str) -> Dict[str, Any]:
        """Calculate and return key financial summary metrics for the dataset."""
        entry = self.get_dataset_entry(dataset_id)
        df = self._load_and_process_dataset(entry)

        if df.empty:
            return {
                "dataset_id": dataset_id,
                "filename": entry.filename,
                "is_default": entry.is_default,
                "total_valid_observations": 0,
                "has_sufficient_data": False,
                "message": "Dataset has 0 valid observations.",
            }

        total_valid = len(df)
        most_recent_row = df.iloc[-1]
        previous_row = df.iloc[-2] if total_valid >= 2 else None

        latest_close = float(most_recent_row["Close"])
        previous_close = float(previous_row["Close"]) if previous_row is not None else None

        price_change = None
        price_change_pct = None
        if previous_close is not None and previous_close > 0:
            price_change = latest_close - previous_close
            price_change_pct = (price_change / previous_close) * 100.0

        latest_return = _clean_nan(most_recent_row.get("Daily_Return"))
        latest_ma10 = _clean_nan(most_recent_row.get("MA10"))
        latest_ma20 = _clean_nan(most_recent_row.get("MA20"))

        earliest_date = df["Date"].iloc[0].strftime("%Y-%m-%d")
        most_recent_date = most_recent_row["Date"].strftime("%Y-%m-%d")

        has_sufficient_data = total_valid >= 20
        msg = None if has_sufficient_data else "Dataset has fewer than 20 records; moving averages require at least 20 observations."

        return {
            "dataset_id": dataset_id,
            "filename": entry.filename,
            "is_default": entry.is_default,
            "latest_close": _clean_nan(latest_close),
            "previous_close": _clean_nan(previous_close),
            "price_change": _clean_nan(price_change),
            "price_change_pct": _clean_nan(price_change_pct),
            "latest_daily_return": latest_return,
            "latest_ma10": latest_ma10,
            "latest_ma20": latest_ma20,
            "total_valid_observations": total_valid,
            "most_recent_date": most_recent_date,
            "earliest_date": earliest_date,
            "has_sufficient_data": has_sufficient_data,
            "message": msg,
        }

    def get_analysis_data(
        self,
        dataset_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> Dict[str, Any]:
        """Return historical indicators, statistical summaries, with filtering & pagination."""
        entry = self.get_dataset_entry(dataset_id)
        df = self._load_and_process_dataset(entry).copy()

        # Filter by date if provided
        if start_date:
            try:
                start_dt = pd.to_datetime(start_date)
                df = df[df["Date"] >= start_dt]
            except Exception:
                pass
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date)
                df = df[df["Date"] <= end_dt]
            except Exception:
                pass

        total_filtered = len(df)
        total_pages = max(1, math.ceil(total_filtered / page_size)) if page_size > 0 else 1
        page = max(1, min(page, total_pages))

        # Statistical summary on Close and Volume
        stats_df = df[["Close", "Volume"]].describe().to_dict()
        clean_stats = {
            col: {stat: _clean_nan(val) for stat, val in metrics.items()}
            for col, metrics in stats_df.items()
        }

        # Pagination slice
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_df = df.iloc[start_idx:end_idx]

        records = []
        for _, row in page_df.iterrows():
            records.append({
                "Date": row["Date"].strftime("%Y-%m-%d"),
                "Open": _clean_nan(row["Open"]),
                "High": _clean_nan(row["High"]),
                "Low": _clean_nan(row["Low"]),
                "Close": _clean_nan(row["Close"]),
                "Volume": _clean_nan(row["Volume"]),
                "Daily_Return": _clean_nan(row.get("Daily_Return")),
                "MA10": _clean_nan(row.get("MA10")),
                "MA20": _clean_nan(row.get("MA20")),
                "Next_Close": _clean_nan(row.get("Next_Close")),
                "Trend": _clean_nan(row.get("Trend")),
            })

        return {
            "dataset_id": dataset_id,
            "total_records": len(entry.processed_df) if entry.processed_df is not None else 0,
            "filtered_records": total_filtered,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "summary_stats": clean_stats,
            "data": records,
        }

    def get_charts_data(
        self,
        dataset_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return time-series data for interactive Recharts visualizations."""
        entry = self.get_dataset_entry(dataset_id)
        df = self._load_and_process_dataset(entry).copy()

        if start_date:
            try:
                start_dt = pd.to_datetime(start_date)
                df = df[df["Date"] >= start_dt]
            except Exception:
                pass
        if end_date:
            try:
                end_dt = pd.to_datetime(end_date)
                df = df[df["Date"] <= end_dt]
            except Exception:
                pass

        data_points = []
        for _, row in df.iterrows():
            data_points.append({
                "Date": row["Date"].strftime("%Y-%m-%d"),
                "Open": _clean_nan(row["Open"]),
                "High": _clean_nan(row["High"]),
                "Low": _clean_nan(row["Low"]),
                "Close": _clean_nan(row["Close"]),
                "Volume": _clean_nan(row["Volume"]),
                "MA10": _clean_nan(row.get("MA10")),
                "MA20": _clean_nan(row.get("MA20")),
                "Daily_Return": _clean_nan(row.get("Daily_Return")),
            })

        return {
            "dataset_id": dataset_id,
            "count": len(data_points),
            "data": data_points,
        }

    def run_prediction(self, dataset_id: str) -> Dict[str, Any]:
        """
        Trains Logistic Regression model chronologically (80/20 train/test split)
        and evaluates prediction for the latest observation without prediction probabilities.
        """
        entry = self.get_dataset_entry(dataset_id)
        df = self._load_and_process_dataset(entry)

        # Check minimum usable rows
        usable = df.dropna(subset=[*FEATURE_COLUMNS, "Trend"]).copy()
        if len(usable) < 4:
            raise ValueError(
                f"Dataset contains only {len(usable)} usable rows after indicator calculations. "
                "At least 4 usable rows are required to train and evaluate the model."
            )

        # Train model using original train_model implementation
        model, X_test, y_test = train_model(df, test_size=0.2)

        with threadpool_limits(limits=1):
            test_predictions = model.predict(X_test)

        test_rows = df.loc[X_test.index]
        accuracy = float(accuracy_score(y_test, test_predictions))
        precision = float(precision_score(y_test, test_predictions, zero_division=0))
        recall = float(recall_score(y_test, test_predictions, zero_division=0))
        f1 = float(f1_score(y_test, test_predictions, zero_division=0))
        matrix = confusion_matrix(y_test, test_predictions, labels=[0, 1]).tolist()

        report_dict = classification_report(
            y_test,
            test_predictions,
            labels=[0, 1],
            target_names=["downward_or_flat", "upward"],
            output_dict=True,
            zero_division=0,
        )

        # Latest eligible observation prediction (final row with all features)
        latest_row = df.dropna(subset=list(FEATURE_COLUMNS)).tail(1)
        if latest_row.empty:
            raise ValueError("No observation has enough history for all prediction features.")

        latest_features = latest_row.loc[:, FEATURE_COLUMNS]
        with threadpool_limits(limits=1):
            latest_pred_val = int(model.predict(latest_features)[0])

        predicted_trend = "UP" if latest_pred_val == 1 else "DOWN/FLAT"
        latest_date = latest_row["Date"].iloc[0].strftime("%Y-%m-%d")
        latest_close = float(latest_row["Close"].iloc[0])

        # Target class distribution in usable dataset
        class_dist = {
            "downward_or_flat": int((usable["Trend"] == 0).sum()),
            "upward": int((usable["Trend"] == 1).sum()),
        }

        limitations = [
            "Binary direction only: Logistic Regression predicts whether the next close will be strictly higher (UP) or equal/lower (DOWN/FLAT).",
            "No probabilities displayed: Consistent with the project's design, confidence intervals or prediction probabilities are intentionally not reported.",
            "Historical backtest only: Classification accuracy on historical holdouts does not guarantee trading profitability or future performance.",
            "Market dynamics: Real financial markets are affected by macro-economic events, news sentiment, slippage, and regime shifts not captured by OHLC indicators.",
            "Educational purpose: This machine learning model is intended for academic research and educational demonstration only, not financial or investment advice.",
        ]

        result = {
            "dataset_id": dataset_id,
            "latest_eligible_date": latest_date,
            "predicted_trend": predicted_trend,
            "latest_close": latest_close,
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "confusion_matrix": matrix,
            "confusion_matrix_labels": ["downward_or_flat", "upward"],
            "training_rows": int(len(usable) - len(X_test)),
            "test_rows": int(len(X_test)),
            "test_start_date": test_rows["Date"].iloc[0].strftime("%Y-%m-%d"),
            "test_end_date": test_rows["Date"].iloc[-1].strftime("%Y-%m-%d"),
            "target_class_distribution": class_dist,
            "classification_report": report_dict,
            "feature_names": list(FEATURE_COLUMNS),
            "limitations": limitations,
            "note": "Prediction uses the latest observation's available features. Its next closing price is not known.",
        }

        entry.cached_prediction = result
        return result

    def get_evaluation_metrics(self, dataset_id: str) -> Dict[str, Any]:
        """Returns cached evaluation or runs prediction to generate metrics."""
        entry = self.get_dataset_entry(dataset_id)
        if entry.cached_prediction is not None:
            return entry.cached_prediction
        return self.run_prediction(dataset_id)

    def get_processed_csv(self, dataset_id: str) -> str:
        """Returns the processed dataset containing all indicators and targets as CSV string."""
        entry = self.get_dataset_entry(dataset_id)
        df = self._load_and_process_dataset(entry)
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue()


# Global singleton dataset service
dataset_service = DatasetService()
