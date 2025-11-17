# Configuration file for Mediapipe Gaze Detection System

import os

class Config:
    # File paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    ASSETS_DIR = os.path.join(BASE_DIR, 'assets')
    
    # Video settings
    CAMERA_INDEX = 0
    FRAME_WIDTH = 480  # Reduced for better performance
    FRAME_HEIGHT = 320  # Reduced for better performance
    CAPTURE_WIDTH = 640  # Camera capture width
    CAPTURE_HEIGHT = 480  # Camera capture height
    FPS_TARGET = 15  # Reduced for better performance
    
    # Mediapipe settings
    MAX_NUM_FACES = 1
    MIN_DETECTION_CONFIDENCE = 0.7  # Increased for better performance
    MIN_TRACKING_CONFIDENCE = 0.7  # Increased for better performance
    REFINE_LANDMARKS = True
    
    # Eye landmark indices for Mediapipe (468-point face mesh)
    LEFT_EYE_POINTS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    RIGHT_EYE_POINTS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
    
    # Iris landmark indices for more precise gaze tracking
    LEFT_IRIS_POINTS = [468, 469, 470, 471, 472]
    RIGHT_IRIS_POINTS = [473, 474, 475, 476, 477]
    
    # Blink detection settings
    EAR_THRESHOLD = 0.25  # Lower threshold for Mediapipe (different from dlib)
    BLINK_CONSECUTIVE_FRAMES = 3
    FOCUS_BLINK_RATE_MIN = 12  # blinks per minute minimum for focus
    FOCUS_BLINK_RATE_MAX = 20  # blinks per minute maximum for focus
    
    # Gaze detection settings
    GAZE_THRESHOLD_HORIZONTAL = 0.15  # More sensitive for Mediapipe
    GAZE_THRESHOLD_VERTICAL = 0.15
    GAZE_SMOOTHING_FACTOR = 0.7
    SCREEN_CENTER_THRESHOLD = 0.25
    SCREEN_STABILITY_THRESHOLD = 0.7
    
    # UI settings
    WINDOW_WIDTH = 800  # Reduced for better performance
    WINDOW_HEIGHT = 600  # Reduced for better performance
    VIDEO_DISPLAY_WIDTH = 480
    VIDEO_DISPLAY_HEIGHT = 320  # Reduced for better performance
    
    # Debug mode (for UIManager)
    DEBUG_MODE = False
    SHOW_LANDMARKS = True
    
    # Colors (RGB)
    COLORS = {
        'background': (240, 240, 240),
        'primary': (41, 128, 185),
        'secondary': (52, 152, 219),
        'success': (39, 174, 96),
        'warning': (241, 196, 15),
        'danger': (231, 76, 60),
        'text': (44, 62, 80),
        'text_light': (149, 165, 166)
    }
    
    # Status indicators
    STATUS_COLORS = {
        'LEFT': (231, 76, 60),     # Red
        'RIGHT': (52, 152, 219),   # Blue  
        'UP': (39, 174, 96),       # Green
        'DOWN': (241, 196, 15),    # Yellow
        'CENTER': (155, 89, 182),  # Purple
        'SCREEN': (0, 255, 0),     # Bright green
        'FOCUSED': (39, 174, 96),  # Green
        'UNFOCUSED': (231, 76, 60) # Red
    }
    
    # Calibration settings
    CALIBRATION_POINTS = 5  # Reduced from 9 for better performance
    CALIBRATION_DURATION = 2  # Reduced from 3 for better performance
    
    # Performance settings
    PERFORMANCE_BUFFER_SIZE = 20  # Reduced for much better performance
    DOWNSCALE_FACTOR = 0.4  # Process at lower resolution for speed
    SKIP_FRAMES = 2  # Process every third frame for better performance
    ENABLE_LANDMARKS_DRAWING = False  # Disabled by default for better performance
    HIGH_PERFORMANCE_FPS = 10  # Lower FPS for high performance mode
    NORMAL_PERFORMANCE_FPS = 15  # Reduced normal FPS for better stability
