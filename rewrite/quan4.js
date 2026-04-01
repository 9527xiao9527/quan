// 获取请求 host
let url = $request.url;
let host = url.match(/^https?:\/\/([^\/]+)/)[1];

// 获取请求头中的 token
let token = $request.headers['token'] || $request.headers['Authorization'];

// 获取响应体
let body = $response.body;

// 使用正则提取 linkId 和 seconds
let accountDataMatches = body.match(/"link":\{[^}]*"id":(\d+)[^}]*\}[^}]*"video":\{[^}]*"seconds":(\d+)[^}]*\}/g);

// 存储每个账号的 host、token、linkId 和 seconds
let dataToWrite = [];

// 如果有多个账号，循环提取每个账号的数据
if (accountDataMatches) {
    for (let accountData of accountDataMatches) {
        // 提取 linkId 和 seconds
        let linkId = accountData.match(/"id":(\d+)/)[1];
        let seconds = accountData.match(/"seconds":(\d+)/)[1];

        // 存储数据
        dataToWrite.push(`host: ${host}, token: ${token}, linkId: ${linkId}, seconds: ${seconds}`);
    }

    // 将数据换行写入，并保存在 prefs 中
    $prefs.setValueForKey(dataToWrite.join("\n"), "account_data");

    // 提示成功
    $notify('参数提取成功', '', '提取到以下数据:\n' + dataToWrite.join("\n"));
} else {
    // 如果没有找到数据，发送错误通知
    $notify('数据提取失败', '', '未找到有效的 linkId 或 seconds');
}

$done();
