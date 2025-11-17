# Create the CSS files for styling
dashboard_css = '''/* Dashboard.css - Main dashboard styling */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background-color: #f8fafc;
  color: #334155;
  line-height: 1.6;
}

.dashboard-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-header {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dashboard-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.dashboard-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.dashboard-sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.tab-button {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  text-align: left;
  border-left: 4px solid transparent;
}

.tab-button:hover {
  background-color: #f1f5f9;
  border-left-color: #94a3b8;
}

.tab-button.active {
  background-color: #eff6ff;
  border-left-color: #2563eb;
  color: #2563eb;
  font-weight: 600;
}

.tab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-icon {
  font-size: 1.25rem;
  margin-right: 0.75rem;
}

.tab-label {
  flex: 1;
}

.dashboard-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: #f8fafc;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.section-header {
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #64748b;
  font-size: 1rem;
}

/* Responsive design */
@media (max-width: 1024px) {
  .dashboard-layout {
    flex-direction: column;
  }
  
  .dashboard-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: 1rem;
  }
  
  .tab-button {
    min-width: 140px;
    justify-content: center;
    border-left: none;
    border-bottom: 4px solid transparent;
  }
  
  .tab-button.active {
    border-left: none;
    border-bottom-color: #2563eb;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1.5rem 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .dashboard-content {
    padding: 1rem;
  }
  
  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .tab-icon {
    font-size: 1rem;
    margin-right: 0.5rem;
  }
}'''

components_css = '''/* Components.css - Individual component styling */

/* Data Parser Styles */
.data-parser-container {
  max-width: 1200px;
}

.input-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.sample-data-btn, .parse-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.sample-data-btn {
  background-color: #10b981;
  color: white;
}

.sample-data-btn:hover {
  background-color: #059669;
  transform: translateY(-1px);
}

.parse-btn {
  background-color: #2563eb;
  color: white;
}

.parse-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
  transform: translateY(-1px);
}

.parse-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.json-input-section {
  margin-bottom: 1.5rem;
}

.json-input {
  width: 100%;
  height: 400px;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
}

.json-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.validation-status {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.validation-status.success {
  background-color: #dcfce7;
  border: 1px solid #16a34a;
  color: #166534;
}

.validation-status.error {
  background-color: #fef2f2;
  border: 1px solid #dc2626;
  color: #991b1b;
}

.success-message, .error-message {
  font-weight: 600;
}

.error-message ul {
  margin-top: 0.5rem;
  margin-left: 1.5rem;
}

.error-message li {
  margin-bottom: 0.25rem;
}

/* Metrics Calculator Styles */
.metrics-container {
  max-width: 1200px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-card.good {
  border-left-color: #10b981;
}

.metric-card.warning {
  border-left-color: #f59e0b;
}

.metric-card.poor {
  border-left-color: #ef4444;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.metric-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.status-indicator {
  font-size: 1.25rem;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.metric-formula {
  color: #64748b;
  font-size: 0.85rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: #f8fafc;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
}

.metrics-summary {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metrics-summary h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.summary-item .label {
  font-weight: 600;
  color: #475569;
}

.summary-item .value {
  font-weight: 700;
  color: #0f172a;
}

/* Domain Scores Styles */
.domain-scores-container {
  max-width: 1000px;
}

.domain-scores-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.domain-score-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.domain-score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.domain-score-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.domain-score-value {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  background-color: #f1f5f9;
  color: #0f172a;
}

.progress-bar-container {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background-color: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 6px;
}

.progress-fill.excellent {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-fill.good {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.progress-fill.moderate {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-fill.poor {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.domain-formula {
  color: #64748b;
  font-size: 0.85rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: #f8fafc;
  padding: 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 0.75rem;
}

.domain-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.input-tag {
  background-color: #eff6ff;
  color: #1d4ed8;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Risk Assessment Styles */
.risk-assessment-container {
  max-width: 1200px;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.risk-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-top: 4px solid #e2e8f0;
}

.risk-card.low {
  border-top-color: #10b981;
}

.risk-card.moderate {
  border-top-color: #f59e0b;
}

.risk-card.high {
  border-top-color: #ef4444;
}

.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.risk-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
}

.risk-level {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.risk-level.low {
  background-color: #dcfce7;
  color: #166534;
}

.risk-level.moderate {
  background-color: #fef3c7;
  color: #92400e;
}

.risk-level.high {
  background-color: #fef2f2;
  color: #991b1b;
}

.confidence-bar {
  margin: 1rem 0;
}

.confidence-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.confidence-progress {
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  transition: width 0.3s ease;
}

.evidence-list {
  list-style: none;
}

.evidence-item {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.evidence-path {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  color: #6366f1;
  font-weight: 600;
}

.evidence-value {
  font-weight: 700;
  color: #0f172a;
  margin: 0.25rem 0;
}

.evidence-why {
  color: #64748b;
  font-size: 0.9rem;
}

/* Report Generator Styles */
.report-generator-container {
  max-width: 1200px;
}

.report-tabs {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 2rem;
}

.report-tab {
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.report-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.report-tab:hover {
  color: #1e293b;
}

.report-content {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

.json-report {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  overflow-x: auto;
  white-space: pre-wrap;
}

.human-report {
  line-height: 1.7;
  color: #374151;
}

.human-report h3 {
  color: #1e293b;
  font-size: 1.3rem;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
}

.human-report h3:first-child {
  margin-top: 0;
}

.human-report p {
  margin-bottom: 1rem;
}

.human-report ul {
  margin: 1rem 0 1rem 1.5rem;
}

.human-report li {
  margin-bottom: 0.5rem;
}

.export-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.export-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-json {
  background-color: #6366f1;
  color: white;
}

.export-json:hover {
  background-color: #5b21b6;
  transform: translateY(-1px);
}

.export-pdf {
  background-color: #dc2626;
  color: white;
}

.export-pdf:hover {
  background-color: #b91c1c;
  transform: translateY(-1px);
}

.print-btn {
  background-color: #64748b;
  color: white;
}

.print-btn:hover {
  background-color: #475569;
  transform: translateY(-1px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .risk-grid {
    grid-template-columns: 1fr;
  }
  
  .input-controls {
    flex-direction: column;
  }
  
  .sample-data-btn, .parse-btn {
    width: 100%;
  }
  
  .export-controls {
    flex-direction: column;
  }
  
  .export-btn {
    width: 100%;
    justify-content: center;
  }
  
  .report-tabs {
    flex-wrap: wrap;
  }
  
  .report-tab {
    flex: 1;
    min-width: 120px;
  }
}'''

print("CSS FILES CREATED:")
print("=" * 50)
print("Dashboard.css content length:", len(dashboard_css))
print("Components.css content length:", len(components_css))
print("\nThese files provide comprehensive styling for:")
print("- Responsive dashboard layout")
print("- Professional medical interface")
print("- Interactive components")
print("- Progress bars and status indicators")
print("- Mobile-friendly design")
print("=" * 50)