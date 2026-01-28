import Anthropic from '@anthropic-ai/sdk';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true // MVP용 - 프로덕션에서는 백엔드에서 호출해야 함
});

const EMOTION_LABELS = {
  1: '매우 아쉬웠어요',
  2: '아쉬웠어요',
  3: '그저 그랬어요',
  4: '만족했어요',
  5: '매우 만족했어요'
};

/**
 * Claude API로 인사이트 생성
 * @param {string} prompt - 프롬프트
 * @param {number} maxTokens - 최대 토큰 수
 * @returns {Promise<string>} 생성된 인사이트
 */
async function generateInsight(prompt, maxTokens = 1000) {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('인사이트 생성에 실패했습니다. API 키를 확인해주세요.');
  }
}

/**
 * 주간 인사이트 생성
 * @param {Array} emotions - 주간 감정 데이터
 * @param {number} average - 주간 평균 점수
 * @returns {Promise<string>} 주간 인사이트
 */
export async function generateWeeklyInsight(emotions, average) {
  if (!emotions || emotions.length === 0) {
    return '이번 주 감정 기록이 없습니다. 매일 감정을 기록하면 더 정확한 인사이트를 받을 수 있어요!';
  }

  const emotionData = emotions.map(e => ({
    date: format(new Date(e.date), 'M월 d일 (E)', { locale: ko }),
    score: e.score,
    label: EMOTION_LABELS[e.score],
    note: e.note || ''
  }));

  const prompt = `
당신은 감정 추적 앱의 따뜻하고 공감적인 심리 분석가입니다. 사용자의 주간 감정 데이터를 분석하고 긍정적이고 격려하는 인사이트를 제공해주세요.

## 주간 감정 데이터
- 평균 점수: ${average.toFixed(2)}/5
- 기록 일수: ${emotions.length}일
- 일별 기록:
${emotionData.map(e => `  - ${e.date}: ${e.score}점 (${e.label})${e.note ? ` - "${e.note}"` : ''}`).join('\n')}

## 점수 의미
- 1점: 매우 아쉬웠어요
- 2점: 아쉬웠어요
- 3점: 그저 그랬어요
- 4점: 만족했어요
- 5점: 매우 만족했어요

다음 내용을 포함하여 2-3 문단으로 인사이트를 작성해주세요:
1. 이번 주 전반적인 감정 상태 평가
2. 점수 변화 추이와 패턴이 있다면 언급
3. 긍정적인 부분 강조 및 격려
4. 다음 주를 위한 부드러운 제안 (강요하지 않고)

중요:
- 친근하고 따뜻한 한국어로 작성
- 마크다운 형식 사용하지 말고 일반 텍스트로
- 너무 형식적이지 않게
- "당신"이나 "여러분" 대신 "우리", "함께" 같은 표현 사용
- 부정적인 부분도 있다면 공감하되, 희망적인 방향 제시
`;

  return await generateInsight(prompt, 1200);
}

/**
 * 월간 인사이트 생성
 * @param {Array} emotions - 월간 감정 데이터
 * @param {number} average - 월간 평균 점수
 * @param {Array} weeklyAverages - 주별 평균 점수
 * @param {Array} dailyAverages - 요일별 평균 점수
 * @returns {Promise<string>} 월간 인사이트
 */
export async function generateMonthlyInsight(emotions, average, weeklyAverages, dailyAverages) {
  if (!emotions || emotions.length === 0) {
    return '이번 달 감정 기록이 없습니다. 매일 감정을 기록하면 월간 패턴과 인사이트를 받을 수 있어요!';
  }

  const weeklyData = weeklyAverages.map(w =>
    `  - ${w.weekNumber}주차: ${w.average.toFixed(2)}점 (${w.count}일 기록)`
  ).join('\n');

  const dailyData = dailyAverages.map(d =>
    `  - ${d.dayName}: ${d.average.toFixed(2)}점 (${d.count}일 기록)`
  ).join('\n');

  const prompt = `
당신은 감정 추적 앱의 깊이 있는 심리 분석가입니다. 사용자의 월간 감정 데이터를 분석하고 통찰력 있고 의미 있는 인사이트를 제공해주세요.

## 월간 감정 데이터
- 평균 점수: ${average.toFixed(2)}/5
- 총 기록 일수: ${emotions.length}일

### 주별 평균 점수
${weeklyData}

### 요일별 평균 점수
${dailyData}

## 점수 의미
- 1점: 매우 아쉬웠어요
- 2점: 아쉬웠어요
- 3점: 그저 그랬어요
- 4점: 만족했어요
- 5점: 매우 만족했어요

다음 내용을 포함하여 3-4 문단으로 깊이 있는 인사이트를 작성해주세요:
1. 이번 달 전반적인 감정 상태 평가
2. 주별 변화 추이 분석 (개선/하락/안정 등)
3. 요일별 패턴 분석 (어떤 요일에 더 만족스러웠는지, 이유 추측)
4. 긍정적인 부분 강조와 의미 있는 성찰
5. 다음 달을 위한 구체적이고 실천 가능한 제안

중요:
- 친근하고 따뜻하면서도 깊이 있는 한국어로 작성
- 마크다운 형식 사용하지 말고 일반 텍스트로
- 데이터 기반의 구체적인 분석
- "당신"이나 "여러분" 대신 "우리", "함께" 같은 표현 사용
- 패턴이 보인다면 그 의미를 해석
- 희망적이고 긍정적인 톤 유지
`;

  return await generateInsight(prompt, 1500);
}
