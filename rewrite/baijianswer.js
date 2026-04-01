let body = $response.body;
try {
  const obj = JSON.parse(body);
  const list = obj?.data?.list || [];

  let correctAnswers = [];

  for (const q of list) {
    const correct = q.options.find(opt => opt.is_correct === 1);
    if (correct) {
      correctAnswers.push(`✅ ${correct.tip}：${correct.content}`);
    }
  }

  if (correctAnswers.length > 0) {
    $notify("📖 正确答案", "", correctAnswers.join("\n"));
  }

  $done({});
} catch (e) {
  console.log("解析失败：" + e);
  $done({});
}
