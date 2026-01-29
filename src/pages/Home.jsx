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

  useEffect(() => {
    // Firebase Auth 상태 변화를 기다림
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userId = user.uid;
        const todayString = new Date().toISOString().split('T')[0];

        // 오늘 데이터만 먼저 빠르게 로드
        const today = await Promise.race([
          getEmotionByDate(userId, todayString),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);

        setTodayEmotion(today);
        setLoading(false);

        // 최근 데이터는 백그라운드에서 로드 (3개로 제한)
        try {
          const recent = await Promise.race([
            getEmotions(userId, 3),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]);
          setRecentEmotions(recent);
        } catch (bgError) {
          console.log('Background loading failed:', bgError);
          // 실패해도 괜찮음 - 오늘 데이터는 이미 보여줌
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
        // 에러 발생 시 빈 상태로 표시
        setTodayEmotion(null);
        setRecentEmotions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaved = (savedEmotion) => {
    // 서버에서 다시 가져오지 않고 로컬 state만 업데이트
    setTodayEmotion(savedEmotion);

    // 최근 리스트 업데이트 (오늘 데이터 추가/갱신)
    setRecentEmotions(prev => {
      const filtered = prev.filter(e => e.date !== savedEmotion.date);
      return [savedEmotion, ...filtered].slice(0, 3);
    });
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

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

        <section className="recent-section">
          <h2>최근 3일</h2>
          {recentEmotions.length === 0 ? (
            <div className="empty-state">
              <p>아직 감정 기록이 없습니다.</p>
              <p>오늘부터 하루하루의 감정을 기록해보세요!</p>
            </div>
          ) : (
            <div className="recent-list">
              {recentEmotions.map(emotion => (
                <div key={emotion.id} className="recent-item">
                  <div className="recent-date">
                    {format(new Date(emotion.date), 'M월 d일 (EEE)', { locale: ko })}
                  </div>
                  <div className="recent-emotion">
                    <span className="recent-emoji">{EMOTION_EMOJIS[emotion.score]}</span>
                    <div className="recent-info">
                      <div className="recent-score">{emotion.score}점</div>
                      <div className="recent-label">{EMOTION_LABELS[emotion.score]}</div>
                    </div>
                  </div>
                  {emotion.note && (
                    <div className="recent-note">{emotion.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
