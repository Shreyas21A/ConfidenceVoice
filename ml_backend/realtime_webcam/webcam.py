import time
import threading
import cv2
import numpy as np
import pymysql
import speech_recognition as sr
from keras.models import load_model
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import requests
import logging
from collections import Counter
import nltk
from nltk.tokenize import word_tokenize

nltk.download('punkt')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

# Load the pre-trained emotion classification model
try:
    emotion_model = load_model('./emotion_classifier.h5')
    logger.info("Emotion model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load emotion model: {e}")
    raise

# Load the Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
if face_cascade.empty():
    logger.error("Failed to load Haar cascade")
    raise Exception("Haar cascade not found")

# Global variables for webcam and emotion detection
video_stream = None
running = False
total_frames = 0
confident_count = 0
not_confident_count = 0
transcribed_speech = ""
speech_feedback = []
confident_words_count = 0
unconfident_words_count = 0
filler_words_found = []
analysis_start_time = 0
ANALYSIS_DURATION = 60  # seconds

# Common filler words
FILLER_WORDS = {'um', 'uh', 'like', 'you know', 'so', 'basically', 'actually', 'well', 'er', 'ahm', 'i mean', 'sort of', 'kind of', 'yep', 'right'}

# Function to validate token with Express backend
def validate_token(token):
    try:
        response = requests.post(
            "http://localhost:3003/api/auth/validate-token",
            json={"token": token},
            timeout=5
        )
        logger.debug(f"Token validation response: {response.json()}")
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Token validation failed: {e}")
        return {"success": False, "message": f"Failed to validate token: {str(e)}"}

# Clean transcript
def clean_transcript(text):
    import re
    text = re.sub(r'\s+', ' ', text.strip())
    text = text.capitalize()
    return text if text else "No speech detected"

# Function to predict emotion from face
def predict_emotion(face_roi):
    try:
        face_roi = cv2.resize(face_roi, (48, 48))
        face_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        face_roi = face_roi.astype("float") / 255.0
        face_roi = np.expand_dims(face_roi, axis=0)
        face_roi = np.expand_dims(face_roi, axis=-1)
        preds = emotion_model.predict(face_roi)[0]
        confident_score = preds[0] + preds[3] + preds[4]  # Happy + Surprised + Neutral
        not_confident_score = preds[2]  # Sad
        emotion_label = "Confident" if confident_score > not_confident_score else "Not Confident"
        return emotion_label, max(confident_score, not_confident_score)
    except Exception as e:
        logger.error(f"Emotion prediction failed: {e}")
        return "Not Confident", 0

# Function to detect filler words
def detect_filler_words(text):
    words = word_tokenize(text.lower())
    fillers = [word for word in words if word in FILLER_WORDS]
    return fillers

