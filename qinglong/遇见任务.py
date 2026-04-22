# -*- coding: utf-8 -*-
import requests
import time
import os
from concurrent.futures import ThreadPoolExecutor

 #环境变量 yujianck（多账号换行）
 #格式：openId#vid#sysUserId

# ================= 配置 =================
MAX_RETRY = 3
THREAD_NUM = 5   # 并发线程数
SLEEP_INTERVAL = 2  # 心跳间隔2秒

# ================= 请求头 =================
headers = {
    "Accept-Encoding": "gzip,compress,br,deflate",
    "Content-Type": "application/json",
    "Connection": "keep-alive",
    "Referer": "https://servicewechat.com/wx097f09b9734726bb/3/page-frame.html",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70(0x1800463a) NetType/WIFI Language/zh_CN"
}


# ================= 工具函数 =================
def request_with_retry(method, url, **kwargs):
    for i in range(MAX_RETRY):
        try:
            if method == "GET":
                res = requests.get(url, headers=headers, timeout=10, **kwargs)
            else:
                res = requests.post(url, headers=headers, timeout=10, **kwargs)
            return res.json()
        except Exception as e:
            print(f"请求失败({i+1}/{MAX_RETRY})：{e}")
            time.sleep(1)
    return None


# ================= 单账号任务 =================
def run_one(ck):
    try:
        openId, vid, sysUserId = ck.strip().split("#")
        print(f"\n===== 开始账号: {openId[:6]}... =====")

        # 1️⃣ 打开记录
        url = "https://yujianyunbo.com/prod-api/api/wechat/member/openLiveRecord"
        data = {
            "openId": openId,
            "vid": vid,
            "liveType": 2,
            "sysUserId": sysUserId
        }
        request_with_retry("POST", url, json=data)

        # 2️⃣ 获取视频总时长
        url = f"https://yujianyunbo.com/prod-api/api/wechat/member/yxlLiveStreamById?id={vid}"
        res = request_with_retry("GET", url)

        if not res or res.get("code") != 200:
            print("❌ 获取视频信息失败")
            return

        duration = float(res["data"]["duration"])
        print(f"🎬 视频总时长: {duration}")

        # 3️⃣ 获取已观看时长
        url = "https://yujianyunbo.com/prod-api/api/wechat/member/getDurationByOpenIdAndLiveId"
        data = {
            "openId": openId,
            "vid": vid,
            "sysUserId": sysUserId,
            "liveType": 2
        }
        res = request_with_retry("POST", url, json=data)

        watch = 0
        if res and res.get("code") == 200:
            watch = res["data"]["watchDuration"]

        print(f"⏱ 当前观看: {watch}")

        # 4️⃣ 心跳循环
        url = "https://yujianyunbo.com/prod-api/api/wechat/member/reportHeartbeat"

        while watch < duration:
            data = {
                "openId": openId,
                "vid": vid,
                "sysUserId": sysUserId,
                "heartbeatIntervalSec": 13,
                "liveType": 2
            }

            res = request_with_retry("POST", url, json=data)

            if res and res.get("code") == 200:
                watch += 13
                print(f"❤️ 心跳成功 -> 当前: {watch}/{int(duration)}")
            else:
                print("⚠️ 心跳失败")

            time.sleep(SLEEP_INTERVAL)

        print("🎉 播放完成")

    except Exception as e:
        print(f"❌ 账号异常跳过: {e}")


# ================= 主函数 =================
def main():
    ck_data = os.getenv("yujianck")
    if not ck_data:
        print("❌ 未填写 yujianck")
        return

    ck_list = [i for i in ck_data.split("\n") if i.strip()]

    print(f"共 {len(ck_list)} 个账号，开始并发执行...\n")

    with ThreadPoolExecutor(max_workers=THREAD_NUM) as executor:
        executor.map(run_one, ck_list)


if __name__ == "__main__":
    main()
