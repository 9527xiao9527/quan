/**
 * 新小click - 提取 host / acid / token
 * 写入变量：xinxiaoliid
 * 格式：host#acid#token
 */

const url = $request.url;
const headers = $request.headers;

// ===== 提取 host =====
const host = url.match(/^https:\/\/([^\/]+)/)?.[1];

// ===== 提取 acid =====
const acid = url.match(/[?&]id=([^&]+)/)?.[1];

// ===== 提取 Authorization token =====
let auth = headers["Authorization"] || headers["authorization"];
let token = "";

if (auth && auth.startsWith("Bearer ")) {
  token = auth.replace("Bearer ", "").trim();
}

if (host && acid && token) {
  const value = `${host}#${acid}#${token}`;
  $prefs.setValueForKey(value, "xinxiaoliid");

  console.log("✅ xinxiaoliid 已写入:", value);

  // ===== 成功通知 =====
  $notify(
    "1224小丽参数已提取",
    `${value}`,
    ``
  );
} else {
  console.log("❌ 提取失败:", { host, acid, token });
}

$done({});
