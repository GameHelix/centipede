# =====================================================================================
# FLASK INTEGRATION: PURE PHYSICS GAS PREDICTION MODEL
# Drop-in replacement for your current prediction function in main.py
# =====================================================================================

import pandas as pd
import numpy as np
from sklearn.preprocessing import RobustScaler
from sklearn.linear_model import Ridge
import joblib
from datetime import datetime
import os

class PurePhysicsPredictor:
    """
    Deployment-ready pure physics gas prediction model for Flask integration
    """
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_fitted = False
    
    def create_physics_features(self, data_dict, pred_date):
        """
        Create physics features from input parameters
        """
        # Parse date
        if isinstance(pred_date, str):
            pred_date = pd.to_datetime(pred_date)
        
        features = {}
        
        # ====================================================================
        # TEMPORAL FEATURES (NO LAG DEPENDENCIES)
        # ====================================================================
        
        # Cyclical temporal features
        features['hour_sin'] = np.sin(2 * np.pi * pred_date.hour/24)
        features['hour_cos'] = np.cos(2 * np.pi * pred_date.hour/24)
        features['month_sin'] = np.sin(2 * np.pi * pred_date.month/12)
        features['month_cos'] = np.cos(2 * np.pi * pred_date.month/12)
        features['day_of_week_sin'] = np.sin(2 * np.pi * pred_date.dayofweek/7)
        features['day_of_week_cos'] = np.cos(2 * np.pi * pred_date.dayofweek/7)
        features['is_weekend'] = 1 if pred_date.dayofweek >= 5 else 0
        features['day_of_month'] = pred_date.day
        
        # ====================================================================
        # ENVIRONMENTAL FEATURES
        # ====================================================================
        
        # Base environmental
        features['density'] = data_dict.get('density', 0.729)
        features['pressure_diff'] = data_dict.get('pressure_diff', 10.0)
        features['pressure'] = data_dict.get('pressure', 425.0)
        features['temperature'] = data_dict.get('temperature', 15.0)
        
        # Environmental interactions
        features['temp_pressure_interaction'] = features['temperature'] * features['pressure']
        features['pressure_density_ratio'] = features['pressure'] / (features['density'] + 1e-8)
        features['temp_density_interaction'] = features['temperature'] * features['density']
        
        # Advanced environmental physics
        features['temp_pressure_ratio'] = features['temperature'] / (features['pressure'] + 1e-8)
        features['density_temperature_ratio'] = features['density'] / (features['temperature'] + 273.15)
        features['ideal_gas_factor'] = (features['pressure'] * features['density']) / (features['temperature'] + 273.15)
        
        # ====================================================================
        # PIPE PHYSICS FEATURES
        # ====================================================================
        
        # Base pipe dimensions
        features['D_mm'] = data_dict.get('D_mm', 301.0)
        features['d_mm'] = data_dict.get('d_mm', 184.0)
        
        # Derived pipe features
        features['pipe_wall_thickness'] = (features['D_mm'] - features['d_mm']) / 2
        features['pipe_cross_section_area'] = np.pi * (features['d_mm']/2)**2
        features['pipe_diameter_ratio'] = features['D_mm'] / (features['d_mm'] + 1e-8)
        
        # Advanced pipe physics
        features['hydraulic_diameter'] = 4 * features['pipe_cross_section_area'] / (np.pi * features['d_mm'])
        features['flow_area_efficiency'] = features['pipe_cross_section_area'] / (features['D_mm']**2)
        features['wall_thickness_ratio'] = features['pipe_wall_thickness'] / features['D_mm']
        
        # Pressure-flow relationships
        features['pressure_per_diameter'] = features['pressure'] / (features['D_mm'] + 1e-8)
        features['pressure_diff_per_thickness'] = features['pressure_diff'] / (features['pipe_wall_thickness'] + 1e-8)
        features['pressure_gradient'] = features['pressure_diff'] / (features['pipe_wall_thickness'] + 1e-8)
        
        # Flow capacity
        features['theoretical_flow_capacity'] = (
            features['pipe_cross_section_area'] * 
            np.sqrt(features['pressure_diff'] + 1e-8) / 
            np.sqrt(features['density'] + 1e-8) / 1000  # Normalize
        )
        
        # ====================================================================
        # SEASONAL & DEMAND FEATURES (PHYSICS-BASED, NO LAGS)
        # ====================================================================
        
        # Heating demand (physics-based)
        features['heating_demand'] = max(0, 18 - features['temperature'])
        features['cooling_demand'] = max(0, features['temperature'] - 22)
        
        # Seasonal intensity
        month = pred_date.month
        if month in [12, 1, 2]:  # Winter
            features['seasonal_intensity'] = 3.0
        elif month in [6, 7, 8]:  # Summer
            features['seasonal_intensity'] = 1.0
        elif month in [3, 4, 5]:  # Spring
            features['seasonal_intensity'] = 2.0
        else:  # Fall
            features['seasonal_intensity'] = 2.5
        
        # Daily demand patterns
        hour = pred_date.hour
        if 6 <= hour <= 9:  # Morning peak
            features['daily_demand_factor'] = 1.3
        elif 17 <= hour <= 20:  # Evening peak
            features['daily_demand_factor'] = 1.5
        elif hour >= 22 or hour <= 5:  # Night low
            features['daily_demand_factor'] = 0.7
        else:
            features['daily_demand_factor'] = 1.0
        
        # Seasonal factors
        features['winter_factor'] = 1 + features['heating_demand'] * 0.1 if month in [12, 1, 2] else 1.0
        features['summer_factor'] = 1 - features['cooling_demand'] * 0.05 if month in [6, 7, 8] else 1.0
        
        # ====================================================================
        # PHYSICS-BASED PROXY FEATURES (REPLACE LAG FEATURES)
        # ====================================================================
        
        # System inertia proxies (physics-based, no historical data needed)
        features['system_thermal_mass'] = features['D_mm'] * features['d_mm'] * 0.001
        features['pressure_wave_delay'] = features['D_mm'] / 100
        features['thermal_response_time'] = 1000 / (features['temperature'] + 273.15)
        
        # Capacity utilization
        features['capacity_utilization_proxy'] = features['theoretical_flow_capacity'] * 0.7
        
        # System state indicators
        features['system_pressure_state'] = features['pressure'] / (features['density'] + 1e-8)
        features['flow_efficiency_state'] = (
            features['pressure_diff'] / (features['pressure'] + 1e-8) * 
            features['pipe_cross_section_area'] / 1000
        )
        
        # ====================================================================
        # ADVANCED INTERACTION FEATURES
        # ====================================================================
        
        # Multi-way interactions (normalized)
        features['temp_pressure_diameter'] = (
            features['temperature'] * features['pressure'] * features['d_mm'] / 1000000
        )
        features['seasonal_pipe_interaction'] = (
            features['seasonal_intensity'] * features['pipe_cross_section_area'] / 10000
        )
        features['demand_capacity_ratio'] = (
            features['daily_demand_factor'] * features['theoretical_flow_capacity']
        )
        
        # Environmental stability proxies
        features['temp_stability_proxy'] = abs(features['temperature'] - 15)
        features['pressure_stability_proxy'] = abs(features['pressure'] - 425)
        
        return features
    
    def get_feature_names(self):
        """Return ordered list of feature names"""
        return [
            # Temporal
            'hour_sin', 'hour_cos', 'month_sin', 'month_cos', 
            'day_of_week_sin', 'day_of_week_cos', 'is_weekend', 'day_of_month',
            
            # Environmental
            'density', 'pressure_diff', 'pressure', 'temperature',
            'temp_pressure_interaction', 'pressure_density_ratio', 'temp_density_interaction',
            'temp_pressure_ratio', 'density_temperature_ratio', 'ideal_gas_factor',
            'heating_demand', 'cooling_demand', 'winter_factor', 'summer_factor',
            
            # Pipe physics
            'D_mm', 'd_mm', 'pipe_wall_thickness', 'pipe_cross_section_area',
            'pipe_diameter_ratio', 'hydraulic_diameter', 'flow_area_efficiency',
            'wall_thickness_ratio', 'pressure_per_diameter', 'pressure_diff_per_thickness',
            'pressure_gradient', 'theoretical_flow_capacity',
            
            # Seasonal and demand
            'seasonal_intensity', 'daily_demand_factor',
            
            # Physics proxies (replace lag features)
            'system_thermal_mass', 'pressure_wave_delay', 'thermal_response_time',
            'capacity_utilization_proxy', 'system_pressure_state', 'flow_efficiency_state',
            
            # Advanced interactions
            'temp_pressure_diameter', 'seasonal_pipe_interaction', 'demand_capacity_ratio',
            'temp_stability_proxy', 'pressure_stability_proxy'
        ]
    
    def train_from_data(self, df_path='data/data.csv'):
        """
        Train the pure physics model from your data
        """
        print("🔧 Training Pure Physics Model for Flask Integration...")
        
        # Load and preprocess data
        df = pd.read_csv(df_path)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Apply winsorization (same as your original)
        numeric_cols = ['density', 'pressure_diff', 'pressure', 'temperature', 
                       'hourly_volume', 'daily_volume', 'D_mm', 'd_mm']
        
        for col in numeric_cols:
            if col in df.columns:
                lower_cap = df[col].quantile(0.01)
                upper_cap = df[col].quantile(0.99)
                df[col] = df[col].clip(lower=lower_cap, upper=upper_cap)
        
        # Create features for all samples
        feature_names = self.get_feature_names()
        feature_data = []
        targets = []
        
        print(f"📊 Processing {len(df)} samples...")
        
        for idx, row in df.iterrows():
            try:
                # Create feature dict
                data_dict = {
                    'temperature': row['temperature'],
                    'pressure': row['pressure'],
                    'pressure_diff': row['pressure_diff'],
                    'density': row['density'],
                    'D_mm': row['D_mm'],
                    'd_mm': row['d_mm']
                }
                
                # Create features
                features = self.create_physics_features(data_dict, row['timestamp'])
                
                # Extract features in correct order
                feature_vector = [features[name] for name in feature_names]
                feature_data.append(feature_vector)
                targets.append(row['hourly_volume'])
                
            except Exception as e:
                continue
        
        # Convert to arrays
        X = np.array(feature_data)
        y = np.array(targets)
        
        print(f"✅ Created feature matrix: {X.shape}")
        
        # Scale features
        self.scaler = RobustScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = Ridge(alpha=1.0)
        self.model.fit(X_scaled, y)
        
        self.is_fitted = True
        
        # Evaluate
        from sklearn.metrics import r2_score, mean_squared_error
        y_pred = self.model.predict(X_scaled)
        r2 = r2_score(y, y_pred)
        rmse = np.sqrt(mean_squared_error(y, y_pred))
        
        print(f"🎯 Training Results:")
        print(f"   R²: {r2:.4f} ({r2*100:.2f}%)")
        print(f"   RMSE: {rmse:.2f} m³/hour")
        print(f"   Features: {len(feature_names)} (no lag dependencies)")
        
        return self
    
    def predict(self, prediction_date, environmental_data=None, pipe_data=None):
        """
        Make prediction - drop-in replacement for your current function
        """
        if not self.is_fitted:
            raise ValueError("Model must be trained first")
        
        # Parse date
        if isinstance(prediction_date, str):
            pred_date = pd.to_datetime(prediction_date)
        else:
            pred_date = prediction_date
        
        # Prepare data dictionary
        data_dict = {}
        
        # Environmental data with seasonal defaults
        if environmental_data:
            data_dict.update(environmental_data)
        else:
            # Your existing seasonal defaults
            month = pred_date.month
            if month in [12, 1, 2]:  # Winter
                data_dict.update({'temperature': 5.0, 'pressure': 450.0, 'pressure_diff': 15.0, 'density': 0.729})
            elif month in [6, 7, 8]:  # Summer
                data_dict.update({'temperature': 22.0, 'pressure': 400.0, 'pressure_diff': 8.0, 'density': 0.729})
            elif month in [3, 4, 5]:  # Spring
                data_dict.update({'temperature': 12.0, 'pressure': 420.0, 'pressure_diff': 12.0, 'density': 0.729})
            else:  # Fall
                data_dict.update({'temperature': 15.0, 'pressure': 430.0, 'pressure_diff': 11.0, 'density': 0.729})
        
        # Pipe data with defaults
        if pipe_data:
            data_dict.update(pipe_data)
        else:
            data_dict.update({'D_mm': 301.0, 'd_mm': 184.0})
        
        # Create features
        features = self.create_physics_features(data_dict, pred_date)
        
        # Extract features in correct order
        feature_names = self.get_feature_names()
        feature_vector = np.array([[features[name] for name in feature_names]])
        
        # Scale and predict
        feature_vector_scaled = self.scaler.transform(feature_vector)
        prediction = self.model.predict(feature_vector_scaled)[0]
        
        # Return in same format as your original function
        return {
            'date': pred_date.strftime('%Y-%m-%d %H:%M:%S'),
            'predicted_volume': round(prediction, 2),
            'confidence': 'High' if environmental_data and pipe_data else 'Medium' if environmental_data or pipe_data else 'Low',
            'season': 'Winter' if pred_date.month in [12,1,2] else 'Spring' if pred_date.month in [3,4,5] else 'Summer' if pred_date.month in [6,7,8] else 'Fall',
            'model_version': '4.0 (Pure Physics)',
            'pipe_info': {
                'D_mm': data_dict['D_mm'],
                'd_mm': data_dict['d_mm'],
                'wall_thickness': (data_dict['D_mm'] - data_dict['d_mm']) / 2,
                'cross_section_area': np.pi * (data_dict['d_mm']/2)**2,
                'diameter_ratio': data_dict['D_mm'] / (data_dict['d_mm'] + 1e-8)
            },
            'environmental_conditions': {
                'temperature': data_dict['temperature'],
                'pressure': data_dict['pressure'],
                'pressure_diff': data_dict['pressure_diff'],
                'density': data_dict['density']
            }
        }
    
    def save_model(self, filepath='models/pure_physics_gas_model.pkl'):
        """Save model for Flask integration"""
        if not self.is_fitted:
            raise ValueError("Model must be trained first")
        
        model_package = {
            'model': self.model,
            'scaler': self.scaler,
            'predictor': self,
            'model_info': {
                'model_type': 'Pure Physics Gas Prediction',
                'version': '4.0 (Flask Ready)',
                'created_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'approach': 'No lag dependencies - deployment ready',
                'feature_count': len(self.get_feature_names())
            }
        }
        
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        joblib.dump(model_package, filepath)
        print(f"💾 Pure Physics Model saved to: {filepath}")
        return filepath

