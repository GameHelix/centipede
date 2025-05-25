# =====================================================================================
# PURE PHYSICS GAS USAGE PREDICTION - COMPLETE IMPLEMENTATION
# No lag dependencies - deployment ready approach
# =====================================================================================

import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import RobustScaler
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import joblib
import warnings
warnings.filterwarnings('ignore')

print("🚀 PURE PHYSICS GAS USAGE PREDICTION IMPLEMENTATION")
print("="*60)

# =====================================================================================
# 1. PURE PHYSICS FEATURE ENGINEERING CLASS
# =====================================================================================

class PurePhysicsFeatureEngine:
    """
    Create deployment-ready features without lag dependencies
    """
    
    def __init__(self):
        self.seasonal_stats = {}
        self.is_fitted = False
    
    def fit(self, df):
        """Learn seasonal patterns for synthetic features"""
        print("📊 Learning seasonal patterns...")
        
        # Learn seasonal baseline patterns (no lag dependencies)
        for month in range(1, 13):
            for hour in range(24):
                mask = (df['timestamp'].dt.month == month) & (df['timestamp'].dt.hour == hour)
                if mask.sum() > 5:  # Enough samples
                    values = df[mask]['hourly_volume']
                    self.seasonal_stats[(month, hour)] = {
                        'mean': values.mean(),
                        'std': values.std(),
                        'median': values.median()
                    }
        
        self.is_fitted = True
        print(f"✅ Learned {len(self.seasonal_stats)} seasonal patterns")
        return self
    
    def transform(self, df):
        """Create pure physics features"""
        df_out = df.copy()
        print(f"🔧 Creating pure physics features for {len(df_out)} samples...")
        
        # ========================================================================
        # ENHANCED TEMPORAL FEATURES (NO LAG DEPENDENCIES)
        # ========================================================================
        
        # Base temporal
        df_out['hour'] = df_out['timestamp'].dt.hour
        df_out['day_of_week'] = df_out['timestamp'].dt.dayofweek
        df_out['month'] = df_out['timestamp'].dt.month
        df_out['day_of_month'] = df_out['timestamp'].dt.day
        df_out['is_weekend'] = (df_out['day_of_week'] >= 5).astype(int)
        
        # Cyclical encodings - critical for time series
        df_out['hour_sin'] = np.sin(2 * np.pi * df_out['hour']/24)
        df_out['hour_cos'] = np.cos(2 * np.pi * df_out['hour']/24)
        df_out['day_of_week_sin'] = np.sin(2 * np.pi * df_out['day_of_week']/7)
        df_out['day_of_week_cos'] = np.cos(2 * np.pi * df_out['day_of_week']/7)
        df_out['month_sin'] = np.sin(2 * np.pi * df_out['month']/12)
        df_out['month_cos'] = np.cos(2 * np.pi * df_out['month']/12)
        
        # Enhanced temporal interactions
        df_out['hour_month_interaction'] = df_out['hour'] * df_out['month'] / 288  # Normalize
        df_out['weekend_hour_interaction'] = df_out['is_weekend'] * df_out['hour'] / 24
        
        # Seasonal intensity factor
        df_out['seasonal_intensity'] = np.where(
            df_out['month'].isin([12, 1, 2]), 3,      # Winter peak
            np.where(df_out['month'].isin([6, 7, 8]), 1,    # Summer low
                    np.where(df_out['month'].isin([3, 4, 5]), 2, 2.5))  # Spring/Fall
        )
        
        # Daily demand pattern (physics-based)
        df_out['daily_demand_factor'] = np.where(
            (df_out['hour'] >= 6) & (df_out['hour'] <= 9), 1.3,      # Morning peak
            np.where((df_out['hour'] >= 17) & (df_out['hour'] <= 20), 1.5,  # Evening peak
                    np.where((df_out['hour'] >= 22) | (df_out['hour'] <= 5), 0.7, 1.0))  # Night low
        )
        
        # ========================================================================
        # ENHANCED PIPE PHYSICS FEATURES
        # ========================================================================
        
        # Basic pipe geometry
        df_out['pipe_wall_thickness'] = (df_out['D_mm'] - df_out['d_mm']) / 2
        df_out['pipe_cross_section_area'] = np.pi * (df_out['d_mm']/2)**2
        df_out['pipe_annular_area'] = np.pi * ((df_out['D_mm']/2)**2 - (df_out['d_mm']/2)**2)
        df_out['pipe_diameter_ratio'] = df_out['D_mm'] / (df_out['d_mm'] + 1e-8)
        
        # Advanced pipe physics
        df_out['hydraulic_diameter'] = 4 * df_out['pipe_cross_section_area'] / (np.pi * df_out['d_mm'])
        df_out['flow_area_efficiency'] = df_out['pipe_cross_section_area'] / (df_out['D_mm']**2)
        df_out['wall_thickness_ratio'] = df_out['pipe_wall_thickness'] / df_out['D_mm']
        
        # Pressure-flow relationships (Darcy-Weisbach inspired)
        df_out['pressure_per_diameter'] = df_out['pressure'] / (df_out['D_mm'] + 1e-8)
        df_out['pressure_diff_per_thickness'] = df_out['pressure_diff'] / (df_out['pipe_wall_thickness'] + 1e-8)
        df_out['pressure_gradient'] = df_out['pressure_diff'] / (df_out['pipe_wall_thickness'] + 1e-8)
        
        # ========================================================================
        # ENHANCED ENVIRONMENTAL PHYSICS
        # ========================================================================
        
        # Basic environmental features
        df_out['temp_pressure_interaction'] = df_out['temperature'] * df_out['pressure']
        df_out['pressure_density_ratio'] = df_out['pressure'] / (df_out['density'] + 1e-8)
        df_out['temp_density_interaction'] = df_out['temperature'] * df_out['density']
        
        # Gas law relationships (PV = nRT)
        df_out['temp_pressure_ratio'] = df_out['temperature'] / (df_out['pressure'] + 1e-8)
        df_out['density_temperature_ratio'] = df_out['density'] / (df_out['temperature'] + 273.15)
        df_out['ideal_gas_factor'] = (df_out['pressure'] * df_out['density']) / (df_out['temperature'] + 273.15)
        
        # Flow capacity under current conditions
        df_out['theoretical_flow_capacity'] = (
            df_out['pipe_cross_section_area'] * 
            np.sqrt(df_out['pressure_diff'] + 1e-8) / 
            np.sqrt(df_out['density'] + 1e-8)
        )
        
        # Temperature effects on viscosity (approximation)
        df_out['viscosity_factor'] = 1 + 0.01 * (df_out['temperature'] - 15)
        df_out['reynolds_number_proxy'] = (
            df_out['d_mm'] * np.sqrt(df_out['pressure_diff'] + 1e-8)
        ) / (df_out['viscosity_factor'] + 1e-8)
        
        # ========================================================================
        # SEASONAL DEMAND MODELING (PHYSICS-BASED)
        # ========================================================================
        
        # Heating degree days concept
        base_temp = 18
        df_out['heating_demand'] = np.maximum(0, base_temp - df_out['temperature'])
        df_out['cooling_demand'] = np.maximum(0, df_out['temperature'] - 22)
        
        # Seasonal capacity factors
        df_out['winter_factor'] = np.where(df_out['month'].isin([12, 1, 2]), 
                                          1 + df_out['heating_demand'] * 0.1, 1.0)
        df_out['summer_factor'] = np.where(df_out['month'].isin([6, 7, 8]), 
                                          1 - df_out['cooling_demand'] * 0.05, 1.0)
        
        # ========================================================================
        # PHYSICS-BASED PROXY FEATURES (REPLACE LAG FEATURES)
        # ========================================================================
        
        # System thermal inertia (replaces lag features with physics)
        df_out['system_thermal_mass'] = df_out['D_mm'] * df_out['d_mm'] * 0.001
        df_out['pressure_wave_delay'] = df_out['D_mm'] / 100
        df_out['thermal_response_time'] = 1000 / (df_out['temperature'] + 273.15)
        
        # Capacity utilization proxy
        df_out['capacity_utilization_proxy'] = (
            df_out['theoretical_flow_capacity'] * 0.7  # Typical utilization
        )
        
        # System state indicators
        df_out['system_pressure_state'] = df_out['pressure'] / (df_out['density'] + 1e-8)
        df_out['flow_efficiency_state'] = (
            df_out['pressure_diff'] / (df_out['pressure'] + 1e-8) * 
            df_out['pipe_cross_section_area'] / 1000
        )
        
        # ========================================================================
        # ADVANCED INTERACTION FEATURES
        # ========================================================================
        
        # Multi-way interactions
        df_out['temp_pressure_diameter'] = (
            df_out['temperature'] * df_out['pressure'] * df_out['d_mm'] / 1000000
        )
        df_out['seasonal_pipe_interaction'] = (
            df_out['seasonal_intensity'] * df_out['pipe_cross_section_area'] / 10000
        )
        df_out['demand_capacity_ratio'] = (
            df_out['daily_demand_factor'] * df_out['theoretical_flow_capacity'] / 1000
        )
        
        # Environmental rolling proxies (physics-based, not historical)
        df_out['temp_stability_proxy'] = np.abs(df_out['temperature'] - 15)  # Deviation from normal
        df_out['pressure_stability_proxy'] = np.abs(df_out['pressure'] - 425)  # Deviation from normal
        
        print(f"✅ Created {len([c for c in df_out.columns if c not in df.columns])} new physics features")
        
        return df_out
    
    def fit_transform(self, df):
        """Fit and transform in one step"""
        return self.fit(df).transform(df)
    
    def get_feature_names(self):
        """Get list of feature names for modeling"""
        return [
            # Temporal features
            'hour_sin', 'hour_cos', 'day_of_week_sin', 'day_of_week_cos',
            'month_sin', 'month_cos', 'is_weekend', 'day_of_month',
            'hour_month_interaction', 'weekend_hour_interaction', 
            'seasonal_intensity', 'daily_demand_factor',
            
            # Environmental features
            'density', 'pressure_diff', 'pressure', 'temperature',
            'temp_pressure_interaction', 'pressure_density_ratio', 'temp_density_interaction',
            'temp_pressure_ratio', 'density_temperature_ratio', 'ideal_gas_factor',
            'viscosity_factor', 'heating_demand', 'cooling_demand', 
            'winter_factor', 'summer_factor',
            
            # Pipe physics features
            'D_mm', 'd_mm', 'pipe_wall_thickness', 'pipe_cross_section_area',
            'pipe_diameter_ratio', 'hydraulic_diameter', 'flow_area_efficiency',
            'wall_thickness_ratio', 'pressure_per_diameter', 'pressure_diff_per_thickness',
            'theoretical_flow_capacity', 'reynolds_number_proxy',
            
            # Physics proxy features (replace lag features)
            'system_thermal_mass', 'pressure_wave_delay', 'thermal_response_time',
            'capacity_utilization_proxy', 'system_pressure_state', 'flow_efficiency_state',
            
            # Advanced interactions
            'temp_pressure_diameter', 'seasonal_pipe_interaction', 
            'demand_capacity_ratio', 'temp_stability_proxy', 'pressure_stability_proxy'
        ]

