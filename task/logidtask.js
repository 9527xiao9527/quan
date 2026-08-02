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

$task.fetch(request1).then(resp => {
    let data;

    try {
        data = JSON.parse(resp.body);
    } catch (e) {
        $notify("", "返回解析失败", resp.body);
        return $done();
    }

    if (data.code !== 200 || !data.data) {
        $notify("", "获取信息失败", data.message || resp.body);
        return $done();
    }

    const log_id = data.data.log_id;
    const video_id = data.data.video_id;
    const duration = Number(data.data.duration || 0) + 1;

    // 动态获取接口根地址
    const baseUrl = url.match(/^https?:\/\/[^\/]+/)[0];

    // 第二步：上报观看进度
    const request2 = {
        url: `${baseUrl}/api/goods.browse/progress?log_id=${log_id}&play_duration=${duration}`,
        method: "GET",
        headers
    };

    $task.fetch(request2).then(resp2 => {

        let result;

        try {
            result = JSON.parse(resp2.body);
        } catch (e) {
            $notify("", "progress解析失败", resp2.body);
            return $done();
        }

        if (result.code !== 200) {
            $notify("", "progress失败", result.message || resp2.body);
            return $done();
        }

        // 第三步：调用 start
        const request3 = {
            url: `${baseUrl}/api/goods.browse/start`,
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `video_id=${video_id}&log_id=${log_id}`
        };

        $task.fetch(request3).then(resp3 => {

            let startResult;

            try {
                startResult = JSON.parse(resp3.body);
            } catch (e) {
                $notify("", "start解析失败", resp3.body);
                return $done();
            }

            $notify(
                "145773",
                `${result.message || "进度完成"} / ${startResult.message || "开始成功"}`,
                `video_id: ${video_id}\nlog_id: ${log_id}\n时长: ${duration}`
            );

            console.log("===== progress =====");
            console.log(resp2.body);

            console.log("===== start =====");
            console.log(resp3.body);

            $done();

        }, err => {
            $notify("", "start请求失败", err.error);
            $done();
        });

    }, err => {
        $notify("", "progress请求失败", err.error);
        $done();
    });

}, err => {
    $notify("", "获取信息失败", err.error);
    $done();
});