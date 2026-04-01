/*********************************
圈X 重写提取 url#headers#body
按 X-Token 区分多账号
body.sessionId 不为空才保存
*********************************/

const key = "tickets1";

if ($request.method !== "POST") {
  $done({});
}

const url = $request.url;
const headers = $request.headers;
const body = $request.body;

if (!body) {
  console.log("❌ body为空");
  $done({});
}

let bodyObj;
try {
  bodyObj = JSON.parse(body);
} catch (e) {
  console.log("❌ body不是JSON");
  $done({});
}

// ✅ sessionId 必须存在且不为空
// 新增对 0 的判断，同时保留原有的空值/空字符串判断
if (!bodyObj.sessionId || bodyObj.sessionId === "" || bodyObj.sessionId === 0) {
  console.log("❌ sessionId为空、空字符串或0，不保存");
  $done({});
}

// ✅ 取 X-Token 作为账号唯一标识
const xToken = headers["X-Token"] || headers["X-token"];
if (!xToken) {
  console.log("❌ 未找到X-Token");
  $done({});
}

// 读取已有数据
let oldData = $prefs.valueForKey(key);
let arr = [];

if (oldData) {
  arr = oldData.split("\n");
}

// 当前保存格式
const saveLine = `${url}#${JSON.stringify(headers)}#${body}`;

// 检查是否已有该账号
let updated = false;
for (let i = 0; i < arr.length; i++) {
  if (arr[i].includes(xToken)) {
    arr[i] = saveLine;
    updated = true;
    break;
  }
}

if (!updated) {
  arr.push(saveLine);
}

// 写入本地
$prefs.setValueForKey(arr.join("\n"), key);

$notify("抓取成功", "已保存账号", ``);

$done({});