# =====================================================================================
# FLASK INTEGRATION FUNCTIONS
# =====================================================================================

# Global predictor instance
pure_physics_predictor = None

def load_pure_physics_model(model_path='models/pure_physics_gas_model.pkl'):
    """
    Load pure physics model for Flask app
    """
    global pure_physics_predictor
    
    try:
        if os.path.exists(model_path):
            model_package = joblib.load(model_path)
            pure_physics_predictor = model_package['predictor']
            print(f"✅ Pure Physics Model loaded from: {model_path}")
            print(f"   Version: {model_package['model_info']['version']}")
            return True
        else:
            print(f"❌ Model file not found: {model_path}")
            return False
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def predict_gas_usage_pure_physics(prediction_date, environmental_data=None, pipe_data=None):
    """
    DROP-IN REPLACEMENT for your current predict_gas_usage_api function
    
    This function has the exact same interface as your current one,
    but uses pure physics features instead of lag features.
    """
    global pure_physics_predictor
    
    if pure_physics_predictor is None:
        raise ValueError("Pure Physics model not loaded. Call load_pure_physics_model() first.")
    
    return pure_physics_predictor.predict(prediction_date, environmental_data, pipe_data)

# =====================================================================================
# SETUP AND TRAINING SCRIPT
# =====================================================================================

