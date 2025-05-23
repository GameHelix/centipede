"""
Full Stack Flask Application for Gas Usage Prediction System
Combines REST API backend with Jinja2 templating frontend
"""

from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import os
from werkzeug.exceptions import BadRequest
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'
CORS(app)  # Enable CORS for API endpoints

# Global variables for model components
model = None
scaler = None
features = None
diameter_stats = None
model_info = None

def load_model():
    """Load the trained model and components."""
    global model, scaler, features, diameter_stats, model_info
    
    try:
        model_path = 'models/clean_gas_usage_model.pkl'
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        logger.info("Loading gas usage prediction model...")
        model_package = joblib.load(model_path)
        
        model = model_package['model']
        scaler = model_package['scaler']
        features = model_package['features']
        diameter_stats = model_package.get('diameter_stats', {})
        model_info = model_package.get('model_info', {})
        
        logger.info(f"Model loaded successfully. Features: {len(features)}")
        logger.info(f"Model version: {model_info.get('version', 'Unknown')}")
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

def predict_gas_usage_api(prediction_date, environmental_data=None, pipe_data=None):
    """
    Clean prediction function for API use.
    """
    if model is None:
        raise ValueError("Model not loaded")
    
    # Parse date
    if isinstance(prediction_date, str):
        try:
            pred_date = pd.to_datetime(prediction_date)
        except:
            raise ValueError("Invalid date format. Use YYYY-MM-DD HH:MM:SS or similar")
    else:
        pred_date = prediction_date

    # Create feature vector
    features_dict = {}
    
    # Temporal features
    features_dict.update({
        'hour_sin': np.sin(2 * np.pi * pred_date.hour/24),
        'hour_cos': np.cos(2 * np.pi * pred_date.hour/24),
        'day_of_week_sin': np.sin(2 * np.pi * pred_date.dayofweek/7),
        'day_of_week_cos': np.cos(2 * np.pi * pred_date.dayofweek/7),
        'month_sin': np.sin(2 * np.pi * pred_date.month/12),
        'month_cos': np.cos(2 * np.pi * pred_date.month/12),
        'day_of_month': pred_date.day,
        'is_weekend': 1 if pred_date.dayofweek >= 5 else 0
    })
    
    # Environmental data (seasonal defaults if not provided)
    if environmental_data:
        features_dict.update(environmental_data)
    else:
        month = pred_date.month
        if month in [12, 1, 2]:  # Winter
            temp, pressure, pressure_diff = 5.0, 450.0, 15.0
        elif month in [3, 4, 5]:  # Spring
            temp, pressure, pressure_diff = 12.0, 420.0, 12.0
        elif month in [6, 7, 8]:  # Summer
            temp, pressure, pressure_diff = 22.0, 400.0, 8.0
        else:  # Fall
            temp, pressure, pressure_diff = 15.0, 430.0, 11.0

        features_dict.update({
            'density': 0.729,
            'pressure_diff': pressure_diff,
            'pressure': pressure,
            'temperature': temp,
            'temp_pressure_interaction': temp * pressure,
            'pressure_density_ratio': pressure / 0.729,
            'temp_density_interaction': temp * 0.729,
            'temp_rolling_mean_24h': temp,
            'pressure_rolling_std_24h': 8.2
        })
    
    # Pipe data
    if pipe_data:
        D_mm = pipe_data.get('D_mm', diameter_stats.get('D_mm_mode', 301.0))
        d_mm = pipe_data.get('d_mm', diameter_stats.get('d_mm_mode', 184.0))
    else:
        D_mm = diameter_stats.get('D_mm_mode', 301.0)
        d_mm = diameter_stats.get('d_mm_mode', 184.0)
    
    # Pipe features
    wall_thickness = (D_mm - d_mm) / 2
    cross_section_area = np.pi * (d_mm/2)**2
    annular_area = np.pi * ((D_mm/2)**2 - (d_mm/2)**2)
    
    features_dict.update({
        'D_mm': D_mm,
        'd_mm': d_mm,
        'pipe_diameter_ratio': D_mm / (d_mm + 1e-8),
        'pipe_wall_thickness': wall_thickness,
        'pipe_cross_section_area': cross_section_area,
        'pipe_annular_area': annular_area,
        'pressure_per_diameter': features_dict['pressure'] / (D_mm + 1e-8),
        'pressure_diff_per_thickness': features_dict['pressure_diff'] / (wall_thickness + 1e-8),
        'temp_diameter_interaction': features_dict['temperature'] * D_mm,
        'density_diameter_interaction': features_dict['density'] * d_mm
    })
    
    # Lag features (seasonal estimates)
    hour = pred_date.hour
    month = pred_date.month
    
    if month in [12, 1, 2]:  # Winter
        base_volume = 28.0 if 6 <= hour <= 18 else 24.0
    elif month in [6, 7, 8]:  # Summer
        base_volume = 8.0 if 6 <= hour <= 18 else 6.0
    elif month in [3, 4, 5]:  # Spring
        base_volume = 18.0 if 6 <= hour <= 18 else 14.0
    else:  # Fall
        base_volume = 22.0 if 6 <= hour <= 18 else 18.0
    
    features_dict.update({
        'volume_lag_6h': base_volume * 0.95,
        'volume_lag_12h': base_volume * 0.93,
        'volume_lag_24h': base_volume,
        'volume_lag_48h': base_volume * 1.02,
        'volume_lag_168h': base_volume * 0.98,
        'volume_rolling_mean_24h_lag12': base_volume,
        'volume_rolling_std_24h_lag12': base_volume * 0.3,
        'volume_rolling_median_168h_lag24': base_volume
    })
    
    # Create prediction
    X_pred = pd.DataFrame([features_dict])
    X_pred = X_pred[features]  # Ensure correct order
    X_pred_scaled = scaler.transform(X_pred)
    
    prediction = model.predict(X_pred_scaled)[0]
    
    return {
        'date': pred_date.strftime('%Y-%m-%d %H:%M:%S'),
        'predicted_volume': round(prediction, 2),
        'confidence': 'High' if pipe_data and environmental_data else 'Medium' if pipe_data or environmental_data else 'Low',
        'season': 'Winter' if month in [12,1,2] else 'Spring' if month in [3,4,5] else 'Summer' if month in [6,7,8] else 'Fall',
        'model_version': model_info.get('version', '3.0'),
        'pipe_info': {
            'D_mm': D_mm,
            'd_mm': d_mm,
            'wall_thickness': wall_thickness,
            'cross_section_area': cross_section_area,
            'diameter_ratio': D_mm / (d_mm + 1e-8)
        },
        'environmental_conditions': {
            'temperature': features_dict['temperature'],
            'pressure': features_dict['pressure'],
            'pressure_diff': features_dict['pressure_diff'],
            'density': features_dict['density']
        }
    }

