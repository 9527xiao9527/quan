#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import time
import threading
import requests

BASE_URL = "https://mp.qbxfu.cn"

HEADERS = {
    "Accept-Encoding": "gzip,compress,br,deflate",
    "content-type": "application/json",
    "Connection": "keep-alive",
    "Referer": "https://servicewechat.com/wxea607ff94bea3279/8/page-frame.html",
    "Host": "mp.qbxfu.cn",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X)",
    "X-Fingerprint": "[object Object]"
}

OPTIONS = ["A", "B", "C", "D"]

# ✅ 手动答案（填 A/B/C/D，留空则自动试错）
answer = ""


def parse_accounts():
    raw = os.environ.get("ppzyck", "").strip()
    if not raw:
        print("❌ 未找到环境变量 ppzyck")
        return []
    accounts = []
    for i, line in enumerate(raw.splitlines()):
        parts = line.strip().split("#")
        if len(parts) != 3:
            print(f"⚠️ 格式错误: {line}")
            continue
        accounts.append({
            "index": i + 1,
            "state": parts[0],
            "seeId": parts[1],
            "openId": parts[2]
        })
    return accounts


def request_json(url, body):
    try:
        r = requests.post(url, headers=HEADERS, json=body, timeout=15)
        return r.json()
    except Exception as e:
        print("请求异常:", e)
        return {}


# 🔁 带重试的刷时长
def send_duration(account, duration, max_retry=2):
    url = f"{BASE_URL}/api/live/watch/inspect?version=v"
    body = {**account, "duration": duration}

    for attempt in range(max_retry + 1):
        try:
            r = requests.post(url, headers=HEADERS, json=body, timeout=15)
            data = r.json()

            if data.get("code") == 200:
                print(f"[账号{account['index']}] 时长{duration}s -> 成功")
                return True
            else:
                print(f"[账号{account['index']}] 时长{duration}s -> 失败: {data}")
        except Exception as e:
            print(f"[账号{account['index']}] 时长{duration}s -> 异常: {e}")

        if attempt < max_retry:
            print(f"  🔁 重试第 {attempt+1} 次...")
            time.sleep(2)

    print(f"[账号{account['index']}] ❌ 时长{duration}s 最终失败")
    return False


def get_details(account):
    url = f"{BASE_URL}/api/live/watch/details?version=v"
    return request_json(url, account).get("data")


def simulate_watch(account, start, total):
    target = total + 380
    cur = start
    print(f"[账号{account['index']}] 开始刷时长 {cur} -> {target}")

    while cur <= target:
        send_duration(account, cur)
        cur += 30
        if cur <= target:
            time.sleep(30)

    print(f"[账号{account['index']}] ✅ 时长完成")


def do_answer(account, eve_id, payload):
    url = f"{BASE_URL}/api/live/watch/interactive?version=v"
    body = {
        "answers": payload,
        "eveId": eve_id,
        **account
    }
    data = request_json(url, body)
    if data.get("code") == 200:
        return data["data"].get("pass"), data["data"]
    return False, None


def get_answered(details, qid):
    res = []
    for i in details.get("answerList", []):
        if i.get("queId") == qid:
            res += i.get("ans", [])
    return list(set(res))


def main():
    global answer

    if answer and answer not in OPTIONS:
        print("❌ answer 只能填 A/B/C/D")
        return

    accounts = parse_accounts()
    if not accounts:
        return

    print(f"✅ 共 {len(accounts)} 个账号\n")

    # ===== 获取详情 =====
    account_details = {}
    for acc in accounts:
        d = get_details(acc)
        if d:
            account_details[acc["index"]] = d

    if not account_details:
        print("❌ 全部获取详情失败")
        return

    # ===== 并发刷时长 =====
    print("\n⏳ 开始刷时长...\n")
    ts = []
    for acc in accounts:
        d = account_details.get(acc["index"])
        if not d:
            continue
        t = threading.Thread(
            target=simulate_watch,
            args=(acc, d.get("duration", 0), d.get("watchDuration", 1800))
        )
        ts.append(t)
        t.start()

    for t in ts:
        t.join()

    print("\n✅ 时长全部完成\n")

    first = next(iter(account_details.values()))
    questions = first.get("questions", [])
    eve_id = first.get("eveId")

    correct_answers = {}

    # ===== 答题 =====
    for q in questions:
        qid = q["id"]
        print(f"\n--- 题目 {qid} ---")

        if answer:
            correct_answers[qid] = answer
            print(f"⚡ 使用统一答案: {answer}")
            continue

        for opt in OPTIONS:

            if qid in correct_answers:
                break

            print(f"\n>>> 尝试 {opt}")

            for acc in accounts:

                if qid in correct_answers:
                    break

                d = account_details.get(acc["index"])
                if not d:
                    continue

                answered = get_answered(d, qid)
                if opt in answered:
                    continue

                remain = d.get("answerMax", 2) - len(answered)
                if remain <= 0:
                    continue

                time.sleep(1)
                passed, result = do_answer(
                    acc,
                    eve_id,
                    [{"queId": qid, "ans": [opt]}]
                )

                print(f"[账号{acc['index']}] -> {opt} => {passed}")

                if passed:
                    correct_answers[qid] = opt
                    print(f"🎉 正确答案: {opt}")
                    break

                if result:
                    for i in result.get("answerList", []):
                        if i.get("queId") == qid and i.get("suc"):
                            correct_answers[qid] = i["ans"][0]
                            print(f"🎉 解析答案: {correct_answers[qid]}")
                            break

    print("\n✅ 最终答案:", correct_answers)

    # ===== 补答 =====
    print("\n🔁 开始补答\n")
    for acc in accounts:
        d = account_details.get(acc["index"])
        if not d:
            continue

        todo = []
        for q in questions:
            qid = q["id"]
            ans = correct_answers.get(qid)
            if not ans:
                continue

            ok = any(i.get("queId") == qid and i.get("suc") for i in d.get("answerList", []))
            if ok:
                continue

            if len(get_answered(d, qid)) >= d.get("answerMax", 2):
                continue

            todo.append({"queId": qid, "ans": [ans]})

        if not todo:
            print(f"[账号{acc['index']}] 无需补答")
            continue

        print(f"[账号{acc['index']}] 补答 {todo}")
        do_answer(acc, eve_id, todo)

    print("\n🏁 全部完成")


if __name__ == "__main__":
    main()
