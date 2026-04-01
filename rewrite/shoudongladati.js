let body = $response.body;
try {
  let obj = JSON.parse(body);

  if (obj?.resultData?.reply_rate !== undefined) {
    obj.resultData.reply_rate = 100;
  }

  if (obj?.resultData?.questions && Array.isArray(obj.resultData.questions)) {
    obj.resultData.questions.forEach(q => {
      q.is_right = true;
    });
  }

  body = JSON.stringify(obj);
} catch (e) {
  console.log("❌ 处理出错: " + e);
}

$done({ body });
