/**
 * @name 课程红包提醒
 * @description 根据响应体判断课程是否有红包并通知
 */

if (!$response.body) {
    $done({});
    return;
}

let body;
try {
    body = JSON.parse($response.body);
} catch (e) {
    console.log("❌ JSON 解析失败");
    $done({});
    return;
}

// 提取 data 值
const hasRedPacket = body.data;

// 根据 data 值通知
if (hasRedPacket === true) {
    $notify("课程红包提醒", "", "该课程有红包 🎉");
} else if (hasRedPacket === false) {
    $notify("课程红包提醒", "", "该课程无红包 😢");
} else {
    console.log("❌ data 字段非布尔值:", hasRedPacket);
}

$done($response);
