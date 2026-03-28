🐶 DogWalk Chat & Backend Guide
📌 프로젝트 구조 요약

현재 프로젝트는 React Native 프론트엔드 + Node 백엔드 + OSRM(Docker) 구조입니다.

전체 구조
React Native App (Expo)
        ↓
Node Backend (server.js)
        ↓
OSRM (Docker - 경로 탐색)
        ↓
Gemini API (챗봇)
각 역할
구성	역할
React Native	앱 화면, 채팅 UI
Node server.js	API 서버 (챗봇, 경로 추천, POI)
OSRM Docker	산책 경로 계산
Gemini API	반려견 챗봇 답변 생성
⚙️ 실행 방법
1. wall-backend에 .env 파일 추가

walk-backend/.env

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PORT=8080
2. walk-backend에서 라이브러리 설치
cd walk-backend
npm install @google/genai
npm install dotenv

또는

npm install
3. 서버 실행 (프론트 실행 전에 반드시)
cd walk-backend
node server.js

서버 실행되면:

backend on http://0.0.0.0:8080

이 메시지가 떠야 정상입니다.

4. OSRM 실행 (경로 추천용)

프로젝트 루트에서:

docker compose up
5. 프론트엔드 실행
npx expo start
🚀 실행 순서 (중요)

항상 아래 순서로 실행해야 합니다.

1. docker compose up
2. node server.js
3. npx expo start
🔧 수정 사항
업데이트된 파일
package-lock.json (라이브러리 다운로드)
package.json → "type": "module" 추가
server.js 업데이트 (Gemini 챗봇 API 추가)
community.js 업데이트 (채팅 UI 및 API 연결)