/**
 * 功能：
 * 1️⃣ 拦截 class/info 接口
 * 2️⃣ 提取参数写入本地（保留）
 * 3️⃣ 重写 playOver = 1
 * 4️⃣ 通知只显示答案
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

      // 重写播放状态
      if (info.classUser && info.classUser.playOver !== undefined) {
        info.classUser.playOver = 1;
      }

      // 解析题目答案
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

// ========== 保存变量（保留） ==========
let save =
  `host=${host}` +
  `#token=${token}` +
  `#classId=${classId}` +
  `#sessionId=${sessionId}` +
  `#periodId=${periodId}` +
  `#played=${playedDuration}` +
  `#questions=${encodeURIComponent(JSON.stringify(questions))}`;

// ========== 生成通知（只显示答案） ==========
let answerText = "答案：\n";

if (questions.length > 0) {
  questions.forEach((q, i) => {
    answerText += `第${i + 1}题：${q.answer.join(",")}\n`;
  });
} else {
  answerText += "暂无题目";
}

// ========== 仅变化时保存 ==========
if (save !== old) {
  $prefs.setValueForKey(save, KEY); // ✅ 这里仍然保存
  $notify("guoyi已获取", "", answerText); // ✅ 这里只显示答案
}

// ========== 返回 ==========
$done({
  body: JSON.stringify(bodyObj)
});
