/**
 * @name cpkjck 抓取 url + token
 * @description 提取请求 url 和请求头 token，保存到本地变量 cpkjck（url#token，多账号换行）
 * @match *
 */

if (!$request || !$request.url || !$request.headers) {
  $done({});
  return;
}

// 1️⃣ 获取完整 URL（不含参数可自行改）
const url = $request.url;

// 2️⃣ 从请求头中提取 token（大小写兼容）
const headers = $request.headers;
const token =
  headers["token"] ||
  headers["Token"] ||
  headers["authorization"] ||
  headers["Authorization"];

if (!token) {
  $done({});
  return;
}

// 3️⃣ 组合账号格式
const newAccount = `${url}#${token}`;

// 4️⃣ 读取旧变量
let oldData = $prefs.valueForKey("cpkjck") || "";

// 5️⃣ 去重处理
let accounts = oldData ? oldData.split("\n") : [];
if (!accounts.includes(newAccount)) {
  accounts.push(newAccount);
  $prefs.setValueForKey(accounts.join("\n"), "cpkjck");

  $notify(
    "cpkjck 获取成功",
    "",
    `已保存账号：\n${newAccount}`
  );
}

$done({});改成每次都覆盖写入新的