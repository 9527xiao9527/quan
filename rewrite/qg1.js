const url = $request.url;

try {
  let topicId = url.match(/topicId=(\d+)/)?.[1] || "";
  let merchantId = url.match(/merchantId=(\d+)/)?.[1] || "";
  let verifyCode = url.match(/verifyCode=([^&]+)/)?.[1] || "";
  let paramSign = url.match(/paramSign=([^&]+)/)?.[1] || "";

  if (topicId && merchantId && verifyCode && paramSign) {
    let result = `${topicId}#${merchantId}#${verifyCode}#${paramSign}`;
    let old = $prefs.valueForKey("qg1");

    if (old === result) {
      console.log("⚠️ 数据未变化，无需重复保存");
    } else {
      $prefs.setValueForKey(result, "qg1");
      $notify("✅ 提取成功", "", result);
    }
  } else {
    $notify("❌ 提取失败", "", "缺少参数，请检查URL");
  }
} catch (e) {
  $notify("❌ 脚本错误", "", e.message);
}

$done();
