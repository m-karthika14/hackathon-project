const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FaceMonitorService {
    constructor() {
        this.isRunning = false;
        this.pythonProcess = null;
        this.currentSessionId = null;
        this.facePath = path.join(__dirname, '../../face');
        this.logFile = path.join(this.facePath, 'data', 'current_session.log');
    }

    async startMonitoring(userId, gameType = 'general') {
        console.log('🎥 Starting face monitoring for user:', userId);
        
        try {
            if (this.isRunning) {
                console.log('⚠️  Face monitoring already running');
                return { success: false, message: 'Face monitoring already active' };
            }

            // Ensure data directory exists
            const dataDir = path.join(this.facePath, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Generate session ID
            this.currentSessionId = `session_${userId}_${Date.now()}`;
            
            // Start Python face monitoring process
            const pythonScript = path.join(this.facePath, 'enhanced_head_monitor.py');
            
            console.log('🚀 Spawning Python process:', pythonScript);
            console.log('📁 Working directory:', this.facePath);
            
            // Start the Python process with arguments
            this.pythonProcess = spawn('python', [
                pythonScript,
                '--session-id', this.currentSessionId,
                '--user-id', userId,
                '--game-type', gameType,
                '--background-mode'
            ], {
                cwd: this.facePath,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Handle process events
            this.pythonProcess.stdout.on('data', (data) => {
                console.log('🎥 Face Monitor:', data.toString().trim());
            });

            this.pythonProcess.stderr.on('data', (data) => {
                console.error('❌ Face Monitor Error:', data.toString().trim());
            });

            this.pythonProcess.on('close', (code) => {
                console.log(`🎥 Face monitor process exited with code ${code}`);
                this.isRunning = false;
                this.pythonProcess = null;
            });

            this.pythonProcess.on('error', (error) => {
                console.error('❌ Failed to start face monitor:', error);
                this.isRunning = false;
                this.pythonProcess = null;
            });

            // Give the process time to start
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (this.pythonProcess && !this.pythonProcess.killed) {
                this.isRunning = true;
                console.log('✅ Face monitoring started successfully');
                return { 
                    success: true, 
                    sessionId: this.currentSessionId,
                    message: 'Face monitoring started in background'
                };
            } else {
                throw new Error('Python process failed to start or was killed');
            }

        } catch (error) {
            console.error('❌ Error starting face monitoring:', error);
            this.isRunning = false;
            return { success: false, message: error.message };
        }
    }

    async stopMonitoring() {
        console.log('🛑 Stopping face monitoring...');
        
        try {
            if (!this.isRunning || !this.pythonProcess) {
                console.log('⚠️  Face monitoring is not running');
                return { success: false, message: 'Face monitoring is not active' };
            }

            // Gracefully terminate the Python process
            this.pythonProcess.kill('SIGTERM');
            
            // Wait for process to close
            await new Promise(resolve => {
                if (this.pythonProcess) {
                    this.pythonProcess.on('close', resolve);
                    // Force kill after 5 seconds if it doesn't close gracefully
                    setTimeout(() => {
                        if (this.pythonProcess && !this.pythonProcess.killed) {
                            this.pythonProcess.kill('SIGKILL');
                        }
                        resolve();
                    }, 5000);
                } else {
                    resolve();
                }
            });

            this.isRunning = false;
            this.pythonProcess = null;
            
            console.log('✅ Face monitoring stopped successfully');
            return { success: true, message: 'Face monitoring stopped' };

        } catch (error) {
            console.error('❌ Error stopping face monitoring:', error);
            return { success: false, message: error.message };
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            sessionId: this.currentSessionId,
            processId: this.pythonProcess ? this.pythonProcess.pid : null
        };
    }

    async getSessionData(sessionId) {
        try {
            const dataDir = path.join(this.facePath, 'data');
            const sessionFiles = fs.readdirSync(dataDir)
                .filter(file => file.includes(sessionId) && file.endsWith('.csv'));

            if (sessionFiles.length === 0) {
                return { success: false, message: 'No session data found' };
            }

            // Read the most recent session file
            const latestFile = sessionFiles[sessionFiles.length - 1];
            const filePath = path.join(dataDir, latestFile);
            const csvContent = fs.readFileSync(filePath, 'utf8');

            return {
                success: true,
                sessionId: sessionId,
                filename: latestFile,
                data: csvContent
            };

        } catch (error) {
            console.error('❌ Error reading session data:', error);
            return { success: false, message: error.message };
        }
    }
}

// Singleton instance
const faceMonitorService = new FaceMonitorService();

module.exports = faceMonitorService;
