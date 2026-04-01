const headers = $request.headers;
const token = headers["X-TOKEN"] || headers["X-Token"];
const host = $request.url.match(/^https:\/\/([^\/]+)/)?.[1];

if (token) {
  $prefs.setValueForKey(token, "x_token");
  console.log("✅ 已保存 X-Token: " + token);
} else {
  console.log("❌ 未找到 X-Token");
}

if (host) {
  $prefs.setValueForKey(host, "x_host");
  console.log("✅ 已保存 Host: " + host);
}

$done({});
