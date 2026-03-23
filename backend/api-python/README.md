# 🚶‍♂️ Dogwalk API (FastAPI)

산책 경로 추천 서비스의 백엔드 API입니다.
현재는 **회원가입 / 로그인 / 사용자 인증 기능**이 구현되어 있습니다.

## 🗄️ Database 설정 (PostgreSQL)

본 프로젝트는 PostgreSQL + PostGIS를 사용합니다.
백엔드 실행 전, 반드시 DB 테이블을 생성해야 합니다.

---

### 1. PostgreSQL 실행

로컬에 PostgreSQL이 설치되어 있어야 합니다.

---

### 2. 데이터베이스 생성

예시:

```sql
CREATE DATABASE dogwalk;
```

---

### 3. DB 접속 후 init.sql 실행

`api-python/db/init.sql` 파일을 실행하여 테이블을 생성합니다.

#### DBeaver 기준

1. DB 연결
2. SQL Editor 열기
3. `init.sql` 내용 붙여넣기
4. 실행

---

### 4. 생성되는 테이블

* `users` (회원 정보)
* `paths` (산책 경로)
* `feedback` (좋아요 / 싫어요)

---

### 5. 주의사항 ⚠️

* 기존에 생성된 `users` 테이블이 있는 경우, 컬럼이 다를 수 있으므로 삭제 후 재생성 권장

```sql
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS paths;
DROP TABLE IF EXISTS users;
```

이후 `init.sql` 재실행

---

### 6. 필수 확장

아래 확장이 자동으로 생성됩니다.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

### 7. DB 연결 설정

`.env` 또는 config 파일에서 DB URL을 설정해야 합니다.

예시:

```text
DATABASE_URL=postgresql://user:password@localhost:5432/dogwalk
```

---

## ✅ 완료 체크

아래 조건이 만족되면 정상입니다.

* `users`, `paths`, `feedback` 테이블 생성됨
* FastAPI 실행 시 DB 오류 없음
* `/auth/signup` 정상 동작

---

---

## 📌 실행 방법

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

서버 실행 후 접속:

* Swagger UI: http://127.0.0.1:8000/docs

---

## 🔐 인증 방식

* JWT (Access Token) 기반 인증 사용
* 로그인/회원가입 성공 시 `access_token` 발급
* 인증이 필요한 API 호출 시 아래 헤더 사용

```http
Authorization: Bearer {access_token}
```

---

## 📡 API 명세

### 1. 회원가입

**POST** `/auth/signup`

#### Request

```json
{
  "email": "test@test.com",
  "password": "1234",
  "password_confirm": "1234",
  "nickname": "tester"
}
```

#### Response

```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer",
  "id": "user-uuid",
  "email": "test@test.com",
  "nickname": "tester"
}
```

---

### 2. 로그인

**POST** `/auth/login`

#### Request

```json
{
  "email": "test@test.com",
  "password": "1234"
}
```

#### Response

```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer",
  "id": "user-uuid",
  "email": "test@test.com",
  "nickname": "tester"
}
```

---

### 3. 내 정보 조회

**GET** `/users/me`

#### Headers

```http
Authorization: Bearer {access_token}
```

#### Response

```json
{
  "id": "user-uuid",
  "email": "test@test.com",
  "nickname": "tester",
  "provider": "local",
  "created_at": "2026-03-23T13:12:43.375685+00:00"
}
```

---

## ⚠️ 에러 처리

모든 에러는 아래 형식으로 반환됩니다.

```json
{
  "detail": "에러 메시지"
}
```

### 주요 케이스

* 400: 잘못된 요청 (ex. 중복 이메일)
* 401: 인증 실패 (ex. 로그인 실패, 토큰 없음/오류)
* 404: 사용자 없음

---

## 🔁 인증 흐름

1. 회원가입 또는 로그인 요청
2. `access_token` 발급
3. 프론트에서 토큰 저장 (localStorage 등)
4. 이후 요청 시 헤더에 토큰 포함
5. `/users/me` 등 인증 API 사용

---

## 💻 프론트 연동 예시 (axios)

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 로그인
export const login = async (payload) => {
  const res = await api.post("/auth/login", payload);
  localStorage.setItem("access_token", res.data.access_token);
  return res.data;
};

// 내 정보 조회
export const getMe = async () => {
  const token = localStorage.getItem("access_token");
  const res = await api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
```

---

## 📂 프로젝트 구조

```
app/
 ├── api/        # API 라우터 (auth, users, feedback 등)
 ├── core/       # 보안, DB 설정
 ├── schemas/    # 요청/응답 모델
 └── main.py     # FastAPI 엔트리포인트
```

---

## 🚀 현재 구현 상태

* [x] 회원가입
* [x] 로그인 (JWT 발급)
* [x] 인증 기반 사용자 조회
* [x] 비밀번호 해싱 (bcrypt)

---

## 🔜 향후 개선 예정

* Refresh Token
* 로그아웃 처리
* 소셜 로그인
* 비밀번호 재설정
* 사용자 정보 수정

---

## 👨‍💻 담당

백엔드: 인증 API 및 사용자 관리 기능 구현
