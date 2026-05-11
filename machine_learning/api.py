from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Load the trained model
MODEL_PATH = 'dropout_model.pkl'

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")
else:
    print(f"Warning: {MODEL_PATH} not found. Please train the model first.")
    model = None

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
