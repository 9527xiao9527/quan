#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import random
import requests
from urllib.parse import urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor

STEP = 20
WAIT_TIME = 15
ANSWER_WAIT = 5
MAX_RETRIES = 3
MAX_WORKERS = 20

raw = os.getenv("ticket")
if not raw:
    print("❌ 未找到环境变量 ticket")
    exit()

accounts = [x.strip() for x in raw.split("\n") if x.strip()]
print(f"🚀 并发启动，账号数量: {len(accounts)}")


# ================== 刷视频 ==================
def report_progress(host, headers, ticket, roomId, sessionId, videoLength, startPlay, index):

    play = startPlay
    key = f"b-1a-1c{int(time.time()*1000)}"

    print(f"\n📺 账号{index} 开始刷视频")
    print(f"▶ 当前进度: {play}")
    print(f"🎬 总时长: {videoLength}")

    # 👉 更真实
    view = 1

    while play < videoLength:

        url = f"https://{host}/member/api/Broadcast/Collect"

        params = {
            "ticket": ticket,
            "playProgress": play,
            "viewProgress": view,
            "dragCount": 0,
            "roomId": roomId,
            "sessionId": sessionId,
            "key": key
        }

        print(f"账号{index} ⏫ 上报 play={play} view={view}")

        retries = 0
        success = False

        while retries <= MAX_RETRIES and not success:
            try:
                r = requests.get(url, headers=headers, params=params, timeout=10)
                data = r.json()
                print(f"账号{index} 📡 返回: {data}")

                # ✅ 核心修复（兼容 data=None）
                if data.get("errorCode") == 0:
                    success = True

                elif data.get("data") and data["data"].get("code") == -100:
                    retries += 1
                    print(f"账号{index} ⚠ -100 重试 {retries}")
                    time.sleep(2)

                else:
                    print(f"账号{index} ❌ 上报异常，停止")
                    return False

            except Exception as e:
                print(f"账号{index} ❌ 上报异常: {e}")
                return False

        # 👉 随机更真实
        step = random.randint(15, 25)
        play += step
        view += step

        sleep_time = random.randint(10, 20)
        time.sleep(sleep_time)

    print(f"🎉 账号{index} 视频完成")
    return True


# ================== 领红包 ==================
def get_finish_redpacket(host, headers, sessionId, shareCode, videoLength, inviteStaffId, index):

    print(f"\n账号{index} ⏳ 领取红包...")
    time.sleep(5)

    url = f"https://{host}/member/api/QuestionAnswer/GetFinishRedPacket"

    body = {
        "sessionId": sessionId,
        "shareCode": shareCode,
        "timeAxis": videoLength,
        "inviteStaffId": str(inviteStaffId)
    }

    try:
        r = requests.post(url, headers=headers, json=body, timeout=10)
        print(f"账号{index} 🎁 红包: {r.json()}")
    except Exception as e:
        print(f"账号{index} ❌ 红包异常: {e}")


# ================== 答题 ==================
def try_answers(host, headers, sessionId, shareCode, inviteStaffId, videoLength, index):

    print(f"\n账号{index} ⏳ 获取题目...")
    time.sleep(5)

    try:
        r = requests.get(
            f"https://{host}/member/api/Broadcast/GetQuestionsConfig",
            headers=headers,
            params={
                "sessionId": sessionId,
                "shareCode": shareCode,
                "inviteStaffId": inviteStaffId
            },
            timeout=10
        )

        data = r.json()
        print(f"账号{index} 📡 题目: {data}")

        question = data["data"]["questions"]["questions"][0]
        qid = question["id"]

    except Exception as e:
        print(f"账号{index} ❌ 获取题目失败: {e}")
        return

    options = ["A", "B", "C", "D"]

    for i in range(5):

        opt = options[i % 4]

        body = {
            "sessionId": sessionId,
            "shareCode": shareCode,
            "submitAnswers": [{
                "question": qid,
                "answer": [opt]
            }],
            "timeAxis": videoLength,
            "inviteStaffId": str(inviteStaffId)
        }

        print(f"账号{index} 🧠 尝试答案: {opt}")

        try:
            r2 = requests.post(
                f"https://{host}/member/api/QuestionAnswer/SubmitAnswer",
                headers=headers,
                json=body,
                timeout=10
            )

            res = r2.json()
            print(f"账号{index} 📡 答题返回: {res}")

        except Exception as e:
            print(f"账号{index} ❌ 答题异常: {e}")
            time.sleep(ANSWER_WAIT)
            continue

        if res.get("errorMessage") == "抱歉，答题次数已超上限":
            return

        qa = res.get("data", {}).get("questionAnswerList")
        if qa and qa[0].get("answerresult"):
            print(f"🎉 账号{index} 正确答案: {opt}")
            get_finish_redpacket(host, headers, sessionId, shareCode, videoLength, inviteStaffId, index)
            return

        time.sleep(ANSWER_WAIT)


# ================== 主流程 ==================
def run_account(line, idx):
    try:
        print(f"\n========== 账号 {idx} ==========")

        url, headers_json = line.split("#", 1)
        headers = json.loads(headers_json)

        host = url.split("/")[2]

        print(f"账号{idx} 📡 进入直播")

        r = requests.get(url, headers=headers, timeout=10)
        data = r.json()
        print(f"账号{idx} 📡 返回: {data}")

        result = data["data"]["result"]

        sessionId = result["sessionId"]
        roomId = result["roomId"]
        activityId = result["activityId"]
        inviteStaffId = result["inviteUserId"]
        videoLength = result["videoLength"]
        playDuration = result["playDuration"]

        shareCode = parse_qs(urlparse(url).query).get("shareCode", [""])[0]

        r2 = requests.get(
            f"https://{host}/member/api/Broadcast/GetTicket",
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

        ok = report_progress(
            host, headers, ticket,
            roomId, sessionId,
            videoLength, playDuration, idx
        )

        if ok:
            try_answers(
                host, headers,
                sessionId, shareCode,
                inviteStaffId, videoLength, idx
            )

    except Exception as e:
        print(f"❌ 账号{idx} 异常: {e}")


# ================== 并发 ==================
with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    for i, acc in enumerate(accounts, 1):
        executor.submit(run_account, acc, i)
