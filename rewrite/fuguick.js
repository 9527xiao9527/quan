/*
mkjsy 参数提取
格式：Authorization#managerid#scheduleid
多账号换行存储
*/

let url = $request.url;
let headers = $request.headers;

// 提取参数
let auth = headers["Authorization"] || headers["authorization"];
let managerId = url.match(/managerId=([^&]+)/)?.[1];
let scheduleId = url.match(/scheduleId=([^&]+)/)?.[1];

if (auth && managerId && scheduleId) {
    let newData = `${auth}#${managerId}#${scheduleId}`;
    
    let oldData = $prefs.valueForKey("mkjsy") || "";

    // 去重（按 Authorization 判断）
    let list = oldData ? oldData.split("\n") : [];
    let exist = list.find(i => i.split("#")[0] === auth);

    if (!exist) {
        list.push(newData);
    } else {
        list = list.map(i => i.split("#")[0] === auth ? newData : i);
    }

    let finalData = list.join("\n");
    $prefs.setValueForKey(finalData, "mkjsy");

    console.log("✅ mkjsy 写入成功:\n" + newData);
    $notify("mkjsy获取成功", "", newData);
} else {
    console.log("❌ 参数不完整");
}

$done({});