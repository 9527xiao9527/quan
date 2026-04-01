/**
 * @name 修改 timer = duration 整数值 - 3
 * @match ^https?:\/\/.*
 * @type response
 */

if (!$response.body) {
  $done({});
  return;
}

let body;
try {
  body = JSON.parse($response.body);
} catch (e) {
  console.log("❌ JSON 解析失败");
  $done({});
  return;
}

try {
  const duration = body?.data?.videoInfo?.duration;

  if (duration) {
    // 取整数并减 3
    const newTimer = Math.floor(Number(duration)) - 3;

    if (newTimer > 0) {
      body.data.timer = newTimer;
      console.log(`✅ timer 已修改为 ${newTimer}`);
    }
  }
} catch (e) {
  console.log("❌ 处理逻辑异常", e);
}

$done({ body: JSON.stringify(body) });
