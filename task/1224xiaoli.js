/**
 * 新小 click - 自动观看 + 答题 + 领奖（修正版）
 * 变量名：xinxiaoliid
 * 格式：host#acid#token
 */

const env = $prefs.valueForKey("xinxiaoliid");
if (!env) {
  $notify("新小 click", "❌ 未设置变量", "请先设置 xinxiaoliid");
  $done();
}

const [HOST, acid, token] = env.split("#");
if (!HOST || !acid || !token) {
  $notify("新小 click", "❌ 变量格式错误", "应为 host#acid#token");
  $done();
}

const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62 NetType/WIFI Language/zh_CN"
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
    /* ===== 获取活动详情 ===== */
    const detail = await request({
      url: `https://${HOST}/wcm-u/v1/activityDetatil?id=${acid}&withMaterial=1`,
      method: "GET",
      headers
    });

    const userActivityId = detail?.meta?.joinInfo?.userActivityId;
    const ac_id = detail?.data?.activity_id;
    const questions = detail?.data?.materialDetail?.questions || [];

    if (!userActivityId || !ac_id || questions.length === 0) {
      $notify("新小 click", "❌ 获取活动信息失败", JSON.stringify(detail));
      return $done();
    }

    /* ===== 构造正确 answers（核心修正点） ===== */
    const answers = [];

    questions.forEach((q, qi) => {
      (q.answer || []).forEach((a, ai) => {
        if (a.result === "1") {
          answers.push(`${qi}_${ai}`);
        }
      });
    });

    /* ===== 上报观看 ===== */
    const seconds = Math.floor(Math.random() * 600) + 3600;

    await request({
      url: `https://${HOST}/wcm-u/v1/activityWatchVideo`,
      method: "POST",
      headers,
      body: JSON.stringify({
        userActivityId,
        second: seconds
      })
    });

    await request({
      url: `https://${HOST}/wcm-u/v1/activityWatchVideoOver`,
      method: "POST",
      headers,
      body: JSON.stringify({ userActivityId })
    });

    /* ===== 提交答题 + 领奖 ===== */
    const res = await request({
      url: `https://${HOST}/wcm-u/v1/receiveAwardAndWatchOver`,
      method: "POST",
      headers,
      body: JSON.stringify({
        ac_id,
        answers
      })
    });

    if (res?.status_code === 200 && res?.data?.red_money) {
      $notify(
        "新小 click ✅ 答题成功",
        "",
        `奖励 ${res.data.red_money} 元`
      );
    } else {
      $notify(
        "新小 click ❌ 提交失败",
        "",
        JSON.stringify(res)
      );
    }

  } catch (e) {
    $notify("新小 click ❌ 异常", "", String(e));
  }

  $done();
})();