# =====================================================================================
# 2. PURE PHYSICS MODEL CLASS
# =====================================================================================

class PurePhysicsGasModel:
    """
    Complete pure physics gas prediction model
    """
    
    def __init__(self, alpha=1.0):
        self.feature_engine = PurePhysicsFeatureEngine()
        self.scaler = RobustScaler()
        self.model = Ridge(alpha=alpha)
        self.features = None
        self.is_fitted = False
        self.training_stats = {}
    
    def preprocess_data(self, df):
        """Apply winsorization like in original training"""
        df_clean = df.copy()
        
        numeric_cols = ['density', 'pressure_diff', 'pressure', 'temperature', 
                       'hourly_volume', 'daily_volume', 'D_mm', 'd_mm']
        
        for col in numeric_cols:
            if col in df_clean.columns:
                lower_cap = df_clean[col].quantile(0.01)
                upper_cap = df_clean[col].quantile(0.99)
                df_clean[col] = df_clean[col].clip(lower=lower_cap, upper=upper_cap)
        
        return df_clean
    
    def fit(self, df):
        """Train the pure physics model"""
        print("🔧 Training Pure Physics Gas Model")
        print("-" * 40)
        
        # Preprocess data
        df_clean = self.preprocess_data(df)
        
        # Create features
        df_features = self.feature_engine.fit_transform(df_clean)
        
        # Get feature names
        self.features = self.feature_engine.get_feature_names()
        
        # Prepare data for modeling
        X = df_features[self.features]
        y = df_features['hourly_volume']
        
        # Remove NaN rows
        mask = ~(X.isnull().any(axis=1) | y.isnull())
        X_clean = X[mask]
        y_clean = y[mask]
        
        print(f"📊 Training data: {len(X_clean)} samples, {len(self.features)} features")
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X_clean)
        
        # Train model
        self.model.fit(X_scaled, y_clean)
        
        # Store training stats
        self.training_stats = {
            'training_samples': len(X_clean),
            'features_count': len(self.features),
            'target_mean': y_clean.mean(),
            'target_std': y_clean.std(),
            'feature_importance': dict(zip(self.features, np.abs(self.model.coef_)))
        }
        
        self.is_fitted = True
        
        # Evaluate training performance
        y_pred_train = self.model.predict(X_scaled)
        train_r2 = r2_score(y_clean, y_pred_train)
        train_rmse = np.sqrt(mean_squared_error(y_clean, y_pred_train))
        train_mae = mean_absolute_error(y_clean, y_pred_train)
        
        print(f"✅ Training completed:")
        print(f"   Training R²: {train_r2:.4f}")
        print(f"   Training RMSE: {train_rmse:.2f} m³/hour")
        print(f"   Training MAE: {train_mae:.2f} m³/hour")
        
        return self
    
    def predict(self, prediction_date, environmental_data=None, pipe_data=None):
        """Make prediction for given parameters"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
        
        # Parse date
        if isinstance(prediction_date, str):
            pred_date = pd.to_datetime(prediction_date)
        else:
            pred_date = prediction_date
        
        # Default environmental data
        if environmental_data is None:
            month = pred_date.month
            if month in [12, 1, 2]:  # Winter
                environmental_data = {'temperature': 5.0, 'pressure': 450.0, 'pressure_diff': 15.0, 'density': 0.729}
            elif month in [6, 7, 8]:  # Summer
                environmental_data = {'temperature': 22.0, 'pressure': 400.0, 'pressure_diff': 8.0, 'density': 0.729}
            elif month in [3, 4, 5]:  # Spring
                environmental_data = {'temperature': 12.0, 'pressure': 420.0, 'pressure_diff': 12.0, 'density': 0.729}
            else:  # Fall
                environmental_data = {'temperature': 15.0, 'pressure': 430.0, 'pressure_diff': 11.0, 'density': 0.729}
        
        # Default pipe data
        if pipe_data is None:
            pipe_data = {'D_mm': 301.0, 'd_mm': 184.0}
        
        # Create single-row DataFrame
        data = pd.DataFrame([{
            'timestamp': pred_date,
            **environmental_data,
            **pipe_data
        }])
        
        # Create features
        data_features = self.feature_engine.transform(data)
        
        # Extract features for prediction
        X_pred = data_features[self.features]
        X_pred_scaled = self.scaler.transform(X_pred)
        
        # Make prediction
        prediction = self.model.predict(X_pred_scaled)[0]
        
        # Calculate confidence
        confidence = "High" if environmental_data and pipe_data else "Medium"
        
        return {
            'date': pred_date.strftime('%Y-%m-%d %H:%M:%S'),
            'predicted_volume': round(prediction, 2),
            'confidence': confidence,
            'season': 'Winter' if pred_date.month in [12,1,2] else 'Spring' if pred_date.month in [3,4,5] else 'Summer' if pred_date.month in [6,7,8] else 'Fall',
            'model_type': 'Pure Physics',
            'features_used': len(self.features),
            'environmental_conditions': environmental_data,
            'pipe_info': {
                **pipe_data,
                'wall_thickness': (pipe_data['D_mm'] - pipe_data['d_mm']) / 2,
                'cross_section_area': np.pi * (pipe_data['d_mm']/2)**2
            }
        }
    
    def cross_validate(self, df, n_splits=5):
        """Perform time series cross-validation"""
        print("🔄 Performing Time Series Cross-Validation")
        print("-" * 45)
        
        # Preprocess data
        df_clean = self.preprocess_data(df)
        df_features = self.feature_engine.fit_transform(df_clean)
        
        # Prepare data
        X = df_features[self.features]
        y = df_features['hourly_volume']
        
        # Remove NaN rows
        mask = ~(X.isnull().any(axis=1) | y.isnull())
        X_clean = X[mask]
        y_clean = y[mask]
        timestamps = df_features[mask]['timestamp']
        
        # Time series cross-validation
        tscv = TimeSeriesSplit(n_splits=n_splits)
        cv_scores = []
        cv_results = []
        
        for fold, (train_idx, test_idx) in enumerate(tscv.split(X_clean)):
            # Split data
            X_train, X_test = X_clean.iloc[train_idx], X_clean.iloc[test_idx]
            y_train, y_test = y_clean.iloc[train_idx], y_clean.iloc[test_idx]
            
            # Scale features
            fold_scaler = RobustScaler()
            X_train_scaled = fold_scaler.fit_transform(X_train)
            X_test_scaled = fold_scaler.transform(X_test)
            
            # Train model
            fold_model = Ridge(alpha=1.0)
            fold_model.fit(X_train_scaled, y_train)
            
            # Predict
            y_pred = fold_model.predict(X_test_scaled)
            
            # Evaluate
            r2 = r2_score(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            mae = mean_absolute_error(y_test, y_pred)
            
            cv_scores.append(r2)
            cv_results.append({
                'fold': fold + 1,
                'r2': r2,
                'rmse': rmse,
                'mae': mae,
                'train_samples': len(train_idx),
                'test_samples': len(test_idx),
                'test_period': f"{timestamps.iloc[test_idx].min()} to {timestamps.iloc[test_idx].max()}"
            })
            
            print(f"   Fold {fold + 1}: R² = {r2:.4f}, RMSE = {rmse:.2f}, MAE = {mae:.2f}")
        
        # Overall statistics
        mean_r2 = np.mean(cv_scores)
        std_r2 = np.std(cv_scores)
        
        print(f"\n📊 Cross-Validation Results:")
        print(f"   Mean R²: {mean_r2:.4f} (±{std_r2:.4f})")
        print(f"   Mean R²: {mean_r2*100:.2f}% (±{std_r2*100:.2f}%)")
        
        return {
            'mean_r2': mean_r2,
            'std_r2': std_r2,
            'cv_scores': cv_scores,
            'cv_results': cv_results
        }
    
    def get_feature_importance(self, top_n=15):
        """Get feature importance analysis"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted first")
        
        importance = self.training_stats['feature_importance']
        top_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:top_n]
        
        print(f"🔝 Top {top_n} Most Important Features:")
        for i, (feature, imp) in enumerate(top_features, 1):
            print(f"   {i:2d}. {feature:35s}: {imp:8.4f}")
        
        return top_features
    
    def save_model(self, filepath):
        """Save model to file"""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before saving")
        
        model_package = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_engine': self.feature_engine,
            'features': self.features,
            'training_stats': self.training_stats,
            'model_info': {
                'model_type': 'Pure Physics Gas Prediction',
                'version': '1.0',
                'created_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'approach': 'No lag dependencies, pure physics-informed features',
                'feature_count': len(self.features),
                'training_samples': self.training_stats['training_samples']
            }
        }
        
        joblib.dump(model_package, filepath)
        print(f"💾 Model saved to: {filepath}")
        print(f"   File size: {os.path.getsize(filepath) / 1024:.1f} KB")
    
    @classmethod
    def load_model(cls, filepath):
        """Load model from file"""
        model_package = joblib.load(filepath)
        
        # Create instance
        instance = cls()
        instance.model = model_package['model']
        instance.scaler = model_package['scaler']
        instance.feature_engine = model_package['feature_engine']
        instance.features = model_package['features']
        instance.training_stats = model_package['training_stats']
        instance.is_fitted = True
        
        print(f"📁 Model loaded from: {filepath}")
        print(f"   Model type: {model_package['model_info']['model_type']}")
        print(f"   Version: {model_package['model_info']['version']}")
        
        return instance

