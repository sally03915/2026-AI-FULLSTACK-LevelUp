
## 📂 폴더 구조
```
FULLSTACK-THEJOA703-RPG-2026/
│
├── attendance/
│   └── records.json        # 학생별 활동 기록 (매일 수정)
│
├── scripts/
│   ├── calcXP.js           # records.json → xp.json 업데이트
│   └── updateReadme.js     # xp.json → README.md 반영
│
├── xp.json                 # 계산된 결과 데이터
├── README.md               # 학생별 결과만 표시
├── RULES.md                # XP/레벨/뱃지/챌린지 기준 설명 (133일 기준)
└── .github/
    └── workflows/
        └── attendance.yml  # 자동 실행 워크플로우
```



---

## 1. `attendance/records.json`
(학생 활동 기록은 매일 업데이트하는 파일, 그대로 유지)

```json
[
  {
    "name": "홍길동",
    "attendanceDays": 9,
    "assignmentsCompleted": 3,
    "totalAssignments": 5,
    "contributions": 2,
    "presentations": 0
  },
  {
    "name": "김철수",
    "attendanceDays": 12,
    "assignmentsCompleted": 5,
    "totalAssignments": 5,
    "contributions": 12,
    "presentations": 4
  },
  {
    "name": "이영희",
    "attendanceDays": 6,
    "assignmentsCompleted": 2,
    "totalAssignments": 5,
    "contributions": 0,
    "presentations": 1
  }
]
```

  // {
  //   "name": "홍길동",              // 학생 이름 (README에 표시될 때 emojiMap과 매칭됨)
  //   "attendanceDays": 9,          // 출석 일수 → calcXP.js에서 XP(출석*10) 계산, 출석 관련 뱃지 조건 확인
  //   "assignmentsCompleted": 3,    // 제출한 과제 수 → XP(과제*20) 계산, 과제 관련 뱃지 조건 확인
  //   "totalAssignments": 5,        // 전체 과제 수 → 제출 비율 계산 (100%면 과제왕, 80% 이상이면 성실제출자)
  //   "contributions": 2,           // 코드 기여 횟수 → XP(기여*10) 계산, 10회 이상이면 코드기여자 뱃지
  //   "presentations": 0            // 발표 횟수 → XP(발표*20) 계산, 3회 이상이면 발표왕 뱃지
  // }


---

## 2. `scripts/calcXP.js`
(133일 기준으로 XP/레벨/뱃지 계산 수정)

```js
const fs = require("fs");

function safeReadJSON(path) {
  try {
    if (!fs.existsSync(path)) return [];
    const data = fs.readFileSync(path, "utf-8");
    return data && data.trim() !== "" ? JSON.parse(data) : [];
  } catch (e) {
    console.warn(`⚠️ ${path} 읽기 실패:`, e.message);
    return [];
  }
}

const attendanceFile = "attendance/records.json";
const xpFile = "xp.json";

const records = safeReadJSON(attendanceFile);
let xpData = {};

records.forEach(student => {
  const { name, attendanceDays, assignmentsCompleted, totalAssignments, contributions, presentations } = student;

  // ✅ XP 계산
  const xp = (attendanceDays * 10) +
             (assignmentsCompleted * 20) +
             (contributions * 10) +
             (presentations * 20);

  const level = Math.min(Math.floor(xp / 125) + 1, 10);

  xpData[name] = {
    xp,
    level,
    attendanceDays,
    assignmentsCompleted,
    totalAssignments,
    contributions,
    presentations,
    badges: []
  };

  // ✅ 뱃지 조건 (133일 기준)
  let badges = [];

  if (attendanceDays >= 30) badges.push("개근왕");
  if (attendanceDays >= 60) badges.push("출석마스터");
  if (attendanceDays >= 133) badges.push("끝까지함께");

  if (totalAssignments > 0) {
    const ratio = assignmentsCompleted / totalAssignments;
    if (ratio === 1) badges.push("과제왕");
    else if (ratio >= 0.8) badges.push("성실제출자");
  }
  if (xp >= 500) badges.push("챌린지완료");

  if (attendanceDays >= 15) badges.push("팀플마스터");
  if (contributions >= 10) badges.push("코드기여자");
  if (presentations >= 3) badges.push("발표왕");

  if (xp >= 200) badges.push("성장중");
  if (level >= 5) badges.push("레벨업마스터");
  if (level >= 10) badges.push("최종보스클리어");

  xpData[name].badges = badges;
});

try {
  fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 2));
  console.log("✅ XP와 뱃지가 업데이트되었습니다!");
} catch (e) {
  console.error("❌ xp.json 저장 실패:", e.message);
}

```

