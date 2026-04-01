/**
 * 新小 click - 直接完成观看 + 答题提示
 * 变量名：xinxiaoliid
 * 格式：host#activityId#token
 */

const env = $prefs.valueForKey("xinxiaoliid");
if (!env) {
  $notify("新小 click ❌", "未设置变量", "请先设置 xinxiaoliid");
  $done();
}

const [HOST, ACTIVITY_ID, TOKEN] = env.split("#");

const headers = {
  "Accept-Encoding": "gzip,compress,br,deflate",
  "content-type": "application/json",
  "Connection": "keep-alive",
  "Accept": "application/json",
  "Referer": "https://servicewechat.com/wx2fc6d16963022e66/8/page-frame.html",
  "Host": HOST,
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.63 NetType/WIFI Language/zh_CN",
  "Authorization": `Bearer ${TOKEN}`
};

function request(opt) {
  return new Promise((resolve, reject) => {
    $task.fetch(opt).then(
      resp => resolve(JSON.parse(resp.body)),
      err => reject(err)
    );
  });
}

(async () => {
  try {
    // ===== ① 获取活动详情 =====
    const detail = await request({
      url: `https://${HOST}/wcm-u/miniapp/activities?id=${ACTIVITY_ID}&withMaterial=1`,
      method: "GET",
      headers
    });

    const userActivityId = detail?.meta?.joinInfo?.userActivityId;
    const questions = detail?.data?.materialDetail?.questions || [];

    if (!userActivityId) throw "未获取到 userActivityId";

    // ===== ② 上传观看时间 =====
    const videoSeconds = Math.floor(parseFloat(detail?.data?.media?.v_time || "3000"));
    await request({
      url: `https://${HOST}/wcm-u/miniapp/activityWatchVideo`,
      method: "POST",
      headers,
      body: JSON.stringify({ userActivityId, second: videoSeconds })
    });

    // ===== ③ 观看结束 =====
    await request({
      url: `https://${HOST}/wcm-u/miniapp/activityWatchVideoOver`,
      method: "POST",
      headers,
      body: JSON.stringify({ userActivityId })
    });

    // ===== ④ 提取答案并通知 =====
    const correctItems = [];
    questions.forEach((q, i) => {
      (q.answer || []).forEach(a => {
        if (a.result === "1") correctItems.push(a.item);
      });
    });

    const answerText = correctItems.join(" & ");
    $notify("✅ 完成", "", `正确答案: ${answerText}`);

  } catch (e) {
    $notify("新小 click ❌", "执行失败", String(e));
  }

  $done();
})();
