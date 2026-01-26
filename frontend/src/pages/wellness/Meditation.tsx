import React, { useState, useEffect } from 'react';
import './Meditation.css';

const MEDITATION_SESSIONS = [
  {
    id: 1,
    title: 'تأمل الصباح',
    type: 'breathing',
    duration: '5 دقائق',
    description: 'ابدأي يومك بهدوء وتركيز',
    benefits: ['يزيد الطاقة', 'يحسن التركيز', 'يقلل التوتر'],
    icon: '🌅',
    color: '#4299e1'
  },
  {
    id: 2,
    title: 'تنفس عميق',
    type: 'breathing',
    duration: '3 دقائق',
    description: 'تقنية تنفس بسيطة لتهدئة الأعصاب',
    benefits: ['يهدئ القلق', 'يخفض ضغط الدم', 'يحسن الأكسجين'],
    icon: '🌬️',
    color: '#48bb78'
  },
  {
    id: 3,
    title: 'استرخاء الجسم',
    type: 'body_scan',
    duration: '10 دقائق',
    description: 'مسح شامل للجسم للتخلص من التوتر',
    benefits: ['يريح العضلات', 'يقلل الألم', 'يحسن النوم'],
    icon: '🧘‍♀️',
    color: '#9f7aea'
  },
  {
    id: 4,
    title: 'تأمل الامتنان',
    type: 'gratitude',
    duration: '7 دقائق',
    description: 'ركزي على الأشياء الإيجابية في حياتك',
    benefits: ['يحسن المزاج', 'يزيد السعادة', 'يقلل الاكتئاب'],
    icon: '💝',
    color: '#ed64a6'
  },
  {
    id: 5,
    title: 'تأمل النوم',
    type: 'sleep',
    duration: '15 دقيقة',
    description: 'استعدي لنوم عميق ومريح',
    benefits: ['يحسن النوم', 'يقلل الأرق', 'يريح العقل'],
    icon: '🌙',
    color: '#667eea'
  },
  {
    id: 6,
    title: 'تأكيدات إيجابية',
    type: 'affirmations',
    duration: '5 دقائق',
    description: 'كلمات قوية لتعزيز الثقة بالنفس',
    benefits: ['يعزز الثقة', 'يحسن الصورة الذاتية', 'يقوي العزيمة'],
    icon: '✨',
    color: '#f6ad55'
  },
  {
    id: 7,
    title: 'تأمل الشفاء',
    type: 'healing',
    duration: '12 دقيقة',
    description: 'تصور شفاء جسمك وتعافيه',
    benefits: ['يعزز الشفاء', 'يقلل الألم', 'يحسن المناعة'],
    icon: '💚',
    color: '#38b2ac'
  },
  {
    id: 8,
    title: 'تأمل السلام الداخلي',
    type: 'peace',
    duration: '8 دقائق',
    description: 'اعثري على هدوء عميق بداخلك',
    benefits: ['يجلب السلام', 'يقلل القلق', 'يوازن المشاعر'],
    icon: '☮️',
    color: '#805ad5'
  }
];

const Meditation = () => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completedSessions, setCompletedSessions] = useState([]);

  useEffect(() => {
    loadCompletedSessions();
  }, []);

  useEffect(() => {
    let timer;
    if (isPlaying && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeRemaining]);

  const loadCompletedSessions = () => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`meditation_${today}`);
    if (saved) {
      setCompletedSessions(JSON.parse(saved));
    }
  };

  const handleSessionComplete = () => {
    if (selectedSession && !completedSessions.includes(selectedSession.id)) {
      const updated = [...completedSessions, selectedSession.id];
      setCompletedSessions(updated);
      
      const today = new Date().toDateString();
      localStorage.setItem(`meditation_${today}`, JSON.stringify(updated));
    }
  };

  const startSession = (session) => {
    setSelectedSession(session);
    const minutes = parseInt(session.duration);
    setTimeRemaining(minutes * 60);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const stopSession = () => {
    setIsPlaying(false);
    setSelectedSession(null);
    setTimeRemaining(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="meditation-page">
      <div className="meditation-header">
        <button onClick={() => window.history.back()} className="back-btn">←</button>
        <h1>🧘‍♀️ التأمل والاسترخاء</h1>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="meditation-content">
        {/* Stats */}
        <div className="meditation-stats">
          <div className="stat-card">
            <span className="stat-icon">🎯</span>
            <div>
              <p>جلسات اليوم</p>
              <h3>{completedSessions.length}</h3>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <div>
              <p>وقت التأمل</p>
              <h3>{completedSessions.length * 7} دقيقة</h3>
            </div>
          </div>
        </div>

        {/* Active Session Player */}
        {selectedSession && (
          <div className="meditation-player">
            <div className="player-visual">
              <div className={`breathing-circle ${isPlaying ? 'breathing' : ''}`}>
                <div className="inner-circle"></div>
              </div>
            </div>
            
            <h2>{selectedSession.title}</h2>
            <p className="session-desc">{selectedSession.description}</p>
            
            <div className="timer-display">
              {formatTime(timeRemaining)}
            </div>

            <div className="player-controls">
              <button onClick={stopSession} className="control-btn stop">
                ⏹️ إيقاف
              </button>
              <button onClick={togglePlayPause} className="control-btn play">
                {isPlaying ? '⏸️ إيقاف مؤقت' : '▶️ تشغيل'}
              </button>
            </div>

            <div className="session-benefits">
              <h4>فوائد هذه الجلسة:</h4>
              <div className="benefits-tags">
                {selectedSession.benefits.map((benefit, i) => (
                  <span key={i} className="benefit-tag">✓ {benefit}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        {!selectedSession && (
          <div className="sessions-grid">
            {MEDITATION_SESSIONS.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                isCompleted={completedSessions.includes(session.id)}
                onStart={() => startSession(session)}
              />
            ))}
          </div>
        )}

        {/* Quick Tips */}
        <MeditationTips />
      </div>
    </div>
  );
};

const SessionCard = ({ session, isCompleted, onStart }) => (
  <div className="session-card" style={{ borderTopColor: session.color }}>
    {isCompleted && <div className="completed-badge">✓ مكتملة</div>}
    
    <div className="session-icon" style={{ color: session.color }}>
      {session.icon}
    </div>
    
    <h3>{session.title}</h3>
    <p className="session-duration">⏱️ {session.duration}</p>
    <p className="session-description">{session.description}</p>
    
    <div className="session-benefits-list">
      {session.benefits.slice(0, 2).map((benefit, i) => (
        <span key={i} className="mini-benefit">• {benefit}</span>
      ))}
    </div>

    <button 
      onClick={onStart} 
      className="start-session-btn"
      style={{ backgroundColor: session.color }}
    >
      ابدأ الجلسة
    </button>
  </div>
);

const MeditationTips = () => (
  <div className="meditation-tips">
    <h3>💡 نصائح للتأمل الفعال</h3>
    <div className="tips-grid">
      <div className="tip-item">
        <span className="tip-icon">🪑</span>
        <p>اجلسي في مكان هادئ ومريح</p>
      </div>
      <div className="tip-item">
        <span className="tip-icon">🔇</span>
        <p>أغلقي جميع مصادر التشتت</p>
      </div>
      <div className="tip-item">
        <span className="tip-icon">⏰</span>
        <p>اختاري وقتاً ثابتاً يومياً</p>
      </div>
      <div className="tip-item">
        <span className="tip-icon">🌬️</span>
        <p>ركزي على تنفسك الطبيعي</p>
      </div>
    </div>
  </div>
);

export default Meditation;
