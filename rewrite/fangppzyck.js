/**
 * Quantumult X 重写
 * 提取：
 * 1. 完整请求 URL
 * 2. 请求头 Authorization
 *
 * 最终格式：
 * URL#Authorization
 *
 * ^https:\/\/abc\.yvfazqk\.cn\/api\/mp3\/video\.php\?(?=[^#]*\bc=[^&]*)(?=[^#]*\bd=[^&]*)(?=[^#]*\bq=[^&]*)[^#]*$
 */

const url = $request.url;
const headers = $request.headers || {};

// 不区分大小写查找 Authorization
let authorization = "";

for (const key in headers) {
    if (key.toLowerCase() === "authorization") {
        authorization = headers[key];
        break;
    }
}

// 检查 Authorization
if (!authorization) {
    $notify(
        "提取失败",
        "未找到 Authorization",
        url
    );
    $done({});
}

// 拼接
const result = `${url}#${authorization}`;

// 通知
$notify(
    "提取成功",
    "URL#Authorization",
    result
);

$done({});