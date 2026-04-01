let body = $request.body;

try {
  let obj = JSON.parse(body);

  let memberId = obj?.memberId || "";
  let uniqueKey = obj?.uniqueKey || "";
  let memberToken = obj?.memberToken || "";

  if (memberId && uniqueKey && memberToken) {
    let result = `${memberId}#${uniqueKey}#${memberToken}`;
    let old = $prefs.valueForKey("qg2");

    if (old === result) {
      console.log("⚠️ 数据未变化，无需重复保存");
    } else {
      $prefs.setValueForKey(result, "qg2");
      $notify("✅ 提取成功", "qg2", result);
    }
  } else {
    $notify("❌ 提取失败", "", "缺少参数，请检查请求体");
  }
} catch (e) {
  $notify("❌ 脚本错误", "", e.message);
}

$done();
