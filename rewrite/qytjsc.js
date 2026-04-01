/**
 * @fileoverview 发送学习进度请求
 * 从持久化存储 jwj 读取参数并发送请求
 */

// 从持久化存储中读取 jwj
function getJWJ() {
  return $prefs.valueForKey("jwj");
}

// 生成13位时间戳
function generate13DigitTimestamp() {
  return Date.now().toString();
}

// 主函数
function main() {
  try {
    const jwj = getJWJ();
    if (!jwj) {
      $notify("❌ 发送失败", "", "本地变量 jwj 不存在");
      return $done();
    }

    const [
      trainId,
      courseId,
      subjectId,
      bannerId,
      watchTime,
      _currentSendMillis, // 不使用，保持结构一致
      token
    ] = jwj.split("#");

    // 参数校验
    const missing = [];
    if (!trainId) missing.push("trainId");
    if (!courseId) missing.push("courseId");
    if (!subjectId) missing.push("subjectId");
    if (!bannerId) missing.push("bannerId");
    if (!watchTime) missing.push("watchTime");
    if (!token) missing.push("token");

    if (missing.length > 0) {
      $notify("❌ 发送失败", "", `缺少参数：${missing.join(", ")}`);
      return $done();
    }

    // watchTime 转整数
    const watchTimeInt = parseInt(watchTime);

    // 当前时间戳
    const currentClientMillis = generate13DigitTimestamp();

    // 构造请求
    const url = `https://release.chaopinkj.cn/api/course/sendProcessView5Second`;
    const method = `POST`;
    const headers = {
      'Accept-Encoding': `gzip,compress,br,deflate`,
      'content-type': `application/json`,
      'Connection': `keep-alive`,
      'Referer': `https://servicewechat.com/wxc3c482a4f8d060ad/14/page-frame.html`,
      'Host': `release.chaopinkj.cn`,
      'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.65(0x18004132) NetType/WIFI Language/zh_CN`,
      'token': token
    };

    const bodyData = {
      trainId: parseInt(trainId),
      subjectId: parseInt(subjectId),
      courseId: parseInt(courseId),
      bannerId: parseInt(bannerId),
      playWeight: "720p",
      currentClientMillis: parseInt(currentClientMillis),
      currentSendMillis: watchTimeInt,
      watchTime: watchTimeInt,
      loadProgress: 99
    };

    const myRequest = {
      url,
      method,
      headers,
      body: JSON.stringify(bodyData)
    };

    // 发送请求
    $task.fetch(myRequest).then(response => {
      try {
        const res = JSON.parse(response.body);
        if (res.code === 200) {
          $notify("✅ 学习进度上报成功", "", res.msg || "成功");
        } else {
          $notify(
            "❌ 学习进度上报失败",
            "",
            `code: ${res.code} ${res.msg || ""}`
          );
        }
      } catch (e) {
        $notify("❌ 学习进度上报失败", "", "响应解析失败");
      }
      $done();
    }, reason => {
      $notify("❌ 学习进度上报失败", "", reason.error || "请求异常");
      $done();
    });

  } catch (error) {
    $notify("❌ 脚本执行异常", "", error.message || String(error));
    $done();
  }
}

// 执行
main();
