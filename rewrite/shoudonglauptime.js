/**
 * @name watch_time 随机 4500-5000
 * @type request
 * @match *
 */

if (!$request || !$request.body) {
  $done({});
  return;
}

try {
  let body = JSON.parse($request.body);

  // 只在存在 watch_time 时修改
  if (body.hasOwnProperty("watch_time")) {
    const randomValue =
      Math.floor(Math.random() * (5000 - 4500 + 1)) + 4500;
    body.watch_time = randomValue;
  }

  $done({
    body: JSON.stringify(body)
  });

} catch (e) {
  // JSON 解析失败直接放行
  $done({});
}
