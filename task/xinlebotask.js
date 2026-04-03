// 乐播课程自动完成 Task
// 变量 xinlebo 格式: detailUrl#token
// detailUrl 示例: https://lbxapi.myzxyx.com/consumer/course-video/detail?id=306141&userPhone=0&viewPermission=1&adminUserId=9286&encryptId=926707

const xinlebo = $prefs.valueForKey("xinlebo") || "";
if (!xinlebo) {
  $notify("❌ 乐播", "缺少参数", "请先打开小程序进入任意课程，触发重写脚本保存变量");
  $done();
}

const sepIdx = xinlebo.indexOf("#");
const detailUrl = xinlebo.substring(0, sepIdx);
const authorization = xinlebo.substring(sepIdx + 1);

if (!detailUrl || !authorization) {
  $notify("❌ 乐播", "参数格式错误", "xinlebo 应为 detailUrl#token");
  $done();
}

// 从 detailUrl 解析 courseId 和 encryptId
const urlObj = new URL(detailUrl);
const hostname = urlObj.hostname;
const courseId = parseInt(urlObj.searchParams.get("id"));
const encryptId = parseInt(urlObj.searchParams.get("encryptId"));
const adminUserId = urlObj.searchParams.get("adminUserId") || "9286";

const baseHeaders = {
  Authorization: authorization,
  version: "2.9.5",
  "content-type": "application/json",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.63(0x18003f2f) NetType/WIFI Language/zh_CN",
  Referer: "https://servicewechat.com/wxac216c87677e8746/1/page-frame.html",
};

const fmt = (d) => d.toISOString().replace("T", " ").split(".")[0];

function fetch(url, method, body) {
  return $task.fetch({
    url,
    method,
    headers: baseHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function parseResp(resp) {
  try { return JSON.parse(resp.body); } catch { return null; }
}

// 串行执行：获取详情 → play_log → 答题 → play_log → 验证
fetch(
  detailUrl,
  "GET"
).then((resp) => {
  const res = parseResp(resp);
  if (!res || !res.data) {
    $notify("❌ 乐播", "获取课程详情失败", resp.body);
    $done();
    return;
  }

  const d = res.data;
  if (d.isCompletedCourse) {
    $notify("✅ 乐播", "课程已完成", d.title || `courseId=${courseId}`);
    $done();
    return;
  }

  const { videoId, duration, questionDetail, courseSeriesId, orgId } = d;
  // 从 JWT 解析 userId
  const jwtPayload = JSON.parse(atob(authorization.replace("Bearer ", "").split(".")[1]));
  const userId = jwtPayload.Id;

  // 找正确答案
  let answerIndex = 0;
  if (questionDetail && questionDetail.options) {
    const opts = typeof questionDetail.options === "string"
      ? JSON.parse(questionDetail.options) : questionDetail.options;
    const idx = opts.findIndex((o) => o.answer === true);
    if (idx >= 0) answerIndex = idx;
  }

  const now = new Date();
  const needViewTime = (duration || 95) + 10;
  const playLogBase = {
    courseSeriesId, courseId, userId, videoId, orgId,
    isCollectedRedPacket: 0, packetsAmount: 0,
    sumViewTime: needViewTime,
    lastViewTime: fmt(new Date(now.getTime() - 5000)),
    firstViewTime: fmt(new Date(now.getTime() - (needViewTime + 60) * 1000)),
    viewTimes: 5,
    currentPlayTime: String(needViewTime),
    log: JSON.stringify({
      deviceType: "phone", deviceBrand: "iphone",
      deviceModel: "iPhone 13 Pro Max<iPhone14,3>",
      osName: "ios", osVersion: "15.4.1",
      hostName: "WeChat", hostVersion: "8.0.63",
    }),
    source: "miniprogram",
  };

  // play_log 1
  return fetch(
    `https://${hostname}/consumer/course/play_log/create-course-user`,
    "POST",
    { ...playLogBase, isAnswered: 0, courseCompletedTimes: 1 }
  ).then(() => {
    return fetch(
      `https://${hostname}/consumer/course-video/answer`,
      "POST",
      { answer: answerIndex, id: courseId, encryptId, source: "miniprogram" }
    );
  }).then((ansResp) => {
    const ansRes = parseResp(ansResp);
    const reward = ansRes && ansRes.data ? `红包: ¥${ansRes.data.amount}` : "";
    return fetch(
      `https://${hostname}/consumer/course/play_log/create-course-user`,
      "POST",
      {
        ...playLogBase,
        isAnswered: 1,
        sumViewTime: needViewTime + 20,
        currentPlayTime: String(needViewTime + 20),
        lastViewTime: fmt(new Date()),
      }
    ).then(() => ({ reward }));
  }).then(({ reward }) => {
    return fetch(
      `https://${hostname}/consumer/course-video/detail?id=${courseId}&userPhone=0&viewPermission=1&adminUserId=${adminUserId}&encryptId=${encryptId}`,
      "GET"
    ).then((checkResp) => {
      const checkRes = parseResp(checkResp);
      const cd = checkRes && checkRes.data;
      if (cd && cd.isCompletedCourse) {
        $notify("✅ 乐播完成", d.title || `courseId=${courseId}`, reward || "课程已标记完成");
      } else {
        $notify("⚠️ 乐播", "请求已发送但状态未更新", "请刷新小程序查看");
      }
      $done();
    });
  });
}).catch((err) => {
  $notify("❌ 乐播", "请求异常", JSON.stringify(err));
  $done();
});
