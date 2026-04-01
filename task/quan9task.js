/**
 * @name 国医学习 - 自动观看 + 答题（动态域名）
 * @env quan9 = url#headers
 */

const store = $prefs.valueForKey("quan9");
if (!store) {
  $notify("❌ 失败", "", "未找到 quan9 变量");
  $done();
}

const [detailUrl, headersStr] = store.split("#");
const headers = JSON.parse(headersStr);

// ===== 从 URL 提取域名 =====
const match = detailUrl.match(/https?:\/\/[^/]+/);
if (!match) {
  $notify("❌ URL 错误", "", "无法解析域名");
  $done();
}
const BASE = match[0]; // https://pairui01.nmpzrh.com

const ADMIN_USER_ID = "130";

// 随机观看时长
const viewDuration = Math.floor(Math.random() * (5000 - 4500 + 1)) + 4500;

function request(url, method = "GET", body = null) {
  return $task.fetch({
    url,
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
}

(async () => {
  try {
    /* ========= 1️⃣ 获取活动信息 ========= */
    const detailResp = await request(detailUrl);
    const detailJson = JSON.parse(detailResp.body);

    const activityId = detailJson.data.activityId;
    const activityName = detailJson.data.name;

    /* ========= 2️⃣ 创建观看记录 ========= */
    await request(`${BASE}/api/member/activity/create`, "POST", {
      activityId,
      activityName,
      adminUserId: ADMIN_USER_ID,
      viewDuration: 0,
      exitTime: 0,
      isFinished: 0
    });

    /* ========= 3️⃣ 更新观看记录 ========= */
    await request(`${BASE}/api/member/activity/update`, "POST", {
      activityId,
      activityName,
      adminUserId: ADMIN_USER_ID,
      viewDuration,
      exitTime: viewDuration,
      viewCount: 1,
      isFinished: 1
    });

    /* ========= 4️⃣ 获取题目 ========= */
    const qResp = await request(
      `${BASE}/api/activity/question?activityId=${activityId}`
    );
    const qJson = JSON.parse(qResp.body);

    const answer = qJson.data.answer;

    /* ========= 5️⃣ 通知 ========= */
    $notify(
      "📚 学习完成",
      activityName,
      `观看时长：${viewDuration}s\n正确答案：${answer}`
    );

  } catch (e) {
    $notify("❌ 执行异常", "", String(e));
  }

  $done();
})();