def setup_pure_physics_model():
    """
    One-time setup: train and save pure physics model
    """
    print("🚀 SETTING UP PURE PHYSICS MODEL FOR FLASK")
    print("="*50)
    
    # Create and train predictor
    predictor = PurePhysicsPredictor()
    predictor.train_from_data('data/data.csv')
    
    # Save model
    model_path = predictor.save_model()
    
    print(f"✅ Setup complete!")
    print(f"💡 To use in Flask app:")
    print(f"   1. Replace your predict_gas_usage_api with predict_gas_usage_pure_physics")
    print(f"   2. Call load_pure_physics_model() on app startup")
    print(f"   3. Your API will work exactly the same, but without lag dependencies!")
    
    return model_path

if __name__ == "__main__":
    # Run setup
    setup_pure_physics_model()
    
    # Test the integration
    print("\n🧪 TESTING FLASK INTEGRATION...")
    
    # Load model
    if load_pure_physics_model():
        # Test prediction
        result = predict_gas_usage_pure_physics(
            prediction_date='2025-01-15 18:00:00',
            environmental_data={'temperature': 5.0, 'pressure': 450.0, 'pressure_diff': 15.0, 'density': 0.729},
            pipe_data={'D_mm': 301.0, 'd_mm': 184.0}
        )
        
        print(f"🔮 Test Prediction:")
        print(f"   Date: {result['date']}")
        print(f"   Volume: {result['predicted_volume']} m³/hour")
        print(f"   Confidence: {result['confidence']}")
        print(f"   Model: {result['model_version']}")
        
        print(f"\n✅ FLASK INTEGRATION READY!")
        print(f"🚀 Your Flask app can now use pure physics predictions!")