# =============================================================================
# FRONTEND ROUTES (Jinja2 Templates)
# =============================================================================

@app.route('/')
def index():
    """Main dashboard page."""
    return render_template('index.html', 
                         model_info=model_info,
                         model_loaded=model is not None)

@app.route('/predict')
def predict_page():
    """Single prediction page."""
    return render_template('predict.html')

@app.route('/batch')
def batch_page():
    """Batch prediction page."""
    return render_template('batch.html')

@app.route('/compare')
def compare_page():
    """Pipe comparison page."""
    return render_template('compare.html')

@app.route('/about')
def about_page():
    """About the model page."""
    return render_template('about.html', 
                         model_info=model_info,
                         features_count=len(features) if features else 0,
                         diameter_stats=diameter_stats)

@app.route('/predict-form', methods=['POST'])
def predict_form():
    """Handle form-based prediction requests."""
    try:
        # Get form data
        prediction_date = request.form.get('prediction_date')
        
        # Environmental data
        environmental_data = {}
        if request.form.get('use_custom_env'):
            environmental_data = {
                'temperature': float(request.form.get('temperature', 15.0)),
                'pressure': float(request.form.get('pressure', 425.0)),
                'pressure_diff': float(request.form.get('pressure_diff', 10.0)),
                'density': float(request.form.get('density', 0.729))
            }
        
        # Pipe data
        pipe_data = {}
        if request.form.get('use_custom_pipe'):
            pipe_data = {
                'D_mm': float(request.form.get('D_mm', 301.0)),
                'd_mm': float(request.form.get('d_mm', 184.0))
            }
        
        # Make prediction
        result = predict_gas_usage_api(
            prediction_date=prediction_date,
            environmental_data=environmental_data if environmental_data else None,
            pipe_data=pipe_data if pipe_data else None
        )
        
        flash('Prediction completed successfully!', 'success')
        return render_template('predict.html', prediction=result)
        
    except Exception as e:
        flash(f'Error making prediction: {str(e)}', 'error')
        return render_template('predict.html')

