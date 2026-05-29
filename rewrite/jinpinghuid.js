// ==UserScript==
// @name         今平湖活动ID提取
// @rewrite_local
// ==/UserScript==

const url = $request.url;
const match = url.match(/_ac_detail\/(\d+)\.json/);

if (match) {
  const activityId = match[1];

  $notify(
    "今平湖活动ID获取成功",
    "",
    activityId
  );

  console.log(`今平湖活动ID: ${activityId}`);
}

$done({});