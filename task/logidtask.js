/**
 * 145773 视频进度
 *
 * 流程：
 * 1. 从 logidck 获取 URL + Headers
 * 2. 获取视频信息
 * 3. start
 * 4. 按 120 秒递增上报
 * 5. 最后上报 duration
 * 6. 再额外上报 duration + 1
 * 7. 调用 completed
 *
 * progress 每次随机间隔 1～2 秒
 *
 * logidck 格式：
 * URL#HeadersJSON
 */

// ======================================================
// 1. 读取 logidck
// ======================================================

const logidck = $prefs.valueForKey("logidck");

if (!logidck) {
    $notify("145773", "执行失败", "未找到 logidck");
    $done();
    return;
}


// ======================================================
// 2. 解析 URL + Headers
// ======================================================

const separatorIndex = logidck.indexOf("#");

if (separatorIndex === -1) {
    $notify("145773", "执行失败", "logidck 格式错误");
    $done();
    return;
}

const url = logidck.substring(0, separatorIndex);
const headersStr = logidck.substring(separatorIndex + 1);

let headers;

try {
    headers = JSON.parse(headersStr);
} catch (e) {
    $notify(
        "145773",
        "Headers 解析失败",
        headersStr
    );
    $done();
    return;
}


// ======================================================
// 3. 动态获取 API Host
// ======================================================

const hostMatch = url.match(/^https?:\/\/[^\/]+/);

if (!hostMatch) {
    $notify(
        "145773",
        "Host 获取失败",
        url
    );
    $done();
    return;
}

const baseUrl = hostMatch[0];


// ======================================================
// 4. 工具函数
// ======================================================

// 随机 1～2 秒
function randomDelay() {
    return Math.floor(Math.random() * 1001) + 1000;
}

// Promise 延时
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// JSON 解析
function parseJSON(body) {
    try {
        return JSON.parse(body);
    } catch (e) {
        return null;
    }
}

// ======================================================
// 5. 第一阶段：获取视频信息
// ======================================================

const request1 = {
    url: url,
    method: "GET",
    headers: headers
};

