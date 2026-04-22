// 0422xiaoli_task_final.js

const BASE = "https://dt.yuanhukj.com/api";

function loadReq() {
  let raw = $prefs.valueForKey("0422xiaoli");
  if (!raw) {
    $notify("❌错误", "", "没有抓到请求");
    return null;
  }
  return JSON.parse(raw);
}

function fetch(req) {
  return $task.fetch(req).then(res => {
    try {
      return JSON.parse(res.body);
    } catch {
      return {};
    }
  });
}

!(async () => {

  let saved = loadReq();
  if (!saved) return;

  let headers = saved.headers;

  // 👉 提取URL参数
  let urlObj = new URL(saved.url);
  let baseParams = urlObj.search;
  let activityId = urlObj.searchParams.get("activityId");

  if (!activityId) {
    $notify("❌错误", "", "activityId 获取失败");
    return;
  }

  console.log(`🎯 活动ID: ${activityId}`);

  // =========================
  // 1️⃣ 获取答案
  // =========================
  let info = await fetch({
    method: "GET",
    url: `${BASE}/videoQuiz/getActivityById${baseParams}`,
    headers
  });

  let data = info.data || {};
  let answer = data.correctOption;

  if (!answer) {
    $notify("❌失败", "", "未获取到答案");
    return;
  }

  console.log(`✅ 答案: ${answer}`);

  // =========================
  // 2️⃣ 参与
  // =========================
  let join = await fetch({
    method: "GET",
    url: `${BASE}/videoQuiz/userParticipate${baseParams}&isParticipate=1`,
    headers
  });

  console.log("📌 参与:", join.msg || "OK");

  // =========================
  // 3️⃣ 答题
  // =========================
  await fetch({
    method: "GET",
    url: `${BASE}/videoQuiz/submitAnswer${baseParams}&answerOption=${answer}`,
    headers
  });

  console.log("🧠 已提交答案");

  // =========================
  // 4️⃣ 领奖
  // =========================
  let reward = await fetch({
    method: "POST",
    url: `${BASE}/mobile/pay/pay-payment-channel/addUserWithdraw`,
    headers: {
      ...headers,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: baseParams.replace("?", "") +
          `&videoQuizActivityId=${activityId}&isIntroVideo=${data.isIntroVideo || 0}`
  });

  let r = reward.data || {};
  let money = parseFloat(r.withdrawAmount || 0);
  let msg = r.reason || reward.msg || "未知";

  console.log(`💰 领奖: ${msg} | ${money}`);

  // =========================
  // 完成通知
  // =========================
  $notify("🎉答题完成", `活动ID: ${activityId}`, `收益：${money.toFixed(2)}`);

})()
.finally(() => {
  // 🔥 关键：确保脚本一定结束
  $done();
});
