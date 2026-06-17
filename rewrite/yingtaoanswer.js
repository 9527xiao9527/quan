let body = $response.body;

console.log("响应体：" + body);

if (!body || body === "undefined") {
    console.log("响应为空，跳过");
    $done({});
} else {
    try {
        let obj = JSON.parse(body);

        let answer =
            obj?.data?.arrayList?.[0]?._tilist?.[0]?.needChoose;
        let title =
            obj?.data?.arrayList?.[0]?._tilist?.[0]?.title?.trim();

        if (answer) {
            console.log(`题目：${title}`);
            console.log(`答案：${answer}`);

            $notify(
                "答题助手",
                title || "发现题目",
                `答案：${answer}`
            );
        } else {
            console.log("未发现答案");
        }

        $done({ body });
    } catch (e) {
        console.log("解析失败：" + e);
        $done({});
    }
}