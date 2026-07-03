const logidck = $prefs.valueForKey("logidck");

if (!logidck) {
    $notify("", "", "未找到 logidck");
    $done();
}

const [url, headersStr] = logidck.split("#");
const headers = JSON.parse(headersStr);

const request1 = {
    url,
    method: "GET",
    headers
};

$task.fetch(request1).then(async resp => {
    const data = JSON.parse(resp.body);

    if (data.code !== 200 || !data.data) {
        $notify("", "获取信息失败", data.message || resp.body);
        return $done();
    }

    const log_id = data.data.log_id;
    const duration = Number(data.data.duration || 0) + 1;

    // 动态获取接口根地址
    const baseUrl = url.match(/^https?:\/\/[^\/]+/)[0];

    const request2 = {
        url: `${baseUrl}/api/goods.browse/progress?log_id=${log_id}&play_duration=${duration}`,
        method: "GET",
        headers
    };

    $task.fetch(request2).then(resp2 => {
        const result = JSON.parse(resp2.body);

        $notify(
            "145773",
            result.message || "完成",
            `log_id:${log_id}\n时长:${duration}`
        );

        console.log(resp2.body);
        $done();

    }, err => {
        $notify("", "上报失败", err.error);
        $done();
    });

}, err => {
    $notify("", "请求失败", err.error);
    $done();
});