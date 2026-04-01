/**
 * @name 提取 URL + Authorization 写入 xhydck
 * @author ChatGPT
 * @description 保存格式：url#Authorization（多账号换行）
 */

const KEY = "xhydck";

const url = $request.url;
const headers = $request.headers || {};
const auth = headers["Authorization"] || headers["authorization"];

if (!url || !auth) {
  console.log("❌ 未获取到 url 或 Authorization");
  $done({});
  return;
}

const line = `${url}#${auth}`;

// 读取已有数据
let old = $prefs.valueForKey(KEY) || "";

// 去重
const list = old ? old.split("\n") : [];
if (!list.includes(line)) {
  list.push(line);
  $prefs.setValueForKey(list.join("\n"), KEY);
  console.log("✅ 已写入 xhydck");
  $notify(
    "xhydck 获取成功",
    `当前账号数：${list.length}`,
    line
  );
} else {
  console.log("⚠️ 已存在，跳过写入");
}

$done({});