# =============================================================================
# API ROUTES (REST Endpoints)
# =============================================================================

@app.route('/api')
def api_home():
    """API home endpoint with model information."""
    return jsonify({
        'message': 'Gas Usage Prediction API',
        'version': '1.0',
        'model_loaded': model is not None,
        'model_info': model_info if model_info else {},
        'endpoints': {
            'predict': '/api/predict',
            'batch_predict': '/api/batch-predict',
            'model_info': '/api/model-info',
            'presets': '/api/presets'
        }
    })

@app.route('/api/model-info', methods=['GET'])
def get_model_info():
    """Get model information and statistics."""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    return jsonify({
        'model_info': model_info,
        'features_count': len(features),
        'diameter_stats': diameter_stats,
        'status': 'ready'
    })

@app.route('/api/presets', methods=['GET'])
def get_presets():
    """Get predefined values for the frontend."""
    return jsonify({
        'pipe_configurations': [
            {
                'name': 'Standard Pipe',
                'D_mm': 301.0,
                'd_mm': 184.0,
                'description': 'Most common configuration'
            },
            {
                'name': 'Large Pipe',
                'D_mm': 350.0,
                'd_mm': 220.0,
                'description': 'High capacity configuration'
            },
            {
                'name': 'Extra Large Pipe',
                'D_mm': 400.0,
                'd_mm': 250.0,
                'description': 'Maximum capacity configuration'
            }
        ],
        'environmental_presets': [
            {
                'name': 'Winter Conditions',
                'temperature': 5.0,
                'pressure': 450.0,
                'pressure_diff': 15.0,
                'density': 0.729,
                'season': 'winter'
            },
            {
                'name': 'Spring Conditions',
                'temperature': 12.0,
                'pressure': 420.0,
                'pressure_diff': 12.0,
                'density': 0.729,
                'season': 'spring'
            },
            {
                'name': 'Summer Conditions',
                'temperature': 22.0,
                'pressure': 400.0,
                'pressure_diff': 8.0,
                'density': 0.729,
                'season': 'summer'
            },
            {
                'name': 'Fall Conditions',
                'temperature': 15.0,
                'pressure': 430.0,
                'pressure_diff': 11.0,
                'density': 0.729,
                'season': 'fall'
            }
        ],
        'example_dates': [
            {
                'name': 'Winter Peak',
                'date': '2025-01-15T18:00:00',
                'description': 'High usage winter evening'
            },
            {
                'name': 'Summer Low',
                'date': '2025-07-15T12:00:00',
                'description': 'Low usage summer midday'
            },
            {
                'name': 'Spring Moderate',
                'date': '2025-04-15T12:00:00',
                'description': 'Moderate spring usage'
            },
            {
                'name': 'Fall Evening',
                'date': '2025-10-15T18:00:00',
                'description': 'Fall evening usage'
            }
        ]
    })

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """Single prediction API endpoint."""
    try:
        data = request.get_json()
        
        if not data:
            raise BadRequest("No JSON data provided")
        
        # Validate required fields
        if 'date' not in data:
            raise BadRequest("Date field is required")
        
        prediction_date = data['date']
        environmental_data = data.get('environmental_data')
        pipe_data = data.get('pipe_data')
        
        # Make prediction
        result = predict_gas_usage_api(
            prediction_date=prediction_date,
            environmental_data=environmental_data,
            pipe_data=pipe_data
        )
        
        return jsonify({
            'success': True,
            'prediction': result,
            'timestamp': datetime.now().isoformat()
        })
        
    except ValueError as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'success': False}), 500

