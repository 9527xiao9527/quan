let body = $response.body;

try {
    let obj = JSON.parse(body);

    if (obj?.data?.assignment?.length) {

        let msg = "";

        obj.data.assignment.forEach((item, i) => {

            let question = item.content || "未知题目";
            let options = item.options || [];
            let answer = item.answer || "";

            if (answer && options.length > 0) {

                let index = answer.charCodeAt(0) - 65;
                let answerText = options[index] || "未知";

                msg += `第${i + 1}题：${question}\n`;
                msg += `答案：${answer} -> ${answerText}\n\n`;
            }
        });

        if (msg) {
            $notify(
                "课程答题答案",
                obj.data.course_name || "",
                msg.trim()
            );
        }

    }

} catch (e) {
    console.log("解析失败：" + e);
}

$done({ body });