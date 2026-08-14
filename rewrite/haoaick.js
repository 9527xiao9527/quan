// ===== 1. 只处理计时心跳 /api/v2/lists =====
const url = $request.url;
if (!url || url.indexOf("/api/v2/lists") === -1) {
  console.log("❌ 非目标请求");
  $done({});
  return;
}

// ===== 2. 提取需要的请求头 =====
const h = {};
for (const k in $request.headers) h[k.toLowerCase()] = $request.headers[k];

const header = {
  cookie: h["cookie"] || "",
  "x-viewer-key": h["x-viewer-key"] || "",
  "user-agent": h["user-agent"] || "",
  referer: h["referer"] || "",
};

if (!header.cookie) {
  console.log("❌ 未获取 Cookie");
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

const u = bodyObj.u;
const y = bodyObj.y;
const p = bodyObj.p;

if (!u || !y) {
  console.log("❌ body 参数不完整 (缺 u / y)");
  $done({});
  return;
}

// ===== 4. 写入本地变量: url#header#body =====
const value = `${url}#${JSON.stringify(header)}#${JSON.stringify({ u, y, p })}`;

$prefs.setValueForKey(value, "slbz");

// ===== 5. 通知 =====
$notify(
  "✅ 上你课参数捕获成功",
  `u：${u}  p：${p}`,
  "已写入本地变量 slbz (格式 url#header#body)"
);

$done({});
