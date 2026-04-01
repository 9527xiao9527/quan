// 从响应体中提取并保存视频信息（统一写入 jwj）
if ($response && $response.body) {
  try {
    const responseBody = JSON.parse($response.body);

    if (responseBody.code !== 200) {
      $notify("❌ 写入 jwj 失败", "", "接口返回异常");
      return $done({});
    }

    const data = responseBody.data || {};
    const missing = [];

    const trainId   = data.trainId   || (missing.push("trainId"), "");
    const courseId  = data.courseId  || (missing.push("courseId"), "");
    const subjectId = data.subjectId || (missing.push("subjectId"), "");
    const bannerId  = data.bannerId  || (missing.push("bannerId"), "");

    let watchTime = "";
    if (data?.videoInfo?.duration) {
      const num = parseFloat(data.videoInfo.duration);
      if (!isNaN(num)) {
        watchTime = (num - 9).toFixed(3);
      } else {
        missing.push("watchTime");
      }
    } else {
      missing.push("watchTime");
    }

    const currentSendMillis = Date.now().toString();

    let token = "";
    if ($request && $request.headers) {
      token = $request.headers["token"] || $request.headers["Token"] || "";
    }
    if (!token) missing.push("token");

    // ❌ 缺参数：直接失败通知
    if (missing.length > 0) {
      $notify(
        "❌ 写入 jwj 失败",
        "",
        `缺少参数：${missing.join(", ")}`
      );
      return $done({});
    }

    // ✅ 能走到这里，就认为是“成功”
    const jwj = [
      trainId,
      courseId,
      subjectId,
      bannerId,
      watchTime,
      currentSendMillis,
      token
    ].join("#");

    $prefs.setValueForKey(jwj, "jwj");

    $notify("✅ 写入 jwj 成功", "", "参数已完整保存");

  } catch (e) {
    $notify("❌ 写入 jwj 异常", "", e.message || String(e));
  }
}

$done({});
