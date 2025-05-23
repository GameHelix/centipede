# Gas Usage Prediction System - Full Stack Setup

A comprehensive Flask application with Jinja2 templating frontend and REST API backend for natural gas usage prediction.

## 📁 Project Structure

```
gas_usage_prediction/
├── 📁 data/
│   ├── data.pdf                         # Original PDF dataset
│   └── data.csv                         # Processed CSV data
├── 📁 models/
│   └── clean_gas_usage_model.pkl       # Trained ML model
├── 📁 templates/                       # Jinja2 HTML templates
│   ├── base.html                       # Base template with navigation
│   ├── index.html                      # Dashboard homepage
│   ├── predict.html                    # Single prediction page
│   ├── batch.html                      # Batch prediction page
│   ├── compare.html                    # Pipe comparison page
│   ├── about.html                      # About page with model info
│   ├── 404.html                        # 404 error page
│   └── 500.html                        # 500 error page
├── 📁 static/ (optional)
│   ├── css/
│   ├── js/
│   └── images/
├── main.py                             # Main Flask application
├── app.py                              # Original API-only version
├── convert.py                          # PDF to CSV converter
├── trainer.py                          # Model training script
├── requirements.txt                    # Python dependencies
├── README.md                           # Project documentation
├── LICENSE                             # MIT License
└── .gitignore                          # Git ignore file
```

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Git (for cloning the repository)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Ismat-Samadov/gas_usage_prediction.git
cd gas_usage_prediction

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup Data and Model

```bash
# Convert PDF to CSV (if needed)
python convert.py

# Train the model (if needed)
python trainer.py

# Verify model exists
ls -la models/clean_gas_usage_model.pkl
```

### 4. Run the Application

```bash
# Start the full stack application
python main.py

# Application will be available at:
# http://localhost:5000
```

### 5. Test API Endpoints

```bash
# Test API directly (optional)
curl -X GET http://localhost:5000/api/model-info

# Test single prediction
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-15T18:00:00"}'
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory (optional):

```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
HOST=0.0.0.0
PORT=5000
```

### Application Settings

In `main.py`, you can modify:

```python
# Application configuration
app.secret_key = 'your-secret-key-change-in-production'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# For production, set debug=False
app.run(debug=True, host='0.0.0.0', port=5000)
```

## 📋 Features

### Frontend (Jinja2 Templates)

- **Dashboard** (`/`) - Overview and quick actions
- **Single Prediction** (`/predict`) - Individual gas usage predictions
- **Batch Prediction** (`/batch`) - Multiple predictions at once
- **Pipe Comparison** (`/compare`) - Infrastructure analysis
- **About** (`/about`) - Model information and documentation

### API Endpoints

- `GET /api/model-info` - Get model information
- `GET /api/presets` - Get configuration presets
- `POST /api/predict` - Single prediction
- `POST /api/batch-predict` - Batch predictions (up to 100)
- `POST /api/compare-pipes` - Pipe configuration comparison

### Key Features

- 🎯 **98.59% Accuracy** - Rigorous cross-validation
- 🔧 **Pipe Intelligence** - Advanced pipe diameter analysis
- 🚫 **No Data Leakage** - Clean, validated model
- 📊 **Interactive Charts** - Chart.js visualizations
- 📱 **Responsive Design** - Bootstrap 5 responsive UI
- 🔄 **Real-time Updates** - AJAX-powered interface

## 🧪 Testing

### Manual Testing

1. **Web Interface Testing:**
   ```bash
   # Start the app
   python main.py
   
   # Open browser and test:
   # http://localhost:5000 - Dashboard
   # http://localhost:5000/predict - Single prediction
   # http://localhost:5000/batch - Batch prediction
   # http://localhost:5000/compare - Pipe comparison
   ```

2. **API Testing:**
   ```bash
   # Test model info
   curl http://localhost:5000/api/model-info
   
   # Test single prediction
   curl -X POST http://localhost:5000/api/predict \
     -H "Content-Type: application/json" \
     -d '{
       "date": "2025-01-15T18:00:00",
       "environmental_data": {
         "temperature": 5.0,
         "pressure": 450.0,
         "pressure_diff": 15.0,
         "density": 0.729
       },
       "pipe_data": {
         "D_mm": 301.0,
         "d_mm": 184.0
       }
     }'
   ```

### Automated Testing (Optional)

Create `test_app.py`:

```python
import pytest
import json
from main import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_homepage(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Gas Usage Prediction' in response.data

def test_api_model_info(client):
    response = client.get('/api/model-info')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'model_info' in data

def test_prediction_api(client):
    response = client.post('/api/predict', 
                          json={'date': '2025-01-15T18:00:00'})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] == True
    assert 'prediction' in data
```

Run tests:
```bash
pip install pytest
pytest test_app.py -v
```

## 🚀 Deployment

### Local Development

```bash
python main.py
```

### Production Deployment

1. **Using Gunicorn:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 main:app
   ```

2. **Using Docker:**
   ```dockerfile
   FROM python:3.9-slim
   
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   
   COPY . .
   
   EXPOSE 5000
   CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "main:app"]
   ```

3. **Environment Variables for Production:**
   ```env
   FLASK_ENV=production
   SECRET_KEY=your-secure-secret-key
   HOST=0.0.0.0
   PORT=5000
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Model Not Found Error:**
   ```
   FileNotFoundError: Model file not found: models/clean_gas_usage_model.pkl
   ```
   **Solution:** Run `python trainer.py` to train the model first.

2. **Template Not Found Error:**
   ```
   TemplateNotFound: 404.html
   ```
   **Solution:** Ensure all template files are in the `templates/` directory.

3. **Import Error:**
   ```
   ImportError: No module named 'flask'
   ```
   **Solution:** Activate virtual environment and install dependencies:
   ```bash
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

4. **Port Already in Use:**
   ```
   OSError: [Errno 48] Address already in use
   ```
   **Solution:** Use a different port or kill the existing process:
   ```bash
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   # Or use different port
   python main.py --port 5001
   ```

### Debug Mode

Enable debug mode for development:

```python
# In main.py
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### Logging

Add logging for troubleshooting:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
```

## 📚 Usage Examples

### Frontend Usage

1. **Dashboard:** Visit `http://localhost:5000` for overview and quick actions
2. **Single Prediction:** Use the form to predict gas usage for specific dates
3. **Batch Processing:** Upload multiple dates for bulk predictions
4. **Pipe Comparison:** Compare different pipe configurations

### API Usage

```python
import requests

# Single prediction
response = requests.post('http://localhost:5000/api/predict', json={
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
})

result = response.json()
print(f"Predicted volume: {result['prediction']['predicted_volume']} m³/hour")
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Data Source:** Industrial gas measurement systems
- **Framework:** Flask with Jinja2 templating
- **ML Library:** scikit-learn
- **Frontend:** Bootstrap 5 + Chart.js
- **Icons:** Font Awesome

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Ismat-Samadov/gas_usage_prediction/issues)
- **Documentation:** [README.md](README.md)
- **Developer:** [Ismat Samadov](https://ismat.pro)

---

**🎉 Congratulations! Your full stack gas usage prediction system is ready to use!**