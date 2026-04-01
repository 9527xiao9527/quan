// 随机函数
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let body = $request.body;

try {
  let obj = JSON.parse(body);

  let value = rand(8000, 9000);

  if (obj.recentViewTime !== undefined) {
    obj.recentViewTime = value;
  }

  $notify(
    "🎬 修改成功",
    "",
    `当前值: ${value}`
  );

  body = JSON.stringify(obj);

} catch (e) {
  $notify("❌ 修改失败", "", String(e));
}

$done({ body });
