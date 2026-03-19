(function() {
    // 核心黑科技：自动获取当前引入的脚本域名作为 API_BASE
    const scriptTag = document.currentScript;
    const API_BASE = scriptTag ? new URL(scriptTag.src).origin : ""; 

    // 生成或获取固定的客户 ID
    let userId = localStorage.getItem("cs_user_id");
    if (!userId) {
        userId = 'u_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("cs_user_id", userId);
    }

    // 注入 CSS 样式
    const style = document.createElement('style');
    style.innerHTML = `
        #cs-widget { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        #cs-toggle { background: #007bff; color: white; border: none; border-radius: 50%; width: 56px; height: 56px; font-size: 24px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; justify-content: center; align-items: center; transition: transform 0.2s; }
        #cs-toggle:hover { transform: scale(1.05); }
        #cs-panel { display: none; width: 340px; height: 500px; background: white; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; margin-bottom: 15px; border: 1px solid #eee; }
        #cs-header { background: #007bff; color: white; padding: 16px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        #cs-close { cursor: pointer; font-size: 22px; line-height: 1; }
        #cs-chat { flex: 1; padding: 16px; overflow-y: auto; background: #f9f9f9; display: flex; flex-direction: column; gap: 12px; }
        .cs-msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
        .cs-msg.user { align-self: flex-end; background: #007bff; color: white; border-bottom-right-radius: 4px; }
        .cs-msg.agent { align-self: flex-start; background: #e5e5ea; color: black; border-bottom-left-radius: 4px; }
        #cs-input-area { display: flex; padding: 12px; border-top: 1px solid #eee; background: white; align-items: center; }
        #cs-input { flex: 1; padding: 10px 15px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px; }
        #cs-input:focus { border-color: #007bff; }
        #cs-send { background: none; border: none; color: #007bff; font-weight: bold; margin-left: 10px; cursor: pointer; font-size: 14px; padding: 5px 10px; }
    `;
    document.head.appendChild(style);

    // 注入 HTML 结构
    const widgetHtml = `
        <div id="cs-panel">
            <div id="cs-header"><span>💬 在线客服</span><span id="cs-close">&times;</span></div>
            <div id="cs-chat"></div>
            <div id="cs-input-area">
                <input type="text" id="cs-input" placeholder="输入你想咨询的问题...">
                <button id="cs-send">发送</button>
            </div>
        </div>
        <button id="cs-toggle">💬</button>
    `;
    const container = document.createElement('div');
    container.id = 'cs-widget';
    container.innerHTML = widgetHtml;
    document.body.appendChild(container);

    // 绑定交互逻辑
    const panel = document.getElementById("cs-panel");
    const toggle = document.getElementById("cs-toggle");
    const close = document.getElementById("cs-close");
    const chat = document.getElementById("cs-chat");
    const input = document.getElementById("cs-input");
    const sendBtn = document.getElementById("cs-send");

    let isPolling = false;
    let historyLoaded = false;

    function appendMsg(text, sender) {
        const div = document.createElement("div");
        div.className = `cs-msg ${sender}`;
        div.innerText = text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    }

    async function loadHistory() {
        if (historyLoaded) return;
        try {
            const res = await fetch(`${API_BASE}/api/customer/history?userId=${userId}`);
            const data = await res.json();
            if (data.history && data.history.length > 0) {
                chat.innerHTML = '';
                data.history.forEach(msg => appendMsg(msg.content, msg.sender));
            }
            historyLoaded = true;
        } catch (e) { console.error("加载历史失败", e); }
    }

    async function startPolling() {
        if (isPolling) return;
        isPolling = true;
        while (isPolling) {
            try {
                const res = await fetch(`${API_BASE}/api/customer/get-reply?userId=${userId}`);
                if(res.ok) {
                    const data = await res.json();
                    if (data.replies && data.replies.length > 0) {
                        data.replies.forEach(msg => appendMsg(msg.content, 'agent'));
                    }
                }
            } catch (e) {}
            // 等待 3 秒再次拉取
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    toggle.onclick = () => { panel.style.display = 'flex'; toggle.style.display = 'none'; loadHistory(); startPolling(); };
    close.onclick = () => { panel.style.display = 'none'; toggle.style.display = 'flex'; isPolling = false; };

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        appendMsg(text, 'user');
        input.value = '';
        try {
            await fetch(`${API_BASE}/api/customer/send`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, content: text })
            });
        } catch (e) { console.error("发送失败", e); }
    }

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
})();
