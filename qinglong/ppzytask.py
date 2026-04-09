import requests
import time
import os
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://mp.qbxfu.cn"
VERSION = "v"

HEADERS = {
    "Host": "mp.qbxfu.cn",
    "User-Agent": "Mozilla/5.0",
    "xweb_xhr": "1",
    "Content-Type": "application/json",
    "Accept": "*/*",
}

# 🔥 并发数（建议 3~5）
MAX_WORKERS = 5

# ✅ 环境变量
ppzy = os.getenv("ppzyck", "")

# ✅ 题库（自己补）
CORRECT_ANSWERS = {
    28825: "C"
}


def request_api(method: str, path: str, params: Dict = None, data: Dict = None) -> Dict:
    url = BASE_URL + path
    req_params = {"version": VERSION}
    if params:
        req_params.update(params)

    if method.upper() == "GET":
        resp = requests.get(url, params=req_params, headers=HEADERS, timeout=30)
    else:
        resp = requests.post(url, params=req_params, json=data, headers=HEADERS, timeout=30)

    resp.raise_for_status()
    return resp.json()


def get_video_details(openid, see_id, state):
    resp = request_api("POST", "/api/live/watch/details", data={
        "openId": openid,
        "seeId": see_id,
        "state": state
    })
    if resp.get("code") != 200:
        raise Exception(f"获取详情失败: {resp}")
    return resp["data"]


def report_progress(openid, see_id, state, duration):
    request_api("POST", "/api/live/watch/inspect", data={
        "openId": openid,
        "seeId": see_id,
        "state": state,
        "duration": duration
    })


def submit_answers(openid, see_id, state, eve_id, answers):
    resp = request_api("POST", "/api/live/watch/interactive", data={
        "openId": openid,
        "seeId": see_id,
        "state": state,
        "eveId": eve_id,
        "answers": answers
    })
    if resp.get("code") != 200:
        raise Exception(f"提交答案失败: {resp}")
    return resp["data"]


def process_account(account_line: str):
    parts = account_line.strip().split('#')

    if len(parts) != 3:
        return f"❌ 格式错误: {account_line}"

    # ✅ 新格式：state#seeId#openId
    state, see_id, openid = parts
    short_id = openid[:6]

    try:
        print(f"\n🚀 [{short_id}] 开始执行")

        # ===== 获取信息 =====
        video = get_video_details(openid, see_id, state)
        total = video.get("watchDuration", 0)
        eve_id = video.get("eveId", 0)
        questions = video.get("questions", [])

        print(f"[{short_id}] 视频时长: {total}s")

        if total <= 0:
            return f"[{short_id}] ❌ 时长异常"

        # ===== 模拟观看 =====
        step = 30
        current = 0
        start_time = time.time()

        while current < total:
            current += step
            if current > total:
                current = total

            report_progress(openid, see_id, state, current)

            elapsed = int(time.time() - start_time)
            print(f"[{short_id}] 进度: {current}/{total} (已过 {elapsed}s)")

            time.sleep(step)

        # ===== 超额上报 =====
        extra = total + 377
        report_progress(openid, see_id, state, extra)
        print(f"[{short_id}] 超额进度: {extra}")

        time.sleep(2)

        # ===== 答题 =====
        answers = []
        for q in questions:
            qid = q["id"]
            if qid not in CORRECT_ANSWERS:
                print(f"[{short_id}] ⚠️ 未配置答案: {qid}")
                continue

            answers.append({
                "queId": qid,
                "ans": [CORRECT_ANSWERS[qid]]
            })

        if not answers:
            return f"[{short_id}] ⚠️ 无答案可提交"

        result = submit_answers(openid, see_id, state, eve_id, answers)

        if result.get("pass"):
            return f"[{short_id}] ✅ 成功"
        else:
            return f"[{short_id}] ❌ 未通过"

    except Exception as e:
        return f"[{short_id}] ❌ 异常: {str(e)}"


def main():
    if not ppzy:
        print("❌ 未配置环境变量 ppzyck")
        return

    accounts = [x for x in ppzy.strip().split("\n") if x.strip()]

    print(f"📊 共 {len(accounts)} 个账号 | 并发 {MAX_WORKERS}")

    results = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(process_account, acc) for acc in accounts]

        for future in as_completed(futures):
            result = future.result()
            print(result)
            results.append(result)

    print("\n===== 执行完成 =====")
    for r in results:
        print(r)


if __name__ == "__main__":
    main()
