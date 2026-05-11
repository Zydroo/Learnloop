# Technical Report: Predictive Student Dropout Analytics

## 1. Executive Summary
The goal of this module is to perform "Predictive Analytics" to identify students who are likely to discontinue their courses. We use a **Supervised Machine Learning** approach, specifically a **Random Forest Classifier**, to analyze behavioral patterns and output a risk probability.

## 2. The Dataset (Feature Engineering)
The model makes decisions based on 4 key "Features" (data points):
1. **Average Score (`avg_score`)**: Academic performance. Lower scores often correlate with frustration and dropout.
2. **Lessons Completed (`lessons_completed`)**: Progress velocity. If a student stops completing lessons, their risk increases.
3. **Quiz Attempts (`quiz_attempts`)**: Engagement. High attempts suggest struggle; very low attempts suggest disinterest.
4. **Retention Days (`last_login_days`)**: The most critical feature. The longer a student is away, the higher the dropout probability.

## 3. The Algorithm: Random Forest Classifier
### Why did we choose this?
- **Robustness**: It handles "Outliers" (weird data points) better than a single Decision Tree.
- **Non-Linearity**: Student behavior isn't a straight line. Random Forest can find complex patterns.
- **Ensemble Learning**: It's a "forest" of many Decision Trees. It uses "Majority Voting"—each tree gives a prediction, and the most common one wins.

### How it works (The Math):
- **Gini Impurity**: The model splits data based on which feature provides the most "Information Gain." For example, it might find that "Days Since Login > 7" is the best first question to ask to split successful students from dropouts.

## 4. Implementation Details
- **Language**: Python 3.x
- **Framework**: Flask (used to create the API that the Node.js backend calls).
- **ML Library**: `scikit-learn` for the model, `pandas` for data handling.
- **Inference**: The Node.js backend sends a JSON object with the student's 4 features; the Python service returns a probability (e.g., `0.85` for High Risk).

## 5. Integration Architecture
We use a **Microservices Architecture**. 
1. The **Node.js Server** is the "Manager"—it collects data from the MySQL database.
2. The **Python Service** is the "Expert"—it only knows how to calculate risk.
3. They communicate over **REST API** (HTTP POST requests).
