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

  xpData[name].badges = badges;
});

try {
  fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 2));
  console.log("✅ XP와 뱃지가 업데이트되었습니다!");
} catch (e) {
  console.error("❌ xp.json 저장 실패:", e.message);
}