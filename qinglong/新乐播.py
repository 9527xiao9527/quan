#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import time
import base64
import requests
from datetime import datetime, timedelta

# ========= 工具函数 =========

def fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def parse_jwt(token):
    try:
        payload = token.replace("Bearer ", "").split(".")[1]
        payload += '=' * (-len(payload) % 4)
        return json.loads(base64.b64decode(payload).decode())
    except:
        return {}

def safe_json(resp):
    try:
        return resp.json()
    except:
        return {}

# ========= 主逻辑 =========

def run_one(account):

    if "#" not in account:
        print("❌ 参数错误:", account)
        return

    detailUrl, authorization = account.split("#", 1)

    try:
        from urllib.parse import urlparse, parse_qs
        url_obj = urlparse(detailUrl)
        query = parse_qs(url_obj.query)

        hostname = url_obj.hostname
        courseId = int(query.get("id", [0])[0])
        encryptId = int(query.get("encryptId", [0])[0])
        adminUserId = query.get("adminUserId", ["9286"])[0]
    except Exception as e:
        print("❌ URL解析失败:", e)
        return

    headers = {
        "Authorization": authorization,
        "version": "2.9.5",
        "content-type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://servicewechat.com/",
    }

    session = requests.Session()
    session.headers.update(headers)

    # ========= 1. 获取课程详情 =========
    try:
        resp = session.get(detailUrl)
        res = safe_json(resp)

        if not res or "data" not in res:
            print("❌ 获取课程失败:", resp.text)
            return

        d = res["data"]

        if d.get("isCompletedCourse"):
            print(f"✅ 已完成: {d.get('title')}")
            return

        videoId = d.get("videoId")
        duration = d.get("duration", 95)
        questionDetail = d.get("questionDetail")
        courseSeriesId = d.get("courseSeriesId")
        orgId = d.get("orgId")

    except Exception as e:
        print("❌ 详情异常:", e)
        return

    # ========= 解析 userId =========
    jwt_data = parse_jwt(authorization)
    userId = jwt_data.get("Id")

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
    except:
        pass

    # ========= 时间构造 =========
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

    try:
        # ========= 2. play_log =========
        session.post(
            f"https://{hostname}/consumer/course/play_log/create-course-user",
            json={**playLogBase, "isAnswered": 0, "courseCompletedTimes": 1}
        )

        # ========= 3. 答题 =========
        ansResp = session.post(
            f"https://{hostname}/consumer/course-video/answer",
            json={
                "answer": answerIndex,
                "id": courseId,
                "encryptId": encryptId,
                "source": "miniprogram"
            }
        )

        ansRes = safe_json(ansResp)
        reward = ""
        if ansRes.get("data"):
            reward = f"红包¥{ansRes['data'].get('amount')}"

        # ========= 4. play_log =========
        session.post(
            f"https://{hostname}/consumer/course/play_log/create-course-user",
            json={
                **playLogBase,
                "isAnswered": 1,
                "sumViewTime": needViewTime + 20,
                "currentPlayTime": str(needViewTime + 20),
                "lastViewTime": fmt(datetime.now()),
            }
        )

        # ========= 5. 验证 =========
        check = session.get(
            f"https://{hostname}/consumer/course-video/detail?id={courseId}&userPhone=0&viewPermission=1&adminUserId={adminUserId}&encryptId={encryptId}"
        )

        checkRes = safe_json(check)
        if checkRes.get("data", {}).get("isCompletedCourse"):
            print(f"✅ 完成: {d.get('title')} {reward}")
        else:
            print(f"⚠️ 未确认完成: {d.get('title')}")

    except Exception as e:
        print("❌ 执行异常:", e)


# ========= 入口 =========

def main():
    env = os.getenv("xinlebo")
    if not env:
        print("❌ 未配置 xinlebo")
        return

    accounts = [x.strip() for x in env.split("\n") if x.strip()]

    print(f"🚀 共 {len(accounts)} 个账号\n")

    for i, acc in enumerate(accounts, 1):
        print(f"==== 第 {i} 个账号 ====")
        run_one(acc)
        time.sleep(1)


if __name__ == "__main__":
    main()