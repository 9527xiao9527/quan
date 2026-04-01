let body = $response.body;

try {
  const obj = JSON.parse(body);
  const list = obj?.data;

  if (Array.isArray(list)) {
    const correctOptions = [];

    for (const question of list) {
      const options = question?.options || [];
      const correct = options.find(opt => opt.isCorrect === true);
      if (correct) {
        correctOptions.push(`${correct.label}. ${correct.content}`);
      }
    }

    if (correctOptions.length > 0) {
      $notify("✅ 正确答案", "", correctOptions.join("\n"));
    }
  }
} catch (e) {
  console.log("解析失败:", e);
}

$done({});
