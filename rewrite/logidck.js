const value = `${$request.url}#${JSON.stringify($request.headers)}`;

$prefs.setValueForKey(value, "logidck");

$notify(
  "logidck 抓取成功",
  "",
  value
);

$done({});