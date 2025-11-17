#!/usr/bin/env python3
"""
Enhanced Head Movement Sensitive Facial Monitoring System with Blink Detection
Real-time face tracking with Kalman filter-based head pose estimation and blink detection

Features:
- Advanced Head Pose Tracking (yaw, pitch, roll) with Kalman filtering
- Head pose calibration for personalized tracking
- Configurable deadzone to eliminate jitter
- Visual feedback for head position and direction
- Blink detection and counting
- Data logging with CSV export

Author: GitHub Copilot
Version: 1.0.0
"""

import sys
import os
import time
import datetime
import json
import csv
import math
import traceback
import argparse
import signal
from collections import deque
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Import required modules
try:
    import cv2
    import numpy as np
    import mediapipe as mp
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("Please install required packages using: pip install -r requirements.txt")
    sys.exit(1)

class BlinkDetector:
    def __init__(self):
        """Initialize a blink detector for Mediapipe landmarks"""
        # Landmarks for eyes
        self.left_eye_top = 159
        self.left_eye_bottom = 145
        self.left_eye_left = 33
        self.left_eye_right = 133
        
        self.right_eye_top = 386
        self.right_eye_bottom = 374
        self.right_eye_left = 362
        self.right_eye_right = 263
        
        # Blink detection parameters
        self.ear_threshold = 0.2  # Eye aspect ratio threshold
        self.blink_count = 0
        self.blink_in_progress = False
        self.blink_start_time = 0
        self.blink_duration = 0
        self.frames_below_threshold = 0
        self.consecutive_frames = 2
        
        # Blink statistics
        self.blink_timestamps = []
        self.blink_durations = []  # Store blink durations in milliseconds
        self.micro_sleep_count = 0  # Count potential micro-sleeps (long blinks)
        self.start_time = time.time()
    
    def process_landmarks(self, landmarks, frame_shape=None):
        """Process face landmarks to detect blinks
        
        Args:
            landmarks: MediaPipe face landmarks
            frame_shape: Shape of the frame (height, width)
            
        Returns:
            Dictionary with blink status information
        """
        try:
            # Get eye landmark points
            left_eye_top_pt = (landmarks.landmark[self.left_eye_top].x, landmarks.landmark[self.left_eye_top].y)
            left_eye_bottom_pt = (landmarks.landmark[self.left_eye_bottom].x, landmarks.landmark[self.left_eye_bottom].y)
            left_eye_left_pt = (landmarks.landmark[self.left_eye_left].x, landmarks.landmark[self.left_eye_left].y)
            left_eye_right_pt = (landmarks.landmark[self.left_eye_right].x, landmarks.landmark[self.left_eye_right].y)
            
            right_eye_top_pt = (landmarks.landmark[self.right_eye_top].x, landmarks.landmark[self.right_eye_top].y)
            right_eye_bottom_pt = (landmarks.landmark[self.right_eye_bottom].x, landmarks.landmark[self.right_eye_bottom].y)
            right_eye_left_pt = (landmarks.landmark[self.right_eye_left].x, landmarks.landmark[self.right_eye_left].y)
            right_eye_right_pt = (landmarks.landmark[self.right_eye_right].x, landmarks.landmark[self.right_eye_right].y)
            
            # Calculate eye aspect ratio for both eyes
            left_eye_width = self.distance(left_eye_left_pt, left_eye_right_pt)
            left_eye_height = self.distance(left_eye_top_pt, left_eye_bottom_pt)
            
            right_eye_width = self.distance(right_eye_left_pt, right_eye_right_pt)
            right_eye_height = self.distance(right_eye_top_pt, right_eye_bottom_pt)
            
            # Calculate eye aspect ratio (height/width)
            left_ear = 0.0
            if left_eye_width > 0:
                left_ear = left_eye_height / left_eye_width
                
            right_ear = 0.0
            if right_eye_width > 0:
                right_ear = right_eye_height / right_eye_width
            
            # Average EAR
            ear = (left_ear + right_ear) / 2.0
            
            # Detect blink
            left_closed = left_ear < self.ear_threshold
            right_closed = right_ear < self.ear_threshold
            current_time = time.time()
            
            # Both eyes need to be closed for a blink
            if left_closed and right_closed:
                self.frames_below_threshold += 1
                
                # Start of a blink
                if not self.blink_in_progress and self.frames_below_threshold >= self.consecutive_frames:
                    self.blink_in_progress = True
                    self.blink_start_time = current_time
            else:
                # End of a blink
                if self.blink_in_progress:
                    self.blink_in_progress = False
                    self.blink_count += 1
                    blink_duration = (current_time - self.blink_start_time) * 1000  # in milliseconds
                    self.blink_duration = blink_duration
                    self.blink_timestamps.append(current_time)
                    
                    # Store blink duration in milliseconds
                    self.blink_durations.append(blink_duration)
                    
                    # Keep only recent blink durations for analysis (last 20 blinks)
                    if len(self.blink_durations) > 20:
                        self.blink_durations = self.blink_durations[-20:]
                    
                    # Detect potential micro-sleeps (long blinks > 400ms)
                    if blink_duration > 400:
                        self.micro_sleep_count += 1
                    
                    # Clean up old timestamps (older than 60 seconds)
                    self.blink_timestamps = [t for t in self.blink_timestamps if current_time - t <= 60]
                
                self.frames_below_threshold = 0
            
            # Calculate blink rate (blinks per minute)
            session_duration = (current_time - self.start_time) / 60  # in minutes
            if session_duration > 0:
                blink_rate = len(self.blink_timestamps) / min(session_duration, 1)  # Use at most 1 minute
            else:
                blink_rate = 0
            
            # Calculate average blink duration in milliseconds
            avg_blink_duration = 0
            if self.blink_durations:
                avg_blink_duration = sum(self.blink_durations) / len(self.blink_durations)
            
            return {
                "blinking": self.blink_in_progress,
                "left_closed": left_closed,
                "right_closed": right_closed,
                "count": self.blink_count,
                "rate_per_minute": blink_rate,
                "avg_duration": avg_blink_duration,
                "last_duration": self.blink_duration,
                "micro_sleeps": self.micro_sleep_count,
                "durations": self.blink_durations.copy(),  # All recent blink durations
                "left_closed_ratio": left_ear,
                "right_closed_ratio": right_ear
            }
                
        except Exception as e:
            print(f"Error in blink detection: {e}")
            import traceback
            traceback.print_exc()
            return {
                "blinking": False,
                "left_closed": False,
                "right_closed": False,
                "count": self.blink_count,
                "rate_per_minute": 0,
                "avg_duration": 0,
                "last_duration": 0,
                "left_closed_ratio": 0,
                "right_closed_ratio": 0
            }
    
    def distance(self, point1, point2):
        """Calculate Euclidean distance between two points"""
        try:
            x1, y1 = float(point1[0]), float(point1[1])
            x2, y2 = float(point2[0]), float(point2[1])
            return float(np.sqrt((x1 - x2)**2 + (y1 - y2)**2))
        except Exception as e:
            print(f"Error in distance calculation: {e}")
            return 0.0

class HeadPoseKalmanFilter:
    """
    Kalman Filter implementation for head pose estimation.
    Smooths raw pose angles (yaw, pitch, roll) for more stable tracking.
    """
    def __init__(self):
        # Initialize Kalman filter
        self.kalman = cv2.KalmanFilter(6, 3)  # 6 state variables (3 poses + 3 velocities), 3 measurements (yaw, pitch, roll)
        
        # State transition matrix (A)
        # [1, 0, 0, dt, 0, 0]
        # [0, 1, 0, 0, dt, 0]
        # [0, 0, 1, 0, 0, dt]
        # [0, 0, 0, 1, 0, 0]
        # [0, 0, 0, 0, 1, 0]
        # [0, 0, 0, 0, 0, 1]
        self.dt = 1.0/30.0  # time delta (30 fps)
        self.kalman.transitionMatrix = np.array([
            [1, 0, 0, self.dt, 0, 0],
            [0, 1, 0, 0, self.dt, 0],
            [0, 0, 1, 0, 0, self.dt],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ], dtype=np.float32)
        
        # Measurement matrix (H)
        # This maps the state to the measurement space
        self.kalman.measurementMatrix = np.array([
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0]
        ], dtype=np.float32)
        
        # Process noise covariance matrix (Q)
        # Determines how much to trust the model over time
        process_noise_scale = 1e-3
        self.kalman.processNoiseCov = np.eye(6, dtype=np.float32) * process_noise_scale
        
        # Measurement noise covariance matrix (R)
        # Determines how much to trust the measurements
        measurement_noise_scale = 0.1
        self.kalman.measurementNoiseCov = np.eye(3, dtype=np.float32) * measurement_noise_scale
        
        # Error covariance matrix (P)
        self.kalman.errorCovPost = np.eye(6, dtype=np.float32)
        
        # Initial state
        self.kalman.statePost = np.zeros((6, 1), dtype=np.float32)
    
    def update(self, yaw, pitch, roll):
        """
        Update the Kalman filter with new measurements
        Returns filtered pose angles
        """
        # Prediction step
        predicted = self.kalman.predict()
        
        # Measurement step
        measurement = np.array([[yaw], [pitch], [roll]], dtype=np.float32)
        corrected = self.kalman.correct(measurement)
        
        # Return filtered angles
        return corrected[0, 0], corrected[1, 0], corrected[2, 0]

