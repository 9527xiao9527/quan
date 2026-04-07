let body = $request.body;

const FAIL_FLAG_KEY = "qg2_fail_flag"; // 失败标记

try {
  let obj = JSON.parse(body);

  let memberId = obj?.memberId || "";
  let uniqueKey = obj?.uniqueKey || "";
  let memberToken = obj?.memberToken || "";

  if (memberId && uniqueKey && memberToken) {
    let result = `${memberId}#${uniqueKey}#${memberToken}`;
    let old = $prefs.valueForKey("qg2");

    // ✅ 成功后清除失败标记
    $prefs.removeValueForKey(FAIL_FLAG_KEY);

    if (old === result) {
      console.log("⚠️ 数据未变化，不通知");
    } else {
      $prefs.setValueForKey(result, "qg2");
      $notify("✅ 提取成功", "qg2", result);
    }

  } else {
    handleFail("缺少参数，请检查请求体");
  }

} catch (e) {
  handleFail(e.message);
}

function handleFail(msg) {
  let failFlag = $prefs.valueForKey(FAIL_FLAG_KEY);

  // ❗只通知一次失败
  if (!failFlag) {
    $notify("❌ 提取失败", "", msg);
    $prefs.setValueForKey("1", FAIL_FLAG_KEY);
  } else {
    console.log("⚠️ 已失败过，不重复通知");
  }
}

$done();
