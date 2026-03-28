# 🐶 DogWalk Chat & Backend Guide

## 📌 프로젝트 구조 요약

현재 프로젝트는 React Native 프론트엔드 + Node 백엔드 + OSRM(Docker) + Gemini API 구조입니다.

[전체 구조]
React Native App (Expo)
↓
Node Backend (server.js)
↓
OSRM (Docker - 경로 탐색)
↓
Gemini API (챗봇)

[각 구성 요소 역할]
React Native  → 앱 화면, 채팅 UI
Node server.js → API 서버 (챗봇, 경로 추천, POI)
OSRM Docker → 산책 경로 계산
Gemini API → 반려견 챗봇 답변 생성

---

## ⚙️ 실행 방법

1. walk-backend에 .env 파일 추가
   경로: walk-backend/.env

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

서버 실행 후 아래 메시지가 뜨면 정상입니다.

backend on http://0.0.0.0:8080

4. OSRM 실행 (경로 추천용)

프로젝트 루트에서 실행

docker compose up

5. 프론트엔드 실행

npx expo start

---

## 🚀 실행 순서 (중요)

항상 아래 순서로 실행해야 합니다.

1. docker compose up
2. node server.js
3. npx expo start

※ 세 개 중 하나라도 실행되지 않으면 앱 기능이 정상 동작하지 않습니다.

---

## 🔧 수정 사항

업데이트된 파일

* package-lock.json (라이브러리 다운로드)
* package.json → "type": "module" 추가
* server.js 업데이트 (Gemini 챗봇 API 추가)
* community.js 업데이트 (채팅 UI 및 API 연결)

---

## 📡 백엔드 API 목록

POST   /chat                → 반려견 챗봇
POST   /recommend           → 산책 경로 추천
GET    /routes/recommend    → 산책 경로 추천(GET)
GET    /pois                → 병원 / 식당 / POI
GET    /health              → 서버 상태 확인

---

## 🧠 전체 시스템 구조 정리

OSRM (Docker) → 경로 계산 서버
Node Backend → API 서버
React Native → 모바일 앱
Gemini API → 챗봇 AI

위 4개가 연결되어 전체 서비스가 동작합니다.
