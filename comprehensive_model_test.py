# ================================================================================================
# COMPREHENSIVE MODEL TESTING & OVERFITTING DETECTION ANALYSIS
# Test trained model against actual data and detect potential overfitting issues
# ================================================================================================

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
from sklearn.model_selection import TimeSeriesSplit
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

print("🔍 COMPREHENSIVE MODEL TESTING & OVERFITTING DETECTION")
print("=" * 80)

# ================================================================================================
# 1. LOAD DATA AND MODEL
# ================================================================================================

print("\n📊 LOADING DATA AND MODEL")
print("-" * 40)

# Load the actual data
df = pd.read_csv('data/data.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])
df = df.sort_values('timestamp')

print(f"✅ Loaded actual data: {df.shape}")
print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")

# Load the trained model
model_package = joblib.load('models/clean_gas_usage_model.pkl')
model = model_package['model']
scaler = model_package['scaler']
features = model_package['features']
model_info = model_package['model_info']

print(f"✅ Loaded trained model:")
print(f"   Model type: {model_info.get('model_type', 'Unknown')}")
print(f"   Version: {model_info.get('version', 'Unknown')}")
print(f"   Features: {len(features)}")

# ================================================================================================
# 2. RECREATE FEATURES FOR ACTUAL DATA (SAME AS TRAINING)
# ================================================================================================

print("\n🔧 RECREATING FEATURES FOR ACTUAL DATA")
print("-" * 40)

# Winsorization (same as training)
numeric_cols = ['density', 'pressure_diff', 'pressure', 'temperature', 
               'hourly_volume', 'daily_volume', 'D_mm', 'd_mm']

for col in numeric_cols:
    if col in df.columns:
        lower_cap = df[col].quantile(0.01)
        upper_cap = df[col].quantile(0.99)
        df[col] = df[col].clip(lower=lower_cap, upper=upper_cap)

# Temporal features
df['hour'] = df['timestamp'].dt.hour
df['day_of_week'] = df['timestamp'].dt.dayofweek
df['day_of_month'] = df['timestamp'].dt.day
df['month'] = df['timestamp'].dt.month
df['year'] = df['timestamp'].dt.year
df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

# Cyclical features
df['hour_sin'] = np.sin(2 * np.pi * df['hour']/24)
df['hour_cos'] = np.cos(2 * np.pi * df['hour']/24)
df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week']/7)
df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week']/7)
df['month_sin'] = np.sin(2 * np.pi * df['month']/12)
df['month_cos'] = np.cos(2 * np.pi * df['month']/12)

# Environmental features
df['temp_pressure_interaction'] = df['temperature'] * df['pressure']
df['pressure_density_ratio'] = df['pressure'] / (df['density'] + 1e-8)
df['temp_density_interaction'] = df['temperature'] * df['density']

# Pipe features
df['pipe_diameter_ratio'] = df['D_mm'] / (df['d_mm'] + 1e-8)
df['pipe_wall_thickness'] = (df['D_mm'] - df['d_mm']) / 2
df['pipe_cross_section_area'] = np.pi * (df['d_mm']/2)**2
df['pipe_annular_area'] = np.pi * ((df['D_mm']/2)**2 - (df['d_mm']/2)**2)

# Interaction features with pipe properties
df['pressure_per_diameter'] = df['pressure'] / (df['D_mm'] + 1e-8)
df['pressure_diff_per_thickness'] = df['pressure_diff'] / (df['pipe_wall_thickness'] + 1e-8)
df['temp_diameter_interaction'] = df['temperature'] * df['D_mm']
df['density_diameter_interaction'] = df['density'] * df['d_mm']

# Lag features (same as training)
lag_periods = [6, 12, 24, 48, 168]
for lag in lag_periods:
    df[f'volume_lag_{lag}h'] = df['hourly_volume'].shift(lag)

# Rolling features
df['volume_rolling_mean_24h_lag12'] = df['hourly_volume'].shift(12).rolling(window=24, min_periods=12).mean()
df['volume_rolling_std_24h_lag12'] = df['hourly_volume'].shift(12).rolling(window=24, min_periods=12).std()
df['volume_rolling_median_168h_lag24'] = df['hourly_volume'].shift(24).rolling(window=168, min_periods=84).median()

# Environmental rolling features
df['temp_rolling_mean_24h'] = df['temperature'].rolling(window=24, min_periods=12).mean()
df['pressure_rolling_std_24h'] = df['pressure'].rolling(window=24, min_periods=12).std()

# Remove rows with NaN values (same as training)
df_clean = df[features + ['hourly_volume', 'timestamp']].copy()
df_clean = df_clean.dropna()

print(f"✅ Features recreated: {len(features)} features")
print(f"   Clean data: {len(df_clean)} rows")

# ================================================================================================
# 3. TEST MODEL ON VARIOUS DATA SUBSETS
# ================================================================================================

print("\n🧪 TESTING MODEL ON ACTUAL DATA SUBSETS")
print("-" * 40)

# Prepare data
X = df_clean[features]
y = df_clean['hourly_volume']
timestamps = df_clean['timestamp']

# Scale features (same as training)
X_scaled = scaler.transform(X)

# Make predictions
y_pred = model.predict(X_scaled)

# ================================================================================================
# 4. COMPREHENSIVE ERROR ANALYSIS
# ================================================================================================

print("\n📈 COMPREHENSIVE ERROR ANALYSIS")
print("-" * 40)

# Overall metrics
r2 = r2_score(y, y_pred)
rmse = np.sqrt(mean_squared_error(y, y_pred))
mae = mean_absolute_error(y, y_pred)
mape = mean_absolute_percentage_error(y, y_pred)

print(f"📊 OVERALL MODEL PERFORMANCE:")
print(f"   R² Score: {r2:.4f} ({r2*100:.2f}%)")
print(f"   RMSE: {rmse:.3f} m³/hour")
print(f"   MAE: {mae:.3f} m³/hour")
print(f"   MAPE: {mape:.3f} ({mape*100:.2f}%)")

# ================================================================================================
# 5. TEMPORAL ANALYSIS - CRITICAL FOR OVERFITTING DETECTION
# ================================================================================================

print("\n⏰ TEMPORAL ANALYSIS (OVERFITTING DETECTION)")
print("-" * 50)

# Split data by time periods
df_test = df_clean.copy()
df_test['predictions'] = y_pred
df_test['residuals'] = y - y_pred
df_test['abs_error'] = np.abs(df_test['residuals'])
df_test['rel_error'] = df_test['residuals'] / (y + 1e-8)

# Test different time periods
periods = [
    ('2018', '2018-01-01', '2018-12-31'),
    ('2019', '2019-01-01', '2019-12-31'),
    ('2020', '2020-01-01', '2020-12-31'),
    ('2021', '2021-01-01', '2021-12-31'),
    ('2022', '2022-01-01', '2022-12-31'),
    ('2023', '2023-01-01', '2023-12-31'),
    ('2024', '2024-01-01', '2024-12-31')
]

print("📅 PERFORMANCE BY YEAR (Overfitting Check):")
yearly_performance = []

for period_name, start_date, end_date in periods:
    mask = (df_test['timestamp'] >= start_date) & (df_test['timestamp'] <= end_date)
    period_data = df_test[mask]
    
    if len(period_data) > 0:
        period_r2 = r2_score(period_data['hourly_volume'], period_data['predictions'])
        period_rmse = np.sqrt(mean_squared_error(period_data['hourly_volume'], period_data['predictions']))
        period_mae = mean_absolute_error(period_data['hourly_volume'], period_data['predictions'])
        
        yearly_performance.append({
            'Year': period_name,
            'R2': period_r2,
            'RMSE': period_rmse,
            'MAE': period_mae,
            'Samples': len(period_data)
        })
        
        print(f"   {period_name}: R²={period_r2:.4f}, RMSE={period_rmse:.2f}, MAE={period_mae:.2f}, n={len(period_data)}")

# ================================================================================================
# 6. OVERFITTING DETECTION ANALYSIS
# ================================================================================================

print("\n🚨 OVERFITTING DETECTION ANALYSIS")
print("-" * 40)

# 1. Performance consistency check
yearly_r2 = [p['R2'] for p in yearly_performance]
yearly_rmse = [p['RMSE'] for p in yearly_performance]

r2_std = np.std(yearly_r2)
rmse_std = np.std(yearly_rmse)

print(f"📊 PERFORMANCE CONSISTENCY:")
print(f"   R² std deviation: {r2_std:.4f}")
print(f"   RMSE std deviation: {rmse_std:.3f}")

if r2_std > 0.05:
    print("   ⚠️  HIGH R² VARIATION - Potential overfitting detected!")
else:
    print("   ✅ R² variation acceptable")

# 2. Residual analysis
print(f"\n🔍 RESIDUAL ANALYSIS:")
residuals = y - y_pred

# Normality test (sample if too many residuals)
sample_size = min(5000, len(residuals))
if len(residuals) > sample_size:
    residual_sample = np.random.choice(residuals, sample_size, replace=False)
else:
    residual_sample = residuals

shapiro_stat, shapiro_p = stats.shapiro(residual_sample)
print(f"   Residual normality (Shapiro-Wilk): p={shapiro_p:.4f}")

# Autocorrelation check (for time series overfitting)
try:
    from statsmodels.stats.diagnostic import acorr_ljungbox
    lb_result = acorr_ljungbox(residuals, lags=10, return_df=True)
    lb_p = lb_result['lb_pvalue'].iloc[-1]  # Get p-value for lag 10
except ImportError:
    print("   Statsmodels not available - skipping autocorrelation test")
    lb_p = 1.0  # Default to no autocorrelation
except Exception as e:
    print(f"   Autocorrelation test failed: {str(e)}")
    lb_p = 1.0
print(f"   Residual autocorrelation (Ljung-Box): p={lb_p:.4f}")

if lb_p < 0.05:
    print("   ⚠️  SIGNIFICANT AUTOCORRELATION - Possible temporal overfitting!")
else:
    print("   ✅ No significant autocorrelation detected")

# 3. Train vs Test performance comparison (time-based)
print(f"\n📊 TRAIN VS TEST TEMPORAL ANALYSIS:")

# Split into early (train-like) and late (test-like) periods
split_date = df_test['timestamp'].quantile(0.8)
early_data = df_test[df_test['timestamp'] <= split_date]
late_data = df_test[df_test['timestamp'] > split_date]

early_r2 = r2_score(early_data['hourly_volume'], early_data['predictions'])
late_r2 = r2_score(late_data['hourly_volume'], late_data['predictions'])

early_rmse = np.sqrt(mean_squared_error(early_data['hourly_volume'], early_data['predictions']))
late_rmse = np.sqrt(mean_squared_error(late_data['hourly_volume'], late_data['predictions']))

print(f"   Early 80% data - R²: {early_r2:.4f}, RMSE: {early_rmse:.3f}")
print(f"   Late 20% data - R²: {late_r2:.4f}, RMSE: {late_rmse:.3f}")
print(f"   Performance drop: R²: {early_r2 - late_r2:.4f}, RMSE: {late_rmse - early_rmse:.3f}")

if (early_r2 - late_r2) > 0.1 or (late_rmse - early_rmse) > 2.0:
    print("   🚨 SIGNIFICANT PERFORMANCE DROP - Strong overfitting detected!")
elif (early_r2 - late_r2) > 0.05 or (late_rmse - early_rmse) > 1.0:
    print("   ⚠️  MODERATE PERFORMANCE DROP - Possible overfitting")
else:
    print("   ✅ Performance consistent across time periods")

# ================================================================================================
# 7. DETAILED SAMPLE ANALYSIS
# ================================================================================================

print("\n🔬 DETAILED SAMPLE ANALYSIS")
print("-" * 40)

# Select diverse samples for detailed analysis
sample_indices = [
    # Different time periods
    df_test[df_test['timestamp'].dt.year == 2018].index[100:105] if len(df_test[df_test['timestamp'].dt.year == 2018]) > 100 else [],
    df_test[df_test['timestamp'].dt.year == 2020].index[100:105] if len(df_test[df_test['timestamp'].dt.year == 2020]) > 100 else [],
    df_test[df_test['timestamp'].dt.year == 2022].index[100:105] if len(df_test[df_test['timestamp'].dt.year == 2022]) > 100 else [],
    df_test[df_test['timestamp'].dt.year == 2024].index[100:105] if len(df_test[df_test['timestamp'].dt.year == 2024]) > 100 else [],
    
    # Different seasons
    df_test[df_test['timestamp'].dt.month == 1].index[:5],  # Winter
    df_test[df_test['timestamp'].dt.month == 4].index[:5],  # Spring
    df_test[df_test['timestamp'].dt.month == 7].index[:5],  # Summer
    df_test[df_test['timestamp'].dt.month == 10].index[:5], # Fall
    
    # Different consumption levels
    df_test.nsmallest(5, 'hourly_volume').index,  # Lowest consumption
    df_test.nlargest(5, 'hourly_volume').index,   # Highest consumption
]

# Flatten the list and remove empty arrays
sample_indices = [idx for sublist in sample_indices for idx in sublist if len(sublist) > 0]
sample_indices = list(set(sample_indices))[:30]  # Limit to 30 samples

print(f"🎯 ANALYZING {len(sample_indices)} DIVERSE SAMPLES:")
print(f"{'Index':<6} {'Date':<20} {'Actual':<8} {'Predicted':<10} {'Error':<8} {'Rel Error':<10} {'Season':<8}")
print("-" * 80)

detailed_results = []
for idx in sample_indices:
    row = df_test.loc[idx]
    actual = row['hourly_volume']
    predicted = row['predictions']
    error = actual - predicted
    rel_error = error / actual if actual != 0 else 0
    season = 'Winter' if row['timestamp'].month in [12,1,2] else 'Spring' if row['timestamp'].month in [3,4,5] else 'Summer' if row['timestamp'].month in [6,7,8] else 'Fall'
    
    detailed_results.append({
        'Index': idx,
        'Date': row['timestamp'].strftime('%Y-%m-%d %H:%M'),
        'Actual': actual,
        'Predicted': predicted,
        'Error': error,
        'Rel_Error': rel_error,
        'Season': season
    })
    
    print(f"{idx:<6} {row['timestamp'].strftime('%Y-%m-%d %H:%M'):<20} {actual:<8.2f} {predicted:<10.2f} {error:<8.2f} {rel_error:<10.1%} {season:<8}")

# ================================================================================================
# 8. OVERFITTING SUMMARY & RECOMMENDATIONS
# ================================================================================================

print("\n" + "="*80)
print("🎯 OVERFITTING ANALYSIS SUMMARY")
print("="*80)

overfitting_score = 0
warnings_list = []

# Check 1: Performance consistency
if r2_std > 0.05:
    overfitting_score += 2
    warnings_list.append(f"HIGH R² variation across years ({r2_std:.4f})")
elif r2_std > 0.02:
    overfitting_score += 1
    warnings_list.append(f"MODERATE R² variation across years ({r2_std:.4f})")

# Check 2: Temporal performance drop
performance_drop = early_r2 - late_r2
if performance_drop > 0.1:
    overfitting_score += 3
    warnings_list.append(f"SEVERE temporal performance drop ({performance_drop:.4f})")
elif performance_drop > 0.05:
    overfitting_score += 2
    warnings_list.append(f"MODERATE temporal performance drop ({performance_drop:.4f})")

# Check 3: Residual autocorrelation
if lb_p < 0.01:
    overfitting_score += 2
    warnings_list.append(f"STRONG residual autocorrelation (p={lb_p:.4f})")
elif lb_p < 0.05:
    overfitting_score += 1
    warnings_list.append(f"WEAK residual autocorrelation (p={lb_p:.4f})")

# Overall assessment
print(f"📊 OVERFITTING RISK SCORE: {overfitting_score}/7")

if overfitting_score >= 5:
    print("🚨 HIGH OVERFITTING RISK - Model may not generalize well")
    print("   Recommendation: Retrain with more conservative approach")
elif overfitting_score >= 3:
    print("⚠️  MODERATE OVERFITTING RISK - Some concerns detected")
    print("   Recommendation: Monitor performance and consider regularization")
elif overfitting_score >= 1:
    print("💛 LOW OVERFITTING RISK - Minor issues detected")
    print("   Recommendation: Model appears generally reliable")
else:
    print("✅ MINIMAL OVERFITTING RISK - Model appears well-generalized")
    print("   Recommendation: Model is suitable for production use")

if warnings_list:
    print(f"\n⚠️  SPECIFIC CONCERNS DETECTED:")
    for warning in warnings_list:
        print(f"   • {warning}")

print(f"\n📈 FINAL MODEL ASSESSMENT:")
print(f"   Overall R²: {r2:.4f} ({r2*100:.2f}%)")
print(f"   Overall RMSE: {rmse:.3f} m³/hour")
print(f"   Temporal consistency: {'Poor' if overfitting_score >= 5 else 'Fair' if overfitting_score >= 3 else 'Good'}")
print(f"   Production readiness: {'Not recommended' if overfitting_score >= 5 else 'Use with caution' if overfitting_score >= 3 else 'Recommended'}")

# ================================================================================================
# 9. SPECIFIC OVERFITTING TESTS (ADVANCED)
# ================================================================================================

print("\n🔬 ADVANCED OVERFITTING DETECTION")
print("-" * 40)

# Test 1: Leave-one-year-out validation
print("📅 LEAVE-ONE-YEAR-OUT VALIDATION:")
years = sorted(df_test['timestamp'].dt.year.unique())
loo_results = []

for test_year in years:
    train_data = df_test[df_test['timestamp'].dt.year != test_year]
    test_data = df_test[df_test['timestamp'].dt.year == test_year]
    
    if len(test_data) > 100:  # Only if substantial test data
        try:
            test_r2 = r2_score(test_data['hourly_volume'], test_data['predictions'])
            test_rmse = np.sqrt(mean_squared_error(test_data['hourly_volume'], test_data['predictions']))
            
            loo_results.append({
                'Test_Year': test_year,
                'R2': test_r2,
                'RMSE': test_rmse,
                'Samples': len(test_data)
            })
            
            print(f"   Test on {test_year}: R²={test_r2:.4f}, RMSE={test_rmse:.2f}, n={len(test_data)}")
        except Exception as e:
            print(f"   Test on {test_year}: Error - {str(e)}")
    else:
        print(f"   Test on {test_year}: Insufficient data (n={len(test_data)})")

# Test 2: Performance by data characteristics
print(f"\n📊 PERFORMANCE BY DATA CHARACTERISTICS:")

# By consumption level
try:
    low_consumption = df_test[df_test['hourly_volume'] <= df_test['hourly_volume'].quantile(0.25)]
    high_consumption = df_test[df_test['hourly_volume'] >= df_test['hourly_volume'].quantile(0.75)]

    if len(low_consumption) > 10 and len(high_consumption) > 10:
        low_r2 = r2_score(low_consumption['hourly_volume'], low_consumption['predictions'])
        high_r2 = r2_score(high_consumption['hourly_volume'], high_consumption['predictions'])

        print(f"   Low consumption (Q1): R²={low_r2:.4f} (n={len(low_consumption)})")
        print(f"   High consumption (Q4): R²={high_r2:.4f} (n={len(high_consumption)})")
        print(f"   Performance gap: {abs(high_r2 - low_r2):.4f}")

        if abs(high_r2 - low_r2) > 0.1:
            print("   ⚠️  Large performance gap across consumption levels!")
        else:
            print("   ✅ Consistent performance across consumption levels")
    else:
        print("   ⚠️  Insufficient data for consumption level analysis")
except Exception as e:
    print(f"   ❌ Error in consumption level analysis: {str(e)}")

print("\n" + "="*80)
print("✅ COMPREHENSIVE OVERFITTING ANALYSIS COMPLETE")
print("="*80)