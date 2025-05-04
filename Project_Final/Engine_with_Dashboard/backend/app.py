from flask import Flask, jsonify
from flask_cors import CORS
from models import db, EmailLog, EmailDataset
import os
import smtplib
from email import message_from_bytes
from email.message import EmailMessage
import subprocess
import sys
import csv

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/api/stats')
def get_stats():
    total = EmailLog.query.count()
    phishing_count = EmailLog.query.filter_by(label='Phishing').count()
    safe_count = EmailLog.query.filter_by(label='Safe').count()
    recent = EmailLog.query.order_by(EmailLog.timestamp.desc()).limit(10).all()

    return jsonify({
        "total": total,
        "phishing_count": phishing_count,
        "safe_count": safe_count,
        "recent": [
            {
                "email_id": log.email_id,
                "sender": log.sender,
                "recipient": log.recipient,
                "subject": log.subject,
                "label": log.label,
                "apt_groups": log.apt_groups,
                "technique": log.technique,
                "tactic": log.tactic,
                "timestamp": log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for log in recent
        ]
    })

@app.route('/api/emails')
def get_all_emails():
    all_emails = EmailLog.query.order_by(EmailLog.timestamp.desc()).all()
    return jsonify({
        "emails": [
            {
                "email_id": log.email_id,
                "sender": log.sender,
                "recipient": log.recipient,
                "subject": log.subject,
                "label": log.label,
                "apt_groups": log.apt_groups,
                "technique": log.technique,
                "tactic": log.tactic,
                "timestamp": log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for log in all_emails
        ]
    })

@app.route('/api/release/<int:email_id>', methods=['POST'])
def release_email(email_id):
    try:
        # Get email from database
        email_log = EmailLog.query.filter_by(email_id=email_id).first()
        if not email_log:
            return jsonify({"error": "Email not found"}), 404

        # Path to stored original email
        stored_email_path = os.path.join(
            os.path.dirname(__file__),
            'stored_emails',
            str(email_id),
            'original_email.eml'
        )

        # Read the original email as bytes
        with open(stored_email_path, 'rb') as f:
            email_content = f.read()
            msg = message_from_bytes(email_content)

        # Send the email using SMTP
        with smtplib.SMTP('localhost', 25) as smtp:
            smtp.send_message(msg)

        # Update label in EmailDataset if it exists
        dataset_entry = EmailDataset.query.filter_by(email_id=email_id).first()
        if dataset_entry:
            dataset_entry.label = 0  # Update label to 0 (Safe)
            db.session.commit()
        else:
            print(f"Email ID {email_id} not found in dataset, continuing with release process")

        # Update the email log in the database
        email_log.label = 'Safe'
        db.session.commit()

        return jsonify({"message": "Email released successfully"}), 200

    except Exception as e:
        print(f"Error releasing email: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/update-dataset', methods=['POST'])
def update_dataset():
    try:
        # Get the path to extract.py
        extract_script_path = os.path.join(os.path.dirname(__file__), 'extract.py')
        
        # Use the Python interpreter from the virtual environment
        python_executable = sys.executable
        
        # Run the extract.py script with the virtual environment's Python
        result = subprocess.run([python_executable, extract_script_path], capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({"message": "Dataset updated successfully"}), 200
        else:
            return jsonify({"error": f"Error updating dataset: {result.stderr}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/train-model', methods=['POST'])
def train_model():
    try:
        # Get the path to training.py
        training_script_path = os.path.join(os.path.dirname(__file__), 'training.py')
        
        # Use the Python interpreter from the virtual environment
        python_executable = sys.executable
        
        # Run the training.py script with the virtual environment's Python
        result = subprocess.run([python_executable, training_script_path], capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({"message": "Model trained successfully"}), 200
        else:
            return jsonify({"error": f"Error training model: {result.stderr}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)