import pandas as pd
import joblib
import os
import json
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import StackingClassifier
from flask import Flask
from models import db, ProcessedEmailFeatures

# Initialize Flask app for database access
app = Flask(__name__)
# Use absolute path for database
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'db.sqlite3')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
db.init_app(app)

# Function to safely remove file if it exists
def remove_if_exists(file_path):
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f" Removed existing {file_path}")
        except Exception as e:
            print(f" Error removing {file_path}: {str(e)}")

# Remove existing model files if they exist
print("\nChecking for existing model files...")
remove_if_exists('train_feature_names.pkl')
remove_if_exists('stacking_model_rbf.pkl')

# Load feature-extracted training dataset from database
print("\nLoading training data from database...")
with app.app_context():
    # Query all features from the database
    features = ProcessedEmailFeatures.query.all()
    
    if not features:
        print("Error: No features found in the database. Please run the feature extraction first.")
        exit(1)
    
    print(f"Found {len(features)} records in the database")
    
    # Convert to DataFrame
    data = []
    for feature in features:
        # Parse the TF-IDF features from JSON
        tfidf_dict = json.loads(feature.tfidf_features)
        
        # Create a row with all features
        row = {
            'urls': feature.urls,
            'url_count': feature.url_count,
            'url_subdomain_count': feature.url_subdomain_count,
            'url_digit_count': feature.url_digit_count,
            'word_entropy': feature.word_entropy,
            'phishing_keyword_count': feature.phishing_keyword_count,
            'email_length': feature.email_length,
            'avg_word_length': feature.avg_word_length,
            'label': feature.label
        }
        
        # Add TF-IDF features
        row.update(tfidf_dict)
        
        data.append(row)
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    print(f"Successfully loaded {len(df)} records from database")

# Separate features and labels
X = df.drop(columns=['label'])  # Features
y = df['label']  # Target

# Save feature names for use in future testing
print("\nSaving feature names...")
train_feature_names = X.columns.tolist()
joblib.dump(train_feature_names, 'train_feature_names.pkl')
print(" Training feature names saved as 'train_feature_names.pkl'")

# Define base learners
base_learners = [
    ('svm', SVC(probability=True, kernel='rbf', C=0.5, gamma='scale', random_state=42)),
    ('xgb', XGBClassifier(eval_metric='logloss', random_state=42, n_jobs=-1))
]

# Define stacking classifier with Logistic Regression as meta-learner
stacking_model = StackingClassifier(
    estimators=base_learners,
    final_estimator=LogisticRegression(),
    cv=5,
    n_jobs=-1
)

# Train model on the entire dataset
print("\nTraining stacking ensemble model on full dataset...")
stacking_model.fit(X, y)

# Save trained model
print("\nSaving trained model...")
joblib.dump(stacking_model, 'stacking_model_rbf.pkl')
print(" Trained model saved as 'stacking_model_rbf.pkl'")

print("\nTraining completed successfully!")
