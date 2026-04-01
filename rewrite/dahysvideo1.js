let url     = $request.url;
let headers = $request.headers;
let body    = JSON.parse($request.body);

// 从请求头里取 token（请根据你的实际字段名修改）
let token = headers["Authorization"] || headers["authorization"] || "";

// 只处理 detailId 为空的请求
if (!body.detailId) {

    let key = 'dahys';
    let noDetailListRaw = $prefs.valueForKey(key) || '';

    let noDetailList = noDetailListRaw
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        })
        .filter(e => e && e.body);

    // 新增 token 维度：课程 + 视频 + token 都相同才算重复
    let isExist = noDetailList.some(e =>
        e.body.trainingLessonId === body.trainingLessonId &&
        e.body.videoId === body.videoId &&
        (e.token || "") === token
    );

    if (isExist) {
        console.log(`⚠️ 已存在课程：${body.trainingLessonId} 视频：${body.videoId} token: ${token}，跳过`);
    } else {
        // 新增 token 字段存储
        let entry = JSON.stringify({ url, headers, body, token });

        noDetailListRaw += (noDetailListRaw ? '\n' : '') + entry;
        $prefs.setValueForKey(noDetailListRaw, key);

        console.log(`✅ 保存新课程请求：课程ID ${body.trainingLessonId} 视频ID ${body.videoId} token: ${token}`);
        $notify(
            "捕获无 detailId 请求",
            `课程ID: ${body.trainingLessonId} 视频ID: ${body.videoId}`,
            `token: ${token.substring(0, 10)}...`
        );
    }
}

$done({});
