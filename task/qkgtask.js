const url = $prefs.valueForKey("qkg_url");

if (!url) {
    $notify("错误", "", "没有捕获到URL");
    $done();
}

// 从抓到的 URL 动态提取域名（api-xxxxx.xueyouzaixian.cn）
const host = (url.match(/^https?:\/\/([^\/]+)/) || [])[1] || 'api-wh3hare.xueyouzaixian.cn';
const base = `https://${host}/frontend/web/index.php`;

const headers = {
    'Referer': 'https://servicewechat.com/wx3f997eec8cf37b5b/1/page-frame.html',
    'Connection': 'keep-alive',
    'Host': host,
    'content-type': 'application/json',
    'Accept-Encoding': 'gzip,compress,br,deflate',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70(0x1800463a) NetType/4G Language/zh_CN'
};

const sleep = t => new Promise(r => setTimeout(r, t));

// 从URL提取参数
function getParam(name) {
    let m = url.match(new RegExp(name + "=([^&]+)"));
    return m ? m[1] : "";
}

(async () => {

    const userId = getParam("userId");
    const sessionKey = getParam("sessionKey");
    const courseId = getParam("courseId");
    const consultantId = getParam("consultantId");
    const corpId = getParam("corpId");

    // 1️⃣ enter（获取课程信息）
    let enterRes = await $task.fetch({ url, headers });
    let enterData = JSON.parse(enterRes.body).data;

    let memberId = enterData.memberId;
    let duration = enterData.duration;

    // ✅ 多题处理
    let answers = (enterData.assignment || []).map(i => i.answer);

    console.log("memberId:", memberId);
    console.log("duration:", duration);
    console.log("answers:", answers);

    await sleep(800);

    // 2️⃣ progress
    let progress = duration - 1;

    let progressUrl = `${base}?r=term-course/progress&userId=${userId}&sessionKey=${sessionKey}&courseId=${courseId}&memberId=${memberId}&progress=${progress}`;

    let p = await $task.fetch({ url: progressUrl, headers });
    console.log("progress:", p.body);

    await sleep(800);

    // 3️⃣ finish
    let finishUrl = `${base}?r=term-course/finish&userId=${userId}&sessionKey=${sessionKey}&courseId=${courseId}`;

    let f = await $task.fetch({ url: finishUrl, headers });
    console.log("finish:", f.body);

    await sleep(800);

    // 4️⃣ assignment（有题才提交）
    if (answers.length > 0) {

        let ans = encodeURIComponent(JSON.stringify(answers));

        let answerUrl = `${base}?r=term-course/assignment&userId=${userId}&sessionKey=${sessionKey}&courseId=${courseId}&consultantId=${consultantId}&checkLog=1&answer=${ans}`;

        let a = await $task.fetch({ url: answerUrl, headers });
        console.log("answer:", a.body);

        $notify("完成（含答题）", "", a.body);

    } else {
        $notify("完成（无题目）", "", "课程已完成");
    }

    $done();

})();
