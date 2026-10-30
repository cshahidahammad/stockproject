import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DatasetSummary } from '../types';
import { api } from '../services/api';

export interface DatasetItem {
  dataset_id: string;
  filename: string;
  is_default: boolean;
}

interface DatasetContextType {
  currentDatasetId: string;
  activeFilename: string;
  isDefault: boolean;
  summary: DatasetSummary | null;
  isLoadingSummary: boolean;
  summaryError: string | null;
  recentDatasets: DatasetItem[];
  refreshSummary: () => Promise<void>;
  selectDataset: (id: string, filename: string, isDefault: boolean) => void;
  resetToDefault: () => void;
  addRecentDataset: (item: DatasetItem) => void;
}

const DEFAULT_ITEM: DatasetItem = {
  dataset_id: 'default',
  filename: 'stock_data.csv',
  is_default: true,
};

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDatasetId, setCurrentDatasetId] = useState<string>('default');
  const [activeFilename, setActiveFilename] = useState<string>('stock_data.csv');
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [recentDatasets, setRecentDatasets] = useState<DatasetItem[]>([DEFAULT_ITEM]);

  const refreshSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await api.getDatasetSummary(currentDatasetId);
      setSummary(data);
    } catch (err: any) {
      setSummaryError(err.message || 'Failed to fetch summary');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [currentDatasetId]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const selectDataset = (id: string, filename: string, defaultFlag: boolean) => {
    setCurrentDatasetId(id);
    setActiveFilename(filename);
    setIsDefault(defaultFlag);
  };

  const resetToDefault = () => {
    selectDataset('default', 'stock_data.csv', true);
  };

  const addRecentDataset = (item: DatasetItem) => {
    setRecentDatasets((prev) => {
      const filtered = prev.filter((d) => d.dataset_id !== item.dataset_id);
      return [item, ...filtered];
    });
    selectDataset(item.dataset_id, item.filename, item.is_default);
  };

  return (
    <DatasetContext.Provider
      value={{
        currentDatasetId,
        activeFilename,
        isDefault,
        summary,
        isLoadingSummary,
        summaryError,
        recentDatasets,
        refreshSummary,
        selectDataset,
        resetToDefault,
        addRecentDataset,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = (): DatasetContextType => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};
