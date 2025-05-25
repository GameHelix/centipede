# =====================================================================================
# QUICK TEST: PURE PHYSICS APPROACH
# Run this to quickly test the pure physics approach on your data
# =====================================================================================

import pandas as pd
import numpy as np
from sklearn.preprocessing import RobustScaler
from sklearn.linear_model import Ridge
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.model_selection import TimeSeriesSplit
import warnings
warnings.filterwarnings('ignore')

def create_pure_physics_features(df):
    """
    Simplified pure physics feature creation (no lag dependencies)
    """
    df_out = df.copy()
    
    # Temporal cyclical features
    df_out['hour_sin'] = np.sin(2 * np.pi * df_out['timestamp'].dt.hour/24)
    df_out['hour_cos'] = np.cos(2 * np.pi * df_out['timestamp'].dt.hour/24)
    df_out['month_sin'] = np.sin(2 * np.pi * df_out['timestamp'].dt.month/12)
    df_out['month_cos'] = np.cos(2 * np.pi * df_out['timestamp'].dt.month/12)
    df_out['day_of_week_sin'] = np.sin(2 * np.pi * df_out['timestamp'].dt.dayofweek/7)
    df_out['day_of_week_cos'] = np.cos(2 * np.pi * df_out['timestamp'].dt.dayofweek/7)
    df_out['is_weekend'] = (df_out['timestamp'].dt.dayofweek >= 5).astype(int)
    df_out['day_of_month'] = df_out['timestamp'].dt.day
    
    # Physics-based features
    df_out['pipe_cross_section_area'] = np.pi * (df_out['d_mm']/2)**2
    df_out['pipe_wall_thickness'] = (df_out['D_mm'] - df_out['d_mm']) / 2
    df_out['pipe_diameter_ratio'] = df_out['D_mm'] / (df_out['d_mm'] + 1e-8)
    
    # Environmental physics
    df_out['temp_pressure_interaction'] = df_out['temperature'] * df_out['pressure']
    df_out['pressure_density_ratio'] = df_out['pressure'] / (df_out['density'] + 1e-8)
    df_out['temp_density_interaction'] = df_out['temperature'] * df_out['density']
    
    # Advanced physics
    df_out['theoretical_flow_capacity'] = (
        df_out['pipe_cross_section_area'] * 
        np.sqrt(df_out['pressure_diff'] + 1e-8) / 
        np.sqrt(df_out['density'] + 1e-8) / 1000  # Normalize
    )
    
    df_out['pressure_per_diameter'] = df_out['pressure'] / (df_out['D_mm'] + 1e-8)
    df_out['pressure_diff_per_thickness'] = df_out['pressure_diff'] / (df_out['pipe_wall_thickness'] + 1e-8)
    
    # Seasonal demand factors
    df_out['heating_demand'] = np.maximum(0, 18 - df_out['temperature'])
    df_out['seasonal_intensity'] = np.where(
        df_out['timestamp'].dt.month.isin([12, 1, 2]), 3,      # Winter
        np.where(df_out['timestamp'].dt.month.isin([6, 7, 8]), 1,    # Summer
                np.where(df_out['timestamp'].dt.month.isin([3, 4, 5]), 2, 2.5))  # Spring/Fall
    )
    
    # Daily patterns
    hour = df_out['timestamp'].dt.hour
    df_out['daily_demand_factor'] = np.where(
        (hour >= 6) & (hour <= 9), 1.3,      # Morning peak
        np.where((hour >= 17) & (hour <= 20), 1.5,  # Evening peak
                np.where((hour >= 22) | (hour <= 5), 0.7, 1.0))  # Night low
    )
    
    return df_out

