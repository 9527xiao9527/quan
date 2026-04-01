let body = $response.body;

try {
  let obj = JSON.parse(body);

  let list = obj?.data?.banks || [];
  let result = [];

  list.forEach(item => {
    let answer = item.qsAnswer; // 正确答案字母
    let options = item.qsOption.split("^");

    let match = options.find(opt => opt.startsWith(answer + "."));

    if (match) {
      result.push(match);
    }
  });

  if (result.length > 0) {
    $notify(
      "📚 答案提取成功",
      "",
      result.join("\n")
    );
  } else {
    $notify("⚠️ 未找到答案", "", "");
  }

} catch (e) {
  $notify("❌ 解析失败", "", String(e));
}

$done({});