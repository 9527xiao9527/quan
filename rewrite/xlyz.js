/**
 * 心灵宇宙 - 提取 Authorization
 * 写入本地变量：xlyzck
 * 说明：
 *  - 自动去掉 Bearer
 *  - 自动去重
 *  - 多账号换行保存
 */

const KEY = 'xlyzck';

const auth = $request.headers['Authorization'] || $request.headers['authorization'];

if (!auth) {
  $done({});
}

const token = auth.replace(/^Bearer\s+/i, '').trim();
if (!token) {
  $done({});
}

let old = $prefs.valueForKey(KEY) || '';
let list = old.split('\n').filter(Boolean);

// 去重
if (!list.includes(token)) {
  list.push(token);
  $prefs.setValueForKey(list.join('\n'), KEY);
  $notify(
    '心灵宇宙',
    '获取 Authorization 成功',
    `当前共 ${list.length} 个账号`
  );
}

$done({});
