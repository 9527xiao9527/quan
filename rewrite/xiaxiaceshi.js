/***********************************
 * screening 全流程 Task（圈 X）
 * 依赖 Rewrite 写入变量：xiaxia
 * 格式：host#Authorization#body
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
  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/entry`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, shareUserId, inviteCode })
  });
  const obj = JSON.parse(res.body || "{}");
  const shopId = obj?.data?.shopId;
  if (!shopId) throw "Step1 未获取 shopId";
  return shopId;
}

// ========= Step 2：watch → watchRecordId =========
async function step2(shopId) {
  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/watch`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, shopId, shareUserId, inviteCode })
  });
  const obj = JSON.parse(res.body || "{}");
  const watchRecordId = obj?.data?.watchRecordId;
  if (!watchRecordId) throw "Step2 未获取 watchRecordId";
  return watchRecordId;
}

// ========= Step 3：completed =========
async function step3(watchRecordId) {
  await $task.fetch({
    url: `${BASE}/api-h5/screening/completed`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, watchRecordId })
  });
}

// ========= Step 4：record-answer =========
async function step4(watchRecordId) {
  await $task.fetch({
    url: `${BASE}/api-h5/screening/record-answer`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId, watchRecordId })
  });
}

// ========= Step 5：answer =========
async function step5(watchRecordId) {
  await $task.fetch({
    url: `${BASE}/api-h5/screening/answer`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      roomId,
      watchRecordId,
      answerState: 1
    })
  });
}

// ========= Step 6：getRewardResult =========
async function step6() {
  const res = await $task.fetch({
    url: `${BASE}/api-h5/screening/v2/getRewardResult`,
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ roomId })
  });
  const obj = JSON.parse(res.body || "{}");
  return obj.data || {};
}

// ========= 执行入口 =========
(async () => {
  try {
    const shopId = await step1();
    const watchRecordId = await step2(shopId);
    await step3(watchRecordId);
    await step4(watchRecordId);
    await step5(watchRecordId);
    //const reward = await step6();

    $notify(
      "🎉完成",
      `roomId：${roomId}`,
      `完成奖励`
    );

  } catch (e) {
    $notify("❌ screening 执行失败", "", String(e));
  }
  $done();
})();
