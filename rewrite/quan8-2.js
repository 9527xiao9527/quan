let body = $response.body;

try {
  let obj = JSON.parse(body);

  if (obj?.data?.courseVideoDetails?.duration) {
    // 修改字段
    obj.data.isFinish = 1;
    obj.data.playDuration = obj.data.courseVideoDetails.duration;

    // 提取答案
    let answers = [];
    let qList = obj.data.courseVideoDetails.questionBankList || [];
    for (let q of qList) {
      try {
        let options = JSON.parse(q.question);
        let correct = options.find(o => o.isAnswer === 1);
        if (correct) {
          answers.push(correct.name);
        }
      } catch (e) {
        console.log("解析题目失败: " + e);
      }
    }

    if (answers.length > 0) {
      $notify("✅ 提取答案成功", "", answers.join("\n"));
    } else {
      $notify("❌ 未找到答案", "", "");
    }

    // 也可以附加到返回体里
    obj.data.correctAnswers = answers;
  }

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  console.log("❌ 修改失败: " + e);
  $notify("❌ 脚本错误", "", e + "");
  $done({});
}
