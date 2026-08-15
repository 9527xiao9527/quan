/**
 * 酷狗概念版 获取CK - QX 重写脚本 (适配青龙)
 *
 * 作用: 在 Quantumult X 端抓取酷狗请求, 提取账号参数, 拼成青龙变量
 *      KUGOU_YOUTH 所需的 JSON, 通过通知展示并保存到持久化存储,
 *      你复制后手动填入青龙环境变量 KUGOU_YOUTH 即可。
 *
 * ── QX 配置示例 ──────────────────────────────────────────────
 * [rewrite_local]
 * ^https?://(gateway|gatewayretry|gateway3)\.kugou\.com/youth/v1/activity/get_month_vip_record url script-request-header kgck_qx.js
 *
 * [mitm]
 * hostname = gateway.kugou.com, gatewayretry.kugou.com, gateway3.kugou.com
 * ────────────────────────────────────────────────────────────
 */

const NAME = '酷狗获取CK-QX';

(async () => {
  try {
    if (typeof $request === 'undefined' || !$request || !$request.url) {
      log('未检测到请求对象, 请在触发抓包的请求上运行此脚本');
      return;
    }

    // 从请求 URL 提取账号参数
    const qs = new URLSearchParams($request.url.split('?')[1] || '');
    const account = {
      appid: qs.get('appid'),
      clientver: qs.get('clientver'),
      mid: qs.get('mid'),
      uuid: qs.get('uuid'),
      dfid: qs.get('dfid'),
      token: qs.get('token'),
      userid: qs.get('userid'),
      srcappid: qs.get('srcappid'),
    };

    const required = ['appid', 'clientver', 'mid', 'uuid', 'dfid', 'token', 'userid', 'srcappid'];
    const missing = required.filter((k) => !account[k]);
    if (missing.length) {
      log('参数缺失: ' + missing.join(', '));
      notify(NAME, '❌ 提取失败', '缺少参数: ' + missing.join(', '));
      return;
    }

    const envValue = JSON.stringify(account);

    // 保存到持久化存储, 方便随时查看/复制
    write('KUGOU_YOUTH', envValue);

    log('提取到的青龙变量 KUGOU_YOUTH:');
    log(envValue);
    notify(NAME, '✅ 提取成功', '已保存, 请复制填入青龙 KUGOU_YOUTH\n' + envValue);
  } catch (e) {
    log('脚本执行出错: ' + (e && e.message ? e.message : e));
    notify(NAME, '❌ 执行失败', (e && e.message) || '未知错误');
  } finally {
    done();
  }
})();

// ==== QX 环境适配封装 ====
function write(key, value) {
  if (typeof $prefs !== 'undefined') return $prefs.setValueForKey(value, key);
  if (typeof $persistentStore !== 'undefined') return $persistentStore.write(value, key);
}

function log(msg) {
  console.log(msg);
}

function notify(title, subtitle, body) {
  if (typeof $notify !== 'undefined') $notify(title, subtitle, body);
}

function done() {
  if (typeof $done !== 'undefined') $done({});
}
