from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Load the trained model
MODEL_PATH = 'dropout_model.pkl'

def force_retrain():
    print("🔄 Version mismatch detected or model missing. Force retraining...")
    try:
        from train_model import train_model
        train_model()
        print("✅ Model retrained successfully.")
    except Exception as e:
        print(f"❌ Failed to retrain model: {e}")

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        # Test if it actually works to catch the attribute error early
        import numpy as np
        test_features = np.zeros((1, 8))
        model.predict_proba(test_features)
        print("✅ Model loaded and verified successfully.")
    except Exception as e:
        print(f"⚠️ Model load error: {e}")
        force_retrain()
        model = joblib.load(MODEL_PATH)
else:
    print(f"Warning: {MODEL_PATH} not found.")
    force_retrain()
    model = joblib.load(MODEL_PATH)

@app.route('/predict', methods=['POST'])
def predict_risk():
    if model is None:
        print("❌ Error: Model not loaded.")
        return jsonify({'error': 'Model not loaded.'}), 500
        
    try:
        data = request.json
        print(f"📩 Received prediction request: {data}")
        
        # Expected features based on our dataset:
        features = pd.DataFrame([{
            'days_since_last_login': float(data.get('days_since_last_login', 0)),
            'avg_quiz_score': float(data.get('avg_quiz_score', 0)),
            'total_watch_time_mins': float(data.get('total_watch_time_mins', 0)),
            'ai_tutor_interactions': float(data.get('ai_tutor_interactions', 0)),
            'completed_lessons': float(data.get('completed_lessons', 0)),
            'video_skip_rate': float(data.get('video_skip_rate', 0)),
            'quiz_success_rate': float(data.get('quiz_success_rate', 0)),
            'quiz_failure_rate': float(data.get('quiz_failure_rate', 0))
        }])
        
        # Predict probability of dropout (class 1)
        prediction = model.predict_proba(features)
        probability = prediction[0][1]
        
        print(f"✅ Prediction successful: {probability}")
        
        return jsonify({
            'dropout_risk_percentage': round(float(probability) * 100, 2),
            'status': 'success'
        })
        
    except Exception as e:
        print(f"❌ Prediction Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'online', 'model_loaded': model is not None})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
