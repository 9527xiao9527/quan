#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor

STEP = 20
WAIT_TIME = 20
ANSWER_WAIT = 5
MAX_RETRIES = 3
MAX_WORKERS = 20

raw = os.getenv("ticket")
if not raw:
    print("❌ 未找到环境变量 tickets")
    exit()

accounts = [x.strip() for x in raw.split("\n") if x.strip()]
print(f"🚀 极速全并发启动，账号数量: {len(accounts)}")


def report_progress(host, headers, ticket, roomId, sessionId, videoLength, startPlay, index):

    play = startPlay
    key = f"b-1a-1c{int(time.time()*1000)}"

    print(f"\n📺 账号{index} 开始刷视频")
    print(f"▶ 当前进度: {play}")
    print(f"🎬 总时长: {videoLength}")
    print(f"🔑 key: {key}")

    view = 1
    while play < videoLength:

        #view = play + 1
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
                print(f"账号{index} 📡 上报返回: {data}")

                if data.get("errorCode") == 0 and data["data"].get("code") == 0:
                    success = True
                elif data["data"].get("code") == -100:
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


def get_finish_redpacket(host, headers, sessionId, shareCode, videoLength, inviteStaffId, index):

    print(f"\n账号{index} ⏳ 等待5秒领取红包...")
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
        result = r.json()
        print(f"账号{index} 🎁 红包返回: {result}")
    except Exception as e:
        print(f"账号{index} ❌ 红包请求异常: {e}")


def try_answers(host, headers, sessionId, shareCode, inviteStaffId, videoLength, index):

    print(f"\n账号{index} ⏳ 等待5秒获取题目...")
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

        question_data = r.json()
        print(f"账号{index} 📡 题目返回: {question_data}")

        question = question_data["data"]["questions"]["questions"][0]
        question_id = question["id"]

    except Exception as e:
        print(f"账号{index} ❌ 获取题目失败: {e}")
        return

    print(f"账号{index} 📝 题目ID: {question_id}")
    print(f"账号{index} ⏳ 等待5秒开始答题...")
    time.sleep(5)

    options = ["A", "B", "C", "D"]
    max_try = 5
    try_count = 0

    while try_count < max_try:

        option = options[try_count % 4]
        try_count += 1

        body = {
            "sessionId": sessionId,
            "shareCode": shareCode,
            "submitAnswers": [{
                "question": question_id,
                "answer": [option]
            }],
            "timeAxis": videoLength,
            "inviteStaffId": str(inviteStaffId)
        }

        print(f"账号{index} 🧠 第{try_count}次尝试答案: {option}")

        try:
            r2 = requests.post(
                f"https://{host}/member/api/QuestionAnswer/SubmitAnswer",
                headers=headers,
                json=body,
                timeout=10
            )

            result = r2.json()
            print(f"账号{index} 📡 答题返回: {result}")

        except Exception as e:
            print(f"账号{index} ❌ 答题请求异常: {e}")
            time.sleep(ANSWER_WAIT)
            continue

        if result.get("errorMessage") == "抱歉，答题次数已超上限":
            print(f"账号{index} ⚠️ 答题次数已超上限，停止")
            return

        data = result.get("data")
        if not data:
            print(f"账号{index} ⚠️ data为空，继续")
            time.sleep(ANSWER_WAIT)
            continue

        qa_list = data.get("questionAnswerList")
        if not qa_list:
            print(f"账号{index} ⚠️ 未返回答题结果，继续")
            time.sleep(ANSWER_WAIT)
            continue

        if qa_list[0].get("answerresult"):
            print(f"🎉 账号{index} 正确答案: {option}")

            get_finish_redpacket(
                host,
                headers,
                sessionId,
                shareCode,
                videoLength,
                inviteStaffId,
                index
            )

            return

        print(f"账号{index} ❌ 错误，5秒后继续")
        time.sleep(ANSWER_WAIT)

    print(f"❌ 账号{index} 达到最大尝试次数 {max_try}")


def run_account(line, idx):
    try:
        print(f"\n========== 账号 {idx} 开始 ==========")

        url, headers_json, body_json = line.split("#", 2)
        headers = json.loads(headers_json)
        body = json.loads(body_json)

        host = url.split("/")[2]
        shareCode = body["shareCode"]

        print(f"账号{idx} 📡 进入直播")

        r1 = requests.post(url, headers=headers, json=body, timeout=10)
        data1 = r1.json()
        print(f"账号{idx} 📡 进入直播返回: {data1}")

        result = data1["data"]["result"]

        sessionId = result["sessionId"]
        roomId = result["roomId"]
        activityId = result["activityId"]
        inviteStaffId = result["inviteUserId"]
        videoLength = result["videoLength"]
        playDuration = result["playDuration"]

        print(f"账号{idx} ▶ 当前播放进度: {playDuration}")

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
        print(f"账号{idx} 🎫 ticket获取成功")

        ok = report_progress(host, headers, ticket, roomId, sessionId, videoLength, playDuration, idx)

        if ok:
            try_answers(host, headers, sessionId, shareCode, inviteStaffId, videoLength, idx)

    except Exception as e:
        print(f"❌ 账号{idx} 总异常: {e}")


with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    for i, acc in enumerate(accounts, 1):
        executor.submit(run_account, acc, i)
