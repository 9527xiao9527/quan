// 乐播重写脚本 - 自动捕获 course-video/detail 请求，保存 xinlebo 变量
// Quantumult X 重写配置:
//
// [rewrite_local]
// ^https://lbxapi\.myzxyx\.com/consumer/course-video/detail url script-request-header rewrite.js
//
// [mitm]
// hostname = lbxapi.myzxyx.com

const url = $request.url;
const headers = $request.headers;

const authorization = headers["Authorization"] || headers["authorization"] || "";

if (!authorization) {
  console.log("[乐播] 未找到 Authorization，跳过");
  $done({});
}

// 保存 detailUrl#token
const xinlebo = `${url}#${authorization}`;
$prefs.setValueForKey(xinlebo, "xinlebo");

// 从 URL 解析课程信息用于通知
try {
  const urlObj = new URL(url);
  const courseId = urlObj.searchParams.get("id");
  const encryptId = urlObj.searchParams.get("encryptId");
  $notify("📦 乐播", "变量已保存", `courseId=${courseId} encryptId=${encryptId}`);
} catch (e) {
  $notify("📦 乐播", "变量已保存", "xinlebo 已更新");
}

$done({});
