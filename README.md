# ConfidenceVoice
A full-stack web application for analyzing public speaking confidence through audio and video inputs, with e-commerce functionality for public speaking resources.
Features

Real-time audio/video transcription and filler word detection using NLP.

Confidence scoring for public speaking analysis.

E-commerce platform for purchasing public speaking books.

Admin dashboard to manage users, orders, books, and categories.

Secure user authentication and payment processing.

# Tech Stack

Frontend: React, Material-UI, Recharts

Backend: Node.js, Express, Flask, MySQL

ML Backend: Python, spaCy, TensorFlow, OpenCV

APIs: RESTful APIs for analysis and e-commerce

# Setup Instructions

# Clone the Repository:
git clone https://github.com/Shreyas21A/ConfidenceVoice.git

cd ConfidenceVoice


# Backend Setup:
cd backend

npm install

node app.js


# Frontend Setup:
cd frontend

npm install

npm start


# ML Backend Setup:
cd ml_backend

python -m venv venv 

source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

python realtime_audio/app.py

python realtime_video/webcam.py

python upload_audio_video/app.py


# Database Setup:

Configure MySQL using the schema in backend/db.js.
Update .env with your database credentials.
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=
EMAIL= 
EMAIL_PASSWORD= 

```


# Usage

Frontend: http://localhost:3000
Admin Dashboard: http://localhost:3000/admin
ML APIs: http://localhost:5000, http://localhost:5001, http://localhost:5002
