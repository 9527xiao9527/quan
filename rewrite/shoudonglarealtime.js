/**
 * @name 修改 resultData 为 4500-5000 随机值
 * @match *
 * @type response
 */

if (!$response || !$response.body) {
  $done({});
  return;
}

try {
  let obj = JSON.parse($response.body);

  // 只在存在 resultData 时修改
  if (obj.hasOwnProperty("resultData")) {
    // 生成 4500 - 5000 的随机整数
    const randomValue = Math.floor(Math.random() * (5000 - 4500 + 1)) + 4500;
    obj.resultData = randomValue;
  }

  $done({ body: JSON.stringify(obj) });

} catch (e) {
  // 解析失败直接放行
  $done({});
}
