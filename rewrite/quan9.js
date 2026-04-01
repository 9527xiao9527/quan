/**
 * @name 提取 URL + Headers 到本地变量 quan9
 * @description 保存格式：url#headers(JSON字符串)
 */

if (!$request) {
  $done({});
  return;
}

const url = $request.url;
const headers = $request.headers || {};

// headers 转字符串（方便存储）
const headersStr = JSON.stringify(headers);

// 组合变量
const value = `${url}#${headersStr}`;

// 写入本地变量
$prefs.setValueForKey(value, "quan9");

// 可选通知（需要的话保留，不需要可删）
$notify(
  "QuanX 参数提取成功",
  "",
  `已保存到变量 quan9`
);

$done({});
