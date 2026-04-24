/**
 * 名称：旧版ticket CK提取
 * 功能：提取 url#headers，按 token 区分多账号
 */

let url = $request.url;
let headers = $request.headers;

let token = headers["X-token"] || headers["x-token"];
if (!token) {
    console.log("❌ 未找到 token");
    $done({});
}

// 只保留必要头（可自行增减）
let newHeaders = {
    "User-Agent": headers["User-Agent"],
    "X-token": token,
    "Referer": headers["Referer"],
    "Content-Type": headers["Content-Type"]
};

// 生成一行数据
let line = `${url}#${JSON.stringify(newHeaders)}`;

// 读取已有数据
let key = "tickets1";
let old = $prefs.valueForKey(key) || "";

// 去重（按 token）
let list = old ? old.split("\n") : [];
let filtered = list.filter(item => !item.includes(token));

// 追加新账号
filtered.push(line);

// 写入
$prefs.setValueForKey(filtered.join("\n"), key);

console.log("✅ CK写入成功");
console.log(line);

$notify("getticket抓取成功", "已写入账号", token.slice(0, 20) + "...");

$done({});
