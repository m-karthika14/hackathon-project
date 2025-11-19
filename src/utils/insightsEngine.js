/**
 * MindMirror Cognitive Insights Engine
 * 25 Zones (1-100 in blocks of 4)
 * Each zone contains 3 detailed insights + 3 detailed health tips
 * Based on cognitivePerformance score from ADHD analysis
 */

export const COGNITIVE_ZONES = [
  // ZONE 1 (1–4) – Critical Breakdown
  {
    range: [1, 4],
    level: "Critical Breakdown",
    color: "red",
    insights: [
      "Your brain is operating under extremely high strain, causing severe drops in attention and decision-making.",
      "Motor control signals show heavy instability, meaning your responses are fragmented and inconsistent.",
      "Cognitive load is overwhelming your working memory, suggesting immediate exhaustion or stress overload."
    ],
    tips: [
      { icon: "AlertTriangle", title: "Immediate Rest", text: "Stop tasks immediately and rest for 10–15 minutes to allow cognitive reset." },
      { icon: "Wind", title: "Deep Breathing", text: "Hydrate and breathe deeply (4-7-8 cycle) to stabilize neurological response." },
      { icon: "Home", title: "Calm Environment", text: "Move to a quieter, calmer environment to reduce sensory overload." }
    ]
  },

  // ZONE 2 (5–8) – Extreme Difficulty
  {
    range: [5, 8],
    level: "Extreme Difficulty",
    color: "red",
    insights: [
      "Sustaining attention is highly challenging, with focus dropping within seconds.",
      "Behavioral patterns show agitation or irregularity, indicating elevated stress.",
      "Neuro-balance signals reflect severe cognitive fatigue or distraction."
    ],
    tips: [
      { icon: "Droplet", title: "Activate Alertness", text: "Wash your face or splash cold water to activate alertness." },
      { icon: "Volume2", title: "Reduce Noise", text: "Reduce digital noise — brightness, sound, and multitasking." },
      { icon: "Apple", title: "Quick Energy", text: "Eat a light carb-rich snack for quick mental energy." }
    ]
  },

  // ZONE 3 (9–12) – Very Low Performance
  {
    range: [9, 12],
    level: "Very Low Performance",
    color: "red",
    insights: [
      "You are struggling to maintain steady focus; lapses are frequent and disruptive.",
      "Fine motor patterns show jitter, shakiness, or rushed input.",
      "Cognitive processing speed is significantly reduced due to mental tiredness."
    ],
    tips: [
      { icon: "Activity", title: "Refresh Circulation", text: "Take a 5-minute walk to refresh circulation and focus." },
      { icon: "Move", title: "Release Tension", text: "Stretch your arms and shoulders to release tension." },
      { icon: "Wind", title: "Reduce Pressure", text: "Do a 40-second slow breathing cycle to reduce cognitive pressure." }
    ]
  },

  // ZONE 4 (13–16) – Low Performance
  {
    range: [13, 16],
    level: "Low Performance",
    color: "red",
    insights: [
      "Your focus is unstable and easily interrupted by minor distractions.",
      "Emotional or behavioral fluctuations are affecting task consistency.",
      "Stress markers are slightly elevated, reducing clarity."
    ],
    tips: [
      { icon: "Eye", title: "Relax Vision", text: "Do slow blinking exercises to relax visual strain." },
      { icon: "Droplet", title: "Rehydrate", text: "Sip water slowly for rehydration." },
      { icon: "Wind", title: "Reset Breathing", text: "Take a mindful pause and reset your breathing pattern." }
    ]
  },

  // ZONE 5 (17–20) – Below Average
  {
    range: [17, 20],
    level: "Below Average",
    color: "orange",
    insights: [
      "Attention quality fluctuates, especially during longer sequences.",
      "Motor precision is inconsistent, showing hesitation or rushed input.",
      "Cognitive load is moderately high, affecting accuracy."
    ],
    tips: [
      { icon: "Anchor", title: "Grounding Exercise", text: "Try a 2-minute grounding exercise (focus on feet, breath, posture)." },
      { icon: "Move", title: "Improve Blood Flow", text: "Stretch your neck gently to improve blood flow." },
      { icon: "VolumeX", title: "Reduce Clutter", text: "Reduce background noise or visual clutter around you." }
    ]
  },

  // ZONE 6 (21–24) – Slightly Below Average
  {
    range: [21, 24],
    level: "Slightly Below Average",
    color: "orange",
    insights: [
      "Attention shows moderate slips but remains somewhat manageable.",
      "Stress levels are mildly elevated, affecting emotional balance.",
      "Motor patterns show small moments of fatigue or tension."
    ],
    tips: [
      { icon: "Droplet", title: "Mental Stability", text: "Hydrate continuously for mental stability." },
      { icon: "Focus", title: "Single-Tasking", text: "Avoid multitasking for the next 10 minutes." },
      { icon: "Wind", title: "Smooth Rhythm", text: "Use 1-minute slow breathing to smoothen cognitive rhythm." }
    ]
  },

  // ZONE 7 (25–28) – Borderline
  {
    range: [25, 28],
    level: "Borderline",
    color: "orange",
    insights: [
      "Attention is improving but still vulnerable to interruptions.",
      "Stress-induced micro-errors appear in motor movements.",
      "Cognitive rhythm fluctuates slightly but stabilizes within tasks."
    ],
    tips: [
      { icon: "Activity", title: "Reset Focus", text: "Walk for 2 minutes to reset focus." },
      { icon: "Eye", title: "Reduce Eye Fatigue", text: "Perform slow blinking sets to reduce eye fatigue." },
      { icon: "Wind", title: "Controlled Breathing", text: "Use controlled inhalation cycles (inhale 4 sec, exhale 6 sec)." }
    ]
  },

  // ZONE 8 (29–32) – Developing
  {
    range: [29, 32],
    level: "Developing",
    color: "yellow",
    insights: [
      "Moderate attention steadiness with few slips.",
      "Behavioral patterns show improved stability, though slightly tense.",
      "Motor signals indicate mild stiffness or hurried response."
    ],
    tips: [
      { icon: "User", title: "Adjust Posture", text: "Hydrate and adjust your sitting posture." },
      { icon: "Hand", title: "Relax Hands", text: "Relax hands and fingers for 20 seconds." },
      { icon: "Move", title: "Gentle Stretch", text: "Do a gentle upper-body stretch." }
    ]
  },

  // ZONE 9 (33–36) – Nearly Average
  {
    range: [33, 36],
    level: "Nearly Average",
    color: "yellow",
    insights: [
      "Attention is reaching average performance levels.",
      "Stress signals are present but controlled.",
      "Motor responses are generally stable with minor hiccups."
    ],
    tips: [
      { icon: "ArrowUp", title: "Better Oxygen Flow", text: "Straighten your spine for better oxygen flow." },
      { icon: "Sun", title: "Reduce Glare", text: "Reduce glare from screen or lights." },
      { icon: "Clock", title: "Mindful Pause", text: "Take a 30-second mindful pause." }
    ]
  },

  // ZONE 10 (37–40) – Average
  {
    range: [37, 40],
    level: "Average",
    color: "yellow",
    insights: [
      "You are functioning at healthy, stable attention levels.",
      "Motor control is consistent with expected performance.",
      "Cognitive load is manageable with minimal stress."
    ],
    tips: [
      { icon: "Droplet", title: "Maintain Pace", text: "Stay hydrated to maintain this pace." },
      { icon: "User", title: "Avoid Fatigue", text: "Maintain good posture to avoid fatigue." },
      { icon: "Clock", title: "Micro-Breaks", text: "Take micro-breaks every 20–30 minutes." }
    ]
  },

  // ZONE 11 (41–44) – Slightly Above Average
  {
    range: [41, 44],
    level: "Slightly Above Average",
    color: "lime",
    insights: [
      "Attention stability is better than typical baseline.",
      "Behavioral patterns are calm and aligned.",
      "Stress markers are low and well-regulated."
    ],
    tips: [
      { icon: "Droplet", title: "Regular Hydration", text: "Hydrate every 20 minutes." },
      { icon: "Move", title: "Light Stretching", text: "Do light stretching for flexibility." },
      { icon: "Wind", title: "Maintain Clarity", text: "Practice deep breathing to maintain clarity." }
    ]
  },

  // ZONE 12 (45–48) – Stable
  {
    range: [45, 48],
    level: "Stable",
    color: "lime",
    insights: [
      "Strong stability across all metrics with minimal noise.",
      "Motor precision is clean but slightly tight.",
      "Emotional balance is consistent."
    ],
    tips: [
      { icon: "Hand", title: "Relax Microtension", text: "Do palm/hand massages to relax microtension." },
      { icon: "Droplet", title: "Steady Hydration", text: "Keep hydration steady." },
      { icon: "Activity", title: "Improve Longevity", text: "A short 1-minute walk improves longevity." }
    ]
  },

  // ZONE 13 (49–52) – Mid Level
  {
    range: [49, 52],
    level: "Mid Level",
    color: "green",
    insights: [
      "Balanced focus across the entire task.",
      "Healthy stress levels and emotional control.",
      "Smooth and predictable motor responses."
    ],
    tips: [
      { icon: "Droplet", title: "Hydration Rhythm", text: "Continue hydration rhythm." },
      { icon: "Eye", title: "Refresh Eyes", text: "Blink slowly to refresh ocular muscles." },
      { icon: "Home", title: "Calm Environment", text: "Maintain a calm working environment." }
    ]
  },

  // ZONE 14 (53–56) – Strong
  {
    range: [53, 56],
    level: "Strong",
    color: "green",
    insights: [
      "Focus is strong and sustained without dips.",
      "Neuro signals show low stress and good balance.",
      "Motor precision is steady and smooth."
    ],
    tips: [
      { icon: "Droplet", title: "Hydration Levels", text: "Maintain hydration levels." },
      { icon: "Home", title: "Preserve Environment", text: "Preserve your calm environment." },
      { icon: "Brain", title: "Micro Meditation", text: "Insert micro meditation breaks." }
    ]
  },

  // ZONE 15 (57–60) – Good
  {
    range: [57, 60],
    level: "Good",
    color: "green",
    insights: [
      "Good attention quality with high consistency.",
      "Strong behavioral stability and emotional composure.",
      "Motor timing is sharp and accurate."
    ],
    tips: [
      { icon: "Heart", title: "Good Habits", text: "Continue good habits — hydration, posture, breaks." },
      { icon: "Move", title: "Regular Stretches", text: "Stretch shoulders every 30 minutes." },
      { icon: "Clock", title: "Avoid Strain", text: "Avoid long continuous strain." }
    ]
  },

  // ZONE 16 (61–64) – Very Good
  {
    range: [61, 64],
    level: "Very Good",
    color: "cyan",
    insights: [
      "Very strong focus and attention endurance.",
      "Emotional signals are calm and well-balanced.",
      "Cognitive load is low due to efficient processing."
    ],
    tips: [
      { icon: "Repeat", title: "Maintain Routine", text: "Maintain routine and pace." },
      { icon: "Wind", title: "Hourly Breathing", text: "Use deep breathing once an hour." },
      { icon: "User", title: "Check Posture", text: "Check posture to sustain clarity." }
    ]
  },

  // ZONE 17 (65–68) – Excellent
  {
    range: [65, 68],
    level: "Excellent",
    color: "cyan",
    insights: [
      "Excellent concentration and cognitive alignment.",
      "Minimal stress with high mental clarity.",
      "Motor actions are fluid and precise."
    ],
    tips: [
      { icon: "Droplet", title: "Stay Hydrated", text: "Stay hydrated." },
      { icon: "Repeat", title: "Consistent Patterns", text: "Maintain consistent patterns." },
      { icon: "Brain", title: "Mindfulness Breaks", text: "Insert short mindfulness breaks." }
    ]
  },

  // ZONE 18 (69–72) – High Performance
  {
    range: [69, 72],
    level: "High Performance",
    color: "blue",
    insights: [
      "Strong clarity and stable attention throughout.",
      "Motor actions show fast, coordinated timing.",
      "Stress markers are extremely low."
    ],
    tips: [
      { icon: "Repeat", title: "Maintain Rhythm", text: "Maintain your rhythm." },
      { icon: "Fish", title: "Brain Health", text: "Include omega-rich foods for brain health." },
      { icon: "Clock", title: "Avoid Burnout", text: "Ensure regular breaks to avoid burnout." }
    ]
  },

  // ZONE 19 (73–76) – Very High Performance
  {
    range: [73, 76],
    level: "Very High Performance",
    color: "blue",
    insights: [
      "Very high mental alignment with excellent response accuracy.",
      "Emotional stability is optimal.",
      "Motor precision shows high confidence."
    ],
    tips: [
      { icon: "Apple", title: "Brain-Healthy Snack", text: "Consider a brain-healthy snack." },
      { icon: "Activity", title: "Walking Sessions", text: "Spend 5 minutes walking after long work sessions." },
      { icon: "Wind", title: "Oxygen Flow", text: "Deep breathing to maintain oxygen flow." }
    ]
  },

  // ZONE 20 (77–80) – Peak Zone
  {
    range: [77, 80],
    level: "Peak Zone",
    color: "indigo",
    insights: [
      "Peak attention levels achieved.",
      "Powerful motor precision with minimal errors.",
      "Very low cognitive strain."
    ],
    tips: [
      { icon: "Moon", title: "Sustain Performance", text: "Get proper sleep to sustain this performance." },
      { icon: "Droplet", title: "Stay Hydrated", text: "Stay hydrated." },
      { icon: "Clock", title: "Micro-Breaks", text: "Take regular micro-breaks." }
    ]
  },

  // ZONE 21 (81–84) – Advanced
  {
    range: [81, 84],
    level: "Advanced",
    color: "indigo",
    insights: [
      "Superior focus and sustained mental flow.",
      "Exceptional emotional regulation.",
      "High-speed cognitive processing."
    ],
    tips: [
      { icon: "Brain", title: "Light Meditation", text: "Light meditation helps maintain this level." },
      { icon: "Droplet", title: "Avoid Overstimulation", text: "Hydrate and avoid overstimulation." },
      { icon: "Clock", title: "Prevent Overworking", text: "Avoid continuous overworking." }
    ]
  },

  // ZONE 22 (85–88) – Elite
  {
    range: [85, 88],
    level: "Elite",
    color: "purple",
    insights: [
      "Elite-level attention with near-zero distraction.",
      "Motor responses are peak human efficiency.",
      "Stress profile remains extremely low."
    ],
    tips: [
      { icon: "Fish", title: "Brain Support", text: "Include omega-3 foods for brain support." },
      { icon: "User", title: "Avoid Strain", text: "Maintain posture, avoid strain." },
      { icon: "Clock", title: "Scheduled Rest", text: "Do scheduled rest cycles." }
    ]
  },

  // ZONE 23 (89–92) – Exceptional
  {
    range: [89, 92],
    level: "Exceptional",
    color: "purple",
    insights: [
      "Exceptional precision and cognitive control.",
      "Emotional steadiness at a very high level.",
      "Motor performance is world-class."
    ],
    tips: [
      { icon: "Activity", title: "Post-Session Walk", text: "Take a 5-minute walk after long sessions." },
      { icon: "Droplet", title: "Regular Hydration", text: "Hydrate regularly." },
      { icon: "Moon", title: "Quality Sleep", text: "Ensure 7–9 hours of sleep." }
    ]
  },

  // ZONE 24 (93–96) – Pro Level
  {
    range: [93, 96],
    level: "Pro Level",
    color: "pink",
    insights: [
      "Professional-grade attention and clarity.",
      "Perfectly aligned behavior and emotional stability.",
      "Rapid, flawless motor coordination."
    ],
    tips: [
      { icon: "Clock", title: "Rest Periodically", text: "Avoid fatigue buildup — rest periodically." },
      { icon: "Apple", title: "Clean Diet", text: "Maintain clean diet for mental sharpness." },
      { icon: "Wind", title: "Stay in Zone", text: "Use breathing exercises to stay in the zone." }
    ]
  },

  // ZONE 25 (97–100) – Peak Human Performance
  {
    range: [97, 100],
    level: "Peak Human Performance",
    color: "rose",
    insights: [
      "Near-perfect cognitive functioning across all domains.",
      "World-class emotional balance and stability.",
      "Lightning-fast motor control with zero hesitation."
    ],
    tips: [
      { icon: "TrendingUp", title: "Continue Excellence", text: "Continue your routines — they are working brilliantly." },
      { icon: "Moon", title: "Maintain Peak State", text: "Ensure proper rest to maintain peak state." },
      { icon: "Brain", title: "Brain Nutrition", text: "Maintain brain nutrition (hydration + healthy fats)." }
    ]
  }
];

