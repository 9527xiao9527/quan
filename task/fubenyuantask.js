const BASE = "https://dsyx-shop-api.deshunnet.com";

let raw = $prefs.valueForKey("dsyx_data");

if (!raw) {
    $notify("❌ dsyx任务", "", "没有获取到参数，请先打开课程触发重写");
    $done();
}

let [courseId, fromUserId, allocationId, auth] = raw.split("#");

const headers = {
    "Authorization": auth,
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X)",
    "Content-Type": "application/json"
};

// ===== 请求函数 =====
function get(url) {
    return $task.fetch({ url, method: "GET", headers })
        .then(res => JSON.parse(res.body));
}

function post(url, body) {
    return $task.fetch({
        url,
        method: "POST",
        headers,
        body: JSON.stringify(body)
    }).then(res => JSON.parse(res.body));
}

// ===== 主流程 =====
(async () => {

    try {
        console.log("🚀 开始执行");

        // 1. 获取课程信息
        let detail = await get(
            `${BASE}/p/course/liveCourse/getLiveCourse?courseId=${courseId}&fromUserId=${fromUserId}&allocationId=${allocationId}`
        );

        let data = detail.data;
        let duration = parseInt(data.sectionDurationSecond);
        let shopId = data.shopId;
        let questionIds = data.questionIds;

        // 通知1
/*
        $notify(
            "📚 dsyx课程信息",
            `时长: ${duration}秒`,
            `shopId: ${shopId}`
        );
*/
        // 2. 播放
        await post(`${BASE}/p/course/liveCourse/saveLiveCoursePlayRecord`, {
            courseId: parseInt(courseId),
            playedDuration: String(duration),
            playProgress: duration,
            shopId: shopId,
            fromUserId: fromUserId,
            allocationId: allocationId,
            videoFileSize: parseInt(data.videoFileSize),
            playNow: 0,
            isCompleted: true,
            validTimeEnd: data.validTimeEnd
        });

        console.log("✅ 播放完成");

        // 3. 查题
        if (!questionIds) {
            $notify("📭 dsyx任务完成", "", "无题目，已完成播放");
            $done();
            return;
        }

        let q = await get(
            `${BASE}/p/questionBank/getQuestionBanks?shopId=${shopId}&courseId=${courseId}&fromUserId=${fromUserId}&ids=${encodeURIComponent(questionIds)}`
        );

        let banks = q.data.banks;

        // 拼答案
        let answerStr = banks.map(item =>
            `${item.questionId}:${item.qsType}:${item.qsAnswer}:${item.qsAnswer}`
        ).join(",");

        // 通知答案
        $notify(
            "📝 dsyx题目答案",
            "",
            answerStr
        );

        // 4. 提交
        await post(`${BASE}/p/questionRecord/save`, {
            courseId: parseInt(courseId),
            fromUserId: fromUserId,
            questionOption: answerStr,
            isCorrect: 0,
            shopId: shopId,
            validTimeEnd: data.validTimeEnd
        });

        // 最终通知
        $notify(
            "🎉 dsyx任务完成",
            "",
            `courseId: ${courseId}\n全部完成`
        );

    } catch (e) {
        console.log(e);
        $notify("❌ dsyx任务异常", "", String(e));
    }

    $done();

})();
