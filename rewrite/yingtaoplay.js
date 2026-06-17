try {
    let body = JSON.parse($request.body);

    body.IsFinshPlay = true;

    $notify(
        "修改成功",
        "",
        ""
    );

    $done({
        body: JSON.stringify(body)
    });
} catch (e) {
    $notify("视频学习", "修改失败", String(e));
    $done({});
}