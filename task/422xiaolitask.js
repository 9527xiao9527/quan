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
      return res.body;
    }
  });
}

function buildUrl(baseUrl, params) {
  let u = baseUrl.split("?")[0];
  return u + "?" + params;
}

!(async () => {

  let saved = loadReq();
  if (!saved) return;

  let headers = saved.headers;

  // 👉 从抓包URL提取公共参数
  let urlObj = new URL(saved.url);
  let baseParams = urlObj.search;

  // 👉 自动识别 activityId（也可以手动改）
  let activityId = urlObj.searchParams.get("activityId");

  console.log("使用活动ID:", activityId);

  let total = 0;

  // 1️⃣ 获取答案
  let info = await fetch({
    method: "GET",
    url: `${BASE}/videoQuiz/getActivityById${baseParams}`,
    headers
  });

  let data = info.data || {};
  let answer = data.correctOption;

  if (!answer) {
    $notify("❌失败", "", "没拿到答案");
    return;
  }

  console.log("答案:", answer);

  // 2️⃣ 参与
  await fetch({
    method: "GET",
    url: `${BASE}/videoQuiz/userParticipate${baseParams}&isParticipate=1`,
    headers
  });

  // 3️⃣ 提交答案
  await fetch({
    method: "GET",
    url: `${BASE}/videoQuiz/submitAnswer${baseParams}&answerOption=${answer}`,
    headers
  });

  // 4️⃣ 领奖
  let reward = await fetch({
    method: "POST",
    url: `${BASE}/mobile/pay/pay-payment-channel/addUserWithdraw`,
    headers: {
      ...headers,
      "content-type": "application/x-www-form-urlencoded"
    },
    body: baseParams.replace("?", "") + `&videoQuizActivityId=${activityId}&isIntroVideo=${data.isIntroVideo || 0}`
  });

  let r = reward.data || {};
  let money = parseFloat(r.withdrawAmount || 0);

  total += money;

  console.log("奖励:", money);

  $notify("🎉答题完成", "", `收益：${total.toFixed(2)}`);

})().catch(e => {
  $notify("❌错误", "", e.message);
});