@app.route('/api/batch-predict', methods=['POST'])
def api_batch_predict():
    """Batch prediction API endpoint for multiple dates."""
    try:
        data = request.get_json()
        
        if not data or 'requests' not in data:
            raise BadRequest("Requests array is required")
        
        requests = data['requests']
        if not isinstance(requests, list):
            raise BadRequest("Requests must be an array")
        
        if len(requests) > 100:
            raise BadRequest("Maximum 100 predictions per batch")
        
        results = []
        
        for i, req in enumerate(requests):
            try:
                prediction = predict_gas_usage_api(
                    prediction_date=req.get('date'),
                    environmental_data=req.get('environmental_data'),
                    pipe_data=req.get('pipe_data')
                )
                results.append({
                    'index': i,
                    'success': True,
                    'prediction': prediction
                })
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'total_requests': len(requests),
            'successful_predictions': sum(1 for r in results if r['success']),
            'timestamp': datetime.now().isoformat()
        })
        
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'success': False}), 500

@app.route('/api/compare-pipes', methods=['POST'])
def api_compare_pipes():
    """Compare different pipe configurations for the same conditions."""
    try:
        data = request.get_json()
        
        if not data or 'date' not in data:
            raise BadRequest("Date is required")
        
        prediction_date = data['date']
        environmental_data = data.get('environmental_data')
        pipe_configs = data.get('pipe_configurations', [
            {'name': 'Standard', 'D_mm': 301.0, 'd_mm': 184.0},
            {'name': 'Large', 'D_mm': 350.0, 'd_mm': 220.0},
            {'name': 'Extra Large', 'D_mm': 400.0, 'd_mm': 250.0}
        ])
        
        results = []
        
        for config in pipe_configs:
            try:
                prediction = predict_gas_usage_api(
                    prediction_date=prediction_date,
                    environmental_data=environmental_data,
                    pipe_data=config
                )
                results.append({
                    'config_name': config.get('name', 'Unknown'),
                    'pipe_data': config,
                    'prediction': prediction,
                    'success': True
                })
            except Exception as e:
                results.append({
                    'config_name': config.get('name', 'Unknown'),
                    'pipe_data': config,
                    'error': str(e),
                    'success': False
                })
        
        # Sort by predicted volume (successful predictions only)
        successful_results = [r for r in results if r['success']]
        successful_results.sort(key=lambda x: x['prediction']['predicted_volume'], reverse=True)
        
        return jsonify({
            'success': True,
            'date': prediction_date,
            'comparisons': results,
            'ranked_results': successful_results,
            'best_config': successful_results[0] if successful_results else None,
            'timestamp': datetime.now().isoformat()
        })
        
    except BadRequest as e:
        return jsonify({'error': str(e), 'success': False}), 400
    except Exception as e:
        logger.error(f"Pipe comparison error: {str(e)}")
        return jsonify({'error': 'Internal server error', 'success': False}), 500

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Endpoint not found', 'success': False}), 404
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Internal server error', 'success': False}), 500
    return render_template('500.html'), 500

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

@app.template_filter('datetime')
def datetime_filter(value):
    """Format datetime for templates."""
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace('Z', '+00:00'))
    return value.strftime('%Y-%m-%d %H:%M:%S')

@app.template_filter('round2')
def round2_filter(value):
    """Round to 2 decimal places."""
    try:
        return round(float(value), 2)
    except:
        return value

# Initialize the application
# Production configuration
if __name__ != '__main__':
    # Gunicorn configuration
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Ensure model is loaded
    if model is None:
        try:
            load_model()
            logger.info("Model loaded successfully in production")
        except Exception as e:
            logger.error(f"Failed to load model in production: {e}")