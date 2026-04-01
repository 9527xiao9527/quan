let body = $request.body; // 获取请求体
if (body) {
    // 使用正则匹配参数
    let match = body.match(/huodong_id=([^&]*)&store_id=[^&]*&openid=([^&]*)&api_type=[^&]*&uid=([^&]*)/);
    if (match) {
        let huodong_id = match[1];
        let openid = match[2];
        let uid = match[3];
        // 拼接成 huodongid#openid#uid
        let zhjk_value = `${huodong_id}#${openid}#${uid}`;
        // 写入本地变量
        $prefs.setValueForKey(zhjk_value, "zhjk");
        console.log("本地变量 zhjk 已保存:", zhjk_value);
    } else {
        console.log("未匹配到参数");
    }
} else {
    console.log("请求体为空");
}

$done({});
