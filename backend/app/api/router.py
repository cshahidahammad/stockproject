import json
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse, Response

from app.api.auth import get_current_user
from app.core.config import MAX_UPLOAD_SIZE_BYTES
from app.schemas.dataset import (
    ChartsResponse,
    DatasetMeta,
    DatasetSummaryResponse,
    HealthResponse,
    PredictionResult,
    StockAnalysisResponse,
    UploadResponse,
)
from app.services.dataset_service import DEFAULT_DATASET_ID, dataset_service

router = APIRouter(prefix="/api", tags=["Stock Market Analysis"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Check backend service health and default dataset availability."""
    default_available = False
    try:
        entry = dataset_service.get_dataset_entry(DEFAULT_DATASET_ID)
        default_available = entry is not None
    except Exception:
        default_available = False

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        default_dataset_available=default_available,
    )


@router.get("/dataset/default", response_model=DatasetMeta)
def get_default_dataset() -> DatasetMeta:
    """Get metadata for the project default dataset."""
    try:
        entry = dataset_service.get_dataset_entry(DEFAULT_DATASET_ID)
        df = dataset_service._load_and_process_dataset(entry)
        start_date = df["Date"].iloc[0].strftime("%Y-%m-%d") if not df.empty else None
        end_date = df["Date"].iloc[-1].strftime("%Y-%m-%d") if not df.empty else None

        return DatasetMeta(
            dataset_id=entry.dataset_id,
            filename=entry.filename,
            is_default=True,
            total_rows=len(entry.raw_df) if entry.raw_df is not None else len(df),
            valid_rows=len(df),
            start_date=start_date,
            end_date=end_date,
            columns=list(df.columns),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load default dataset: {str(e)}",
        )


@router.post("/dataset/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> UploadResponse:
    """
    Upload and validate a new historical stock CSV.
    Enforces maximum size limit (10MB) and validates CSV schema.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload.",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV files (.csv) are accepted.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded CSV file is empty.",
        )

    try:
        upload_meta = dataset_service.process_uploaded_file(file.filename, content)
        return UploadResponse(**upload_meta)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error processing dataset: {str(e)}",
        )


@router.get("/dataset/{dataset_id}/summary", response_model=DatasetSummaryResponse)
def get_dataset_summary(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
) -> DatasetSummaryResponse:
    """Get calculated summary cards (latest price, price change, MA10, MA20, observations)."""
    try:
        summary = dataset_service.get_dataset_summary(dataset_id)
        return DatasetSummaryResponse(**summary)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}",
        )


@router.get("/dataset/{dataset_id}/analysis", response_model=StockAnalysisResponse)
def get_dataset_analysis(
    dataset_id: str,
    start_date: Optional[str] = Query(None, description="Filter from YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter up to YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=500, description="Items per page"),
    current_user: dict = Depends(get_current_user),
) -> StockAnalysisResponse:
    """Get paginated historical stock data with indicators and descriptive statistics."""
    try:
        analysis_data = dataset_service.get_analysis_data(
            dataset_id=dataset_id,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )
        return StockAnalysisResponse(**analysis_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analysis data: {str(e)}",
        )


@router.get("/dataset/{dataset_id}/charts", response_model=ChartsResponse)
def get_dataset_charts(
    dataset_id: str,
    start_date: Optional[str] = Query(None, description="Filter from YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter up to YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user),
) -> ChartsResponse:
    """Get time-series records formatted for interactive Recharts visualizations."""
    try:
        charts_data = dataset_service.get_charts_data(
            dataset_id=dataset_id,
            start_date=start_date,
            end_date=end_date,
        )
        return ChartsResponse(**charts_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chart data: {str(e)}",
        )


@router.post("/dataset/{dataset_id}/predict", response_model=PredictionResult)
def predict_dataset_trend(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
) -> PredictionResult:
    """
    Execute chronological Logistic Regression training and return metrics and latest prediction.
    Intentionally avoids prediction probabilities.
    """
    try:
        pred_result = dataset_service.run_prediction(dataset_id)
        return PredictionResult(**pred_result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training error: {str(e)}",
        )


@router.get("/dataset/{dataset_id}/evaluation", response_model=PredictionResult)
def get_dataset_evaluation(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
) -> PredictionResult:
    """Get cached model evaluation metrics or train if not already cached."""
    try:
        eval_result = dataset_service.get_evaluation_metrics(dataset_id)
        return PredictionResult(**eval_result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve evaluation: {str(e)}",
        )


@router.get("/dataset/{dataset_id}/download/processed")
def download_processed_csv(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download the cleaned stock data with indicators and direction target as CSV."""
    try:
        entry = dataset_service.get_dataset_entry(dataset_id)
        csv_content = dataset_service.get_processed_csv(dataset_id)
        download_filename = f"processed_{entry.filename}"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{download_filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Download failed: {str(e)}",
        )


@router.get("/dataset/{dataset_id}/download/evaluation")
def download_evaluation_json(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download the model evaluation metrics report as JSON."""
    try:
        entry = dataset_service.get_dataset_entry(dataset_id)
        eval_result = dataset_service.get_evaluation_metrics(dataset_id)
        json_data = json.dumps(eval_result, indent=2)
        download_filename = f"evaluation_{entry.dataset_id}.json"
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{download_filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Download failed: {str(e)}",
        )


@router.get("/dataset/{dataset_id}/download/prediction")
def download_prediction_json(
    dataset_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download the latest observation prediction report as JSON."""
    try:
        entry = dataset_service.get_dataset_entry(dataset_id)
        eval_result = dataset_service.get_evaluation_metrics(dataset_id)
        prediction_data = {
            "dataset_id": dataset_id,
            "filename": entry.filename,
            "latest_eligible_date": eval_result["latest_eligible_date"],
            "latest_close": eval_result["latest_close"],
            "predicted_trend": eval_result["predicted_trend"],
            "note": eval_result["note"],
            "limitations": eval_result["limitations"],
        }
        json_data = json.dumps(prediction_data, indent=2)
        download_filename = f"latest_prediction_{entry.dataset_id}.json"
        return Response(
            content=json_data,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{download_filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Download failed: {str(e)}",
        )
