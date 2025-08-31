# Vulnerability Backend API

This is a Flask-based backend API to consume and store vulnerability data from JSON files in a relational database (SQLite).

## Setup

1. Install dependencies: `pip install -r requirements.txt`
2. Load data: `python load_data.py`
3. Run the app: `python app.py`

The app will run on http://127.0.0.1:5000

## API Endpoints

- GET /vulnerabilities: Get all vulnerabilities
- GET /vulnerabilities/<id>: Get a specific vulnerability by ID

## Technologies

- Python 3.12
- Flask
- SQLAlchemy
- SQLite (for simplicity, can be changed to PostgreSQL)
