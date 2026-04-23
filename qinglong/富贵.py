"""
mkjsy.com 课程自动完播 + 领取脚本
环境变量格式：mkjsy
  token#MANAGER_ID#SCHEDULE_ID
  多个账号换行分隔

"""

import os
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# ─────────────────────────── 配置区 ───────────────────────────
# 上报间隔（秒）
REPORT_INTERVAL = 2

# 每次上报推进的秒数
STEP_SECONDS = 2

# 最大重试次数
MAX_RETRY = 3

# 最大并发数
MAX_WORKERS = 5
# ──────────────────────────────────────────────────────────────

BASE_URL = "https://live.mkjsy.com"


def get_accounts():
    """从环境变量读取账号列表"""
    env = os.getenv("mkjsy", "").strip()
    if not env:
        print("❌ 未配置环境变量 mkjsy")
        return []
    
    accounts = []
    for line in env.split("\n"):
        line = line.strip()
        if not line or "#" not in line:
            continue
        parts = line.split("#")
        if len(parts) >= 3:
            accounts.append({
                "token": parts[0].strip(),
                "manager_id": parts[1].strip(),
                "schedule_id": parts[2].strip(),
            })
    return accounts


def create_session(token):
    """创建带认证的 session"""
    session = requests.Session()
    session.headers.update({
        "x-promopixis-platform": "miniprogram",
        "Authorization": f"Bearer {token}",
        "content-type": "application/json",
        "User-Agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Mobile/15E148 MicroMessenger/8.0.62(0x18003e3a) "
            "NetType/WIFI Language/zh_CN"
        ),
        "Referer": "https://servicewechat.com/wx815f08f2145f26db/2/page-frame.html",
        "Accept-Encoding": "gzip,compress,br,deflate",
    })
    return session


def step1_course_states(session, schedule_id):
    """上报课程状态"""
    url = f"{BASE_URL}/api/v1/app/schedules/course-states"
    payload = {"scheduleId": schedule_id}
    resp = session.post(url, json=payload, timeout=15)
    return resp.status_code == 200


def step2_course_play_state(session, manager_id, schedule_id):
    """获取播放状态"""
    url = f"{BASE_URL}/api/v1/app/schedules/course-play-state"
    params = {"managerId": manager_id, "scheduleId": schedule_id}
    resp = session.get(url, params=params, timeout=15)
    if resp.status_code == 200:
        data = resp.json()
        return {
            "video_duration": data.get("video", {}).get("duration", 0),
            "course_id": data.get("course", {}).get("id", ""),
            "current_position": data.get("state", {}).get("lastPosition", 0),
            "course_state_id": data.get("state", {}).get("id", ""),
            "schedule_course_id": data.get("scheduleCourse", {}).get("id", ""),
        }
    return None


def step3_report_progress(session, schedule_id, course_id, position, progress):
    """上报播放进度"""
    url = f"{BASE_URL}/api/v1/app/schedules/playback-progress"
    payload = {
        "scheduleId": schedule_id,
        "courseId": course_id,
        "position": position,
        "progress": round(progress, 6),
    }
    resp = session.post(url, json=payload, timeout=15)
    return resp.status_code == 200


def step4_request_rewards(session, schedule_id, course_state_id, schedule_course_id):
    """领取红包"""
    url = f"{BASE_URL}/api/v1/app/schedules/request-rewards"
    payload = {
        "scheduleId": schedule_id,
        "courseStateId": course_state_id,
        "scheduleCourseId": schedule_course_id,
    }
    resp = session.post(url, json=payload, timeout=15)
    return resp.status_code == 200, resp.text[:200] if resp.status_code != 200 else ""


def run_account(account, index):
    """执行单账号任务"""
    token = account["token"]
    manager_id = account["manager_id"]
    schedule_id = account["schedule_id"]
    
    print(f"\n{'='*50}")
    print(f"[账号{index}] 开始执行")
    print(f"  scheduleId: {schedule_id}")
    print(f"{'='*50}")
    
    session = create_session(token)
    
    for retry in range(MAX_RETRY):
        try:
            # Step 1
            step1_course_states(session, schedule_id)
            time.sleep(1)
            
            # Step 2
            info = step2_course_play_state(session, manager_id, schedule_id)
            if not info or not info["video_duration"]:
                print(f"[账号{index}] ❌ 获取视频信息失败")
                if retry < MAX_RETRY - 1:
                    print(f"[账号{index}] 重试 {retry + 2}/{MAX_RETRY}...")
                    time.sleep(2)
                    continue
                return False
            
            video_duration = info["video_duration"]
            course_id = info["course_id"]
            course_state_id = info["course_state_id"]
            schedule_course_id = info["schedule_course_id"]
            
            print(f"[账号{index}] 视频时长: {video_duration}s")
            print(f"[账号{index}] 当前进度: {info['current_position']}s")
            
            time.sleep(1)
            
            # Step 3：模拟播放
            position = info["current_position"]
            while True:
                position = min(position + STEP_SECONDS, video_duration)
                progress = position / video_duration
                ok = step3_report_progress(session, schedule_id, course_id, position, progress)
                # progress=1.0 时返回 400 表示可以领取
                if progress >= 1.0 and not ok:
                    print(f"[账号{index}] ✅ 播放完成，可领取")
                    break
                if position >= video_duration:
                    break
                time.sleep(REPORT_INTERVAL)
            time.sleep(1)
            
            # Step 4：领取
            success, err = step4_request_rewards(session, schedule_id, course_state_id, schedule_course_id)
            if success:
                print(f"[账号{index}] 🎉 领取成功！")
                return True
            else:
                print(f"[账号{index}] ❌ 领取失败: {err}")
                if retry < MAX_RETRY - 1:
                    print(f"[账号{index}] 重试 {retry + 2}/{MAX_RETRY}...")
                    time.sleep(2)
                    continue
                return False
                
        except Exception as e:
            print(f"[账号{index}] ⚠ 异常: {e}")
            if retry < MAX_RETRY - 1:
                print(f"[账号{index}] 重试 {retry + 2}/{MAX_RETRY}...")
                time.sleep(2)
                continue
            print(f"[账号{index}] ❌ 重试次数已达上限，跳过")
            return False
    
    return False


def main():
    print("mkjsy 自动完播脚本启动（青龙版）")
    
    accounts = get_accounts()
    if not accounts:
        print("❌ 未找到有效账号")
        return
    
    print(f"共 {len(accounts)} 个账号")
    
    success_count = 0
    fail_count = 0
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(run_account, acc, i + 1): i + 1
            for i, acc in enumerate(accounts)
        }
        
        for future in as_completed(futures):
            idx = futures[future]
            try:
                if future.result():
                    success_count += 1
                else:
                    fail_count += 1
            except Exception as e:
                print(f"[账号{idx}] 执行异常: {e}")
                fail_count += 1
    
    print(f"\n{'='*50}")
    print(f"执行完成: 成功 {success_count}, 失败 {fail_count}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
