const body = $response.body;
let obj = JSON.parse(body);

try {
  const options = JSON.parse(obj.data?.questionDetail?.options || '[]');
  const correct = options.find(opt => opt.answer === true);
  if (correct) {
    console.log("✅ 正确答案: " + correct.content);
    $notify("乐播答案", "", correct.content);
  } else {
    console.log("❌ 未找到正确答案");
  }
} catch (e) {
  console.log("❌ 解析出错: " + e);
}

$done({});

