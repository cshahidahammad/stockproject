export interface HealthResponse {
  status: string;
  version: string;
  default_dataset_available: boolean;
}

export interface DatasetMeta {
  dataset_id: string;
  filename: string;
  is_default: boolean;
  total_rows: number;
  valid_rows: number;
  start_date: string | null;
  end_date: string | null;
  columns: string[];
}

export interface DatasetSummary {
  dataset_id: string;
  filename: string;
  is_default: boolean;
  latest_close: number | null;
  previous_close: number | null;
  price_change: number | null;
  price_change_pct: number | null;
  latest_daily_return: number | null;
  latest_ma10: number | null;
  latest_ma20: number | null;
  total_valid_observations: number;
  most_recent_date: string | null;
  earliest_date: string | null;
  has_sufficient_data: boolean;
  message: string | null;
}

export interface StockRow {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  Daily_Return: number | null;
  MA10: number | null;
  MA20: number | null;
  Next_Close: number | null;
  Trend: number | null;
}

export interface StockAnalysisResponse {
  dataset_id: string;
  total_records: number;
  filtered_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary_stats: Record<string, Record<string, number>>;
  data: StockRow[];
}

export interface ChartDataPoint {
  Date: string;
  Close: number;
  Open: number;
  High: number;
  Low: number;
  Volume: number;
  MA10: number | null;
  MA20: number | null;
  Daily_Return: number | null;
}

export interface ChartsResponse {
  dataset_id: string;
  count: number;
  data: ChartDataPoint[];
}

export interface PredictionResult {
  dataset_id: string;
  latest_eligible_date: string;
  predicted_trend: 'UP' | 'DOWN/FLAT';
  latest_close: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  confusion_matrix_labels: string[];
  training_rows: number;
  test_rows: number;
  test_start_date: string;
  test_end_date: string;
  target_class_distribution: Record<string, number>;
  classification_report: Record<string, any>;
  feature_names: string[];
  limitations: string[];
  note: string;
}

export interface UploadResponse {
  dataset_id: string;
  filename: string;
  filesize: number;
  total_rows: number;
  valid_rows: number;
  columns_detected: string[];
  preview: Array<Record<string, any>>;
  message: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

