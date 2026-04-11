/***********************************

项目名称：视频学习自动完成
环境变量：shoudong
格式：每行一个完整URL

***********************************/

const $ = new Env("🎬 视频学习");

const raw = $.getdata("shoudong") || "";
if (!raw) {
    $.msg("❌ 未找到变量", "", "请先配置 shoudong");
    $.done();
}

const URL_LIST = raw.split("\n").map(i => i.trim()).filter(Boolean);

(async () => {
    $.log(`🚀 共 ${URL_LIST.length} 个账号`);

    for (let i = 0; i < URL_LIST.length; i++) {
        await runOne(URL_LIST[i], i + 1);
    }

    $.done();
})();

async function runOne(FIRST_URL, index) {
    $.log(`\n👤 账号 ${index}`);

    try {
        const urlObj = new URL(FIRST_URL);
        const HOST = urlObj.host;

        const HEADERS = {
            "Host": HOST,
            "Connection": "keep-alive",
            "content-type": "application/json",
            "Referer": "https://servicewechat.com/wxa938b1999d78c880/1/page-frame.html",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70"
        };

        // ====== 解析参数 ======
        const base = {
            user_id: urlObj.searchParams.get("user_id"),
            company_id: urlObj.searchParams.get("company_id"),
            app_id: urlObj.searchParams.get("app_id")
        };

        // ====== 第一步 ======
        $.log("🚀 获取视频信息");

        let data = await httpGet(FIRST_URL, HEADERS);

        if (!data || !data.result) {
            $.log("❌ 获取失败");
            return;
        }

        const d = data.resultData;

        const payload = {
            id: d.record_id,
            user_id: Number(base.user_id),
            session_id: d.session_id,
            watch_time: d.total_second,
            total_second: d.second,
            company_id: Number(base.company_id),
            app_id: base.app_id
        };

        $.log("✅ 参数：" + JSON.stringify(payload));

        // ====== 第二步 ======
        $.log("🚀 上报观看");

        let r2 = await httpPost(`https://${HOST}/mallApi/content/live-watch-page`, HEADERS, payload);
        $.log("返回：" + JSON.stringify(r2));

        // ====== 第三步 ======
        $.log("🚀 结束观看");

        let r3 = await httpPost(`https://${HOST}/mallApi/content/end-watch`, HEADERS, payload);
        $.log("返回：" + JSON.stringify(r3));

        $.log("🎉 完成");

    } catch (e) {
        $.log("❌ 异常：" + e);
    }
}


// ====== 请求封装 ======
function httpGet(url, headers) {
    return new Promise(resolve => {
        $task.fetch({
            url,
            method: "GET",
            headers
        }).then(resp => {
            try {
                resolve(JSON.parse(resp.body));
            } catch {
                resolve(null);
            }
        }, () => resolve(null));
    });
}

function httpPost(url, headers, body) {
    return new Promise(resolve => {
        $task.fetch({
            url,
            method: "POST",
            headers,
            body: JSON.stringify(body)
        }).then(resp => {
            try {
                resolve(JSON.parse(resp.body));
            } catch {
                resolve(resp.body);
            }
        }, () => resolve(null));
    });
}


// ====== Env封装 ======
function Env(name) {
    this.name = name;
    this.log = console.log;

    this.getdata = (key) => {
        return $prefs.valueForKey(key);
    };

    this.msg = (title, subtitle, desc) => {
        $notify(title, subtitle, desc);
    };

    this.done = () => {
        $done();
    };
}