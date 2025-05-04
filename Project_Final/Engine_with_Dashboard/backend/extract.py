import pandas as pd
import numpy as np
import re
import nltk
import os
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from flask import Flask
from models import db, EmailDataset, ProcessedEmailFeatures

# Download stopwords
nltk.download('stopwords')

# Initialize Flask app for database access
app = Flask(__name__)
# Use absolute path for database
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'db.sqlite3')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
db.init_app(app)

# === Preprocessing and Feature Extraction Setup ===
stop_words = set(stopwords.words('english'))
stemmer = PorterStemmer()
phishing_keywords = [
    'account', 'verify', 'login', 'click', 'urgent', 'password', 'bank', 'suspended',
    'security', 'update', 'confirm', 'here', 'link', 'alert', 'win', 'offer', 'free',
    'limited', 'risk', 'claim'
]

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    words = text.split()
    words = [word for word in words if word not in stop_words]
    words = [stemmer.stem(word) for word in words]
    return ' '.join(words)

def count_urls(text):
    return len(re.findall(r'http[s]?://\S+', text))

def count_url_subdomains(text):
    urls = re.findall(r'http[s]?://([\w.-]+)', text)
    return sum(url.count('.') for url in urls)

def count_urls_with_digits(text):
    urls = re.findall(r'http[s]?://\S+', text)
    return sum(any(char.isdigit() for char in url) for url in urls)

def word_entropy(text):
    if not text:
        return 0
    words = text.split()
    word_freq = pd.Series(words).value_counts() / len(words)
    return -np.sum(word_freq * np.log2(word_freq))

def count_phishing_keywords(text):
    return sum(keyword in text.lower() for keyword in phishing_keywords)

def email_length(text):
    words = text.split()
    return len(words)

def avg_word_length(text):
    words = text.split()
    return np.mean([len(word) for word in words]) if words else 0

# === Process new email dataset and store in database ===
print("\nProcessing new email dataset...")

# Load the new dataset from database
with app.app_context():
    # Query all emails from EmailDataset
    emails = EmailDataset.query.all()
    
    # Convert to DataFrame
    new_df = pd.DataFrame([{
        'id': email.email_id,
        'sender': email.sender,
        'receiver': email.receiver,
        'date': email.date,
        'subject': email.subject,
        'body': email.body,
        'urls': email.urls,
        'label': email.label
    } for email in emails])

# Get existing features from database to maintain vocabulary
with app.app_context():
    existing_features = ProcessedEmailFeatures.query.all()
    if existing_features:
        # Convert existing TF-IDF features to DataFrame
        existing_tfidf = pd.DataFrame([json.loads(f.tfidf_features) for f in existing_features])
        tfidf_features = list(existing_tfidf.columns)
    else:
        tfidf_features = []

print(f"\nFound {len(tfidf_features)} TF-IDF features in existing data")

# Initialize TF-IDF vectorizer with existing vocabulary if available
vectorizer = TfidfVectorizer(max_features=125, stop_words='english', 
                           vocabulary=tfidf_features if tfidf_features else None)

# Process all emails at once for TF-IDF
preprocessed_bodies = [preprocess_text(body) for body in new_df['body']]

# Get TF-IDF features for all emails
tfidf_matrix = vectorizer.fit_transform(preprocessed_bodies)
tfidf_df = pd.DataFrame(tfidf_matrix.toarray(), columns=vectorizer.get_feature_names_out())

# Create basic features
basic_features = pd.DataFrame({
    'urls': [1 if count_urls(body) > 0 else 0 for body in new_df['body']],
    'url_count': [count_urls(body) for body in new_df['body']],
    'url_subdomain_count': [count_url_subdomains(body) for body in new_df['body']],
    'url_digit_count': [count_urls_with_digits(body) for body in new_df['body']],
    'word_entropy': [word_entropy(body) for body in new_df['body']],
    'phishing_keyword_count': [count_phishing_keywords(body) for body in new_df['body']],
    'email_length': [email_length(body) for body in new_df['body']],
    'avg_word_length': [avg_word_length(preprocess_text(body)) for body in new_df['body']],
    'label': new_df['label']
})

# Store features in database
with app.app_context():
    for idx, row in basic_features.iterrows():
        # Convert TF-IDF features to JSON string
        tfidf_features_json = json.dumps(tfidf_df.iloc[idx].to_dict())
        
        # Create new ProcessedEmailFeatures entry
        features = ProcessedEmailFeatures(
            email_id=new_df.iloc[idx]['id'],
            urls=row['urls'],
            url_count=row['url_count'],
            url_subdomain_count=row['url_subdomain_count'],
            url_digit_count=row['url_digit_count'],
            word_entropy=row['word_entropy'],
            phishing_keyword_count=row['phishing_keyword_count'],
            email_length=row['email_length'],
            avg_word_length=row['avg_word_length'],
            label=row['label'],
            tfidf_features=tfidf_features_json
        )
        db.session.add(features)
    
    db.session.commit()

print(f"\nNew dataset processed and stored in database")
print(f"New data statistics:")
print(f"- Number of new emails processed: {len(new_df)}")
print(f"- Number of phishing emails in new data: {sum(new_df['label'] == 1)}")
print(f"- Number of safe emails in new data: {sum(new_df['label'] == 0)}")

# Clear the EmailDataset table but keep the structure
print("\nClearing EmailDataset table...")
with app.app_context():
    EmailDataset.query.delete()
    db.session.commit()
print("EmailDataset table cleared successfully")
