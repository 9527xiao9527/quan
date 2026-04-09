const key = 'ppzyck';
const raw = $prefs.valueForKey(key) || '';

if (!raw.trim()) {
  $notify("⚠️ 没有找到变量内容", "", `变量 ${key} 是空的`);
} else {
  console.log(`📋 以下是变量 ${key} 内容：\n\n` + raw);
  const removed = $prefs.removeValueForKey(key);
  $notify("✅ 内容导出并清除", "", `内容已打印到日志\n清除状态：${removed ? "成功" : "失败"}`);
}

$done();
