#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import time

# ========== 多账号配置 ==========
# 填入多个 openid，用英文逗号分隔
OPENID_LIST = [
    "xxx",
    "xxx",
    "xxx",
    # 继续添加更多账号...
]

INTERVAL = 2
# ================================

BASE_URL = "https://api.xui45.cn"

UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Html5Plus/1.0 (Immersed/20) uni-app"

COMMON_HEADERS_BASE = {
    "Origin": "https://s.sdsjfd.com",
    "Referer": "https://s.sdsjfd.com/",
    "User-Agent": UA,
    "Content-Type": "application/json",
    "Accept": "application/json, text/javascript, */*; q=0.01"
}


def make_headers(token=None):
    h = COMMON_HEADERS_BASE.copy()
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def check_user(openid):
    url = f"{BASE_URL}/API/User/checkUser"
    resp = requests.post(url, json={"openid": openid}, headers=COMMON_HEADERS_BASE).json()
    token = resp["data"]["token"]
    print(f"获取Token成功: {token}")
    return token


def run_active(token):
    url = f"{BASE_URL}/API/user/RunActive"
    resp = requests.get(url, headers=make_headers(token)).json()
    return resp["data"]["arrayList"]


def join_active(token, openid, active_id):
    url = f"{BASE_URL}/API/User/joinActive"
    resp = requests.post(url, json={"openid": openid, "activeId": active_id}, headers=make_headers(token)).json()
    print(f"加入活动结果: {resp['data']}")


def home_data(token, active_id):
    url = f"{BASE_URL}/API/User/HomeData/{active_id}"
    resp = requests.get(url, headers=make_headers(token)).json()
    video = resp["data"]["videoInfo"]
    video_id = video["Id"]
    play_tm = int(video["VTM"])
    title = video["Title"]
    print(f"课程名称: {title}")
    print(f"视频ID: {video_id}")
    print(f"时长: {play_tm}")
    return video_id, play_tm


def finish_video(token, active_id, video_id, play_tm):
    url = f"{BASE_URL}/API/User/VideoPlay"
    resp = requests.post(
        url,
        json={"ActiveId": active_id, "VideoId": video_id, "PlayTM": play_tm, "IsFinshPlay": True},
        headers=make_headers(token)
    ).json()
    print(f"学习结果: {resp['data']}")


def process_account(openid):
    print(f"\n========== {openid} ==========")
    token = check_user(openid)
    active_list = run_active(token)

    if not active_list:
        print("暂无活动")
        return

    for active in active_list:
        active_id = active["activeId"]
        title = active["videoInfo"]["videoTitle"]
        question = active["_tilist"][0]["title"]
        answer = active["_tilist"][0]["needChoose"]
        did = active["_tilist"][0]["did"]
        print(f"活动ID: {active_id}")
        print(f"课程: {title}")
        print(f"题目: {question}")
        print(f"答案: {answer}")

        join_active(token, openid, active_id)
        video_id, play_tm = home_data(token, active_id)
        finish_video(token, active_id, video_id, play_tm)

    print("\n任务完成")


def main():
    if not OPENID_LIST:
        print("[!] OPENID_LIST 为空，请添加 openid")
        return

    for i, openid in enumerate(OPENID_LIST):
        print(f"\n========== 账号 {i+1}/{len(OPENID_LIST)} ==========")
        try:
            process_account(openid)
        except Exception as e:
            print(f"[!] 账号 {openid} 出错: {e}")

        if i < len(OPENID_LIST) - 1:
            time.sleep(INTERVAL)


if __name__ == "__main__":
    main()