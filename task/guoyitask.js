const KEY = "xk_params";
let conf = $prefs.valueForKey(KEY);

if (!conf) {
    $notify("执行失败", "", "请先打开课程触发重写脚本！");
    $done();
}

function get(k) {
    let m = conf.match(new RegExp(k + "=([^#]+)"));
    return m ? m[1] : "";
}

// ========== 读取参数 ==========
let host = get("host");
let token = get("token");
let classId = Number(get("classId"));
let sessionId = Number(get("sessionId"));
let periodId = Number(get("periodId"));
let played = Number(get("played"));
let questions = JSON.parse(decodeURIComponent(get("questions")));

// ============================================================
// ① 上报播放进度
// ============================================================

let learnUrl = `https://${host}/xk/kc/client/class/save/learn`;

let learnBody = {
    action: "player:playing",
    classId,
    sessionId,
    periodId,
    playCount: 0,
    playOver: 2,
    curTime: played,
    playDuration: played,
    playedDuration: played,
    totalPlayDuration: played,
    startReport: played
};

let headers = {
    "Content-Type": "application/json",
    "token": token
};

console.log("上报参数:", learnBody);

$task.fetch({
    url: learnUrl,
    method: "POST",
    headers,
    body: JSON.stringify(learnBody)
}).then(res => {

    console.log("上报播放进度返回：", res.body);

    // ========================================================
    // ② 提交答题
    // ========================================================

    let askUrl = `https://${host}/xk/kc/client/class/submit/work`;

    let askBody = {
        classId,
        sessionId,
        periodId,
        playedDuration: played,
        workAnswer: questions
    };

    console.log("答题参数:", askBody);

    return $task.fetch({
        url: askUrl,
        method: "POST",
        headers,
        body: JSON.stringify(askBody)
    });

}).then(res => {

    console.log("答题返回：", res.body);

    // ================================
    // ⭐ 答案整理显示
    // ================================
    let answerText = "";

    if (Array.isArray(questions)) {
        questions.forEach((q, i) => {
            let ans = Array.isArray(q.answer)
                ? q.answer.join(",")
                : q.answer;
            answerText += `第${i + 1}题：${ans}\n`;
        });
    } else {
        answerText = JSON.stringify(questions, null, 2);
    }

    $notify(
        "上报成功 ✅",
        "",
        "" + answerText
    );

    $done();

}).catch(err => {
    $notify("错误", "", JSON.stringify(err));
    $done();
});
