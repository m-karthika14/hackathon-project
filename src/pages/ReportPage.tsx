import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Brain, Activity, Target, Zap, TrendingUp, Lightbulb, Heart, Sparkles, Coffee, Wind, Moon, AlertTriangle, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import { getZoneByScore, getScoreTheme } from '../utils/insightsEngine';

const ReportPage = () => {
  const navigate = useNavigate();
  const [cognitivePerformance, setCognitivePerformance] = useState(40); // Default score
  const [dynamicZone, setDynamicZone] = useState(null);
  const [scoreTheme, setScoreTheme] = useState(null);
  
  // ADHD Analysis Metrics
  const [finalAttention, setFinalAttention] = useState(40);
  const [motorControl, setMotorControl] = useState(40);
  const [cognitiveLoad, setCognitiveLoad] = useState(40);
  const [behavioralStability, setBehavioralStability] = useState(40);
  const [neuroBalance, setNeuroBalance] = useState(40);
  const [hasData, setHasData] = useState(false);

  // Fetch ALL ADHD analysis data from adhdAnalysisReport
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Try to get token first, but fallback to userId if no token
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        console.log('🔑 Auth check:', { 
          hasToken: !!token, 
          hasUserId: !!userId,
          userId: userId 
        });
        
        if (!token && !userId) {
          console.warn('❌ No token or userId found, using default scores');
          console.log('💡 TIP: Make sure you are logged in.');
          return;
        }

        // Build the request URL and headers
        let url = 'http://localhost:5000/api/auth/adhd-analysis';
        const headers: any = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('📡 Fetching with JWT token');
        } else if (userId) {
          url += `?userId=${userId}`;
          console.log('📡 Fetching with userId query parameter:', userId);
        }
        
        console.log('📡 Request URL:', url);
        
        // Fetch from adhdAnalysisReport collection
        const response = await fetch(url, { headers });

        console.log('📥 Response status:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log('📦 Received data:', data);
          
          if (data.gamesAnalyzed && data.gamesAnalyzed.length > 0) {
            const latestGame = data.gamesAnalyzed[data.gamesAnalyzed.length - 1];
            const metrics = latestGame.metrics;
            
            console.log('🎮 Latest game metrics:', metrics);
            
            // Set all metrics
            if (metrics.cognitivePerformance) setCognitivePerformance(metrics.cognitivePerformance);
            if (metrics.finalAttention) setFinalAttention(metrics.finalAttention);
            if (metrics.motorControl) setMotorControl(metrics.motorControl);
            if (metrics.cognitiveLoad) setCognitiveLoad(metrics.cognitiveLoad);
            if (metrics.behavioralStability) setBehavioralStability(metrics.behavioralStability);
            if (metrics.neuroBalance) setNeuroBalance(metrics.neuroBalance);
            
            setHasData(true);
            console.log('✅ Loaded ALL metrics from adhdAnalysisReport:', {
              cognitivePerformance: metrics.cognitivePerformance,
              finalAttention: metrics.finalAttention,
              motorControl: metrics.motorControl,
              cognitiveLoad: metrics.cognitiveLoad,
              behavioralStability: metrics.behavioralStability,
              neuroBalance: metrics.neuroBalance
            });
          } else {
            console.warn('⚠️ No games analyzed found in ADHD analysis');
            console.log('📦 Full data received:', data);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('❌ Failed to fetch ADHD analysis:', response.status, errorData);
          console.log('💡 Error details:', errorData);
        }
      } catch (error) {
        console.error('❌ Error fetching ADHD analysis:', error);
      }
    };

    fetchSessionData();
  }, []);

  // Update zone and theme when score changes
  useEffect(() => {
    const zone = getZoneByScore(cognitivePerformance);
    const theme = getScoreTheme(cognitivePerformance);
    setDynamicZone(zone);
    setScoreTheme(theme);
    console.log('📊 Zone:', zone.level, '| Score:', cognitivePerformance);
  }, [cognitivePerformance]);

  const handleBack = () => {
    navigate('/');
  };

  // Dynamic radar chart data using real ADHD analysis metrics
  const radarData = [
    { metric: 'Attention', score: Math.round(finalAttention), fullMark: 100, icon: Target, color: 'from-cyan-500 to-blue-500', textColor: 'text-cyan-400' },
    { metric: 'Motor Control', score: Math.round(motorControl), fullMark: 100, icon: Activity, color: 'from-purple-500 to-pink-500', textColor: 'text-purple-400' },
    { metric: 'Cognitive Load', score: Math.round(cognitiveLoad), fullMark: 100, icon: Brain, color: 'from-pink-500 to-rose-500', textColor: 'text-pink-400' },
    { metric: 'Behavioral Stability', score: Math.round(behavioralStability), fullMark: 100, icon: Zap, color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-400' },
    { metric: 'NeuroBalance', score: Math.round(neuroBalance), fullMark: 100, icon: TrendingUp, color: 'from-green-500 to-emerald-500', textColor: 'text-green-400' },
  ];

  // Generate 30-day trend data using cognitivePerformance
  // Shows today's score only (Day 30) - user needs to play for 30 days to see full trend
  const generate30DayTrend = () => {
    const currentScore = Math.round(cognitivePerformance);
    
    // For now, only show today's performance (Day 30)
    // As user plays more days, this will expand to show historical data
    const trendData = [
      { day: 'Today', score: currentScore, label: 'Day 30' }
    ];
    
    return trendData;
  };

  const trendData = generate30DayTrend();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Header onBack={handleBack} />
        
        {/* Radar Chart Section */}
        <div className="mt-12 bg-gray-800 rounded-2xl p-8 border border-cyan-500/20">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
            Cognitive Performance Metrics
          </h2>
          
          <div className="w-full h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="70%">
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={(props: any) => {
                    const { x, y, payload, cx, cy } = props;
                    // Calculate angle and position text further out
                    const angle = Math.atan2(y - cy, x - cx);
                    const radius = 30; // Distance from the chart
                    const offsetX = Math.cos(angle) * radius;
                    const offsetY = Math.sin(angle) * radius;
                    
                    return (
                      <text
                        x={x + offsetX}
                        y={y + offsetY}
                        textAnchor="middle"
                        fill="#9CA3AF"
                        fontSize={14}
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#06B6D4"
                  fill="#06B6D4"
                  fillOpacity={0.6}
                />
                <Legend 
                  wrapperStyle={{ color: '#9CA3AF' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {radarData.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative bg-gray-900 rounded-xl p-5 border border-gray-700 hover:border-transparent overflow-hidden group cursor-pointer"
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Metric Name */}
                  <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">{item.metric}</p>
                  
                  {/* Score */}
                  <div className="flex items-baseline gap-1">
                    <p className={`text-3xl font-bold ${item.textColor}`}>{item.score}</p>
                    <p className="text-sm text-gray-500">/ 100</p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${item.color}`}
                    />
                  </div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 30-Day Performance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 bg-gray-800 rounded-2xl p-8 border border-cyan-500/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-cyan-400">
              Performance Tracking
            </h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 font-semibold">Today's Score: {Math.round(cognitivePerformance)}</span>
            </div>
          </div>
          
          {/* Today's Score Display - Simple and Clean */}
          <div className="w-full flex items-center justify-center py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Circular Score Display */}
              <div className="relative w-64 h-64 rounded-full border-8 border-cyan-500/30 flex items-center justify-center bg-gradient-to-br from-cyan-900/30 to-blue-900/30">
                <div className="text-center">
                  <p className="text-gray-400 text-sm uppercase tracking-wide mb-2">Today's Performance</p>
                  <p className="text-7xl font-bold text-cyan-400">{Math.round(cognitivePerformance)}</p>
                  <p className="text-gray-400 text-xl">/100</p>
                  <p className="text-cyan-300 text-sm mt-3 uppercase tracking-wider">{dynamicZone?.level || 'Average'}</p>
                </div>
                
                {/* Animated Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-4 border-cyan-400"
                  style={{ borderTopWidth: '4px' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Trend Analysis */}
                    {/* Trend Analysis */}
          <div className="mt-6 p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-cyan-400 font-semibold mb-2">Start Your 30-Day Journey</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Today's cognitive performance: <span className="text-cyan-400 font-bold text-lg">{Math.round(cognitivePerformance)}/100</span>
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mt-2">
                  This is your baseline score. Play the cognitive assessment games daily to track your progress over 30 days. 
                  Your performance trend will appear here as you continue playing, showing how your cognitive abilities improve over time.
                </p>
                <p className="text-cyan-400 font-semibold text-sm mt-3">
                  🎯 Continue playing for 30 days to unlock your complete performance trend graph and detailed analytics!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Important Disclaimer Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 relative bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border-2 border-orange-500/40 overflow-hidden"
        >
          {/* Animated Warning Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 146, 60, 0.1) 10px, rgba(251, 146, 60, 0.1) 20px)'
            }}></div>
          </div>
          
          {/* Pulsing Glow */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"
          ></motion.div>

          <div className="relative z-10 flex items-start gap-4">
            {/* Warning Icon */}
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-white" />
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-orange-400 mb-4 flex items-center gap-3">
                Important Notice
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-base bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30"
                >
                  Please Read
                </motion.span>
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">
                Your pattern shows <span className="text-orange-400 font-semibold">attention-related difficulties</span> that often appear in similar behavioral conditions, and these results <span className="text-yellow-400 font-semibold">only indicate certain behavioral tendencies</span> — they <span className="text-red-400 font-bold">cannot confirm anything clinical</span>. For any medical conclusion, <span className="text-cyan-400 font-semibold">consult a licensed professional</span>.
              </p>
              <p className="text-cyan-400 font-semibold text-lg mt-4">
                Continue playing for 30 days to know more about your cognitive patterns and unlock detailed performance analytics.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Insights and Health Tips Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          
          {/* AI Insights Box */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className={`relative bg-gradient-to-br ${scoreTheme?.bg || 'from-purple-900/30 to-pink-900/30'} rounded-2xl p-6 border ${scoreTheme?.border || 'border-purple-500/30'} overflow-hidden group`}
          >
            {/* Animated Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${scoreTheme?.bg || 'from-purple-500/10 to-pink-500/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className={`absolute -top-20 -right-20 w-40 h-40 ${scoreTheme?.bg || 'bg-purple-500/10'} rounded-full blur-3xl`}
            ></motion.div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${scoreTheme?.gradient || 'from-purple-500 to-pink-500'} flex items-center justify-center`}
                >
                  <Lightbulb className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h3 className={`text-2xl font-bold bg-gradient-to-r ${scoreTheme?.gradient || 'from-purple-400 to-pink-400'} bg-clip-text text-transparent`}>
                    Powered Insights
                  </h3>
                  <p className="text-sm text-gray-400">
                    {dynamicZone?.level || 'Average'} Performance (Score: {Math.round(cognitivePerformance)}/100)
                  </p>
                </div>
              </div>

              {/* Dynamic Insight Items */}
              <div className="space-y-6">
                {dynamicZone?.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 5 }}
                    className={`flex items-center gap-5 p-6 bg-gray-900/50 rounded-xl border-2 ${scoreTheme?.border || 'border-red-500/20'} hover:border-opacity-40 transition-colors`}
                  >
                    <AlertTriangle className={`w-8 h-8 ${scoreTheme?.text || 'text-red-400'} flex-shrink-0`} />
                    <div className="flex-1">
                      <p className="text-lg text-gray-300">
                        {insight}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Health Tips Box */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="relative bg-gradient-to-br from-green-900/30 to-cyan-900/30 rounded-2xl p-6 border border-green-500/30 overflow-hidden group"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"
            ></motion.div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center"
                >
                  <Heart className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                    Health Tips
                  </h3>
                  <p className="text-sm text-gray-400">Personalized recommendations</p>
                </div>
              </div>

              {/* Dynamic Tips Items */}
              <div className="space-y-6">
                {dynamicZone?.tips.map((tip, index) => {
                  // Dynamically get the icon component
                  const IconComponent = Icons[tip.icon] || Coffee;
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-5 p-6 bg-gray-900/50 rounded-xl border-2 border-green-500/20 hover:border-green-500/40 transition-colors"
                    >
                      <IconComponent className="w-8 h-8 text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-green-400 mb-2">{tip.title}</p>
                        <p className="text-base text-gray-400">
                          {tip.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default ReportPage;
