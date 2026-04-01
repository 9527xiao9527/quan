let body = $response.body;

try {
  let obj = JSON.parse(body);

  const data = obj?.data || {};
  const program = data.programPlayRecords || {};
  const files = data.files || [];
  const questions = data.questions || [];

  //修改 backPlayDuration 为 videoDuration
  if (files.length > 0 && files[0].videoDuration) {
    program.backPlayDuration = files[0].videoDuration;
  }


  const correctAnswers = questions.map(q => {
    const correct = q.questionsDetails?.find(opt => opt.isCorrect === "true");
    return correct?.optionText || null;
  }).filter(Boolean);


  if (correctAnswers.length > 0) {
    $notify("🎯 正确答案", "", correctAnswers.join("\n"));
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log("❌ 解析失败：", e);
}

$done({ body });
