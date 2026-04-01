
const lebobody = $prefs.valueForKey("lebobody") || "";
const lebock = $prefs.valueForKey("lebock") || "";

if (!lebobody || !lebock) {
  $notify("❌ 参数缺失", "", "请先捕获 lebobody 与 lebock");
  $done();
}

const [courseId, userId, orgId, courseSeriesId, videoId] = lebobody.split("#");
const [authorization, cookie] = lebock.split("#");

if (!courseId || !userId || !orgId || !courseSeriesId || !videoId) {
  $notify("⚠️ lebobody 参数不完整", "", lebobody);
  $done();
}

if (!authorization || !cookie) {
  $notify("⚠️ lebock 参数不完整", "", lebock);
  $done();
}

// 生成时间戳
const now = new Date();
const lastViewTime = new Date(now.getTime() - 10 * 60 * 1000)
  .toISOString()
  .replace("T", " ")
  .split(".")[0];
const firstViewTime = new Date(now.getTime() - 15 * 60 * 1000)
  .toISOString()
  .replace("T", " ")
  .split(".")[0];

// 请求体
const body = `playCompletedTimes=1&courseCompletedTimes=1&sumViewTime=3600&courseSeriesId=${courseSeriesId}&courseId=${courseId}&userId=${userId}&videoId=${videoId}&orgId=${orgId}&isAnswered=0&isCollectedRedPacket=0&packetsAmount=0&lastViewTime=${encodeURIComponent(
  lastViewTime
)}&firstViewTime=${encodeURIComponent(
  firstViewTime
)}&viewTimes=60&log=${encodeURIComponent(
  '{"deviceType":"phone","deviceModel":"PJE110","osName":"android","osVersion":"15"}'
)}`;

// 请求头
const headers = {
  //Host: "xcx1.shiyanghealth.com",
  Authorization: authorization,
  Cookie: cookie,
  "Content-Type": "application/x-www-form-urlencoded",
};

const url = "https://xcx1.wer.bjyzsw.cn/consumer/course/play_log/create-course-user";

const options = {
  url,
  method: "POST",
  headers,
  body,
};

$task.fetch(options).then(
  (response) => {
    let data = response.body;
    try {
      const res = JSON.parse(data);
      if (res && res.code === 0) {
        $notify("✅ 上报成功", "", "");
      } else {
        $notify("⚠️ 返回异常", "", data);
      }
    } catch {
      $notify("📡 返回内容", "", data);
    }
    $done();
  },
  (error) => {
    $notify("❌ 请求失败", "", JSON.stringify(error));
    $done();
  }
);
