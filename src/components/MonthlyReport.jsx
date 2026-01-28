import { useState, useEffect } from 'react';
import { format, getYear, getMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { generateMonthlyReportData } from '../services/analytics';
import { generateMonthlyInsight } from '../services/claude';
import { getMonthlyReportCache, saveMonthlyReportCache } from '../services/storage';
import { LineChartComponent, BarChartComponent } from './Chart';
import './WeeklyReport.css'; // 공통 스타일 사용

export default function MonthlyReport() {
  const [date, setDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);

  const monthKey = `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;

  useEffect(() => {
    loadReport();
  }, [date]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    setGenerationTime(null);
    setInsight('');

    try {
      const now = new Date();
      const currentYear = getYear(now);
      const currentMonth = getMonth(now) + 1; // 1-12
      const selectedYear = getYear(date);
      const selectedMonth = getMonth(date) + 1;

      // 현재 달이거나 미래 달인 경우
      if (selectedYear > currentYear ||
          (selectedYear === currentYear && selectedMonth >= currentMonth)) {
        setReportData(null);
        setInsight('');
        setError('not-ready');
        return;
      }

      // 이전 달인 경우 - 리포트 데이터 생성
      const data = generateMonthlyReportData(date);

      if (!data || data.totalRecords === 0) {
        setReportData(null);
        setInsight('');
        setError('no-data');
        return;
      }

      setReportData(data);

      // 캐시된 인사이트 확인
      const cached = getMonthlyReportCache(monthKey);

      if (cached && cached.insight) {
        // 캐시에 있으면 표시
        setInsight(cached.insight);
        if (cached.generationTime) {
          setGenerationTime(cached.generationTime);
        }
      } else {
        // 캐시에 없으면 안내 메시지
        setInsight('');
        setError('not-generated');
      }
    } catch (err) {
      console.error('Error loading monthly report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="report-loading">로딩 중...</div>;
  }

  // 현재 달이거나 미래 달인 경우
  if (error === 'not-ready') {
    return (
      <div className="report-empty">
        <h2>아직 리포트가 준비되지 않았어요</h2>
        <p>이전 달의 리포트만 확인할 수 있습니다.</p>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (error === 'no-data') {
    return (
      <div className="report-empty">
        <h2>이번 달 감정 기록이 없습니다</h2>
        <p>매일 감정을 기록하면 월간 리포트를 볼 수 있어요!</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="report-empty">
        <h2>이번 달 감정 기록이 없습니다</h2>
        <p>매일 감정을 기록하면 월간 리포트를 볼 수 있어요!</p>
      </div>
    );
  }

  // 주별 평균 차트 데이터
  const weeklyChartData = reportData.weeklyAverages.map(w => ({
    name: `${w.weekNumber}주차`,
    average: w.average
  }));

  // 요일별 평균 차트 데이터
  const dailyChartData = reportData.dailyAverages.map(d => ({
    name: d.dayName.slice(0, 1), // 첫 글자만 (월, 화, 수...)
    average: d.average
  }));

  // 일별 점수 차트 데이터
  const dailyScoreData = reportData.emotions.map(e => ({
    date: e.date,
    score: e.score
  }));

  return (
    <div className="monthly-report">
      <div className="report-card">
        <div className="report-header">
          <h2>
            {getYear(date)}년 {getMonth(date) + 1}월
          </h2>
          <p className="report-date-range">
            {format(new Date(reportData.startDate), 'M월 d일', { locale: ko })} ~{' '}
            {format(new Date(reportData.endDate), 'M월 d일', { locale: ko })}
          </p>
        </div>

        <div className="report-summary">
          <div className="summary-item">
            <div className="summary-label">평균 점수</div>
            <div className="summary-value">{reportData.average.toFixed(2)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">기록 일수</div>
            <div className="summary-value">{reportData.totalRecords}일</div>
          </div>
        </div>

        <div className="report-chart">
          <BarChartComponent
            data={weeklyChartData}
            dataKey="average"
            xAxisKey="name"
            title="주별 평균 점수"
          />
        </div>

        <div className="report-chart">
          <BarChartComponent
            data={dailyChartData}
            dataKey="average"
            xAxisKey="name"
            title="요일별 평균 점수"
          />
        </div>

        <div className="report-chart">
          <LineChartComponent
            data={dailyScoreData}
            dataKey="score"
            xAxisKey="date"
            title="전체 점수 추이"
          />
        </div>

        {(insight || error === 'not-generated') && (
          <div className="insight-card">
            <h3>📝 AI 인사이트</h3>
            <div className="insight-content">
              {error === 'not-generated' ? (
                <p className="info-text">
                  아직 인사이트가 생성되기에 데이터가 충분하지 않아요.
                  다음 달 1일 저녁 10시에 다시 확인해주세요.
                </p>
              ) : insight === 'AI 인사이트를 생성하는 중...' ? (
                <div className="insight-loading">
                  <span className="loading-spinner">⏳</span>
                  {insight}
                </div>
              ) : (
                <>
                  <p>{insight}</p>
                  {generationTime && (
                    <div className="generation-time">
                      ⏱️ AI 분석 완료 ({generationTime}초 소요)
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
