// 获取响应体
let body = $response.body;
let obj = JSON.parse(body);

// 同步 playDuration
if (obj?.course?.duration !== undefined) {
    obj.playDuration = obj.course.duration;
}

// 设置 isFinish = 1
obj.isFinish = 1;


// 提取正确答案
let answerList = [];
try {
    let questions = obj?.questions;
    if (questions && questions.length > 0) {
        let questionStr = questions[0]?.question;
        if (questionStr) {
            let options = JSON.parse(questionStr);
            options.forEach(option => {
                if (option.isAnswer === 1) {
                    answerList.push(option.name);
                }
            });
        }
    }
} catch (err) {
    console.log('提取答案失败: ' + err);
}

// 发送通知
if (answerList.length > 0) {
    $notify("答案", "", answerList.join('、'));
} else {
    $notify("答案提取失败", "", "未找到正确答案");
}

// 输出修改后的响应体
$done({ body: JSON.stringify(obj) });
