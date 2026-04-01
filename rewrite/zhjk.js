
let body = $response.body;

try {
  let json = JSON.parse(body);

  // 🔹 强制修改 playTimeNumber 和 current_time
  json.playTimeNumber = 5000;
  json.huodong.current_time = 5000;
  //json.dati_count = 1;
  //json.huodong.play_end = 1;

  // 🔹 提取答案提示
  let tips = [];
  if (json?.wentilist) {
    json.wentilist.forEach(item => {
      try {
        const correct = JSON.parse(item.daan); // ["B"]
        const matched = item.xuanxiang.find(opt => opt.xuhao === correct[0]);
        if (matched) {
          tips.push(`✅ ${correct[0]}：${matched.val}`);
        }
      } catch (e) {
        console.log("❌ 答案解析失败:", e);
      }
    });
  }

  if (tips.length > 0) {
    $notify("📘 答案提示", "", tips.join("\n"));
  }

  body = JSON.stringify(json);
} catch (e) {
  console.log("❌ 解析失败:", e);
}

$done({ body });
