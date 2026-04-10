// ==UserScript==
// @name         提取用户信息
// @match        *
// ==/UserScript==

let body = $response.body;

try {
    let obj = JSON.parse(body);

    let data = obj.data || {};

    let mobile = data.mobile || "";
    let nickName = data.nickName || "";

    // 提取昵称里的数字
    let num = nickName.match(/\d+/) ? nickName.match(/\d+/)[0] : "";

    let result = `${mobile}#${nickName}#${num}`;

    // 保存变量
    //$prefs.setValueForKey(result, "user_info");

    // 通知
    $notify("✅ 提取成功", "", result);

} catch (e) {
    $notify("❌ 提取失败", "", e.message);
}

$done({});