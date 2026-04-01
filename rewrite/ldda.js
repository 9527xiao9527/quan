let obj = JSON.parse($response.body);

// 提取 Duration 存入 BoxJs（覆盖旧值）
if (obj.Data && obj.Data.VideoEntity && obj.Data.VideoEntity.Duration) {
  let duration = obj.Data.VideoEntity.Duration;
  $prefs.setValueForKey(duration.toString(), "xjjk_duration");
}

// 弹窗显示第一个题目的答案
if (obj.Data && obj.Data.QuestionsList && obj.Data.QuestionsList[0] && obj.Data.QuestionsList[0].Answer) {
  let answer = obj.Data.QuestionsList[0].Answer;
  $notify("答题提示", "", `答案是：${answer}`);
}

$done({ body: JSON.stringify(obj) });