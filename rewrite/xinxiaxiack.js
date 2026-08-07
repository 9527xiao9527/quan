/*************************************************
 * screening watch 参数捕获（Rewrite）
 * 保存变量：xiaxia
 * 格式：host#Authorization#body
 *************************************************/

// 仅处理 watch 请求
if (!$request.url.includes("/api-h5/screening/watch")) {
  $done({});
  return;
}

// Host
const host = $request.headers["Host"] || $request.headers["host"];

// Authorization
const auth =
  $request.headers["Authorization"] ||
  $request.headers["authorization"];

// 请求体
let body;
try {
  body = JSON.parse($request.body || "{}");
} catch (e) {
  $done({});
  return;
}

if (!host || !auth || !body.roomId) {
  $done({});
  return;
}

// 保留需要参数
const data = {
  roomId: body.roomId,
  inviteCode: body.inviteCode,
  shopId: body.shopId,
  shareUserId: body.shareUserId
};

// 保存
const value = `${host}#${auth}#${JSON.stringify(data)}`;

$prefs.setValueForKey(value, "xiaxia");

// 通知显示抓取内容
$notify(
  "✅ xiaxia抓取成功",
  "",
  value
);

$done({});