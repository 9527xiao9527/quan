/*
抓取 openLiveRecord 请求体参数
*/

if (typeof $request !== "undefined") {
    try {
        let body = $request.body;

        if (body) {
            let data = JSON.parse(body);

            let openId = data.openId;
            let vid = data.vid;
            let sysUserId = data.sysUserId;

            let ck = `${openId}#${vid}#${sysUserId}`;

            console.log("提取成功：\n" + ck);

            // 写入持久化（可选）
            let old = $prefs.valueForKey("yujianck") || "";
            if (!old.includes(ck)) {
                let newck = old ? old + "\n" + ck : ck;
                $prefs.setValueForKey(newck, "yujianck");
                console.log("已写入 yujianck");
            } else {
                console.log("已存在，不重复写入");
            }
        }
    } catch (e) {
        console.log("解析失败: " + e);
    }

    $done({});
}
