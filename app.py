import torch
import cv2
import serial
import threading
from ultralytics import YOLO
from flask import Flask, render_template, Response, jsonify

app = Flask(__name__)

try:
    arduino = serial.Serial('COM3', 9600, timeout=1)
    print("Arduino connected:", arduino.name)
except serial.SerialException:
    arduino = None
    print("Gagal terhubung ke Arduino. Pastikan port COM benar dan tidak digunakan.")

model_path = "runs/detect/train/weights/best.pt"
model = YOLO(model_path)
cap = cv2.VideoCapture(0) 

class_names = model.names

detection_status = "INITIALIZING"
status_lock = threading.Lock()

def send_to_arduino(message):
    """Kirim pesan ke Arduino jika terhubung."""
    if arduino and arduino.is_open:
        try:
            arduino.write((message + '\n').encode())
            print(f"Sent to Arduino: {message}")
        except Exception as e:
            print(f"Error sending to Arduino: {e}")

def detect_objects_and_stream():
    """
    Fungsi inti untuk deteksi objek. Ini akan berjalan dalam sebuah generator.
    """
    global detection_status
    print("Starting detection for web stream...")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Gagal membaca frame dari webcam.")
            break
          
        results = model(frame)        
        annotated_frame = results[0].plot()

        detected_classes = set()
        for r in results:
            for c in r.boxes.cls:
                detected_classes.add(model.names[int(c)])
        
        current_status = ""
        if "Helmet" in detected_classes and "Vest" in detected_classes:
            current_status = "COMPLETE"
        elif "Helmet" in detected_classes:
            current_status = "NO_VEST"
        elif "Vest" in detected_classes:
            current_status = "NO_HELMET"
        elif "Person" in detected_classes:
            current_status = "NO_EQUIPMENT"
        else:
            current_status = "NO_EQUIPMENT"
          
        with status_lock:
            if detection_status != current_status:
                detection_status = current_status
                send_to_arduino(detection_status)

        (flag, encodedImage) = cv2.imencode(".jpg", annotated_frame)
        if not flag:
            continue
        yield(b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + bytearray(encodedImage) + b'\r\n')

# --- Rute Flask ---
@app.route('/')
def index():
    """Menyajikan halaman utama web."""
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    """Rute untuk streaming video."""
    return Response(detect_objects_and_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def get_status():
    """Rute untuk memberikan status deteksi terakhir ke frontend."""
    with status_lock:
        status = detection_status
    return jsonify(status=status)

# --- Menjalankan Aplikasi ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, use_reloader=False)

# --- Cleanup ---
print("Releasing resources...")
cap.release()
if arduino and arduino.is_open:
    arduino.close()
cv2.destroyAllWindows()
