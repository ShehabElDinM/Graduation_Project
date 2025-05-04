from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class EmailLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.Integer, unique=True, nullable=False)
    sender = db.Column(db.String(255))
    recipient = db.Column(db.String(255))
    subject = db.Column(db.String(255))
    label = db.Column(db.String(20))  # Phishing or Safe
    apt_groups = db.Column(db.String(255))  # e.g., Probably APT28, APT29
    technique = db.Column(db.String(100))   # e.g., Spearphishing Link (T1566.002)
    tactic = db.Column(db.String(50))       # e.g., Initial Access
    links_removed = db.Column(db.Boolean, default=False)  # Whether links were removed
    attachments_removed = db.Column(db.Boolean, default=False)  # Whether attachments were removed
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, *args, **kwargs):
        super(EmailLog, self).__init__(*args, **kwargs)
        if not self.email_id:
            # Get the maximum email_id and increment by 1
            max_id = db.session.query(db.func.max(EmailLog.email_id)).scalar() or 0
            self.email_id = max_id + 1

class EmailDataset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.Integer, unique=True, nullable=False)
    sender = db.Column(db.String(255))
    receiver = db.Column(db.String(255))
    date = db.Column(db.String(255))
    subject = db.Column(db.String(255))
    body = db.Column(db.Text)
    urls = db.Column(db.Integer)
    label = db.Column(db.Integer)  # 0 for Safe, 1 for Phishing
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, *args, **kwargs):
        super(EmailDataset, self).__init__(*args, **kwargs)
        if not self.email_id:
            # Get the maximum email_id and increment by 1
            max_id = db.session.query(db.func.max(EmailDataset.email_id)).scalar() or 0
            self.email_id = max_id + 1

class ProcessedEmailFeatures(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.Integer, unique=True, nullable=False)
    urls = db.Column(db.Integer)
    url_count = db.Column(db.Integer)
    url_subdomain_count = db.Column(db.Integer)
    url_digit_count = db.Column(db.Integer)
    word_entropy = db.Column(db.Float)
    phishing_keyword_count = db.Column(db.Integer)
    email_length = db.Column(db.Integer)
    avg_word_length = db.Column(db.Float)
    label = db.Column(db.Integer)  # 0 for Safe, 1 for Phishing
    tfidf_features = db.Column(db.Text)  # Store TF-IDF features as JSON string
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, *args, **kwargs):
        super(ProcessedEmailFeatures, self).__init__(*args, **kwargs)
        if not self.email_id:
            max_id = db.session.query(db.func.max(ProcessedEmailFeatures.email_id)).scalar() or 0
            self.email_id = max_id + 1
