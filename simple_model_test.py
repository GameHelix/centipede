# ================================================================================================
# SIMPLE MODEL TESTING ON ACTUAL DATA POINTS
# Test specific data points from your dataset to see prediction vs actual values
# ================================================================================================

import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

print("🔥 TESTING TRAINED MODEL ON ACTUAL DATA POINTS")
print("=" * 60)

# ================================================================================================
# 1. LOAD DATA AND MODEL
# ================================================================================================

# Load actual data
df = pd.read_csv('data/data.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

# Load trained model
model_package = joblib.load('models/clean_gas_usage_model.pkl')
model = model_package['model']
scaler = model_package['scaler']
features = model_package['features']

print(f"✅ Loaded data: {len(df)} rows from {df['timestamp'].min()} to {df['timestamp'].max()}")
print(f"✅ Loaded model with {len(features)} features")

# ================================================================================================
# 2. QUICK FEATURE ENGINEERING (SAME AS TRAINING)
# ================================================================================================

# Apply same preprocessing as training
def create_features(data):
    df_proc = data.copy()
    
    # Winsorization
    numeric_cols = ['density', 'pressure_diff', 'pressure', 'temperature', 
                   'hourly_volume', 'daily_volume', 'D_mm', 'd_mm']
    
    for col in numeric_cols:
        if col in df_proc.columns:
            lower_cap = df_proc[col].quantile(0.01)
            upper_cap = df_proc[col].quantile(0.99)
            df_proc[col] = df_proc[col].clip(lower=lower_cap, upper=upper_cap)
    
    # Temporal features
    df_proc['hour'] = df_proc['timestamp'].dt.hour
    df_proc['day_of_week'] = df_proc['timestamp'].dt.dayofweek
    df_proc['day_of_month'] = df_proc['timestamp'].dt.day
    df_proc['month'] = df_proc['timestamp'].dt.month
    df_proc['is_weekend'] = (df_proc['day_of_week'] >= 5).astype(int)
    
    # Cyclical features
    df_proc['hour_sin'] = np.sin(2 * np.pi * df_proc['hour']/24)
    df_proc['hour_cos'] = np.cos(2 * np.pi * df_proc['hour']/24)
    df_proc['day_of_week_sin'] = np.sin(2 * np.pi * df_proc['day_of_week']/7)
    df_proc['day_of_week_cos'] = np.cos(2 * np.pi * df_proc['day_of_week']/7)
    df_proc['month_sin'] = np.sin(2 * np.pi * df_proc['month']/12)
    df_proc['month_cos'] = np.cos(2 * np.pi * df_proc['month']/12)
    
    # Environmental features
    df_proc['temp_pressure_interaction'] = df_proc['temperature'] * df_proc['pressure']
    df_proc['pressure_density_ratio'] = df_proc['pressure'] / (df_proc['density'] + 1e-8)
    df_proc['temp_density_interaction'] = df_proc['temperature'] * df_proc['density']
    
    # Pipe features
    df_proc['pipe_diameter_ratio'] = df_proc['D_mm'] / (df_proc['d_mm'] + 1e-8)
    df_proc['pipe_wall_thickness'] = (df_proc['D_mm'] - df_proc['d_mm']) / 2
    df_proc['pipe_cross_section_area'] = np.pi * (df_proc['d_mm']/2)**2
    df_proc['pipe_annular_area'] = np.pi * ((df_proc['D_mm']/2)**2 - (df_proc['d_mm']/2)**2)
    
    df_proc['pressure_per_diameter'] = df_proc['pressure'] / (df_proc['D_mm'] + 1e-8)
    df_proc['pressure_diff_per_thickness'] = df_proc['pressure_diff'] / (df_proc['pipe_wall_thickness'] + 1e-8)
    df_proc['temp_diameter_interaction'] = df_proc['temperature'] * df_proc['D_mm']
    df_proc['density_diameter_interaction'] = df_proc['density'] * df_proc['d_mm']
    
    # Lag features
    lag_periods = [6, 12, 24, 48, 168]
    for lag in lag_periods:
        df_proc[f'volume_lag_{lag}h'] = df_proc['hourly_volume'].shift(lag)
    
    # Rolling features
    df_proc['volume_rolling_mean_24h_lag12'] = df_proc['hourly_volume'].shift(12).rolling(window=24, min_periods=12).mean()
    df_proc['volume_rolling_std_24h_lag12'] = df_proc['hourly_volume'].shift(12).rolling(window=24, min_periods=12).std()
    df_proc['volume_rolling_median_168h_lag24'] = df_proc['hourly_volume'].shift(24).rolling(window=168, min_periods=84).median()
    
    df_proc['temp_rolling_mean_24h'] = df_proc['temperature'].rolling(window=24, min_periods=12).mean()
    df_proc['pressure_rolling_std_24h'] = df_proc['pressure'].rolling(window=24, min_periods=12).std()
    
    return df_proc

# Create features
df_processed = create_features(df)

# Remove NaN rows
df_clean = df_processed[features + ['hourly_volume', 'timestamp']].dropna()

print(f"✅ Features created. Clean dataset: {len(df_clean)} rows")

# ================================================================================================
# 3. SELECT TEST CASES FROM DIFFERENT SCENARIOS
# ================================================================================================

print(f"\n🎯 SELECTING DIVERSE TEST CASES")
print("-" * 40)

test_cases = []

# Case 1: Winter high consumption
winter_high = df_clean[(df_clean['timestamp'].dt.month.isin([12, 1, 2])) & 
                      (df_clean['hourly_volume'] > df_clean['hourly_volume'].quantile(0.8))]
if len(winter_high) > 0:
    test_cases.append(('Winter High Usage', winter_high.iloc[0]))

# Case 2: Summer low consumption  
summer_low = df_clean[(df_clean['timestamp'].dt.month.isin([6, 7, 8])) & 
                     (df_clean['hourly_volume'] < df_clean['hourly_volume'].quantile(0.3))]
if len(summer_low) > 0:
    test_cases.append(('Summer Low Usage', summer_low.iloc[0]))

# Case 3: Spring moderate consumption
spring_mod = df_clean[(df_clean['timestamp'].dt.month.isin([3, 4, 5])) & 
                     (df_clean['hourly_volume'] > df_clean['hourly_volume'].quantile(0.4)) &
                     (df_clean['hourly_volume'] < df_clean['hourly_volume'].quantile(0.6))]
if len(spring_mod) > 0:
    test_cases.append(('Spring Moderate Usage', spring_mod.iloc[0]))

# Case 4: Fall evening peak
fall_evening = df_clean[(df_clean['timestamp'].dt.month.isin([9, 10, 11])) & 
                       (df_clean['timestamp'].dt.hour.isin([17, 18, 19]))]
if len(fall_evening) > 0:
    test_cases.append(('Fall Evening Peak', fall_evening.iloc[0]))

# Case 5: Weekend morning
weekend_morning = df_clean[(df_clean['is_weekend'] == 1) & 
                          (df_clean['timestamp'].dt.hour.isin([8, 9, 10]))]
if len(weekend_morning) > 0:
    test_cases.append(('Weekend Morning', weekend_morning.iloc[0]))

# Case 6: Different pipe configurations
large_pipe = df_clean[df_clean['D_mm'] > df_clean['D_mm'].quantile(0.8)]
if len(large_pipe) > 0:
    test_cases.append(('Large Pipe Config', large_pipe.iloc[0]))

small_pipe = df_clean[df_clean['D_mm'] < df_clean['D_mm'].quantile(0.2)]
if len(small_pipe) > 0:
    test_cases.append(('Small Pipe Config', small_pipe.iloc[0]))

# Case 7: Extreme conditions
high_pressure = df_clean[df_clean['pressure'] > df_clean['pressure'].quantile(0.9)]
if len(high_pressure) > 0:
    test_cases.append(('High Pressure', high_pressure.iloc[0]))

# Case 8: Random samples from different years
for year in [2020, 2021, 2022, 2023]:
    year_data = df_clean[df_clean['timestamp'].dt.year == year]
    if len(year_data) > 10:
        random_sample = year_data.sample(1).iloc[0]
        test_cases.append((f'Random {year}', random_sample))

print(f"✅ Selected {len(test_cases)} diverse test cases")

# ================================================================================================
# 4. MAKE PREDICTIONS AND COMPARE
# ================================================================================================

print(f"\n🔍 DETAILED TEST RESULTS")
print("=" * 100)
print(f"{'Case':<20} {'Date':<17} {'Actual':<8} {'Predicted':<10} {'Error':<8} {'Rel Err':<8} {'Conditions'}")
print("-" * 100)

detailed_results = []

for case_name, row in test_cases:
    # Extract features for this row
    X_test = row[features].values.reshape(1, -1)
    
    # Scale features
    X_test_scaled = scaler.transform(X_test)
    
    # Make prediction
    prediction = model.predict(X_test_scaled)[0]
    
    # Calculate errors
    actual = row['hourly_volume']
    error = actual - prediction
    rel_error = (error / actual) * 100 if actual != 0 else 0
    
    # Get conditions
    conditions = f"T:{row['temperature']:.1f}°C P:{row['pressure']:.0f}kPa D:{row['D_mm']:.0f}mm"
    
    detailed_results.append({
        'case': case_name,
        'date': row['timestamp'],
        'actual': actual,
        'predicted': prediction,
        'error': error,
        'rel_error': rel_error,
        'conditions': conditions
    })
    
    print(f"{case_name:<20} {row['timestamp'].strftime('%Y-%m-%d %H:%M'):<17} {actual:<8.2f} {prediction:<10.2f} {error:<8.2f} {rel_error:<7.1f}% {conditions}")

# ================================================================================================
# 5. ERROR ANALYSIS SUMMARY
# ================================================================================================

print(f"\n📊 ERROR ANALYSIS SUMMARY")
print("-" * 50)

errors = [r['error'] for r in detailed_results]
rel_errors = [abs(r['rel_error']) for r in detailed_results]
predictions = [r['predicted'] for r in detailed_results]
actuals = [r['actual'] for r in detailed_results]

mae = np.mean(np.abs(errors))
rmse = np.sqrt(np.mean(np.array(errors)**2))
mape = np.mean(rel_errors)
r2 = 1 - sum(np.array(errors)**2) / sum((np.array(actuals) - np.mean(actuals))**2)

print(f"Test Sample Statistics:")
print(f"  • Mean Absolute Error (MAE): {mae:.3f} m³/hour")
print(f"  • Root Mean Square Error (RMSE): {rmse:.3f} m³/hour")
print(f"  • Mean Absolute Percentage Error (MAPE): {mape:.1f}%")
print(f"  • R² Score: {r2:.4f}")

# Identify worst predictions
worst_case = max(detailed_results, key=lambda x: abs(x['rel_error']))
best_case = min(detailed_results, key=lambda x: abs(x['rel_error']))

print(f"\n🔴 Worst Prediction:")
print(f"  • Case: {worst_case['case']}")
print(f"  • Date: {worst_case['date'].strftime('%Y-%m-%d %H:%M')}")
print(f"  • Actual: {worst_case['actual']:.2f} m³/hour")
print(f"  • Predicted: {worst_case['predicted']:.2f} m³/hour")
print(f"  • Error: {worst_case['error']:.2f} m³/hour ({worst_case['rel_error']:.1f}%)")

print(f"\n🟢 Best Prediction:")
print(f"  • Case: {best_case['case']}")
print(f"  • Date: {best_case['date'].strftime('%Y-%m-%d %H:%M')}")
print(f"  • Actual: {best_case['actual']:.2f} m³/hour")
print(f"  • Predicted: {best_case['predicted']:.2f} m³/hour")
print(f"  • Error: {best_case['error']:.2f} m³/hour ({best_case['rel_error']:.1f}%)")

# ================================================================================================
# 6. QUICK OVERFITTING CHECK
# ================================================================================================

print(f"\n⚠️  QUICK OVERFITTING CHECK")
print("-" * 30)

# Check if errors are reasonable
high_error_count = sum(1 for e in rel_errors if e > 20)
very_high_error_count = sum(1 for e in rel_errors if e > 50)

print(f"Predictions with >20% error: {high_error_count}/{len(rel_errors)} ({100*high_error_count/len(rel_errors):.1f}%)")
print(f"Predictions with >50% error: {very_high_error_count}/{len(rel_errors)} ({100*very_high_error_count/len(rel_errors):.1f}%)")

if very_high_error_count > len(rel_errors) * 0.2:
    print("🚨 HIGH ERROR RATE - Possible overfitting or data issues!")
elif high_error_count > len(rel_errors) * 0.3:
    print("⚠️  MODERATE ERROR RATE - Some predictions are unreliable")
else:
    print("✅ ERROR RATE ACCEPTABLE - Model performs reasonably")

# Check error patterns
seasonal_errors = {}
for result in detailed_results:
    month = result['date'].month
    season = 'Winter' if month in [12,1,2] else 'Spring' if month in [3,4,5] else 'Summer' if month in [6,7,8] else 'Fall'
    if season not in seasonal_errors:
        seasonal_errors[season] = []
    seasonal_errors[season].append(abs(result['rel_error']))

print(f"\nError by Season:")
for season, errors in seasonal_errors.items():
    if len(errors) > 0:
        avg_error = np.mean(errors)
        print(f"  • {season}: {avg_error:.1f}% average error")

print(f"\n" + "="*60)
print(f"✅ MODEL TESTING COMPLETE")
print(f"📊 Overall Assessment: {'Good' if mape < 15 else 'Fair' if mape < 25 else 'Poor'} performance")
print(f"🎯 Average prediction error: {mape:.1f}%")
print("="*60)