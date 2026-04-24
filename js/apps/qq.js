/* eslint-disable */
/* global Vue, window, document, fetch */
'use strict';

// 动态注入专属样式，无需再次修改 style.css
if (!document.getElementById('qq-dynamic-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'qq-dynamic-styles';
    styleEl.innerHTML = `
    .msg-menu {
        position: absolute;
        top: -42px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        border: 1px solid #000;
        border-radius: 20px;
        display: flex;
        gap: 16px;
        padding: 8px 18px;
        z-index: 1000;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .msg-menu span {
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        color: #000;
    }
    .msg-menu::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px 6px 0;
        border-style: solid;
        border-color: #000 transparent transparent transparent;
    }
    .msg-menu::before {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 5px 5px 0;
        border-style: solid;
        border-color: #fff transparent transparent transparent;
        z-index: 1;
    }
    .msg-checkbox {
        margin: 0 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .msg-checkbox input {
        width: 18px;
        height: 18px;
        accent-color: #007aff;
    }
    .qq-select-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        border-top: 1px solid #eee;
        background: #fbfbfd;
        height: 55px;
        flex-shrink: 0;
    }
    .quote-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: #f5f5f7;
        font-size: 13px;
        color: #666;
        border-top: 1px solid #eee;
        flex-shrink: 0;
    }
    .quote-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 90%;
    }
    .quote-close {
        cursor: pointer;
        font-size: 16px;
        color: #999;
        padding: 0 5px;
    }
    .quote-box {
        font-size: 12px;
        color: #555;
        background: rgba(0,0,0,0.05);
        padding: 6px 10px;
        border-radius: 8px;
        margin-bottom: 6px;
        border-left: 3px solid #ccc;
        word-break: break-all;
    }
    .qq-msg-row {
        align-items: flex-start !important;
    }
    `;
    document.head.appendChild(styleEl);
}

window.qqApp = {
    template: `
        <div class="qq-container" @click="activeMenu = null">
            <!-- 聊天列表界面 -->
            <div v-if="!currentChat" style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">消息</div>
                <div class="qq-content">
                    <div v-for="chat in chatList" :key="chat.id" class="qq-contact-item" @click="openChat(chat)">
                        <div class="qq-contact-avatar" style="background:#000;">{{ chat.name.charAt(0) }}</div>
                        <div class="qq-contact-info">
                            <div class="qq-contact-name">{{ chat.name }}</div>
                            <div class="qq-contact-preview">{{ getLastMsg(chat) }}</div>
                        </div>
                    </div>
                </div>
                <div class="qq-bottom-bar">
                    <div class="active">消息</div>
                    <div>联系人</div>
                    <div>动态</div>
                </div>
            </div>

            <!-- 聊天窗口界面 -->
            <div v-else style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">
                    <span @click="closeChat" style="cursor: pointer; font-size: 26px; padding: 0 10px;">‹</span>
                    <span>{{ currentChat.name }}</span>
                    <span style="width: 34px;"></span>
                </div>
                
                <div class="qq-content" ref="chatScrollRef" style="padding-top: 15px; padding-bottom: 15px;">
                    <div v-for="(msg, index) in currentChat.messages" :key="msg.id">
                        <div class="qq-timestamp" v-if="shouldShowTime(index)">
                            {{ formatTime(msg.timestamp) }}
                        </div>
                        
                        <div class="qq-msg-row" :class="msg.role">
                            <!-- 气泡多选框 -->
                            <div v-if="isSelecting" class="msg-checkbox" @click.stop="toggleSelect(msg.id)">
                                <input type="checkbox" :checked="selectedIds.includes(msg.id)" @change.stop="toggleSelect(msg.id)">
                            </div>
                            
                            <div class="msg-bubble-container" style="position: relative;">
                                <div class="qq-msg-avatar" v-if="msg.role === 'ai'" style="background: #000; color: #fff;">A</div>
                                
                                <div class="qq-msg-bubble"
                                     @touchstart="handleTouchStart($event, msg)"
                                     @touchend="handleTouchEnd"
                                     @touchmove="handleTouchEnd"
                                     @contextmenu.prevent="showMenu(msg)">
                                    
                                    <!-- 引用回复的预览框 -->
                                    <div v-if="msg.quote" class="quote-box">
                                        {{ msg.quote.content }}
                                    </div>
                                    
                                    {{ msg.content }}
                                    
                                    <!-- 长按弹出的文字菜单 -->
                                    <div v-if="activeMenu === msg.id" class="msg-menu">
                                        <span @click.stop="startSelect(msg)">选择</span>
                                        <span @click.stop="setQuote(msg)">回复</span>
                                    </div>
                                </div>
                                
                                <div class="qq-msg-avatar" v-if="msg.role === 'user'" style="background: #007aff; color: #fff;">我</div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div class="msg-bubble-container">
                            <div class="qq-msg-avatar" style="background: #000; color: #fff;">A</div>
                            <div class="qq-msg-bubble typing-anim">对方正在输入...</div>
                        </div>
                    </div>
                </div>
                
                <!-- 底部：多选删除栏 -->
                <div v-if="isSelecting" class="qq-select-bar">
                    <button class="btn-danger" @click="deleteSelected" :disabled="selectedIds.length === 0">
                        删除 ({{ selectedIds.length }})
                    </button>
                    <button class="btn-primary" @click="cancelSelect">取消</button>
                </div>
                
                <!-- 底部：输入栏 -->
                <div v-else class="qq-input-area">
                    <!-- 引用回复悬浮框 -->
                    <div v-if="quoteMsg" class="quote-preview">
                        <span class="quote-text">回复: {{ quoteMsg.content }}</span>
                        <span class="quote-close" @click="quoteMsg = null">✕</span>
                    </div>
                    <div class="qq-input-bar">
                        <textarea v-model="inputText" @keydown.enter.prevent="sendMessage" placeholder="发消息..."></textarea>
                        <button class="btn-primary" @click="sendMessage">发送</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;
        const { ref, computed, nextTick } = Vue;

        // 初始化聊天数据
        if (!store.qqChats) {
            store.qqChats = [{
                id: 'chat_1',
                name: 'AI 助手',
                messages: []
            }];
        }

        const chatList = computed(() => store.qqChats);
        const currentChat = ref(null);
        const inputText = ref('');
        const isTyping = ref(false);
        const chatScrollRef = ref(null);

        // 长按、菜单与多选状态
        const activeMenu = ref(null);
        const isSelecting = ref(false);
        const selectedIds = ref([]);
        let touchTimer = null;

        // 引用回复状态
        const quoteMsg = ref(null);

        const openChat = (chat) => {
            currentChat.value = chat;
            scrollToBottom();
        };

        const closeChat = () => {
            currentChat.value = null;
            cancelSelect();
            quoteMsg.value = null;
            activeMenu.value = null;
        };

        const getLastMsg = (chat) => {
            if (!chat.messages || chat.messages.length === 0) return '暂无消息';
            return chat.messages[chat.messages.length - 1].content;
        };

        const scrollToBottom = () => {
            nextTick(() => {
                if (chatScrollRef.value) {
                    chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
                }
            });
        };

        // --- 时间感知逻辑 ---
        const getMessageTime = (chat) => {
            // 如果在设置中关闭了时间感知模式 (假设 store.timePerception 存在且为 false)
            if (store.timePerception === false) {
                if (chat && chat.messages && chat.messages.length > 0) {
                    const lastTs = chat.messages[chat.messages.length - 1].timestamp;
                    // 紧接着上次时间，随机向后推迟 10秒 到 60秒
                    return lastTs + 10000 + Math.floor(Math.random() * 50000);
                }
                return Date.now();
            }
            // 时间感知模式开启：使用真实当前时间
            return Date.now();
        };

        const formatTime = (ts) => {
            const d = new Date(ts);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };

        const shouldShowTime = (index) => {
            if (index === 0) return true;
            const currentMs = currentChat.value.messages[index].timestamp;
            const prevMs = currentChat.value.messages[index - 1].timestamp;
            // 超过3分钟显示一次时间戳
            return (currentMs - prevMs) > 180000;
        };

        // --- 交互逻辑 ---
        const handleTouchStart = (e, msg) => {
            if (isSelecting.value) return;
            touchTimer = setTimeout(() => {
                activeMenu.value = msg.id;
            }, 500); // 长按500ms弹出
        };

        const handleTouchEnd = () => {
            if (touchTimer) clearTimeout(touchTimer);
        };

        const showMenu = (msg) => {
            if (isSelecting.value) return;
            activeMenu.value = msg.id;
        };

        const startSelect = (msg) => {
            isSelecting.value = true;
            selectedIds.value = [msg.id];
            activeMenu.value = null;
        };

        const toggleSelect = (id) => {
            const idx = selectedIds.value.indexOf(id);
            if (idx > -1) selectedIds.value.splice(idx, 1);
            else selectedIds.value.push(id);
        };

        const cancelSelect = () => {
            isSelecting.value = false;
            selectedIds.value = [];
        };

        const deleteSelected = () => {
            if (!currentChat.value) return;
            currentChat.value.messages = currentChat.value.messages.filter(m => !selectedIds.value.includes(m.id));
            cancelSelect();
        };

        const setQuote = (msg) => {
            quoteMsg.value = msg;
            activeMenu.value = null;
        };

        // --- 核心：发送与 AI 响应逻辑 ---
        const sendMessage = async () => {
            if (!inputText.value.trim() || !currentChat.value) return;

            const userText = inputText.value.trim();
            const newMsg = {
                id: Date.now() + Math.random(),
                role: 'user',
                content: userText,
                timestamp: getMessageTime(currentChat.value),
                quote: quoteMsg.value ? { id: quoteMsg.value.id, content: quoteMsg.value.content } : null
            };

            currentChat.value.messages.push(newMsg);
            inputText.value = '';
            quoteMsg.value = null;
            scrollToBottom();

            isTyping.value = true;
            scrollToBottom();

            const config = store.apiSettings && store.apiSettings.main;
            if (!config || !config.url || !config.key) {
                setTimeout(() => {
                    currentChat.value.messages.push({
                        id: Date.now(), role: 'ai', content: '请先在设置中配置 API URL 和 Key', timestamp: getMessageTime(currentChat.value)
                    });
                    isTyping.value = false;
                    scrollToBottom();
                }, 1000);
                return;
            }

            try {
                // 构建发送给AI的上下文
                const apiMsgs = currentChat.value.messages.map(m => {
                    let txt = m.content;
                    if (m.quote) txt = `[用户引用了历史消息: "${m.quote.content}"]\n${txt}`;
                    return { role: m.role === 'ai' ? 'assistant' : 'user', content: txt };
                });
                apiMsgs.unshift({ role: 'system', content: store.systemPrompt || 'You are a helpful assistant.' });

                const res = await fetch(config.url.replace(/\/$/, '') + '/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
                    body: JSON.stringify({ model: config.model || 'gpt-3.5-turbo', messages: apiMsgs })
                });

                const data = await res.json();
                if (data.error) throw new Error(data.error.message);
                const aiText = data.choices[0].message.content;

                // 拆分AI回复的句子形成多个气泡
                let bubbles = aiText.match(/([^。！？!\?\n]+[。！？!\?\n]*)/g);
                if (!bubbles) bubbles = [aiText];
                bubbles = bubbles.map(b => b.trim()).filter(b => b !== '');

                // 控制多气泡的时间逻辑：第一条到最后一条的时间间隔绝对不超过 3分钟(180,000ms)
                let startT = getMessageTime(currentChat.value);
                const maxTotalInterval = 180000; 
                // 计算每次气泡产生的最大随机间隔，确保所有间隔加起来 <= 3分钟
                let maxGap = bubbles.length > 1 ? maxTotalInterval / (bubbles.length - 1) : 0;
                let currentT = startT;

                for (let i = 0; i < bubbles.length; i++) {
                    if (i > 0) {
                        currentT += Math.floor(Math.random() * maxGap);
                    }
                    
                    currentChat.value.messages.push({
                        id: Date.now() + Math.random(),
                        role: 'ai',
                        content: bubbles[i],
                        timestamp: currentT
                    });

                    await new Promise(resolve => setTimeout(resolve, 600)); // 视觉上的打字停顿效果
                    scrollToBottom();
                }

            } catch (e) {
                currentChat.value.messages.push({
                    id: Date.now(), role: 'ai', content: '连接异常: ' + e.message, timestamp: getMessageTime(currentChat.value)
                });
            }

            isTyping.value = false;
            scrollToBottom();
        };

        return {
            chatList, currentChat, inputText, isTyping, chatScrollRef,
            activeMenu, isSelecting, selectedIds, quoteMsg,
            openChat, closeChat, getLastMsg, formatTime, shouldShowTime,
            handleTouchStart, handleTouchEnd, showMenu, startSelect, toggleSelect,
            cancelSelect, deleteSelected, setQuote, sendMessage
        };
    }
};