class FacialMonitoringAgent:
    """
    Main agent for facial monitoring with enhanced head tracking and blink detection
    """
    def __init__(self, session_id=None, user_id=None, game_type="general", background_mode=False):
        """Initialize the facial monitoring agent"""
        # Create a unique session ID based on timestamp or use provided one
        if session_id:
            self.session_id = session_id
        else:
            self.session_id = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        
        self.user_id = user_id
        self.game_type = game_type
        self.background_mode = background_mode
        
        print(f"Facial Monitoring Agent initialized for session: {self.session_id}")
        if user_id:
            print(f"User ID: {user_id}")
        if game_type:
            print(f"Game Type: {game_type}")
        if background_mode:
            print("Background Mode: ENABLED (no UI display)")
        else:
            print("Background Mode: DISABLED (UI display enabled)")
        
        # Initialize MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Initialize Face Mesh with performance-optimized settings
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,  # Keep this True for accurate eye tracking
            min_detection_confidence=0.5,  
            min_tracking_confidence=0.5,
            static_image_mode=False  # Ensure this is False for video streams
        )
        
        # Initialize camera with lower resolution for better performance
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Further reduced for better performance
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)  # Further reduced for better performance
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Get actual camera properties
        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        
        # Initialize blink detector
        self.blink_detector = BlinkDetector()
        self.current_blink = {
            "blinking": False,             # Whether eyes are currently closed in a blink
            "left_closed": False,          # Left eye closed
            "right_closed": False,         # Right eye closed
            "count": 0,                    # Total blink count
            "rate_per_minute": 0,          # Blinks per minute
            "avg_duration": 0,             # Average blink duration (milliseconds)
            "last_duration": 0,            # Last blink duration (milliseconds)
            "left_closed_ratio": 0,        # Left eye closure ratio (EAR)
            "right_closed_ratio": 0,       # Right eye closure ratio (EAR)
        }
        
        # Advanced eye tracking metrics
        self.gaze_tracking = {
            "current_x": 0.0,              # Current horizontal gaze position (-1 to 1)
            "current_y": 0.0,              # Current vertical gaze position (-1 to 1)
            "fixation_point": None,        # Current fixation point (x,y)
            "fixation_start_time": 0,      # When current fixation started
            "fixation_duration": 0,        # Duration of current fixation (seconds)
            "fixation_count": 0,           # Number of fixations detected
            "total_fixation_time": 0,      # Total time spent in fixations
            "avg_fixation_time": 0,        # Average fixation duration
            "saccade_count": 0,            # Number of rapid eye movements detected
            "saccade_times": [],           # Timestamps of saccades
            "fixation_history": [],        # List of past fixations with durations
            "screen_attention_ratio": 0.0, # Percentage of time looking at screen
            "last_known_in_bounds": True,  # Last known state of gaze (in screen bounds)
            "fixation_threshold": 0.05,    # Movement threshold for fixation detection
            "saccade_threshold": 0.1,      # Movement threshold for saccade detection
        }
        
        # Game trial and emotion tracking
        self.current_trial_id = 0
        self.trials_data = []
        self.current_trial_start_time = 0
        self.current_emotion = "neutral"
        self.emotion_confidence = 1.0
        self.emotion_history = []
        
        # Emotion detection thresholds
        self.emotion_map = {
            "neutral": {"eyebrow_raise": 0.0, "mouth_open": 0.0, "mouth_smile": 0.0, "eye_wide": 0.0},
            "happy": {"eyebrow_raise": 0.2, "mouth_open": 0.1, "mouth_smile": 0.6, "eye_wide": 0.2},
            "sad": {"eyebrow_raise": -0.3, "mouth_open": -0.2, "mouth_smile": -0.3, "eye_wide": -0.1},
            "angry": {"eyebrow_raise": -0.4, "mouth_open": 0.0, "mouth_smile": -0.4, "eye_wide": 0.3},
            "surprised": {"eyebrow_raise": 0.6, "mouth_open": 0.4, "mouth_smile": 0.0, "eye_wide": 0.5},
            "frustrated": {"eyebrow_raise": -0.2, "mouth_open": 0.1, "mouth_smile": -0.2, "eye_wide": 0.2}
        }
        
        # Blink variability metrics
        self.blink_metrics = {
            "blink_durations": [],         # List of blink durations
            "blink_intervals": [],         # Time between blinks
            "blink_last_time": 0,          # Time of last blink for interval calc
            "variability_score": 0,        # Score indicating blink pattern variability
            "normal_pattern": True,        # Whether blink pattern appears normal
        }
        
        # Kalman filter for head pose
        self.kalman_filter = HeadPoseKalmanFilter()
        self.use_kalman_filter = True  # Toggle to enable/disable Kalman filtering
        
        # Head pose variables
        self.head_yaw = 0.0   # Left-right rotation (negative: left, positive: right)
        self.head_pitch = 0.0  # Up-down rotation (negative: up, positive: down)
        self.head_roll = 0.0   # Tilting (negative: left tilt, positive: right tilt)
        
        # Raw (unfiltered) head pose
        self.raw_yaw = 0.0
        self.raw_pitch = 0.0
        self.raw_roll = 0.0
        
        # Smooth factor for EMA filtering (as fallback)
        self.smooth_factor = 0.8
        
        # Head pose calibration
        self.calibrated = False
        self.calibration_samples = []
        self.calibration_yaw_offset = 0.0
        self.calibration_pitch_offset = 0.0
        self.calibration_roll_offset = 0.0
        self.calibration_countdown = 3  # seconds
        self.calibration_start_time = 0
        
        # Head pose thresholds (deadzone)
        self.yaw_threshold = 10.0  # degrees
        self.pitch_threshold = 10.0  # degrees
        self.roll_threshold = 15.0  # degrees
        
        # Screen attention tracking
        self.looking_at_monitor = True
        self.screen_attention_history = deque(maxlen=30)  # 1 second at 30fps
        self.attention_threshold = 0.7  # 70% of frames must be attentive
        
        # Current head direction
        self.current_direction = "CENTER"  # Options: CENTER, LEFT, RIGHT, UP, DOWN
        
        # Previous state tracking for event detection
        self.prev_head_yaw = 0.0
        self.prev_head_pitch = 0.0
        self.prev_head_direction = "CENTER"
        self.prev_looking_at_monitor = True
        
        # Movement event counters
        self.head_movement_count = 0
        self.micro_movement_count = 0
        self.gaze_shift_count = 0
        
        # Trial tracking
        self.current_trial_id = 0
        self.trial_data = {}
        self.trial_start_time = 0
        self.is_trial_active = False
        
        # Performance metrics
        self.frame_count = 0
        self.start_time = time.time()
        self.frame_times = deque(maxlen=30)  # Track last 30 frames for FPS calculation
        
        # Processing optimization
        self.processing_frequency = 1  # Process every Nth frame (1 = process all frames)
        self.frame_skip_counter = 0
        
        # Data logging
        data_dir = os.path.join(project_root, 'data')
        os.makedirs(data_dir, exist_ok=True)
        self.log_file = os.path.join(data_dir, f"facial_monitoring_{self.session_id}.csv")
        self.initialize_log_file()
        
        # Signal handling for graceful shutdown (especially important in background mode)
        if self.background_mode:
            signal.signal(signal.SIGINT, self._signal_handler)
            signal.signal(signal.SIGTERM, self._signal_handler)
        
        # Visualization options
        self.show_landmarks = True
        self.show_head_pose = True
        self.show_debug_info = True
        self.show_blink_info = True
        self.show_gaze_info = True
        
        # Detection and monitoring state
        self.running = False
        self.face_detected = False

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        signal_name = "SIGINT" if signum == signal.SIGINT else "SIGTERM"
        print(f"\n🛑 Received {signal_name} - shutting down gracefully...")
        self.running = False
    
    def initialize_log_file(self):
        """Create and initialize the log file with headers"""
        with open(self.log_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                "Timestamp",
                "Trial_ID",  # Added trial ID
                
                # Face detection
                "Face_Detected",
                
                # A. Eye & Gaze
                "Blink_Rate", "Blink_Count", "Blink_Duration_ms", "Is_Blinking", "Micro_Sleep_Detected",
                "Gaze_X", "Gaze_Y", "Gaze_On_Screen_Ratio", "Gaze_Shift_Events",
                "Fixation_Duration", "In_Fixation", "Fixation_Count",
                "Saccade_Detected", "Saccade_Count",
                
                # B. Head & Face
                "Head_Yaw", "Head_Pitch", "Head_Roll",
                "Raw_Yaw", "Raw_Pitch", "Raw_Roll",
                "Head_Direction", "Looking_At_Monitor",
                "Head_Movement_Event", "Micro_Head_Movement",
                
                # C. Facial Expressions
                "Dominant_Emotion", "Emotion_Confidence",
                
                # D. Derived Signals
                "Attention_Score", "Stress_Score"
            ])
    
    def log_data(self, force=False):
        """Log current data to CSV file with timestamp"""
        current_time = time.time()
        
        # Calculate micro head movements (jitter)
        micro_movement = 0
        if hasattr(self, 'prev_head_yaw') and hasattr(self, 'prev_head_pitch'):
            yaw_diff = abs(self.head_yaw - self.prev_head_yaw)
            pitch_diff = abs(self.head_pitch - self.prev_head_pitch)
            # Small movements between 1-3 degrees are considered micro movements
            if 1.0 < yaw_diff < 3.0 or 1.0 < pitch_diff < 3.0:
                micro_movement = 1
        
        # Track head movement events (significant movements)
        head_movement = 0
        if hasattr(self, 'prev_head_direction') and self.current_direction != self.prev_head_direction:
            head_movement = 1
        
        # Track gaze shift events
        gaze_shift = 0
        if hasattr(self, 'prev_looking_at_monitor') and self.looking_at_monitor != self.prev_looking_at_monitor:
            gaze_shift = 1
        
        # Calculate attention score (0-100)
        # Based on: gaze on screen (50%), head stillness (30%), blink rate normalcy (20%)
        gaze_attention = self.gaze_tracking.get('screen_attention_ratio', 0) * 50
        
        # Head stillness - penalize if head is moving or not centered
        head_stillness = 30 if self.current_direction == "CENTER" else 15
        if head_movement or micro_movement:
            head_stillness = max(0, head_stillness - 10)
        
        # Blink rate normalcy - ideal is around 15-20 blinks per minute
        blink_rate = self.current_blink.get('rate_per_minute', 0)
        blink_normalcy = 20
        if blink_rate < 10 or blink_rate > 30:  # Too few or too many blinks
            blink_normalcy = 10
        elif blink_rate < 5 or blink_rate > 40:  # Extreme cases
            blink_normalcy = 5
        
        attention_score = min(100, gaze_attention + head_stillness + blink_normalcy)
        
        # Get blink duration in milliseconds
        blink_duration_ms = self.current_blink.get('last_duration', 0)
        
        # Detect micro-sleep (blinks longer than 400ms)
        micro_sleep_detected = 0
        if blink_duration_ms > 400:
            micro_sleep_detected = 1
        
        # Calculate stress score based on:
        # 1. Micro-sleeps (30%)
        # 2. Blink rate deviations (30%)
        # 3. Head micro-movements (40%)
        stress_from_microsleeps = 30 if micro_sleep_detected else 0
        
        # Blink rate stress - normal is 15-20 blinks/min
        blink_stress = 0
        if blink_rate < 5 or blink_rate > 30:
            blink_stress = 15
        if blink_rate < 3 or blink_rate > 40:
            blink_stress = 30
            
        # Micro-movement stress
        movement_stress = micro_movement * 20  # 0 or 20
        if head_movement:
            movement_stress += 20  # Up to 40 total
            
        # Combined stress score
        stress_score = min(100, stress_from_microsleeps + blink_stress + movement_stress)
        
        with open(self.log_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                # Timestamp with milliseconds
                datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
                self.current_trial_id,  # Trial ID
                
                # Face detection
                int(self.face_detected),
                
                # A. Eye & Gaze
                f"{self.current_blink.get('rate_per_minute', 0):.1f}",
                self.current_blink.get("count", 0),
                f"{blink_duration_ms:.1f}",
                int(self.current_blink.get("blinking", False)),
                micro_sleep_detected,
                f"{self.gaze_tracking.get('current_x', 0):.2f}",
                f"{self.gaze_tracking.get('current_y', 0):.2f}",
                f"{self.gaze_tracking.get('screen_attention_ratio', 0):.2f}",
                gaze_shift,
                f"{self.gaze_tracking.get('fixation_duration', 0):.2f}",
                int(self.gaze_tracking.get('fixation_duration', 0) > 0.1),
                self.gaze_tracking.get('fixation_count', 0),
                int(self.gaze_tracking.get('saccade_count', 0) > self.gaze_tracking.get('saccade_count_prev', 0)),
                self.gaze_tracking.get('saccade_count', 0),
                
                # B. Head & Face
                f"{self.head_yaw:.2f}", f"{self.head_pitch:.2f}", f"{self.head_roll:.2f}",
                f"{self.raw_yaw:.2f}", f"{self.raw_pitch:.2f}", f"{self.raw_roll:.2f}",
                self.current_direction,
                int(self.looking_at_monitor),
                head_movement,
                micro_movement,
                
                # C. Facial Expressions
                self.current_emotion,
                f"{self.emotion_confidence:.2f}",
                
                # D. Derived Signals
                f"{attention_score:.1f}",
                f"{stress_score:.1f}"
            ])
            
            # Update previous values for next comparison
            self.gaze_tracking['saccade_count_prev'] = self.gaze_tracking.get('saccade_count', 0)
            self.prev_head_yaw = self.head_yaw
            self.prev_head_pitch = self.head_pitch
            self.prev_head_direction = self.current_direction
            self.prev_looking_at_monitor = self.looking_at_monitor
            
            # If this is during a trial, store data for trial summary
            if self.current_trial_id > 0 and self.current_trial_start_time > 0:
                # Store snapshot for current frame
                frame_data = {
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
                    "trial_duration": time.time() - self.current_trial_start_time,
                    "blinks": self.current_blink.get("blinking", False),
                    "blink_duration": blink_duration_ms,
                    "gaze_on_screen": self.gaze_tracking.get('screen_attention_ratio', 0),
                    "head_direction": self.current_direction,
                    "emotion": self.current_emotion,
                    "attention_score": attention_score,
                    "stress_score": stress_score
                }
                
                # Add to current trial data
                if not hasattr(self, 'current_trial_frames'):
                    self.current_trial_frames = []
                self.current_trial_frames.append(frame_data)
    
    def start_calibration(self):
        """Start the head pose calibration process"""
        print("Starting head pose calibration...")
        print("Please look straight ahead at the center of your screen")
        self.calibration_samples = []
        self.calibrated = False
        self.calibration_start_time = time.time()
    
    def process_calibration(self, yaw, pitch, roll):
        """Process calibration data for head pose"""
        current_time = time.time()
        elapsed = current_time - self.calibration_start_time
        
        # If still in countdown period, collect samples
        if elapsed < self.calibration_countdown:
            # Collect samples
            self.calibration_samples.append((yaw, pitch, roll))
            return False
        
        # If we have enough samples, compute average positions
        if len(self.calibration_samples) > 0:
            # Calculate average head pose during calibration
            yaw_sum = 0.0
            pitch_sum = 0.0
            roll_sum = 0.0
            
            for y, p, r in self.calibration_samples:
                yaw_sum += y
                pitch_sum += p
                roll_sum += r
            
            n = len(self.calibration_samples)
            self.calibration_yaw_offset = yaw_sum / n
            self.calibration_pitch_offset = pitch_sum / n
            self.calibration_roll_offset = roll_sum / n
            
            print(f"Calibration complete. Offsets - Yaw: {self.calibration_yaw_offset:.2f}, Pitch: {self.calibration_pitch_offset:.2f}, Roll: {self.calibration_roll_offset:.2f}")
            
            # Calibration complete
            self.calibrated = True
            return True
        
        return False
    
    def detect_head_pose(self, landmarks, image_shape):
        """
        Detect head pose from facial landmarks
        Returns yaw, pitch, roll angles
        """
        if not landmarks:
            self.face_detected = False
            return 0.0, 0.0, 0.0
        
        self.face_detected = True
        img_h, img_w = image_shape[:2]
        
        # Get key facial landmarks for head pose estimation
        # Using the same points as in the head_ball_game.py for consistency
        
        # Left eye landmarks
        left_eye = self.get_landmark_position(landmarks, 33, img_w, img_h)  # Outer corner
        left_eye2 = self.get_landmark_position(landmarks, 133, img_w, img_h)  # Inner corner
        
        # Right eye landmarks
        right_eye = self.get_landmark_position(landmarks, 362, img_w, img_h)  # Outer corner
        right_eye2 = self.get_landmark_position(landmarks, 263, img_w, img_h)  # Inner corner
        
        # Nose landmark
        nose = self.get_landmark_position(landmarks, 4, img_w, img_h)
        
        # Mouth landmarks
        left_mouth = self.get_landmark_position(landmarks, 61, img_w, img_h)
        right_mouth = self.get_landmark_position(landmarks, 291, img_w, img_h)
        
        # Calculate eyes center
        left_eye_center = ((left_eye[0] + left_eye2[0]) / 2, (left_eye[1] + left_eye2[1]) / 2)
        right_eye_center = ((right_eye[0] + right_eye2[0]) / 2, (right_eye[1] + right_eye2[1]) / 2)
        
        # Roll (tilting head) - angle between eyes
        dx_eyes = right_eye_center[0] - left_eye_center[0]
        dy_eyes = right_eye_center[1] - left_eye_center[1]
        roll = math.atan2(dy_eyes, dx_eyes) * 180 / math.pi
        
        # Pitch (up/down) - using nose relative to eyes and mouth
        eye_center_y = (left_eye_center[1] + right_eye_center[1]) / 2
        mouth_center_y = (left_mouth[1] + right_mouth[1]) / 2
        face_center_y = (eye_center_y + mouth_center_y) / 2
        # More positive pitch means looking down
        pitch = (nose[1] - face_center_y) * 2
        
        # Yaw (left/right) - using nose relative to eyes
        eye_center_x = (left_eye_center[0] + right_eye_center[0]) / 2
        # More positive yaw means looking right
        yaw = (nose[0] - eye_center_x) * 2
        
        # Apply calibration offsets if calibrated
        if self.calibrated:
            yaw -= self.calibration_yaw_offset
            pitch -= self.calibration_pitch_offset
            roll -= self.calibration_roll_offset
        
        return yaw, pitch, roll
    
    def process_eye_metrics(self, landmarks, image_shape):
        """
        Process eye metrics to detect gaze direction, fixations, and saccades
        """
        if not landmarks:
            return
            
        img_h, img_w = image_shape[:2]
        
        # Get eye landmark positions
        # Left eye landmarks
        left_eye_landmarks = [
            self.get_landmark_position(landmarks, 33, img_w, img_h),   # Left eye outer corner
            self.get_landmark_position(landmarks, 159, img_w, img_h),  # Left eye top
            self.get_landmark_position(landmarks, 145, img_w, img_h),  # Left eye bottom
            self.get_landmark_position(landmarks, 133, img_w, img_h),  # Left eye inner corner
        ]
        
        # Right eye landmarks
        right_eye_landmarks = [
            self.get_landmark_position(landmarks, 362, img_w, img_h),  # Right eye outer corner
            self.get_landmark_position(landmarks, 386, img_w, img_h),  # Right eye top
            self.get_landmark_position(landmarks, 374, img_w, img_h),  # Right eye bottom
            self.get_landmark_position(landmarks, 263, img_w, img_h),  # Right eye inner corner
        ]
        
        # Get iris landmarks if available (with refine_landmarks=True)
        left_iris_center = None
        right_iris_center = None
        
        try:
            # Left iris center (468 landmarks model with iris)
            left_iris_center = self.get_landmark_position(landmarks, 468, img_w, img_h)
            
            # Right iris center
            right_iris_center = self.get_landmark_position(landmarks, 473, img_w, img_h)
        except:
            # Fallback if iris landmarks aren't available
            left_eye_center = ((left_eye_landmarks[0][0] + left_eye_landmarks[3][0]) / 2, 
                               (left_eye_landmarks[1][1] + left_eye_landmarks[2][1]) / 2)
            right_eye_center = ((right_eye_landmarks[0][0] + right_eye_landmarks[3][0]) / 2, 
                                (right_eye_landmarks[1][1] + right_eye_landmarks[2][1]) / 2)
            left_iris_center = left_eye_center
            right_iris_center = right_eye_center
        
        # Calculate relative iris position in the eye (for gaze direction)
        # X-axis: -1 (looking far left) to 1 (looking far right)
        # Y-axis: -1 (looking far up) to 1 (looking far down)
        
        # Left eye gaze
        left_eye_width = left_eye_landmarks[3][0] - left_eye_landmarks[0][0]
        left_eye_height = left_eye_landmarks[2][1] - left_eye_landmarks[1][1]
        
        if left_eye_width > 0 and left_eye_height > 0:
            left_gaze_x = 2 * (left_iris_center[0] - left_eye_landmarks[0][0]) / left_eye_width - 1
            left_gaze_y = 2 * (left_iris_center[1] - left_eye_landmarks[1][1]) / left_eye_height - 1
        else:
            left_gaze_x, left_gaze_y = 0, 0
            
        # Right eye gaze
        right_eye_width = right_eye_landmarks[3][0] - right_eye_landmarks[0][0]
        right_eye_height = right_eye_landmarks[2][1] - right_eye_landmarks[1][1]
        
        if right_eye_width > 0 and right_eye_height > 0:
            right_gaze_x = 2 * (right_iris_center[0] - right_eye_landmarks[0][0]) / right_eye_width - 1
            right_gaze_y = 2 * (right_iris_center[1] - right_eye_landmarks[1][1]) / right_eye_height - 1
        else:
            right_gaze_x, right_gaze_y = 0, 0
        
        # Combined gaze (average of both eyes)
        # Note: For left eye, we invert the x-axis so positive means looking right for both eyes
        gaze_x = (right_gaze_x - left_gaze_x) / 2
        gaze_y = (right_gaze_y + left_gaze_y) / 2
        
        # Store current gaze
        self.gaze_tracking["current_x"] = gaze_x
        self.gaze_tracking["current_y"] = gaze_y
        
        # Detect fixations and saccades
        current_time = time.time()
        
        # If we have a previous gaze point, check for fixation or saccade
        prev_gaze_x = self.gaze_tracking.get("prev_x", gaze_x)
        prev_gaze_y = self.gaze_tracking.get("prev_y", gaze_y)
        
        # Calculate gaze movement distance (normalized)
        gaze_distance = math.sqrt((gaze_x - prev_gaze_x)**2 + (gaze_y - prev_gaze_y)**2)
        
        # Check if user is currently blinking
        is_blinking = self.current_blink.get("blinking", False) if hasattr(self, "current_blink") else False
        
        # Fixation detection (small movements)
        # Don't break fixation if the user is blinking but still looking at the same spot
        if gaze_distance < self.gaze_tracking["fixation_threshold"] or is_blinking:
            # We're in a fixation
            if self.gaze_tracking["fixation_point"] is None:
                # Start of a new fixation (don't start during a blink)
                if not is_blinking:
                    self.gaze_tracking["fixation_point"] = (gaze_x, gaze_y)
                    self.gaze_tracking["fixation_start_time"] = current_time
            else:
                # Continue existing fixation
                self.gaze_tracking["fixation_duration"] = current_time - self.gaze_tracking["fixation_start_time"]
        else:
            # Not in a fixation
            
            # If we were in a fixation, record it
            if self.gaze_tracking["fixation_duration"] > 0.1:  # Minimum 100ms for a fixation
                self.gaze_tracking["fixation_count"] += 1
                self.gaze_tracking["total_fixation_time"] += self.gaze_tracking["fixation_duration"]
                
                # Store this fixation
                self.gaze_tracking["fixation_history"].append({
                    "point": self.gaze_tracking["fixation_point"],
                    "duration": self.gaze_tracking["fixation_duration"],
                    "time": self.gaze_tracking["fixation_start_time"]
                })
                
                # Calculate average fixation time
                if self.gaze_tracking["fixation_count"] > 0:
                    self.gaze_tracking["avg_fixation_time"] = (
                        self.gaze_tracking["total_fixation_time"] / self.gaze_tracking["fixation_count"]
                    )
            
            # Detect saccade (rapid eye movement)
            if gaze_distance > self.gaze_tracking["saccade_threshold"]:
                self.gaze_tracking["saccade_count"] += 1
                self.gaze_tracking["saccade_times"].append(current_time)
            
            # Reset fixation
            self.gaze_tracking["fixation_point"] = None
            self.gaze_tracking["fixation_duration"] = 0
        
        # Calculate screen attention ratio (% of time looking at screen)
        # We use the same logic as the head direction attention, but with gaze
        in_screen_bounds = abs(gaze_x) <= 1.0 and abs(gaze_y) <= 1.0
        
        # Also consider head direction - if head is centered, more likely looking at screen
        if hasattr(self, "current_direction") and self.current_direction == "CENTER":
            # If head is centered, strengthen the in_screen_bounds measurement
            in_screen_bounds = in_screen_bounds or abs(gaze_x) <= 1.2 and abs(gaze_y) <= 1.2
        
        # Check if user is currently blinking
        is_blinking = self.current_blink.get("blinking", False) if hasattr(self, "current_blink") else False
        
        # Don't penalize screen attention during blinks if already looking at screen
        # If blinking and the last known position was in bounds, maintain attention
        if is_blinking and self.gaze_tracking.get("last_known_in_bounds", False):
            in_screen_bounds = True
        
        # Remember last known position
        self.gaze_tracking["last_known_in_bounds"] = in_screen_bounds
        
        # Update screen attention ratio (exponential moving average)
        current_ratio = self.gaze_tracking.get("screen_attention_ratio", 0)
        alpha = 0.05  # Smoothing factor
        self.gaze_tracking["screen_attention_ratio"] = current_ratio * (1 - alpha) + in_screen_bounds * alpha
        
        # Store current gaze as previous for next frame
        self.gaze_tracking["prev_x"] = gaze_x
        self.gaze_tracking["prev_y"] = gaze_y
        self.gaze_tracking["prev_time"] = current_time
    
    def get_landmark_position(self, landmarks, idx, img_w, img_h):
        """Convert normalized landmark position to pixel coordinates"""
        landmark = landmarks.landmark[idx]
        return (landmark.x * img_w, landmark.y * img_h)
    
    def update_head_direction(self):
        """Determine head direction based on yaw and pitch values"""
        # Initialize with CENTER
        new_direction = "CENTER"
        
        # Check pitch (up/down)
        if self.head_pitch < -self.pitch_threshold:
            new_direction = "UP"
        elif self.head_pitch > self.pitch_threshold:
            new_direction = "DOWN"
        
        # Check yaw (left/right) - takes precedence over up/down
        if self.head_yaw < -self.yaw_threshold:
            new_direction = "LEFT"
        elif self.head_yaw > self.yaw_threshold:
            new_direction = "RIGHT"
        
        # Detect head movement events
        if new_direction != self.current_direction:
            self.head_movement_count += 1
        
        # Detect micro movements (small movements within threshold)
        yaw_diff = abs(self.head_yaw - getattr(self, 'prev_head_yaw', self.head_yaw))
        pitch_diff = abs(self.head_pitch - getattr(self, 'prev_head_pitch', self.head_pitch))
        if 1.0 < yaw_diff < self.yaw_threshold or 1.0 < pitch_diff < self.pitch_threshold:
            self.micro_movement_count += 1
        
        # Update current direction
        self.current_direction = new_direction
        
        # Determine if looking at monitor (within thresholds)
        looking_at_monitor = (
            abs(self.head_yaw) <= self.yaw_threshold and
            abs(self.head_pitch) <= self.pitch_threshold
        )
        
        # Detect gaze shift events
        if looking_at_monitor != self.looking_at_monitor:
            self.gaze_shift_count += 1
        
        # Update attention history
        self.screen_attention_history.append(looking_at_monitor)
        
        # Calculate current attention status
        if len(self.screen_attention_history) > 0:
            attention_ratio = sum(self.screen_attention_history) / len(self.screen_attention_history)
            self.looking_at_monitor = attention_ratio >= self.attention_threshold
        
        # Save previous values for next comparison
        self.prev_head_yaw = self.head_yaw
        self.prev_head_pitch = self.head_pitch
        self.prev_head_direction = self.current_direction
        self.prev_looking_at_monitor = self.looking_at_monitor
    
    def process_frame(self, frame):
        """Process a video frame for head pose detection"""
        # Frame skipping for performance optimization
        self.frame_skip_counter = (self.frame_skip_counter + 1) % self.processing_frequency
        
        # Update frame counter for all frames
        self.frame_count += 1
        
        # Get frame dimensions
        h, w = frame.shape[:2]
        
        # FPS calculation for all frames, even skipped ones
        current_time = time.time()
        self.frame_times.append(current_time)
        
        # For skipped frames, just add basic info and return
        if self.frame_skip_counter != 0:
            # Add minimal UI elements to maintain responsiveness feel
            if self.show_debug_info:
                # Calculate FPS based on all frames
                if len(self.frame_times) > 1:
                    fps = len(self.frame_times) / (self.frame_times[-1] - self.frame_times[0])
                else:
                    fps = 0.0
                
                # Show minimal debug info
                cv2.putText(frame, f"FPS: {fps:.1f} (Fast Mode)", 
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                # Show latest head direction
                direction_text = f"HEAD: {self.current_direction}"
                direction_color = (0, 255, 0) if self.looking_at_monitor else (0, 0, 255)
                cv2.putText(frame, direction_text, (w - 300, 50), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, direction_color, 2)
                
                # Show latest blink count
                if self.show_blink_info:
                    blink_text = f"BLINKS: {self.current_blink.get('count', 0)}"
                    cv2.putText(frame, blink_text, (w - 300, 90), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
            
            # Return frame with minimal updates
            return frame
        
        # Continue with full processing for non-skipped frames
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.face_mesh.process(rgb_frame)
        
        # Check if face detected
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0]
            
            # Process calibration if active
            if not self.calibrated and self.calibration_start_time > 0:
                raw_yaw, raw_pitch, raw_roll = self.detect_head_pose(landmarks, frame.shape)
                self.process_calibration(raw_yaw, raw_pitch, raw_roll)
            
            # Detect head pose
            self.raw_yaw, self.raw_pitch, self.raw_roll = self.detect_head_pose(landmarks, frame.shape)
            
            # Apply Kalman filtering if enabled
            if self.use_kalman_filter:
                self.head_yaw, self.head_pitch, self.head_roll = self.kalman_filter.update(
                    self.raw_yaw, self.raw_pitch, self.raw_roll
                )
            else:
                # Fallback to EMA smoothing
                self.head_yaw = self.head_yaw * self.smooth_factor + self.raw_yaw * (1 - self.smooth_factor)
                self.head_pitch = self.head_pitch * self.smooth_factor + self.raw_pitch * (1 - self.smooth_factor)
                self.head_roll = self.head_roll * self.smooth_factor + self.raw_roll * (1 - self.smooth_factor)
            
            # Process blink detection
            blink_results = self.blink_detector.process_landmarks(landmarks, frame.shape)
            if blink_results:
                self.current_blink.update(blink_results)
                
                # Update blink variability metrics
                if blink_results.get("blinking", False) and not self.current_blink.get("blinking", False):
                    # New blink started
                    current_time = time.time()
                    
                    # Calculate interval since last blink
                    if self.blink_metrics["blink_last_time"] > 0:
                        interval = current_time - self.blink_metrics["blink_last_time"]
                        self.blink_metrics["blink_intervals"].append(interval)
                    
                    self.blink_metrics["blink_last_time"] = current_time
                
                # Store blink duration when a blink completes
                if not blink_results.get("blinking", False) and self.current_blink.get("blinking", False):
                    # Blink just ended
                    self.blink_metrics["blink_durations"].append(blink_results.get("last_duration", 0))
                    
                    # Calculate variability if we have enough data
                    if len(self.blink_metrics["blink_durations"]) >= 3:
                        durations = np.array(self.blink_metrics["blink_durations"][-10:])
                        intervals = np.array(self.blink_metrics["blink_intervals"][-10:])
                        
                        # Calculate coefficient of variation (std/mean)
                        if len(durations) > 0 and np.mean(durations) > 0:
                            duration_cv = np.std(durations) / np.mean(durations)
                            self.blink_metrics["variability_score"] = duration_cv
                            
                            # Check if pattern is abnormal (high variability)
                            self.blink_metrics["normal_pattern"] = duration_cv < 0.5
            
            # Process gaze tracking and eye metrics
            self.process_eye_metrics(landmarks, frame.shape)
            
            # Update head direction and screen attention
            self.update_head_direction()
            
            # Update trial data if a trial is active
            if self.is_trial_active:
                self.update_trial_data()
                
            # Set current emotion (currently just neutral)
            self.current_emotion = "neutral"
            
            # Draw landmarks if enabled
            if self.show_landmarks:
                self.mp_drawing.draw_landmarks(
                    image=frame,
                    landmark_list=landmarks,
                    connections=self.mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=self.mp_drawing_styles.get_default_face_mesh_tesselation_style()
                )
            
            # Draw head pose directions if enabled
            if self.show_head_pose:
                # Draw direction arrow
                center_x, center_y = w // 2, h // 2
                arrow_length = 100
                
                # Calculate arrow end point based on head pose
                # Scale by threshold to make arrow more visible
                arrow_x = int(center_x - (self.head_yaw * arrow_length / self.yaw_threshold))
                arrow_y = int(center_y + (self.head_pitch * arrow_length / self.pitch_threshold))
                
                # Draw the arrow
                color = (0, 255, 0) if self.looking_at_monitor else (0, 0, 255)
                cv2.arrowedLine(frame, (center_x, center_y), (arrow_x, arrow_y), color, 3)
                
                # Draw a circle at the center to represent the deadzone
                deadzone_radius = min(arrow_length, arrow_length * self.yaw_threshold / self.pitch_threshold) // 2
                cv2.circle(frame, (center_x, center_y), deadzone_radius, (0, 255, 255), 1)
        else:
            self.face_detected = False
        
        # Add debug information to frame if enabled
        if self.show_debug_info:
            # FPS calculation
            current_time = time.time()
            self.frame_times.append(current_time)
            
            if len(self.frame_times) > 1:
                fps = len(self.frame_times) / (self.frame_times[-1] - self.frame_times[0])
            else:
                fps = 0.0
            
            # Debug text
            timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
            debug_lines = [
                f"Time: {timestamp}",
                f"FPS: {fps:.1f}",
                f"Head Direction: {self.current_direction}",
                f"Raw Yaw: {self.raw_yaw:.1f}, Pitch: {self.raw_pitch:.1f}",
                f"Filtered Yaw: {self.head_yaw:.1f}, Pitch: {self.head_pitch:.1f}",
                f"Looking at Monitor: {self.looking_at_monitor}",
                f"Kalman Filter: {'ON' if self.use_kalman_filter else 'OFF'}"
            ]
            
            # Add gaze tracking info if enabled
            if self.show_gaze_info:
                # Add gaze tracking info
                debug_lines.append(f"Gaze: X={self.gaze_tracking.get('current_x', 0):.2f}, Y={self.gaze_tracking.get('current_y', 0):.2f}")
                
                # Add fixation info
                if self.gaze_tracking.get("fixation_duration", 0) > 0.1:
                    debug_lines.append(f"Fixating: {self.gaze_tracking.get('fixation_duration', 0):.1f}s")
                else:
                    debug_lines.append("Fixating: No")
                
                # Add saccade info
                saccades_count = self.gaze_tracking.get("saccade_count", 0)
                debug_lines.append(f"Saccades: {saccades_count}")
                
                # Add screen attention
                screen_attn = self.gaze_tracking.get("screen_attention_ratio", 0) * 100
                debug_lines.append(f"Screen Attention: {screen_attn:.1f}%")
            
            # Add blink information if blink detection is enabled
            if self.show_blink_info:
                debug_lines.append(f"Blink Count: {self.current_blink.get('count', 0)}")
                debug_lines.append(f"Blink Rate: {self.current_blink.get('rate_per_minute', 0):.1f}/min")
                debug_lines.append(f"Blinking: {'Yes' if self.current_blink.get('blinking', False) else 'No'}")
            
            # If calibration is in progress
            if not self.calibrated and self.calibration_start_time > 0:
                elapsed = current_time - self.calibration_start_time
                if elapsed < self.calibration_countdown:
                    debug_lines.append(f"CALIBRATING: {self.calibration_countdown - elapsed:.1f}s")
                else:
                    debug_lines.append("Processing calibration data...")
            elif self.calibrated:
                debug_lines.append("Calibration: Active")
            else:
                debug_lines.append("Calibration: Not calibrated")
            
            # Display debug info
            y_pos = 30
            for line in debug_lines:
                cv2.putText(frame, line, (10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                y_pos += 25
            
            # Draw direction indicator text in a larger font
            direction_text = f"HEAD: {self.current_direction}"
            direction_color = (0, 255, 0) if self.looking_at_monitor else (0, 0, 255)
            cv2.putText(frame, direction_text, (w - 300, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, direction_color, 2)
            
            # Draw blink indicator in a larger font
            if self.show_blink_info:
                blink_text = f"BLINKS: {self.current_blink.get('count', 0)}"
                blink_color = (0, 255, 255)
                if self.current_blink.get('blinking', False):
                    blink_text += " (BLINKING)"
                    blink_color = (0, 165, 255)  # Orange when blinking
                cv2.putText(frame, blink_text, (w - 300, 90), cv2.FONT_HERSHEY_SIMPLEX, 1.0, blink_color, 2)
        
        # Log data less frequently (every 3 seconds instead of every second)
        if self.frame_count % 90 == 0:  # Log every 90 frames (~3 seconds at 30fps)
            self.log_data()
        
        return frame
    
    def create_overlay(self):
        """Create a full-screen overlay window for visualization"""
        window_name = "Facial Monitoring Overlay"
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        
        # Use normal window instead of fullscreen for better performance
        # Set to a reasonable size instead of fullscreen
        screen_width = 1280  # Default reasonable width
        screen_height = 720  # Default reasonable height
        
        try:
            # Get actual screen resolution if possible
            import ctypes
            user32 = ctypes.windll.user32
            screen_width = user32.GetSystemMetrics(0)
            screen_height = user32.GetSystemMetrics(1)
        except:
            pass  # Fall back to default resolution
        
        # Set window to 80% of screen size for better performance
        window_width = int(screen_width * 0.8)
        window_height = int(screen_height * 0.8)
        
        cv2.resizeWindow(window_name, window_width, window_height)
        
        # Set window position to center of screen
        x_pos = (screen_width - window_width) // 2
        y_pos = (screen_height - window_height) // 2
        cv2.moveWindow(window_name, x_pos, y_pos)
        
        # Set window title with mode information
        mode_text = "NORMAL MODE" if self.processing_frequency == 1 else f"FAST MODE ({self.processing_frequency}x)"
        cv2.setWindowTitle(window_name, f"Facial Monitoring - {mode_text}")
    
    def set_processing_frequency(self, frequency):
        """Set the processing frequency (1 = process all frames, 2 = every other frame, etc.)"""
        if frequency < 1:
            frequency = 1
        elif frequency > 10:
            frequency = 10
        
        self.processing_frequency = frequency
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] Processing frequency set to {frequency} (processing 1 out of every {frequency} frames)")
        
        # Update the window title to show the current mode
        mode_text = "NORMAL MODE" if frequency == 1 else f"FAST MODE ({frequency}x)"
        cv2.setWindowTitle("Facial Monitoring Overlay", f"Facial Monitoring - {mode_text}")
        
        return self.processing_frequency
    
    def run(self, duration_seconds=None):
        """
        Run the facial monitoring session
        
        Args:
            duration_seconds: Optional session duration in seconds
        """
        print("\n============================================================")
        print("🎥 FACIAL MONITORING AGENT STARTING")
        print("============================================================")
        print(f"Session ID: {self.session_id}")
        print(f"User ID: {self.user_id or 'Not specified'}")
        print(f"Game Type: {self.game_type}")
        print(f"Background Mode: {'ENABLED' if self.background_mode else 'DISABLED'}")
        print(f"Target FPS: {self.fps}")
        print(f"Screen Resolution: {self.frame_width}x{self.frame_height}")
        print(f"Processing Mode: {self.processing_frequency}x (1/{self.processing_frequency} frames)")
        
        if duration_seconds:
            print(f"Duration Limit: {duration_seconds} seconds")
            end_time = time.time() + duration_seconds
        else:
            print("Duration Limit: Unlimited")
            end_time = None
        
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"\n[{timestamp}] Initializing camera...")
        if not self.cap.isOpened():
            print(f"[{timestamp}] ❌ Error: Could not open camera. Please check your webcam connection.")
            return
        
        print(f"[{timestamp}] ✅ Camera initialized successfully")
        print(f"[{timestamp}]    Resolution: {self.frame_width}x{self.frame_height}")
        print(f"[{timestamp}]    FPS: {self.fps}")
        
        # Only create monitoring window if not in background mode
        if not self.background_mode:
            print(f"[{timestamp}] 🖥️  Creating monitoring window...")
            self.create_overlay()
            print(f"[{timestamp}]    Press 'q' or ESC to stop recording")
            print(f"[{timestamp}]    Press 'f' to cycle through speed modes (1x → 2x → 4x → 1x)")
            print(f"[{timestamp}]    Press '1'-'5' to set specific speed (1=slowest, 5=fastest)")
            print(f"[{timestamp}]    Press 'k' to toggle Kalman filter")
            print(f"[{timestamp}]    Press 'l' to toggle landmarks")
            print(f"[{timestamp}]    Press 'd' to toggle debug info")
            print(f"[{timestamp}]    Press 'b' to toggle blink info")
            print(f"[{timestamp}]    Press 'g' to toggle gaze tracking info")
            print(f"[{timestamp}]    Press 'c' to recalibrate head position")
        else:
            print(f"[{timestamp}] 🎯 Running in BACKGROUND MODE (headless)")
            print(f"[{timestamp}]    No UI will be displayed")
            print(f"[{timestamp}]    Data will be logged to: {os.path.basename(self.log_file)}")
        
        # Start monitoring session
        self.running = True
        self.start_time = time.time()
        
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] 🔴 RECORDING STARTED")
        print(f"\n============================================================")
        
        # Prompt user to calibrate by looking at center of screen (skip in background mode)
        if not self.background_mode:
            self.start_calibration()
        else:
            # In background mode, skip calibration and set as calibrated
            self.calibrated = True
            print(f"[{timestamp}] 🎯 Background mode: Skipping calibration")
        
        while self.running:
            # Check if duration limit reached
            if end_time and time.time() > end_time:
                print("⏱️  Session duration limit reached")
                break
            
            # Capture frame
            ret, frame = self.cap.read()
            if not ret:
                print("❌ Error: Could not read frame from camera")
                break
            
            # Process the frame
            processed_frame = self.process_frame(frame)
            
            # Only show UI if not in background mode
            if not self.background_mode:
                # Show the frame in the overlay window
                cv2.imshow("Facial Monitoring Overlay", processed_frame)
                
                # Check for key presses
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == 27:  # 'q' or ESC
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(f"[{timestamp}] ⌨️  Quit key pressed")
                    break
                elif key == ord('c'):  # 'c' for calibration
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(f"[{timestamp}] Starting calibration...")
                    self.start_calibration()
                elif key == ord('k'):  # 'k' to toggle Kalman filter
                    self.use_kalman_filter = not self.use_kalman_filter
                    filter_mode = "ON" if self.use_kalman_filter else "OFF"
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(f"[{timestamp}] Kalman Filter: {filter_mode}")
                elif key == ord('f'):  # 'f' to toggle fast mode
                    # Cycle through processing frequencies: 1 -> 2 -> 4 -> 1
                    if self.processing_frequency == 1:
                        self.set_processing_frequency(2)
                    elif self.processing_frequency == 2:
                        self.set_processing_frequency(4)
                    else:
                        self.set_processing_frequency(1)
                elif key in [ord('1'), ord('2'), ord('3'), ord('4'), ord('5')]:
                    # Set specific processing frequency with number keys
                    freq = int(chr(key))
                    self.set_processing_frequency(freq)
                elif key == ord('l'):  # 'l' to toggle landmarks
                    self.show_landmarks = not self.show_landmarks
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(f"[{timestamp}] Landmarks Display: {'ON' if self.show_landmarks else 'OFF'}")
                elif key == ord('d'):  # 'd' to toggle debug info
                    self.show_debug_info = not self.show_debug_info
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(f"[{timestamp}] Debug Info: {'ON' if self.show_debug_info else 'OFF'}")
                elif key == ord('b'):  # 'b' to toggle blink info
                    self.show_blink_info = not self.show_blink_info
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(f"[{timestamp}] Blink Info: {'ON' if self.show_blink_info else 'OFF'}")
                elif key == ord('e'):  # 'e' to toggle eye metrics info
                    self.show_gaze_info = not self.show_gaze_info
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                    print(f"[{timestamp}] Eye Metrics Info: {'ON' if self.show_gaze_info else 'OFF'}")
                elif key == ord('t'):  # 't' to start a new trial
                    self.start_trial()
                elif key == ord('x'):  # 'x' to end current trial
                    self.end_trial()
            else:
                # In background mode, just add a small delay and check if we should exit
                time.sleep(0.01)  # Small delay to prevent busy waiting
            
            # Output debug info to console (only occasionally to reduce console spam)
            if self.frame_count % 30 == 0:  # Update console every 30 frames (~1 second)
                fps = 0
                if len(self.frame_times) > 1:
                    fps = len(self.frame_times) / (self.frame_times[-1] - self.frame_times[0])
                
                # Get current timestamp
                timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
                
                # More concise output with timestamp
                if self.background_mode:
                    print(f"[{timestamp}] 🎯 Background Mode | FPS: {fps:.1f} | Head: {self.current_direction} | Blinks: {self.current_blink.get('count', 0)} | Frames: {self.frame_count}")
                else:
                    print(f"[{timestamp}] FPS: {fps:.1f} | Head: {self.current_direction} | Blinks: {self.current_blink.get('count', 0)} | Mode: {self.processing_frequency}x")
        
        # Session ended
        self.running = False
        self.end_time = time.time()
        
        # End any ongoing trial
        if self.current_trial_id > 0 and self.current_trial_start_time > 0:
            self.end_trial(success=True)
        
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"\n[{timestamp}] 🧹 Cleaning up resources...")
        self.cap.release()
        
        # Only destroy windows if not in background mode
        if not self.background_mode:
            cv2.destroyAllWindows()
        
        # Save final log
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] Stopping recording session...")
        print(f"[{timestamp}] 💾 Saving session data...")
        self.log_data(force=True)
        
        # Calculate session statistics
        session_duration = self.end_time - self.start_time
        minutes = session_duration / 60
        
        # Calculate final metrics for report
        # Blink variability metrics
        blink_durations = self.blink_metrics.get("blink_durations", [])
        avg_blink_duration = 0
        if len(blink_durations) > 0:
            avg_blink_duration = sum(blink_durations) * 1000 / len(blink_durations)  # Convert to ms
        
        blink_intervals = self.blink_metrics.get("blink_intervals", [])
        avg_blink_interval = 0
        if len(blink_intervals) > 0:
            avg_blink_interval = sum(blink_intervals) / len(blink_intervals)
        
        # Gaze metrics
        total_fixations = self.gaze_tracking.get("fixation_count", 0)
        avg_fixation_time = self.gaze_tracking.get("avg_fixation_time", 0)
        total_saccades = self.gaze_tracking.get("saccade_count", 0)
        screen_attention = self.gaze_tracking.get("screen_attention_ratio", 0) * 100
        
        # Print session summary
        print("\n============================================================")
        print("📋 SESSION SUMMARY")
        print("============================================================")
        print(f"Session ID: {self.session_id}")
        print(f"Duration: {session_duration:.1f} seconds ({minutes:.1f} minutes)")
        print(f"Total Frames: {self.frame_count}")
        
        print("\n👁️ BLINK METRICS")
        print(f"Total Blinks: {self.current_blink.get('count', 0)}")
        print(f"Average Blink Rate: {self.current_blink.get('rate_per_minute', 0):.1f} blinks/minute")
        print(f"Average Blink Duration: {avg_blink_duration:.1f} ms")
        print(f"Average Time Between Blinks: {avg_blink_interval:.2f} seconds")
        print(f"Blink Variability Score: {self.blink_metrics.get('variability_score', 0):.2f}")
        print(f"Blink Pattern: {'Normal' if self.blink_metrics.get('normal_pattern', True) else 'Irregular'}")
        
        print("\n👀 GAZE METRICS")
        print(f"Total Fixations: {total_fixations}")
        print(f"Average Fixation Time: {avg_fixation_time*1000:.1f} ms")
        print(f"Total Saccades (Rapid Eye Movements): {total_saccades}")
        print(f"Screen Attention: {screen_attention:.1f}%")
        print(f"Gaze Shift Events: {self.gaze_shift_count}")
        
        print("\n🧠 HEAD TRACKING METRICS")
        print(f"Head Direction: {self.current_direction}")
        print(f"Looking at Monitor: {self.looking_at_monitor}")
        print(f"Head Movement Events: {self.head_movement_count}")
        print(f"Micro Head Movements: {self.micro_movement_count}")
        
        print("\n🧩 DERIVED SIGNALS")
        # Calculate final attention score
        gaze_attention = screen_attention * 0.5  # 50% weight
        head_attention = 30 if self.current_direction == "CENTER" else 15
        blink_rate = self.current_blink.get('rate_per_minute', 0)
        blink_normalcy = 20
        if blink_rate < 10 or blink_rate > 30:
            blink_normalcy = 10
        elif blink_rate < 5 or blink_rate > 40:
            blink_normalcy = 5
        attention_score = min(100, gaze_attention + head_attention + blink_normalcy)
        print(f"Attention Score: {attention_score:.1f}/100")
        print(f"Stress Score: {0:.1f}/100 (Not calculated - facial emotions set to neutral)")
        print(f"Facial Expression: Neutral")
        
        # Print trial summary if we have trials
        if hasattr(self, 'trials_data') and len(self.trials_data) > 0:
            print("\n📋 TRIAL SUMMARY")
            print("============================================================")
            for trial in self.trials_data:
                trial_id = trial.get('trial_id', 'Unknown')
                duration = trial.get('duration_sec', 0)
                
                print(f"Trial {trial_id} ({duration:.1f}s):")
                
                # Print vision features
                vision = trial.get('vision_features', {})
                print(f"  Blinks: {vision.get('blinks', 0)}")
                print(f"  Blink Rate: {vision.get('blink_rate', 0):.1f} blinks/min")
                print(f"  Avg Blink Duration: {vision.get('avg_blink_duration', 0):.1f} ms")
                print(f"  Gaze on Screen: {vision.get('gaze_on_screen_pct', 0):.1f}%")
                print(f"  Head Direction: {vision.get('head_direction', 'Unknown')}")
                print(f"  Head Movements: {vision.get('head_movements', 0)}")
                print(f"  Attention Score: {vision.get('attention_score', 0):.1f}/100")
                
                # Print game results if available
                if 'reaction_time_ms' in trial:
                    print(f"  Reaction Time: {trial.get('reaction_time_ms', 0):.1f}ms")
                if 'correct' in trial:
                    print(f"  Correct: {trial.get('correct', False)}")
                print()
            print("============================================================")
        
        if self.frame_count > 0:
            avg_fps = self.frame_count / session_duration
            avg_processing_time = 1000 * session_duration / self.frame_count
            print(f"\nAverage FPS: {avg_fps:.1f}")
            print(f"Average Processing Time: {avg_processing_time:.1f} ms/frame")
        
        # Save final file with end timestamp
        end_timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        final_log_file = self.log_file.replace(f"_{self.session_id}", f"_{self.session_id}_{end_timestamp}")
        os.rename(self.log_file, final_log_file)
        
        print(f"\n📁 OUTPUT:")
        print(f"   Data File: {os.path.basename(final_log_file)}")
        print(f"   Format: CSV")
        print(f"   Data Points: {self.frame_count + 1}")  # +1 for header row
        
        # Export trial-based JSON data if trials were conducted
        if len(self.trials_data) > 0:
            json_file = final_log_file.replace('.csv', '_trials.json')
            session_summary = self.generate_session_summary()
            
            with open(json_file, 'w') as f:
                json.dump(session_summary, f, indent=2)
                
            print(f"   Trial Data: {os.path.basename(json_file)}")
            print(f"   Format: JSON")
            print(f"   Trials: {len(self.trials_data)}")
    
    def start_trial(self, trial_id=None, trial_type=None):
        """Start a new trial with the given ID"""
        # If no trial ID provided, increment the current one
        if trial_id is None:
            self.current_trial_id = self.current_trial_id + 1
        else:
            self.current_trial_id = trial_id
            
        self.current_trial_start_time = time.time()
        self.current_trial_frames = []
        
        print(f"🔄 Starting Trial #{self.current_trial_id}")
        return self.current_trial_id
    
    def end_trial(self, success=True, response_time_ms=None, notes=None):
        """End the current trial and record the data"""
        if self.current_trial_id == 0 or self.current_trial_start_time == 0:
            print("⚠️ No active trial to end")
            return
            
        end_time = time.time()
        trial_duration = end_time - self.current_trial_start_time
        
        # If response time not provided, use the full trial duration
        if response_time_ms is None:
            response_time_ms = trial_duration * 1000
        
        # Calculate trial metrics
        blink_count = 0
        gaze_on_screen_samples = []
        head_directions = []
        emotions = []
        attention_scores = []
        stress_scores = []
        
        for frame in self.current_trial_frames:
            if frame.get("blinks", False):
                blink_count += 1
            gaze_on_screen_samples.append(frame.get("gaze_on_screen", 0))
            head_directions.append(frame.get("head_direction", "CENTER"))
            emotions.append(frame.get("emotion", "neutral"))
            attention_scores.append(frame.get("attention_score", 0))
            stress_scores.append(frame.get("stress_score", 0))
        
        # Calculate dominant values
        avg_gaze_on_screen = sum(gaze_on_screen_samples) / max(1, len(gaze_on_screen_samples))
        
        # Count occurrences of each direction
        direction_counts = {}
        for direction in head_directions:
            direction_counts[direction] = direction_counts.get(direction, 0) + 1
        dominant_direction = max(direction_counts.items(), key=lambda x: x[1])[0] if direction_counts else "CENTER"
        
        # Count occurrences of each emotion
        emotion_counts = {}
        for emotion in emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else "neutral"
        
        # Average scores
        avg_attention = sum(attention_scores) / max(1, len(attention_scores))
        avg_stress = sum(stress_scores) / max(1, len(stress_scores))
        
        # Create trial summary
        trial_summary = {
            "trial_id": self.current_trial_id,
            "duration_ms": int(trial_duration * 1000),
            "response_time_ms": int(response_time_ms),
            "success": success,
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3],
            "vision_features": {
                "blinks": blink_count,
                "gaze_on_screen_pct": round(avg_gaze_on_screen * 100, 1),
                "head_direction": dominant_direction,
                "dominant_emotion": dominant_emotion,
                "attention_score": round(avg_attention, 1),
                "stress_score": round(avg_stress, 1)
            }
        }
        
        if notes:
            trial_summary["notes"] = notes
            
        # Add to trials data
        self.trials_data.append(trial_summary)
        
        print(f"✅ Trial #{self.current_trial_id} completed - Duration: {trial_duration:.2f}s, Success: {success}")
        
        # Reset trial tracking
        self.current_trial_id = 0
        self.current_trial_start_time = 0
        self.current_trial_frames = []
        
        return trial_summary
    
    def detect_emotion(self, landmarks):
        """Detect emotion based on facial landmarks"""
        # In a real implementation, this would analyze facial landmarks to detect emotions
        # For now, we'll just return neutral as placeholder
        return "neutral", 1.0
    
    def generate_session_summary(self):
        """Generate a comprehensive session summary in JSON format"""
        session_duration = self.end_time - self.start_time if hasattr(self, 'end_time') else time.time() - self.start_time
        
        # Get overall metrics
        session_summary = {
            "session_id": self.session_id,
            "duration_sec": int(session_duration),
            "vision_summary": {
                "blinks_total": self.current_blink.get("count", 0),
                "blink_rate_per_min": round(self.current_blink.get("rate_per_minute", 0), 1),
                "avg_blink_duration_ms": round(self.current_blink.get("avg_duration", 0), 1),
                "avg_fixation_time_ms": round(self.gaze_tracking.get("avg_fixation_time", 0) * 1000, 1),
                "screen_attention_pct": round(self.gaze_tracking.get("screen_attention_ratio", 0) * 100, 1),
                "gaze_shifts": self.gaze_shift_count,
                "head_movements": self.head_movement_count,
                "micro_head_moves": self.micro_movement_count,
                "dominant_emotion": self.current_emotion,
                "attention_score": round(self.calculate_attention_score(), 1),
                "stress_score": round(self.calculate_stress_score(), 1)
            },
            "trial_results": self.trials_data
        }
        
        return session_summary
    
    def calculate_attention_score(self):
        """Calculate overall attention score for the session"""
        # Based on: gaze on screen (50%), head stillness (30%), blink rate normalcy (20%)
        gaze_attention = self.gaze_tracking.get('screen_attention_ratio', 0) * 50
        
        # Head stillness - use current direction
        head_stillness = 30 if self.current_direction == "CENTER" else 15
        
        # Blink rate normalcy - ideal is around 15-20 blinks per minute
        blink_rate = self.current_blink.get('rate_per_minute', 0)
        blink_normalcy = 20
        if blink_rate < 10 or blink_rate > 30:  # Too few or too many blinks
            blink_normalcy = 10
        elif blink_rate < 5 or blink_rate > 40:  # Extreme cases
            blink_normalcy = 5
        
        return min(100, gaze_attention + head_stillness + blink_normalcy)
    
    def calculate_stress_score(self):
        """Calculate overall stress score for the session"""
        # For now return a placeholder value
        return 0
    
    def start_trial(self, trial_id):
        """Start tracking a new trial with the given ID"""
        self.current_trial_id = trial_id
        self.trial_start_time = time.time()
        self.is_trial_active = True
        
        # Initialize trial data with starting metrics
        self.trial_data[trial_id] = {
            "trial_id": trial_id,
            "start_time": self.trial_start_time,
            "end_time": 0,
            "duration_ms": 0,
            "blinks": 0,
            "blink_start_count": self.current_blink.get("count", 0),
            "gaze_on_screen_samples": [],
            "head_direction_samples": [],
            "head_movements": 0,
            "head_movement_start": self.head_movement_count,
            "gaze_shifts": 0,
            "gaze_shift_start": self.gaze_shift_count,
            "emotion_samples": [],
            "attention_samples": []
        }
        
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] Trial {trial_id} started")
        return True
    
    def end_trial(self, trial_id, correct=None, reaction_time_ms=None):
        """End the current trial and record final metrics"""
        if not self.is_trial_active or self.current_trial_id != trial_id:
            print(f"Error: No active trial with ID {trial_id}")
            return False
        
        end_time = time.time()
        
        # Calculate trial metrics
        trial_data = self.trial_data.get(trial_id, {})
        if trial_data:
            # Update trial data
            trial_data["end_time"] = end_time
            trial_data["duration_ms"] = int((end_time - self.trial_start_time) * 1000)
            
            # Game performance data
            if correct is not None:
                trial_data["correct"] = correct
            if reaction_time_ms is not None:
                trial_data["reaction_time_ms"] = reaction_time_ms
            
            # Vision data
            trial_data["blinks"] = self.current_blink.get("count", 0) - trial_data["blink_start_count"]
            trial_data["head_movements"] = self.head_movement_count - trial_data["head_movement_start"]
            trial_data["gaze_shifts"] = self.gaze_shift_count - trial_data["gaze_shift_start"]
            
            # Calculate averages from samples
            if trial_data["gaze_on_screen_samples"]:
                trial_data["gaze_on_screen_pct"] = int(sum(trial_data["gaze_on_screen_samples"]) / 
                                                 len(trial_data["gaze_on_screen_samples"]) * 100)
            else:
                trial_data["gaze_on_screen_pct"] = 0
                
            # Get most common head direction
            if trial_data["head_direction_samples"]:
                from collections import Counter
                direction_counts = Counter(trial_data["head_direction_samples"])
                trial_data["head_direction"] = direction_counts.most_common(1)[0][0]
            else:
                trial_data["head_direction"] = "UNKNOWN"
                
            # Get dominant emotion
            if trial_data["emotion_samples"]:
                emotion_counts = Counter(trial_data["emotion_samples"])
                trial_data["dominant_emotion"] = emotion_counts.most_common(1)[0][0]
            else:
                trial_data["dominant_emotion"] = "neutral"
                
            # Calculate average attention
            if trial_data["attention_samples"]:
                trial_data["attention_score"] = int(sum(trial_data["attention_samples"]) / 
                                              len(trial_data["attention_samples"]))
            else:
                trial_data["attention_score"] = 0
                
            # Clean up internal data structures
            for key in ["blink_start_count", "head_movement_start", "gaze_shift_start", 
                       "gaze_on_screen_samples", "head_direction_samples", 
                       "emotion_samples", "attention_samples"]:
                if key in trial_data:
                    del trial_data[key]
                    
            # Create a JSON-compatible trial result
            trial_result = {
                "trial_id": trial_id,
                "duration_sec": round((end_time - self.trial_start_time), 2),
                "vision_features": {
                    "blinks": trial_data["blinks"],
                    "blink_rate": round(trial_data["blinks"] / ((end_time - self.trial_start_time) / 60), 1) if (end_time - self.trial_start_time) > 0 else 0,
                    "avg_blink_duration": round(self.current_blink.get("avg_duration", 0), 1),
                    "gaze_on_screen_pct": trial_data["gaze_on_screen_pct"],
                    "head_direction": trial_data["head_direction"],
                    "head_movements": trial_data["head_movements"],
                    "dominant_emotion": trial_data["dominant_emotion"],
                    "attention_score": round(trial_data["attention_score"], 1)
                }
            }
            
            # Add game performance data if available
            if "correct" in trial_data:
                trial_result["correct"] = trial_data["correct"]
            if "reaction_time_ms" in trial_data:
                trial_result["reaction_time_ms"] = trial_data["reaction_time_ms"]
            
            # Store the trial result
            if not hasattr(self, 'trials_data'):
                self.trials_data = []
            self.trials_data.append(trial_result)
        
        # Reset trial state
        self.is_trial_active = False
        timestamp = datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3]
        print(f"[{timestamp}] Trial {trial_id} ended")
        return trial_result
    
    def get_trial_data(self, trial_id=None):
        """Get data for a specific trial or all trials if no ID is provided"""
        if not hasattr(self, 'trials_data'):
            return [] if trial_id is None else None
            
        if trial_id is None:
            return self.trials_data
            
        # Find the specific trial
        for trial in self.trials_data:
            if trial["trial_id"] == trial_id:
                return trial
                
        return None
    
    def update_trial_data(self):
        """Update the current trial with the latest metrics"""
        if not self.is_trial_active:
            return
            
        trial_id = self.current_trial_id
        trial_data = self.trial_data.get(trial_id)
        
        if not trial_data:
            return
            
        # Add samples
        trial_data["gaze_on_screen_samples"].append(self.looking_at_monitor)
        trial_data["head_direction_samples"].append(self.current_direction)
        trial_data["emotion_samples"].append(getattr(self, "current_emotion", "neutral"))
        trial_data["attention_samples"].append(self.calculate_attention_score())
        
        print("============================================================")
        
        print("\n🔍 ANALYZING SESSION DATA...")
        print("\n✅ Session completed successfully!")
        print("\n👋 Facial Monitoring Agent terminated")

