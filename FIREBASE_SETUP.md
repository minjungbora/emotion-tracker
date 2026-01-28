# Firebase 설정 가이드

이 문서는 감정 추적 앱을 Firebase와 연동하기 위한 설정 가이드입니다.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `emotion-tracker`)
4. Google 애널리틱스 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. Firebase Authentication 설정

1. Firebase Console에서 생성한 프로젝트 선택
2. 좌측 메뉴에서 **Build > Authentication** 클릭
3. "시작하기" 버튼 클릭
4. **Sign-in method** 탭 선택
5. "이메일/비밀번호" 제공업체 선택
6. "사용 설정" 토글 활성화
7. "저장" 클릭

## 3. Cloud Firestore 설정

1. 좌측 메뉴에서 **Build > Firestore Database** 클릭
2. "데이터베이스 만들기" 버튼 클릭
3. **프로덕션 모드로 시작** 선택
4. 위치 선택 (추천: `asia-northeast3` - 서울)
5. "사용 설정" 클릭

### Firestore 보안 규칙 설정

"규칙" 탭으로 이동하여 아래 규칙을 복사/붙여넣기:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서는 본인만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // 감정 기록
      match /emotions/{emotionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // 리포트 캐시
      match /reports/{reportId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // 설정
      match /settings/{settingId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

"게시" 버튼을 눌러 규칙 적용

## 4. Firebase 웹 앱 등록

1. Firebase Console 프로젝트 개요 페이지로 이동
2. "앱 추가" 또는 웹 아이콘 `</>` 클릭
3. 앱 닉네임 입력 (예: `emotion-tracker-web`)
4. Firebase Hosting 설정은 체크하지 않음 (이미 Vercel 사용 중)
5. "앱 등록" 클릭
6. Firebase SDK 설정 정보가 표시됨 - **이 정보를 복사해둡니다**

표시되는 정보 예시:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## 5. 환경 변수 설정

### 5.1 로컬 개발 환경

프로젝트 루트에 `.env.local` 파일 생성 (이미 있으면 수정):

```env
# Claude API (기존)
VITE_CLAUDE_API_KEY=your_claude_api_key_here

# Firebase 설정
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**주의**: `.env.local` 파일은 절대 Git에 커밋하지 마세요!

### 5.2 Vercel 배포 환경

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 `emotion-tracker` 프로젝트 선택
2. **Settings > Environment Variables** 메뉴로 이동
3. 아래 환경 변수들을 하나씩 추가:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console에서 복사한 apiKey | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authDomain | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | Firebase projectId | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storageBucket | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messagingSenderId | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | Firebase appId | Production, Preview, Development |

4. 환경 변수 추가 후 **Redeploy** 버튼을 눌러 재배포

## 6. 로컬에서 테스트

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 열기

1. 회원가입 시도
2. 감정 기록 추가
3. Firebase Console > Firestore Database에서 데이터 확인

## 7. 데이터 구조 확인

Firestore에 다음과 같은 구조로 데이터가 저장되는지 확인:

```
users (collection)
  └── {userId} (document)
      ├── emotions (collection)
      │   └── {YYYY-MM-DD} (document)
      │       ├── score: number
      │       ├── date: string
      │       ├── timestamp: timestamp
      │       ├── note: string
      │       └── updatedAt: timestamp
      │
      ├── reports (collection)
      │   └── {type}-{periodKey} (document)
      │       ├── type: string (weekly/monthly)
      │       ├── periodKey: string
      │       ├── insight: string
      │       ├── generationTime: string
      │       └── cachedAt: timestamp
      │
      └── settings (collection)
          └── preferences (document)
              ├── notificationsEnabled: boolean
              ├── notificationTime: string
              ├── pushSubscription: object
              └── updatedAt: timestamp
```

## 8. 문제 해결

### 인증 오류
- Firebase Console > Authentication에서 이메일/비밀번호 제공업체가 활성화되어 있는지 확인
- 환경 변수가 올바르게 설정되었는지 확인 (특히 `authDomain`)

### 데이터 읽기/쓰기 권한 오류
- Firestore 보안 규칙이 올바르게 설정되었는지 확인
- 로그인된 사용자의 UID와 요청하는 문서의 userId가 일치하는지 확인

### 환경 변수가 적용되지 않음
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 개발 서버를 재시작 (`npm run dev` 다시 실행)
- Vercel의 경우 환경 변수 추가 후 반드시 재배포

## 다음 단계

- [x] Firebase 프로젝트 설정 완료
- [ ] 로컬 테스트 완료
- [ ] Vercel 환경 변수 설정 완료
- [ ] 프로덕션 배포 및 테스트
- [ ] 기존 로컬 스토리지 데이터 마이그레이션 (선택사항)

## 참고 자료

- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- [Cloud Firestore 문서](https://firebase.google.com/docs/firestore)
- [Firebase 보안 규칙](https://firebase.google.com/docs/rules)
