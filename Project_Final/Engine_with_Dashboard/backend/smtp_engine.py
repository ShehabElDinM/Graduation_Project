import asyncio
from aiosmtpd.controller import Controller
from email.parser import BytesParser
from email.policy import default
from email.message import EmailMessage
import smtplib
import joblib
import pandas as pd
import numpy as np
import re
import nltk
import os
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.stem import PorterStemmer
from nltk.corpus import stopwords
from flask import Flask
from models import db, EmailLog, EmailDataset
from apt_classifier import APTClassifier
import csv

nltk.download('stopwords')

MODEL_PATH = "stacking_model_rbf.pkl"
FEATURE_NAMES_PATH = "train_feature_names.pkl"

stacking_model = joblib.load(MODEL_PATH)
train_feature_names = joblib.load(FEATURE_NAMES_PATH)

stop_words = set(stopwords.words('english'))
stemmer = PorterStemmer()

phishing_keywords = [
    'account', 'verify', 'login', 'click', 'urgent', 'password', 'bank', 'suspended',
    'security', 'update', 'confirm', 'here', 'link', 'alert', 'win', 'offer', 'free',
    'limited', 'risk', 'claim'
]

vectorizer = TfidfVectorizer(max_features=125, stop_words='english')

apt_classifier = APTClassifier()

flask_app = Flask(__name__)
flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
db.init_app(flask_app)

# Create stored_emails directory if it doesn't exist
stored_emails_dir = os.path.join(os.path.dirname(__file__), 'stored_emails')
os.makedirs(stored_emails_dir, exist_ok=True)

def store_original_email(email_id, msg):
    """Store original email and its attachments."""
    try:
        # Create folder for this email
        email_dir = os.path.join(stored_emails_dir, str(email_id))
        os.makedirs(email_dir, exist_ok=True)

        # Store attachments if any
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_maintype() == 'application':
                    filename = part.get_filename()
                    if filename:
                        attachment_path = os.path.join(email_dir, filename)
                        with open(attachment_path, 'wb') as f:
                            f.write(part.get_payload(decode=True))

        # Store original email as .eml file
        email_path = os.path.join(email_dir, 'original_email.eml')
        with open(email_path, 'wb') as f:
            f.write(msg.as_bytes())

    except Exception as e:
        print(f"Error storing email {email_id}: {str(e)}")

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    words = text.split()
    words = [word for word in words if word not in stop_words]
    words = [stemmer.stem(word) for word in words]
    return ' '.join(words)

def count_urls(text):
    urls = re.findall(r'http[s]?://\S+', text)
    return 1 if urls else 0

def count_url_subdomains(text):
    urls = re.findall(r'http[s]?://([\w.-]+)', text)
    return sum(url.count('.') for url in urls)

def word_entropy(text):
    if not text:
        return 0
    words = text.split()
    word_freq = pd.Series(words).value_counts() / len(words)
    return -np.sum(word_freq * np.log2(word_freq))

def count_phishing_keywords(text):
    return sum(keyword in text.lower() for keyword in phishing_keywords)

def email_length(text):
    return len(text.split())

def avg_word_length(text):
    words = text.split()
    return np.mean([len(word) for word in words]) if words else 0

def extract_features(email_body):
    processed_text = preprocess_text(email_body)
    features = {
        "url_count": count_urls(email_body),
        "url_subdomain_count": count_url_subdomains(email_body),
        "word_entropy": word_entropy(email_body),
        "phishing_keyword_count": count_phishing_keywords(email_body),
        "email_length": email_length(processed_text),
        "avg_word_length": avg_word_length(processed_text)
    }
    tfidf_features = vectorizer.fit_transform([processed_text]).toarray()[0]
    tfidf_feature_names = vectorizer.get_feature_names_out()
    for i, feature_name in enumerate(tfidf_feature_names):
        features[feature_name] = tfidf_features[i]
    return features

def align_features(features):
    feature_vector = [features.get(col, 0) for col in train_feature_names]
    return np.array(feature_vector).reshape(1, -1)

def remove_links_from_text(text):
    """
    Remove URLs from text and return the modified text and a flag indicating if links were removed
    """
    # Pattern to match URLs
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    
    # Find all URLs in the text
    urls = re.findall(url_pattern, text)
    
    # If no URLs found, return original text and False
    if not urls:
        return text, False
    
    # Replace URLs with empty string
    modified_text = re.sub(url_pattern, '', text)
    
    # Add marker at the end of the text
    modified_text += "\n\n[Removed Links]"
    
    return modified_text, True

