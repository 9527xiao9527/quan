const commonConfig = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.63(0x18003f2f) NetType/WIFI Language/zh_CN miniProgram/wxe14112e58de9a811',
  baseUrl: 'https://api.qianguolive.cn/qg/app/topic/',
  origin: 'https://za5.aoi.ngkiec.cn',
};

// ✅ 读取本地变量
const qg1 = $prefs.valueForKey("qg1") || "";
const qg2 = $prefs.valueForKey("qg2") || "";

if (!qg1 || !qg2) {
  $notify("❌ 千果任务", "", "未获取到 qg1 或 qg2");
  $done();
}

const [topicId, merchantId, verifyCode, paramSign] = qg1.split("#");
const [memberId, uniqueKey, memberToken] = qg2.split("#");

const headers = {
  "User-Agent": commonConfig.userAgent,
  "Content-Type": "application/json;charset=UTF-8",
  "memberToken": memberToken,
  "origin": commonConfig.origin,
};

const BASE = commonConfig.baseUrl;

// ===== 基础请求 =====
function get(path, params) {
  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

  return $task.fetch({ url: `${BASE}${path}?${query}`, headers })
    .then(res => JSON.parse(res.body));
}

function post(path, data, extraQuery = "") {
  const url = `${BASE}${path}${extraQuery ? "?" + extraQuery : ""}`;

  return $task.fetch({
    url,
    method: "POST",
    headers,
    body: JSON.stringify(data)
  }).then(res => JSON.parse(res.body));
}

// ===== 1. 获取课题 =====
async function getTopicInfo() {
  const resp = await get("getTopicInfo", {
    timesteamp: Date.now(),
    topicId,
    merchantId,
    verifyCode,
    paramSign,
  });

  //console.log("📦 原始返回：" + JSON.stringify(resp));

  if (resp.code !== 0 || !resp.data) {
    throw new Error("获取课题失败: " + resp.msg);
  }

  const info = resp.data;

  info.signTimeList = Array.isArray(info.signTimeList) ? info.signTimeList : [];
  info.newTopicQuestion = Array.isArray(info.newTopicQuestion) ? info.newTopicQuestion : [];

  console.log(`✅ 课题: ${info.name}`);
  console.log(`📺 时长: ${info.videoDuration}s`);
  console.log(`🪧 是否签到: ${info.signSwitch === 1 ? "是" : "否"}`);
  console.log(`📍 签到点: ${info.signTimeList.length}个`);

  return info;
}

// ===== 2. 视频上报（有签到）=====
async function reportVideoView(info, batchNo) {
  const checkpoints = info.signTimeList.map(s => ({
    process: s.signTime,
    complete: 0
  }));

  checkpoints.push({
    process: info.videoDuration,
    complete: 1
  });

  for (const cp of checkpoints) {
    const resp = await post("viewDuration", {
      timesteamp:   Date.now(),
      topicId,
      merchantId,
      complete:     cp.complete,
      memberToken,
      playProcess:  cp.process,
      viewDuration: cp.process,
      system:       "iOS 15.4.1",
      memberId,
      batchNo,
      paramSign,
      uniqueKey,
    });

    if (resp.code !== 0) {
      throw new Error("视频上报失败: " + resp.msg);
    }
  }

  console.log("✅ 视频上报完成");
}

// ===== 3. 签到 =====
async function topicSign(info, batchNo) {
  for (const item of info.signTimeList) {
    const resp = await post(
      "topicSign",
      {
        topicId: Number(topicId),
        topicName: info.name,
        merchantId,
        memberId,
        signNumber: item.signTimeNumber,
        signTime: Date.now(),
        batchNo,
      },
      `timesteamp=${Date.now()}`
    );

    if (resp.code === 0) {
      console.log(`✅ 签到第${item.signTimeNumber}次成功`);
    } else {
      console.log(`⚠️ 签到失败: ${resp.msg}`);
    }
  }
}

// ===== 4. 无签到课：直接完成播放 =====
async function reportFullView(info, batchNo) {
  const resp = await post("viewDuration", {
    timesteamp:   Date.now(),
    topicId,
    merchantId,
    complete:     1,
    memberToken,
    playProcess:  info.videoDuration,
    viewDuration: info.videoDuration,
    system:       "iOS 15.4.1",
    memberId,
    batchNo,
    paramSign,
    uniqueKey,
  });

  if (resp.code !== 0) {
    throw new Error("播放上报失败: " + resp.msg);
  }

  console.log("✅ 已完成整段播放");
}

// ===== 5. 答题 + 红包 =====
async function answerAndEnvelope(info, batchNo, playTime) {
  const questions = info.newTopicQuestion;

  if (questions.length === 0) {
    throw new Error("没有题目");
  }

  console.log("📚 答案列表：");
  questions.forEach(q => {
    console.log(`第${q.questionNo}题 -> ${q.answer}`);
  });

  // 答题
  for (const q of questions) {
    const resp = await post("answerCounter", {
      timesteamp: Date.now(),
      topicId,
      answer: q.answer,
      questionNo: q.questionNo,
      correctAnswer: q.answer,
      merchantId,
      batchNo,
      playTime,
    });

    if (resp.code !== 0) {
      throw new Error(`答题失败: ${resp.msg}`);
    }

    console.log(`✅ 第${q.questionNo}题完成`);
  }

  // 红包
  const answerList = questions.map(q => ({
    answer: q.answer,
    correctAnswer: q.answer,
    errorCount: 0,
    maxCount: q.answerCount || 4,
    questionNo: q.questionNo,
    rightCount: 1,
    totalCount: 1,
  }));

  const resp2 = await post("answerSendEnvelope", {
    timesteamp: Date.now(),
    topicId,
    answerList,
    merchantId,
    paramSign,
    batchNo,
    playTime,
  });

  if (resp2.code !== 0) {
    throw new Error("红包失败: " + resp2.msg);
  }

  const amount = resp2.data?.finalEnvelopeAmount ?? "?";
  console.log(`🎉 红包：${amount}元`);
  $notify("✅ 千果完成", "", `红包：${amount}元`);
}

// ===== 主流程 =====
(async () => {
  try {
    console.log("=== 开始执行千果任务 ===");

    const info = await getTopicInfo();
    const playTime = Date.now() - info.videoDuration * 1000;
    const batchNo = `${topicId}-${playTime}`;

    // ✅ 自动判断类型
    if (info.signSwitch === 1) {
      console.log("➡️ 有签到课流程");
      await reportVideoView(info, batchNo);
      await topicSign(info, batchNo);
    } else {
      console.log("➡️ 无签到课流程");
      await reportFullView(info, batchNo);
    }

    await answerAndEnvelope(info, batchNo, playTime);

    console.log("=== 任务完成 ===");

  } catch (e) {
    console.log("❌ " + e.message);
    $notify("❌ 千果失败", "", e.message);
  } finally {
    $done();
  }
})();
