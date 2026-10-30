from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    version: str
    default_dataset_available: bool


class DatasetMeta(BaseModel):
    dataset_id: str
    filename: str
    is_default: bool
    total_rows: int
    valid_rows: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    columns: List[str]


class DatasetSummaryResponse(BaseModel):
    dataset_id: str
    filename: str
    is_default: bool
    latest_close: Optional[float] = None
    previous_close: Optional[float] = None
    price_change: Optional[float] = None
    price_change_pct: Optional[float] = None
    latest_daily_return: Optional[float] = None
    latest_ma10: Optional[float] = None
    latest_ma20: Optional[float] = None
    total_valid_observations: int
    most_recent_date: Optional[str] = None
    earliest_date: Optional[str] = None
    has_sufficient_data: bool = True
    message: Optional[str] = None


class StockRow(BaseModel):
    Date: str
    Open: float
    High: float
    Low: float
    Close: float
    Volume: float
    Daily_Return: Optional[float] = None
    MA10: Optional[float] = None
    MA20: Optional[float] = None
    Next_Close: Optional[float] = None
    Trend: Optional[int] = None


class StockAnalysisResponse(BaseModel):
    dataset_id: str
    total_records: int
    filtered_records: int
    page: int
    page_size: int
    total_pages: int
    summary_stats: Dict[str, Dict[str, float]]
    data: List[StockRow]


class ChartDataPoint(BaseModel):
    Date: str
    Close: float
    Open: float
    High: float
    Low: float
    Volume: float
    MA10: Optional[float] = None
    MA20: Optional[float] = None
    Daily_Return: Optional[float] = None


class ChartsResponse(BaseModel):
    dataset_id: str
    count: int
    data: List[ChartDataPoint]


class PredictionResult(BaseModel):
    dataset_id: str
    latest_eligible_date: str
    predicted_trend: str
    latest_close: float
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    confusion_matrix_labels: List[str]
    training_rows: int
    test_rows: int
    test_start_date: str
    test_end_date: str
    target_class_distribution: Dict[str, int]
    classification_report: Dict[str, Any]
    feature_names: List[str]
    limitations: List[str]
    note: str


class UploadResponse(BaseModel):
    dataset_id: str
    filename: str
    filesize: int
    total_rows: int
    valid_rows: int
    columns_detected: List[str]
    preview: List[Dict[str, Any]]
    message: str


class ErrorResponse(BaseModel):
    detail: str
    error_type: Optional[str] = None
