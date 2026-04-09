 #!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import base64
import requests
from datetime import datetime, timedelta

# ========= 配置 =========
RETRY = 3
TIMEOUT = 10

# ========= 工具 =========

def fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def safe_json(resp):
    try:
        data = resp.json()
        return data if isinstance(data, dict) else {}
    except:
        return {}

def parse_jwt(token):
    try:
        payload = token.replace("Bearer ", "").split(".")[1]
        payload += '=' * (-len(payload) % 4)
        return json.loads(base64.b64decode(payload).decode())
    except:
        return {}

def request(session, method, url, **kwargs):
    for i in range(RETRY):
        try:
            resp = session.request(method, url, timeout=TIMEOUT, **kwargs)
            if resp.status_code == 200:
                return resp
            else:
                print(f"⚠️ 状态码异常 {resp.status_code}")
        except Exception as e:
            print(f"⚠️ 请求异常: {e}")
        time.sleep(1)
    return None

# ========= 核心 =========

def run_one(account, idx):

    print(f"\n==== 第 {idx} 个账号 ====")

    if "#" not in account:
        print("❌ 参数错误")
        return

    detailUrl, authorization = account.split("#", 1)

    # ========= 解析URL =========
    try:
        from urllib.parse import urlparse, parse_qs
        u = urlparse(detailUrl)
        q = parse_qs(u.query)

        hostname = u.hostname
        courseId = int(q.get("id", [0])[0])
        encryptId = int(q.get("encryptId", [0])[0])
        adminUserId = q.get("adminUserId", ["9286"])[0]

    except Exception as e:
        print("❌ URL解析失败:", e)
        return

    # ========= session =========
    session = requests.Session()
    session.headers.update({
        "Authorization": authorization,
        "version": "2.9.5",
        "content-type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://servicewechat.com/",
    })

    # ========= 1. 获取详情 =========
    resp = request(session, "GET", detailUrl)
    if not resp:
        print("❌ 获取课程失败")
        return

    res = safe_json(resp)
    if not res.get("data"):
        print("❌ 课程返回异常:", resp.text[:200])
        return

    d = res["data"]

    if d.get("isCompletedCourse"):
        print(f"✅ 已完成: {d.get('title')}")
        return

    print(f"📘 课程: {d.get('title')}")

    videoId = d.get("videoId")
    duration = d.get("duration", 95)
    questionDetail = d.get("questionDetail")
    courseSeriesId = d.get("courseSeriesId")
    orgId = d.get("orgId")

    # ========= userId =========
    jwt_data = parse_jwt(authorization)
    userId = jwt_data.get("Id")

    if not userId:
        print("❌ token失效")
        return

    # ========= 找答案 =========
    answerIndex = 0
    try:
        if questionDetail and questionDetail.get("options"):
            opts = questionDetail["options"]
            if isinstance(opts, str):
                opts = json.loads(opts)

            for i, o in enumerate(opts):
                if o.get("answer") is True:
                    answerIndex = i
                    break
    except Exception as e:
        print("⚠️ 解析答案失败:", e)

    print(f"🧠 答案索引: {answerIndex}")

    # ========= 时间 =========
    now = datetime.now()
    needViewTime = duration + 10

    playLogBase = {
        "courseSeriesId": courseSeriesId,
        "courseId": courseId,
        "userId": userId,
        "videoId": videoId,
        "orgId": orgId,
        "isCollectedRedPacket": 0,
        "packetsAmount": 0,
        "sumViewTime": needViewTime,
        "lastViewTime": fmt(now - timedelta(seconds=5)),
        "firstViewTime": fmt(now - timedelta(seconds=needViewTime + 60)),
        "viewTimes": 5,
        "currentPlayTime": str(needViewTime),
        "log": json.dumps({
            "deviceType": "phone",
            "deviceBrand": "iphone",
            "deviceModel": "iPhone",
            "osName": "ios",
            "osVersion": "15.4.1",
            "hostName": "WeChat",
            "hostVersion": "8.0.63",
        }),
        "source": "miniprogram",
    }

    # ========= 2. play_log =========
    request(
        session,
        "POST",
        f"https://{hostname}/consumer/course/play_log/create-course-user",
        json={**playLogBase, "isAnswered": 0, "courseCompletedTimes": 1}
    )

    # ========= 3. 答题 =========
    ansResp = request(
        session,
        "POST",
        f"https://{hostname}/consumer/course-video/answer",
        json={
            "answer": answerIndex,
            "id": courseId,
            "encryptId": encryptId,
            "source": "miniprogram"
        }
    )

    reward = ""
    if ansResp:
        ansRes = safe_json(ansResp)
        if ansRes.get("data"):
            reward = f"红包¥{ansRes['data'].get('amount')}"
    else:
        print("⚠️ 答题请求失败")

    # ========= 4. play_log =========
    request(
        session,
        "POST",
        f"https://{hostname}/consumer/course/play_log/create-course-user",
        json={
            **playLogBase,
            "isAnswered": 1,
            "sumViewTime": needViewTime + 20,
            "currentPlayTime": str(needViewTime + 20),
            "lastViewTime": fmt(datetime.now()),
        }
    )

    # ========= 5. 校验 =========
    checkResp = request(
        session,
        "GET",
        f"https://{hostname}/consumer/course-video/detail?id={courseId}&userPhone=0&viewPermission=1&adminUserId={adminUserId}&encryptId={encryptId}"
    )

    if not checkResp:
        print("⚠️ 校验失败")
        return

    checkRes = safe_json(checkResp)

    if checkRes.get("data", {}).get("isCompletedCourse"):
        print(f"🎉 完成成功: {d.get('title')} {reward}")
    else:
        print("⚠️ 未确认完成（可能延迟）")


# ========= 入口 =========

def main():
    env = os.getenv("xinlebo")
    if not env:
        print("❌ 未配置 xinlebo")
        return

    accounts = [x.strip() for x in env.split("\n") if x.strip()]

    print(f"🚀 共 {len(accounts)} 个账号")

    for i, acc in enumerate(accounts, 1):
        run_one(acc, i)
        time.sleep(1)


if __name__ == "__main__":
    main()
