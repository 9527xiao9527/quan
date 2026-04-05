#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import requests
from urllib.parse import urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor

STEP = 20
WAIT_TIME = 20
MAX_RETRIES = 3
MAX_WORKERS = 20

raw = os.getenv("tickets1")
if not raw:
    print("❌ 未找到环境变量 tickets1")
    exit()

accounts = [x.strip() for x in raw.split("\n") if x.strip()]
print(f"🚀 极速全并发启动，账号数量: {len(accounts)}")


def report_progress(host, headers, ticket, roomId, sessionId, videoLength, startPlay, index):
    play = startPlay
    key = f"b-1a-1c{int(time.time()*1000)}"

    print(f"\n📺 账号{index} 开始刷视频")
    print(f"▶ 当前进度: {play} / {videoLength}")
    print(f"🔑 key: {key}")

    view = 1
    while play < videoLength:
        url = f"https://{host}/daqingye/banlangen/zhike"
        params = {
            "tt": ticket,
            "pP": play,
            "vP": view,
            "dC": 0,
            "rId": roomId,
            "sId": sessionId,
            "kk": key
        }

        print(f"账号{index} ⏫ 上报 pP={play} vP={view}")

        retries = 0
        success = False

        while retries <= MAX_RETRIES and not success:
            try:
                r = requests.get(url, headers=headers, params=params, timeout=10)
                data = r.json()
                print(f"账号{index} 📡 上报返回: {data}")

                if data.get("errorCode") == 0 and data["data"].get("err") == 0:
                    success = True
                elif data["data"].get("err") == -100:
                    retries += 1
                    print(f"账号{index} ⚠ -100 重试 {retries}")
                    time.sleep(2)
                else:
                    print(f"账号{index} ❌ 上报异常，停止")
                    return False

            except Exception as e:
                print(f"账号{index} ❌ 上报异常: {e}")
                return False

        play += STEP
        view += STEP
        time.sleep(WAIT_TIME)

    print(f"🎉 账号{index} 视频刷完")
    return True


def run_account(line, idx):
    try:
        print(f"\n========== 账号 {idx} 开始 ==========")

        url, headers_json = line.split("#", 1)
        headers = json.loads(headers_json)
        host = url.split("/")[2]

        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        roomId = int(qs["roomId"][0])
        sessionId = int(qs["sessionId"][0])
        shareCode = qs["shareCode"][0]

        print(f"账号{idx} 📡 进入直播...")
        r1 = requests.get(
            f"https://{host}/lilu/guadi/xionghuang",
            headers=headers,
            params={"roomId": roomId, "sessionId": sessionId, "shareCode": shareCode},
            timeout=10
        )
        data1 = r1.json()
        print(f"账号{idx} 📡 进入直播返回: {data1}")

        result = data1["data"]["result"]
        activityId = result["activityId"]
        inviteStaffId = result["inviteUserId"]
        videoLength = result["videoLength"]
        playDuration = result.get("playDuration", 0)
        print(f"账号{idx} ▶ 当前播放进度: {playDuration} / {videoLength}")

        r2 = requests.get(
            f"https://{host}/duhuo/qianghuo/gaoben",
            headers=headers,
            params={
                "roomId": roomId,
                "activityId": activityId,
                "sessionId": sessionId,
                "inviteStaffId": inviteStaffId
            },
            timeout=10
        )
        ticket = r2.json()["data"]
        print(f"账号{idx} 🎫 ticket: {ticket}")

        report_progress(host, headers, ticket, roomId, sessionId, videoLength, playDuration, idx)

    except Exception as e:
        print(f"❌ 账号{idx} 总异常: {e}")


with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    for i, acc in enumerate(accounts, 1):
        executor.submit(run_account, acc, i)
