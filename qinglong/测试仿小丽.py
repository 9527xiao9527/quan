# -*- coding: utf-8 -*-
"""
lzybody = token#param （多账号换行）
"""

import os
import json
import time
import random
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = "https://agentsja.course.zlhtkj.com"

URL_INFO = BASE + "/hospital/user/getParamCourseInfo"
URL_VSTART = BASE + "/hospital/user/videoStart"
URL_PROGRESS = BASE + "/hospital/user/setVideoProgress"
URL_ANSWER = BASE + "/hospital/user/answerQuestion?ver=2"
URL_RED = BASE + "/hospital/user/getRed"

# ================= UA 池（与你原 UA 同风格） =================
UA_LIST = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62 NetType/WIFI Language/zh_CN",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.63 NetType/WIFI Language/zh_CN",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.64 NetType/4G Language/zh_CN",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.65 NetType/WIFI Language/zh_CN",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.66 NetType/5G Language/zh_CN",
]

HEADERS_TEMPLATE = {
    "Accept-Encoding": "gzip,compress,br,deflate",
    "content-type": "application/json",
    "Connection": "keep-alive",
    "Referer": "https://servicewechat.com/wxfe6628e0fe07b66a/1/page-frame.html",
    "Host": "agentsja.course.zlhtkj.com",
    "x-app-no": "2",
    "x-app-id": "wxfe6628e0fe07b66a"
}

SLEEP = float(os.getenv("VIDEO_SLEEP", "31"))

RED_JOBS = []  # 存储红包领取任务（含 UA）


def req(session, url, headers, data):
    r = session.post(url, headers=headers, json=data, timeout=15)
    try:
        return r.status_code, r.text, r.json()
    except:
        return r.status_code, r.text, None


def run_account(idx, token, param):
    print(f"\n===== [账号 {idx}] 开始执行 =====")

    # ⭐ 每个账号固定一个 UA
    ua = random.choice(UA_LIST)
    print(f"[{idx}] 使用 UA：{ua}")

    session = requests.Session()
    headers = HEADERS_TEMPLATE.copy()
    headers["token"] = token
    headers["User-Agent"] = ua

    # 1. 获取课程信息
    st, tx, js = req(session, URL_INFO, headers, {"param": param})
    if not js or js.get("code") != 1:
        print(f"[{idx}] 获取课程信息失败")
        return

    data = js["data"]
    train_lesson_id = data["train_lesson_id"]
    duration = data.get("duration", 0)

    question_list = data.get("question", [])
    question_id = None
    options = []

    if question_list:
        q = question_list[0]
        question_id = str(q["question_id"])
        try:
            options = json.loads(q["question_option_json"])
        except:
            pass

    print(f"[{idx}] 课时ID={train_lesson_id} 题目ID={question_id}")

    # 2. 视频开始
    st, tx, js = req(session, URL_VSTART, headers, {"train_lesson_id": train_lesson_id})
    print(f"[{idx}] videoStart: {tx}")

    # 3. 视频进度循环
    progress = 0
    while True:
        body = {
            "train_lesson_id": train_lesson_id,
            "duration": duration,
            "progress": progress,
            "watch_time": progress
        }
        st, tx, js = req(session, URL_PROGRESS, headers, body)
        print(f"[{idx}] setVideoProgress({progress}): {tx}")

        if js and js.get("data", {}).get("finished") is True:
            print(f"[{idx}] 视频完成 finished=True")
            break

        progress += 30
        time.sleep(SLEEP)

    # 4. 自动答题
    if question_id and options:
        print(f"[{idx}] 开始自动答题")

        correct = None
        for opt in options:
            if opt.get("answer_checked") == "1":
                correct = opt["option"]
                break

        if correct:
            print(f"[{idx}] 正确答案：{correct}")
            ans = {question_id: correct}
            st, tx, js = req(session, URL_ANSWER, headers, {
                "type": 2,
                "param": param,
                "answer": ans,
                "train_lesson_id": train_lesson_id
            })
            print(f"[{idx}] 答题结果：{tx}")
        else:
            print(f"[{idx}] 无正确标记，顺序尝试")
            for opt in options:
                ans = {question_id: opt["option"]}
                st, tx, js = req(session, URL_ANSWER, headers, {
                    "type": 2,
                    "param": param,
                    "answer": ans,
                    "train_lesson_id": train_lesson_id
                })
                print(f"[{idx}] 尝试 {opt['option']} → {tx}")
                if js and js.get("code") == 1:
                    print(f"[{idx}] 猜对了")
                    break
    else:
        print(f"[{idx}] 没有题目，跳过答题")

    # ⭐ 保存红包任务（连同 UA 一起）
    RED_JOBS.append({
        "idx": idx,
        "token": token,
        "param": param,
        "train_lesson_id": train_lesson_id,
        "ua": ua
    })

    print(f"[{idx}] 账号执行完毕（等待统一领取红包）\n")


def do_red(job):
    idx = job["idx"]
    token = job["token"]
    param = job["param"]
    train_lesson_id = job["train_lesson_id"]
    ua = job["ua"]

    session = requests.Session()
    headers = HEADERS_TEMPLATE.copy()
    headers["token"] = token
    headers["User-Agent"] = ua

    st, tx, js = req(session, URL_RED, headers, {
        "param": param,
        "type": 1,
        "train_lesson_id": train_lesson_id
    })
    print(f"[{idx}] 领取红包：{tx}")


def main():
    raw = os.getenv("lzybody", "").strip()
    if not raw:
        print("请设置环境变量 lzybody，每行格式：token#param")
        return

    accounts = []
    for line in raw.splitlines():
        if "#" not in line:
            continue
        token, param = line.split("#", 1)
        accounts.append((token.strip(), param.strip()))

    print(f"共检测到 {len(accounts)} 个账号\n")

    # ⭐ 顺序执行账号
    for i, (tok, par) in enumerate(accounts, 1):
        run_account(i, tok, par)

    # ⭐ 并发领取红包
    print("\n=========== 所有账号已完成，开始统一领取红包 ===========\n")
    with ThreadPoolExecutor(max_workers=len(RED_JOBS)) as exe:
        futures = [exe.submit(do_red, job) for job in RED_JOBS]
        for _ in as_completed(futures):
            pass

    print("\n=========== 全部任务完成 ===========\n")


if __name__ == "__main__":
    main()