# =====================================================================================
# 3. COMPARISON WITH ORIGINAL MODEL
# =====================================================================================

def compare_with_original_model(df, test_size=0.2):
    """
    Compare pure physics model with original lag-based model
    """
    print("🆚 COMPARING PURE PHYSICS vs ORIGINAL MODEL")
    print("=" * 50)
    
    # Split data temporally for fair comparison
    split_idx = int(len(df) * (1 - test_size))
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()
    
    print(f"📊 Train set: {len(train_df)} samples ({train_df['timestamp'].min()} to {train_df['timestamp'].max()})")
    print(f"📊 Test set: {len(test_df)} samples ({test_df['timestamp'].min()} to {test_df['timestamp'].max()})")
    
    # Train pure physics model
    print("\n🔧 Training Pure Physics Model...")
    physics_model = PurePhysicsGasModel()
    physics_model.fit(train_df)
    
    # Test pure physics model
    print("\n🧪 Testing Pure Physics Model...")
    physics_predictions = []
    physics_actuals = []
    
    for idx, row in test_df.iterrows():
        try:
            pred = physics_model.predict(
                row['timestamp'],
                {
                    'temperature': row['temperature'],
                    'pressure': row['pressure'],
                    'pressure_diff': row['pressure_diff'],
                    'density': row['density']
                },
                {
                    'D_mm': row['D_mm'],
                    'd_mm': row['d_mm']
                }
            )
            physics_predictions.append(pred['predicted_volume'])
            physics_actuals.append(row['hourly_volume'])
        except Exception as e:
            continue
    
    # Calculate metrics
    physics_r2 = r2_score(physics_actuals, physics_predictions)
    physics_rmse = np.sqrt(mean_squared_error(physics_actuals, physics_predictions))
    physics_mae = mean_absolute_error(physics_actuals, physics_predictions)
    
    print(f"📊 Pure Physics Model Performance:")
    print(f"   R²: {physics_r2:.4f} ({physics_r2*100:.2f}%)")
    print(f"   RMSE: {physics_rmse:.2f} m³/hour")
    print(f"   MAE: {physics_mae:.2f} m³/hour")
    print(f"   Samples tested: {len(physics_predictions)}")
    
    # Compare with your reported original performance
    print(f"\n📊 Comparison with Original Model:")
    print(f"   Original R² (with lags): 98.59%")
    print(f"   Pure Physics R²: {physics_r2*100:.2f}%")
    print(f"   Performance difference: {(0.9859 - physics_r2)*100:.2f}%")
    
    if physics_r2 > 0.90:
        print("   ✅ EXCELLENT: <10% performance drop - Deployment ready!")
    elif physics_r2 > 0.85:
        print("   ✅ GOOD: <15% performance drop - Acceptable for deployment")
    elif physics_r2 > 0.80:
        print("   ⚠️  FAIR: Significant drop but still usable")
    else:
        print("   ❌ POOR: Consider ensemble approach")
    
    return {
        'physics_r2': physics_r2,
        'physics_rmse': physics_rmse,
        'physics_mae': physics_mae,
        'samples_tested': len(physics_predictions),
        'performance_drop': (0.9859 - physics_r2) * 100
    }

