/*********************************
 * screening watch 参数捕获（Rewrite）
 * 保存变量：xiaxia
 * 格式：host#Authorization#body
 *********************************/

// ===== 1. 仅处理 watch 请求 =====
const url = $request.url;
if (!url || !url.includes("/api-h5/screening/watch")) {
  console.log("⏭️ 非 watch 请求，跳过");
  $done({});
  return;
}

// ===== 2. 提取 Host =====
const host = $request.headers["Host"] || $request.headers["host"];
if (!host) {
  console.log("❌ 未获取 Host");
  $done({});
  return;
}

// ===== 3. 提取 Authorization =====
const auth =
  $request.headers["Authorization"] ||
  $request.headers["authorization"];

if (!auth) {
  console.log("❌ 未获取 Authorization");
  $done({});
  return;
}

// ===== 4. 解析请求体 =====
let bodyObj;
try {
  bodyObj = JSON.parse($request.body || "{}");
} catch (e) {
  console.log("❌ 请求体不是 JSON");
  $done({});
  return;
}

const roomId = bodyObj.roomId;
const inviteCode = bodyObj.inviteCode;
const shopId = bodyObj.shopId;
const shareUserId = bodyObj.shareUserId;
const requestOrigin = bodyObj.requestOrigin || "WECHAT_MINI";

if (!roomId || !inviteCode || !shopId || !shareUserId) {
  console.log("❌ watch body 参数不完整");
  $done({});
  return;
}

// ===== 5. 写入本地变量 =====
const value = `${host}#${auth}#${JSON.stringify({
  roomId,
  inviteCode,
  shopId,
  shareUserId,
  requestOrigin
})}`;

$prefs.setValueForKey(value, "xiaxia");

// ===== 6. 通知 =====
$notify(
  "✅ screening watch 参数捕获成功",
  `roomId：${roomId}，shopId：${shopId}`,
  "已写入本地变量 xiaxia"
);

$done({});
