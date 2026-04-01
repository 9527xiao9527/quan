/**
 * @name 提取正确答案并通知
 * @description correctFlag=Y 的 content，支持 resultSelect，多题多行
 * @author 蛋蛋
 */

let body = $response.body;
let data;

try {
  data = JSON.parse(body);
} catch (e) {
  $done({});
  return;
}

let list = data?.data?.questionDetailVOList || [];
let result = [];

for (let q of list) {
  let select = q.resultSelect || "";
  let options = q.questionDetailOptionsVOList || [];

  for (let opt of options) {
    if (opt.correctFlag === "Y") {
      // 去 HTML 标签
      let text = opt.content
        ?.replace(/<[^>]+>/g, "")
        ?.trim();

      if (text) {
        if (select) {
          result.push(`${select}.${text}`);
        } else {
          result.push(text);
        }
      }
      break;
    }
  }
}

if (result.length > 0) {
  $notify(
    "📘 答题结果",
    "正确答案",
    result.join("\n")
  );
}

$done({});