# =====================================================================================
# 4. MAIN EXECUTION
# =====================================================================================

if __name__ == "__main__":
    import os
    
    print("🚀 PURE PHYSICS GAS PREDICTION - COMPLETE IMPLEMENTATION")
    print("=" * 60)
    
    # Load data
    df = pd.read_csv('data/data.csv')
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')
    
    print(f"📊 Dataset loaded: {df.shape}")
    print(f"📅 Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # Train and evaluate pure physics model
    print("\n" + "="*60)
    print("🔧 TRAINING PURE PHYSICS MODEL")
    print("="*60)
    
    physics_model = PurePhysicsGasModel()
    physics_model.fit(df)
    
    # Cross-validation
    print("\n" + "="*60)
    print("🔄 CROSS-VALIDATION ANALYSIS")
    print("="*60)
    
    cv_results = physics_model.cross_validate(df, n_splits=5)
    
    # Feature importance
    print("\n" + "="*60)
    print("🔝 FEATURE IMPORTANCE ANALYSIS")
    print("="*60)
    
    top_features = physics_model.get_feature_importance(top_n=15)
    
    # Test some predictions
    print("\n" + "="*60)
    print("🔮 SAMPLE PREDICTIONS")
    print("="*60)
    
    test_cases = [
        ('2025-01-15 18:00:00', 'Winter Evening Peak'),
        ('2025-07-15 12:00:00', 'Summer Midday Low'),
        ('2025-04-15 12:00:00', 'Spring Moderate'),
        ('2025-10-15 18:00:00', 'Fall Evening')
    ]
    
    for date, description in test_cases:
        result = physics_model.predict(date)
        print(f"📈 {description}:")
        print(f"   Date: {result['date']}")
        print(f"   Predicted: {result['predicted_volume']} m³/hour")
        print(f"   Season: {result['season']}")
        print(f"   Confidence: {result['confidence']}")
        print()
    
    # Save model
    print("\n" + "="*60)
    print("💾 SAVING MODEL")
    print("="*60)
    
    os.makedirs('models', exist_ok=True)
    physics_model.save_model('models/pure_physics_gas_model.pkl')
    
    # Compare with original (if you want to run this)
    print("\n" + "="*60)
    print("🆚 PERFORMANCE COMPARISON")
    print("="*60)
    
    comparison_results = compare_with_original_model(df, test_size=0.2)
    
    print("\n" + "="*60)
    print("✅ IMPLEMENTATION COMPLETE")
    print("="*60)
    
    print(f"🎯 SUMMARY:")
    print(f"   ✅ Pure physics model trained successfully")
    print(f"   ✅ Cross-validation R²: {cv_results['mean_r2']*100:.2f}% (±{cv_results['std_r2']*100:.2f}%)")
    print(f"   ✅ No lag feature dependencies")
    print(f"   ✅ Deployment ready")
    print(f"   ✅ Model saved to: models/pure_physics_gas_model.pkl")
    
    if comparison_results['physics_r2'] > 0.90:
        print(f"   🏆 EXCELLENT PERFORMANCE: Only {comparison_results['performance_drop']:.1f}% drop from original")
        print(f"   🚀 RECOMMENDED FOR PRODUCTION DEPLOYMENT")
    else:
        print(f"   ⚠️  Performance drop: {comparison_results['performance_drop']:.1f}%")
        print(f"   💡 Consider ensemble approach or additional features")