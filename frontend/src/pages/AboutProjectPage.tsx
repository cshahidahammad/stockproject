import React, { useState } from 'react';
import {
  Info,
  BookOpen,
  Cpu,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  CheckCircle2,
  FileText,
  ShieldAlert,
} from 'lucide-react';

const vivaQuestions = [
  {
    q: "1. What is the project title?",
    a: "Stock Market Trend Analysis Using Data Science / Full-Stack Web Application."
  },
  {
    q: "2. What is the objective?",
    a: "To clean and process historical stock price data, compute financial technical indicators (MA10, MA20, Daily Return), visualize trends interactively, and classify next-session price movement using Machine Learning."
  },
  {
    q: "3. Why Python and modern full-stack web technologies?",
    a: "Python provides robust data science libraries (Pandas, NumPy, Scikit-learn) and high-performance backend serving with FastAPI. React and TypeScript deliver a reactive, typed financial terminal UI with interactive Recharts visualizations."
  },
  {
    q: "4. What is a moving average?",
    a: "A technical indicator calculated over a rolling window of consecutive sessions (10-day and 20-day in this project) to filter out short-term market noise and reveal underlying trend direction."
  },
  {
    q: "5. What is daily return?",
    a: "The percentage price variation from one trading observation to the next, computed as: (Close[t] - Close[t-1]) / Close[t-1]."
  },
  {
    q: "6. Which ML algorithm is used and why?",
    a: "Logistic Regression. Since our target is a binary classification (UP = strictly higher next close, DOWN/FLAT = equal or lower close), Logistic Regression fits a linear decision boundary on standardized features via a sigmoid activation."
  },
  {
    q: "7. How is the target variable created without lookahead bias?",
    a: "Target[t] is defined as (Close[t+1] > Close[t]). The training features for observation t use only data known up to time t. The very last observation has an unobserved target and is held out as the forecast target."
  },
  {
    q: "8. How is the train/test split executed?",
    a: "Chronologically (80% training, 20% testing). Random shuffling is strictly forbidden in financial time-series to prevent future information leakage into historical training rows. StandardScaler is fitted strictly on the training partition."
  },
  {
    q: "9. Why are prediction probabilities intentionally not displayed?",
    a: "To preserve the original application's design integrity and avoid giving false confidence to financial users, the system outputs clear binary trend classifications without speculative probabilistic claims."
  },
  {
    q: "10. Can the model guarantee trading profits?",
    a: "No. Classification accuracy on historical holdouts does not establish financial profitability. Real markets involve transaction slippage, regime shifts, and unexpected news events."
  },
  {
    q: "11. What is the future scope?",
    a: "Integration of real-time market data streaming via WebSockets, sentiment analysis from financial news headlines, deep learning architectures (LSTM/GRU/Transformers), and portfolio risk optimization."
  },
  {
    q: "12. Explain the project in one minute.",
    a: "The project transforms stock market analysis into a full-stack financial platform: the FastAPI backend cleans OHLC data, computes rolling moving averages and returns, trains a chronological Logistic Regression classifier, and exposes REST endpoints. The React frontend visualizes interactive charts, metrics, and confusion matrices with complete dataset upload isolation."
  }
];

