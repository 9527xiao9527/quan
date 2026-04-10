#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
青龙面板脚本 - ppzyck 答题
环境变量 ppzyck: state#seeId#openId，多账号换行分隔
逻辑：按账号顺序轮流尝试 A/B/C/D，找到正确答案后所有账号用正确答案补答
"""

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
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70(0x18004634) NetType/WIFI Language/zh_CN",
    "X-Fingerprint": "[object Object]"
}
OPTIONS = ["A", "B", "C", "D"]


def parse_accounts():
    raw = os.environ.get("ppzyck", "").strip()
    if not raw:
        print("❌ 未找到环境变量 ppzyck")
        return []
    accounts = []
    for i, line in enumerate(raw.splitlines()):
        line = line.strip()
        if not line:
            continue
        parts = line.split("#")
        if len(parts) != 3:
            print(f"⚠️  第{i+1}个账号格式错误，跳过: {line}")
            continue
        state, see_id, open_id = parts
        accounts.append({"index": i + 1, "state": state, "seeId": see_id, "openId": open_id})
    return accounts


def get_details(account):
    url = f"{BASE_URL}/api/live/watch/details?version=v&appVer=1.0.6"
    body = {"openId": account["openId"], "state": account["state"], "seeId": account["seeId"]}
    try:
        r = requests.post(url, headers=HEADERS, json=body, timeout=15)
        data = r.json()
        if data.get("code") == 200:
            return data["data"]
        print(f"  获取详情失败: {data}")
    except Exception as e:
        print(f"  获取详情异常: {e}")
    return None


def send_duration_once(account, duration):
    url = f"{BASE_URL}/api/live/watch/inspect?version=v"
    body = {
        "openId": account["openId"],
        "state": account["state"],
        "seeId": account["seeId"],
        "duration": duration
    }
    try:
        r = requests.post(url, headers=HEADERS, json=body, timeout=15)
        data = r.json()
        print(f"  传时间({duration}s): {data.get('msg', data)}")
        return data.get("code") == 200
    except Exception as e:
        print(f"  传时间失败: {e}")
        return False


def simulate_watch(account, start_duration, watch_duration):
    """
    模拟观看进度上报：
    - 从 start_duration 开始，每隔30秒发一次，每次+30
    - 直到 duration > watch_duration + 380
    """
    target = watch_duration + 380
    duration = start_duration
    print(f"  开始模拟观看: 当前={duration}s, 目标>{target}s")
    while duration <= target:
        send_duration_once(account, duration)
        duration += 30
        if duration <= target:
            time.sleep(30)
    print(f"  ✅ 观看时长已达标 (最终={duration - 30}s)")


def do_answer(account, eve_id, answers_payload):
    """
    answers_payload: [{"queId": xxx, "ans": ["X"]}, ...]
    返回 (pass: bool, result: dict)
    """
    url = f"{BASE_URL}/api/live/watch/interactive?version=v"
    body = {
        "answers": answers_payload,
        "openId": account["openId"],
        "eveId": eve_id,
        "state": account["state"],
        "seeId": account["seeId"]
    }
    try:
        r = requests.post(url, headers=HEADERS, json=body, timeout=15)
        data = r.json()
        if data.get("code") == 200:
            result = data["data"]
            passed = result.get("pass", False)
            ans_str = ", ".join(f"{a['queId']}:{a['ans']}" for a in answers_payload)
            print(f"  答题 [{ans_str}] -> pass={passed}")
            return passed, result
        else:
            print(f"  答题响应异常: {data}")
    except Exception as e:
        print(f"  答题请求失败: {e}")
    return False, None


def get_answered_options(details, que_id):
    """从详情的 answerList 中提取该题已答过的选项"""
    answered = []
    for item in details.get("answerList", []):
        if item.get("queId") == que_id:
            answered.extend(item.get("ans", []))
    return list(set(answered))


def main():
    accounts = parse_accounts()
    if not accounts:
        return
    print(f"✅ 共读取到 {len(accounts)} 个账号\n")

    # 每个账号独立获取详情
    account_details = {}
    for account in accounts:
        print(f"[账号{account['index']}] 获取题目详情...")
        details = get_details(account)
        if not details:
            print(f"  ❌ 获取失败，跳过此账号")
            continue
        account_details[account["index"]] = details

    if not account_details:
        print("❌ 所有账号获取详情失败")
        return

    # 并发模拟观看，全部完成后再答题
    print("\n开始并发模拟观看...\n")
    threads = []
    for account in accounts:
        details = account_details.get(account["index"])
        if not details:
            continue
        start_dur = details.get("duration", 0)
        watch_dur = details.get("watchDuration", 1800)
        t = threading.Thread(
            target=simulate_watch,
            args=(account, start_dur, watch_dur),
            daemon=True
        )
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    print("\n✅ 所有账号观看时长已达标，开始答题\n")

    # 取第一个成功的账号的题目信息作为基准
    first_details = next(iter(account_details.values()))
    questions = first_details.get("questions", [])
    eve_id = first_details.get("eveId")

    if not questions:
        print("❌ 没有题目")
        return

    print(f"\neveId={eve_id}")
    for q in questions:
        print(f"题目[{q['id']}]: {q['question']}")
        for k, v in sorted(q.get("option", {}).items()):
            print(f"  {k}: {v}")
    print()

    # 每道题独立找正确答案
    # correct_answers: {que_id: option}
    correct_answers = {}

    for question in questions:
        que_id = question["id"]
        print(f"\n--- 处理题目 {que_id}: {question['question']} ---")

        # 已知正确答案则跳过试错
        if que_id in correct_answers:
            continue

        # 按账号顺序试错，每个账号跳过已答过的选项
        # 维护一个全局"已试过"的选项列表（跨账号共享，避免重复）
        tried_options = []

        for account in accounts:
            if que_id in correct_answers:
                break

            details = account_details.get(account["index"])
            if not details:
                continue

            # 该账号已答过的选项
            already_answered = get_answered_options(details, que_id)
            ans_max = details.get("answerMax", 2)
            remaining = ans_max - len(already_answered)

            print(f"\n[账号{account['index']}] 已答: {already_answered}, 剩余次数: {remaining}")

            if remaining <= 0:
                print(f"  答题次数已用完，跳过")
                # 但如果已答中有 suc=true 的，说明答对了
                for item in details.get("answerList", []):
                    if item.get("queId") == que_id and item.get("suc"):
                        correct_answers[que_id] = item["ans"][0]
                        print(f"  ✅ 从历史记录发现正确答案: {correct_answers[que_id]}")
                continue

            # 选一个没试过且没答过的选项
            option_to_try = None
            for opt in OPTIONS:
                if opt not in tried_options and opt not in already_answered:
                    option_to_try = opt
                    break

            if option_to_try is None:
                print(f"  没有可用选项了，跳过")
                continue

            tried_options.append(option_to_try)
            time.sleep(1)
            passed, result = do_answer(account, eve_id, [{"queId": que_id, "ans": [option_to_try]}])

            if passed:
                correct_answers[que_id] = option_to_try
                print(f"  🎉 正确答案是 {option_to_try}")
            elif result:
                # 从返回的 answerList 里看 suc 字段
                for item in result.get("answerList", []):
                    if item.get("queId") == que_id and item.get("suc"):
                        correct_answers[que_id] = item["ans"][0]
                        print(f"  🎉 从响应发现正确答案: {correct_answers[que_id]}")

    print(f"\n\n{'='*40}")
    print(f"✅ 找到的正确答案: {correct_answers}")
    print(f"{'='*40}\n")

    if not correct_answers:
        print("❌ 未能找到任何正确答案")
        return

    # 所有账号用正确答案补答未答对的题
    print("开始让所有账号补答正确答案...\n")
    for account in accounts:
        details = account_details.get(account["index"])
        if not details:
            continue

        # 找出该账号还没答对的题
        need_answer = []
        for question in questions:
            que_id = question["id"]
            correct_opt = correct_answers.get(que_id)
            if not correct_opt:
                continue
            # 检查是否已经答对过
            already_correct = any(
                item.get("queId") == que_id and item.get("suc")
                for item in details.get("answerList", [])
            )
            if already_correct:
                continue
            # 检查剩余次数
            already_answered = get_answered_options(details, que_id)
            ans_max = details.get("answerMax", 2)
            if len(already_answered) >= ans_max:
                print(f"[账号{account['index']}] 题目{que_id} 次数已用完，无法补答")
                continue
            need_answer.append({"queId": que_id, "ans": [correct_opt]})

        if not need_answer:
            print(f"[账号{account['index']}] 无需补答")
            continue

        print(f"[账号{account['index']}] 补答: {need_answer}")
        time.sleep(1)
        do_answer(account, eve_id, need_answer)

    print("\n🏁 全部完成")


if __name__ == "__main__":
    main()
