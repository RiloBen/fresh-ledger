# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
# pyrefly: ignore [missing-import]
import numpy as np
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'history' not in data:
            return jsonify({'error': 'Missing historical usage data "history"'}), 400
        
        history = data['history']  # Expected: list of floats representing weekly/monthly usage
        if not isinstance(history, list) or len(history) == 0:
            return jsonify({'error': '"history" must be a non-empty list'}), 400
            
        if len(history) < 3:
            # Fallback to simple average if data points are too few
            prediction = np.mean(history)
            return jsonify({
                'predicted_demand': float(prediction),
                'method': 'simple_average',
                'warning': 'Insufficient data for Random Forest model, fell back to average.'
            })
            
        # Train Random Forest Regressor on time steps
        X = np.array(range(len(history))).reshape(-1, 1)
        y = np.array(history)
        
        model = RandomForestRegressor(n_estimators=10, random_state=42)
        model.fit(X, y)
        
        # Predict next period (next index)
        next_step = np.array([[len(history)]])
        prediction = model.predict(next_step)[0]
        
        return jsonify({
            'predicted_demand': float(prediction),
            'method': 'random_forest_regressor'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
