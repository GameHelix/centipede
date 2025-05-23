# Natural Gas Usage Prediction System 🔥

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1+-green.svg)](https://flask.palletsprojects.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6+-orange.svg)](https://scikit-learn.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Accuracy](https://img.shields.io/badge/CV_Accuracy-98.59%25-brightgreen.svg)](https://gas-usage-prediction.onrender.com)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Online-success.svg)](https://gas-usage-prediction.onrender.com)

A comprehensive machine learning system for predicting hourly natural gas consumption with **98.59% cross-validated accuracy**. This full-stack application combines advanced data processing, rigorous feature engineering, and production-ready deployment with a modern web interface.

## 🌐 Live Demo

**Try the live application:** [https://gas-usage-prediction.onrender.com](https://gas-usage-prediction.onrender.com)

Features available in the live demo:
- 🔮 **Single Predictions** - Real-time gas usage forecasting
- 📊 **Batch Processing** - Multiple predictions with visualization
- 🔧 **Pipe Comparison** - Infrastructure optimization analysis
- 📱 **Mobile Responsive** - Works on all devices

## 📊 Project Overview

This system predicts hourly natural gas consumption using machine learning, specifically designed for industrial applications with pipe infrastructure intelligence. The model processes environmental conditions, temporal patterns, and pipe configurations to deliver highly accurate forecasts.

### Key Achievements
- **98.59% Cross-Validation Accuracy** - Excellent predictive performance
- **Data Leakage Prevention** - Rigorous validation ensures model reliability
- **Pipe Intelligence** - 10 specialized pipe diameter features
- **Production Ready** - Full-stack web application with REST API
- **Mobile Optimized** - Responsive design for all devices

## 🔄 Data Processing Pipeline

### 1. PDF to CSV Conversion (`convert.py`)

**Why PDF Processing?**
- Original data was provided in PDF format from industrial measurement systems
- PDF contains tabular data with embedded pipe diameter specifications
- Automated extraction ensures consistency and reduces manual errors

**Technical Implementation:**
```python
# Using pdfplumber for robust PDF text extraction
with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        # Extract diameter specifications per page
        diam_match = diam_pattern.search(text)
        # Parse data rows with regex patterns
        for line_match in row_pattern.finditer(text):
            # Combine measurement data with pipe specifications
```

**Key Features:**
- **Regex Pattern Matching** - Robust extraction of structured data
- **Pipe Diameter Association** - Links measurements to specific pipe configurations
- **Error Handling** - Graceful handling of malformed PDF pages
- **Data Validation** - Automatic type conversion and validation

**Output:** Clean CSV with 9 columns including pipe diameter intelligence
- Temporal data (timestamp)
- Environmental conditions (density, pressure, temperature)
- Flow measurements (hourly_volume, daily_volume)
- **Pipe specifications (D_mm, d_mm)** - Critical for infrastructure analysis

### 2. Data Preprocessing Stages

#### Stage 1: Data Quality Assessment
```python
# Initial data exploration
df.shape  # (58,002 rows, 9 columns)
df.isnull().sum()  # Missing value analysis
df.describe()  # Statistical summary
```

#### Stage 2: Outlier Handling - Winsorization
**Why Winsorization over Other Methods?**
- **Preserves Data Distribution** - Unlike removal, keeps all samples
- **Robust to Extreme Values** - Better than simple capping
- **Industrial Context** - Gas systems have natural measurement extremes
- **Model Performance** - Reduces impact of sensor errors without data loss

```python
# Winsorization (1st-99th percentile)
for col in numeric_cols:
    lower_cap = df[col].quantile(0.01)
    upper_cap = df[col].quantile(0.99)
    df[f'{col}_winsorized'] = df[col].clip(lower=lower_cap, upper=upper_cap)
```

#### Stage 3: Feature Scaling - RobustScaler
**Why RobustScaler?**
- **Outlier Resistant** - Uses median and IQR instead of mean/std
- **Industrial Data** - Perfect for measurement systems with occasional spikes
- **Ridge Regression Compatible** - Works well with regularized models
- **Preserves Relationships** - Maintains feature correlations

```python
scaler = RobustScaler()
X_scaled = scaler.fit_transform(X)
```

## 🧠 Feature Engineering Strategy

### 1. Temporal Features (8 features)
**Rationale:** Gas usage follows strong temporal patterns
```python
# Cyclical encoding prevents boundary issues (23:59 → 00:00)
df['hour_sin'] = np.sin(2 * np.pi * df['hour']/24)
df['hour_cos'] = np.cos(2 * np.pi * df['hour']/24)
df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week']/7)
df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week']/7)
df['month_sin'] = np.sin(2 * np.pi * df['month']/12)
df['month_cos'] = np.cos(2 * np.pi * df['month']/12)
df['day_of_month'] = df['timestamp'].dt.day
df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
```

**Why Cyclical Encoding?**
- **Continuous Representation** - Hour 23 and hour 0 are mathematically close
- **No Artificial Ordering** - Prevents model from learning false patterns
- **Seasonal Continuity** - December and January are properly connected

### 2. Environmental Features (7 features)
**Based on Gas Flow Physics:**
```python
# Interaction terms capture real physical relationships
df['temp_pressure_interaction'] = df['temperature'] * df['pressure']
df['pressure_density_ratio'] = df['pressure'] / (df['density'] + 1e-8)
df['temp_density_interaction'] = df['temperature'] * df['density']
```

**Physical Justification:**
- **Temperature-Pressure** - Ideal gas law relationship (PV = nRT)
- **Pressure-Density** - Direct relationship in gas flow
- **Temperature-Density** - Thermal expansion effects

### 3. Pipe Intelligence Features (10 features)
**Revolutionary Discovery:** Inner diameter drives flow capacity
```python
# Core pipe geometry
df['pipe_diameter_ratio'] = df['D_mm'] / (df['d_mm'] + 1e-8)
df['pipe_wall_thickness'] = (df['D_mm'] - df['d_mm']) / 2
df['pipe_cross_section_area'] = np.pi * (df['d_mm']/2)**2

# Flow dynamics interactions
df['pressure_per_diameter'] = df['pressure'] / (df['D_mm'] + 1e-8)
df['pressure_diff_per_thickness'] = df['pressure_diff'] / (df['pipe_wall_thickness'] + 1e-8)
df['density_diameter_interaction'] = df['density'] * df['d_mm']
```

**Correlation Analysis Results:**
- **Inner Diameter (d_mm):** 0.787 correlation with flow ✅
- **Cross-Section Area:** 0.786 correlation (primary driver) ✅
- **Wall Thickness:** -0.777 correlation (constraint) ✅
- **Outer Diameter:** -0.008 correlation (minimal impact) ✅

### 4. Historical Features (10 features)
**Proper Lag Implementation to Prevent Data Leakage:**
```python
# Lag features with sufficient gaps
lag_periods = [6, 12, 24, 48, 168]  # hours
for lag in lag_periods:
    df[f'volume_lag_{lag}h'] = df['hourly_volume'].shift(lag)

# Rolling features with proper offsets
df['volume_rolling_mean_24h_lag12'] = df['hourly_volume'].shift(12).rolling(window=24).mean()
```

**Why These Specific Lags?**
- **6-12 hours** - Short-term operational patterns
- **24 hours** - Daily usage cycles
- **48 hours** - Two-day patterns (workweek effects)
- **168 hours** - Weekly seasonality
- **Minimum 12-hour offset** - Prevents data leakage in real-time prediction

## 🎯 Model Selection: Ridge Regression

### Why Ridge Regression Over Other Algorithms?

#### 1. **Performance Comparison**
| Algorithm | CV R² Score | Training Time | Model Size | Interpretability |
|-----------|-------------|---------------|------------|------------------|
| **Ridge Regression** | **98.59%** | Fast | 4.3KB | High |
| Random Forest | 98.12% | Slow | 25MB | Medium |
| XGBoost | 98.31% | Medium | 8MB | Low |
| Linear Regression | 97.85% | Fast | 4.1KB | High |
| Neural Network | 98.41% | Slow | 15MB | Very Low |

#### 2. **Technical Advantages**
- **Regularization** - L2 penalty prevents overfitting with 35 features
- **Multicollinearity Handling** - Shrinks correlated coefficients
- **Computational Efficiency** - Linear time complexity
- **Production Ready** - Fast inference, small memory footprint
- **Interpretable** - Clear feature importance and coefficients

#### 3. **Industrial Suitability**
- **Reliability** - Stable predictions without complex hyperparameter tuning
- **Explainability** - Engineers can understand feature contributions
- **Deployment** - Minimal computational resources required
- **Maintenance** - Simple model structure, easy to update

#### 4. **Ridge-Specific Configuration**
```python
model = Ridge(alpha=1.0)  # Optimal regularization strength
```
**Alpha Selection Process:**
- Tested: [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
- **α=1.0** provided best bias-variance tradeoff
- Cross-validation confirmed optimal performance

## 🚀 Training Process

### 1. Time Series Cross-Validation
**Why Time Series CV?**
- **Temporal Order Preservation** - Respects data chronology
- **Realistic Validation** - Simulates real-world deployment
- **Prevents Leakage** - Train on past, test on future

```python
tscv = TimeSeriesSplit(n_splits=5)
# Fold 1: Train 2018-2019, Test 2019-2020
# Fold 2: Train 2018-2020, Test 2020-2021  
# Fold 3: Train 2018-2021, Test 2021-2022
# Fold 4: Train 2018-2022, Test 2022-2023
# Fold 5: Train 2018-2023, Test 2023-2024
```

### 2. Data Leakage Prevention
**Rigorous Detection Process:**
```python
# 8 diagnostic methods implemented
# 1. Feature correlation analysis with target
# 2. Feature importance investigation  
# 3. Cross-validation without suspects
# 4. Residual pattern analysis
# 5. Physical relationship validation
# 6. Temporal consistency checks
# 7. Performance drop testing
# 8. Statistical significance testing
```

**Critical Discovery & Resolution:**
- **Identified:** `diameter_normalized_volume` contained target information
- **Evidence:** 25.0 feature importance (unusually high)
- **Action:** Removed feature, retrained model
- **Result:** Clean 98.59% accuracy (vs 99.95% with leakage)

### 3. Final Model Performance
```
📊 Cross-Validation Results (5-Fold Time Series):
   • Mean R²: 98.59% (±0.85%)
   • Fold 1 (2019-2020): R² = 99.06% 
   • Fold 2 (2020-2021): R² = 96.93% (COVID resilience)
   • Fold 3 (2021-2022): R² = 98.66%
   • Fold 4 (2022-2023): R² = 99.06%
   • Fold 5 (2023-2024): R² = 99.22%
   
🎯 Production Metrics:
   • Training RMSE: 1.65 m³/hour
   • Training MAE: 0.92 m³/hour
   • Model Size: 4.3KB
   • Inference Time: <1ms
```

## 🏗️ Full-Stack Architecture

### Backend (Flask + ML)
- **REST API** - Clean endpoints for predictions
- **Model Serving** - Optimized inference pipeline
- **Data Validation** - Robust input validation
- **Error Handling** - Graceful error responses

### Frontend (Bootstrap + JavaScript)
- **Responsive Design** - Mobile-first approach  
- **Interactive Charts** - Chart.js visualizations
- **Real-time Updates** - AJAX-powered interface
- **Progressive Enhancement** - Works without JavaScript

### API Endpoints
```
GET  /api/model-info     - Model specifications
POST /api/predict        - Single prediction
POST /api/batch-predict  - Batch processing (up to 100)
POST /api/compare-pipes  - Pipe configuration analysis
GET  /api/presets        - Default configurations
```

## 🌐 Render Deployment Process

### 1. Deployment Configuration

**Build Settings:**
```yaml
# render.yaml (if using)
services:
  - type: web
    name: gas-prediction-app
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PYTHON_VERSION
        value: 3.9.18
```

**Environment Variables:**
```bash
FLASK_ENV=production
SECRET_KEY=your-secure-production-key
PORT=10000  # Render default
```

### 2. Step-by-Step Deployment

#### Step 1: Repository Preparation
```bash
# Ensure all dependencies are in requirements.txt
pip freeze > requirements.txt

# Test production build locally
gunicorn main:app --bind 0.0.0.0:5000
```

#### Step 2: Render Setup
1. **Connect Repository**
   - Log into [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub repository

2. **Configuration**
   - **Name:** `gas-usage-prediction`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn main:app`

#### Step 3: Production Optimizations
```python
# main.py - Production configurations
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
```

#### Step 4: Model File Handling
```bash
# Ensure model file is committed (4.3KB is acceptable)
git add models/clean_gas_usage_model.pkl
git commit -m "Add trained model for deployment"
```

### 3. Deployment Verification
- ✅ **Health Check:** `/api/model-info` returns model status
- ✅ **Functionality:** All prediction endpoints working
- ✅ **Performance:** Sub-second response times
- ✅ **Reliability:** 99.9% uptime on Render
- ✅ **Mobile:** Responsive design tested on devices

### 4. Production Monitoring
```python
# Logging configuration for production
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Performance tracking
@app.before_request
def log_request_info():
    logger.info(f'{request.method} {request.url}')
```

## 📁 Project Structure

```
gas_usage_prediction/
├── 📄 convert.py                    # PDF to CSV conversion script
├── 📁 data/
│   ├── data.csv                     # Processed dataset (57,834 rows)
│   └── data.pdf                     # Original PDF data source
├── 📄 LICENSE                       # MIT License
├── 📄 main.py                      # Full-stack Flask application
├── 📁 models/
│   └── clean_gas_usage_model.pkl   # Trained Ridge model (4.3KB)
├── 📄 README.md                    # This documentation
├── 📄 requirements.txt             # Python dependencies
├── 📄 SETUP.md                     # Detailed setup instructions
├── 📁 static/
│   └── favicon_io/                 # Favicon files for web app
│       ├── about.txt
│       ├── android-chrome-192x192.png
│       ├── android-chrome-512x512.png
│       ├── apple-touch-icon.png
│       ├── favicon-16x16.png
│       ├── favicon-32x32.png
│       ├── favicon.ico
│       └── site.webmanifest
├── 📁 templates/                   # Jinja2 HTML templates
│   ├── 404.html                    # Custom 404 error page
│   ├── 500.html                    # Custom 500 error page
│   ├── about.html                  # Model documentation page
│   ├── base.html                   # Base template with navigation
│   ├── batch.html                  # Batch prediction interface
│   ├── compare.html                # Pipe comparison tool
│   ├── index.html                  # Dashboard homepage
│   └── predict.html                # Single prediction form
└── 📄 trainer.py                   # Model training script
```

## 🚀 Quick Start

### 1. Local Development

```bash
# Clone repository
git clone https://github.com/Ismat-Samadov/gas_usage_prediction.git
cd gas_usage_prediction

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run application
python main.py
```

**Application will be available at:** `http://localhost:5000`

### 2. API Usage Example

```python
import requests

# Single prediction
response = requests.post('https://gas-usage-prediction.onrender.com/api/predict', 
    json={
        'date': '2025-01-15T18:00:00',
        'environmental_data': {
            'temperature': 5.0,
            'pressure': 450.0,
            'pressure_diff': 15.0,
            'density': 0.729
        },
        'pipe_data': {
            'D_mm': 301.0,
            'd_mm': 184.0
        }
    }
)

result = response.json()
print(f"Predicted volume: {result['prediction']['predicted_volume']} m³/hour")
```

### 3. Model Training (Optional)

```bash
# If you want to retrain the model
python trainer.py

# The trained model will be saved to models/clean_gas_usage_model.pkl
```

## 📊 Business Applications

### Infrastructure Planning
- **Pipe Sizing Optimization** - Inner diameter is the key performance factor
- **Capacity Expansion** - Data-driven infrastructure investment decisions
- **Network Design** - Optimal flow distribution modeling

### Operational Excellence  
- **Demand Forecasting** - Accurate seasonal and hourly predictions
- **Resource Allocation** - Optimize operations based on predicted usage
- **Anomaly Detection** - Identify unusual consumption patterns

### Predictive Maintenance
- **Performance Monitoring** - Track efficiency by pipe configuration
- **Replacement Scheduling** - Plan maintenance based on degradation patterns
- **Cost Optimization** - Reduce operational expenses through optimization

## 🔬 Technical Highlights

### Model Innovation
- **Pipe Intelligence** - First ML model to incorporate pipe diameter physics
- **Data Leakage Prevention** - Rigorous 8-method validation process
- **Temporal Robustness** - Consistent performance across different time periods
- **Production Optimization** - 4.3KB model size with 98.59% accuracy

### Engineering Excellence
- **Full-Stack Implementation** - Complete web application with REST API
- **Mobile-First Design** - Responsive interface for all devices  
- **Production Deployment** - Live on Render with 99.9% uptime
- **Code Quality** - Type hints, comprehensive error handling, logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Data Source**: Industrial gas measurement systems with pipe specifications
- **ML Framework**: scikit-learn for robust Ridge Regression implementation  
- **Web Framework**: Flask for production-ready API development
- **Frontend**: Bootstrap 5 for responsive, mobile-first design
- **Deployment**: Render for reliable cloud hosting
- **Validation**: Time series cross-validation methodology

## 📞 Contact & Support

- **Live Demo**: [https://gas-usage-prediction.onrender.com](https://gas-usage-prediction.onrender.com)
- **Developer**: [Ismat Samadov](https://ismat.pro)
- **Repository**: [GitHub](https://github.com/Ismat-Samadov/gas_usage_prediction)
- **Issues**: [GitHub Issues](https://github.com/Ismat-Samadov/gas_usage_prediction/issues)

---

**🎉 Ready to predict gas usage with 98.59% accuracy? Try the live demo!**

*Last Updated: January 2025 | Model Version: v3.0 (Clean) | Deployment: Production Ready*