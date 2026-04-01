let body = $request.body;

if (body) {
  // 提取五个参数
  let courseId = (body.match(/courseId=(\d+)/) || [])[1];
  let userId = (body.match(/userId=(\d+)/) || [])[1];
  let orgId = (body.match(/orgId=(\d+)/) || [])[1];
  let courseSeriesId = (body.match(/courseSeriesId=(\d+)/) || [])[1];
  let videoId = (body.match(/videoId=(\d+)/) || [])[1];

  if (courseId && userId && orgId && courseSeriesId && videoId) {
    // 拼接当前值
    let newValue = `${courseId}#${userId}#${orgId}#${courseSeriesId}#${videoId}`;
    let oldValue = $prefs.valueForKey("lebobody") || "";
    let lastNotify = Number($prefs.valueForKey("lebobody_notify_time") || 0);
    let now = Date.now();

    // 判断是否有变化
    if (newValue !== oldValue) {
      // 参数变化 → 立即通知
      $notify("🎯 lebobody 参数更新", "", newValue);
      $prefs.setValueForKey(newValue, "lebobody");
      $prefs.setValueForKey(String(now), "lebobody_notify_time");
    } else {
      // 未变化 → 超过5分钟才提醒
      if (now - lastNotify > 5 * 60 * 1000) {
        $notify("⏰ lebobody 定时提醒", "", newValue);
        $prefs.setValueForKey(String(now), "lebobody_notify_time");
      }
    }
  } else {
    console.log("⚠️ lebobody 参数不完整：" + body);
  }
}

$done({});
