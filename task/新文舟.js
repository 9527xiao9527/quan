```javascript
/*
[rewrite_local]
#  QX Task
# 读取本地变量：xinwenzhou
# 格式：scheduleId#salesUserId#accessToken
#
# FAST_MODE = 1：极速传
# FAST_MODE = 0：正常传，每10秒上报一次
#
# 已移除：领红包
*/

const FAST_MODE = 1;              // 1=极速传，0=正常传
const REPORT_INTERVAL = 10;       // 正常传上报间隔（秒）

// ==================== 固定配置 ====================

const SALT = "i6qoIIPCnBni7uqRJ8KJWvLfbXdmF4Nz";
const BASE_URL = "https://oapi.yywhkj.cn/";

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.76(0x18004c24) NetType/WIFI Language/zh_CN",
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": "https://servicewechat.com/wx65de176fbb1aef43/1/page-frame.html"
};

let ACCESS_TOKEN = "";
let SCHEDULE_ID = "";
let SALES_USER_ID = "";

let SUMMARY = [];

// ==================== 日志 ====================

function log(msg) {
    const text = "[" + new Date().toLocaleTimeString() + "] " + msg;
    SUMMARY.push(text);
    console.log(text);
}

// ==================== MD5 ====================

function md5(str) {
    try {
        return $crypto.digest("MD5", str, "hex").toUpperCase();
    } catch (e) {
        throw new Error("QX 当前环境不支持 MD5：" + e);
    }
}

// ==================== 签名 ====================

function sign(params) {
    let str = SALT;

    Object.keys(params)
        .filter(key => key !== "signature")
        .sort()
        .forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                str += key + String(params[key]);
            }
        });

    str += SALT;

    return md5(str);
}

// ==================== URL 编码 ====================

function encodeForm(data) {
    return Object.keys(data)
        .filter(key => {
            return data[key] !== null &&
                   data[key] !== undefined &&
                   data[key] !== "";
        })
        .map(key => {
            return encodeURIComponent(key) +
                   "=" +
                   encodeURIComponent(String(data[key]));
        })
        .join("&");
}

// ==================== QX 请求 ====================

function request(api, params = {}, retry = 2) {
    return new Promise(resolve => {

        const data = Object.assign({}, params, {
            clientV: "1.0",
            serverV: "1.0",
            platform: "miniprogram",
            accessToken: ACCESS_TOKEN
        });

        data.signature = sign(data);

        const options = {
            url: BASE_URL + api,
            method: "POST",
            headers: HEADERS,
            body: encodeForm(data),
            timeout: 20000
        };

        function send(remaining) {

            $task.fetch(options).then(
                response => {

                    try {
                        resolve(JSON.parse(response.body));
                    } catch (e) {

                        if (remaining > 0) {
                            setTimeout(() => {
                                send(remaining - 1);
                            }, 2000);
                        } else {
                            resolve({
                                code: -1,
                                msg: "响应解析失败：" + e
                            });
                        }
                    }
                },

                error => {

                    if (remaining > 0) {
                        setTimeout(() => {
                            send(remaining - 1);
                        }, 2000);
                    } else {
                        resolve({
                            code: -1,
                            msg: "网络异常：" + JSON.stringify(error)
                        });
                    }
                }
            );
        }

        send(retry);
    });
}

// ==================== 读取 xinwenzhou ====================

function getConfig() {

    const value = $prefs.valueForKey("xinwenzhou");

    if (!value) {
        return null;
    }

    const arr = value.split("#");

    if (arr.length < 3) {
        return null;
    }

    return {
        scheduleId: arr[0],
        salesUserId: arr[1],
        accessToken: arr.slice(2).join("#")
    };
}

// ==================== 获取课程 ====================

function getCourse() {
    return request("courseLearning/getMyCourse", {
        scheduleId: SCHEDULE_ID,
        salesUserId: SALES_USER_ID
    });
}

// ==================== 上报进度 ====================

function reportProgress(scheduleCourseId, seconds) {
    return request("courseLearning/reportProgress", {
        scheduleCourseId: scheduleCourseId,
        playProgress: Math.floor(seconds)
    });
}

// ==================== 签到 ====================

function checkIn(scheduleCourseId) {
    return request("courseLearning/checkIn", {
        scheduleCourseId: scheduleCourseId
    });
}

// ==================== 完课 ====================

function completeVideo(scheduleCourseId) {
    return request("courseLearning/completeVideo", {
        scheduleCourseId: scheduleCourseId
    });
}

// ==================== 获取题目 ====================

function getQuestion(scheduleCourseId) {
    return request("courseLearning/getQuestion", {
        scheduleCourseId: scheduleCourseId
    });
}

// ==================== 提交答案 ====================

function submitQuiz(scheduleCourseId, indexes) {
    return request("courseLearning/submitQuiz", {
        scheduleCourseId: scheduleCourseId,
        answerIds: indexes.sort((a, b) => a - b).join(",")
    });
}

// ==================== 获取视频时长 ====================

function getDuration(url) {

    return new Promise(resolve => {

        if (!url) {
            resolve(0);
            return;
        }

        $task.fetch({
            url: url,
            method: "GET",
            headers: {
                "User-Agent": HEADERS["User-Agent"]
            },
            timeout: 20000
        }).then(
            response => {

                const text = response.body || "";
                const matches = text.match(/#EXTINF:([0-9.]+)/g) || [];

                let total = 0;

                matches.forEach(item => {
                    const match = item.match(/#EXTINF:([0-9.]+)/);

                    if (match) {
                        total += parseFloat(match[1]);
                    }
                });

                resolve(total > 0 ? total : 0);
            },

            () => {
                resolve(0);
            }
        );
    });
}

// ==================== 延时 ====================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 生成组合 ====================

function combinations(n, k, current, result) {

    if (current.length === k) {
        result.push(current.slice());
        return;
    }

    const start = current.length
        ? current[current.length - 1] + 1
        : 0;

    for (let i = start; i < n; i++) {

        current.push(i);

        combinations(
            n,
            k,
            current,
            result
        );

        current.pop();
    }
}

// ==================== 自动答题 ====================

async function doQuiz(scheduleCourseId) {

    const response = await getQuestion(scheduleCourseId);

    if (response.code !== 200 || !response.data) {

        log(
            "答题：跳过 - " +
            (response.msg || "获取题目失败")
        );

        return;
    }

    const data = response.data;

    const type = data.type || 1;
    const options = data.options || [];
    const attempts = data.remainingAttempts || 1;

    log(
        "题目：" +
        (data.questionName || "") +
        " | " +
        (type === 2 ? "多选" : "单选") +
        " | 选项：" +
        options.length +
        " | 剩余次数：" +
        attempts
    );

    if (!options.length) {

        log("答题：没有选项，跳过");

        return;
    }

    let candidates = [];

    // 多选
    if (type === 2) {

        for (
            let n = 1;
            n <= options.length;
            n++
        ) {

            combinations(
                options.length,
                n,
                [],
                candidates
            );
        }

    // 单选
    } else {

        for (
            let i = 0;
            i < options.length;
            i++
        ) {

            candidates.push([i]);
        }
    }

    const maxTry = Math.max(
        1,
        Math.min(
            attempts,
            candidates.length
        )
    );

    for (
        let i = 0;
        i < maxTry;
        i++
    ) {

        const answer = candidates[i];

        const result = await submitQuiz(
            scheduleCourseId,
            answer
        );

        if (
            result.code !== 200 ||
            !result.data
        ) {

            log(
                "答题失败：" +
                (result.msg || "")
            );

            return;
        }

        const data = result.data;

        if (data.alreadyAnswered) {

            log(
                "答题：此前已完成"
            );

            return;
        }

        const answerText = answer
            .map(index => String.fromCharCode(65 + index))
            .join("");

        if (data.correct) {

            log(
                "答题：" +
                answerText +
                " 正确，得分：" +
                (data.score || 0)
            );

            return;
        }

        log(
            "答题：" +
            answerText +
            " 错误，剩余：" +
            (data.remainingAttempts ?? "?")
        );

        await sleep(1000);
    }

    log("答题：次数用尽，未答对");
}

// ==================== 主程序 ====================

async function main() {

    // 读取 xinwenzhou
    const config = getConfig();

    if (!config) {

        log(
            "未读取到 xinwenzhou"
        );

        $notify(
            "yywhkj",
            "执行失败",
            "xinwenzhou 格式应为：scheduleId#salesUserId#accessToken"
        );

        return;
    }

    // 设置参数
    SCHEDULE_ID = config.scheduleId;
    SALES_USER_ID = config.salesUserId;
    ACCESS_TOKEN = config.accessToken;

    log(
        "scheduleId：" +
        SCHEDULE_ID
    );

    log(
        "salesUserId：" +
        SALES_USER_ID
    );

    log(
        "模式：" +
        (
            FAST_MODE === 1
                ? "极速传"
                : "正常传"
        )
    );

    // ==========================
    // 获取课程
    // ==========================

    const course = await getCourse();

    if (
        course.code !== 200 ||
        !course.data
    ) {

        log(
            "获取课程失败：" +
            (course.msg || "")
        );

        $notify(
            "yywhkj",
            "获取课程失败",
            course.msg || ""
        );

        return;
    }

    const data = course.data;

    const scheduleCourseId =
        data.scheduleCourseId;

    const start =
        parseInt(
            data.playProgress || 0,
            10
        );

    const interactionTimes =
        parseInt(
            data.interactionTimes || 0,
            10
        );

    const completed =
        data.videoCompleted;

    let needQuestion =
        data.needQuestion;

    let quizAnswered =
        data.quizAnswered;

    log(
        "课程：" +
        (data.courseName || "") +
        " | 课件：" +
        scheduleCourseId +
        " | 已看：" +
        start +
        "s" +
        " | 签到：" +
        interactionTimes +
        " 次" +
        " | 完成：" +
        completed
    );

    // ==========================
    // 未完成
    // ==========================

    if (!completed) {

        let duration =
            await getDuration(
                data.videoUrl || ""
            );

        if (duration <= 0) {

            log(
                "无法获取视频时长，使用已看进度 +600 秒"
            );

            duration =
                start + 600;
        }

        duration =
            Math.floor(duration);

        // ======================
        // 极速传
        // ======================

        if (FAST_MODE === 1) {

            log(
                "开始极速传：" +
                start +
                " → " +
                duration +
                " 秒"
            );

            const result =
                await reportProgress(
                    scheduleCourseId,
                    duration
                );

            log(
                "极速传：" +
                (
                    result.code === 200
                        ? "成功"
                        : (
                            result.msg ||
                            "失败"
                        )
                )
            );

        // ======================
        // 正常传
        // ======================

        } else {

            log(
                "开始正常传，间隔 " +
                REPORT_INTERVAL +
                " 秒"
            );

            let progress = start;

            while (
                progress < duration
            ) {

                progress =
                    Math.min(
                        progress +
                        REPORT_INTERVAL,
                        duration
                    );

                const result =
                    await reportProgress(
                        scheduleCourseId,
                        progress
                    );

                log(
                    "进度：" +
                    progress +
                    "/" +
                    duration +
                    " → " +
                    (
                        result.code === 200
                            ? "成功"
                            : (
                                result.msg ||
                                "失败"
                            )
                    )
                );

                if (
                    result.code !== 200
                ) {

                    log(
                        "进度上报失败，停止正常传"
                    );

                    break;
                }

                if (
                    progress < duration
                ) {

                    await sleep(
                        REPORT_INTERVAL *
                        1000
                    );
                }
            }
        }

        // ======================
        // 签到
        // ======================

        if (interactionTimes > 0) {

            log(
                "开始签到，共 " +
                interactionTimes +
                " 次"
            );

            for (
                let i = 0;
                i < interactionTimes;
                i++
            ) {

                const result =
                    await checkIn(
                        scheduleCourseId
                    );

                const count =
                    result.data &&
                    result.data.signCount;

                log(
                    "签到 " +
                    (i + 1) +
                    "/" +
                    interactionTimes +
                    " → " +
                    (
                        result.code === 200
                            ? "成功"
                            : (
                                result.msg ||
                                "失败"
                            )
                    ) +
                    (
                        count
                            ? "（累计 " +
                              count +
                              " 次）"
                            : ""
                    )
                );

                if (
                    i + 1 <
                    interactionTimes
                ) {

                    await sleep(1000);
                }
            }

        } else {

            log(
                "本课程没有签到次数"
            );
        }

        // ======================
        // 完课
        // ======================

        const complete =
            await completeVideo(
                scheduleCourseId
            );

        if (
            complete.code !== 200 ||
            !complete.data
        ) {

            log(
                "完课失败：" +
                (complete.msg || "")
            );

            return;
        }

        const completeData =
            complete.data;

        needQuestion =
            completeData.needQuestion;

        quizAnswered =
            completeData.quizAnswered;

        log(
            "完课成功 | 需答题：" +
            needQuestion +
            " | 已答题：" +
            quizAnswered
        );

    } else {

        log(
            "课程已经完成，跳过进度、签到、完课"
        );
    }

    // ==========================
    // 答题
    // ==========================

    if (
        needQuestion &&
        !quizAnswered
    ) {

        await doQuiz(
            scheduleCourseId
        );

    } else {

        log(
            "无需答题或已经答题"
        );
    }

    // ==========================
    // 结束
    // ==========================

    log(
        "任务完成"
    );

    log(
        "本版本已完全移除领红包操作"
    );

    $notify(
        "yywhkj 课程任务",
        FAST_MODE === 1
            ? "极速传"
            : "正常传",
        SUMMARY.join("\n")
    );
}


// ==================== 执行 ====================

main()
    .catch(error => {

        console.log(
            "脚本异常：" +
            error
        );

        $notify(
            "yywhkj",
            "脚本异常",
            String(error)
        );

    })
    .finally(() => {

        $done();

    });
```
