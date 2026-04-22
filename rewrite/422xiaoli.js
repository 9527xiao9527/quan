
let req = {
  url: $request.url,
  headers: $request.headers
};

// 清理一些没用/会导致问题的头（可选）
delete req.headers["Content-Length"];
delete req.headers["content-length"];

$prefs.setValueForKey(JSON.stringify(req), "0422xiaoli");

console.log("✅ 已保存完整请求");
$notify("0422小丽", "", "完整请求已获取");

$done({});
