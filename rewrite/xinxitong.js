
let body = $request.body;

try {
  if (body) {
    let obj = JSON.parse(body);

    // 生成随机值
    let randomDuration = Math.floor(Math.random() * 101) + 4900;
    obj.duration = randomDuration;

    body = JSON.stringify(obj);

    
    $notify("✅ duration 修改成功", "", `已修改为: ${randomDuration}`);
  } else {
    console.log("⚠️ 请求体为空，未修改");
  }
} catch (e) {
  console.log("❌ 解析失败: " + e);
}

$done({ body });
