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

    try {
      // 리포트 데이터 생성
      const data = generateMonthlyReportData(date);

      if (!data) {
        setReportData(null);
        setInsight('');
        return;
      }

      setReportData(data);

      // 캐시된 인사이트 확인
      const cached = getMonthlyReportCache(monthKey);

      if (cached && cached.insight) {
        setInsight(cached.insight);
        if (cached.generationTime) {
          setGenerationTime(cached.generationTime);
        }
      } else {
        // Claude API로 인사이트 생성
        setInsight('AI 인사이트를 생성하는 중...');
        const startTime = Date.now();

        const generatedInsight = await generateMonthlyInsight(
          data.emotions,
          data.average,
          data.weeklyAverages,
          data.dailyAverages
        );

        const endTime = Date.now();
        const timeInSeconds = ((endTime - startTime) / 1000).toFixed(1);

        setInsight(generatedInsight);
        setGenerationTime(timeInSeconds);

        // 캐시에 저장
        saveMonthlyReportCache(monthKey, {
          averageScore: data.average,
          insight: generatedInsight,
          generationTime: timeInSeconds
        });
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

        {insight && (
          <div className="insight-card">
            <h3>📝 AI 인사이트</h3>
            <div className="insight-content">
              {insight === 'AI 인사이트를 생성하는 중...' ? (
                <div className="insight-loading">
                  <span className="loading-spinner">⏳</span>
                  {insight}
                </div>
              ) : error ? (
                <p className="error-text">{error}</p>
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
