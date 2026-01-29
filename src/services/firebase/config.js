import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase 설정
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth와 Firestore 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firestore 오프라인 캐싱 활성화 (로딩 속도 개선)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // 여러 탭이 열려있는 경우
    console.warn('Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // 브라우저가 지원하지 않는 경우
    console.warn('Persistence not supported by browser');
  }
});

export default app;
