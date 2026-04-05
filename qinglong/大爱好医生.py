import os
import json
import time
import threading
import requests
from datetime import datetime

MAX_ATTEMPTS = 3000
SLEEP_BETWEEN_REQUESTS = 15  # ✅ 每个账号请求间隔 30 秒

def study_task(index, url, headers, body):
    print(f"\n====== 开始账号 {index + 1} 学习任务 ======")
    start_time = time.time()

    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 账号 {index + 1} 请求 {attempt}/{MAX_ATTEMPTS}")
        try:
            response = requests.post(url, headers=headers, json=body)
            response.raise_for_status()
            data = response.json()

            if data.get('code') == '1' and data.get('success'):
                study_data = data.get('data', {})
                before_actual = study_data.get('beforeActualStudyLength', 0)
                video_time = study_data.get('videoTime', 0)
                percent = before_actual / video_time * 100 if video_time else 0
                print(f"[账号 {index + 1}] 学习进度: {before_actual}/{video_time} 秒 ({percent:.1f}%)")

                if before_actual >= video_time:
                    used = int(time.time() - start_time)
                    print(f"[账号 {index + 1}] 🎉 学习完成！总耗时：{used} 秒")
                    break
            else:
                print(f"[账号 {index + 1}] 请求失败: {data.get('message', '未知错误')}")
        except Exception as e:
            print(f"[账号 {index + 1}] 异常: {e}")

        time.sleep(SLEEP_BETWEEN_REQUESTS)

    else:
        print(f"[账号 {index + 1}] ⚠️ 达到最大请求次数，可能未完成")

def main():
    env_data = os.getenv("dahys")
    if not env_data:
        print("❌ 未设置环境变量 dahys")
        return

    lines = [line.strip() for line in env_data.strip().splitlines() if line.strip()]
    threads = []

    for i, line in enumerate(lines):
        try:
            entry = json.loads(line)
            url = entry['url']
            headers = entry['headers']
            body = entry['body']
        except Exception as e:
            print(f"⚠️ 第 {i+1} 行格式错误，跳过：{e}")
            continue

        t = threading.Thread(target=study_task, args=(i, url, headers, body))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    print("\n✅ 所有账号学习任务结束")

if __name__ == "__main__":
    main()
