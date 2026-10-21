// 匹配指定接口，提取 code 并通知

const url = $request.url;
const match = url.match(/[?&]code=([^&]*)/);

if (match) {
    const code = decodeURIComponent(match[1]);

    $notify("", "", code);
} else {
    $notify("提取 Code", "", "未找到 code 参数");
}

$done({});