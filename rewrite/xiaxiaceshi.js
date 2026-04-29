/***********************************
 * screening 全流程 Task（圈 X）
 * 仅新增：
 * ✅ online 上报
 * ✅ 全步骤日志
 ***********************************/

// ========= 读取本地变量 =========
const raw = $prefs.valueForKey("xiaxia");
if (!raw) {
  $notify("❌ screening", "", "未找到本地变量 xiaxia");
  $done();
  return;
}

const [host, Authorization, bodyStr] = raw.split("#");

let body;
try {
  body = JSON.parse(bodyStr);
} catch (e) {
  $notify("❌ screening", "", "xiaxia 中 body 解析失败");
  $done();
  return;
}

const roomId = body.roomId;
const shareUserId = body.shareUserId;
const inviteCode = body.inviteCode;

if (!host || !Authorization || !roomId || !shareUserId || !inviteCode) {
  $notify("❌ screening", "", "xiaxia 参数不完整");
  $done();
  return;
}

const BASE = `https://${host}`;

// ========= 通用请求头 =========
function headers() {
  return {
    "Accept-Encoding": "gzip,compress,br,deflate",
    "content-type": "application/json",
    "Connection": "keep-alive",
    "Referer": "https://servicewechat.com/wx1be11d4392e3914c/1/page-frame.html",
    "Host": host,
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.63",
    "Authorization": Authorization
  };
}

// ========= Step 1：entry → shopId =========
async function step1() {
  console.log("👉 Step1 entry 开始");

  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/entry`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, shareUserId, inviteCode })
  });

  console.log("📥 Step1 返回:", res.body);

  const obj = JSON.parse(res.body || "{}");
  const shopId = obj?.data?.shopId;
  const duration = obj?.data?.video?.duration || 0;

  console.log(`✅ Step1 shopId: ${shopId}`);
  console.log(`🎬 Step1 duration: ${duration}`);

  if (!shopId) throw "Step1 未获取 shopId";

  return { shopId, duration };
}

// ========= Step 2：watch → watchRecordId =========
async function step2(shopId) {
  console.log("👉 Step2 watch 开始");

  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/watch`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, shopId, shareUserId, inviteCode })
  });

  console.log("📥 Step2 返回:", res.body);

  const obj = JSON.parse(res.body || "{}");
  const watchRecordId = obj?.data?.watchRecordId;

  console.log(`✅ Step2 watchRecordId: ${watchRecordId}`);

  if (!watchRecordId) throw "Step2 未获取 watchRecordId";

  return watchRecordId;
}

// ========= Step 2.5：online 上报 =========
async function stepOnline(watchRecordId, duration) {
  console.log("👉 Step2.5 online 开始");

  const bodyData = {
    roomId,
    inviteCode,
    shareUserId,
    watchRecordId,
    onlineDuration: duration,
    totalDuration: duration
  };

  console.log("📤 online 请求体:", JSON.stringify(bodyData));

  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/online`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify(bodyData)
  });

  console.log("📥 Step2.5 返回:", res.body);
}

// ========= Step 3：completed =========
async function step3(watchRecordId) {
  console.log("👉 Step3 completed 开始");

  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/completed`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, watchRecordId })
  });

  console.log("📥 Step3 返回:", res.body);
}

// ========= Step 4：record-answer =========
async function step4(watchRecordId) {
  console.log("👉 Step4 record-answer 开始");

  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/record-answer`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, watchRecordId })
  });

  console.log("📥 Step4 返回:", res.body);
}

// ========= Step 5：answer =========
async function step5(watchRecordId) {
  console.log("👉 Step5 answer 开始");

  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/answer`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      roomId,
      watchRecordId,
      answerState: 1
    })
  });

  console.log("📥 Step5 返回:", res.body);
}

// ========= Step 6：getRewardResult =========
async function step6() {
  console.log("👉 Step6 reward 开始");

  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/v2/getRewardResult`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId })
  });

  console.log("📥 Step6 返回:", res.body);

  const obj = JSON.parse(res.body || "{}");
  return obj.data || {};
}

// ========= 执行入口 =========
(async () => {
  try {
    console.log("🚀 screening 开始执行");

    const { shopId, duration } = await step1();
    const watchRecordId = await step2(shopId);

    await stepOnline(watchRecordId, duration); // ✅ 新增

    await step3(watchRecordId);
    await step4(watchRecordId);
    await step5(watchRecordId);

    const reward = await step6();

    console.log("🎁 奖励结果:", JSON.stringify(reward));

    $notify(
      "🎉完成",
      `roomId：${roomId}`,
      `流程已执行完成`
    );

  } catch (e) {
    console.log("❌ 错误:", e);
    $notify("❌ screening 执行失败", "", String(e));
  }
  $done();
})();
