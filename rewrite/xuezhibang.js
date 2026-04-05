// xuezhibang_capture.js
// 重写脚本：拦截 conten.php 响应，解析参数存储
// Quantumult X rewrite 配置：
// ^https?://m\.xuezhibang\.com/app/conten\.php url script-response-body xuezhibang_capture.js

const url = $request.url;
const body = $response.body || "";

// 只处理最终页面（带 y= 用户ID 的那次，非302跳转）
if (!body.includes("openid") || !body.includes("zb_id")) {
  $done({});
  return;
}

function extract(str, key) {
  // 匹配 let key = 'value' 或 let key = "value" 或 let key = value（数字）
  // 同时去掉行尾的 // 注释
  const re = new RegExp(`let\\s+${key}\\s*=\\s*['"]?([^'";\\n]+)['"]?`);
  const m = str.match(re);
  if (!m) return null;
  // 去掉注释部分：取 // 之前的内容，再去掉引号和空格
  return m[1].replace(/\s*\/\/.*$/, "").trim().replace(/^['"]|['"]$/g, "");
}

const openid     = extract(body, "openid");
const zb_id      = extract(body, "zb_id");
const kb_id      = extract(body, "kb_id");
const kefu_id    = extract(body, "kefu_id");
const answerIndex = extract(body, "answerIndex");
const us_id      = (body.match(/ID：(\d+)/) || [])[1] || extract(body, "us_id");
const hasHongbao = extract(body, "hasHongbao");

// 从请求 Cookie 里取 PHPSESSID
const cookie = $request.headers["Cookie"] || $request.headers["cookie"] || "";
const sessMatch = cookie.match(/PHPSESSID=([^;]+)/);
const phpsessid = sessMatch ? sessMatch[1] : "";
const p_h5_match = cookie.match(/p_h5_u=([^;]+)/);
const p_h5_u = p_h5_match ? p_h5_match[1] : "";

if (!openid || !zb_id) {
  console.log("[xuezhibang] 未能解析到关键参数，跳过");
  $done({});
  return;
}

const params = { openid, zb_id, kb_id, kefu_id, answerIndex, us_id, hasHongbao, phpsessid, p_h5_u };
$prefs.setValueForKey(JSON.stringify(params), "xuezhibang_params");

const answerLabel = ["A", "B", "C", "D"][parseInt(answerIndex) - 1] || answerIndex;
const hongbaoTip = hasHongbao == "1" ? "🧧 有红包" : "无红包";

console.log("[xuezhibang] 参数已保存：" + JSON.stringify(params));
$notify(
  "学知帮 · 正确答案",
  `选项 ${answerLabel}　　${hongbaoTip}`,
  `课程 ${zb_id} | 用户 ${us_id}`
);

$done({});
