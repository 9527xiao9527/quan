let url = $request.url
let token = $request.headers["token"]

let save = url + "#" + token

$prefs.setValueForKey(save,"xinzhjk_info")

$notify("抓取成功","活动信息已保存","可运行task")

$done({})