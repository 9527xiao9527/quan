// 从 prefs 中读取数据
let accountData = $prefs.valueForKey('account_data');

// 任务状态管理
let taskManager = {
    tasks: [],
    currentTaskIndex: 0,
    currentTime: 0,
    isProcessing: false,
    totalTasks: 0,
    completedTasks: 0,

    init: function (data) {
        if (!data) {
            $notify("没有任务数据", "请先执行获取参数脚本", "未找到任务数据");
            this.finish();
            return false;
        }

        this.tasks = data.split("\n");
        this.totalTasks = this.tasks.length;
        this.currentTaskIndex = 0;
        this.completedTasks = 0;
        return true;
    },

    start: function () {
        if (this.tasks.length === 0) {
            this.finish();
            return;
        }

        this.isProcessing = true;
        this.processNextTask();
    },

    processNextTask: function () {
        if (this.currentTaskIndex >= this.totalTasks) {
            this.completedTasks++;
            this.checkCompletion();
            return;
        }

        const task = this.tasks[this.currentTaskIndex];
        this.currentTaskIndex++;

        console.log(`开始处理任务 ${this.currentTaskIndex}/${this.totalTasks}`);

        // 解析任务参数
        const taskParts = task.split(",");
        const host = taskParts[0].split(":")[1].trim();
        const token = taskParts[1].split(":")[1].trim();
        const linkId = taskParts[2].split(":")[1].trim();
        const seconds = parseInt(taskParts[3].split(":")[1].trim(), 10);

        // 重置当前任务的计时
        this.currentTime = 300;

        // 执行任务
        this.sendRequest(host, token, linkId, seconds);
    },

    sendRequest: function (host, token, linkId, seconds) {
        if (this.currentTime >= seconds) {
            console.log(`任务 ${this.currentTaskIndex - 1}/${this.totalTasks} 完成`);
            $notify('任务完成', `已成功更新至 ${seconds} 秒`, `任务 ${this.currentTaskIndex - 1}/${this.totalTasks}`);
            this.processNextTask();
            return;
        }

        const time = this.currentTime;
        console.log(`发送请求: time=${time}s, linkId=${linkId}`);

        const url = `https://${host}/api/video/updateProgress`;
        const headers = {
            'Host': host,
            'Content-Type': 'application/json',
            'Origin': `https://${host}`,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323d) NetType/WIFI Language/zh_CN',
            'Referer': `https://${host}/m/`,
            'token': token
        };

        const requestBody = {
            "linkId": linkId,
            "time": time
        };

        $task.fetch({
            url: url,
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        }).then(response => {
            try {
                const data = JSON.parse(response.body);
                console.log(`请求响应: ${JSON.stringify(data)}`);

                if (data.code === 1) {
                    let nextTime = time + 300;
                    if (nextTime > seconds) {
                        nextTime = seconds;
                    }

                    this.currentTime = nextTime;

                    if (this.currentTime === seconds) {
                        console.log(`发送最后一次请求: ${this.currentTime}s`);
                        this.sendFinalRequest(host, token, linkId, seconds);
                    } else {
                        setTimeout(() => {
                            this.sendRequest(host, token, linkId, seconds);
                        }, 1000);
                    }
                } else {
                    $notify('请求失败', `time: ${time} 请求失败`, `错误码: ${data.code}`);
                    this.processNextTask();
                }
            } catch (error) {
                $notify('解析错误', `time: ${time} 响应解析失败`, `错误: ${error}`);
                this.processNextTask();
            }
        }).catch(error => {
            $notify('请求错误', `time: ${time} 请求失败`, `错误: ${error}`);
            this.processNextTask();
        });
    },

    sendFinalRequest: function (host, token, linkId, seconds) {
        console.log(`发送最终请求: linkId=${linkId}, time=${seconds}`);

        const url = `https://${host}/api/video/updateProgress`;
        const headers = {
            'Host': host,
            'Content-Type': 'application/json',
            'Origin': `https://${host}`,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800323d) NetType/WIFI Language/zh_CN',
            'Referer': `https://${host}/m/`,
            'token': token
        };

        const requestBody = {
            "linkId": linkId,
            "time": seconds
        };

        $task.fetch({
            url: url,
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        }).then(response => {
            try {
                const data = JSON.parse(response.body);
                console.log(`最终请求响应: ${JSON.stringify(data)}`);

                if (data.code === 1) {
                    $notify('任务完成', `已成功更新至 ${seconds} 秒`, `任务 ${this.currentTaskIndex - 1}/${this.totalTasks}`);
                    this.processNextTask();
                } else {
                    $notify('请求失败', `最终请求失败`, `错误码: ${data.code}`);
                    this.processNextTask();
                }
            } catch (error) {
                $notify('解析错误', `最终请求解析失败`, `错误: ${error}`);
                this.processNextTask();
            }
        }).catch(error => {
            $notify('请求错误', `最终请求失败`, `错误: ${error}`);
            this.processNextTask();
        });
    },

    checkCompletion: function () {
        if (this.completedTasks >= this.totalTasks) {
            console.log("所有任务已完成");
            this.finish();
        }
    },

    finish: function () {
        $prefs.setValueForKey("", "account_data");
        $notify("任务执行完毕", `共完成 ${this.totalTasks} 个任务`, "已清除任务数据");
        this.isProcessing = false;
        $done();
    }
};

if (taskManager.init(accountData)) {
    taskManager.start();
} else {
    $done();
}
