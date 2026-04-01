

/**
 * 功能：
 * 1️⃣ 拦截 class/info 接口
 * 2️⃣ 提取参数写入本地
 * 3️⃣ 同时将 info.classUser.playOver 重写为 1
 * 输出格式：
 * host=xxx#token=xxx#classId=xxx#sessionId=xxx#periodId=xxx#played=xxx#questions=xxx
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

// ========== 初始化变量 ==========
let classId = "";
let sessionId = "";
let periodId = "";
let playedDuration = 0;
let questions = [];

let bodyObj;

// ========== 解析响应体 ==========
if ($response && $response.body) {
  try {
    bodyObj = JSON.parse($response.body);

    const info = bodyObj.info;
    if (info) {
      classId = info.id;
      sessionId = info.sessionId;
      periodId = info.periodId;
      playedDuration = info.duration || 0;

      // ====== 重写 playOver ======
      if (info.classUser && info.classUser.playOver !== undefined) {
        info.classUser.playOver = 1;
      }

      // ====== 解析题目 ======
      (info.questions || []).forEach(q => {
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
    console.log("❌ 解析响应失败:", e);
  }
}

// ========== 组合保存内容 ==========
let save =
  `host=${host}` +
  `#token=${token}` +
  `#classId=${classId}` +
  `#sessionId=${sessionId}` +
  `#periodId=${periodId}` +
  `#played=${playedDuration}` +
  `#questions=${encodeURIComponent(JSON.stringify(questions))}`;

// ========== 变更才保存 ==========
if (save !== old) {
  $prefs.setValueForKey(save, KEY);
  $notify("guoyi已获取", "", save);
}

// ========== 返回被修改后的响应体 ==========
$done({
  body: JSON.stringify(bodyObj)
});
