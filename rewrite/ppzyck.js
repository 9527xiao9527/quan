// ==UserScript==
// @name         ppzyck参数获取
// @match        *
// ==/UserScript==

let body = $request.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        let state = obj.state || "";
        let seeId = obj.seeId || "";
        let openId = obj.openId || "";

        if (openId) {

            let newData = `${state}#${seeId}#${openId}`;

            let oldData = $prefs.valueForKey("ppzyck") || "";

            let arr = oldData ? oldData.split("\n") : [];

            // 用 openId 去重
            let exists = arr.some(item => item.split("#")[2] === openId);

            if (!exists) {
                arr.push(newData);
                $prefs.setValueForKey(arr.join("\n"), "ppzyck");

                $notify("✅ ppzyck获取成功", "", newData);
            } else {
                $notify("ℹ️ 已存在该账号", "", openId);
            }

        } else {
            $notify("❌ 获取失败", "", "openId为空");
        }

    } catch (e) {
        $notify("❌ 解析失败", "", e.message);
    }
}

$done({});
