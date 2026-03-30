# 🐾 DogWalk 실행 가이드

## 사전 설치 필요
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (v18 이상)
- [Python](https://www.python.org/) (3.11 이상)
- [Expo Go](https://expo.dev/client) 앱 (핸드폰에 설치)

---

## 1. 레포 클론
```bash
git clone https://github.com/{레포주소}.git
cd dogwalk
git checkout test
```

---

## 2. IP 주소 확인 및 변경
PowerShell에서 본인 IP 확인:
```powershell
ipconfig
# IPv4 주소 확인 (예: 192.168.0.xxx)
```

아래 파일에서 `SERVER_HOST` 를 본인 IP로 교체:
- `frontend/config/config.js` 에서 `SERVER HOST`

---

## 3. Docker 실행 (DB + OSRM + Node 추천 서버)
```powershell
docker-compose up -d
```
Docker Desktop에서 컨테이너 3개(`dogwalk-db`, `dogwalk-osrm`, `dogwalk-api`)가 뜨면 성공.

---

## 4. FastAPI 서버 실행
```powershell
cd backend/api-python
pip install -r requirements.txt
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
터미널에 `Uvicorn running on http://0.0.0.0:8000` 뜨면 성공.

---

## 5. 테스트 유저 생성
FastAPI 서버 실행 후 PowerShell에서:
```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:8000/users/upsert-temp"
```

---

## 6. 프론트엔드 실행
```powershell
cd frontend
npm install
npx expo start
```
터미널에 QR코드 뜨면 핸드폰 카메라로 스캔 → Expo Go 앱으로 실행.

---

## 실행 순서 요약
```
1. Docker Desktop 실행
2. docker-compose up -d
3. FastAPI 서버 실행 (uvicorn)
4. Expo 실행 (npx expo start)
```

---

## 문제 해결
- **지도가 안 뜨면**: IP 주소가 맞는지 확인
- **경로 추천이 안 뜨면**: Docker 컨테이너가 모두 실행 중인지 확인
- **저장이 안 되면**: FastAPI 터미널 로그 확인
