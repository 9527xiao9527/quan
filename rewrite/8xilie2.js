if ($response?.body) {
  $prefs.setValueForKey($response.body, "wxapp_entity");
  console.log("✅ 已保存 wxappEntity 数据");
}
$done({});