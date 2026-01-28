import { useState, useEffect } from 'react';
import { getTodayEmotion, getEmotions } from '../services/storage';
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

  const loadData = () => {
    const today = getTodayEmotion();
    setTodayEmotion(today);

    const all = getEmotions();
    setRecentEmotions(all.slice(0, 7));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaved = () => {
    loadData();
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

        <section className="recent-section">
          <h2>최근 7일</h2>
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
