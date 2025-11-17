# Enhanced Head Monitor - Project Structure

```
MINDMIRROR_PROJECT/
├── face/                           # Face monitoring system
│   ├── data/                       # Generated log files and reports
│   ├── enhanced_head_monitor.py    # Main monitoring application
│   ├── config.py                   # Configuration settings
│   ├── requirements.txt            # Python dependencies
│   ├── README.md                   # Documentation
│   ├── documentation.md            # Detailed documentation
│   ├── test_installation.py        # Installation verification
│   ├── setup.bat                   # Dependency installer (Windows)
│   ├── run_enhanced_monitor.bat    # Quick launcher (Windows)
│   └── run_enhanced_monitor.ps1    # PowerShell launcher
├── src/                            # Other project files
├── backend/                        # Backend components
└── ...                            # Other project components
```

## Quick Start Guide

1. **First Time Setup:**
   - Double-click `setup.bat` to install dependencies
   - Or run: `pip install -r requirements.txt`

2. **Verify Installation:**
   - Run: `python test_installation.py`

3. **Start Monitoring:**
   - Double-click `run_enhanced_monitor.bat`
   - Or run: `python enhanced_head_monitor.py`

## Output Files

All monitoring data is saved in the `data/` directory:
- CSV files with timestamps: `facial_monitoring_YYYYMMDD_HHMMSS.csv`
- JSON session summaries (when available)
- Visual reports (HTML format, when enabled)

## Integration with MINDMIRROR_PROJECT

This face monitoring system can be integrated with other components of the MINDMIRROR_PROJECT by:
1. Using the trial-based API for synchronization
2. Exporting data in JSON format for analysis
3. Real-time monitoring capabilities for live feedback

## For Developers

The system provides these key APIs:
- `start_trial(trial_id)` - Begin tracking a specific trial
- `end_trial(trial_id, results)` - End trial and collect metrics
- `get_session_summary()` - Get complete session data in JSON format
- `get_trial_data(trial_id)` - Get specific trial metrics
