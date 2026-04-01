let body = $response.body;
try {
  let obj = JSON.parse(body);

  if (obj?.data?.NowInfo && obj?.data?.video_time) {
    obj.data.NowInfo.play_time = obj.data.video_time.toString();
    $done({ body: JSON.stringify(obj) });
  } else {
    $done({});
  }
} catch (e) {
  console.log("修改 play_time 出错：" + e);
  $done({});
}
