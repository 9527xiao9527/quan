// 获取 topicId + 请求头 保存到本地变量 vzanpost

let url = $request.url;

// 提取 topicId
let match = url.match(/topicId=(\d+)/);
let topicId = match ? match[1] : "";

// 获取请求头
let headers = $request.headers;

// 组合数据
let data = {
    topicId: topicId,
    headers: headers
};

// 写入本地变量
$prefs.setValueForKey(JSON.stringify(data), "vzanpost");

console.log("✅ 已保存 vzanpost:", data);
$notify("获取成功", "", "")
$done({});
