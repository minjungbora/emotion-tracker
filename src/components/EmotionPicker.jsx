import { useState } from 'react';
import { saveEmotion } from '../services/firebase/firestore';
import { auth } from '../services/firebase/config';
import './EmotionPicker.css';

const EMOTION_LABELS = {
  1: '매우 아쉬웠어요',
  2: '아쉬웠어요',
  3: '그저 그랬어요',
  4: '만족했어요',
  5: '매우 만족했어요'
};

const EMOTION_EMOJIS = {
  1: '😢',
  2: '😕',
  3: '😐',
  4: '😊',
  5: '😄'
};

export default function EmotionPicker({ initialEmotion, onSaved }) {
  const [selectedScore, setSelectedScore] = useState(initialEmotion?.score || null);
  const [note, setNote] = useState(initialEmotion?.note || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedScore) {
      alert('감정을 선택해주세요.');
      return;
    }

    if (!auth.currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      const userId = auth.currentUser.uid;
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      // 로컬 저장 객체 생성
      const emotionData = {
        id: dateString,
        score: selectedScore,
        date: dateString,
        timestamp: Date.now(),
        note: note.trim()
      };

      // 즉시 로컬스토리지에 저장 (폴백용)
      const localKey = `emotion_${userId}_${dateString}`;
      localStorage.setItem(localKey, JSON.stringify(emotionData));

      // 즉시 UI 업데이트
      if (onSaved) {
        onSaved(emotionData);
      }
      setIsSaving(false);

      // 백그라운드에서 Firebase에 저장 시도 (2초 타임아웃)
      try {
        await Promise.race([
          saveEmotion(userId, selectedScore, note),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]);
        console.log('Firebase sync success');
      } catch (syncError) {
        console.log('Firebase sync failed (saved locally):', syncError.message);
        // 실패해도 로컬에 이미 저장되어 있으므로 괜찮음
      }
    } catch (error) {
      console.error('Error saving emotion:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
      setIsSaving(false);
    }
  };

  return (
    <div className="emotion-picker">
      <h2 className="emotion-picker-title">오늘 하루는 얼마나 만족스러웠나요?</h2>

      <div className="emotion-scale">
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            className={`emotion-button ${selectedScore === score ? 'selected' : ''}`}
            onClick={() => setSelectedScore(score)}
            disabled={isSaving}
          >
            <div className="emotion-emoji">{EMOTION_EMOJIS[score]}</div>
            <div className="emotion-score">{score}</div>
            <div className="emotion-label">{EMOTION_LABELS[score]}</div>
          </button>
        ))}
      </div>

      <div className="emotion-note">
        <label htmlFor="note">오늘 하루에 대해 더 기록하고 싶으신가요? (선택사항)</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="오늘 있었던 일이나 느낌을 자유롭게 적어보세요..."
          rows={4}
          disabled={isSaving}
          maxLength={500}
        />
        <div className="note-counter">{note.length} / 500</div>
      </div>

      <button
        className="save-button"
        onClick={handleSave}
        disabled={!selectedScore || isSaving}
      >
        {isSaving ? '저장 중...' : initialEmotion ? '수정하기' : '기록하기'}
      </button>
    </div>
  );
}
