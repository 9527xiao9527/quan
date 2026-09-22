/*
========================================
  修改视频进度参数
  positionSeconds = videoSeconds
  watchedSeconds  = videoSeconds
========================================
*/

const body = $request.body;

if (!body) {
    console.log("❌ 未获取到请求体");
    $done({});
}

try {
    const data = JSON.parse(body);

    // 获取 videoSeconds
    const videoSeconds = Number(data.videoSeconds);

    if (!Number.isFinite(videoSeconds)) {
        console.log("❌ 未找到有效的 videoSeconds");
        $done({});
    }

    // 保存修改前的值
    const oldPosition = data.positionSeconds;
    const oldWatched = data.watchedSeconds;

    // 修改
    data.positionSeconds = videoSeconds;
    data.watchedSeconds = videoSeconds;
/*
    // QX 通知
    $notify(
        "视频进度修改成功",
        `videoSeconds：${videoSeconds}`,
        `positionSeconds：${oldPosition} → ${videoSeconds}\nwatchedSeconds：${oldWatched} → ${videoSeconds}`
    );

    console.log(
        `✅ 修改成功：videoSeconds=${videoSeconds}，positionSeconds=${oldPosition}→${videoSeconds}，watchedSeconds=${oldWatched}→${videoSeconds}`
    );
*/
    $done({
        body: JSON.stringify(data)
    });

} catch (e) {
    console.log("❌ JSON解析失败：" + e);
    $done({});
}