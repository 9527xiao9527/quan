// ===== 提取请求体参数并保存到 xinwenzhou =====

const body = $request.body || "";

const scheduleId = body.match(/(?:^|&)scheduleId=([^&]*)/)?.[1] || "";
const salesUserId = body.match(/(?:^|&)salesUserId=([^&]*)/)?.[1] || "";
const accessToken = body.match(/(?:^|&)accessToken=([^&]*)/)?.[1] || "";

if (scheduleId && salesUserId && accessToken) {
    const value = `${scheduleId}#${salesUserId}#${accessToken}`;

    $prefs.setValueForKey(value, "xinwenzhou");

    $notify(
        "参数提取成功",
        "xinwenzhou",
        value
    );
} else {
    $notify(
        "参数提取失败",
        "xinwenzhou",
        "未找到完整的 scheduleId / salesUserId / accessToken"
    );
}

$done({});
