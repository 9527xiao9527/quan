#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests

OPENID = "xxxx"

BASE_URL = "https://api.xui45.cn"

UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Html5Plus/1.0 (Immersed/20) uni-app"

session = requests.Session()

COMMON_HEADERS = {
    "Origin": "https://s.sdsjfd.com",
    "Referer": "https://s.sdsjfd.com/",
    "User-Agent": UA,
    "Content-Type": "application/json",
    "Accept": "application/json, text/javascript, */*; q=0.01"
}


def check_user():
    """获取token"""

    url = f"{BASE_URL}/API/User/checkUser"

    resp = session.post(
        url,
        json={
            "openid": OPENID
        },
        headers=COMMON_HEADERS
    ).json()

    token = resp["data"]["token"]

    print(f"获取Token成功: {token}")

    return token


def run_active(token):
    """获取活动"""

    headers = COMMON_HEADERS.copy()
    headers["Authorization"] = f"Bearer {token}"

    url = f"{BASE_URL}/API/user/RunActive"

    resp = session.get(url, headers=headers).json()

    active = resp["data"]["arrayList"][0]

    active_id = active["activeId"]

    video_id = active["videoInfo"]["Id"]

    title = active["videoInfo"]["videoTitle"]

    question = active["_tilist"][0]["title"]

    answer = active["_tilist"][0]["needChoose"]

    did = active["_tilist"][0]["did"]

    print(f"活动ID: {active_id}")
    print(f"课程: {title}")
    print(f"题目: {question}")
    print(f"答案: {answer}")

    return active_id, video_id, did, answer


def join_active(token, active_id):
    """加入活动"""

    headers = COMMON_HEADERS.copy()
    headers["Authorization"] = f"Bearer {token}"

    url = f"{BASE_URL}/API/User/joinActive"

    resp = session.post(
        url,
        json={
            "openid": OPENID,
            "activeId": active_id
        },
        headers=headers
    ).json()

    print(f"加入活动结果: {resp['data']}")


def home_data(token, active_id):
    """获取课程信息"""

    headers = COMMON_HEADERS.copy()
    headers["Authorization"] = f"Bearer {token}"

    url = f"{BASE_URL}/API/User/HomeData/{active_id}"

    resp = session.get(url, headers=headers).json()

    video = resp["data"]["videoInfo"]

    video_id = video["Id"]

    play_tm = int(video["VTM"])

    title = video["Title"]

    print(f"课程名称: {title}")
    print(f"视频ID: {video_id}")
    print(f"时长: {play_tm}")

    return video_id, play_tm


def finish_video(token, active_id, video_id, play_tm):
    """完成学习"""

    headers = COMMON_HEADERS.copy()
    headers["Authorization"] = f"Bearer {token}"

    url = f"{BASE_URL}/API/User/VideoPlay"

    payload = {
        "ActiveId": active_id,
        "VideoId": video_id,
        "PlayTM": play_tm,
        "IsFinshPlay": True
    }

    resp = session.post(
        url,
        json=payload,
        headers=headers
    ).json()

    print(f"学习结果: {resp['data']}")


def main():

    token = check_user()

    active_id, video_id, did, answer = run_active(token)

    join_active(token, active_id)

    video_id, play_tm = home_data(token, active_id)

    finish_video(
        token,
        active_id,
        video_id,
        play_tm
    )

    print("\n任务完成")


if __name__ == "__main__":
    main()