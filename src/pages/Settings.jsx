import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { exportAllData, clearAllData } from '../services/firebase/firestore';
import './Settings.css';

export default function Settings() {

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

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h1>설정</h1>
      </header>

      <main className="settings-main">
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
