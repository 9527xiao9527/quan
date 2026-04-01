/**
 * @name llss 重写直跑 statistics save2（随机视频时长）
 */

if (!$request.body || !$request.url) {
  $done({});
  return;
}

/* ===== 提取当前请求的 host ===== */
let reqHost = "";
try {
  reqHost = new URL($request.url).host;
} catch (e) {
  console.log("❌ URL 解析失败");
  $done({});
  return;
}

let data;
try {
  data = JSON.parse($request.body);
} catch (e) {
  console.log("❌ JSON 解析失败");
  $done({});
  return;
}

const { contactId, detailInfoId, userId } = data || {};

if (!contactId || !detailInfoId || !userId) {
  console.log("❌ 参数缺失");
  $done({});
  return;
}

// === 随机视频时长 4500–5000 ===
function rand(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(3);
}

const videoTime = rand(5000, 5500);
const playLocation = videoTime;

// === 新接口（host 动态）===
const url = `https://${reqHost}/hd/api/front/statistics/class-user-statistics/save2`;

const headers = {
  'Accept-Encoding': 'gzip,compress,br,deflate',
  'content-type': 'application/json',
  'Connection': 'keep-alive',
  'Referer': 'https://servicewechat.com/wx1f92c086f0c25120/1/page-frame.html',
  'Host': reqHost,
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62 NetType/4G Language/zh_CN'
};

const body = JSON.stringify({
  userId: contactId,      // 对应你给的 userId
  classId: detailInfoId,
  sysUserId: userId,
  videoTime: videoTime,
  playLocation: playLocation
});

$task.fetch({
  url,
  method: "POST",
  headers,
  body
}).then(resp => {
  try {
    const res = JSON.parse(resp.body);
    $notify("📘 视频学习", "", res.message || "未知结果");
  } catch (e) {
    console.log("❌ 响应解析失败");
  }
  $done({});
}, err => {
  console.log("❌ 请求失败", err);
  $done({});
});
