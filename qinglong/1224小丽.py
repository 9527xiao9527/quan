import requests
import json
import time

# ========== 配置 ==========
WECHAT_LOADER_API = "http://192.168.1.8:8011"  # wechatLoader 服务地址

# 每行格式: wxid#备注  （备注可选）
WXID_LIST_RAW = """
wxid1#大号
wxid2#小号
"""

def parse_wxid_list(raw: str):
    result = []
    for line in raw.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split("#", 1)
        wxid = parts[0].strip()
        remark = parts[1].strip() if len(parts) > 1 else wxid
        result.append((wxid, remark))
    return result

APPID = "wx3cc740d5f90d5c0c"
DOMAIN = "jn1.kunyt10.site"
SYSTEM_ID = 2
BASE_URL = "https://xzyy.realyco.cn"
ORIGIN = f"https://{DOMAIN}"

session = requests.Session()
session.headers.update({
    "Content-Type": "application/json",
    "Origin": ORIGIN,
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70(0x18004635) NetType/WIFI Language/zh_CN",
})


def log(step, data):
    print(f"\n[{step}] {json.dumps(data, ensure_ascii=False, indent=2)}")


# ========== Step 1: 获取 OAuth URL ==========
def get_oauth_url(s):
    r = s.get(f"{BASE_URL}/wcm-u/v1/getCodeByDomain", params={
        "authUrl": f"{DOMAIN}/index.html",
        "domain": DOMAIN,
        "system_id": SYSTEM_ID,
    })
    data = r.json()
    log("Step1 getCodeByDomain", data)
    assert data["status_code"] == 200, f"getCodeByDomain 失败: {data}"
    return data["data"]["url"]


# ========== Step 2: 用 wechatLoader 完成 OAuth 授权拿 code ==========
def get_code(oauth_url, wxid):
    # 用 thrid/app/grant 模拟微信内置浏览器完成 H5 OAuth 授权
    r = requests.post(f"{WECHAT_LOADER_API}/api/v1/wx/tools/thrid/app/grant", json={
        "wxid": wxid,
        "appid": APPID,
        "url": oauth_url,
    })
    data = r.json()
    log("Step2 thrid/app/grant", data)

    # Data 直接就是 code 字符串
    code = data.get("Data") if isinstance(data.get("Data"), str) else None
    assert code, f"未拿到 code，返回: {data}"
    return code


# ========== Step 3: 用 code 换取用户信息 ==========
def get_user_info(s, code):
    r = s.get(f"{BASE_URL}/wcm-u/v1/getUserInfo", params={
        "code": code,
        "domain": DOMAIN,
        "system_id": SYSTEM_ID,
    })
    data = r.json()
    log("Step3 getUserInfo", data)
    assert data["status_code"] == 200, f"getUserInfo 失败: {data}"
    return data["data"]  # openid, unionid, ac_id, userRelation, identification, nickname...


# ========== Step 4: 获取 token ==========
def get_token(s, user_info):
    r = s.post(f"{BASE_URL}/wcm-u/v1/getToken2", json={
        "wx_openid": user_info["openid"],
        "wx_unionid": user_info["unionid"],
        "id": user_info["ac_id"],
        "userRelation": user_info.get("userRelation", 0),
    })
    data = r.json()
    log("Step4 getToken2", data)
    assert data["status_code"] == 200, f"getToken2 失败: {data}"
    token = data["data"]["token"]
    s.headers.update({"Authorization": f"Bearer {token}"})
    return token, data["data"]["uid"]


# ========== Step 5: 获取活动详情（含题目和答案）==========
def get_activity_detail(s, user_info):
    r = s.get(f"{BASE_URL}/wcm-u/v1/activityDetatil", params={
        "id": user_info["ac_id"],
        "withMaterial": 1,
    })
    data = r.json()
    log("Step5 activityDetatil", {"status_code": data["status_code"], "title": data["data"].get("title")})
    assert data["status_code"] == 200, f"activityDetatil 失败: {data}"
    return data


# ========== Step 6: 上报观看进度 ==========
def watch_video(s, user_activity_id, video_seconds):
    r = s.post(f"{BASE_URL}/wcm-u/v1/activityWatchVideo", json={
        "userActivityId": user_activity_id,
        "second": video_seconds,
    })
    data = r.json()
    log("Step6 activityWatchVideo", data)
    return data


# ========== Step 7: 上报观看完成 ==========
def watch_video_over(s, user_activity_id):
    r = s.post(f"{BASE_URL}/wcm-u/v1/activityWatchVideoOver", json={
        "userActivityId": user_activity_id,
    })
    data = r.json()
    log("Step7 activityWatchVideoOver", data)
    return data


# ========== Step 8: 提交答题并领奖 ==========
def submit_answers(s, ac_id, questions):
    """从题目数据中自动提取正确答案（result=="1"）"""
    answers = []
    for q_idx, q in enumerate(questions):
        for a_idx, a in enumerate(q["answer"]):
            if a["result"] == "1":
                answers.append(f"{q_idx}_{a_idx}")
                break

    r = s.post(f"{BASE_URL}/wcm-u/v1/receiveAwardAndWatchOver", json={
        "ac_id": ac_id,
        "answers": answers,
    })
    data = r.json()
    log("Step8 receiveAwardAndWatchOver", data)
    return data


# ========== 单账号流程 ==========
def run_one(wxid, remark):
    print(f"\n{'='*50}")
    print(f">>> 开始处理: {remark} ({wxid})")
    print(f"{'='*50}")
    try:
        # 每个账号用独立 session
        acct_session = requests.Session()
        acct_session.headers.update({
            "Content-Type": "application/json",
            "Origin": ORIGIN,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.70(0x18004635) NetType/WIFI Language/zh_CN",
        })

        # Step 1-2: OAuth 拿 code
        oauth_url = get_oauth_url(acct_session)
        code = get_code(oauth_url, wxid)

        # Step 3: 换用户信息
        user_info = get_user_info(acct_session, code)

        # Step 4: 拿 token
        token, uid = get_token(acct_session, user_info)
        print(f">>> token: {token}, uid: {uid}")

        # Step 5: 拿活动详情
        detail = get_activity_detail(acct_session, user_info)
        activity_data = detail["data"]
        join_info = detail.get("meta", {}).get("joinInfo", {})

        ac_id = activity_data["activity_id"]
        user_activity_id = join_info.get("userActivityId")
        video_seconds = int(float(activity_data["materialDetail"]["media"]["v_time"]))
        questions = activity_data["materialDetail"]["questions"]

        print(f">>> 活动: {activity_data['title']}, userActivityId: {user_activity_id}, 视频时长: {video_seconds}s")

        # Step 6-7: 上报观看
        watch_video(acct_session, user_activity_id, video_seconds)
        watch_video_over(acct_session, user_activity_id)

        # Step 8: 提交答案领奖
        result = submit_answers(acct_session, ac_id, questions)

        if result.get("status_code") == 200:
            print(f">>> [{remark}] 答题成功，已领奖！")
        elif result.get("status_code") == 417:
            print(f">>> [{remark}] {result.get('message')}（已参与过）")
        else:
            print(f">>> [{remark}] 结果: {result}")

    except Exception as e:
        print(f">>> [{remark}] 出错: {e}")


# ========== 主流程 ==========
def main():
    wxid_list = parse_wxid_list(WXID_LIST_RAW)
    print(f"共 {len(wxid_list)} 个账号")
    for wxid, remark in wxid_list:
        run_one(wxid, remark)
        time.sleep(1)  # 避免请求过快


if __name__ == "__main__":
    main()
