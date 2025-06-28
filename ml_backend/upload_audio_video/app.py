from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import Counter
import os
import cv2
import numpy as np
import speech_recognition as sr
import re
import moviepy.editor as mp
from nltk.corpus import cmudict
from nltk.tokenize import word_tokenize
from keras.models import load_model
import pymysql
import requests
import logging
import nltk
from functools import lru_cache
from werkzeug.utils import secure_filename
import time

nltk.download('cmudict')
nltk.download('punkt')

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# MySQL Configuration
try:
    db = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='confidence_speaker',
        cursorclass=pymysql.cursors.DictCursor
    )
    logger.info("MySQL connection established")
except Exception as e:
    logger.error(f"Failed to connect to MySQL: {e}")
    raise

# Load CMU Pronouncing Dictionary
cmu_dict = cmudict.dict()

# Common filler words
FILLER_WORDS = {'um', 'uh', 'like', 'you know', 'so', 'basically', 'actually'}

# Cache CMUdict lookups
@lru_cache(maxsize=10000)
def get_phonemes(word):
    return cmu_dict.get(word.lower(), [[]])[0]

# Load emotion model
try:
    emotion_model = load_model('./emotion_classifier.h5')
    logger.info("Emotion model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load emotion model: {e}")
    raise

# Load Haar cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
if face_cascade.empty():
    logger.error("Failed to load Haar cascade")
    raise Exception("Haar cascade not found")

# File upload config
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'mp4', 'avi', 'mkv'}
MAX_SIZE = 50 * 1024 * 1024  # 50MB
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Validate token
def validate_token(token):
    try:
        response = requests.post(
            "http://localhost:3003/api/auth/validate-token",
            json={"token": token},
            timeout=5
        )
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Token validation failed: {e}")
        return {"success": False, "message": str(e)}

# Transcribe audio
def transcribe_audio(file_path):
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(file_path) as source:
            audio_data = recognizer.record(source)
        text = recognizer.recognize_google(audio_data)
        logger.info("Audio transcription successful")
        return text, 200
    except sr.RequestError as e:
        logger.error(f"Google Speech API error: {e}")
        return {"error": f"Speech API error: {str(e)}"}, 504
    except sr.UnknownValueError:
        logger.error("Could not understand audio")
        return {"error": "Could not understand audio. Please ensure the audio is clear."}, 400
    except Exception as e:
        logger.error(f"Audio transcription failed: {e}")
        return {"error": f"Audio transcription failed: {str(e)}"}, 400

# Transcribe video
def transcribe_video(file_path):
    recognizer = sr.Recognizer()
    temp_audio_file = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_audio.wav')
    video_clip = None
    audio_clip = None
    try:
        video_clip = mp.VideoFileClip(file_path)
        if video_clip.duration > 300:  # 5 minutes max
            logger.error("Video duration exceeds 5 minutes")
            return {"error": "Video too long. Maximum duration is 5 minutes."}, 400
        audio_clip = video_clip.audio
        audio_clip.write_audiofile(temp_audio_file, logger=None)
        with sr.AudioFile(temp_audio_file) as source:
            audio_data = recognizer.record(source)
        text = recognizer.recognize_google(audio_data)
        logger.info("Video transcription successful")
        return text, 200
    except sr.RequestError as e:
        logger.error(f"Google Speech API error: {e}")
        return {"error": f"Speech API error: {str(e)}"}, 504
    except sr.UnknownValueError:
        logger.error("Could not understand audio")
        return {"error": "Could not understand audio. Please ensure the video has clear audio."}, 400
    except Exception as e:
        logger.error(f"Video transcription failed: {e}")
        return {"error": f"Video transcription failed: {str(e)}"}, 400
    finally:
        if audio_clip:
            audio_clip.close()
        if video_clip:
            video_clip.close()
        if os.path.exists(temp_audio_file):
            try:
                os.remove(temp_audio_file)
            except Exception as e:
                logger.warning(f"Failed to delete temp audio: {e}")

