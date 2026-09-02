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

// ==================== MD5 (纯 JS，兼容 QX task 环境) ====================

function md5(str) {
    function rh(n) {
        let j, s = "";
        for (j = 0; j <= 3; j++) {
            const hi = (n >> (j * 8 + 4)) & 0x0F;
            const lo = (n >> (j * 8)) & 0x0F;
            s += hi.toString(16).toUpperCase() + lo.toString(16).toUpperCase();
        }
        return s;
    }
    function ad(x, y) {
        const l = (x & 0xFFFF) + (y & 0xFFFF);
        const m = (x >> 16) + (y >> 16) + (l >> 16);
        return (m << 16) | (l & 0xFFFF);
    }
    function rol(n, c) {
        return (n << c) | (n >>> (32 - c));
    }
    function cmn(q, a, b, x, s, t) {
        return ad(rol(ad(ad(a, q), ad(x, t)), s), b);
    }
    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function s2b(s) {
        const nblk = ((s.length + 8) >> 6) + 1;
        const blks = new Array(nblk * 16);
        for (let i = 0; i < nblk * 16; i++) blks[i] = 0;
        for (let i = 0; i < s.length; i++) {
            const idx = i >> 2;
            const cur = blks[idx];
            blks[idx] = (s.charCodeAt(i) << ((i % 4) * 8)) | (cur & (0xFFFFFFFF << ((i % 4) * 8 + 8)));
        }
        const idx = s.length >> 2;
        const cur = blks[idx];
        blks[idx] = cur | (0x80 << ((s.length % 4) * 8));
        blks[nblk * 16 - 2] = s.length * 8;
        return blks;
    }

    const x = s2b(str);
    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

    for (let i = 0; i < x.length; i += 16) {
        const oa = a, ob = b, oc = c, od = d;

        a = ff(a, b, c, d, x[i], 7, -680876936);
        d = ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = ff(c, d, a, b, x[i + 10], 17, -42063);
        b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

        a = gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = gg(b, c, d, a, x[i], 20, -373897302);
        a = gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

        a = hh(a, b, c, d, x[i + 5], 4, -378558);
        d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = hh(d, a, b, c, x[i], 11, -358537222);
        c = hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = hh(b, c, d, a, x[i + 2], 23, -995338651);

        a = ii(a, b, c, d, x[i], 6, -198630844);
        d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = ii(b, c, d, a, x[i + 9], 21, -343485551);

        a = ad(a, oa);
        b = ad(b, ob);
        c = ad(c, oc);
        d = ad(d, od);
    }

    return rh(a) + rh(b) + rh(c) + rh(d);
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