# Function to analyze speech confidence
def analyze_speech_confidence(speech_text):
    global confident_words_count, unconfident_words_count, filler_words_found
    confident_phrases = [
        "sure", "definitely", "absolutely", "certainly", "no doubt", "confident",
        "positive", "clearly", "without question", "undoubtedly", "I know",
        "I'm certain", "I'm sure", "exactly", "precisely", "obviously", "indeed",
        "of course", "absolutely", "strongly believe", "convinced", "guarantee",
        "assure", "confident", "without hesitation", "firmly", "decisive",
        "assertive", "knowledgeable", "expert", "mastery", "deep understanding",
        "extensive experience", "solid evidence", "proven", "demonstrated",
        "verified", "validated", "confirmed"
    ]
    unconfident_phrases = [
        "maybe", "perhaps", "possibly", "I think", "I guess", "sort of", "kind of",
        "I'm not sure", "I don't know", "um", "uh", "like", "hopefully", "probably",
        "might", "could be", "I suppose", "somewhat", "not really", "I'm trying",
        "nervous", "anxious", "worried", "confused", "hesitant", "unsure",
        "doubtful", "uncertain", "if possible", "it seems", "appears to be",
        "from what I understand", "correct me if I'm wrong", "this might not be right",
        "to some extent", "more or less", "basically", "approximately", "roughly",
        "almost", "barely", "hardly", "scarcely", "just a bit", "slightly",
        "not completely", "partially", "somehow", "in a way", "allegedly",
        "would", "could", "may", "might be", "try to", "attempt to", "wish to",
        "hope to", "plan to", "intend to", "aim to", "want to", "would like to",
        "wondering if", "not sure if"
    ]
    confident_count = sum(1 for phrase in confident_phrases if phrase in speech_text.lower())
    unconfident_count = sum(1 for phrase in unconfident_phrases if phrase in speech_text.lower())
    confident_words_count += confident_count
    unconfident_words_count += unconfident_count
    total_phrases = confident_count + unconfident_count
    verbal_confidence = (confident_count / total_phrases * 100) if total_phrases > 0 else 0
    feedback = []
    if unconfident_count > 0:
        used_unconfident = [phrase for phrase in unconfident_phrases if phrase in speech_text.lower()]
        feedback.append(f"Detected uncertainty phrases: {', '.join(used_unconfident)}")
    if confident_count > 0:
        used_confident = [phrase for phrase in confident_phrases if phrase in speech_text.lower()]
        feedback.append(f"Positive confident phrases used: {', '.join(used_confident)}")
    word_count = len(word_tokenize(speech_text))
    if word_count > 0:
        if "?" in speech_text:
            feedback.append("Questioning tone detected - try making more definitive statements")
        words = word_tokenize(speech_text.lower())
        for i in range(len(words) - 1):
            if words[i] == words[i+1]:
                feedback.append("Word repetition detected - try to speak more fluidly")
                break
    # Detect filler words
    segment_fillers = detect_filler_words(speech_text)
    filler_words_found.extend(segment_fillers)
    if segment_fillers:
        feedback.append(f"Filler words detected: {', '.join(set(segment_fillers))}")
    return verbal_confidence, feedback

# Function to store results in database
def store_analysis_results(user_id, confident_percentage, visual_confidence, verbal_confidence, overall_confidence, transcribed_speech, filler_words):
    try:
        cursor = db.cursor()
        cursor.execute(
            'INSERT INTO emotion_results (user_id, confident_percentage, visual_confidence, verbal_confidence, overall_confidence, transcribed_speech, filler_words, timestamp) '
            'VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())',
            (user_id, confident_percentage, visual_confidence, verbal_confidence, overall_confidence, transcribed_speech, filler_words)
        )
        db.commit()
        logger.info("Analysis results stored in database")
    except Exception as e:
        logger.error(f"Failed to store analysis results: {e}")
        db.rollback()

