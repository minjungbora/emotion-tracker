// 로컬 스토리지 키
const EMOTIONS_KEY = 'emotions';
const SETTINGS_KEY = 'settings';
const REPORTS_KEY = 'reports';

// UUID 생성 함수
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ===== 감정 데이터 관리 =====

/**
 * 감정 저장
 * @param {number} score - 감정 점수 (1-5)
 * @param {string} note - 메모 (선택사항)
 * @returns {object} 저장된 감정 객체
 */
export function saveEmotion(score, note = '') {
  const emotions = getEmotions();
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // 오늘 이미 기록이 있는지 확인
  const existingIndex = emotions.findIndex(e => e.date === dateString);

  const emotion = {
    id: existingIndex >= 0 ? emotions[existingIndex].id : generateId(),
    score,
    date: dateString,
    timestamp: Date.now(),
    note: note.trim()
  };

  if (existingIndex >= 0) {
    // 기존 기록 업데이트
    emotions[existingIndex] = emotion;
  } else {
    // 새 기록 추가
    emotions.push(emotion);
  }

  // 날짜 순으로 정렬 (최신순)
  emotions.sort((a, b) => new Date(b.date) - new Date(a.date));

  localStorage.setItem(EMOTIONS_KEY, JSON.stringify(emotions));
  return emotion;
}

/**
 * 모든 감정 데이터 가져오기
 * @returns {Array} 감정 배열
 */
export function getEmotions() {
  const data = localStorage.getItem(EMOTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * 특정 날짜의 감정 가져오기
 * @param {Date|string} date - 날짜
 * @returns {object|null} 감정 객체 또는 null
 */
export function getEmotionByDate(date) {
  const dateString = typeof date === 'string'
    ? date
    : date.toISOString().split('T')[0];

  const emotions = getEmotions();
  return emotions.find(e => e.date === dateString) || null;
}

/**
 * 날짜 범위로 감정 데이터 가져오기
 * @param {Date} startDate - 시작 날짜
 * @param {Date} endDate - 종료 날짜
 * @returns {Array} 감정 배열
 */
export function getEmotionsByDateRange(startDate, endDate) {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  const emotions = getEmotions();
  return emotions.filter(e => e.date >= start && e.date <= end);
}

/**
 * 감정 삭제
 * @param {string} id - 감정 ID
 */
export function deleteEmotion(id) {
  const emotions = getEmotions();
  const filtered = emotions.filter(e => e.id !== id);
  localStorage.setItem(EMOTIONS_KEY, JSON.stringify(filtered));
}

/**
 * 오늘의 감정 가져오기
 * @returns {object|null} 오늘의 감정 또는 null
 */
export function getTodayEmotion() {
  const today = new Date().toISOString().split('T')[0];
  return getEmotionByDate(today);
}

// ===== 설정 관리 =====

const DEFAULT_SETTINGS = {
  notificationsEnabled: false,
  notificationTime: '22:00',
  pushSubscription: null
};

/**
 * 설정 가져오기
 * @returns {object} 설정 객체
 */
export function getSettings() {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
}

/**
 * 설정 저장
 * @param {object} settings - 설정 객체
 */
export function saveSettings(settings) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * 설정 초기화
 */
export function resetSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return DEFAULT_SETTINGS;
}

// ===== 리포트 캐시 관리 =====

/**
 * 리포트 캐시 가져오기
 * @returns {object} 리포트 캐시 객체
 */
export function getReportsCache() {
  const data = localStorage.getItem(REPORTS_KEY);
  return data ? JSON.parse(data) : { weekly: {}, monthly: {} };
}

/**
 * 주간 리포트 캐시 저장
 * @param {string} weekKey - 주간 키 (예: "2026-W05")
 * @param {object} report - 리포트 데이터
 */
export function saveWeeklyReportCache(weekKey, report) {
  const cache = getReportsCache();
  cache.weekly[weekKey] = {
    ...report,
    createdAt: Date.now()
  };
  localStorage.setItem(REPORTS_KEY, JSON.stringify(cache));
}

/**
 * 월간 리포트 캐시 저장
 * @param {string} monthKey - 월간 키 (예: "2026-01")
 * @param {object} report - 리포트 데이터
 */
export function saveMonthlyReportCache(monthKey, report) {
  const cache = getReportsCache();
  cache.monthly[monthKey] = {
    ...report,
    createdAt: Date.now()
  };
  localStorage.setItem(REPORTS_KEY, JSON.stringify(cache));
}

/**
 * 주간 리포트 캐시 가져오기
 * @param {string} weekKey - 주간 키
 * @returns {object|null} 캐시된 리포트 또는 null
 */
export function getWeeklyReportCache(weekKey) {
  const cache = getReportsCache();
  return cache.weekly[weekKey] || null;
}

/**
 * 월간 리포트 캐시 가져오기
 * @param {string} monthKey - 월간 키
 * @returns {object|null} 캐시된 리포트 또는 null
 */
export function getMonthlyReportCache(monthKey) {
  const cache = getReportsCache();
  return cache.monthly[monthKey] || null;
}

/**
 * 오래된 캐시 정리 (30일 이상)
 */
export function clearOldCache() {
  const cache = getReportsCache();
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  // 주간 리포트 캐시 정리
  Object.keys(cache.weekly).forEach(key => {
    if (now - cache.weekly[key].createdAt > thirtyDays) {
      delete cache.weekly[key];
    }
  });

  // 월간 리포트 캐시 정리
  Object.keys(cache.monthly).forEach(key => {
    if (now - cache.monthly[key].createdAt > thirtyDays) {
      delete cache.monthly[key];
    }
  });

  localStorage.setItem(REPORTS_KEY, JSON.stringify(cache));
}

// ===== 전체 데이터 관리 =====

/**
 * 모든 데이터 내보내기
 * @returns {object} 모든 데이터
 */
export function exportAllData() {
  return {
    emotions: getEmotions(),
    settings: getSettings(),
    reports: getReportsCache(),
    exportedAt: Date.now()
  };
}

/**
 * 데이터 가져오기 (복원)
 * @param {object} data - 가져올 데이터
 */
export function importData(data) {
  if (data.emotions) {
    localStorage.setItem(EMOTIONS_KEY, JSON.stringify(data.emotions));
  }
  if (data.settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
  }
  if (data.reports) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(data.reports));
  }
}

/**
 * 모든 데이터 삭제
 */
export function clearAllData() {
  localStorage.removeItem(EMOTIONS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(REPORTS_KEY);
}
