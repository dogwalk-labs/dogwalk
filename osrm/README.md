# Walk Backend (OSRM-based Route Recommendation)

산책 경로 추천을 위한 **OSRM 기반 백엔드 서버**입니다.  
본 모듈은 **경로 후보 생성(A 담당)** 범위만을 포함하며,  
DB/개인화 로직은 포함하지 않습니다.

---

## 📌 Scope (A 담당)
- Geo / OSM / OSRM 기반 경로 후보 생성
- 현재 위치 기준 원형(왕복) 산책 경로 생성
- 입력한 산책 시간에 맞춰 경로 길이 자동 조정
- 추천 경로 3개 생성
- 경로 특성 분석(골목/큰길, 한 바퀴/왕복 등 태그)

> ❗ 본 서버는 **DB를 사용하지 않으며**,  
> 추천 결과는 요청 시마다 OSRM을 통해 실시간 생성됩니다.

---

## 🧩 Architecture

## OSRM 서버 실행 방법 (필수)

이 백엔드 서버는 **OSRM(Open Source Routing Machine)** 서버에 의존합니다.  
OSRM 서버는 본 레포에 포함되어 있지 않으며,  
**각 개발자가 로컬에서 Docker로 실행**해야 합니다.

> ⚠️ OSRM 서버가 실행 중이지 않으면 추천 API가 동작하지 않습니다.

---

#OSRM이란?
- 도보/자동차 등의 **경로를 계산해주는 서버**
- 이 프로젝트에서는 **산책 경로 계산**에 사용합니다.

---

# 🐶 Dogwalk OSRM 실행 방법

#### (1) 지도 데이터 준비
원하는 지역의 `.pbf` 파일을 준비합니다.  
(예: South Korea, osm들어가서 다운받기)


## 1️⃣ 준비
- Docker Desktop 설치
- south-korea.osm.pbf 파일을 아래 위치에 넣기(다운파일이랑 이름 통일!)

dogwalk/osrm/data/south-korea.osm.pbf

## 2️⃣ 실행 (자동 전처리 + 서버 실행)
프로젝트 루트(dogwalk)에서:

docker compose up

처음 실행 시:
- extract
- partition
- customize

자동 진행됩니다.
완료 후 OSRM 서버가 5000 포트에서 실행됩니다.

## 3️⃣ 테스트

브라우저에서:

http://localhost:5000/route/v1/foot/126.8446,37.4979;126.8870,37.5077?overview=false

JSON 나오면 성공 🎉
