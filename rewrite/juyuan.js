

let body = $response.body;
let obj = JSON.parse(body);

if (obj?.data) {
  const originalDuration = obj.data.video_duration;

  if (originalDuration !== undefined) {
    obj.data.schedule_second = String(originalDuration);
  }

  try {
    const topics = obj.data.question_content?.topic || [];
    for (let topic of topics) {
      const correctAns = topic.answer?.find(opt => opt.is_correct === 1);
      if (correctAns) {
        $notify("✅ 答案", "", correctAns.content);
        break;
      }
    }
  } catch (e) {}
}

$done({ body: JSON.stringify(obj) });
