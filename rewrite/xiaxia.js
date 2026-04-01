/*************************
 * 圈X 重写响应体
 * 强制 answerCount / answerState = 1
 *************************/

let obj = {};
try {
  obj = JSON.parse($response.body);
} catch (e) {
  $done({});
  return;
}

if (obj?.data) {
  obj.data.answerCount = 1;
  obj.data.answerState = 1;
}

$done({ body: JSON.stringify(obj) });
