# PhishGlare

A comprehensive email security solution that combines a modern dashboard interface with an advanced APT (Advanced Persistent Threat) classification engine. This project helps in monitoring, analyzing, and classifying potentially malicious emails using machine learning techniques.

## Project Structure

The project is divided into two main components:

### Frontend (`/frontend`)
A React-based dashboard built with Material-UI that provides:
- Real-time email monitoring
- Data visualization using Recharts
- Interactive data tables
- Excel export functionality
- Modern and responsive UI

### Backend (`/backend`)
A Python-based engine that includes:
- SMTP email processing engine
- APT classification system
- Machine learning model for threat detection
- Email extraction and analysis tools
- Training pipeline for the classification model

## Features

- **Email Monitoring**: Real-time monitoring of incoming emails
- **APT Classification**: Advanced threat detection using machine learning
- **Data Visualization**: Interactive charts and graphs for security metrics
- **Export Capabilities**: Export data to Excel format
- **User-Friendly Interface**: Modern dashboard with Material-UI components
- **Machine Learning**: Stacking model with RBF kernel for accurate classification

## Prerequisites

### Frontend
- Node.js (v14 or higher)
- npm or yarn

### Backend
- Python 3.x
- Required Python packages (install using pip):
  - Flask
  - scikit-learn
  - pandas
  - numpy
  - Other dependencies listed in requirements.txt

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd Engine_with_Dashboard
```

2. Frontend Setup:
```bash
cd frontend
npm install
```

3. Backend Setup:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Application

1. Start the Backend:
```bash
cd backend
python app.py
```

2. Start the Frontend:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Project Architecture

- **Frontend**: React with Material-UI, using modern hooks and functional components
- **Backend**: Flask-based REST API with machine learning integration
- **Data Processing**: Custom email extraction and analysis pipeline
- **Machine Learning**: Stacking model with RBF kernel for APT classification

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the frontend components
- scikit-learn for machine learning capabilities
- Flask for the backend framework 
