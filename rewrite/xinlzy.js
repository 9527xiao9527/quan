/**
 * @name watchTime & currentSendMillis 随机 + loadProgress=100（通知版）
 */

if (!$request.body) {
  $done({});
  return;
}

let body;
try {
  body = JSON.parse($request.body);
} catch (e) {
  console.log("❌ body 不是 JSON");
  $done({});
  return;
}

// 生成 4500 - 5000 随机整数
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomTime = rand(4500, 5000);

// 修改字段
body.watchTime = randomTime;
body.currentSendMillis = randomTime;
body.loadProgress = 100;

// 通知
$notify(
  "🎬 观看时长已改写",
  `watchTime / currentSendMillis`,
  `随机值：${randomTime}，loadProgress=100`
);

console.log(`✅ 已修改 watchTime=${randomTime}, currentSendMillis=${randomTime}`);

$done({ body: JSON.stringify(body) });
