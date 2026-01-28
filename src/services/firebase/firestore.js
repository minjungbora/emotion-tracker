import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// ==================== Emotions ====================

/**
 * 감정 저장
 * @param {string} userId - 사용자 ID
 * @param {number} score - 감정 점수 (1-5)
 * @param {string} note - 메모 (선택)
 */
export async function saveEmotion(userId, score, note = '') {
  if (!userId) throw new Error('User ID is required');

  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  // 오늘 날짜를 ID로 사용 (하루에 하나만 저장)
  const emotionRef = doc(db, 'users', userId, 'emotions', dateString);

  const emotionData = {
    score,
    date: dateString,
    timestamp: Timestamp.now(),
    note: note.trim(),
    updatedAt: Timestamp.now()
  };

  await setDoc(emotionRef, emotionData, { merge: true });

  return { id: dateString, ...emotionData };
}

/**
 * 특정 날짜의 감정 가져오기
 * @param {string} userId - 사용자 ID
 * @param {string} dateString - 날짜 (YYYY-MM-DD)
 */
export async function getEmotionByDate(userId, dateString) {
  if (!userId) throw new Error('User ID is required');

  const emotionRef = doc(db, 'users', userId, 'emotions', dateString);
  const emotionSnap = await getDoc(emotionRef);

  if (emotionSnap.exists()) {
    return { id: emotionSnap.id, ...emotionSnap.data() };
  }

  return null;
}

/**
 * 모든 감정 가져오기
 * @param {string} userId - 사용자 ID
 */
export async function getEmotions(userId) {
  if (!userId) throw new Error('User ID is required');

  const emotionsRef = collection(db, 'users', userId, 'emotions');
  const q = query(emotionsRef, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * 날짜 범위로 감정 가져오기
 * @param {string} userId - 사용자 ID
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 */
export async function getEmotionsByDateRange(userId, startDate, endDate) {
  if (!userId) throw new Error('User ID is required');

  const emotionsRef = collection(db, 'users', userId, 'emotions');
  const q = query(
    emotionsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * 감정 삭제
 * @param {string} userId - 사용자 ID
 * @param {string} emotionId - 감정 ID (날짜)
 */
export async function deleteEmotion(userId, emotionId) {
  if (!userId) throw new Error('User ID is required');

  const emotionRef = doc(db, 'users', userId, 'emotions', emotionId);
  await deleteDoc(emotionRef);
}

// ==================== Reports ====================

/**
 * 리포트 캐시 저장
 * @param {string} userId - 사용자 ID
 * @param {string} reportType - 'weekly' 또는 'monthly'
 * @param {string} periodKey - 주간: '2026-W05', 월간: '2026-01'
 * @param {object} reportData - 리포트 데이터
 */
export async function saveReportCache(userId, reportType, periodKey, reportData) {
  if (!userId) throw new Error('User ID is required');

  const reportId = `${reportType}-${periodKey}`;
  const reportRef = doc(db, 'users', userId, 'reports', reportId);

  const data = {
    type: reportType,
    periodKey,
    ...reportData,
    cachedAt: Timestamp.now()
  };

  await setDoc(reportRef, data);

  return data;
}

/**
 * 주간 리포트 캐시 가져오기
 * @param {string} userId - 사용자 ID
 * @param {string} weekKey - 주간 키 (예: '2026-W05')
 */
export async function getWeeklyReportCache(userId, weekKey) {
  if (!userId) throw new Error('User ID is required');

  const reportId = `weekly-${weekKey}`;
  const reportRef = doc(db, 'users', userId, 'reports', reportId);
  const reportSnap = await getDoc(reportRef);

  if (reportSnap.exists()) {
    return reportSnap.data();
  }

  return null;
}

/**
 * 월간 리포트 캐시 가져오기
 * @param {string} userId - 사용자 ID
 * @param {string} monthKey - 월간 키 (예: '2026-01')
 */
export async function getMonthlyReportCache(userId, monthKey) {
  if (!userId) throw new Error('User ID is required');

  const reportId = `monthly-${monthKey}`;
  const reportRef = doc(db, 'users', userId, 'reports', reportId);
  const reportSnap = await getDoc(reportRef);

  if (reportSnap.exists()) {
    return reportSnap.data();
  }

  return null;
}

// ==================== Settings ====================

/**
 * 설정 가져오기
 * @param {string} userId - 사용자 ID
 */
export async function getSettings(userId) {
  if (!userId) throw new Error('User ID is required');

  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
  const settingsSnap = await getDoc(settingsRef);

  if (settingsSnap.exists()) {
    return settingsSnap.data();
  }

  // 기본 설정 반환
  return {
    notificationsEnabled: false,
    notificationTime: '22:00',
    pushSubscription: null
  };
}

/**
 * 설정 저장
 * @param {string} userId - 사용자 ID
 * @param {object} settings - 설정 데이터
 */
export async function saveSettings(userId, settings) {
  if (!userId) throw new Error('User ID is required');

  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');

  const data = {
    ...settings,
    updatedAt: Timestamp.now()
  };

  await setDoc(settingsRef, data, { merge: true });

  return data;
}

// ==================== Data Export & Clear ====================

/**
 * 모든 데이터 내보내기
 * @param {string} userId - 사용자 ID
 */
export async function exportAllData(userId) {
  if (!userId) throw new Error('User ID is required');

  const [emotions, settings] = await Promise.all([
    getEmotions(userId),
    getSettings(userId)
  ]);

  // 리포트는 제외 (캐시된 데이터이므로)
  return {
    emotions,
    settings,
    exportedAt: new Date().toISOString()
  };
}

/**
 * 모든 데이터 삭제
 * @param {string} userId - 사용자 ID
 */
export async function clearAllData(userId) {
  if (!userId) throw new Error('User ID is required');

  // 감정 데이터 삭제
  const emotionsRef = collection(db, 'users', userId, 'emotions');
  const emotionsSnapshot = await getDocs(emotionsRef);
  const emotionDeletes = emotionsSnapshot.docs.map(doc => deleteDoc(doc.ref));

  // 리포트 캐시 삭제
  const reportsRef = collection(db, 'users', userId, 'reports');
  const reportsSnapshot = await getDocs(reportsRef);
  const reportDeletes = reportsSnapshot.docs.map(doc => deleteDoc(doc.ref));

  // 설정 삭제
  const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
  const settingsDelete = deleteDoc(settingsRef);

  await Promise.all([...emotionDeletes, ...reportDeletes, settingsDelete]);
}
