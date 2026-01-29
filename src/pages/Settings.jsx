import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { getSettings, saveSettings, exportAllData, clearAllData } from '../services/firebase/firestore';
import './Settings.css';

export default function Settings() {
  // 기본값을 먼저 표시 (로딩 시간 단축)
  const [settings, setSettings] = useState({
    notificationsEnabled: false,
    notificationTime: '22:00',
    pushSubscription: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const current = await getSettings(userId);
      setSettings(current);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!settings || !auth.currentUser) return;

    setIsSaving(true);
    try {
      const userId = auth.currentUser.uid;
      const updated = await saveSettings(userId, {
        notificationsEnabled: !settings.notificationsEnabled
      });
      setSettings(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTimeChange = async (e) => {
    if (!auth.currentUser) return;

    const newTime = e.target.value;
    try {
      const userId = auth.currentUser.uid;
      const updated = await saveSettings(userId, {
        notificationTime: newTime
      });
      setSettings(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  const handleExport = async () => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const data = await exportAllData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emotion-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('데이터 내보내기에 실패했습니다.');
    }
  };

  const handleClearData = async () => {
    if (!auth.currentUser) return;

    if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const userId = auth.currentUser.uid;
        await clearAllData(userId);
        alert('모든 데이터가 삭제되었습니다.');
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('데이터 삭제에 실패했습니다.');
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('로그아웃하시겠습니까?')) {
      try {
        await signOut(auth);
        // 로그아웃 후 자동으로 로그인 화면으로 이동 (App.jsx에서 처리)
      } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃에 실패했습니다.');
      }
    }
  };

  // 기본값을 먼저 표시하므로 로딩 화면 제거

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>설정</h1>
      </header>

      <main className="settings-main">
        <section className="settings-section">
          <h2>알림 설정</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-title">푸시 알림</div>
              <div className="settings-item-description">
                매일 설정한 시간에 알림을 받습니다
              </div>
            </div>
            <button
              className={`toggle-button ${settings.notificationsEnabled ? 'active' : ''}`}
              onClick={handleToggleNotifications}
              disabled={isSaving}
            >
              {settings.notificationsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {settings.notificationsEnabled && (
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-title">알림 시간</div>
                <div className="settings-item-description">
                  감정 기록 알림을 받을 시간을 설정하세요
                </div>
              </div>
              <input
                type="time"
                value={settings.notificationTime}
                onChange={handleTimeChange}
                className="time-input"
              />
            </div>
          )}
        </section>

        <section className="settings-section">
          <h2>데이터 관리</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-title">데이터 내보내기</div>
              <div className="settings-item-description">
                모든 감정 기록을 JSON 파일로 다운로드합니다
              </div>
            </div>
            <button className="action-button" onClick={handleExport}>
              내보내기
            </button>
          </div>

          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-title">모든 데이터 삭제</div>
              <div className="settings-item-description">
                ⚠️ 모든 감정 기록과 설정이 영구적으로 삭제됩니다
              </div>
            </div>
            <button className="action-button danger" onClick={handleClearData}>
              삭제
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>계정</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <div className="settings-item-title">로그아웃</div>
              <div className="settings-item-description">
                현재 계정에서 로그아웃합니다
              </div>
            </div>
            <button className="action-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>앱 정보</h2>
          <div className="info-item">
            <div className="info-label">버전</div>
            <div className="info-value">1.0.0</div>
          </div>
          <div className="info-item">
            <div className="info-label">개발자</div>
            <div className="info-value">최춘식</div>
          </div>
        </section>
      </main>
    </div>
  );
}
