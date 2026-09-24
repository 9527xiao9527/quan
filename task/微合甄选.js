/**
 * Quantumult X Task Script: 10 Concurrent Batch Mode
 */

(async () => {
  const rawData = $prefs.valueForKey('weiheyanxuan');
  if (!rawData) {
    console.log('[墨音商城] 错误：未找到持久化变量 weiheyanxuan！');
    $notify('墨音商城', '脚本执行失败', '未读取到 weiheyanxuan 数据');
    $done();
    return;
  }

  const parts = rawData.split('#');
  if (parts.length < 3) {
    console.log('[墨音商城] 错误：数据格式异常！');
    $done();
    return;
  }

  const url = parts[0];
  let headers = {};
  let bodyObj = {};

  try {
    headers = JSON.parse(parts[1]);
    bodyObj = JSON.parse(parts.slice(2).join('#'));
  } catch (e) {
    console.log('[墨音商城] JSON 解析失败: ' + e);
    $done();
    return;
  }

  // 固定的目标时长
  const videoSeconds = Number(bodyObj.videoSeconds) || 1771;
  bodyObj.watchedSeconds = videoSeconds;
  bodyObj.positionSeconds = videoSeconds;

  const reqBody = JSON.stringify(bodyObj);
  const req = {
    url: url,
    method: 'POST',
    headers: headers,
    body: reqBody
  };

  let totalSent = 0;
  let isCompleted = false;
  let lastRemaining = null;
  const startTime = Date.now();

  // 🚀 黄金并发参数配置
  const BATCH_SIZE = 10;    // 10 并发，完美吃满 iOS 单域名连接池
  const BATCH_DELAY = 50;   // 批次微延迟 50ms，防止圈x内存溢出

  console.log(`[墨音商城] 🚀🚀 启动 10 并发极速轰炸...`);

  while (!isCompleted && totalSent < 1500) {
    const batchTasks = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      totalSent++;
      const reqId = totalSent;

      batchTasks.push(
        fetchRequest(req).then(res => {
          if (isCompleted) return;

          if (res.statusCode === 200) {
            try {
              const resData = JSON.parse(res.body);
              if (resData.status === 200 && resData.data) {
                const watch = resData.data.watch || {};
                const remaining = watch.remainingSeconds;
                const completedNow = resData.data.completedNow;

                if (completedNow === true || remaining === 0) {
                  if (!isCompleted) {
                    isCompleted = true;
                    const costTime = ((Date.now() - startTime) / 1000).toFixed(2);
                    console.log(`[墨音商城] 🎉🎉 绝杀秒刷成功！耗时: ${costTime}s，共发包: ${reqId} 次`);
                    $notify('墨音商城 刷课成功', `极速耗时 ${costTime} 秒`, `视频已全部完成！`);
                    $done();
                  }
                  return;
                }

                if (reqId % 10 === 0 || lastRemaining === null) {
                  lastRemaining = remaining;
                  console.log(`[#${reqId}] 剩余: ${remaining}s | completedNow: ${completedNow}`);
                }
              }
            } catch (e) {}
          }
        }).catch(err => {})
      );
    }

    Promise.all(batchTasks);
    await sleep(BATCH_DELAY);
  }

  await sleep(800);
  if (!isCompleted) {
    $notify('墨音商城', '重放结束', `共发包 ${totalSent} 次`);
    $done();
  }
})();

function fetchRequest(req) {
  return new Promise((resolve, reject) => {
    $task.fetch(req).then(
      res => resolve(res),
      err => reject(err)
    );
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
