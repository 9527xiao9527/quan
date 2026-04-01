let data = $prefs.valueForKey("xinzhjk_info")

if(!data){
$notify("错误","未抓到info","请先打开活动")
$done()
}

let [info_url,token] = data.split("#")

// 自动提取 host
let host = info_url.split("/api/")[0]

let headers = {
"token":token,
"channel":"wechat",
"Content-Type":"application/json",
"User-Agent":"Mozilla/5.0"
}

!(async()=>{

console.log("开始执行")

// 获取info
let info = await $task.fetch({
url:info_url,
headers:headers
})

let json = JSON.parse(info.body)

let activity_id = json.data.activity_info.id
let store_id = json.data.user.store_id

let currentPlay = Number(json.data.playTimeNumber || 0)
let targetTime = Number(json.data.activity_info.dati_time || 0)

console.log(`activity: ${activity_id}`)
console.log(`store: ${store_id}`)
console.log(`host: ${host}`)
console.log(`当前播放: ${currentPlay}`)
console.log(`目标播放: ${targetTime}`)

let needTime = targetTime - currentPlay

if(needTime <= 0){
$notify("播放任务","已经完成",`当前:${currentPlay}`)
$done()
return
}

console.log(`需要补: ${needTime}`)

// 计算循环次数
let playTimes = Math.ceil(needTime / 240)

console.log(`模拟播放次数: ${playTimes}`)

let total_play_time = currentPlay

// start
await playlog("startPlay",240,total_play_time)

// 模拟播放
for(let i=0;i<playTimes;i++){

await sleep(random(3000,5000))

total_play_time += 240

if(total_play_time > targetTime){
total_play_time = targetTime
}

await playlog("timer",240,total_play_time)

console.log(`播放: ${total_play_time}`)

if(total_play_time >= targetTime){
break
}

}

// pause
await playlog("videoPause",total_play_time+56,total_play_time)

// end
await playlog("videoEnded",0,total_play_time)

// 获取服务器播放时间
let play = await getPlayTime(activity_id)

console.log(`服务器播放时间: ${play}`)

$notify("播放完成","时间:"+play,"")

$done()



async function playlog(type,playtime,current){

let url = host + "/api/htscrm/activity/update_playlog"

let body = JSON.stringify({
activity_id:activity_id,
store_id:store_id,
type:type,
playtime_number:playtime,
current_time:current,
err_code:""
})

return $task.fetch({
url:url,
method:"POST",
headers:headers,
body:body
})

}



async function getPlayTime(activity_id){

let url = host + "/api/htscrm/activity/get_play_time?activity_id="+activity_id

let r = await $task.fetch({
url:url,
headers:headers
})

let j = JSON.parse(r.body)

return j.data.playtime_number

}

})()



function random(min,max){
return Math.floor(Math.random()*(max-min+1))+min
}

function sleep(ms){
return new Promise(r=>setTimeout(r,ms))
}