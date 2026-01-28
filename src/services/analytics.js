import { getEmotions, getEmotionsByDateRange } from './storage';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  getWeek,
  getYear,
  getDay,
  eachDayOfInterval,
  parseISO
} from 'date-fns';

/**
 * 주간 데이터 가져오기
 * @param {Date} date - 기준 날짜
 * @returns {Array} 주간 감정 데이터
 */
export function getWeeklyData(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // 월요일 시작
  const end = endOfWeek(date, { weekStartsOn: 1 });

  const emotions = getEmotionsByDateRange(start, end);

  // 날짜별로 정렬 (오래된 순)
  return emotions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * 월간 데이터 가져오기
 * @param {Date} date - 기준 날짜
 * @returns {Array} 월간 감정 데이터
 */
export function getMonthlyData(date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  const emotions = getEmotionsByDateRange(start, end);

  // 날짜별로 정렬 (오래된 순)
  return emotions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * 평균 점수 계산
 * @param {Array} emotions - 감정 배열
 * @returns {number} 평균 점수 (소수점 2자리)
 */
export function calculateAverage(emotions) {
  if (!emotions || emotions.length === 0) return 0;

  const sum = emotions.reduce((total, e) => total + e.score, 0);
  return Math.round((sum / emotions.length) * 100) / 100;
}

/**
 * 주간 평균 점수 계산 (월간 데이터에서)
 * @param {Array} emotions - 월간 감정 배열
 * @returns {Array} 주별 평균 [{weekNumber, average, startDate, endDate}]
 */
export function getWeeklyAverages(emotions) {
  if (!emotions || emotions.length === 0) return [];

  // 주별로 그룹화
  const weekGroups = {};

  emotions.forEach(emotion => {
    const date = parseISO(emotion.date);
    const week = getWeek(date, { weekStartsOn: 1 });
    const year = getYear(date);
    const key = `${year}-W${week}`;

    if (!weekGroups[key]) {
      weekGroups[key] = {
        weekNumber: week,
        year,
        emotions: [],
        startDate: startOfWeek(date, { weekStartsOn: 1 }),
        endDate: endOfWeek(date, { weekStartsOn: 1 })
      };
    }

    weekGroups[key].emotions.push(emotion);
  });

  // 평균 계산
  const weeklyAverages = Object.values(weekGroups).map(group => ({
    weekNumber: group.weekNumber,
    year: group.year,
    average: calculateAverage(group.emotions),
    startDate: format(group.startDate, 'yyyy-MM-dd'),
    endDate: format(group.endDate, 'yyyy-MM-dd'),
    count: group.emotions.length
  }));

  // 주차 순으로 정렬
  return weeklyAverages.sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * 요일별 평균 점수 계산
 * @param {Array} emotions - 감정 배열
 * @returns {Array} 요일별 평균 [{dayOfWeek, dayName, average}]
 */
export function getDailyAverages(emotions) {
  if (!emotions || emotions.length === 0) return [];

  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  // 요일별로 그룹화
  const dayGroups = {};

  emotions.forEach(emotion => {
    const date = parseISO(emotion.date);
    const dayOfWeek = getDay(date);

    if (!dayGroups[dayOfWeek]) {
      dayGroups[dayOfWeek] = [];
    }

    dayGroups[dayOfWeek].push(emotion);
  });

  // 평균 계산
  const dailyAverages = Object.entries(dayGroups).map(([day, emotions]) => ({
    dayOfWeek: parseInt(day),
    dayName: dayNames[parseInt(day)],
    average: calculateAverage(emotions),
    count: emotions.length
  }));

  // 요일 순으로 정렬 (일요일부터)
  return dailyAverages.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/**
 * 주간 리포트 데이터 생성
 * @param {Date} date - 기준 날짜
 * @returns {object} 주간 리포트 데이터
 */
export function generateWeeklyReportData(date = new Date()) {
  const emotions = getWeeklyData(date);

  if (emotions.length === 0) {
    return null;
  }

  const average = calculateAverage(emotions);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  // 일별 데이터 생성 (빈 날짜 포함)
  const days = eachDayOfInterval({ start, end });
  const dailyData = days.map(day => {
    const dateString = format(day, 'yyyy-MM-dd');
    const emotion = emotions.find(e => e.date === dateString);

    return {
      date: dateString,
      dayName: format(day, 'EEEE', { locale: { code: 'ko' } }),
      score: emotion ? emotion.score : null,
      note: emotion ? emotion.note : null,
      hasData: !!emotion
    };
  });

  return {
    weekNumber: getWeek(date, { weekStartsOn: 1 }),
    year: getYear(date),
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    average,
    totalRecords: emotions.length,
    dailyData,
    emotions
  };
}

/**
 * 월간 리포트 데이터 생성
 * @param {Date} date - 기준 날짜
 * @returns {object} 월간 리포트 데이터
 */
export function generateMonthlyReportData(date = new Date()) {
  const emotions = getMonthlyData(date);

  if (emotions.length === 0) {
    return null;
  }

  const average = calculateAverage(emotions);
  const weeklyAverages = getWeeklyAverages(emotions);
  const dailyAverages = getDailyAverages(emotions);

  const start = startOfMonth(date);
  const end = endOfMonth(date);

  return {
    year: getYear(date),
    month: date.getMonth() + 1,
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    average,
    totalRecords: emotions.length,
    weeklyAverages,
    dailyAverages,
    emotions
  };
}

/**
 * 점수 변화 추이 분석
 * @param {Array} emotions - 감정 배열 (날짜순 정렬 필요)
 * @returns {object} 추이 분석 결과
 */
export function analyzeTrend(emotions) {
  if (!emotions || emotions.length < 2) {
    return {
      trend: 'stable',
      message: '데이터가 부족합니다.'
    };
  }

  const scores = emotions.map(e => e.score);

  // 전반부와 후반부 평균 비교
  const midPoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, midPoint);
  const secondHalf = scores.slice(midPoint);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.5) {
    return {
      trend: 'improving',
      message: '점수가 상승하는 추세입니다. 좋은 방향으로 나아가고 있어요! 👍',
      difference: diff.toFixed(2)
    };
  } else if (diff < -0.5) {
    return {
      trend: 'declining',
      message: '점수가 하락하는 추세입니다. 힘든 시기일 수 있으니 자신을 돌보는 시간을 가져보세요. 💙',
      difference: diff.toFixed(2)
    };
  } else {
    return {
      trend: 'stable',
      message: '점수가 안정적으로 유지되고 있습니다.',
      difference: diff.toFixed(2)
    };
  }
}

/**
 * 가장 좋았던/나빴던 날 찾기
 * @param {Array} emotions - 감정 배열
 * @returns {object} {best, worst}
 */
export function getBestAndWorstDays(emotions) {
  if (!emotions || emotions.length === 0) {
    return { best: null, worst: null };
  }

  const best = emotions.reduce((max, e) => (e.score > max.score ? e : max), emotions[0]);
  const worst = emotions.reduce((min, e) => (e.score < min.score ? e : min), emotions[0]);

  return { best, worst };
}
