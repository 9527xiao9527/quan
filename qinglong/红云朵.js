/**
 * @青龙脚本  predcloudion自动上传播放时长（支持并发执行）
 * 环境变量：hydck
 * 多账号换行格式：
 * https://client.predcloudion.com/api/v1/course/sub?courseSubId=15313&employeeId=129124@@Bearer xxxxx
 */

const axios = require("axios");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let hydcks = process.env.hydck ? process.env.hydck.split("\n").filter(Boolean) : [];
if (hydcks.length === 0) {
  console.log("❌ 未找到 hydck 环境变量");
  process.exit(0);
}

console.log(`📦 共检测到 ${hydcks.length} 个账号，将并发执行...\n`);

(async () => {
  await Promise.all(
    hydcks.map(async (item, index) => {
      const [url, token] = item.split("@@");
      if (!url || !token) {
        console.log(`❌ 账号${index + 1} 格式错误，跳过`);
        return;
      }
      await runAccount(index + 1, url, token);
    })
  );
  console.log("\n🎉 所有账号执行完毕");
})();

async function runAccount(index, url, token) {
  console.log(`\n=== 🧩 开始账号${index} ===`);
  try {
    // 🔹 第一次请求：获取课程数据
    const res = await axios.get(url, {
      headers: baseHeaders(token),
    });
    const data = res.data?.data;
    if (!data) {
      console.log(`❌ 账号${index} 获取课程信息失败：`, res.data);
      return;
    }

    let { courseId, courseSubId, videoTime, playTimeProcess, courseTitle, courseSubTitle } = data;
    const employeeUserId = url.match(/employeeId=(\d+)/)?.[1];

    console.log(`🎬 [账号${index}] ${courseTitle || courseSubTitle}`);
    console.log(`⏱ 总时长: ${videoTime}s | 当前进度: ${playTimeProcess}s`);

    // 🔹 循环上报播放进度
    while (playTimeProcess < videoTime) {
      playTimeProcess += 10;
      const body = {
        employeeUserId: Number(employeeUserId),
        courseSubId: String(courseSubId),
        courseId,
        playTimeProcess,
        playTime: 10,
      };

      try {
        const postRes = await axios.post(
          "https://client.predcloudion.com/api/v1/course/sub/log",
          body,
          {
            headers: baseHeaders(token),
          }
        );

        if (postRes.data?.success) {
          console.log(
            `✅ [账号${index}] 已上报 → ${playTimeProcess}/${videoTime}`
          );
        } else {
          console.log(
            `⚠️ [账号${index}] 上报失败：`,
            postRes.data?.message || "未知错误"
          );
          break;
        }

        if (playTimeProcess >= videoTime) {
          console.log(`🎉 [账号${index}] 播放任务完成 ✅`);
          break;
        }

        await delay(10000); // 每次间隔10秒
      } catch (err) {
        console.log(`⚠️ [账号${index}] 请求异常：${err.message}`);
        break;
      }
    }
  } catch (err) {
    console.log(`❌ [账号${index}] 执行失败：${err.message}`);
  }
}

function baseHeaders(token) {
  return {
    "Accept-Encoding": "gzip,compress,br,deflate",
    "content-type": "application/json",
    Connection: "keep-alive",
    Referer: "https://servicewechat.com/wx62d8ccd2d2c42d2b/3/page-frame.html",
    Host: "client.predcloudion.com",
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62(0x18003e3a) NetType/WIFI Language/zh_CN",
    Authorization: token,
  };
}
