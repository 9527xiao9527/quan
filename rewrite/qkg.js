// ==UserScript==
// @name         qkg存URL
// @match        https://api.qingkeguanli.com/frontend/web/index.php?r=term-course/enter*
// ==/UserScript==

let url = $request.url;

// 👉 直接存整条URL
$prefs.setValueForKey(url, "qkg_url");

$notify("已记录课程URL", "", url);

$done({});