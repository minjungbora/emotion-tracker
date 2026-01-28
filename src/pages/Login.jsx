import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import './Login.css';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (isSignup && password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        // 회원가입
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // 로그인
        await signInWithEmailAndPassword(auth, email, password);
      }
      // 로그인 성공 시 자동으로 App.jsx의 onAuthStateChanged가 감지
    } catch (err) {
      console.error('Auth error:', err);

      // Firebase 에러 메시지를 한글로 변환
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('이미 사용 중인 이메일입니다.');
          break;
        case 'auth/invalid-email':
          setError('유효하지 않은 이메일 형식입니다.');
          break;
        case 'auth/user-not-found':
          setError('등록되지 않은 이메일입니다.');
          break;
        case 'auth/wrong-password':
          setError('비밀번호가 틀렸습니다.');
          break;
        case 'auth/weak-password':
          setError('비밀번호가 너무 약합니다. 6자 이상 입력해주세요.');
          break;
        case 'auth/network-request-failed':
          setError('네트워크 연결을 확인해주세요.');
          break;
        default:
          setError(isSignup ? '회원가입에 실패했습니다.' : '로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🌸 감정 추적</h1>
          <p>매일의 감정을 기록하고 AI 인사이트를 받아보세요</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>{isSignup ? '회원가입' : '로그인'}</h2>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상 입력"
              disabled={loading}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? '처리 중...' : isSignup ? '회원가입' : '로그인'}
          </button>

          <button
            type="button"
            className="toggle-button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
              setConfirmPassword('');
            }}
            disabled={loading}
          >
            {isSignup ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
          </button>
        </form>

        <div className="login-footer">
          <p>🔒 안전하게 암호화되어 저장됩니다</p>
        </div>
      </div>
    </div>
  );
}
