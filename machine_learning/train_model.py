import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

def train_model():
    print("Loading dataset...")
    try:
        df = pd.read_csv('student_data.csv')
    except FileNotFoundError:
        print("Error: 'student_data.csv' not found. Please run generate_dataset.py first.")
        return

    # Features (X) and Target (y)
    # We drop student_id because it's irrelevant to predicting behavior
    X = df.drop(columns=['student_id', 'dropped_out'])
    y = df['dropped_out']

    print("Splitting data into 80% training and 20% testing...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    print("Evaluating model...")
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, predictions))

    print("Saving trained model to 'dropout_model.pkl'...")
    joblib.dump(model, 'dropout_model.pkl')
    print("Training complete! The model is ready to be loaded by the API.")

if __name__ == "__main__":
    train_model()
