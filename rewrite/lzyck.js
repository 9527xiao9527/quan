/**
 * @name 提取 token 和 param 保存到本地变量 lzybody
 */

(function() {
  try {
    // 提取请求头 token
    const token = $request.headers["token"] || $request.headers["authorization"] || $request.headers["X-Token"] || $request.headers["x-token"];
    if (!token) throw "未找到请求头 token";

    // 提取请求体 param
    let body = $request.body;
    if (!body) throw "未找到请求体";

    let param = "";
    try {
      const bodyJson = JSON.parse(body);
      param = bodyJson.param || "";
    } catch (e) {
      throw "请求体解析失败: " + e;
    }

    if (!param) throw "未找到 param";

    // 拼接 token#param
    const value = `${token}#${param}`;

    // 保存到本地变量 lzybody
    $prefs.setValueForKey(value, "lzybody");

    // 通知获取成功
    $notify("✅ LZYBody 获取成功", "", value);

  } catch (err) {
    $notify("❌ LZYBody 获取失败", "", String(err));
  }

  $done({});
})();
