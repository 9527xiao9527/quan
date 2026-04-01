const zhjk = $prefs.valueForKey("zhjk") || "";
const zhjkck = $prefs.valueForKey("zhjkck") || "";

if (!zhjk || !zhjkck) {
  $notify("❌ 缺少本地变量", "请检查 zhjk 和 zhjkck", "格式：\nzhjk: huodong_id#openid#uid\nzhjkck: host#Authorization");
  $done();
}

// 解析 zhjk 变量
const accountList = zhjk.split("\n").filter(Boolean).map(line => {
  const [huodong_id, openid, uid] = line.split("#");
  return { huodong_id, openid, uid, store_id: 0 };
});

// 解析 zhjkck 变量
const ckList = zhjkck.split("\n").filter(Boolean).map(line => {
  const [host, token] = line.split("#");
  return { host, token };
});

console.log(`✅ 已读取 ${accountList.length} 个账号`);

!(async () => {
  for (let i = 0; i < accountList.length; i++) {
    const account = accountList[i];
    const ck = ckList[i] || ckList[0]; // 不足时复用第一个
    console.log(`\n===== 🧾 账号${i + 1} 开始 =====`);
    try {
      await mainTask(account, ck, i + 1);
    } catch (err) {
      console.log(`❌ 账号${i + 1} 出错: ${err}`);
      $notify(`❌ 任务异常`, `账号${i + 1}`, err.toString());
    }
  }
  $done();
})();

// 主流程
async function mainTask(account, ck, index) {
  const wentilist = await getWentilist(account, ck, index);
  if (!wentilist) {
    console.log(`⚠️ 账号${index} 获取 wentilist 失败`);
    return;
  }

  await updatePlaylog(account, ck, index, "startPlay", 0, 1);
  await updatePlaylog(account, ck, index, "timer", 240, 1200);
  await updatePlaylog(account, ck, index, "videoPause", 57, 2698);
  await updatePlaylog(account, ck, index, "onUnload", 57, 2698);
  await updatePlaylog(account, ck, index, "onHide", 0, 0);

  await getPlayTime(account, ck, index);
  await getPlayTime(account, ck, index);

  const success = await submitDati(account, ck, index, wentilist);
  if (success) {
    $notify(`✅ 答题成功`, `账号${index}`, `huodong_id: ${account.huodong_id}`);
  } else {
    $notify(`⚠️ 答题失败`, `账号${index}`, `huodong_id: ${account.huodong_id}`);
  }
}

// 获取 wentilist
function getWentilist(account, ck, index) {
  const url = `https://${ck.host}/api/index/index`;
  const headers = {
    "Authorization": ck.token,
    "Content-Type": "application/x-www-form-urlencoded",
    "Host": ck.host
  };
  const body = `huodong_id=${account.huodong_id}&store_id=${account.store_id}&openid=${account.openid}&api_type=h5&uid=${account.uid}`;
  console.log(`📡 获取 wentilist => ${url}`);
  return new Promise(resolve => {
    $task.fetch({ url, method: "POST", headers, body }).then(resp => {
      console.log(`📥 wentilist 响应: ${resp.body}`);
      try {
        const json = JSON.parse(resp.body);
        const wl = json.wentilist || [];
        for (let item of wl) {
          for (let ans of item.daan) {
            const opt = item.xuanxiang.find(x => x.xuhao == ans);
            if (opt) opt.xuanzhong = 1;
          }
        }
        resolve(wl);
      } catch (e) {
        console.log(`❌ wentilist 解析失败: ${e}`);
        resolve(null);
      }
    }, err => {
      console.log(`❌ wentilist 请求错误: ${err.error}`);
      resolve(null);
    });
  });
}

// update_playlog
function updatePlaylog(account, ck, index, type, playtimeNumber, current_time) {
  const url = `https://${ck.host}/api/index/update_playlog`;
  const headers = {
    "Authorization": ck.token,
    "Content-Type": "application/x-www-form-urlencoded",
    "Host": ck.host
  };
  const body =
    `huodong_id=${account.huodong_id}&playtimeNumber=${playtimeNumber}&tid=0&store_id=${account.store_id}&type=${type}&current_time=${current_time}&openid=${account.openid}&api_type=h5&uid=${account.uid}`;
  console.log(`📡 update_playlog ${type} => ${url}`);
  return $task.fetch({ url, method: "POST", headers, body });
}

// get_play_time
function getPlayTime(account, ck, index) {
  const url = `https://${ck.host}/api/index/get_play_time`;
  const headers = {
    "Authorization": ck.token,
    "Content-Type": "application/x-www-form-urlencoded",
    "Host": ck.host
  };
  const body = `huodong_id=${account.huodong_id}&openid=${account.openid}&api_type=h5&uid=${account.uid}`;
  console.log(`📡 get_play_time => ${url}`);
  return $task.fetch({ url, method: "POST", headers, body });
}

// dati
function submitDati(account, ck, index, wentilist) {
  const url = `https://${ck.host}/api/index/dati`;
  const headers = {
    "Authorization": ck.token,
    "Content-Type": "application/x-www-form-urlencoded",
    "Host": ck.host
  };
  const body = `wentilist=${encodeURIComponent(JSON.stringify(wentilist))}&huodong_id=${account.huodong_id}&playtime_ok=2698&playtimeNumber=2811&tid=${account.uid}&openid=${account.openid}&api_type=h5&uid=${account.uid}`;
  console.log(`📡 提交答题 => ${url}`);
  return new Promise(resolve => {
    $task.fetch({ url, method: "POST", headers, body }).then(resp => {
      console.log(`📥 答题响应: ${resp.body}`);
      try {
        const json = JSON.parse(resp.body);
        resolve(json.code === 0);
      } catch {
        resolve(false);
      }
    }, err => {
      console.log(`❌ 答题请求失败: ${err.error}`);
      resolve(false);
    });
  });
}
