import { useState, useEffect } from 'react';
import { getEmotionByDate, getEmotions } from '../services/firebase/firestore';
import { auth } from '../services/firebase/config';
import EmotionPicker from '../components/EmotionPicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import './Home.css';

const EMOTION_EMOJIS = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '😄'
};

const EMOTION_LABELS = {
  1: '매우 아쉬웠어요',
  2: '아쉬웠어요',
  3: '그저 그랬어요',
  4: '만족했어요',
  5: '매우 만족했어요'
};

export default function Home() {
  const [todayEmotion, setTodayEmotion] = useState(null);
  const [recentEmotions, setRecentEmotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Auth 상태만 확인하고 데이터는 로드하지 않음
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);

      // 인증 완료되면 빠르게 오늘 데이터만 시도
      if (user) {
        loadTodayData(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadTodayData = async (userId) => {
    try {
      const todayString = new Date().toISOString().split('T')[0];

      // 2초 타임아웃으로 오늘 데이터만 시도
      const today = await Promise.race([
        getEmotionByDate(userId, todayString),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]);

      if (today) {
        setTodayEmotion(today);
      }
    } catch (error) {
      // 실패해도 조용히 무시 - 빈 화면 표시
      console.log('Failed to load today data:', error.message);
    }
  };

  const handleSaved = (savedEmotion) => {
    // 서버에서 다시 가져오지 않고 로컬 state만 업데이트
    setTodayEmotion(savedEmotion);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>감정 추적</h1>
        <p className="today-date">{format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}</p>
      </header>

      <main className="home-main">
        <section className="today-section">
          {todayEmotion ? (
            <div className="today-recorded">
              <div className="recorded-badge">✅ 오늘 기록 완료</div>
              <div className="recorded-emotion">
                <span className="recorded-emoji">{EMOTION_EMOJIS[todayEmotion.score]}</span>
                <div className="recorded-details">
                  <div className="recorded-score">{todayEmotion.score}점</div>
                  <div className="recorded-label">{EMOTION_LABELS[todayEmotion.score]}</div>
                </div>
              </div>
              {todayEmotion.note && (
                <div className="recorded-note">
                  <p>"{todayEmotion.note}"</p>
                </div>
              )}
              <button
                className="edit-button"
                onClick={() => setTodayEmotion(null)}
              >
                다시 기록하기
              </button>
            </div>
          ) : (
            <EmotionPicker onSaved={handleSaved} />
          )}
        </section>

      </main>
    </div>
  );
}
