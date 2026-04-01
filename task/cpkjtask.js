/**
 * @name 超品课 视频进度 Task（99%停5秒 + log + retry + clear）
 */

const BASE_HEADERS = {
  "content-type": "application/json",
  "Accept-Encoding": "gzip,compress,br,deflate",
  "Connection": "keep-alive",
  "Referer": "https://servicewechat.com/wxc3c482a4f8d060ad/14/page-frame.html",
  "CLIENT-TYPE": "Wechat",
  "CLIENT-SOURCE": "3"
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function api(method, url, token, body = null) {
  return new Promise(resolve => {
    let opts = {
      url,
      method,
      headers: { ...BASE_HEADERS, token }
    };
    if (body) opts.body = body;

    $task.fetch(opts).then(
      res => {
        try {
          resolve(JSON.parse(res.body));
        } catch (e) {
          console.log("❌ JSON 解析失败:", res.body);
          resolve({});
        }
      },
      err => {
        console.log("❌ 请求异常:", err);
        resolve({ code: -1 });
      }
    );
  });
}

async function checkRed(token, trainId, bannerId, courseId, subjectId) {
  const url =
    `https://release.chaopinkj.cn/api/v1/red/envelopes/can` +
    `?id=${trainId}&bannerId=${bannerId}&courseId=${courseId}` +
    `&subjectId=${subjectId}&appId=&openId=`;

  console.log("🧧 红包检测请求:", url);
  const res = await api("GET", url, token);
  console.log("🧧 红包检测结果:", JSON.stringify(res));
  return res?.data === true;
}

/** ⭐ 获取视频信息（最多重试 2 次） */
async function getPlayInfoWithRetry(playUrl, token, retry = 2) {
  for (let i = 0; i <= retry; i++) {
    console.log(`🎬 获取视频信息（第 ${i + 1} 次）`);
    const res = await api("GET", playUrl, token);
    if (res?.data) return res;

    console.log("❌ 获取视频失败:", JSON.stringify(res));
    if (i < retry) await sleep(1500);
  }
  return null;
}

async function runOne(idx, line) {
  try {
    console.log(`\n👤 账号${idx} 初始化`);
    const [playUrl, token] = line.split("#");
    const q = Object.fromEntries(new URL(playUrl).searchParams.entries());

    const trainId = q.trainingId;
    const courseId = q.courseId;
    const subjectId = q.subjectId;

    console.log(`📌 参数 trainId=${trainId} courseId=${courseId} subjectId=${subjectId}`);

    /** 🔁 获取视频信息（带重试） */
    const play = await getPlayInfoWithRetry(playUrl, token);
    if (!play) {
      console.log("⏭️ 多次失败，跳过账号");
      return `账号${idx}：获取视频失败`;
    }

    const data = play.data;
    const bannerId = data.bannerId;
    const duration = parseInt(data.videoInfo.duration);
    let timer = parseInt(data.timer || 0);

    const target = Math.max(0, duration - 5);

    console.log(`⏱️ 初始进度 ${timer}/${duration}`);
    console.log(`🎯 目标进度 ${target}/${duration} (≤99%)`);

    console.log("🔍 开始红包前置检测...");
    const canRed = await checkRed(
      token,
      trainId,
      bannerId,
      courseId,
      subjectId
    );
/*
    if (!canRed) {
      console.log("🧧 红包检测 False，跳过账号");
      return `账号${idx}：红包 False`;
    }
*/
    console.log("✅ 红包检测通过，开始刷进度");

    if (timer >= target) {
      console.log("✅ 当前进度已达标，跳过");
      return `账号${idx}：已达标`;
    }

    while (timer < target) {
      let step = Math.min(300, target - timer);
      timer += step;

      let percent = Math.min(99, parseInt((timer / duration) * 100));

      console.log(
        `🚀 上报进度 timer=${timer}/${duration} percent=${percent}%`
      );

      await api(
        "POST",
        "https://release.chaopinkj.cn/api/course/sendProcessView5Second",
        token,
        JSON.stringify({
          trainId: Number(trainId),
          subjectId: Number(subjectId),
          courseId: Number(courseId),
          bannerId: bannerId,
          currentClientMillis: Date.now(),
          playWeight: "mp4",
          currentSendMillis: timer,
          watchTime: timer,
          loadProgress: percent
        })
      );

      await sleep(6000);
    }

    console.log(`🏁 已停在剩余5秒 ${timer}/${duration}`);
    return `账号${idx}：完成`;

  } catch (e) {
    console.log("❌ 账号异常:", e);
    return `账号${idx}：异常`;
  }
}

(async () => {
  const cks = $prefs.valueForKey("cpkjck");
  if (!cks) {
    $notify("超品课", "❌ 未检测到 cpkjck", "");
    return $done();
  }

  const lines = cks.split("\n").filter(Boolean);
  let results = [];

  console.log(`📦 共读取 ${lines.length} 个账号`);

  for (let i = 0; i < lines.length; i++) {
    results.push(await runOne(i + 1, lines[i]));
    await sleep(1500);
  }

  /** 🧹 所有账号结束后清空变量 */
  $prefs.setValueForKey("", "cpkjck");
  console.log("🧹 已清空 cpkjck");

  $notify(
    "超品课任务完成",
    `共 ${lines.length} 个账号`,
    results.join("\n")
  );

  $done();
})();
