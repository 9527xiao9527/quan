// ===== 读取本地变量 =====
let vzanDataRaw = $prefs.valueForKey("vzanpost");

if (!vzanDataRaw) {
    $notify("❌ 未找到 vzanpost", "", "");
    $done();
    return;
}

let vzanData = JSON.parse(vzanDataRaw);
let topicId = vzanData.topicId;
let headers = vzanData.headers;

if (!topicId) {
    $notify("❌ topicId 为空", "", "");
    $done();
    return;
}

// ===== 统一 Host =====
headers["Host"] = "live-liveapi.njyqkj0ksyz.com";

// ===== 补必要字段 =====
headers["Content-Type"] = headers["Content-Type"] || "application/json;charset=UTF-8";
headers["Origin"] = headers["Origin"] || "https://tee4h.zhongyu.citv.cn";
headers["Referer"] = headers["Referer"] || "https://tee4h.zhongyu.citv.cn/";

// ===== 1️⃣ 上报观看 =====
function reportWatch() {
    let body = {
        tpid: parseInt(topicId),
        message: JSON.stringify([
            {
                type: 0,
                actId: 0,
                duration: 12000
            }
        ]),
        fr: "sm",
        //appid: "wx8d62711f6741ff6c",
        isMultiUser: true,
        isCurrentSite: true
    };

    return $task.fetch({
        url: "https://live-liveapi.njyqkj0ksyz.com/api/v1/user/set_watch_time",
        method: "POST",
        headers: headers,
        body: JSON.stringify(body)
    });
}

// ===== 2️⃣ 查询观看 =====
function queryWatch() {
    return $task.fetch({
        url: `https://live-liveapi.njyqkj0ksyz.com/api/v1/user/watch_time?tpid=${topicId}&type=0`,
        method: "GET",
        headers: headers
    });
}

// ===== 主流程 =====
(async () => {
    try {
        console.log("🚀 开始上报...");
        let reportResp = await reportWatch();
        console.log("📥 上报返回:", reportResp.body);

        // 稍微等一下更稳
        await new Promise(r => setTimeout(r, 1000));

        console.log("🔍 查询观看时长...");
        let queryResp = await queryWatch();

        let data = JSON.parse(queryResp.body);

        if (data.code !== 0) {
            $notify("❌ 查询失败", "", queryResp.body);
            $done();
            return;
        }

        // ===== 提取 duration =====
        let list = data.dataObj || [];
        let duration = 0;

        for (let item of list) {
            if (item.type === 0) {
                duration = item.duration;
                break;
            }
        }

        console.log("🎯 当前时长:", duration);

        $notify("✅ 完成", "", `当前时长: ${duration}`);

    } catch (e) {
        console.log(e);
        $notify("❌ 异常", "", e.message);
    }

    $done();
})();
