// ==UserScript==
// @name         提取 guest_id 和 invite_id
// @namespace    http://quanx.app
// @version      1.0
// ==/UserScript==

let body = $request.body || "";

try {
    const obj = JSON.parse(body);

    const guestId = obj.guest_id || "";
    const inviteId = obj.invite_id || "";

    if (guestId && inviteId) {
        const result = `${guestId}#${inviteId}`;

        $notify(
            "提取成功",
            "",
            result
        );

        console.log(result);
    }
} catch (e) {
    console.log("解析失败：" + e);
}

$done({});