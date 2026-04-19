let obj = JSON.parse($response.body);

let list = obj?.data?.yxlStreamQuestionList || [];

let answers = [];

for (let i of list) {
    if (i.answer) {
        answers.push(i.answer);
    }
}

// 去重
answers = [...new Set(answers)];

if (answers.length > 0) {
    let result = answers.join(" / ");
    $notify("答题答案", "提取成功", result);
}

$done({});