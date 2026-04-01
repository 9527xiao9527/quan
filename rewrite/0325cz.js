let body = $response.body;

try {
    let obj = JSON.parse(body);

    if (obj && obj.data && obj.data.mediaUrl) {

        obj.data.mediaUrl = "https://dt-1397227125.cos.ap-beijing.myqcloud.com/mall/media/plantform/20260321/8fbdff4df6144454a52fab5665c95f7c.mp3";
/*
        obj.data.mediaUrl = "https://video-bsy.51miz.com/sound/00/00/26/49/S-264918-264918-44110A36.mp3";
*/
        console.log("✅ mediaUrl 已替换");
    }

    body = JSON.stringify(obj);
} catch (e) {
    console.log("❌ JSON解析失败: " + e);
}

$done({ body });