# Detect emotions
def detect_emotions(video_file):
    cap = None
    try:
        cap = cv2.VideoCapture(video_file)
        if not cap.isOpened():
            logger.warning("Could not open video file for emotion detection")
            return 0, 0
        confident_count = 0
        not_confident_count = 0
        total_frames = 0
        frame_skip = 10
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            total_frames += 1
            if total_frames % frame_skip != 0:
                continue
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            if len(faces) == 0:
                continue
            for (x, y, w, h) in faces:
                face_roi = frame[y:y+h, x:x+w]
                emotion_label, _ = predict_emotion(face_roi)
                if emotion_label == "Confident":
                    confident_count += 1
                elif emotion_label == "Not Confident":
                    not_confident_count += 1
        processed_frames = total_frames // frame_skip
        confident_percentage = min((confident_count / processed_frames) * 100, 100) if processed_frames else 0
        not_confident_percentage = (not_confident_count / processed_frames) * 100 if processed_frames else 0
        logger.info(f"Emotion detection: Confident {confident_percentage}%, Not Confident {not_confident_percentage}%")
        return confident_percentage, not_confident_percentage
    except Exception as e:
        logger.error(f"Emotion detection failed: {e}")
        return 0, 0
    finally:
        if cap and cap.isOpened():
            cap.release()
        cv2.destroyAllWindows()

# Predict emotion
def predict_emotion(face_roi):
    try:
        face_roi = cv2.resize(face_roi, (48, 48))
        face_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        face_roi = face_roi.astype("float") / 255.0
        face_roi = np.expand_dims(face_roi, axis=0)
        face_roi = np.expand_dims(face_roi, axis=-1)
        preds = emotion_model.predict(face_roi, verbose=0)[0]
        confident_score = preds[1] + preds[3] + preds[4]  # Happy + Surprised + Neutral
        not_confident_score = preds[2]  # Sad
        emotion_label = "Confident" if confident_score > not_confident_score else "Not Confident"
        return emotion_label, max(confident_score, not_confident_score)
    except Exception as e:
        logger.error(f"Emotion prediction failed: {e}")
        raise

# Assess pronunciation
def assess_pronunciation(text):
    try:
        if not isinstance(text, str):
            logger.error("Invalid text for pronunciation assessment")
            return "Unknown vocabulary"
        for word in process_text(text):
            phonemes = get_phonemes(word)
            if phonemes:
                if len(phonemes) <= 1:
                    return "Excellent vocabulary"
                elif len(phonemes) <= 2:
                    return "Good vocabulary"
                elif len(phonemes) <= 3:
                    return "Okay vocabulary"
                elif len(phonemes) <= 4:
                    return "Bad vocabulary"
                else:
                    return "Poor vocabulary"
        return "Good vocabulary"
    except Exception as e:
        logger.error(f"Pronunciation assessment failed: {e}")
        return "Unknown vocabulary"

# Get suggestions
def get_suggestions(pronunciation_assessment):
    suggestions = {
        "Excellent vocabulary": "Practice stress and intonation.",
        "Good vocabulary": "Pay attention to vowel sounds.",
        "Okay vocabulary": "Work on consonant sounds.",
        "Bad vocabulary": "Break down complex sounds.",
        "Poor vocabulary": "Focus on individual phonemes."
    }
    return [suggestions.get(pronunciation_assessment, "No specific suggestions")]

# Find most repeated words
def find_most_repeated_words(text):
    word_counts = Counter(text)
    most_common = word_counts.most_common(3)
    return ", ".join(word for word, _ in most_common) if most_common else "None"

# Find filler words
def find_filler_words(text):
    filler_words = Counter(word for word in text if word in FILLER_WORDS)
    return ", ".join(f"{word}: {count}" for word, count in filler_words.items()) if filler_words else "None"

# Process text
def process_text(text):
    if not isinstance(text, str):
        return []
    text = re.sub(r'[^\w\s]', '', text).lower()
    return word_tokenize(text)

