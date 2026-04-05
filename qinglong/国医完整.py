import os
import json
import requests
import time
import random
import string
import math
from urllib.parse import urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor

MAX_WORKERS = 100

# ========= 代理配置 =========
PROXY_API = ""
PROXY_TIMEOUT = 10
PROXY_RETRY = 5

# ========= 工具 =========

def random_seq():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16))

def get_base(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"

def get_appid(url):
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    return qs.get("appId", [""])[0]

def get_share_id(url):
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    return qs.get("shareKcUserId", ["0"])[0]

def get_sa(url):
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    return qs.get("sa", [""])[0]

def get_proxy():
    try:
        r = requests.get(PROXY_API, timeout=5)
        ip = r.text.strip()
        if ":" in ip:
            return {
                "http": f"http://{ip}",
                "https": f"http://{ip}"
            }
    except:
        pass
    return None

# ========= 红包领取 =========

def get_red_pack(base, headers, url, info, index):
    shareKcUserId = get_share_id(url)
    appId = get_appid(url)
    sa = get_sa(url)

    classId = info["id"]
    periodId = info["periodId"]
    sessionId = info["sessionId"]
    playedDuration = info["duration"]

    red_url = (
        f"{base}/xk/kc/client/class/red/pack?"
        f"sa={sa}&uuid=&classId={classId}"
        f"&periodId={periodId}"
        f"&sessionId={sessionId}"
        f"&playedDuration={playedDuration}"
        f"&playOver=1"
        f"&shareKcUserId={shareKcUserId}"
        f"&appId={appId}"
    )

    for attempt in range(1, PROXY_RETRY + 1):
        proxy = get_proxy()
        if not proxy:
            print(f"账号{index} 代理获取失败，尝试第 {attempt} 次重试...")
            time.sleep(1)
            continue

        try:
            headers["X-SeqId"] = random_seq()
            r = requests.get(red_url, headers=headers, proxies=proxy, timeout=PROXY_TIMEOUT)
            print(f"账号{index} 红包响应:", r.text)

            res_data = r.json()
            msg_text = res_data.get("info", {}).get("msg") or res_data.get("msg", "")

            if any(x in msg_text for x in ["已领取", "达到上限", "注意查收", "没有可领取", "没有绑定商户"]):
                return

            print(f"账号{index} 第{attempt}次失败: {msg_text}")

        except Exception as e:
            print(f"账号{index} 请求异常: {e}")

        time.sleep(1.5)

    print(f"账号{index} 红包任务结束")

# ========= 单账号 =========

def run_account(line, index):
    try:
        print(f"\n====== 账号{index} 开始 ======")

        if "#" not in line:
            print("格式错误，应为 url#header")
            return

        url, header_str = line.split("#", 1)
        headers = json.loads(header_str)

        base = get_base(url)
        appId = get_appid(url)
        sa = get_sa(url)

        headers["X-SeqId"] = random_seq()

        # ===== 获取 info =====
        r = requests.get(url, headers=headers)
        data = r.json()

        if not data.get("is_success"):
            print(f"账号{index} info失败")
            return

        info = data["info"]

        duration = info["duration"]
        latest = info["totalPlayedTime"]
        sessionId = info["sessionId"]
        classId = info["id"]
        periodId = info["periodId"]
        interval = info["intervalTime"]
        condition = info["classSettings"]["playOverCondition"]

        target = math.floor(duration * condition / 100)

        print(f"账号{index} 当前:{latest} 目标:{target}")

        totalPlayDuration = 0

        # ===== 刷进度 =====
        if latest < target:

            time.sleep(interval)

            while latest < target:
                latest += interval
                totalPlayDuration += interval

                if latest > target:
                    latest = target

                body = {
                    "action": "player:playing",
                    "classId": classId,
                    "sessionId": sessionId,
                    "periodId": periodId,
                    "playCount": 0,
                    "playOver": 1,
                    "curTime": latest,
                    "playDuration": interval,
                    "playedDuration": duration,
                    "totalPlayDuration": totalPlayDuration,
                    "startReport": 0,
                    "shareKcUserId": 0,
                    "appId": appId
                }

                headers["X-SeqId"] = random_seq()

                save_url = f"{base}/xk/kc/client/class/save/learn?sa={sa}&uuid="

                res = requests.post(save_url, headers=headers, json=body)
                print(f"账号{index} save响应:", res.text)

                print(f"账号{index} 进度 {latest}/{target}")

                if latest >= target:
                    break

                time.sleep(interval)

        else:
            print(f"账号{index} 已达标")

        # ===== 答题 =====
        print(f"账号{index} 开始答题")

        workAnswer = []
        for q in info["questions"]:
            correct = []
            title = q.get("creater") or q.get("questionTitle") or "未知题目"

            for opt in q["options"]:
                if opt["rightAnswer"] == 1:
                    correct.append(opt["option"])

            print(f"\n账号{index} 题目: {title}")
            print(f"账号{index} 答案: {correct}")

            workAnswer.append({
                "questionId": q["id"],
                "answer": correct
            })

        submit_body = {
            "classId": classId,
            "workAnswer": workAnswer,
            "sessionId": sessionId,
            "periodId": periodId,
            "playedDuration": duration,
            "shareKcUserId": 0,
            "appId": appId
        }

        headers["X-SeqId"] = random_seq()

        submit_url = f"{base}/xk/kc/client/class/submit/work?sa={sa}&uuid="

        r2 = requests.post(submit_url, headers=headers, json=submit_body)
        print(f"账号{index} 答题响应:", r2.text)

        # ===== 领红包 =====
        get_red_pack(base, headers, url, info, index)

        print(f"====== 账号{index} 完成 ======")

    except Exception as e:
        print(f"账号{index} 异常:", e)

# ========= 主入口 =========

if __name__ == "__main__":

    env = os.getenv("GY_INFO")
    if not env:
        raise Exception("未找到 GY_INFO")

    accounts = env.strip().splitlines()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        for i, line in enumerate(accounts, 1):
            executor.submit(run_account, line.strip(), i)
