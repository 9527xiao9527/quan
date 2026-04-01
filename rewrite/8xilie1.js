
if ($response?.body) {
  $prefs.setValueForKey($response.body, "live_answer_detail");
  console.log("✅ 已保存 answerDetail 数据");
}
$done({});
