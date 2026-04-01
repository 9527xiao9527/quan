/**
 * Quantumult X 重写请求体
 * 修改 playtime_number 为 102
 */

let body = $request.body;

try {
  let obj = JSON.parse(body);
  if (obj.playtime_number !== undefined) {
    obj.playtime_number = 102;
  }
  body = JSON.stringify(obj);
} catch (e) {}

$done({ body });
