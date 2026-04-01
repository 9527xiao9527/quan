/*
国医 info 抓取完整版（$prefs 版本）
保存格式：url#headerJSON
多账号换行
按 token 去重
保存全部 header
*/

const KEY = "GY_INFO";

let url = $request.url;
let headers = $request.headers;

// 兼容大小写 token
let token = headers["token"] || headers["Token"] || headers["TOKEN"];

if (!token) {
    $notify("抓取失败", "未找到 token", "");
    $done({});
    return;
}

// 保存全部 header
let headerStr = JSON.stringify(headers);

// 拼接格式
let newLine = url + "#" + headerStr;

// 读取旧数据
let oldData = $prefs.valueForKey(KEY);
let lines = oldData ? oldData.split("\n") : [];

let newLines = [];
let replaced = false;

for (let line of lines) {

    if (!line) continue;

    let parts = line.split("#");
    if (parts.length < 2) continue;

    try {
        let oldHeaders = JSON.parse(parts.slice(1).join("#")); 
        // 防止 header 里有 # 被 split 破坏

        let oldToken = oldHeaders["token"] || oldHeaders["Token"] || oldHeaders["TOKEN"];

        if (oldToken === token) {
            // 同 token 覆盖
            newLines.push(newLine);
            replaced = true;
        } else {
            newLines.push(line);
        }

    } catch (e) {
        newLines.push(line);
    }
}

// 新账号
if (!replaced) {
    newLines.push(newLine);
}

// 保存
$prefs.setValueForKey(newLines.join("\n"), KEY);

// 通知展示
$notify(
    "国医参数抓取成功",
    `当前账号数: ${newLines.length}`,
    newLines.join("\n")
);

$done({});