---

## 3. `scripts/updateReadme.js`
(출석 최종 조건을 133일로 수정)

```js
const fs = require("fs");

const xpData = JSON.parse(fs.readFileSync("xp.json", "utf-8"));
let readme = fs.readFileSync("README.md", "utf-8");

const emojiMap = { "홍길동": "👾", "김철수": "⚔️", "이영희": "🌸" };
const badgeColorMap = {
  "개근왕": "green", "출석마스터": "blue", "끝까지함께": "gold",
  "과제왕": "purple", "성실제출자": "orange", "챌린지완료": "red",
  "팀플마스터": "lightblue", "코드기여자": "brown", "발표왕": "yellow",
  "성장중": "pink", "레벨업마스터": "teal", "최종보스클리어": "black"
};

Object.keys(xpData).forEach(student => {
  const emoji = emojiMap[student] || "🎓";
  const { attendanceDays, xp, level, badges } = xpData[student];

  const attendanceBadge = `![출석뱃지](https://img.shields.io/badge/출석-${attendanceDays}일-blue?style=flat)`;
  const xpBadge = `![XP](https://img.shields.io/badge/XP-${xp}-yellow?style=flat)`;
  const levelBadge = `![Level](https://img.shields.io/badge/Level-${level}-orange?style=flat)`;

  const badgeList = badges.length > 0
    ? badges.map(b => {
        const color = badgeColorMap[b] || "grey";
        return `![Badge-${b}](https://img.shields.io/badge/Badge-${encodeURIComponent(b)}-${color}?style=flat)`;
      }).join(" ")
    : `![Badge](https://img.shields.io/badge/Badge-없음-lightgrey?style=flat)`;

  const badgesRow = `${attendanceBadge} ${xpBadge} ${levelBadge} ${badgeList}`;
  const levelGraph = `\`\`\`\nLevel ${level} | ${"🟩".repeat(level)} (${level})\n\`\`\``;

  const regex = new RegExp(`<!-- ${student}-badge-start -->[\\s\\S]*<!-- ${student}-badge-end -->`, "g");
  const replacement = `<!-- ${student}-badge-start -->\n${badgesRow}\n\n**레벨 그래프**\n${levelGraph}\n<!-- ${student}-badge-end -->`;

  const nameRegex = new RegExp(`##\\s*${student}`, "g");
  readme = readme.replace(nameRegex, `## ${emoji} ${student}`);
  readme = readme.replace(regex, replacement);
});

fs.writeFileSync("README.md", readme);
console.log("✅ README 업데이트 완료!");

```

---

## 4. `README.md`
(133일 기준으로 설명 수정)

```markdown
# 🎮 FULLSTACK 학습 RPG 시스템 (133일 과정 기준)

### 🏅 뱃지 종류 안내 (133일 과정 기준)
| 카테고리   | 뱃지 이름       | 색상      | 조건 |
|------------|----------------|-----------|------|
| 출석       | 개근왕         | green     | 출석 30일 이상 |
| 출석       | 출석마스터     | blue      | 출석 60일 이상 |
| 출석       | 끝까지함께     | gold      | 133일 모두 출석 |
| 과제       | 과제왕         | purple    | 모든 과제 제출 |
| 과제       | 성실제출자     | orange    | 과제 80% 이상 제출 |
| 과제       | 챌린지완료     | red       | 특별 프로젝트 달성 또는 XP ≥ 500 |
| 협업/활동  | 팀플마스터     | lightblue | 팀 프로젝트 기여 (출석 ≥ 15일) |
| 협업/활동  | 코드기여자     | brown     | 깃허브 PR/커밋 10회 이상 |
| 협업/활동  | 발표왕         | yellow    | 발표 참여 3회 이상 |
| 성장       | 성장중         | pink      | XP ≥ 200 |
| 성장       | 레벨업마스터   | teal      | 레벨 5 이상 |
| 성장       | 최종보스클리어 | black     | 레벨 10 이상 |

