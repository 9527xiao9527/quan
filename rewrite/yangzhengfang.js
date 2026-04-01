!(async () => {
  try {
    let body = $request.body;
    let obj = JSON.parse(body);

    let randomProgress = Math.floor(Math.random() * (4500 - 3600 + 1)) + 3600;
    let randomWatchTime = Math.floor(Math.random() * (4500 - 3600 + 1)) + 3600;

    if (obj.hasOwnProperty("progress")) {
      obj.progress = randomProgress;
    }
    if (obj.hasOwnProperty("watch_time")) {
      obj.watch_time = randomWatchTime;
    }

    $notify("🎯 修改成功", "", `progress: ${randomProgress}\nwatch_time: ${randomWatchTime}`);

    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    $notify("❌ 修改失败", "", e.message);
    $done({});
  }
})();
