// 课程完成接口修复脚本
// 描述：无条件替换所有/api/course/finish/接口的响应
// 版本：1.0

// 获取原始响应体
let originalBody = $response.body;

// 构造成功响应
const successResponse = {
    "msg": "操作成功",
    "code": 200,
    "data": {
        "hasGetRed": false,
        "hasBindRed": true,
        "finishStatus": true
    }
};

// 将成功响应转换为字符串
const newBody = JSON.stringify(successResponse);

// 输出日志以便调试
console.log(`原始响应: ${originalBody}`);
console.log(`替换后响应: ${newBody}`);

// 返回修改后的响应
$done({ body: newBody });