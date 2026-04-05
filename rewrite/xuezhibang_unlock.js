// xuezhibang_unlock.js
// 注入 JS：发真实 WebSocket pong 让服务端记录，同时解锁前端答题按钮
// ^https?://m\.xuezhibang\.com/app/conten\.php url script-response-body xuezhibang_unlock.js

const body = $response.body || "";

if (!body.includes("fnBeginExam") || !body.includes("storageID")) {
  $done({});
  return;
}

const inject = `
<script>
(function(){
  // 等页面原始变量初始化完毕再执行
  window.addEventListener('load', function(){
    setTimeout(function(){

      var sid = (typeof storageID !== 'undefined') ? storageID : null;
      var dur = (typeof videoDuration !== 'undefined') ? videoDuration / 1000 : 99999;

      // 1. 写 localStorage，解锁前端判断
      if(sid){
        localStorage.setItem(sid + '-pong', '99');
        localStorage.setItem(sid + '-max', dur);
        localStorage.setItem(sid, dur);
      }

      // 2. 发真实 WebSocket pong，让服务端记录
      function sendPongs(count, interval) {
        var _ws = new WebSocket("wss://lts.qihuangxueshe.cn/wss");
        _ws.onopen = function(){
          // 先登录
          _ws.send(JSON.stringify({
            type: 'login', leixing: 'ky',
            openid: openid, nickname: nickname,
            headerimg: headerimg, zb_id: zb_id, kb_id: kb_id
          }));
          // 延迟后连续发 pong
          var sent = 0;
          var t = setInterval(function(){
            _ws.send(JSON.stringify({
              type: 'pong', leixing: 'ky',
              openid: openid, zb_id: zb_id,
              kb_id: kb_id, sfzb: 2
            }));
            sent++;
            console.log('[unlock] pong ' + sent + '/' + count);
            if(sent >= count){
              clearInterval(t);
              _ws.close();
              // 3. pong 发完后解锁答题
              unlockExam();
            }
          }, interval);
        };
        _ws.onerror = function(e){
          console.log('[unlock] ws error, fallback unlock');
          unlockExam();
        };
      }

      function unlockExam(){
        if(typeof fnBeginExam === 'function') fnBeginExam();
        var btn = document.getElementById('comfirm');
        if(btn) btn.classList.remove('lock');
        var tips = document.querySelector('.dt_tips');
        if(tips) tips.style.display = 'none';
        console.log('[unlock] exam unlocked');
      }

      // 发 5 次 pong，每次间隔 1s
      sendPongs(5, 1000);

    }, 1000);
  });
})();
</script>
`;

$done({ body: body.replace("</body>", inject + "</body>") });
