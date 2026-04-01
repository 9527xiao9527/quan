/**
 * @name 视频进度参数保存（增加 view 字段，保留原始逻辑）
 */

const token = $request.headers["X-token"] || $request.headers["X-Token"];
if (!token) {
  console.log("❌ 未找到 X-Token");
  $done({});
  return;
}

const url = $request.url;
const headers = $request.headers;
const host = headers.Host || url.match(/^https:\/\/([^\/]+)/)?.[1];

// 兼容提取 playProgress
let play = 0;
try {
  const urlParams = new URL(url).searchParams;
  play = parseInt(urlParams.get("playProgress")) || 0;
} catch (e) {
  const match = url.match(/playProgress=(\d+)/);
  play = match ? parseInt(match[1]) : 0;
}

const view = play; // ✅ 新增 view 字段

// 兼容提取其他参数
function getParam(name) {
  try {
    return new URL(url).searchParams.get(name) || "";
  } catch {
    const m = url.match(new RegExp(`${name}=([^&]+)`));
    return m ? m[1] : "";
  }
}

const ticket = getParam("ticket");
const roomId = getParam("roomId");
const sessionId = getParam("sessionId");
const key = getParam("key");

const data = {
  token,
  host,
  url,
  headers,
  play,
  view, // ✅ 增加 view 字段
  ticket,
  roomId,
  sessionId,
  key
};

let saved = $prefs.valueForKey("ticket") || "";
let list = saved.split("\n").filter(Boolean);

const exists = list.some(item => {
  try {
    return JSON.parse(item).token === token;
  } catch {
    return false;
  }
});

if (!exists) {
  list.push(JSON.stringify(data));
  $prefs.setValueForKey(list.join("\n"), "ticket");
  console.log(`✅ 新账号保存成功，playProgress=${play}`);
  $notify("🎯 新账号已保存", `Host: ${host}`, `播放起点: ${play}`);
} else {
  console.log(`ℹ️ 账号已存在，跳过保存`);
}

$done({});
