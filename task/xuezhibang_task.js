// xuezhibang_task.js
// Task 脚本：读取存储的参数，提交答题 + 领红包
// Quantumult X task 配置（手动触发）：
// event-interaction https://raw.githubusercontent.com/9527xiao9527/quan/refs/heads/main/task/xuezhibang_task.js, tag=学知帮答题, img-url=checkmark.seal.fill@sys, enabled=true

const BASE = "https://m.xuezhibang.com";

const raw = $prefs.valueForKey("xuezhibang_params");
if (!raw) {
  $notification.post("学知帮答题", "❌ 未找到参数", "请先打开课程页面触发重写脚本");
  $done();
  return;
}

let p;
try {
  p = JSON.parse(raw);
} catch (e) {
  $notification.post("学知帮答题", "❌ 参数解析失败", e.message);
  $done();
  return;
}

const { openid, zb_id, kb_id, kefu_id, answerIndex, us_id, hasHongbao, phpsessid, p_h5_u } = p;

console.log("[xuezhibang] 使用参数：" + JSON.stringify(p));

const headers = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70(0x18004630) NetType/WIFI Language/zh_CN miniProgram/wx1927fab3586f837c",
  "Referer": `${BASE}/app/conten.php?b=${zb_id}&h=${kefu_id}&y=${us_id}`,
  "Cookie": `PHPSESSID=${phpsessid}; p_h5_u=${p_h5_u}`,
};

function encodeForm(obj) {
  return Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

// Step 1: 提交答题
const datiBody = encodeForm({ bianhao: zb_id, us_id, kefu: kefu_id, ti_da: answerIndex });

$task.fetch({
  url: `${BASE}/api/ky_vod.php?qh_type=kaiban_dati`,
  method: "POST",
  headers,
  body: datiBody,
}).then(resp => {
  console.log("[dati] " + resp.body);

  let datiOk = false;
  try {
    const j = JSON.parse(resp.body);
    datiOk = j.kaiban_dati == "1" || j.kaiban_dati === 1;
  } catch (_) {}

  if (!datiOk) {
    $notification.post("学知帮答题", "⚠️ 答题提交异常", resp.body.slice(0, 100));
    $done();
    return;
  }

  // Step 2: 领红包（仅 hasHongbao == 1 时有意义，但无论如何都请求）
  const hbBody = encodeForm({ bianhao: zb_id, us_id, kefu: kefu_id });

  $task.fetch({
    url: `${BASE}/api/ky_vod.php?qh_type=kaiban_hongbao`,
    method: "POST",
    headers,
    body: hbBody,
  }).then(hbResp => {
    console.log("[hongbao] " + hbResp.body);

    let hbResult = "无红包";
    try {
      const j = JSON.parse(hbResp.body);
      if (j.kaiban_hongbao && j.kaiban_hongbao !== 0) {
        hbResult = `红包 ${j.kaiban_hongbao} 元，稍后到账`;
      }
    } catch (_) {}

    $notification.post(
      "学知帮答题 ✅",
      `答题成功 | ${hbResult}`,
      `课程 ${zb_id} | 选项 ${answerIndex}`
    );
    $done();
  }).catch(e => {
    $notification.post("学知帮答题", "✅ 答题成功", `红包请求失败: ${e}`);
    $done();
  });

}).catch(e => {
  $notification.post("学知帮答题", "❌ 请求失败", String(e));
  $done();
});
