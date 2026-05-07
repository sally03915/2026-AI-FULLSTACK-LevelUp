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
  const {
    name,
    attendanceDays = 0,
    assignmentsCompleted = 0,
    totalAssignments = 0,
    contributions = 0,
    presentations = 0,
    blogsWritten = 0,
    tutorialsShared = 0,
    bugsFixed = 0,
    studySessions = 0,
    ideasProposed = 0,
    likesReceived = 0
  } = student;

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
    blogsWritten,
    tutorialsShared,
    bugsFixed,
    studySessions,
    ideasProposed,
    likesReceived,
    badges: []
  };

  // ✅ 뱃지 조건
  let badges = [];

  // 출석 관련
  if (attendanceDays >= 30) badges.push("개근왕");
  if (attendanceDays >= 60) badges.push("출석마스터");
  if (attendanceDays >= 133) badges.push("끝까지함께");

  // 과제 관련
  if (totalAssignments > 0) {
    const ratio = assignmentsCompleted / totalAssignments;
    if (ratio === 1) badges.push("과제왕");
    else if (ratio >= 0.8) badges.push("성실제출자");
  }
  if (xp >= 500) badges.push("챌린지완료");

  // 협업/활동 관련
  if (attendanceDays >= 15) badges.push("팀플마스터");
  if (contributions >= 10) badges.push("코드기여자");
  if (presentations >= 3) badges.push("발표왕");

  // 성장 관련
  if (xp >= 200) badges.push("성장중");
  if (level >= 5) badges.push("레벨업마스터");
  if (level >= 10) badges.push("최종보스클리어");

  // ✅ 추천 챌린지 관련
  if (blogsWritten >= 5) badges.push("블로그왕");
  if (tutorialsShared >= 2) badges.push("튜토리얼 제작자");
  if (bugsFixed >= 5) badges.push("디버깅 마스터");
  if (studySessions >= 3) badges.push("스터디 리더");
  if (presentations >= 2) badges.push("지식 공유자");
  if (ideasProposed >= 3) badges.push("아이디어 메이커");

  // 🔥 챌린지 완료 조건 다양화
  if (attendanceDays >= 30) badges.push("출석 챌린지"); // 30일 연속 개근
  if (assignmentsCompleted >= 20) badges.push("과제 챌린지"); // 과제 20개 이상 제출
  if (student.teamProjectsLed >= 2) badges.push("협업 챌린지"); // 팀 프로젝트 2회 이상 주도
  if (contributions >= 50) badges.push("코드 챌린지"); // 깃허브 PR/커밋 50회 이상
  if (presentations >= 5) badges.push("발표 챌린지"); // 발표 5회 이상
  if (xp >= 1000) badges.push("XP 챌린지"); // XP ≥ 1000
  if (level >= 5 && attendanceDays <= 30) badges.push("스피드런 챌린지"); // 30일 이내 레벨 5 달성
  if (attendanceDays > 0 && assignmentsCompleted > 0 && contributions > 0 && presentations > 0 && student.teamProjectsLed > 0) {
    badges.push("올라운더 챌린지"); // 모든 활동 최소 1회 이상
  }
  if (badges.length >= Object.keys(badgeColorMap).length) badges.push("마스터 챌린지"); // 모든 뱃지 획득
  if (student.codeReviews >= 3) badges.push("커뮤니티 챌린지"); // 코드 리뷰/멘토링 3회 이상



  // 챌린지 헌터: 추천 챌린지 중 5개 이상 달성
  const challengeCount = badges.filter(b =>
    ["블로그왕","튜토리얼 제작자","디버깅 마스터","스터디 리더","지식 공유자","아이디어 메이커"].includes(b)
  ).length;
  if (challengeCount >= 5) badges.push("챌린지 헌터");

  // 커뮤니티 스타
  if (likesReceived >= 50) badges.push("커뮤니티 스타");

  xpData[name].badges = badges;
});

try {
  fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 2));
  console.log("✅ XP와 뱃지가 업데이트되었습니다!");
} catch (e) {
  console.error("❌ xp.json 저장 실패:", e.message);
}