def main():
    """Main function to run the facial monitoring agent"""
    print("DEBUG: Entered main block")
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Enhanced Facial Monitoring System')
    parser.add_argument('--session-id', type=str, help='Session ID for the monitoring session')
    parser.add_argument('--user-id', type=str, help='User ID for the monitoring session')
    parser.add_argument('--game-type', type=str, default='general', 
                        help='Type of game/task being monitored (e.g., ptsd, adhd, general)')
    parser.add_argument('--background-mode', action='store_true', 
                        help='Run in background mode without UI display')
    parser.add_argument('--duration', type=int, help='Duration of monitoring session in seconds')
    
    args = parser.parse_args()
    
    try:
        print("DEBUG: Starting agent setup")
        print("DEBUG: Creating FacialMonitoringAgent")
        
        # Create agent with parsed arguments
        agent = FacialMonitoringAgent(
            session_id=args.session_id,
            user_id=args.user_id,
            game_type=args.game_type,
            background_mode=args.background_mode
        )
        
        print("DEBUG: Running monitoring session")
        
        # Run with duration if specified
        if args.duration:
            agent.run(duration_seconds=args.duration)
        else:
            agent.run()
        
        print("DEBUG: Monitoring session finished")
        
    except Exception as e:
        print(f"❌ ERROR: An exception occurred during monitoring: {e}")
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
