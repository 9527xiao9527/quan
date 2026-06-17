let body = $response.body;

try {
    const obj = JSON.parse(body);

    const answer = obj?.data?.arrayList?.[0]?._tilist?.[0]?.needChoose;

    if (answer) {
        $notify("题目答案", "", `正确答案：${answer}`);
    } else {
        $notify("题目答案", "", "未找到答案");
    }
} catch (e) {
    console.log(e);
    $notify("题目答案", "", "解析失败");
}

$done({ body });