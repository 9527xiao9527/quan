/**
 * 功能：
 * 1️⃣ 拦截 class/info 接口
 * 2️⃣ 提取参数写入本地（保留）
 * 3️⃣ 重写 playOver = 1
 * 4️⃣ 通知显示答案 + 达标时长 + 红包
 */

const KEY = "xk_params";

// 读取旧数据
let old = $prefs.valueForKey(KEY) || "";

// ========== 获取 host ==========
let url = $request.url;
let host = "";
try {
  host = url.match(/^https?:\/\/([^\/]+)/)[1];
} catch (e) {}

// ========== 获取 token ==========
let token = "";
try {
  token = $request.headers["token"] || $request.headers["Token"] || "";
} catch (e) {}

// ========== 初始化 ==========
let classId = "";
let sessionId = "";
let periodId = "";
let playedDuration = 0;
let questions = [];

let bodyObj;

// ========== 解析响应 ==========
if ($response && $response.body) {
  try {
    bodyObj = JSON.parse($response.body);

    const info = bodyObj.info;
    if (info) {
      classId = info.id;
      sessionId = info.sessionId;
      periodId = info.periodId;
      playedDuration = info.duration || 0;

      // ✅ 重写播放状态
      if (info.classUser && info.classUser.playOver !== undefined) {
        info.classUser.playOver = 1;
      }

      // ✅ 解析题目答案
      (info.questions || []).forEach((q, i) => {
        let right = (q.options || [])
          .filter(o => o.rightAnswer === 1)
          .map(o => o.option);

        questions.push({
          questionId: q.id,
          answer: right
        });
      });
    }
  } catch (e) {
    console.log("❌ 解析失败:", e);
  }
}

// ========== 保存变量 ==========
let save =
  `host=${host}` +
  `#token=${token}` +
  `#classId=${classId}` +
  `#sessionId=${sessionId}` +
  `#periodId=${periodId}` +
  `#played=${playedDuration}` +
  `#questions=${encodeURIComponent(JSON.stringify(questions))}`;

// ========== 生成通知（答案） ==========
let answerText = "答案：\n";

if (questions.length > 0) {
  questions.forEach((q, i) => {
    answerText += `第${i + 1}题：${q.answer.join(",")}\n`;
  });
} else {
  answerText += "暂无题目";
}

// ========== ✅ 只额外增加：达标时长 + 红包 ==========
let needPlaySeconds = 0;
let redPackMoney = 0;

if (bodyObj && bodyObj.info) {
  const info = bodyObj.info;

  const duration = info.duration || 0;
  const percent = info.classSettings?.playOverCondition || 0;

  // 达标时长（秒）
  needPlaySeconds = Math.floor(duration * percent / 100);

  // 红包金额（元）
  redPackMoney = (info.classSettings?.redPackReward || 0) / 100;
}

// 👉 追加两行
answerText += `\n⏱ 达标时长：${needPlaySeconds}s`;
answerText += `\n💰 红包：${redPackMoney}元`;

// ========== 仅变化时保存 ==========
if (save !== old) {
  $prefs.setValueForKey(save, KEY);
  $notify("guoyi已获取", "", answerText);
}

// ========== 返回 ==========
$done({
  body: JSON.stringify(bodyObj)
});