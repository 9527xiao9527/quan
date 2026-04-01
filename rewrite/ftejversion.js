/**
 * 禁用版本更新 - getVersion
 */

let body = $response.body;

if (body) {
  try {
    let obj = JSON.parse(body);

    if (obj.data) {
      obj.data.appVersion = 0;
      obj.data.version = "0.0.0";
      obj.data.force = 0;
      obj.data.content = "";
      obj.data.appUpdateURL = "";
      obj.data.allowMinVersionCode = "0";
    }

    body = JSON.stringify(obj);
  } catch (e) {}
}

$done({ body });
