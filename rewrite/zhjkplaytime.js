let body = $response.body;

try {
  let obj = JSON.parse(body);

  obj.playtimeNumber = 5000;

  body = JSON.stringify(obj);
} catch (e) {
  console.log("❌ 解析失败:", e);
}

$done({ body });
