import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import os
import sys
from datetime import datetime, timedelta

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the model from gas_prediction.py
from gas_prediction import GasUsagePredictionModel

# Set page title and configuration
st.set_page_config(
    page_title="Gas Usage Prediction",
    page_icon="🔥",
    layout="wide"
)

def main():
    st.title("Natural Gas Usage Prediction")
    st.write("Predict hourly gas usage based on historical data")
    
    # Sidebar for navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.radio("Go to", ["Prediction", "Model Training", "Data Visualization"])
    
    # Initialize model
    model = GasUsagePredictionModel()
    model_path = 'models/gas_usage_model.pkl'
    
    # Check if model exists
    model_exists = os.path.exists(model_path)
    
    if page == "Prediction":
        st.header("Predict Gas Usage")
        
        if not model_exists:
            st.warning("No trained model found. Please go to the Model Training page first.")
        else:
            # Load the model
            model.load_model()
            
            # Date input
            col1, col2 = st.columns(2)
            
            with col1:
                pred_date = st.date_input(
                    "Select date",
                    datetime.now() + timedelta(days=1)
                )
            
            with col2:
                pred_time = st.time_input(
                    "Select time",
                    datetime.now().time()
                )
            
            # Combine date and time
            date_time_str = f"{pred_date.day},{pred_date.month},{pred_date.year} {pred_time.hour}:{pred_time.minute}"
            
            if st.button("Predict"):
                try:
                    # Make prediction
                    result = model.predict_future(date_time_str)
                    
                    # Display result
                    st.success(f"Prediction complete!")
                    
                    # Create a nice visualization of the result
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.metric(
                            label="Predicted Hourly Gas Usage",
                            value=f"{result['predicted_hourly_volume']} {result['units']}"
                        )
                    
                    with col2:
                        st.info(f"Prediction for: {result['date']}")
                    
                    # Add additional context about the prediction
                    st.subheader("Prediction Context")
                    st.write("""
                    This prediction is based on historical patterns in your gas usage data, 
                    including time-based patterns, temperature effects, and pressure variations.
                    """)
                    
                    # Reliability indicator
                    if model.data['timestamp'].max() < pd.to_datetime(result['date']) - pd.Timedelta(days=7):
                        st.warning("""
                        ⚠️ The prediction date is more than 7 days from your most recent data.
                        Prediction accuracy may be reduced for dates further in the future.
                        """)
                
                except Exception as e:
                    st.error(f"Error making prediction: {e}")
    
    elif page == "Model Training":
        st.header("Train Your Prediction Model")
        
        # Model training options
        st.subheader("Model Options")
        
        model_type = st.selectbox(
            "Select model type",
            ["xgboost", "random_forest", "gradient_boosting", "linear"],
            help="XGBoost and Random Forest usually provide the best results for this type of data"
        )
        
        evaluate_all = st.checkbox(
            "Evaluate all model types (this may take some time)",
            help="Compare all model types to find the best performing one"
        )
        
        if st.button("Train Model"):
            with st.spinner("Training model... This may take a few minutes"):
                try:
                    if evaluate_all:
                        st.info("Evaluating all model types...")
                        results = model.evaluate_all_models()
                        
                        # Display results in a table
                        results_df = pd.DataFrame(results).T
                        st.subheader("Model Comparison Results")
                        st.dataframe(results_df)
                        
                        # Display best model
                        best_model = results_df.idxmin()['rmse']
                        st.success(f"Best model: {best_model} with RMSE: {results_df.loc[best_model, 'rmse']:.4f}")
                    else:
                        st.info(f"Training {model_type} model...")
                        result = model.train_model(model_type=model_type)
                        model.save_model()
                        
                        st.success(f"Model training complete! RMSE: {result['rmse']:.4f}")
                    
                    # Plot display if available
                    plot_file = f'plots/model_evaluation_{model_type}.png'
                    if os.path.exists(plot_file):
                        st.image(plot_file)
                
                except Exception as e:
                    st.error(f"Error training model: {e}")
    
    elif page == "Data Visualization":
        st.header("Data Visualization and Analysis")
        
        # Try to load data
        try:
            # Load the data
            data = model.load_data()
            
            st.subheader("Data Overview")
            st.dataframe(data.head())
            
            # Time series of gas usage
            st.subheader("Gas Usage Over Time")
            fig, ax = plt.subplots(figsize=(12, 6))
            ax.plot(data['timestamp'], data['hourly_volume'])
            ax.set_xlabel('Date')
            ax.set_ylabel('Hourly Volume (min m³)')
            ax.set_title('Hourly Gas Usage Over Time')
            plt.xticks(rotation=45)
            plt.tight_layout()
            st.pyplot(fig)
            
            # Correlation heatmap
            st.subheader("Feature Correlations")
            numeric_cols = data.select_dtypes(include=['float64', 'int64']).columns
            correlation = data[numeric_cols].corr()
            
            fig, ax = plt.subplots(figsize=(10, 8))
            cax = ax.matshow(correlation, cmap='coolwarm')
            plt.colorbar(cax)
            
            tick_marks = np.arange(len(numeric_cols))
            ax.set_xticks(tick_marks)
            ax.set_yticks(tick_marks)
            ax.set_xticklabels(numeric_cols, rotation=90)
            ax.set_yticklabels(numeric_cols)
            
            plt.tight_layout()
            st.pyplot(fig)
            
            # Daily and Weekly patterns
            st.subheader("Usage Patterns")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("Hourly Pattern")
                hourly_pattern = data.groupby(data['timestamp'].dt.hour)['hourly_volume'].mean()
                
                fig, ax = plt.subplots(figsize=(8, 4))
                ax.bar(hourly_pattern.index, hourly_pattern.values)
                ax.set_xlabel('Hour of Day')
                ax.set_ylabel('Average Hourly Volume')
                ax.set_xticks(range(0, 24, 2))
                plt.tight_layout()
                st.pyplot(fig)
            
            with col2:
                st.write("Day of Week Pattern")
                daily_pattern = data.groupby(data['timestamp'].dt.dayofweek)['hourly_volume'].mean()
                
                days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                fig, ax = plt.subplots(figsize=(8, 4))
                ax.bar(days, daily_pattern.values)
                ax.set_xlabel('Day of Week')
                ax.set_ylabel('Average Hourly Volume')
                plt.xticks(rotation=45)
                plt.tight_layout()
                st.pyplot(fig)
            
            # Temperature vs. Usage
            st.subheader("Temperature vs. Gas Usage")
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.scatter(data['temperature'], data['hourly_volume'], alpha=0.5)
            ax.set_xlabel('Temperature (°C)')
            ax.set_ylabel('Hourly Volume (min m³)')
            plt.tight_layout()
            st.pyplot(fig)
            
        except Exception as e:
            st.error(f"Error loading data: {e}")
            st.info("Please make sure your data file is in the 'data' folder as 'data.csv'")

if __name__ == "__main__":
    main()