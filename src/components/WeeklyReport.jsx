import { useState, useEffect } from 'react';
import { format, getWeek, getYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import { generateWeeklyReportData, analyzeTrend } from '../services/analytics';
import { generateWeeklyInsight } from '../services/claude';
import { getWeeklyReportCache, saveReportCache } from '../services/firebase/firestore';
import { auth } from '../services/firebase/config';
import { LineChartComponent } from './Chart';
import './WeeklyReport.css';

export default function WeeklyReport() {
  const [date, setDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);

  const weekKey = `${getYear(date)}-W${String(getWeek(date, { weekStartsOn: 1 })).padStart(2, '0')}`;

  useEffect(() => {
    loadReport();
  }, [date]);

  const loadReport = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    setError(null);
    setGenerationTime(null);

    try {
      const userId = auth.currentUser.uid;

      // 리포트 데이터 생성
      const data = await generateWeeklyReportData(userId, date);

      if (!data) {
        setReportData(null);
        setInsight('');
        return;
      }

      setReportData(data);

      // 캐시된 인사이트 확인
      const cached = await getWeeklyReportCache(userId, weekKey);

      if (cached && cached.insight) {
        setInsight(cached.insight);
        if (cached.generationTime) {
          setGenerationTime(cached.generationTime);
        }
      } else {
        // Claude API로 인사이트 생성
        setInsight('AI 인사이트를 생성하는 중...');
        const startTime = Date.now();

        const generatedInsight = await generateWeeklyInsight(data.emotions, data.average);

        const endTime = Date.now();
        const timeInSeconds = ((endTime - startTime) / 1000).toFixed(1);

        setInsight(generatedInsight);
        setGenerationTime(timeInSeconds);

        // 캐시에 저장
        await saveReportCache(userId, 'weekly', weekKey, {
          averageScore: data.average,
          insight: generatedInsight,
          generationTime: timeInSeconds
        });
      }
    } catch (err) {
      console.error('Error loading weekly report:', err);
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
        <h2>이번 주 감정 기록이 없습니다</h2>
        <p>매일 감정을 기록하면 주간 리포트를 볼 수 있어요!</p>
      </div>
    );
  }

  const trend = analyzeTrend(reportData.emotions);

  // 차트 데이터 준비
  const chartData = reportData.dailyData
    .filter(d => d.hasData)
    .map(d => ({
      date: d.date,
      score: d.score
    }));

  return (
    <div className="weekly-report">
      <div className="report-card">
        <div className="report-header">
          <h2>
            {getYear(date)}년 {getWeek(date, { weekStartsOn: 1 })}주차
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

        {trend && (
          <div className={`trend-card ${trend.trend}`}>
            <div className="trend-message">{trend.message}</div>
          </div>
        )}

        <div className="report-chart">
          <LineChartComponent
            data={chartData}
            dataKey="score"
            xAxisKey="date"
            title="일별 점수 변화"
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
