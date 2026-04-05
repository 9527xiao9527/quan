/**
 * @name 超品课 视频进度（青龙并发版）
 * @env cpkjck
 * 格式：playUrl#token
 * 多账号换行
 */

const axios = require("axios");

// ====== 并发控制 ======
const MAX_CONCURRENT = 13; // 同时跑几个账号（可改）
const RETRY_PLAY = 2;

// ====== 公共请求头 ======
const BASE_HEADERS = {
  "content-type": "application/json",
  "Accept-Encoding": "gzip,compress,br,deflate",
  "Connection": "keep-alive",
  "Referer": "https://servicewechat.com/wxc3c482a4f8d060ad/14/page-frame.html",
  "CLIENT-TYPE": "Wechat",
  "CLIENT-SOURCE": "3"
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(method, url, token, data = null) {
  try {
    const res = await axios({
      method,
      url,
      headers: { ...BASE_HEADERS, token },
      data,
      timeout: 15000
    });
    return res.data;
  } catch (e) {
    console.log("❌ 请求异常:", e.message);
    return { code: -1 };
  }
}

/** 🧧 红包检测 */
async function checkRed(token, trainId, bannerId, courseId, subjectId) {
  const url =
    `https://release.chaopinkj.cn/api/v1/red/envelopes/can` +
    `?id=${trainId}&bannerId=${bannerId}&courseId=${courseId}` +
    `&subjectId=${subjectId}&appId=&openId=`;

  console.log("🧧 红包检测:", url);
  const res = await api("GET", url, token);
  return res?.data === true;
}

/** 🎬 获取播放信息（重试） */
async function getPlayInfo(playUrl, token) {
  for (let i = 0; i <= RETRY_PLAY; i++) {
    console.log(`🎬 获取视频信息（第 ${i + 1} 次）`);
    const res = await api("GET", playUrl, token);
    if (res?.data) return res;
    if (i < RETRY_PLAY) await sleep(1500);
  }
  return null;
}

async function runOne(idx, line) {
  try {
    console.log(`\n👤 账号${idx} 开始`);

    const [playUrl, token] = line.split("#");
    const q = Object.fromEntries(new URL(playUrl).searchParams.entries());

    const trainId = q.trainingId;
    const courseId = q.courseId;
    const subjectId = q.subjectId;

    const play = await getPlayInfo(playUrl, token);
    if (!play) {
      console.log("⏭️ 获取视频失败，跳过");
      return `账号${idx}：获取视频失败`;
    }

    const data = play.data;
    const bannerId = data.bannerId;
    const duration = Number(data.videoInfo.duration);
    let timer = Number(data.timer || 0);
    const target = Math.max(0, duration - 5);

    console.log(`⏱️ 初始 ${timer}/${duration}`);
    console.log(`🎯 目标 ${target}/${duration}`);

    const canRed = await checkRed(
      token,
      trainId,
      bannerId,
      courseId,
      subjectId
    );
/*
    if (!canRed) {
      console.log("🧧 红包 False，跳过");
      return `账号${idx}：红包 False`;
    }
*/
    if (timer >= target) {
      console.log("✅ 已达标");
      return `账号${idx}：已达标`;
    }

    while (timer < target) {
      const step = Math.min(300, target - timer);
      timer += step;

      const percent = Math.min(
        99,
        Math.floor((timer / duration) * 100)
      );

      console.log(
        `🚀 上报 timer=${timer}/${duration} percent=${percent}%`
      );

      await api(
        "POST",
        "https://release.chaopinkj.cn/api/course/sendProcessView5Second",
        token,
        {
          trainId: Number(trainId),
          subjectId: Number(subjectId),
          courseId: Number(courseId),
          bannerId,
          currentClientMillis: Date.now(),
          playWeight: "mp4",
          currentSendMillis: timer,
          watchTime: timer,
          loadProgress: percent
        }
      );

      await sleep(6000);
    }

    console.log(`🏁 停在剩余5秒`);
    return `账号${idx}：完成`;

  } catch (e) {
    console.log("❌ 异常:", e.message);
    return `账号${idx}：异常`;
  }
}

// ====== 并发池 ======
async function runConcurrent(tasks, limit) {
  const results = [];
  const pool = [];

  for (const task of tasks) {
    const p = task().then(res => {
      pool.splice(pool.indexOf(p), 1);
      return res;
    });
    results.push(p);
    pool.push(p);

    if (pool.length >= limit) {
      await Promise.race(pool);
    }
  }

  return Promise.all(results);
}

// ====== 主入口 ======
(async () => {
  const env = process.env.cpkjck;
  if (!env) {
    console.log("❌ 未设置环境变量 cpkjck");
    return;
  }

  const lines = env.split("\n").filter(Boolean);
  console.log(`📦 共 ${lines.length} 个账号`);

  const tasks = lines.map((line, i) => () => runOne(i + 1, line));
  const results = await runConcurrent(tasks, MAX_CONCURRENT);

  console.log("\n====== 结果汇总 ======");
  results.forEach(r => console.log(r));
})();
