/**
 * 新小 click - 提取 host / activityId / token
 * 保存变量：xinxiaoliid
 * 格式：host#id#token
 */

if (!$request || !$request.url || !$request.headers) {
  $done({});
  return;
}

/* ===== 1️⃣ 提取 host ===== */
const url = $request.url;
let host = "";

try {
  host = url.match(/^https?:\/\/([^\/]+)/)[1];
} catch (e) {}

/* ===== 2️⃣ 提取 activityId ===== */
let activityId = "";
try {
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) activityId = idMatch[1];
} catch (e) {}

/* ===== 3️⃣ 提取 token ===== */
const headers = $request.headers;
let token =
  headers["Authorization"] ||
  headers["authorization"] ||
  headers["AUTHORIZATION"] ||
  "";

// 去掉 Bearer 前缀
token = token.replace(/^Bearer\s+/i, "");

/* ===== 校验 ===== */
if (!host || !activityId || !token) {
  console.log("[xinxiaoli] 提取失败", { host, activityId, token });
  $done({});
  return;
}

/* ===== 4️⃣ 写入本地变量（覆盖写） ===== */
const value = `${host}#${activityId}#${token}`;
$prefs.setValueForKey(value, "xinxiaoliid");

/* ===== 日志 ===== */
console.log("[xinxiaoli] 已写入 xinxiaoliid");
console.log(value);

// 可选通知（嫌烦可以删）
$notify(
  "0122小丽✅",
  "",
  `host=${host}\nid=${activityId}`
);

$done({});