class SMTPInterceptor:
    async def handle_DATA(self, server, session, envelope):
        msg = BytesParser(policy=default).parsebytes(envelope.content)
        email_body = msg.get_body(preferencelist=('plain')).get_content() if msg.is_multipart() else msg.get_payload()
        email_subject = msg.get("Subject", "")
        attachment_filenames = []
        has_attachments = False
        links_removed = False
        attachments_removed = False

        if msg.is_multipart():
            for part in msg.iter_attachments():
                filename = part.get_filename()
                if filename:
                    attachment_filenames.append(filename)
                    has_attachments = True

        email_features = extract_features(email_body)
        aligned_features = align_features(email_features)
        prediction = stacking_model.predict(aligned_features)[0]
        prediction_label = "Phishing" if prediction == 1 else "Safe"

        apt_groups = technique = tactic = "N/A"
        
        # Create log entry first
        email_id = None
        with flask_app.app_context():
            log_entry = EmailLog(
                sender=msg["From"],
                recipient=msg["To"],
                subject=email_subject,
                label=prediction_label,
                apt_groups=apt_groups,
                technique=technique,
                tactic=tactic,
                links_removed=False,  # Will be updated if needed
                attachments_removed=False  # Will be updated if needed
            )
            db.session.add(log_entry)
            db.session.commit()
            
            # Store the email_id for later use
            email_id = log_entry.email_id
            
            # Store the original email after getting the ID
            store_original_email(email_id, msg)

            # Get just the message body
            body = ""
            lines = email_body.split('\n')
            body_lines = []
            for line in lines:
                if line.strip() and not line.startswith(('From:', 'To:', 'Subject:', 'Date:', 'Content-Type:', 'Content-Transfer-Encoding:')):
                    body_lines.append(line.strip())
            body = ' '.join(body_lines)  # Join all body lines with spaces

            # Store in EmailDataset
            dataset_entry = EmailDataset(
                email_id=email_id,
                sender=msg["From"],
                receiver=msg["To"],
                date=msg["Date"],
                subject=email_subject,
                body=body,
                urls=count_urls(email_body),
                label=0  # Initial label (Safe)
            )
            db.session.add(dataset_entry)
            db.session.commit()

        if prediction_label == "Phishing":
            apt_result = apt_classifier.analyze_apt(email_body, email_subject, attachment_filenames)
            apt_groups = apt_result["apt_groups"]
            technique = apt_result["techniques"]
            tactic = apt_result["tactics"]
            
            # Process links in phishing emails
            email_body, links_removed = remove_links_from_text(email_body)
            
            # Add attachment removal marker if needed
            if has_attachments:
                email_body += "\n[Removed Attachments]"
                attachments_removed = True

            # Update label in database if phishing
            with flask_app.app_context():
                # Query the dataset entry directly using the email_id
                dataset_entry = EmailDataset.query.filter_by(email_id=email_id).first()
                if dataset_entry:
                    dataset_entry.label = 1  # Update to Phishing
                    db.session.commit()

        modified_subject = f"({prediction_label}) {email_subject}"

        new_email = EmailMessage()
        new_email["From"] = msg["From"]
        new_email["To"] = msg["To"]
        new_email["Subject"] = modified_subject
        new_email["Date"] = msg["Date"]
        new_email.set_content(email_body, subtype='plain', charset='utf-8')

        if prediction_label == "Safe" and msg.is_multipart():
            for part in msg.iter_attachments():
                filename = part.get_filename()
                if filename:
                    new_email.add_attachment(
                        part.get_payload(decode=True),
                        maintype=part.get_content_maintype(),
                        subtype=part.get_content_subtype(),
                        filename=filename
                    )

        with smtplib.SMTP("localhost", 25) as smtp:
            smtp.send_message(new_email)

        with flask_app.app_context():
            # Query the log entry directly using the email_id
            log_entry = EmailLog.query.filter_by(email_id=email_id).first()
            if log_entry:
                log_entry.apt_groups = apt_groups
                log_entry.technique = technique
                log_entry.tactic = tactic
                log_entry.links_removed = links_removed
                log_entry.attachments_removed = attachments_removed
                db.session.commit()

        return "250 Message accepted for delivery"

def run_smtp_interceptor():
    controller = Controller(SMTPInterceptor(), hostname="127.0.0.1", port=1025)
    controller.start()
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        print("SMTP Interceptor stopped.")

if __name__ == "__main__":
    run_smtp_interceptor()