# Function to capture and process webcam feed
def process_webcam_feed():
    global running, total_frames, confident_count, not_confident_count
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        logger.error("Failed to open webcam")
        return
    logger.info("Webcam opened successfully")
    while running:
        ret, frame = cap.read()
        if not ret:
            logger.error("Failed to capture frame")
            break
        elapsed = time.time() - analysis_start_time
        time_left = max(0, ANALYSIS_DURATION - elapsed)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        for (x, y, w, h) in faces:
            face_roi = frame[y:y+h, x:x+w]
            emotion_label, confidence_score = predict_emotion(face_roi)
            total_frames += 1
            if emotion_label == "Confident":
                confident_count += 1
            else:
                not_confident_count += 1
            color = (0, 255, 0) if emotion_label == "Confident" else (0, 0, 255)
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, f"{emotion_label}: {confidence_score:.2f}",
                        (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(frame, f"Speech: {transcribed_speech[-50:] if len(transcribed_speech) > 50 else transcribed_speech}",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"Time left: {time_left:.1f}s",
                    (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            logger.error("Failed to encode frame")
            continue
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    logger.info("Releasing webcam")
    cap.release()

# Speech recognition thread
def speech_recognition_thread():
    global running, transcribed_speech, speech_feedback
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)
    while running:
        try:
            with sr.Microphone() as source:
                logger.info("Listening for speech...")
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=15)
            try:
                text = recognizer.recognize_google(audio)
                logger.info(f"Recognized: {text}")
                text = clean_transcript(text)
                transcribed_speech += text + " "
                transcribed_speech = clean_transcript(transcribed_speech)
                _, segment_feedback = analyze_speech_confidence(text)
                speech_feedback.extend(segment_feedback)
            except sr.UnknownValueError:
                logger.debug("Speech not understood")
                speech_feedback.append("Partial speech not understood")
            except sr.RequestError as e:
                logger.error(f"Speech recognition error: {e}")
                speech_feedback.append("Speech recognition service unavailable")
        except Exception as e:
            logger.error(f"Speech recognition thread error: {e}")
            speech_feedback.append("Error capturing speech")
        time.sleep(0.1)

# Timer thread to stop analysis
def timer_thread():
    global running
    while running:
        elapsed_time = time.time() - analysis_start_time
        if elapsed_time >= ANALYSIS_DURATION:
            logger.info(f"Analysis completed after {ANALYSIS_DURATION} seconds")
            running = False
            break
        time.sleep(0.1)

# Calculate results
def calculate_results():
    global total_frames, confident_count, not_confident_count, confident_words_count, unconfident_words_count, filler_words_found
    visual_confidence = (confident_count / total_frames * 100) if total_frames > 0 else 0
    total_word_markers = confident_words_count + unconfident_words_count
    verbal_confidence = (confident_words_count / total_word_markers * 100) if total_word_markers > 0 else 50
    overall_confidence = (visual_confidence * 0.6) + (verbal_confidence * 0.4) if total_frames > 0 and total_word_markers > 0 else (visual_confidence or verbal_confidence or 0)
    filler_words_str = ", ".join(set(filler_words_found)) if filler_words_found else "None"
    return {
        "confident_percentage": round(overall_confidence, 2),
        "visual_confidence": round(visual_confidence, 2),
        "verbal_confidence": round(verbal_confidence, 2),
        "overall_confidence": round(overall_confidence, 2),
        "transcribed_speech": transcribed_speech or "No speech detected",
        "speech_feedback": speech_feedback or ["No specific feedback available"],
        "filler_words": filler_words_str,
        "facial_analysis": {
            "total_frames": total_frames,
            "confident_frames": confident_count,
            "not_confident_frames": not_confident_count
        },
        "verbal_analysis": {
            "confident_words": confident_words_count,
            "unconfident_words": unconfident_words_count
        }
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    global running, total_frames, confident_count, not_confident_count
    global transcribed_speech, speech_feedback, confident_words_count, unconfident_words_count, filler_words_found
    global analysis_start_time

    logger.debug("Received request for /analyze")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logger.error("Missing or invalid Authorization header")
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split(" ")[1]
    token_response = validate_token(token)
    if not token_response.get("success"):
        logger.error(f"Token validation failed: {token_response.get('message')}")
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    user = token_response.get("user")
    user_id = user.get("id")
    logger.debug(f"Authenticated user_id: {user_id}")

    # Reset variables
    running = True
    total_frames = 0
    confident_count = 0
    not_confident_count = 0
    transcribed_speech = ""
    speech_feedback = []
    confident_words_count = 0
    unconfident_words_count = 0
    filler_words_found = []
    analysis_start_time = time.time()

    # Start speech recognition thread
    speech_thread = threading.Thread(target=speech_recognition_thread)
    speech_thread.daemon = True
    speech_thread.start()

    # Start timer thread
    timer_thread_instance = threading.Thread(target=timer_thread)
    timer_thread_instance.daemon = True
    timer_thread_instance.start()

    return jsonify({"success": True, "message": "Analysis started", "duration": ANALYSIS_DURATION})

@app.route('/video_feed')
def video_feed():
    logger.debug(f"Streaming video feed, headers: {request.headers}, query: {request.args}")
    auth_header = request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
    elif 'token' in request.args:
        token = request.args.get('token')
    else:
        logger.error("Missing token in Authorization header or query parameter")
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token_response = validate_token(token)
    if not token_response.get("success"):
        logger.error(f"Token validation failed: {token_response.get('message')}")
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    logger.info("Video feed authorized, starting stream")
    return Response(process_webcam_feed(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/results', methods=['GET'])
def results():
    logger.debug("Fetching results")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logger.error("Missing or invalid Authorization header")
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split(" ")[1]
    token_response = validate_token(token)
    if not token_response.get("success"):
        logger.error(f"Token validation failed: {token_response.get('message')}")
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    user = token_response.get("user")
    user_id = user.get("id")
    logger.debug(f"Authenticated user_id: {user_id}")

    if running:
        return jsonify({"success": False, "message": "Analysis still running"}), 400

    results = calculate_results()
    store_analysis_results(
        user_id,
        results["confident_percentage"],
        results["visual_confidence"],
        results["verbal_confidence"],
        results["overall_confidence"],
        results["transcribed_speech"],
        results["filler_words"]
    )
    logger.info("Analysis results returned")
    return jsonify({"success": True, "result": results})

@app.route('/stop', methods=['POST'])
def stop():
    global running
    logger.debug("Received request to stop analysis")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logger.error("Missing or invalid Authorization header")
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split(" ")[1]
    token_response = validate_token(token)
    if not token_response.get("success"):
        logger.error(f"Token validation failed: {token_response.get('message')}")
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    user = token_response.get("user")
    user_id = user.get("id")
    logger.debug(f"Authenticated user_id: {user_id}")

    if not running:
        return jsonify({"success": False, "message": "No analysis running"}), 400

    running = False
    results = calculate_results()
    if not results["transcribed_speech"] or results["transcribed_speech"] == "No speech detected":
        results["transcribed_speech"] = "Partial speech detected"
    store_analysis_results(
        user_id,
        results["confident_percentage"],
        results["visual_confidence"],
        results["verbal_confidence"],
        results["overall_confidence"],
        results["transcribed_speech"],
        results["filler_words"]
    )
    logger.info("Analysis stopped and results stored")
    return jsonify({"success": True, "result": results})

@app.route('/status', methods=['GET'])
def status():
    logger.debug("Checking analysis status")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logger.error("Missing or invalid Authorization header")
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split(" ")[1]
    token_response = validate_token(token)
    if not token_response.get("success"):
        logger.error(f"Token validation failed: {token_response.get('message')}")
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    elapsed = time.time() - analysis_start_time
    time_left = max(0, ANALYSIS_DURATION - elapsed) if running else 0
    visual_confidence = (confident_count / total_frames * 100) if total_frames > 0 else 0
    return jsonify({
        "success": True,
        "running": running,
        "frames_analyzed": total_frames,
        "visual_confidence": round(visual_confidence, 2),
        "speech_length": len(word_tokenize(transcribed_speech)),
        "recent_speech": transcribed_speech[-100:] if len(transcribed_speech) > 100 else transcribed_speech,
        "speech_feedback": speech_feedback[-5:] if speech_feedback else ["No feedback yet"],
        "filler_words": ", ".join(set(filler_words_found)) if filler_words_found else "None",
        "time_remaining": round(time_left, 1)
    })

@app.route('/reports', methods=['GET'])
def reports():
    logger.debug("Received request for /reports")
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logger.error("Missing or invalid Authorization header")
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    token = auth_header.split(" ")[1]
    token_response = validate_token(token)
    if not token_response.get("success"):
        logger.error(f"Token validation failed: {token_response.get('message')}")
        return jsonify({"success": False, "message": token_response.get("message", "Invalid token")}), 401

    user = token_response.get("user")
    user_id = user.get("id")
    logger.debug(f"Authenticated user_id: {user_id}")

    try:
        cursor = db.cursor()
        cursor.execute(
            'SELECT id, confident_percentage, visual_confidence, verbal_confidence, overall_confidence, transcribed_speech, filler_words, timestamp '
            'FROM emotion_results WHERE user_id = %s ORDER BY timestamp DESC',
            (user_id,)
        )
        results = cursor.fetchall()
        logger.info(f"Retrieved {len(results)} reports for user_id: {user_id}")
        return jsonify({"success": True, "reports": results})
    except Exception as e:
        logger.error(f"Failed to fetch reports: {e}")
        return jsonify({"success": False, "message": "Failed to fetch reports"}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on port 5002")
    app.run(debug=True, port=5002)