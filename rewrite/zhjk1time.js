/**
 * Quantumult X 重写响应体
 * 将 playtime_number 修改为 102
 */

let body = $response.body;

try {
  let obj = JSON.parse(body);
  if (obj?.data && obj.data.playtime_number !== undefined) {
    obj.data.playtime_number = 102;
  }
  body = JSON.stringify(obj);
} catch (e) {}

$done({ body });
