let url = $request.url;  // 获取请求 URL
let headers = $request.headers;  // 获取请求头

if (url && headers) {
    // 提取 host
    let host = (new URL(url)).host;
    // 获取 Authorization
    let authorization = headers['Authorization'] || headers['authorization'] || '';
    // 拼接写入本地变量
    let zhjkck_value = `${host}#${authorization}`;
    $prefs.setValueForKey(zhjkck_value, "zhjkck");
    console.log("本地变量 zhjkck 已保存:", zhjkck_value);
} else {
    console.log("URL 或请求头为空");
}

$done({});
