/**
 * 新小 click - 自动观看 + 自动答题
 * 变量名：xinxiaoliid
 * 格式：
 * host#activityId#token
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
  "Referer": "https://servicewechat.com/wxa4b6678371e235c4/2/page-frame.html",
  "Host": HOST,
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70(0x1800463a) NetType/WIFI Language/zh_CN",
  "Authorization": `Bearer ${TOKEN}`
};

function request(options) {
  return new Promise((resolve, reject) => {
    $task.fetch(options).then(
      resp => {
        try {
          resolve(JSON.parse(resp.body));
        } catch {
          resolve(resp.body);
        }
      },
      err => reject(err)
    );
  });
}

(async () => {
  try {

    console.log("开始获取活动详情...");

    // ================= 获取活动 =================
    const detail = await request({
      url: `https://${HOST}/wcm-u/miniapp/activities?id=${ACTIVITY_ID}&withMaterial=1`,
      method: "GET",
      headers
    });

    console.log(JSON.stringify(detail));

    const joinInfo = detail?.meta?.joinInfo || {};
    const userActivityId = joinInfo?.userActivityId;

    if (!userActivityId) {
      throw "未获取到 userActivityId";
    }

    const questions =
      detail?.data?.materialDetail?.questions || [];

    const ac_id =
      detail?.data?.activity_id;

    const videoSeconds = Math.floor(
      parseFloat(
        detail?.data?.materialDetail?.media?.v_time || "3000"
      )
    );

    console.log(`视频时长: ${videoSeconds}`);

    // ================= 上传观看 =================
    console.log("开始上传观看时长...");

    const watchRes = await request({
      url: `https://${HOST}/wcm-u/miniapp/activityWatchVideo`,
      method: "POST",
      headers,
      body: JSON.stringify({
        userActivityId,
        second: videoSeconds
      })
    });

    console.log(JSON.stringify(watchRes));

    // ================= 结束观看 =================
    console.log("结束观看...");

    const overRes = await request({
      url: `https://${HOST}/wcm-u/miniapp/activityWatchVideoOver`,
      method: "POST",
      headers,
      body: JSON.stringify({
        userActivityId
      })
    });

    console.log(JSON.stringify(overRes));

    // ================= 解析答案 =================
    console.log("开始解析答案...");

    const answerArr = [];
    const answerTextArr = [];

    questions.forEach((q, qIndex) => {

      let correctIndex = -1;
      let correctText = "";

      (q.answer || []).forEach((a, aIndex) => {

        if (a.result == "1") {
          correctIndex = aIndex;
          correctText = a.item;
        }

      });

      if (correctIndex >= 0) {

        answerArr.push(`${qIndex}_${correctIndex}`);

        answerTextArr.push(
          `第${qIndex + 1}题: ${correctText}`
        );
      }

    });

    console.log("答案数组:");
    console.log(JSON.stringify(answerArr));

    // ================= 提交答题 =================
    console.log("开始提交答题...");

    const quizRes = await request({
      url: `https://${HOST}/wcm-u/miniapp/quizzes/answers`,
      method: "POST",
      headers,
      body: JSON.stringify({
        ac_id,
        answers: answerArr
      })
    });

    console.log(JSON.stringify(quizRes));

    const reward =
      quizRes?.data?.red_money || "0";

    const status =
      quizRes?.status || "未知";

    // ================= 通知 =================
    $notify(
      "✅ 新小 click 完成",
      `答题状态: ${status} ｜ 红包: ${reward}元`,
      answerTextArr.join("\n")
    );

  } catch (e) {

    console.log(e);

    $notify(
      "新小 click ❌",
      "执行失败",
      String(e)
    );
  }

  $done();

})();