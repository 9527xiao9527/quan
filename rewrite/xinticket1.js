/*********************************
 圈X 重写提取
 url#headers
 按 X-token 区分多账号
 URL 中 sessionId 不为空才保存

 [rewrite_local]
 ^https?://[^/]+/lilu/guadi/xionghuang url script-request-header xinticket1.js

 [mitm]
 hostname = *.qifengai.com
*********************************/

const key = "tickets2";

const url = $request.url;
const headers = $request.headers;


// ✅ 从 URL 中解析 sessionId 和 shareCode
const urlObj = new URL(url);
const sessionId = urlObj.searchParams.get("sessionId");
const shareCode = urlObj.searchParams.get("shareCode");

if (!sessionId || sessionId === "" || sessionId === "0") {
    console.log("❌ sessionId为空或0，不保存");
    $done({});
}

if (!shareCode || shareCode === "") {
    console.log("❌ shareCode为空，不保存");
    $done({});
}

// ✅ 取 X-token 作为账号唯一标识
const xToken = headers["X-token"] || headers["X-Token"];
if (!xToken) {
    console.log("❌ 未找到X-token");
    $done({});
}

// 读取已有数据
let oldData = $prefs.valueForKey(key);
let arr = [];
if (oldData) {
    arr = oldData.split("\n").filter(l => l.trim() !== "");
}

// 当前保存格式：url#headers_json
const saveLine = `${url}#${JSON.stringify(headers)}`;

// 按 X-token 去重更新
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

$prefs.setValueForKey(arr.join("\n"), key);
$notify("抓取成功", `已保存账号 sessionId=${sessionId}`, `共 ${arr.length} 个账号`);
$done({});
