let headers = $request.headers;

if (headers) {
  // 获取 Authorization 与 Cookie
  let authorization = headers["Authorization"] || headers["authorization"] || "";
  let cookie = headers["Cookie"] || headers["cookie"] || "";

  if (authorization && cookie) {
    let newValue = `${authorization}#${cookie}`;
    let oldValue = $prefs.valueForKey("lebock") || "";
    let lastNotify = Number($prefs.valueForKey("lebock_notify_time") || 0);
    let now = Date.now();

    // 判断是否有变化
    if (newValue !== oldValue) {
      // 有变化 → 立即通知
      $notify("🔑 lebock 参数更新", "", newValue);
      $prefs.setValueForKey(newValue, "lebock");
      $prefs.setValueForKey(String(now), "lebock_notify_time");
    } else {
      // 无变化 → 超过5分钟提醒一次
      if (now - lastNotify > 5 * 60 * 1000) {
        $notify("⏰ lebock 定时提醒", "", newValue);
        $prefs.setValueForKey(String(now), "lebock_notify_time");
      }
    }
  } else {
    console.log("⚠️ lebock 参数不完整：" + JSON.stringify(headers));
  }
}

$done({});
