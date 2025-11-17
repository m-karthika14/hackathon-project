#!/usr/bin/env python3
"""
Face Monitor API Bridge
Connects the enhanced head monitor with the MINDMIRROR web application
"""

import threading
import time
import json
import os
import sys
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np

# Add the current directory to Python path to import enhanced_head_monitor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Try to import the enhanced head monitor
try:
    from enhanced_head_monitor import HeadMonitor
    ENHANCED_MONITOR_AVAILABLE = True
except ImportError:
    print("⚠️  Enhanced head monitor not available, using basic camera detection")
    ENHANCED_MONITOR_AVAILABLE = False

class FaceMonitorAPI:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)  # Allow cross-origin requests from React app
        
        # Monitoring state
        self.is_monitoring = False
        self.current_session_id = None
        self.current_trial_id = None
        self.monitor_process = None
        self.session_data = {}
        self.current_metrics = {}
        
        # Camera and monitoring
        self.camera = None
        self.head_monitor = None
        self.trial_data = []
        self.current_metrics = {}
        
        # Setup routes
        self.setup_routes()
        
    def setup_routes(self):
        @self.app.route('/api/face/health', methods=['GET'])
        def health_check():
            """Health check endpoint"""
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'monitoring_active': self.is_monitoring
            })
        
        @self.app.route('/api/face/start_session', methods=['POST'])
        def start_session():
            """Start a new face monitoring session"""
            try:
                data = request.json or {}
                user_id = data.get('user_id', 'anonymous')
                game_type = data.get('game_type', 'mindmirror_games')
                
                if self.is_monitoring:
                    return jsonify({
                        'status': 'error',
                        'message': 'Monitoring already active'
                    }), 400
                
                # Generate session ID
                self.current_session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                
                # Initialize session data
                self.session_data = {
                    'session_id': self.current_session_id,
                    'user_id': user_id,
                    'game_type': game_type,
                    'start_time': datetime.now().isoformat(),
                    'trials': [],
                    'summary_metrics': {}
                }
                
                # Start monitoring in background thread
                self.is_monitoring = True
                monitor_thread = threading.Thread(target=self._run_monitoring_background)
                monitor_thread.daemon = True
                monitor_thread.start()
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎥 Face monitoring session started: {self.current_session_id}")
                
                return jsonify({
                    'status': 'success',
                    'session_id': self.current_session_id,
                    'message': 'Face monitoring session started'
                })
                
            except Exception as e:
                print(f"Error starting session: {e}")
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 500
        
        @self.app.route('/api/face/start_trial', methods=['POST'])
        def start_trial():
            """Start monitoring for a specific trial"""
            try:
                data = request.json or {}
                trial_id = data.get('trial_id')
                game_name = data.get('game_name', 'unknown')
                trial_type = data.get('trial_type', 'standard')
                
                if not self.is_monitoring:
                    return jsonify({
                        'status': 'error',
                        'message': 'No active monitoring session'
                    }), 400
                
                self.current_trial_id = trial_id
                
                # Initialize trial data
                trial_data = {
                    'trial_id': trial_id,
                    'game_name': game_name,
                    'trial_type': trial_type,
                    'start_time': datetime.now().isoformat(),
                    'physiological_data': {
                        'start_metrics': self.current_metrics.copy(),
                        'during_trial': []
                    }
                }
                
                self.trial_data.append(trial_data)
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎯 Trial started: {trial_id} ({game_name})")
                
                return jsonify({
                    'status': 'success',
                    'trial_id': trial_id,
                    'message': f'Trial monitoring started for {game_name}'
                })
                
            except Exception as e:
                print(f"Error starting trial: {e}")
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 500
        
        @self.app.route('/api/face/end_trial', methods=['POST'])
        def end_trial():
            """End the current trial and collect results"""
            try:
                data = request.json or {}
                game_results = data.get('game_results', {})
                
                if not self.current_trial_id:
                    return jsonify({
                        'status': 'error',
                        'message': 'No active trial'
                    }), 400
                
                # Find and update the current trial
                for trial in self.trial_data:
                    if trial['trial_id'] == self.current_trial_id:
                        trial['end_time'] = datetime.now().isoformat()
                        trial['game_results'] = game_results
                        trial['physiological_data']['end_metrics'] = self.current_metrics.copy()
                        
                        # Calculate trial duration
                        start_time = datetime.fromisoformat(trial['start_time'])
                        end_time = datetime.fromisoformat(trial['end_time'])
                        trial['duration_ms'] = int((end_time - start_time).total_seconds() * 1000)
                        
                        break
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🏁 Trial ended: {self.current_trial_id}")
                
                trial_result = {
                    'trial_id': self.current_trial_id,
                    'physiological_summary': self.current_metrics,
                    'combined_data': {
                        'game_performance': game_results,
                        'physiological_metrics': self.current_metrics
                    }
                }
                
                self.current_trial_id = None
                
                return jsonify({
                    'status': 'success',
                    'trial_data': trial_result,
                    'message': 'Trial completed and data saved'
                })
                
            except Exception as e:
                print(f"Error ending trial: {e}")
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 500
        
        @self.app.route('/api/face/end_session', methods=['POST'])
        def end_session():
            """End the monitoring session and return complete data"""
            try:
                if not self.is_monitoring:
                    return jsonify({
                        'status': 'error',
                        'message': 'No active monitoring session'
                    }), 400
                
                # Stop monitoring
                self.is_monitoring = False
                self.session_data['end_time'] = datetime.now().isoformat()
                self.session_data['trials'] = self.trial_data
                self.session_data['summary_metrics'] = self.current_metrics
                
                # Calculate session duration
                start_time = datetime.fromisoformat(self.session_data['start_time'])
                end_time = datetime.fromisoformat(self.session_data['end_time'])
                self.session_data['total_duration_ms'] = int((end_time - start_time).total_seconds() * 1000)
                
                # Save session data to file
                self._save_session_data()
                
                session_result = self.session_data.copy()
                
                # Reset state
                self._reset_state()
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🛑 Monitoring session ended")
                
                return jsonify({
                    'status': 'success',
                    'session_data': session_result,
                    'message': 'Monitoring session completed'
                })
                
            except Exception as e:
                print(f"Error ending session: {e}")
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 500
        
        @self.app.route('/api/face/current_metrics', methods=['GET'])
        def get_current_metrics():
            """Get current physiological metrics"""
            if not self.is_monitoring:
                return jsonify({
                    'status': 'error',
                    'message': 'No active monitoring'
                }), 400
            
            return jsonify({
                'status': 'success',
                'metrics': self.current_metrics,
                'session_id': self.current_session_id,
                'trial_id': self.current_trial_id
            })
        
        @self.app.route('/api/face/status', methods=['GET'])
        def get_status():
            """Get current monitoring status"""
            return jsonify({
                'is_monitoring': self.is_monitoring,
                'session_id': self.current_session_id,
                'trial_id': self.current_trial_id,
                'current_metrics': self.current_metrics if self.is_monitoring else None
            })
    
    def _initialize_camera(self):
        """Initialize camera and face monitoring"""
        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 📷 Initializing camera...")
            
            # Try to initialize camera
            self.camera = cv2.VideoCapture(0)  # Try default camera
            if not self.camera.isOpened():
                # Try other camera indices
                for i in range(1, 4):
                    self.camera = cv2.VideoCapture(i)
                    if self.camera.isOpened():
                        break
                else:
                    print("❌ No camera found!")
                    return False
            
            # Configure camera
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            # Test camera
            ret, frame = self.camera.read()
            if not ret:
                print("❌ Camera test failed!")
                self.camera.release()
                return False
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Camera initialized successfully!")
            
            # Initialize enhanced head monitor if available
            if ENHANCED_MONITOR_AVAILABLE:
                try:
                    self.head_monitor = HeadMonitor()
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] ✅ Enhanced head monitor loaded!")
                except Exception as e:
                    print(f"⚠️  Enhanced head monitor failed to load: {e}")
                    self.head_monitor = None
            
            return True
            
        except Exception as e:
            print(f"❌ Camera initialization error: {e}")
            return False
    
    def _run_monitoring_background(self):
        """Background thread for monitoring physiological data"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔍 Starting background monitoring...")
        
        # Initialize camera
        if not self._initialize_camera():
            print("❌ Failed to initialize camera, using simulated data")
            self._run_simulated_monitoring()
            return
        
        # Real monitoring with camera
        blink_count = 0
        attention_score = 85
        last_blink_time = time.time()
        
        try:
            while self.is_monitoring:
                ret, frame = self.camera.read()
                if not ret:
                    print("❌ Failed to read from camera")
                    break
                
                # Basic face detection using OpenCV
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                # Use enhanced head monitor if available
                if self.head_monitor:
                    try:
                        # Use the enhanced head monitor for detailed analysis
                        metrics = self.head_monitor.process_frame(frame)
                        if metrics:
                            self.current_metrics = metrics
                        else:
                            # Fallback to basic metrics
                            self.current_metrics = self._basic_face_analysis(frame, gray)
                    except Exception as e:
                        print(f"Enhanced monitor error: {e}")
                        self.current_metrics = self._basic_face_analysis(frame, gray)
                else:
                    # Basic face analysis
                    self.current_metrics = self._basic_face_analysis(frame, gray)
                
                # Add timestamp
                self.current_metrics['timestamp'] = datetime.now().isoformat()
                
                # Add metrics to current trial if active
                if self.current_trial_id and self.trial_data:
                    for trial in self.trial_data:
                        if trial['trial_id'] == self.current_trial_id:
                            trial['physiological_data']['during_trial'].append(self.current_metrics.copy())
                            break
                
                time.sleep(0.1)  # 10Hz update rate
                
        except Exception as e:
            print(f"Monitoring error: {e}")
        finally:
            if self.camera:
                self.camera.release()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 📷 Camera released")
    
    def _basic_face_analysis(self, frame, gray):
        """Basic face analysis using OpenCV"""
        import random
        
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        # Basic metrics
        face_detected = len(faces) > 0
        attention_score = 85 if face_detected else 20
        
        # Simulate some metrics based on face presence
        if face_detected:
            gaze_on_screen = 0.9
            stress_score = random.uniform(15, 35)
            head_direction = "CENTER"
        else:
            gaze_on_screen = 0.1
            stress_score = random.uniform(60, 80)
            head_direction = "AWAY"
        
        return {
            'blink_count': random.randint(0, 100),
            'blink_rate': random.uniform(12, 25),
            'attention_score': attention_score,
            'stress_score': stress_score,
            'head_direction': head_direction,
            'gaze_on_screen': gaze_on_screen,
            'fixation_duration': random.uniform(0.5, 3.0),
            'micro_movements': random.randint(1, 8),
            'face_detected': face_detected
        }
    
    def _run_simulated_monitoring(self):
        """Fallback simulated monitoring when camera is not available"""
        blink_count = 0
        attention_score = 85
        
        while self.is_monitoring:
            try:
                # Simulate real-time metrics
                import random
                
                # Simulate changing metrics
                blink_count += random.randint(0, 1) if random.random() < 0.1 else 0
                attention_score += random.randint(-2, 2)
                attention_score = max(0, min(100, attention_score))
                
                self.current_metrics = {
                    'timestamp': datetime.now().isoformat(),
                    'blink_count': blink_count,
                    'blink_rate': round(blink_count * 60 / max(1, (time.time() % 60)), 1),
                    'attention_score': attention_score,
                    'stress_score': max(0, 100 - attention_score + random.randint(-10, 10)),
                    'head_direction': random.choice(['CENTER', 'LEFT', 'RIGHT', 'UP', 'DOWN']),
                    'gaze_on_screen': random.uniform(0.7, 1.0),
                    'fixation_duration': random.uniform(0.1, 2.0),
                    'micro_movements': random.randint(0, 5),
                    'face_detected': True  # Simulate face detection
                }
                
                # Add metrics to current trial if active
                if self.current_trial_id and self.trial_data:
                    for trial in self.trial_data:
                        if trial['trial_id'] == self.current_trial_id:
                            trial['physiological_data']['during_trial'].append(self.current_metrics.copy())
                            break
                
                time.sleep(0.1)  # 10Hz update rate
                
            except Exception as e:
                print(f"Simulated monitoring error: {e}")
                break
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔍 Background monitoring stopped")
    
    def _save_session_data(self):
        """Save session data to JSON file"""
        try:
            data_dir = os.path.join(os.path.dirname(__file__), 'data')
            os.makedirs(data_dir, exist_ok=True)
            
            filename = f"combined_session_{self.current_session_id}.json"
            filepath = os.path.join(data_dir, filename)
            
            with open(filepath, 'w') as f:
                json.dump(self.session_data, f, indent=2)
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 Session data saved: {filename}")
            
        except Exception as e:
            print(f"Error saving session data: {e}")
    
    def _reset_state(self):
        """Reset monitoring state"""
        self.current_session_id = None
        self.current_trial_id = None
        self.session_data = {}
        self.trial_data = []
        self.current_metrics = {}
    
    def run(self, host='localhost', port=5001, debug=False):
        """Run the API server"""
        print("🚀 Face Monitor API Server Starting...")
        print(f"📡 Server running on http://{host}:{port}")
        print("🔗 Ready to integrate with MINDMIRROR games")
        print("📊 Endpoints available:")
        print("   - GET  /api/face/health")
        print("   - POST /api/face/start_session")
        print("   - POST /api/face/start_trial")
        print("   - POST /api/face/end_trial")
        print("   - POST /api/face/end_session")
        print("   - GET  /api/face/current_metrics")
        print("   - GET  /api/face/status")
        print()
        
        self.app.run(host=host, port=port, debug=debug, threaded=True)

if __name__ == '__main__':
    api = FaceMonitorAPI()
    api.run(debug=True)