$task.fetch(request1).then(async resp1 => {

    const data = parseJSON(resp1.body);

    if (!data) {
        $notify(
            "145773",
            "获取信息失败",
            "返回内容不是有效 JSON\n" + resp1.body
        );
        $done();
        return;
    }

    if (data.code !== 200 || !data.data) {
        $notify(
            "145773",
            "获取信息失败",
            data.message || resp1.body
        );
        $done();
        return;
    }


    // ==================================================
    // 6. 提取参数
    // ==================================================

    const log_id = data.data.log_id;
    const video_id = data.data.video_id;

    const rawDuration = Number(data.data.duration);

    if (!log_id) {
        $notify(
            "145773",
            "参数错误",
            "未获取到 log_id"
        );
        $done();
        return;
    }

    if (!video_id) {
        $notify(
            "145773",
            "参数错误",
            "未获取到 video_id"
        );
        $done();
        return;
    }

    if (!Number.isFinite(rawDuration) || rawDuration < 0) {
        $notify(
            "145773",
            "参数错误",
            "duration 无效：" + data.data.duration
        );
        $done();
        return;
    }

    const duration = Math.floor(rawDuration);

    // 最终目标
    const finishDuration = duration + 1;


    console.log("================================");
    console.log("获取视频信息成功");
    console.log("baseUrl:", baseUrl);
    console.log("video_id:", video_id);
    console.log("log_id:", log_id);
    console.log("duration:", duration);
    console.log("finishDuration:", finishDuration);
    console.log("================================");


    // ==================================================
    // 7. 第二阶段：调用 start
    // ==================================================

    const requestStart = {
        url: `${baseUrl}/api/goods.browse/start`,
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body:
            `video_id=${encodeURIComponent(video_id)}` +
            `&log_id=${encodeURIComponent(log_id)}`
    };


    let startResult;

    try {

        const respStart = await $task.fetch(requestStart);

        startResult = parseJSON(respStart.body);

        if (!startResult) {
            $notify(
                "145773",
                "start 解析失败",
                respStart.body
            );
            $done();
            return;
        }

        console.log("===== start =====");
        console.log(respStart.body);

        if (startResult.code !== 200) {
            $notify(
                "145773",
                "start 失败",
                startResult.message || respStart.body
            );
            $done();
            return;
        }

    } catch (err) {

        $notify(
            "145773",
            "start 请求失败",
            err.error || String(err)
        );

        $done();
        return;
    }


    // ==================================================
    // 8. 第三阶段：progress
    //
    // 例如 duration = 3648：
    //
    // 120
    // 240
    // 360
    // ...
    // 3480
    // 3600
    // 3648
    // 3649
    // ==================================================

    let played = 0;
    let progressCount = 0;


    while (played < duration) {

        // 每次增加 120
        played = Math.min(
            played + 120,
            duration
        );


        const progressUrl =
            `${baseUrl}/api/goods.browse/progress` +
            `?log_id=${encodeURIComponent(log_id)}` +
            `&play_duration=${played}`;


        const requestProgress = {
            url: progressUrl,
            method: "GET",
            headers: headers
        };


        try {

            const respProgress =
                await $task.fetch(requestProgress);

            let progressResult =
                parseJSON(respProgress.body);


            // 某些接口可能返回数组
            if (
                Array.isArray(progressResult) &&
                progressResult.length > 0 &&
                typeof progressResult[0] === "object"
            ) {
                progressResult = progressResult[0];
            }


            if (!progressResult) {

                $notify(
                    "145773",
                    "progress 解析失败",
                    `时长：${played}\n${respProgress.body}`
                );

                $done();
                return;
            }


            console.log(
                `===== progress ${played} =====`
            );

            console.log(
                respProgress.body
            );


            if (progressResult.code !== 200) {

                $notify(
                    "145773",
                    "progress 失败",
                    `时长：${played}\n` +
                    `${progressResult.message || respProgress.body}`
                );

                $done();
                return;
            }


            progressCount++;


            console.log(
                `✅ 上报进度：${played}`
            );


            // 还没有到 duration
            // 随机等待 1～2 秒
            if (played < duration) {

                const delay = randomDelay();

                console.log(
                    `等待 ${delay} ms`
                );

                await sleep(delay);
            }


        } catch (err) {

            $notify(
                "145773",
                "progress 请求失败",
                `时长：${played}\n` +
                `${err.error || String(err)}`
            );

            $done();
            return;
        }
    }


    // ==================================================
    // 9. 额外上报 duration + 1
    // ==================================================

    const finalProgressUrl =
        `${baseUrl}/api/goods.browse/progress` +
        `?log_id=${encodeURIComponent(log_id)}` +
        `&play_duration=${finishDuration}`;


    const requestFinalProgress = {
        url: finalProgressUrl,
        method: "GET",
        headers: headers
    };


    try {

        // duration 与 duration+1 之间也随机等待 1～2 秒
        const delay = randomDelay();

        console.log(
            `duration 已完成，等待 ${delay} ms 后上报 ${finishDuration}`
        );

        await sleep(delay);


        const respFinal =
            await $task.fetch(requestFinalProgress);

        let finalResult =
            parseJSON(respFinal.body);


        if (
            Array.isArray(finalResult) &&
            finalResult.length > 0 &&
            typeof finalResult[0] === "object"
        ) {
            finalResult = finalResult[0];
        }


        console.log(
            `===== progress ${finishDuration} =====`
        );

        console.log(
            respFinal.body
        );


        if (!finalResult) {

            $notify(
                "145773",
                "最终 progress 解析失败",
                respFinal.body
            );

            $done();
            return;
        }


        if (finalResult.code !== 200) {

            $notify(
                "145773",
                "最终 progress 失败",
                finalResult.message || respFinal.body
            );

            $done();
            return;
        }


        progressCount++;

        console.log(
            `✅ 最终上报：${finishDuration}`
        );


    } catch (err) {

        $notify(
            "145773",
            "最终 progress 请求失败",
            err.error || String(err)
        );

        $done();
        return;
    }


    // ==================================================
    // 10. 第四阶段：completed
    // ==================================================

    const completeUrl =
        `${baseUrl}/api/goods.browse/completed` +
        `?log_id=${encodeURIComponent(log_id)}`;


    const requestComplete = {
        url: completeUrl,
        method: "GET",
        headers: headers
    };


    try {

        const respComplete =
            await $task.fetch(requestComplete);

        let completeResult =
            parseJSON(respComplete.body);


        if (
            Array.isArray(completeResult) &&
            completeResult.length > 0 &&
            typeof completeResult[0] === "object"
        ) {
            completeResult = completeResult[0];
        }


        console.log("===== completed =====");
        console.log(respComplete.body);


        if (!completeResult) {

            $notify(
                "145773",
                "completed 解析失败",
                respComplete.body
            );

            $done();
            return;
        }


        if (completeResult.code !== 200) {

            $notify(
                "145773",
                "completed 失败",
                completeResult.message || respComplete.body
            );

            $done();
            return;
        }


        // ==================================================
        // 11. 最终通知
        // ==================================================

        $notify(
            "145773",
            "视频完成",
            `video_id：${video_id}\n` +
            `log_id：${log_id}\n` +
            `duration：${duration}s\n` +
            `最终进度：${finishDuration}s\n` +
            `progress 次数：${progressCount}\n` +
            `${completeResult.message || "completed 成功"}`
        );


        console.log("================================");
        console.log("✅ 视频处理完成");
        console.log("video_id:", video_id);
        console.log("log_id:", log_id);
        console.log("duration:", duration);
        console.log("finishDuration:", finishDuration);
        console.log("progressCount:", progressCount);
        console.log("================================");


        $done();


    } catch (err) {

        $notify(
            "",
            "completed 请求失败",
            err.error || String(err)
        );

        $done();
    }


}, err => {

    // ==================================================
    // 第一请求失败
    // ==================================================

    $notify(
        "",
        "获取信息请求失败",
        err.error || String(err)
    );

    $done();
});