---


### 📊 XP 및 레벨 계산 규칙

- 출석: 하루 출석 시 10 XP  
- 과제: 과제 제출 1개당 20 XP  
- 팀 프로젝트 참여: 30 XP  
- 코드 기여 (깃허브 PR/커밋): 10 XP  
- 발표 참여: 20 XP  
- 특별 챌린지 과제: 50 XP  

총 XP = 출석 XP + 과제 XP + 팀플 XP + 코드 기여 XP + 발표 XP  

---

### 🧩 레벨 계산 규칙

- 레벨은 125 XP마다 1레벨 업  
- 과정(125일) 종료 시 최대 레벨 10 달성 가능  
- 예시:  
  - XP 0~124 → Level 1  
  - XP 125~249 → Level 2  
  - XP 250~374 → Level 3  
  - ...  
  - XP ≥ 1125 → Level 10  

---

### 🔥 챌린지 완료 조건 다양화

| 챌린지 이름       | 조건 |
|-------------------|------|
| 출석 챌린지       | 30일 연속 개근 |
| 과제 챌린지       | 과제 20개 이상 제출 |
| 협업 챌린지       | 팀 프로젝트 2회 이상 주도 |
| 코드 챌린지       | 깃허브 PR/커밋 50회 이상 |
| 발표 챌린지       | 발표 5회 이상 |
| XP 챌린지         | XP ≥ 1000 |
| 스피드런 챌린지   | 30일 이내 레벨 5 달성 |
| 올라운더 챌린지   | 출석·과제·팀플·발표·코드 기여 모두 최소 1회 이상 |
| 마스터 챌린지     | 모든 뱃지 획득 |
| 커뮤니티 챌린지   | 다른 학습자에게 코드 리뷰/멘토링 3회 이상 |

---

### 🌐 추천 챌린지

| 챌린지 이름        | 조건 |
|--------------------|------|
| 블로그왕           | 학습 블로그 글 5개 이상 작성 |
| 튜토리얼 제작자    | 튜토리얼/가이드 2개 이상 공유 |
| 디버깅 마스터      | 다른 학습자의 코드 버그 5개 이상 해결 |
| 스터디 리더        | 스터디 그룹을 조직하고 3회 이상 운영 |
| 지식 공유자        | 커뮤니티 발표/세션 2회 이상 진행 |
| 아이디어 메이커    | 새로운 프로젝트 아이디어 제안 3회 이상 |
| 챌린지 헌터        | 추천 챌린지 중 5개 이상 달성 |
| 커뮤니티 스타      | 커뮤니티 내 좋아요/응원 50회 이상 받기 |

---

## 🌳 루트별 챌린지 트리

### 1. 출석 루트
- 개근왕 → 출석 30일 이상  
- 출석마스터 → 출석 60일 이상  
- 끝까지함께 → 125일 모두 출석  
- 출석 챌린지 → 30일 연속 개근  

### 2. 과제 루트
- 성실제출자 → 과제 80% 이상 제출  
- 과제왕 → 모든 과제 제출  
- 과제 챌린지 → 과제 20개 이상 제출  
- 챌린지완료 → 특별 프로젝트 달성 또는 XP ≥ 500  

### 3. 협업/활동 루트
- 팀플마스터 → 팀 프로젝트 기여  
- 코드기여자 → 깃허브 PR/커밋 10회 이상  
- 발표왕 → 발표 참여 3회 이상  
- 협업 챌린지 → 팀 프로젝트 2회 이상 주도  
- 코드 챌린지 → 깃허브 PR/커밋 50회 이상  
- 발표 챌린지 → 발표 5회 이상  

### 4. 성장 루트
- 성장중 → XP ≥ 200  
- 레벨업마스터 → 레벨 5 이상  
- 최종보스클리어 → 레벨 10 이상  
- XP 챌린지 → XP ≥ 1000  
- 스피드런 챌린지 → 30일 이내 레벨 5 달성  