# Store results
def store_analysis_results(user_id, pronunciation_assessment, suggestion, most_repeated_words, filler_words, confident_percentage, not_confident_percentage):
    try:
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO analysis_results (user_id, pronunciation_assessment, suggestion, most_repeated_words, filler_words, confident_percentage, not_confident_percentage, created_at) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())',
            (user_id, pronunciation_assessment, suggestion, most_repeated_words, filler_words, confident_percentage, not_confident_percentage)
        )
        db.commit()
        logger.info("Analysis results stored in database")
    except Exception as e:
        logger.error(f"Failed to store analysis results: {e}")
        db.rollback()

# Analyze media
def analyze_media(file_path, user_id):
    words = []
    try:
        if file_path.endswith((".mp4", ".avi", ".mkv")):
            text, status = transcribe_video(file_path)
            if status != 200:
                return text, status
            words = process_text(text)
            pronunciation_assessment = assess_pronunciation(text)
            confident_percentage, not_confident_percentage = detect_emotions(file_path)
        elif file_path.endswith((".wav", ".mp3")):
            text, status = transcribe_audio(file_path)
            if status != 200:
                return text, status
            words = process_text(text)
            pronunciation_assessment = assess_pronunciation(text)
            confident_percentage, not_confident_percentage = None, None
        else:
            return {"error": "Unsupported file format"}, 415

        most_repeated_words = find_most_repeated_words(words)
        filler_words = find_filler_words(words)
        suggestions = get_suggestions(pronunciation_assessment)

        store_analysis_results(
            user_id,
            pronunciation_assessment,
            suggestions[0],
            most_repeated_words,
            filler_words,
            confident_percentage,
            not_confident_percentage
        )

        result = {
            "transcribed_text": text,
            "pronunciation_assessment": pronunciation_assessment,
            "most_repeated_words": most_repeated_words,
            "filler_words": filler_words,
            "confident_percentage": f"{confident_percentage:.2f}%" if confident_percentage else "N/A",
            "not_confident_percentage": f"{not_confident_percentage:.2f}%" if not_confident_percentage else "N/A",
            "suggestions": suggestions
        }
        return result, 200
    except Exception as e:
        logger.error(f"Media analysis failed: {e}")
        return {"error": f"Analysis failed: {str(e)}"}, 500

@app.route('/index', methods=['POST'])
def index():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split(" ")[1]
    token_response = validate_token(token)
    if not token_response.get("success"):
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    user_id = token_response.get("user").get("id")
    file = request.files.get('file')
    if not file or file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Unsupported file format"}), 415

    if file.content_length > MAX_SIZE:
        return jsonify({"success": False, "message": "File too large. Maximum size is 50MB"}), 413

    file_path = None
    try:
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        result, status = analyze_media(file_path, user_id)
        return jsonify({"success": status == 200, "message": result.get("error") if status != 200 else None, "result": result if status == 200 else None}), status
    except Exception as e:
        logger.error(f"Server error during analysis: {e}")
        return jsonify({"success": False, "message": f"Server error: {str(e)}"}), 500
    finally:
        if file_path and os.path.exists(file_path):
            for _ in range(3):  # Retry deletion
                try:
                    os.remove(file_path)
                    logger.info(f"Deleted file: {file_path}")
                    break
                except PermissionError:
                    logger.warning(f"Retrying file deletion: {file_path}")
                    time.sleep(0.5)
                except Exception as e:
                    logger.error(f"Failed to delete file {file_path}: {e}")
                    break

@app.route('/reports', methods=['GET'])
def reports():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split(" ")[1]
    token_response = validate_token(token)
    if not token_response.get("success"):
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    user_id = token_response.get("user").get("id")

    try:
        cursor = db.cursor()
        cursor.execute(
            'SELECT id, user_id, pronunciation_assessment, suggestion, most_repeated_words, filler_words, confident_percentage, not_confident_percentage, created_at '
            'FROM analysis_results WHERE user_id = %s ORDER BY created_at DESC',
            (user_id,)
        )
        results = cursor.fetchall()
        logger.info(f"Retrieved {len(results)} reports for user_id: {user_id}")
        return jsonify(results)
    except Exception as e:
        logger.error(f"Failed to fetch reports: {e}")
        return jsonify({"success": False, "message": "Failed to fetch reports"}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5000")
    app.run(debug=True, port=5000)