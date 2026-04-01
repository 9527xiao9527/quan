// 重写脚本：修改paramInfo中的type和msg字段
// 匹配到目标URL后，此脚本会修改其请求体

if ($request && $request.body) {
  try {
    // 1. 获取并解析原始请求体
    let originalBody = JSON.parse($request.body);
    
    // 2. 检查是否存在paramInfo对象
    if (originalBody.paramInfo) {
      // 3. 修改paramInfo中的特定字段
      originalBody.paramInfo.type = 7;  // 将type从8改为7
      originalBody.paramInfo.msg = "视频播放结束";  // 修改msg内容
      
      // 4. 将修改后的对象转换为字符串，并完成重写
      let newBodyString = JSON.stringify(originalBody);
      $done({body: newBodyString});
    } else {
      // 如果原请求中没有paramInfo，不做处理
      console.log("原请求体中未找到paramInfo对象");
      $done();
    }
    
  } catch (error) {
    // 如果解析或处理出错，输出错误并继续原始请求
    console.log(`重写脚本出错: ${error}`);
    $done();
  }
} else {
  // 如果没有请求体，不做处理
  $done();
}