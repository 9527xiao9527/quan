/*
 * 布小派重写提取CK
 *
 * https://wxaurl.cn/mI3Z5yZrjTc
 *
 */

if (!$response || !$response.body) {
  $done({});
  return;
}

let obj;
try {
  obj = JSON.parse($response.body);
} catch (e) {
  $done({});
  return;
}

const { code, userId, token } = obj;

if (code !== 200 || !userId || !token) {
  $done({});
  return;
}

const newLine = `${userId}#${token}`;

// 读取已有变量
let old = $prefs.valueForKey("bxyck") || "";
let lines = old ? old.split("\n").filter(l => l.trim()) : [];

let found = false;

// 判断是否存在并更新
lines = lines.map(line => {
  const [uid] = line.split("#");
  if (uid == userId) {
    found = true;
    if (line !== newLine) {
      $notify("bxyck更新", "", `账号${userId}：CK 更新成功`);
    }
    return newLine; // 更新
  }
  return line;
});

// 不存在则追加
if (!found) {
  lines.push(newLine);
  $notify("bxyck写入", "", `账号${userId}：新 CK 写入成功`);
}

// 写回
$prefs.setValueForKey(lines.join("\n"), "bxyck");

$done({});