### 5. 커뮤니티 루트
- 커뮤니티 챌린지 → 코드 리뷰/멘토링 3회 이상  
- 멘토링 챌린지 → 다른 학습자에게 1:1 멘토링 3회 이상  
- 리뷰어 챌린지 → 깃허브 코드 리뷰 5회 이상  
- 질문왕 챌린지 → Q&A 질문 10회 이상  
- 답변왕 챌린지 → Q&A 답변 10회 이상  
- 피드백 챌린지 → 다른 학습자의 과제/프로젝트 피드백 5회 이상  
- 네트워커 챌린지 → 커뮤니티 이벤트/스터디 모임 3회 이상 참여  
- 커뮤니티 리더 → 팀/스터디 그룹 조직 및 운영  

### 6. 추천 챌린지 루트
- 블로그왕 → 학습 블로그 글 5개 이상 작성  
- 튜토리얼 제작자 → 튜토리얼/가이드 2개 이상 공유  
- 디버깅 마스터 → 다른 학습자의 코드 버그 5개 이상 해결  
- 스터디 리더 → 스터디 그룹 운영 3회 이상  
- 지식 공유자 → 커뮤니티 발표/세션 2회 이상 진행  
- 아이디어 메이커 → 프로젝트 아이디어 제안 3회 이상  
- 챌린지 헌터 → 추천 챌린지 중 5개 이상 달성  
- 커뮤니티 스타 → 커뮤니티 내 좋아요/응원 50회 이상 받기  

---

### 💡 핵심
- Level 10은 끝이 아니라, 다양한 루트에서 챌린지를 클리어하며 뱃지를 모으는 과정  
- 학습자는 꾸준형·열정형·올라운더형·커뮤니티형·창의형 등 다양한 플레이 스타일을 선택 가능  
- 최종 목표는 단순히 레벨업이 아니라, 얼마나 많은 챌린지를 클리어했느냐  






---


#### 👾 홍길동
<!-- 홍길동-badge-start -->
![출석뱃지](https://img.shields.io/badge/출석-9일-blue?style=flat) ![XP](https://img.shields.io/badge/XP-90-yellow?style=flat) ![Level](https://img.shields.io/badge/Level-1-orange?style=flat) ![Badge](https://img.shields.io/badge/Badge-없음-lightgrey?style=flat)

**레벨 그래프**
```
Level 1 | 🟩 (1)
```
<!-- 홍길동-badge-end -->

---

#### ⚔️ 김철수
<!-- 김철수-badge-start -->
![출석뱃지](https://img.shields.io/badge/출석-12일-blue?style=flat) ![XP](https://img.shields.io/badge/XP-120-yellow?style=flat) ![Level](https://img.shields.io/badge/Level-1-orange?style=flat) ![Badge](https://img.shields.io/badge/Badge-없음-lightgrey?style=flat)

**레벨 그래프**
```
Level 1 | 🟩 (1)
```
<!-- 김철수-badge-end -->

---

#### 🌸 이영희
<!-- 이영희-badge-start -->
![출석뱃지](https://img.shields.io/badge/출석-6일-blue?style=flat) ![XP](https://img.shields.io/badge/XP-60-yellow?style=flat) ![Level](https://img.shields.io/badge/Level-1-orange?style=flat) ![Badge](https://img.shields.io/badge/Badge-없음-lightgrey?style=flat)

**레벨 그래프**
```
Level 1 | 🟩 (1)
```
<!-- 이영희-badge-end -->

 

```



■5.
└── .github/
    └── workflows/
        └── attendance.yml  # 자동 실행 워크플로우

```
name: Attendance Badge & XP System

on:
  push:
    paths:
      - "attendance/**"

permissions:
  contents: write   # ✅ 저장소에 commit/push 권한 부여            

jobs:
  update-xp-and-readme:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}   # ✅ GitHub Token 사용

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Run XP & Badge Calculation
        run: node scripts/calcXP.js

      - name: Update README
        run: node scripts/updateReadme.js

      - name: Commit changes
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add xp.json README.md
          git commit -m "Update XP, badges, and README" || echo "No changes to commit"
          git remote set-url origin https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }}
          git push origin HEAD:${{ github.ref }}

```        
