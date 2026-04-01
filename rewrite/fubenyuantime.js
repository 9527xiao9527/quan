// 随机函数
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let body = $request.body;

try {
  let obj = JSON.parse(body);

  let value = rand(5500, 6500);

  if (obj.playProgress !== undefined) {
    obj.playProgress = value;
  }

  if (obj.playedDuration !== undefined) {
    obj.playedDuration = String(value);
  }

  $notify(
    "🎬 播放进度修改成功",
    "",
    ``
  );

  body = JSON.stringify(obj);

} catch (e) {
  $notify("❌ 修改失败", "", String(e));
}

$done({ body });