export const AboutProjectPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleQuestion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Project Overview Card */}
      <div className="terminal-card p-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800/80 mb-4">
          <div className="p-2.5 rounded-lg bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono text-white tracking-tight">
              Stock Market Trend Analysis Platform
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Academic full-stack data science &amp; machine-learning web application
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
          <p>
            This application transforms the original Python console project into a production-grade full-stack financial dashboard.
            It provides automated CSV data cleaning, technical indicator computation, interactive charting, and supervised trend classification using Logistic Regression.
          </p>
          <p>
            All original project assets—including the supplied synthetic dataset, PowerPoint slides, Word report, Excel workbook, and original source logic—are fully preserved and utilized by the backend engine.
          </p>
        </div>
      </div>

      {/* Methodology & Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Learning Pipeline */}
        <div className="terminal-card p-6 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold font-mono text-white pb-3 border-b border-slate-800/80">
            <Cpu className="w-4 h-4 text-terminal-accent" />
            <span>Machine Learning Pipeline</span>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div>
              <span className="font-semibold text-terminal-accent">Features (8 dimensions):</span>
              <p className="text-slate-400 mt-1">
                Open, High, Low, Close, Volume, 10-day MA, 20-day MA, and Daily Percentage Return.
              </p>
            </div>
            <div>
              <span className="font-semibold text-terminal-accent">Target Direction Formulation:</span>
              <p className="text-slate-400 mt-1">
                Target is 1 (UP) if next observed close &gt; current close; otherwise 0 (DOWN/FLAT).
              </p>
            </div>
            <div>
              <span className="font-semibold text-terminal-accent">Strict Chronological Holdout:</span>
              <p className="text-slate-400 mt-1">
                First 80% of rows are used for training; last 20% are held out for out-of-sample evaluation. No future data leakage.
              </p>
            </div>
            <div>
              <span className="font-semibold text-terminal-accent">Data Preprocessing:</span>
              <p className="text-slate-400 mt-1">
                StandardScaler fit strictly on training set only to prevent normalization data snooping.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Architecture */}
        <div className="terminal-card p-6 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold font-mono text-white pb-3 border-b border-slate-800/80">
            <Layers className="w-4 h-4 text-terminal-accent" />
            <span>Full-Stack Architecture</span>
          </div>

          <div className="space-y-3 text-xs font-mono text-slate-300">
            <div>
              <span className="font-semibold text-terminal-accent">Backend REST API:</span>
              <p className="text-slate-400 mt-1">
                Python 3.15, FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, Pydantic v2 schemas.
              </p>
            </div>
            <div>
              <span className="font-semibold text-terminal-accent">Frontend UI/UX:</span>
              <p className="text-slate-400 mt-1">
                React 18, Vite, TypeScript, Tailwind CSS, Recharts for responsive visualizations, Lucide React icons.
              </p>
            </div>
            <div>
              <span className="font-semibold text-terminal-accent">Session &amp; Upload Isolation:</span>
              <p className="text-slate-400 mt-1">
                Uploaded files are validated, normalized, and isolated by UUID dataset IDs without mutating the default dataset.
              </p>
            </div>
            <div>
              <span className="font-semibold text-terminal-accent">Testing &amp; Quality:</span>
              <p className="text-slate-400 mt-1">
                Comprehensive Pytest test suite validating endpoints, indicators, edge cases, and ML models.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Viva / Defense Questions and Answers Section */}
      <div className="terminal-card p-6">
        <div className="flex items-center space-x-2 text-sm font-bold font-mono text-white pb-4 border-b border-slate-800/80 mb-4">
          <HelpCircle className="w-4 h-4 text-terminal-accent" />
          <span>Project Defense &amp; Viva Voce Q&amp;A</span>
        </div>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-lg border border-slate-800/80 bg-slate-900/40 overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-mono font-semibold text-slate-200 hover:text-terminal-accent transition-colors"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-3.5 pt-0 text-xs font-mono text-slate-400 leading-relaxed border-t border-slate-800/40">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preserved Project Artifacts Notice */}
      <div className="terminal-card p-6 border-l-4 border-l-terminal-accent">
        <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-800/80">
          <FileCheck className="w-4 h-4 text-terminal-accent" />
          <h4 className="text-sm font-bold font-mono text-white">
            Preserved Original Academic Artifacts
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="font-semibold text-slate-200 block">Project_Report.docx</span>
            <span className="text-slate-500 text-[11px]">Comprehensive 570KB Document</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="font-semibold text-slate-200 block">Project_Presentation.pptx</span>
            <span className="text-slate-500 text-[11px]">Academic Slide Deck</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="font-semibold text-slate-200 block">Stock_Market_Analysis.xlsx</span>
            <span className="text-slate-500 text-[11px]">Excel Calculation Workbook</span>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <span className="font-semibold text-slate-200 block">stock_data.csv</span>
            <span className="text-slate-500 text-[11px]">Original 706-record Dataset</span>
          </div>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs font-mono text-slate-400 flex items-start space-x-3">
        <ShieldAlert className="w-4 h-4 text-terminal-accent mt-0.5 flex-shrink-0" />
        <p>
          <span className="font-semibold text-slate-300">Educational Disclaimer:</span> The default dataset and ML models are developed strictly for academic demonstration and research purposes. Historical accuracy is illustrative and does not constitute trading recommendations or financial advice.
        </p>
      </div>
    </div>
  );
};