/**
 * Get the appropriate zone based on cognitive performance score
 * @param {number} score - Cognitive performance score (1-100)
 * @returns {object} Zone object with insights and tips
 */
export const getZoneByScore = (score) => {
  // Clamp score between 1-100
  const clampedScore = Math.max(1, Math.min(100, Math.round(score)));
  
  // Find matching zone
  const zone = COGNITIVE_ZONES.find(z => 
    clampedScore >= z.range[0] && clampedScore <= z.range[1]
  );
  
  return zone || COGNITIVE_ZONES[9]; // Default to Zone 10 (Average) if not found
};

/**
 * Get color theme based on score
 * @param {number} score - Cognitive performance score (1-100)
 * @returns {object} Color configuration
 */
export const getScoreTheme = (score) => {
  if (score <= 20) {
    return {
      primary: "red",
      border: "border-red-500/30",
      bg: "bg-red-900/20",
      text: "text-red-400",
      gradient: "from-red-500 to-rose-500"
    };
  } else if (score <= 36) {
    return {
      primary: "orange",
      border: "border-orange-500/30",
      bg: "bg-orange-900/20",
      text: "text-orange-400",
      gradient: "from-orange-500 to-amber-500"
    };
  } else if (score <= 52) {
    return {
      primary: "yellow",
      border: "border-yellow-500/30",
      bg: "bg-yellow-900/20",
      text: "text-yellow-400",
      gradient: "from-yellow-500 to-amber-500"
    };
  } else if (score <= 68) {
    return {
      primary: "green",
      border: "border-green-500/30",
      bg: "bg-green-900/20",
      text: "text-green-400",
      gradient: "from-green-500 to-emerald-500"
    };
  } else if (score <= 84) {
    return {
      primary: "cyan",
      border: "border-cyan-500/30",
      bg: "bg-cyan-900/20",
      text: "text-cyan-400",
      gradient: "from-cyan-500 to-blue-500"
    };
  } else {
    return {
      primary: "purple",
      border: "border-purple-500/30",
      bg: "bg-purple-900/20",
      text: "text-purple-400",
      gradient: "from-purple-500 to-pink-500"
    };
  }
};

export default { COGNITIVE_ZONES, getZoneByScore, getScoreTheme };
