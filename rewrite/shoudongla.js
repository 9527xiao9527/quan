let body = $response.body;

try {
  let obj = JSON.parse(body);

  if (obj?.resultData?.total_second != null) {

obj.resultData.last_watch_time = obj.resultData.total_second;
obj.resultData.is_show_process = 1
  }

  $done({ body: JSON.stringify(obj) });

} catch (e) {
  console.log("修改失败: " + e);
  $done({ body });
}
