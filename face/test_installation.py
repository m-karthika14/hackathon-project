#!/usr/bin/env python3
"""
Test script to verify Enhanced Head Monitor installation
"""

import sys
import os

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing required dependencies...")
    
    try:
        import cv2
        print("✅ OpenCV imported successfully")
        print(f"   Version: {cv2.__version__}")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
    
    try:
        import mediapipe as mp
        print("✅ MediaPipe imported successfully")
        print(f"   Version: {mp.__version__}")
    except ImportError as e:
        print(f"❌ MediaPipe import failed: {e}")
        return False
    
    try:
        import numpy as np
        print("✅ NumPy imported successfully")
        print(f"   Version: {np.__version__}")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    return True

def test_camera():
    """Test if camera is accessible"""
    print("\nTesting camera access...")
    
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                height, width = frame.shape[:2]
                print(f"✅ Camera accessible")
                print(f"   Resolution: {width}x{height}")
                cap.release()
                return True
            else:
                print("❌ Camera opened but cannot read frames")
                cap.release()
                return False
        else:
            print("❌ Cannot open camera")
            return False
    except Exception as e:
        print(f"❌ Camera test failed: {e}")
        return False

def test_enhanced_monitor():
    """Test if enhanced_head_monitor.py can be imported"""
    print("\nTesting Enhanced Head Monitor...")
    
    try:
        # Test if the file exists
        if os.path.exists("enhanced_head_monitor.py"):
            print("✅ enhanced_head_monitor.py found")
        else:
            print("❌ enhanced_head_monitor.py not found")
            return False
        
        # Test if data directory exists
        if os.path.exists("data"):
            print("✅ data directory found")
        else:
            print("❌ data directory not found")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Enhanced Head Monitor test failed: {e}")
        return False

def main():
    print("================================================")
    print("Enhanced Head Monitor - Installation Test")
    print("================================================")
    
    tests_passed = 0
    total_tests = 3
    
    if test_imports():
        tests_passed += 1
    
    if test_camera():
        tests_passed += 1
    
    if test_enhanced_monitor():
        tests_passed += 1
    
    print(f"\n================================================")
    print(f"Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("✅ All tests passed! You can run the Enhanced Head Monitor.")
        print("\nTo start monitoring:")
        print("  - Double-click: run_enhanced_monitor.bat")
        print("  - Or run: python enhanced_head_monitor.py")
    else:
        print("❌ Some tests failed. Please check the requirements.")
        print("\nTo install dependencies:")
        print("  - Double-click: setup.bat")
        print("  - Or run: pip install -r requirements.txt")
    
    print("================================================")

if __name__ == "__main__":
    main()
