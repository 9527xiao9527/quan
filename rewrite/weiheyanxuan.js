/**
 * Quantumult X Rewrite Script: Save request data to persistent storage
 */

if ($request &&$request.url) {
  const url = $request.url;
  const headers = JSON.stringify($request.headers);
  const body = $request.body || '';

  // 拼接格式：URL#headers#body
  const savedData = `${url}#${headers}#${body}`;

  const success = $prefs.setValueForKey(savedData, 'weiheyanxuan');
  if (success) {
    console.log('[墨音商城] 成功提取并保存请求数据至 weiheyanxuan');
    $notify('墨音商城', '请求数据提取成功', `已存入本地变量 weiheyanxuan`);
  } else {
    console.log('[墨音商城] 保存请求数据失败');
  }
}

$done({});
