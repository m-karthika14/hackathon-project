# Comprehensive Facial Monitoring System

## 🎭 Features

This advanced facial monitoring system combines multiple computer vision techniques to track and analyze facial features in real-time.

### Enhanced Features:

✅ **Eye Gaze Tracking** - Accurately tracks where you're looking on screen  
✅ **Blink Detection** - Improved sensitivity with enhanced visual feedback  
✅ **Screen Attention** - Combines gaze direction and head position for accurate attention tracking  
✅ **Head Pose Tracking** - Tracks yaw, pitch, and roll angles of head movement  
✅ **Eyebrow Raising Detection** - Monitors eyebrow position for raised eyebrows  
✅ **Emotion Analysis** - Detects primary emotional state from facial expressions  

## 🚀 Getting Started

### Prerequisites

Make sure you have Python 3.7+ installed along with the required dependencies:

```bash
pip install -r requirements.txt
```

### Running the Application

#### Windows:

Double-click the `run_face_monitor.bat` file or run:

```bash
python comprehensive_monitor.py
```

## 🎮 Controls

- **ESC** - Exit the application
- **R** - Reset statistics
- **C** - Calibrate
- **S** - Toggle facial landmarks display
- **D** - Toggle debug mode

## 📊 Data Logging

All facial monitoring data is automatically logged to CSV files in the `data/` directory with timestamps for later analysis.

## 💡 Visual Indicators

- **Screen Attention**: Shows whether you're looking at the screen (combines gaze direction and head position)
- **Gaze Direction**: Visual indicator shows where you're looking
- **Blink Counter**: Counts and displays blink frequency
- **Head Pose**: Shows head orientation with 3D axis indicators
- **Eyebrow Status**: Indicates when eyebrows are raised

## ⚙️ Configuration

Settings can be adjusted in the `config.py` file:

- Camera selection
- Blink detection sensitivity
- Display options
- Data logging frequency

## 📝 Troubleshooting

If the camera doesn't initialize:
1. Make sure your webcam is connected and working
2. Try changing the camera index in the configuration
3. Check if another application is using the camera

## 🔄 Performance Considerations

For optimal performance:
- Use in well-lit environments
- Face the camera directly during calibration
- Maintain reasonable distance from camera (40-80cm)
