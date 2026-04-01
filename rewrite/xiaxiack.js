/*********************************
 * screening 参数捕获（Rewrite）
 * 保存变量：xiaxia
 * 格式：host#Authorization#body
 *********************************/

// ===== 1. 提取 Host =====
const host = $request.headers["Host"] || $request.headers["host"];
if (!host) {
  console.log("❌ 未获取 Host");
  $done({});
  return;
}

// ===== 2. 提取 Authorization =====
const auth =
  $request.headers["Authorization"] ||
  $request.headers["authorization"];

if (!auth) {
  console.log("❌ 未获取 Authorization");
  $done({});
  return;
}

// ===== 3. 解析请求体 =====
let bodyObj;
try {
  bodyObj = JSON.parse($request.body || "{}");
} catch (e) {
  console.log("❌ 请求体不是 JSON");
  $done({});
  return;
}

const roomId = bodyObj.roomId;
const shareUserId = bodyObj.shareUserId;
const inviteCode = bodyObj.inviteCode;

if (!roomId || !shareUserId || !inviteCode) {
  console.log("❌ body 参数不完整");
  $done({});
  return;
}

// ===== 4. 写入本地变量 =====
const value = `${host}#${auth}#${JSON.stringify({
  roomId,
  shareUserId,
  inviteCode
})}`;

$prefs.setValueForKey(value, "xiaxia");

// ===== 5. 通知 =====
$notify(
  "✅ screening 参数捕获成功",
  `roomId：${roomId}`,
  "已写入本地变量 xiaxia"
);

$done({});
