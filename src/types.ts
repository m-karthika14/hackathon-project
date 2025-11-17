export interface AIInsight {
  jsonReport: object;
  textReport: string;
}

export interface Report {
  _id: string;
  userId: string;
  gameType: string;
  scores: {
    motorControl?: number;
    cognitiveLoad?: number;
    stressManagement?: number;
    behavioralStability?: number;
    neuroBalance?: number;
    accuracy?: number;
    speed?: number;
    consistency?: number;
    flexibility?: number;
    memory?: number;
  };
  performanceLog: any[];
  gameMetrics: any;
  summary?: any[];
  aiAnalysis?: string;
  createdAt: string;
  aiJsonReport?: object;
  aiTextReport?: string;
  sessionData?: any; // For compatibility with older schema
  sessionId?: string; // For compatibility with older schema
}
