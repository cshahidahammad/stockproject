import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Running Frontend Production & Integrity Verification ---');

// 1. Verify build artifacts
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('FAIL: dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

const htmlFile = path.join(distDir, 'index.html');
if (!fs.existsSync(htmlFile)) {
  console.error('FAIL: dist/index.html is missing.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
if (!htmlContent.includes('<div id="root"></div>')) {
  console.error('FAIL: index.html does not contain the root mount element.');
  process.exit(1);
}
console.log('✓ Production index.html and root mount verified.');

// 2. Verify assets generated
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);
const jsBundle = assetFiles.find((f) => f.endsWith('.js'));
const cssBundle = assetFiles.find((f) => f.endsWith('.css'));

if (!jsBundle || !cssBundle) {
  console.error('FAIL: JS or CSS bundle missing in dist/assets.');
  process.exit(1);
}
console.log(`✓ JavaScript bundle verified: ${jsBundle} (${(fs.statSync(path.join(assetsDir, jsBundle)).size / 1024).toFixed(1)} KB)`);
console.log(`✓ Tailwind CSS bundle verified: ${cssBundle} (${(fs.statSync(path.join(assetsDir, cssBundle)).size / 1024).toFixed(1)} KB)`);

// 3. Verify page files exist
const requiredPages = [
  'LoginPage.tsx',
  'SignUpPage.tsx',
  'DashboardPage.tsx',
  'StockAnalysisPage.tsx',
  'TrendPredictionPage.tsx',
  'ChartsPage.tsx',
  'DataUploadPage.tsx',
  'AboutProjectPage.tsx',
];

for (const page of requiredPages) {
  const pagePath = path.join(__dirname, 'src', 'pages', page);
  if (!fs.existsSync(pagePath)) {
    console.error(`FAIL: Missing page component: ${page}`);
    process.exit(1);
  }
}
console.log('✓ All 8 application pages (including Login & SignUp) verified in src/pages/.');

// 4. Verify API service definitions
const apiPath = path.join(__dirname, 'src', 'services', 'api.ts');
const apiContent = fs.readFileSync(apiPath, 'utf-8');
const expectedEndpoints = [
  'signup',
  'login',
  'logout',
  'getMe',
  'getHealth',
  'getDefaultDataset',
  'uploadDataset',
  'getDatasetSummary',
  'getDatasetAnalysis',
  'getDatasetCharts',
  'predictDatasetTrend',
  'getDatasetEvaluation',
];

for (const ep of expectedEndpoints) {
  if (!apiContent.includes(ep)) {
    console.error(`FAIL: API service missing method ${ep}`);
    process.exit(1);
  }
}
console.log('✓ Reusable API service verified for all backend endpoints.');

console.log('--- ALL FRONTEND INTEGRITY CHECKS PASSED (100%) ---');
