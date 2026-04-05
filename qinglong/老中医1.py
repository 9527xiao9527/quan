# -*- coding: utf-8 -*-
"""
lzybody = token#param （多账号换行）
"""

import os, json, time, requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = "https://ja.watch.class.llc77.cn"

URL_INFO = BASE + "/hospital/user/getParamCourseInfo"
URL_VSTART = BASE + "/hospital/user/videoStart"
URL_PROGRESS = BASE + "/hospital/user/setVideoProgress"
URL_ANSWER = BASE + "/hospital/user/answerQuestion?ver=2"
URL_RED = BASE + "/hospital/user/getRed"

HEADERS_TEMPLATE = {
    "Accept-Encoding": "gzip,compress,br,deflate",
    "content-type": "application/json",
    "Connection": "keep-alive",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.62 NetType/WIFI Language/zh_CN",
    "x-app-no": "1",
    "x-app-id": "wx8cae13c0597b7065"
}

SLEEP = float(os.getenv("VIDEO_SLEEP", "31"))

# 红包模式
# 1 = 每个账号执行完立即领取
# 2 = 所有账号执行完统一并发领取
RED_MODE = int(os.getenv("RED_MODE", "1"))

RED_JOBS = []


def req(session, url, headers, data):
    r = session.post(url, headers=headers, json=data, timeout=15)
    try:
        return r.status_code, r.text, r.json()
    except:
        return r.status_code, r.text, None


def do_red(idx, token, param, train_lesson_id):

    session = requests.Session()
    headers = HEADERS_TEMPLATE.copy()
    headers["token"] = token

    st, tx, js = req(session, URL_RED, headers, {
        "param": param,
        "type": 1,
        "train_lesson_id": train_lesson_id
    })

    print(f"[{idx}] 领取红包：{tx}")


def run_account(idx, token, param):

    print(f"\n===== [账号 {idx}] 开始执行 =====")

    session = requests.Session()
    headers = HEADERS_TEMPLATE.copy()
    headers["token"] = token

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

    # 3. 视频进度
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

        if js and js.get("data", {}).get("finished") == True:
            print(f"[{idx}] 视频完成 finished=True")
            break

        progress += 30
        time.sleep(SLEEP)

    # 4. 自动答题
    if question_id and options:

        print(f"[{idx}] 开始自动答题")

        answer_dict = {}

        for i, q in enumerate(question_list, 1):

            qid = str(q["question_id"])
            title = q.get("question_title", "")

            print(f"[{idx}] 第{i}题: {title}")

            try:
                opts = json.loads(q["question_option_json"])
            except:
                continue

            correct = None

            for opt in opts:
                if opt.get("answer_checked") == "1":
                    correct = opt["option"]
                    break

            if correct:
                print(f"[{idx}] 正确答案: {correct}")
                answer_dict[qid] = correct
            else:
                if opts:
                    guess = opts[0]["option"]
                    print(f"[{idx}] 未标正确答案默认选: {guess}")
                    answer_dict[qid] = guess

        if answer_dict:

            st, tx, js = req(session, URL_ANSWER, headers, {
                "type": 2,
                "param": param,
                "answer": answer_dict,
                "train_lesson_id": train_lesson_id
            })

            print(f"[{idx}] 答题结果：{tx}")

    else:
        print(f"[{idx}] 没有题目")

    # 红包逻辑
    if RED_MODE == 1:

        print(f"[{idx}] 立即领取红包")
        do_red(idx, token, param, train_lesson_id)

    else:

        RED_JOBS.append({
            "idx": idx,
            "token": token,
            "param": param,
            "train_lesson_id": train_lesson_id
        })

    print(f"[{idx}] 账号执行完毕\n")


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

    for i, (tok, par) in enumerate(accounts, 1):
        run_account(i, tok, par)

    # 统一领取红包
    if RED_MODE == 2 and RED_JOBS:

        print("\n=========== 开始并发领取红包 ===========\n")

        with ThreadPoolExecutor(max_workers=len(RED_JOBS)) as exe:

            futures = [
                exe.submit(do_red, job["idx"], job["token"], job["param"], job["train_lesson_id"])
                for job in RED_JOBS
            ]

            for f in as_completed(futures):
                pass

    print("\n=========== 全部任务完成 ===========\n")


if __name__ == "__main__":
    main()
