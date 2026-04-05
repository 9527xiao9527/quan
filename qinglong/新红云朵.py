# -*- coding: utf-8 -*-
"""
xinhyd 视频心跳并发脚本
环境变量：
xinhydck = url#Authorization （多账号换行）
"""

import os
import time
import threading
import requests
from urllib.parse import urlparse, parse_qs

INTERVAL = 10  # 请求间隔（秒）
TIME_STEP = 10  # currentTime 增量

def parse_from_url(url: str):
    """从 URL 提取 host + 参数"""
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)

    host = parsed.netloc
    tenant_id = int(qs.get("tenantId", [0])[0])
    tenant_account_id = int(qs.get("tenantAccountId", [0])[0])
    activity_sub_id = int(qs.get("activitySubId", [0])[0])

    return host, tenant_id, tenant_account_id, activity_sub_id


def run_account(line: str, idx: int):
    try:
        url, auth = line.split("#", 1)
    except ValueError:
        print(f"❌ 账号 {idx} 格式错误，跳过")
        return

    host, tenant_id, tenant_account_id, activity_sub_id = parse_from_url(url)

    heartbeat_url = f"https://{host}/v1/activity/video-heartbeat"

    headers = {
        "Accept-Encoding": "gzip,compress,br,deflate",
        "content-type": "application/json",
        "Connection": "keep-alive",
        "Referer": "https://servicewechat.com/wxbfc53136e19e4eb4/1/page-frame.html",
        "Host": host,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62(0x18003e3a) NetType/4G Language/zh_CN",
        "Authorization": auth
    }

    current_time = 0

    print(f"\n▶▶▶ 账号 {idx} 开始执行（activitySubId={activity_sub_id}）")

    while True:
        body = {
            "tenantId": tenant_id,
            "tenantAccountId": tenant_account_id,
            "activitySubId": activity_sub_id,
            "currentTime": current_time
        }

        try:
            resp = requests.post(
                heartbeat_url,
                headers=headers,
                json=body,
                timeout=10
            )
            data = resp.json()
        except Exception as e:
            print(f"❌ 账号 {idx} 请求异常：{e}")
            time.sleep(INTERVAL)
            continue

        if data.get("code") != 200:
            print(f"❌ 账号 {idx} 接口返回异常：{data}")
            time.sleep(INTERVAL)
            continue

        info = data.get("data", {})
        finished = info.get("isFinished", False)
        progress = info.get("playTimeProcess", current_time)

        print(
            f"账号 {idx} | currentTime={current_time} | "
            f"进度={progress} | 完成={finished}"
        )

        if finished:
            print(f"✅ 账号 {idx} 已完成，停止心跳")
            break

        current_time += TIME_STEP
        time.sleep(INTERVAL)


def main():
    env = os.getenv("xinhydck")
    if not env:
        print("❌ 未读取到环境变量 xinhydck")
        return

    accounts = [i.strip() for i in env.splitlines() if i.strip()]
    print(f"共读取到 {len(accounts)} 个账号")

    threads = []
    for idx, line in enumerate(accounts, 1):
        t = threading.Thread(target=run_account, args=(line, idx))
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    print("\n🎉 所有账号执行完毕")


if __name__ == "__main__":
    main()
