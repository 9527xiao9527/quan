// xuezhibang_unlock.js
// 重写脚本：注入 JS 到课程页面，强制解锁答题按钮
// Quantumult X rewrite 配置：
// ^https?://m\.xuezhibang\.com/app/conten\.php url script-response-body xuezhibang_unlock.js

const body = $response.body || "";

// 只处理包含答题逻辑的最终页面
if (!body.includes("fnBeginExam") || !body.includes("storageID")) {
  $done({});
  return;
}

// 提取 storageID 的值（如 f8fa205584）
const sidMatch = body.match(/let\s+storageID\s*=\s*['"]([^'"]+)['"]/);
const storageID = sidMatch ? sidMatch[1] : null;

// 注入脚本：设置 localStorage 并在页面加载完后调用 fnBeginExam
const inject = `
<script>
(function(){
  var sid = ${storageID ? `"${storageID}"` : 'null'};
  if(sid){
    // 写入足够的 pong 心跳次数
    localStorage.setItem(sid + '-pong', '99');
    // 写入最大播放进度（视频总时长，单位秒，设一个足够大的值）
    var dur = (typeof videoDuration !== 'undefined') ? videoDuration/1000 : 99999;
    localStorage.setItem(sid + '-max', dur);
    localStorage.setItem(sid, dur);
  }
  // 等页面 JS 全部加载完再调用解锁函数
  window.addEventListener('load', function(){
    setTimeout(function(){
      if(typeof fnBeginExam === 'function'){
        fnBeginExam();
        console.log('[unlock] fnBeginExam called');
      }
      // 同时直接操作 DOM 解锁按钮
      var btn = document.getElementById('comfirm');
      if(btn){ btn.classList.remove('lock'); }
      var tips = document.querySelector('.dt_tips');
      if(tips){ tips.style.display = 'none'; }
    }, 1500);
  });
})();
</script>
`;

// 注入到 </body> 前
const newBody = body.replace("</body>", inject + "</body>");

$done({ body: newBody });
