/* eslint-disable */
/* global Vue, document, window */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @click="showMenuId = null">
            <!-- 列表视图 -->
            <div v-if="!currentChatId" style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">消息</div>
                <div class="qq-content">
                    <div 
                        v-for="chat in store.qqChats" 
                        :key="chat.id" 
                        class="qq-contact-item" 
                        @click.stop="openChat(chat.id)"
                    >
                        <div class="qq-contact-avatar" :style="{ backgroundImage: 'url(' + chat.avatar + ')' }"></div>
                        <div class="qq-contact-info">
                            <div class="qq-contact-name">{{ chat.name }}</div>
                            <div class="qq-contact-preview">{{ chat.messages.length ? chat.messages[chat.messages.length - 1].content : '暂无消息' }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 聊天视图 -->
            <div v-else style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">
                    <span @click.stop="currentChatId = null" style="cursor: pointer; padding: 5px;">&lt; 返回</span>
                    <span>{{ currentChat.name }}</span>
                    <span style="width: 40px;"></span>
                </div>
                
                <div class="qq-content" id="qq-chat-content" @click="showMenuId = null">
                    <div 
                        v-for="msg in currentChat.messages" 
                        :key="msg.id" 
                        class="qq-msg-row" 
                        :class="msg.role"
                        @click.stop="handleMsgClick(msg.id)"
                    >
                        <!-- 多选模式下的勾选框 -->
                        <div 
                            v-if="selectMode" 
                            class="qq-select-checkbox" 
                            :class="{ selected: selectedMsgIds.includes(msg.id) }"
                        ></div>
                        
                        <!-- 头像 -->
                        <div v-if="msg.role === 'ai'" class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + currentChat.avatar + ')' }"></div>
                        <div v-if="msg.role === 'user'" class="qq-msg-avatar" style="background: #0095f6;">我</div>
                        
                        <!-- 气泡本体 -->
                        <div class="msg-bubble-container" 
                             @touchstart="handleTouchStart($event, msg.id)" 
                             @touchend="handleTouchEnd" 
                             @mousedown="handleTouchStart($event, msg.id)"
                             @mouseup="handleTouchEnd">
                            <div class="bubble-time" v-if="msg.time">{{ msg.time }}</div>
                            <div class="qq-msg-bubble">
                                <!-- 引用内容显示 -->
                                <div v-if="msg.quote" class="quote-box">
                                    {{ msg.quote.role === 'user' ? '我' : currentChat.name }}: {{ msg.quote.content }}
                                </div>
                                {{ msg.content }}
                            </div>
                        </div>

                        <!-- 纯文字长按菜单 -->
                        <div v-if="showMenuId === msg.id && !selectMode" class="msg-menu">
                            <span @click.stop="enterSelectMode(msg.id)">选择</span>
                            <span @click.stop="enterReplyMode(msg)">回复</span>
                        </div>
                    </div>
                    
                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + currentChat.avatar + ')' }"></div>
                        <div class="msg-bubble-container">
                            <div class="qq-msg-bubble typing-anim">正在输入...</div>
                        </div>
                    </div>
                </div>

                <!-- 批量选择操作栏 -->
                <div v-if="selectMode" class="qq-select-bar">
                    <button @click.stop="cancelSelect" class="btn-primary" style="background: #f0f0f0;">取消</button>
                    <button @click.stop="deleteSelected" class="btn-danger" style="background: #ff3b30; color: #fff; border-color: #ff3b30 !important;">删除</button>
                </div>
                
                <!-- 正常输入栏 -->
                <div v-else class="qq-input-area">
                    <!-- 引用消息预览区 -->
                    <div v-if="replyingToMsg" class="quote-preview">
                        <div>
                            <span style="font-weight: 600;">回复 {{ replyingToMsg.role === 'user' ? '我' : currentChat.name }}:</span> 
                            {{ replyingToMsg.content.length > 15 ? replyingToMsg.content.substring(0, 15) + '...' : replyingToMsg.content }}
                        </div>
                        <span class="close-btn" @click.stop="replyingToMsg = null">×</span>
                    </div>
                    
                    <div class="qq-input-bar">
                        <textarea v-model="inputText" @keydown.enter.prevent="sendMessage"></textarea>
                        <button @click.stop="sendMessage" class="btn-primary" style="background: #007aff; color: #fff; border-color: #007aff !important;">发送</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;
        const currentChatId = Vue.ref(null);
        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);
        const showMenuId = Vue.ref(null);

        // 选择与回复功能状态
        const selectMode = Vue.ref(false);
        const selectedMsgIds = Vue.ref([]);
        const replyingToMsg = Vue.ref(null);

        // 如果没有对话记录则初始化
        if (!store.qqChats || store.qqChats.length === 0) {
            store.qqChats = [
                { id: 'chat_1', name: 'AI 助手', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai', messages: [], prompt: '你是一个贴心的AI助手。' }
            ];
        }

        const currentChat = Vue.computed(() => {
            return store.qqChats.find(c => c.id === currentChatId.value);
        });

        const openChat = (id) => {
            currentChatId.value = id;
            selectMode.value = false;
            replyingToMsg.value = null;
            showMenuId.value = null;
            scrollToBottom();
        };

        let touchTimer = null;
        const handleTouchStart = (e, id) => {
            if (selectMode.value) return; // 如果在选择模式下，不触发长按
            touchTimer = setTimeout(() => {
                showMenuId.value = id;
            }, 500); // 长按 0.5s 弹出菜单
        };

        const handleTouchEnd = () => {
            if (touchTimer) clearTimeout(touchTimer);
        };

        const handleMsgClick = (id) => {
            if (selectMode.value) {
                // 点击行进行勾选切换
                const index = selectedMsgIds.value.indexOf(id);
                if (index > -1) {
                    selectedMsgIds.value.splice(index, 1);
                } else {
                    selectedMsgIds.value.push(id);
                }
            } else {
                // 普通模式点击气泡关闭弹窗
                showMenuId.value = null;
            }
        };

        const enterSelectMode = (id) => {
            selectMode.value = true;
            selectedMsgIds.value = [id]; // 默认选中当前长按的这个
            showMenuId.value = null;
        };

        const cancelSelect = () => {
            selectMode.value = false;
            selectedMsgIds.value = [];
        };

        const deleteSelected = () => {
            if (!currentChat.value) return;
            currentChat.value.messages = currentChat.value.messages.filter(
                msg => !selectedMsgIds.value.includes(msg.id)
            );
            cancelSelect();
        };

        const enterReplyMode = (msg) => {
            replyingToMsg.value = msg;
            showMenuId.value = null;
        };

        const scrollToBottom = () => {
            Vue.nextTick(() => {
                const content = document.getElementById('qq-chat-content');
                if (content) content.scrollTop = content.scrollHeight;
            });
        };

        const formatTime = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        };

        const sendMessage = async () => {
            if (!inputText.value.trim() || !currentChat.value) return;

            const userMsg = {
                id: 'msg_' + Date.now(),
                role: 'user',
                content: inputText.value,
                time: formatTime()
            };

            // 如果当前在回复状态，则附加 quote
            if (replyingToMsg.value) {
                userMsg.quote = {
                    role: replyingToMsg.value.role,
                    content: replyingToMsg.value.content
                };
            }

            currentChat.value.messages.push(userMsg);
            inputText.value = '';
            replyingToMsg.value = null; // 发送完清空回复状态
            scrollToBottom();

            isTyping.value = true;

            try {
                const apiConfig = store.apiSettings.main;
                if (!apiConfig || !apiConfig.url || !apiConfig.key) {
                    throw new Error('未配置主API，请前往设置进行配置。');
                }

                // ===== 核心需求：在提示词中追加时间规则 =====
                let sysPrompt = currentChat.value.prompt || '你是一个好用的AI助手。';
                sysPrompt += '\n\n【时间戳规则】如果是聊天中途关闭了时间感知模式，要紧接着上一次的时间开始，每次回复的时间间隔不超过3分钟：例如ai回复的同一次内，第一个气泡时间为10:03，本次回复的最后一个气泡的时间不超过10:06。';

                const messagesForApi = [
                    { role: 'system', content: sysPrompt }
                ];

                // 组装历史记录，防止携带超长消息造成消耗过大，截取最近15条
                const history = currentChat.value.messages.slice(-15);
                history.forEach(m => {
                    let contentToSend = m.content;
                    // 如果历史里有引用，一并带给AI看，让它明白前因后果
                    if (m.quote) {
                        contentToSend = `(回复引用了这句：${m.quote.content})\n` + contentToSend;
                    }
                    messagesForApi.push({ 
                        role: m.role === 'user' ? 'user' : 'assistant', 
                        content: contentToSend 
                    });
                });

                const res = await fetch(apiConfig.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiConfig.key
                    },
                    body: JSON.stringify({
                        model: apiConfig.model || 'gpt-3.5-turbo',
                        messages: messagesForApi
                    })
                });

                if (!res.ok) throw new Error(`请求失败 (Status: ${res.status})`);
                
                const data = await res.json();
                const aiText = data.choices[0].message.content;

                // 拆分以 "|" 分隔的多气泡回复（兼容原有机制）
                const replies = aiText.split('|').map(s => s.trim()).filter(s => s);
                for (let text of replies) {
                    currentChat.value.messages.push({
                        id: 'msg_' + Date.now() + Math.random(),
                        role: 'ai',
                        content: text,
                        time: formatTime()
                    });
                }

            } catch (err) {
                alert('发送异常：' + err.message);
            } finally {
                isTyping.value = false;
                scrollToBottom();
            }
        };

        return {
            store, currentChatId, currentChat, openChat,
            inputText, isTyping, showMenuId,
            handleTouchStart, handleTouchEnd, handleMsgClick,
            selectMode, selectedMsgIds, enterSelectMode, cancelSelect, deleteSelected,
            replyingToMsg, enterReplyMode, sendMessage
        };
    }
};