def quick_test_pure_physics():
    """
    Quick test of pure physics approach
    """
    print("🚀 QUICK TEST: PURE PHYSICS GAS PREDICTION")
    print("="*50)
    
    # Load data
    try:
        df = pd.read_csv('data/data.csv')
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        print(f"✅ Data loaded: {df.shape}")
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return
    
    # Apply winsorization (same as your original)
    numeric_cols = ['density', 'pressure_diff', 'pressure', 'temperature', 
                   'hourly_volume', 'daily_volume', 'D_mm', 'd_mm']
    
    for col in numeric_cols:
        if col in df.columns:
            lower_cap = df[col].quantile(0.01)
            upper_cap = df[col].quantile(0.99)
            df[col] = df[col].clip(lower=lower_cap, upper=upper_cap)
    
    # Create pure physics features
    print("🔧 Creating pure physics features...")
    df_features = create_pure_physics_features(df)
    
    # Define feature set (no lag features)
    pure_physics_features = [
        # Temporal
        'hour_sin', 'hour_cos', 'month_sin', 'month_cos', 
        'day_of_week_sin', 'day_of_week_cos', 'is_weekend', 'day_of_month',
        
        # Environmental
        'density', 'pressure_diff', 'pressure', 'temperature',
        'temp_pressure_interaction', 'pressure_density_ratio', 
        'temp_density_interaction', 'heating_demand',
        
        # Pipe physics
        'D_mm', 'd_mm', 'pipe_cross_section_area', 'pipe_wall_thickness',
        'pipe_diameter_ratio', 'theoretical_flow_capacity',
        'pressure_per_diameter', 'pressure_diff_per_thickness',
        
        # Demand patterns
        'seasonal_intensity', 'daily_demand_factor'
    ]
    
    # Prepare data
    X = df_features[pure_physics_features]
    y = df_features['hourly_volume']
    
    # Remove NaN rows
    mask = ~(X.isnull().any(axis=1) | y.isnull())
    X_clean = X[mask]
    y_clean = y[mask]
    
    print(f"📊 Clean data: {len(X_clean)} samples, {len(pure_physics_features)} features")
    
    # Time series cross-validation
    print("🔄 Running 5-fold time series cross-validation...")
    
    tscv = TimeSeriesSplit(n_splits=5)
    cv_scores = []
    cv_results = []
    
    for fold, (train_idx, test_idx) in enumerate(tscv.split(X_clean)):
        # Split data
        X_train, X_test = X_clean.iloc[train_idx], X_clean.iloc[test_idx]
        y_train, y_test = y_clean.iloc[train_idx], y_clean.iloc[test_idx]
        
        # Scale features
        scaler = RobustScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        model = Ridge(alpha=1.0)
        model.fit(X_train_scaled, y_train)
        
        # Predict
        y_pred = model.predict(X_test_scaled)
        
        # Evaluate
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        
        cv_scores.append(r2)
        cv_results.append({
            'fold': fold + 1,
            'r2': r2,
            'rmse': rmse,
            'mae': mae
        })
        
        print(f"   Fold {fold + 1}: R² = {r2:.4f} ({r2*100:.2f}%)")
    
    # Overall results
    mean_r2 = np.mean(cv_scores)
    std_r2 = np.std(cv_scores)
    
    print(f"\n📊 PURE PHYSICS MODEL RESULTS:")
    print(f"   Mean R²: {mean_r2:.4f} ({mean_r2*100:.2f}%)")
    print(f"   Std R²: ±{std_r2:.4f} (±{std_r2*100:.2f}%)")
    print(f"   Features: {len(pure_physics_features)} (no lag dependencies)")
    
    # Compare with your original
    original_r2 = 0.9859
    performance_drop = (original_r2 - mean_r2) * 100
    
    print(f"\n🆚 COMPARISON WITH ORIGINAL:")
    print(f"   Original R² (with lags): {original_r2*100:.2f}%")
    print(f"   Pure Physics R²: {mean_r2*100:.2f}%")
    print(f"   Performance drop: {performance_drop:.2f} percentage points")
    
    # Assessment
    if performance_drop < 5:
        print("   ✅ EXCELLENT: <5% drop - Deploy immediately!")
        recommendation = "DEPLOY_IMMEDIATELY"
    elif performance_drop < 10:
        print("   ✅ VERY GOOD: <10% drop - Recommended for production")
        recommendation = "RECOMMENDED"
    elif performance_drop < 15:
        print("   ✅ GOOD: <15% drop - Acceptable for deployment")
        recommendation = "ACCEPTABLE"
    else:
        print("   ⚠️ SIGNIFICANT DROP: Consider ensemble approach")
        recommendation = "CONSIDER_ENSEMBLE"
    
    # Feature importance
    print(f"\n🔝 FEATURE IMPORTANCE (Final Model):")
    
    # Train final model for feature importance
    scaler_final = RobustScaler()
    X_scaled_final = scaler_final.fit_transform(X_clean)
    model_final = Ridge(alpha=1.0)
    model_final.fit(X_scaled_final, y_clean)
    
    # Get feature importance
    feature_importance = dict(zip(pure_physics_features, np.abs(model_final.coef_)))
    top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
    
    for i, (feature, importance) in enumerate(top_features, 1):
        print(f"   {i:2d}. {feature:30s}: {importance:6.4f}")
    
    # Test predictions
    print(f"\n🔮 SAMPLE PREDICTIONS:")
    
    test_cases = [
        ('2025-01-15 18:00', {'temperature': 5.0, 'pressure': 450.0, 'pressure_diff': 15.0, 'density': 0.729}, 'Winter Evening'),
        ('2025-07-15 12:00', {'temperature': 22.0, 'pressure': 400.0, 'pressure_diff': 8.0, 'density': 0.729}, 'Summer Midday'),
        ('2025-04-15 12:00', {'temperature': 12.0, 'pressure': 420.0, 'pressure_diff': 12.0, 'density': 0.729}, 'Spring Moderate')
    ]
    
    for date_str, env_data, description in test_cases:
        # Create prediction data
        pred_date = pd.to_datetime(date_str)
        pred_data = pd.DataFrame([{
            'timestamp': pred_date,
            'D_mm': 301.0,
            'd_mm': 184.0,
            **env_data
        }])
        
        # Create features
        pred_features = create_pure_physics_features(pred_data)
        X_pred = pred_features[pure_physics_features]
        X_pred_scaled = scaler_final.transform(X_pred)
        
        # Predict
        prediction = model_final.predict(X_pred_scaled)[0]
        
        print(f"   {description}: {prediction:.2f} m³/hour")
    
    print(f"\n" + "="*50)
    print(f"✅ QUICK TEST COMPLETE")
    print(f"📊 Result: {mean_r2*100:.2f}% accuracy with pure physics")
    print(f"🎯 Recommendation: {recommendation}")
    print(f"🚀 Deployment Status: {'READY' if performance_drop < 15 else 'NEEDS_WORK'}")
    print("="*50)
    
    return {
        'mean_r2': mean_r2,
        'performance_drop': performance_drop,
        'recommendation': recommendation,
        'cv_results': cv_results,
        'top_features': top_features[:5]
    }

if __name__ == "__main__":
    results = quick_test_pure_physics()