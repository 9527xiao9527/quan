/**
 * @name llss 提取正确答案并通知
 */

let body = $response.body;
if (!body) {
  $done({});
  return;
}

let obj;
try {
  obj = JSON.parse(body);
} catch (e) {
  console.log("❌ JSON 解析失败");
  $done({});
  return;
}

const items = obj?.data?.practice?.questionBankItems;
if (!Array.isArray(items) || items.length === 0) {
  $done({});
  return;
}

let notifyList = [];

items.forEach((q, idx) => {
  const answerKey = String(q.answer); // 保证字符串
  const content = q.content || [];

  const hit = content.find(i => String(i.key) === answerKey);
  if (hit) {
    notifyList.push(`第${idx + 1}题：${hit.value}`);
  }
});

if (notifyList.length > 0) {
  $notify(
    "📘 正确答案",
    "",
    notifyList.join("\n")
  );
}

$done({});
