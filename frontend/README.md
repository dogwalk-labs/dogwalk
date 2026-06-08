# 🐾 같이걷개! 실행 가이드

## 사전 설치 필요
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (v18 이상)
- [Python](https://www.python.org/) (3.11 이상)
- [Expo Go](https://expo.dev/client) 앱 (모바일에 설치)

---


## 1. IP 주소 확인 및 변경
PowerShell에서 본인 IP 확인:
```powershell
ipconfig
# IPv4 주소 확인 (예: 192.168.0.xxx)
```

아래 파일에서 `SERVER_HOST` 를 본인 IP로 교체:
- `frontend/config/config.js` 에서 `SERVER HOST`

---

## 2. 환경 변수 설정


| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Supabase PostgreSQL DB 연결 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 (경로 저장 등) |
| `SECRET_KEY` | JWT 로그인 인증 (FastAPI) |
| `CORS_ALLOW_ORIGINS` | API 허용 origin |
| `OSRM_BASE_URL` | OSRM 경로 추천 서버 주소 |
| `OSRM_PROFILE` | OSRM 이동 프로필 (`foot`) |
| `OSRM_TIMEOUT_SEC` | OSRM 요청 타임아웃 |
| `GEMINI_API_KEY` | Google Gemini API 키 (AI 챗봇) |
| `MAIL_USERNAME` | 비밀번호 재설정 메일 (Gmail) |
| `MAIL_PASSWORD` | Gmail 앱 비밀번호 |
| `MAIL_FROM` | 발신 메일 주소 |
| `PORT` | Node.js 서버 포트 (`8080`) |

---

## 3. Docker 실행 (OSRM 추천 서버)
```powershell
dockercompose up -d
```
Docker Desktop에서 컨테이너 3개(`dogwalk-db`, `dogwalk-osrm`, `dogwalk-api`)가 뜨면 성공.

---

## 4. FastAPI 서버 실행
```powershell
cd backend/api-python
pip install -r requirements.txt
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 5. Node.js 서버 실행
PowerShell에서:
```powershell
cd backend/walk-backend
npm install
node server.js
```

---

## 6. 프론트엔드 실행
```powershell
cd frontend
npm install
npx expo start
```

---

## 실행 순서 요약
```
1. IP 주소 설정 (config.js)
2. 환경 변수 설정 (.env)
3. Docker Desktop 실행 → docker-compose up -d
4. FastAPI 서버 실행 (uvicorn)
5. Node.js 서버 실행 (node server.js)
6. Expo 실행 (npx expo start)
```

---
