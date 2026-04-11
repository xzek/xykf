(function() {
    // 1. 基础设置与 API 地址获取
    const scriptTag = document.currentScript;
    const API_BASE = scriptTag ? new URL(scriptTag.src).origin : "";
    let userId = localStorage.getItem("cs_user_id");
    if (userId && !/^\d+$/.test(userId)) {
        userId = null;
        localStorage.removeItem("cs_user_id");
    }

    // 2. 注入样式
    const style = document.createElement('style');
    style.innerHTML = `
        /* ===== Reset (Pro 增强隔离) ===== */
        #kefu-root, #kefu-root * { margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
        #kefu-root { font-family: -apple-system, system-ui, sans-serif !important; }
        /* ===== Floating Sidebar ===== */
        .kefu-sidebar {
            position: fixed !important;
            right: 20px !important;
            bottom: 115px !important;
            z-index: 2147483647 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            background: #fff !important;
            border-radius: 37px !important;
            padding: 12px 8px !important;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1) !important;
            gap: 12px !important;
        }
        .kefu-sidebar-icon {
            position: relative;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.25s ease;
            background: #f5f7fa;
            border: none;
        }
        .kefu-sidebar-icon:hover { transform: scale(1.1); }
        .kefu-sidebar-icon svg {
            width: 22px;
            height: 22px;
            fill: #555;
            transition: fill 0.25s;
        }
        .kefu-sidebar-icon:hover svg { fill: #57A2FE; }
        .kefu-sidebar-divider { width: 24px; height: 1px; background: #e0e0e0; }

        /* Tooltip */
        .kefu-tooltip {
            position: absolute;
            right: 56px;
            top: 50%;
            transform: translateY(-50%);
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
            padding: 12px 16px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
            font-size: 13px;
            color: #333;
            z-index: 10;
        }
        .kefu-tooltip::after {
            content: '';
            position: absolute;
            right: -6px;
            top: 50%;
            transform: translateY(-50%) rotate(45deg);
            width: 12px;
            height: 12px;
            background: #fff;
            box-shadow: 2px -2px 6px rgba(0,0,0,0.05);
        }
        .kefu-sidebar-icon:hover .kefu-tooltip { opacity: 1; pointer-events: auto; }

        /* Chat button */
        .kefu-chat-btn { background: linear-gradient(135deg, #D168AF, #57A2FE); }
        .kefu-chat-btn svg { fill: #fff; }
        .kefu-chat-btn::after {
            content: '';
            position: absolute;
            top: -2px;
            right: -2px;
            width: 14px;
            height: 14px;
            background: #22c55e;
            border-radius: 50%;
            border: 2px solid #fff;
            animation: kefu-pulse 2s infinite;
        }
        @keyframes kefu-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }

        /* Unread badge */
        .kefu-unread {
            display: none;
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ff3b30;
            color: #fff;
            font-size: 11px;
            font-weight: bold;
            min-width: 18px;
            height: 18px;
            line-height: 18px;
            border-radius: 9px;
            padding: 0 5px;
            text-align: center;
            border: 2px solid #fff;
        }

        /* ===== Chat Window ===== */
        .kefu-window {
            position: fixed;
            right: 90px;
            z-index: 2147483647 !important;
            display: none !important; /* 初始完全隐藏 */
            flex-direction: column !important;
            overflow: hidden !important;
        }
        .kefu-window.open {
            display: flex !important; /* 打开时才进入 flex 布局 */
            transform: scale(1) translateY(0) !important;
            opacity: 1 !important;
            pointer-events: auto !important;
        }

        /* Header */
        .kefu-header {
            background: linear-gradient(135deg, #D168AF, #57A2FE);
            padding: 20px 20px 16px;
            color: #fff;
            position: relative;
            flex-shrink: 0;
        }
        .kefu-header-top { display: flex; align-items: center; justify-content: space-between; }
        .kefu-header-info { display: flex; align-items: center; gap: 12px; }
        .kefu-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            backdrop-filter: blur(4px);
            overflow: hidden;
        }
        .kefu-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .kefu-header-text h3 { font-size: 16px; font-weight: 600; margin-bottom: 2px; }
        .kefu-header-text .kefu-status {
            font-size: 12px;
            opacity: 0.9;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .kefu-header-text .kefu-status::before {
            content: '';
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 50%;
            display: inline-block;
        }
        .kefu-header-id { font-size: 11px; opacity: 0.75; margin-top: 2px; }
        .kefu-close {
            width: 32px;
            height: 32px;
            border: none;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .kefu-close:hover { background: rgba(255,255,255,0.35); }
        .kefu-close svg { width: 16px; height: 16px; fill: #fff; }

        /* Welcome */
        .kefu-welcome {
            background: linear-gradient(135deg, rgba(209,104,175,0.08), rgba(87,162,254,0.08));
            margin: 0 16px;
            margin-top: 12px;
            border-radius: 12px;
            padding: 14px 16px;
            flex-shrink: 0;
        }
        .kefu-welcome p { font-size: 13px; color: #555; line-height: 1.6; }

        /* Quick Actions (FAQ) */
        .kefu-quick-actions {
            display: flex;
            gap: 8px;
            padding: 12px 16px;
            flex-shrink: 0;
            overflow-x: auto;
        }
        .kefu-quick-actions::-webkit-scrollbar { display: none; }
        .kefu-quick-btn {
            flex-shrink: 0;
            padding: 6px 14px;
            border-radius: 20px;
            border: 1px solid #e0e0e0;
            background: #fff;
            font-size: 13px;
            color: #555;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .kefu-quick-btn:hover {
            border-color: #57A2FE;
            color: #57A2FE;
            background: rgba(87,162,254,0.06);
        }

        /* Messages */
        .kefu-messages {
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            background: #f8f9fa !important;
        }
        .kefu-messages::-webkit-scrollbar { width: 4px; }
        .kefu-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

        .kefu-msg {
            display: flex !important;
            gap: 8px !important;
            max-width: 85% !important;
        }
        .kefu-msg.agent { align-self: flex-start !important; }
        .kefu-msg.user { align-self: flex-end !important; flex-direction: row-reverse !important; }

        .kefu-msg-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            overflow: hidden;
        }
        .kefu-msg.agent .kefu-msg-avatar { background: linear-gradient(135deg, #D168AF, #57A2FE); }
        .kefu-msg.user .kefu-msg-avatar { background: #e8e8e8; }
        .kefu-msg-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

        .kefu-msg-bubble {
            padding: 10px 14px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.6;
            word-break: break-word;
        }
        .kefu-msg.agent .kefu-msg-bubble {
            background: #fff;
            color: #333;
            border-top-left-radius: 4px;
            border: 1px solid #f0f0f0;
        }
        .kefu-msg.user .kefu-msg-bubble {
            background: linear-gradient(135deg, #D168AF, #57A2FE);
            color: #fff;
            border-top-right-radius: 4px;
        }
        .kefu-msg-bubble img {
            max-width: 100%;
            border-radius: 8px;
            cursor: pointer;
        }

        .kefu-msg-time {
            font-size: 11px;
            color: #aaa;
            margin-top: 4px;
            text-align: right;
        }
        .kefu-msg.agent .kefu-msg-time { text-align: left; }

        /* Time separator */
        .kefu-time-sep {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin: 4px 0;
            width: 100%;
            clear: both;
        }

        /* Typing indicator */
        .kefu-typing { display: flex; gap: 4px; padding: 4px 0; }
        .kefu-typing span {
            width: 8px;
            height: 8px;
            background: #ccc;
            border-radius: 50%;
            animation: kefu-typing 1.4s infinite;
        }
        .kefu-typing span:nth-child(2) { animation-delay: 0.2s; }
        .kefu-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes kefu-typing {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
        }

        /* Input area */
        .kefu-input-area {
            padding: 12px 16px;
            border-top: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
            background: #fff;
        }
        .kefu-upload-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
        }
        .kefu-upload-btn svg { width: 22px; height: 22px; fill: #764ba2; }
        .kefu-input {
            flex: 1;
            border: 1px solid #e8e8e8;
            border-radius: 24px;
            padding: 10px 16px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
            font-family: inherit;
            background: #f8f9fa;
        }
        .kefu-input:focus { border-color: #57A2FE; background: #fff; }
        .kefu-input::placeholder { color: #bbb; }
        .kefu-send {
            width: 40px;
            height: 40px;
            border: none;
            background: linear-gradient(135deg, #D168AF, #57A2FE);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
            flex-shrink: 0;
        }
        .kefu-send:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(87,162,254,0.4);
        }
        .kefu-send:active { transform: scale(0.95); }
        .kefu-send svg { width: 18px; height: 18px; fill: #fff; }

        /* Powered */
        .kefu-powered {
            text-align: center;
            font-size: 11px;
            color: #ccc;
            padding: 6px 0 8px;
            flex-shrink: 0;
        }

        /* ===== Responsive ===== */
        @media (max-width: 480px) {
            .kefu-window {
                right: 0;
                bottom: 0;
                width: 100%;
                height: 100%;
                border-radius: 0;
            }
            .kefu-sidebar {
                right: 12px;
                bottom: 80px;
            }
        }
    `;
    document.head.appendChild(style);

    // 3. 构建 HTML 结构
    const kefuHtml = `
        <div id="kefu-root">
            <!-- Floating Sidebar -->
            <div class="kefu-sidebar" id="kefuSidebar">
                <!-- Online Chat -->
                <button class="kefu-sidebar-icon kefu-chat-btn" id="kefuToggle" title="在线客服">
                    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
                    <div class="kefu-tooltip">💬 点击联系在线客服</div>
                    <span class="kefu-unread" id="kefuUnread">0</span>
                </button>

                <div class="kefu-sidebar-divider"></div>

                <!-- Email -->
                <button class="kefu-sidebar-icon" id="kefuEmail" title="邮件咨询">
                    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    <div class="kefu-tooltip" id="kefuEmailTooltip">📧 support@example.com<br><span style="color:#57A2FE;font-size:12px;">点击复制邮箱地址</span></div>
                </button>

                <!-- Telegram -->
                <button class="kefu-sidebar-icon" id="kefuTelegram" title="Telegram">
                    <svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                    <div class="kefu-tooltip" id="kefuTgTooltip">✈️ @SUPPORT<br><span style="color:#57A2FE;font-size:12px;">点击跳转Telegram</span></div>
                </button>

                <div class="kefu-sidebar-divider"></div>

                <!-- Back to Top -->
                <button class="kefu-sidebar-icon" id="kefuBackTop" title="返回顶部">
                    <svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
                    <div class="kefu-tooltip">⬆ 返回顶部</div>
                </button>
            </div>

            <!-- Chat Window -->
            <div class="kefu-window" id="kefuWindow">
                <!-- Header -->
                <div class="kefu-header">
                    <div class="kefu-header-top">
                        <div class="kefu-header-info">
                            <div class="kefu-avatar" id="kefuAgentAvatar">👩‍💼</div>
                            <div class="kefu-header-text">
                                <h3 id="kefuTitle">在线客服</h3>
                                <div class="kefu-status">在线 · 平均响应 &lt;1分钟</div>
                                <div class="kefu-header-id" id="kefuIdDisplay"></div>
                            </div>
                        </div>
                        <button class="kefu-close" id="kefuClose">
                            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Welcome -->
                <div class="kefu-welcome" id="kefuWelcome">
                    <p>👋 您好！欢迎来到我们的在线客服。请问有什么可以帮您的？选择下方快捷标签或直接输入问题。</p>
                </div>

                <!-- Quick Actions -->
                <div class="kefu-quick-actions" id="kefuQuickActions"></div>

                <!-- Messages -->
                <div class="kefu-messages" id="kefuMessages"></div>

                <!-- Input -->
                <div class="kefu-input-area">
                    <input type="file" id="kefuUploadInput" accept="image/*" style="display:none;">
                    <button class="kefu-upload-btn" id="kefuUploadBtn" title="发送图片">
                        <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    </button>
                    <input type="text" class="kefu-input" id="kefuInput" placeholder="输入您的问题..." autocomplete="off">
                    <button class="kefu-send" id="kefuSend">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>

                <div class="kefu-powered" id="kefuPowered">Powered by Customer Service ✨</div>
            </div>

            <audio id="kefuSound" src="${API_BASE}/files/preview.mp3" preload="auto"></audio>
        </div>
    `;
    const container = document.createElement('div');
    container.innerHTML = kefuHtml;
    document.body.appendChild(container);

    // 4. 核心逻辑
    const kefuWindow = document.getElementById("kefuWindow");
    const kefuToggle = document.getElementById("kefuToggle");
    const kefuClose = document.getElementById("kefuClose");
    const kefuInput = document.getElementById("kefuInput");
    const kefuSend = document.getElementById("kefuSend");
    const kefuMessages = document.getElementById("kefuMessages");
    const kefuUnread = document.getElementById("kefuUnread");
    const kefuIdDisplay = document.getElementById("kefuIdDisplay");
    const kefuTitle = document.getElementById("kefuTitle");
    const kefuWelcome = document.getElementById("kefuWelcome");
    const kefuQuickActions = document.getElementById("kefuQuickActions");
    const kefuAgentAvatar = document.getElementById("kefuAgentAvatar");
    const kefuPowered = document.getElementById("kefuPowered");
    const kefuEmailTooltip = document.getElementById("kefuEmailTooltip");
    const kefuTgTooltip = document.getElementById("kefuTgTooltip");
    const notifySound = document.getElementById("kefuSound");

    let unreadCount = 0;
    let isPolling = false;
    let historyLoaded = false;
    let lastMsgTime = 0;
    let widgetConfig = { agent_icon: '', user_icon: '' };

    function updateIdDisplay() {
        if (kefuIdDisplay && userId) {
            kefuIdDisplay.textContent = `[客户ID: ${userId}] 专属服务中`;
        }
    }
    updateIdDisplay();

    // ===== 加载配置 =====
    fetch(`${API_BASE}/api/customer/config`)
        .then(r => r.json())
        .then(data => {
            widgetConfig = data;

            // 更新标题
            if (data.title) kefuTitle.textContent = data.title;

            // 更新欢迎语
            if (data.welcome) {
                kefuWelcome.querySelector('p').textContent = data.welcome;
            }

            // 更新Powered
            if (data.powered_by) {
                kefuPowered.textContent = `Powered by ${data.powered_by}`;
            }

            // 更新邮箱
            if (data.email) {
                kefuEmailTooltip.innerHTML = `📧 ${data.email}<br><span style="color:#57A2FE;font-size:12px;">点击复制邮箱地址</span>`;
                document.getElementById("kefuEmail").onclick = () => {
                    navigator.clipboard.writeText(data.email).then(() => {
                        kefuEmailTooltip.innerHTML = `✅ 已复制！`;
                        setTimeout(() => {
                            kefuEmailTooltip.innerHTML = `📧 ${data.email}<br><span style="color:#57A2FE;font-size:12px;">点击复制邮箱地址</span>`;
                        }, 1500);
                    });
                };
            }

            // 更新Telegram
            if (data.telegram) {
                kefuTgTooltip.innerHTML = `✈️ ${data.telegram}<br><span style="color:#57A2FE;font-size:12px;">点击跳转Telegram</span>`;
                document.getElementById("kefuTelegram").onclick = () => {
                    window.open(`https://t.me/${data.telegram.replace('@', '')}`, '_blank');
                };
            }

            // 更新客服头像
            if (data.agent_icon) {
                kefuAgentAvatar.innerHTML = `<img src="${data.agent_icon}" alt="客服">`;
            }

            // 动态样式（位置/大小）
            if (data.pc_icon_pos || data.pc_icon_size || data.mobile_icon_pos || data.mobile_icon_size) {
                const dynamicStyle = document.createElement('style');
                dynamicStyle.innerHTML = `
                    .kefu-sidebar { ${data.pc_icon_pos || ''} }
                    ${data.pc_icon_size ? `.kefu-sidebar-icon { width: ${data.pc_icon_size}; height: ${data.pc_icon_size}; }` : ''}
                    @media (max-width: 480px) {
                        .kefu-sidebar { ${data.mobile_icon_pos || ''} }
                        ${data.mobile_icon_size ? `.kefu-sidebar-icon { width: ${data.mobile_icon_size}; height: ${data.mobile_icon_size}; }` : ''}
                    }
                `;
                document.head.appendChild(dynamicStyle);
            }

            // FAQ 快捷问题
            if (data.faq_list) {
                const lines = data.faq_list.split('\n').filter(l => l.includes('|'));
                if (lines.length > 0) {
                    kefuQuickActions.innerHTML = '';
                    lines.forEach(line => {
                        const parts = line.split('|');
                        const label = parts[0].trim();
                        const reply = parts[1] ? parts[1].trim() : label;
                        const btn = document.createElement("button");
                        btn.className = "kefu-quick-btn";
                        btn.textContent = label;
                        btn.onclick = () => {
                            appendMsg(label, 'user');
                            showTypingAndReply(reply);
                        };
                        kefuQuickActions.appendChild(btn);
                    });
                }
            }
        })
        .catch(e => { console.log("加载客服配置失败", e); });

    // ===== 消息渲染 =====
    function getTimeStr(date) {
        const d = date || new Date();
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }

    function appendMsg(text, sender, timeStr) {
        const d = timeStr ? new Date(timeStr.replace(' ', 'T') + 'Z') : new Date();
        const nowTime = d.getTime();

        // 超过5分钟显示时间分隔
        if (nowTime - lastMsgTime > 5 * 60 * 1000) {
            const timeDiv = document.createElement("div");
            timeDiv.className = "kefu-time-sep";
            timeDiv.textContent = d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            kefuMessages.appendChild(timeDiv);
            lastMsgTime = nowTime;
        }

        const row = document.createElement("div");
        row.className = `kefu-msg ${sender}`;

        const avatarDiv = document.createElement("div");
        avatarDiv.className = "kefu-msg-avatar";

        if (sender === 'agent') {
            if (widgetConfig.agent_icon) {
                avatarDiv.innerHTML = `<img src="${widgetConfig.agent_icon}" alt="">`;
            } else {
                avatarDiv.textContent = '👩‍💼';
            }
        } else {
            if (widgetConfig.user_icon) {
                avatarDiv.innerHTML = `<img src="${widgetConfig.user_icon}" alt="">`;
            } else {
                avatarDiv.textContent = '😊';
            }
        }

        const contentDiv = document.createElement("div");

        const bubbleDiv = document.createElement("div");
        bubbleDiv.className = "kefu-msg-bubble";

        // 图片消息
        if (text.startsWith("data:image/") || text.startsWith("IMG:")) {
            const imgSrc = text.startsWith("IMG:") ? text.substring(4) : text;
            bubbleDiv.innerHTML = `<img src="${imgSrc}" onclick="var w=window.open('');w.document.write('<img src=&quot;${imgSrc}&quot; style=&quot;max-width:100%;&quot;/>');w.document.close();" />`;
            bubbleDiv.style.background = "transparent";
            bubbleDiv.style.padding = "0";
        } else {
            if (sender === 'agent') {
                bubbleDiv.innerHTML = text.replace(/\n/g, '<br>');
            } else {
                bubbleDiv.textContent = text;
            }
        }

        const timeDiv = document.createElement("div");
        timeDiv.className = "kefu-msg-time";
        timeDiv.textContent = getTimeStr(d);

        contentDiv.appendChild(bubbleDiv);
        contentDiv.appendChild(timeDiv);

        row.appendChild(avatarDiv);
        row.appendChild(contentDiv);

        kefuMessages.appendChild(row);
        kefuMessages.scrollTop = kefuMessages.scrollHeight;
    }

    // ===== Typing indicator =====
    function showTyping() {
        if (document.getElementById("kefuTypingMsg")) return;
        const typing = document.createElement("div");
        typing.className = "kefu-msg agent";
        typing.id = "kefuTypingMsg";
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "kefu-msg-avatar";
        if (widgetConfig.agent_icon) {
            avatarDiv.innerHTML = `<img src="${widgetConfig.agent_icon}" alt="">`;
        } else {
            avatarDiv.textContent = '👩‍💼';
        }
        const contentDiv = document.createElement("div");
        contentDiv.innerHTML = `<div class="kefu-msg-bubble"><div class="kefu-typing"><span></span><span></span><span></span></div></div>`;
        typing.appendChild(avatarDiv);
        typing.appendChild(contentDiv);
        kefuMessages.appendChild(typing);
        kefuMessages.scrollTop = kefuMessages.scrollHeight;
    }

    function removeTyping() {
        const t = document.getElementById("kefuTypingMsg");
        if (t) t.remove();
    }

    function showTypingAndReply(replyText) {
        showTyping();
        const delay = 800 + Math.random() * 1200;
        setTimeout(() => {
            removeTyping();
            appendMsg(replyText, 'agent');
        }, delay);
    }

    // ===== 历史消息加载 =====
    async function loadHistory() {
        if (historyLoaded || !userId) return;
        try {
            const res = await fetch(`${API_BASE}/api/customer/history?userId=${userId}`);
            const data = await res.json();
            if (data.history && data.history.length > 0) {
                kefuMessages.innerHTML = '';
                kefuWelcome.style.display = 'none';
                lastMsgTime = 0;
                data.history.forEach(msg => appendMsg(msg.content, msg.sender, msg.created_at));
            }
            historyLoaded = true;
        } catch (e) { console.error("加载历史失败", e); }
    }

    // ===== 轮询获取回复 =====
    async function startPolling() {
        if (isPolling) return;
        isPolling = true;
        while (isPolling) {
            if (userId) {
                try {
                    const res = await fetch(`${API_BASE}/api/customer/get-reply?userId=${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.replies && data.replies.length > 0) {
                            removeTyping();
                            data.replies.forEach(msg => appendMsg(msg.content, 'agent', msg.created_at));
                            try { notifySound.play(); } catch (e) {}

                            if (!kefuWindow.classList.contains('open')) {
                                unreadCount += data.replies.length;
                                kefuUnread.textContent = unreadCount > 99 ? '99+' : unreadCount;
                                kefuUnread.style.display = 'block';
                            }
                        }
                    }
                } catch (e) {}
            }
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    // ===== 发送消息 =====
    async function sendMessage() {
        const text = kefuInput.value.trim();
        if (!text) return;
        appendMsg(text, 'user');
        kefuInput.value = '';

        // 隐藏欢迎语
        kefuWelcome.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE}/api/customer/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userId, content: text })
            });
            const data = await res.json();
            if (data.success && data.userId && !userId) {
                userId = data.userId;
                localStorage.setItem("cs_user_id", userId);
                updateIdDisplay();
            }
        } catch (e) { console.error("发送失败", e); }
    }

    // ===== 图片上传 =====
    function sendImageFile(file) {
        if (!file || !file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Img = e.target.result;
            appendMsg(base64Img, 'user');
            kefuWelcome.style.display = 'none';
            try {
                const res = await fetch(`${API_BASE}/api/customer/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: userId, content: base64Img })
                });
                const data = await res.json();
                if (data.success && data.userId && !userId) {
                    userId = data.userId;
                    localStorage.setItem("cs_user_id", userId);
                    updateIdDisplay();
                }
            } catch (err) { console.error("图片发送失败", err); }
        };
        reader.readAsDataURL(file);
    }

    // ===== 事件绑定 =====
    kefuToggle.addEventListener('click', () => {
        kefuWindow.classList.toggle('open');
        if (kefuWindow.classList.contains('open')) {
            kefuInput.focus();
            unreadCount = 0;
            kefuUnread.style.display = 'none';
            loadHistory();
            startPolling();
        }
    });

    kefuClose.addEventListener('click', () => {
        kefuWindow.classList.remove('open');
    });

    kefuSend.addEventListener('click', sendMessage);
    kefuInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // 返回顶部
    document.getElementById("kefuBackTop").addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 图片上传
    const uploadBtn = document.getElementById("kefuUploadBtn");
    const uploadInput = document.getElementById("kefuUploadInput");
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) sendImageFile(e.target.files[0]);
        uploadInput.value = "";
    });

    // 粘贴图片
    kefuInput.addEventListener("paste", (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.startsWith("image/")) {
                const file = item.getAsFile();
                sendImageFile(file);
                e.preventDefault();
            }
        }
    });

    // 邮箱复制（默认）
    document.getElementById("kefuEmail").addEventListener('click', () => {
        const tooltip = kefuEmailTooltip;
        const emailText = tooltip.textContent.match(/[\w.-]+@[\w.-]+/);
        if (emailText) {
            navigator.clipboard.writeText(emailText[0]).then(() => {
                tooltip.innerHTML = `✅ 已复制！`;
                setTimeout(() => {
                    tooltip.innerHTML = `📧 ${emailText[0]}<br><span style="color:#57A2FE;font-size:12px;">点击复制邮箱地址</span>`;
                }, 1500);
            });
        }
    });

    // 自动启动轮询
    if (userId) {
        startPolling();
    }
})();
