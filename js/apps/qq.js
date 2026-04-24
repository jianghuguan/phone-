/* eslint-disable */
/* global window, document, Vue, fetch */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @click="closeMenu">
            <!-- 未进入聊天界面时显示：列表与设置 -->
            <template v-if="!currentChatId">
                <div class="qq-header">
                    <span>{{ activeTab === 'chat' ? '消息' : '设置' }}</span>
                </div>
                
                <div class="qq-content">
                    <!-- 消息列表 -->
                    <div v-if="activeTab === 'chat'">
                        <div
                            v-for="chat in store.qqChats"
                            :key="chat.id"
                            class="qq-contact-item"
                            @click="openChat(chat.id)"
                        >
                            <div class="qq-contact-avatar" :style="{ backgroundImage: 'url(' + chat.avatar + ')' }">
                                <template v-if="!chat.avatar">{{ chat.name.charAt(0) }}</template>
                            </div>
                            <div class="qq-contact-info">
                                <div class="qq-contact-name">{{ chat.name }}</div>
                                <div class="qq-contact-preview" v-if="chat.messages.length > 0">
                                    {{ chat.messages[chat.messages.length - 1].text }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 偏好设置选项卡 -->
                    <div v-if="activeTab === 'settings'" style="padding: 20px;">
                        <div class="user-card">
                            <h3 style="margin-bottom: 15px; font-size: 16px;">聊天偏好设置</h3>
                            <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; margin-bottom: 10px; cursor: pointer;">
                                <input type="checkbox" v-model="store.timeAware" style="width: 18px; height: 18px;"> 
                                开启时间感知模式
                            </label>
                            <p style="font-size: 12px; color: #888;">关闭后，发消息时间将紧接着上一次气泡的时间连续推演。</p>
                        </div>
                    </div>
                </div>

                <div class="qq-bottom-bar">
                    <div :class="{ active: activeTab === 'chat' }" @click="activeTab = 'chat'">消息</div>
                    <div :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">设置</div>
                </div>
            </template>

            <!-- 聊天详情界面 -->
            <template v-else>
                <div class="qq-header">
                    <span @click="closeChat" style="cursor: pointer; color: #007aff;">&lt; 返回</span>
                    <span>{{ currentChat.name }}</span>
                    <span style="width: 40px;"></span>
                </div>

                <div class="qq-content" id="qq-msg-scroll" style="padding-bottom: 15px;">
                    <div v-for="msg in currentChat.messages" :key="msg.id">
                        <!-- 时间戳 -->
                        <div v-if="msg.showTime" class="qq-timestamp">{{ msg.time }}</div>
                        
                        <!-- 消息行 -->
                        <div
                            class="qq-msg-row"
                            :class="msg.role"
                            @mousedown="handlePointerDown(msg)"
                            @mouseup="handlePointerUp"
                            @mouseleave="handlePointerLeave"
                            @touchstart="handlePointerDown(msg)"
                            @touchend="handlePointerUp"
                            @click="handleMsgClick(msg)"
                        >
                            <!-- 多选框 -->
                            <div v-if="isSelecting" style="margin: 0 10px; display: flex; align-items: center;">
                                <input type="checkbox" :checked="selectedMsgIds.includes(msg.id)" style="pointer-events: none; width: 20px; height: 20px;">
                            </div>

                            <div class="qq-msg-avatar" :style="{ backgroundImage: msg.role === 'ai' ? 'url(' + currentChat.avatar + ')' : 'url(' + store.myAvatar + ')' }">
                                <template v-if="msg.role === 'ai' && !currentChat.avatar">{{ currentChat.name.charAt(0) }}</template>
                                <template v-if="msg.role === 'user' && !store.myAvatar">我</template>
                            </div>

                            <div class="msg-bubble-container" style="position: relative;">
                                <div class="qq-msg-bubble">
                                    <!-- 引用回复的预览框 -->
                                    <div v-if="msg.quote" class="quote-box">
                                        <span style="font-weight: 600;">{{ msg.quote.name }}:</span> {{ msg.quote.text }}
                                    </div>
                                    {{ msg.text }}
                                </div>
                                
                                <!-- 纯文字长按菜单 -->
                                <div v-if="showMenuId === msg.id" class="msg-menu">
                                    <span @click.stop="startSelect(msg)">选择</span>
                                    <span @click.stop="startReply(msg)">回复</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + currentChat.avatar + ')' }">
                            <template v-if="!currentChat.avatar">{{ currentChat.name.charAt(0) }}</template>
                        </div>
                        <div class="msg-bubble-container">
                            <div class="qq-msg-bubble typing-anim">对方正在输入...</div>
                        </div>
                    </div>
                </div>

                <!-- 引用预览悬浮窗 -->
                <div v-if="replyingTo && !isSelecting" class="quote-preview" style="justify-content: space-between;">
                    <div style="flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; padding-right: 15px;">
                        <span style="font-weight: bold; margin-right: 5px;">{{ replyingTo.role === 'user' ? '我' : currentChat.name }}:</span>
                        {{ replyingTo.text }}
                    </div>
                    <div @click="replyingTo = null" style="cursor: pointer; font-size: 20px; color: #999; line-height: 1;">×</div>
                </div>

                <!-- 底部交互区域 -->
                <div class="qq-input-area">
                    <!-- 正常输入栏 -->
                    <div v-if="!isSelecting" class="qq-input-bar">
                        <textarea v-model="inputText" placeholder="发送消息..." @keydown.enter.prevent="sendMessage"></textarea>
                        <button class="btn-primary" @click="sendMessage">发送</button>
                    </div>

                    <!-- 多选删除操作栏 -->
                    <div v-if="isSelecting" class="qq-input-bar" style="justify-content: space-between; align-items: center; background: #f9f9f9; padding-top: 10px;">
                        <span style="font-size: 14px; color: #666; font-weight: bold;">已选择 {{ selectedMsgIds.length }} 项</span>
                        <div style="display: flex; gap: 10px;">
                            <button @click="cancelSelect" class="btn-primary" style="padding: 6px 18px;">取消</button>
                            <button @click="deleteSelected" class="btn-danger" style="padding: 6px 18px;">删除</button>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    `,
    setup() {
        const store = window.store;

        // 初始化必要的数据结构
        if (store.timeAware === undefined) {
            store.timeAware = true;
        }
        if (!store.myAvatar) {
            store.myAvatar = '';
        }
        if (!store.qqChats) {
            store.qqChats = [
                {
                    id: 'chat_1',
                    name: 'AI 助手',
                    avatar: '',
                    messages: [
                        { id: 'm1', role: 'ai', text: '你好！长按我的气泡可以回复或多选删除哦。', time: '10:00', showTime: true }
                    ]
                }
            ];
        }

        const activeTab = Vue.ref('chat');
        const currentChatId = Vue.ref(null);
        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);

        // 新增状态：长按菜单、引用回复、多选
        const showMenuId = Vue.ref(null);
        const replyingTo = Vue.ref(null);
        const isSelecting = Vue.ref(false);
        const selectedMsgIds = Vue.ref([]);

        const currentChat = Vue.computed(function() {
            return store.qqChats.find(function(c) {
                return c.id === currentChatId.value;
            });
        });

        // ---------------- 核心时间推演逻辑 ----------------
        const parseTime = function(timeStr) {
            if (!timeStr) return new Date();
            const parts = timeStr.split(':');
            const d = new Date();
            d.setHours(parseInt(parts[0], 10));
            d.setMinutes(parseInt(parts[1], 10));
            d.setSeconds(0);
            return d;
        };

        const formatTime = function(date) {
            const h = String(date.getHours()).padStart(2, '0');
            const m = String(date.getMinutes()).padStart(2, '0');
            return h + ':' + m;
        };

        const shouldShowTime = function(messages, newTimeStr) {
            if (messages.length === 0) return true;
            let lastShowTimeMsg = null;
            for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].showTime) {
                    lastShowTimeMsg = messages[i];
                    break;
                }
            }
            if (!lastShowTimeMsg) return true;
            const lastD = parseTime(lastShowTimeMsg.time);
            const newD = parseTime(newTimeStr);
            return (newD - lastD) >= 5 * 60 * 1000;
        };

        // ---------------- 交互控制逻辑 ----------------
        const openChat = function(id) {
            currentChatId.value = id;
            isSelecting.value = false;
            replyingTo.value = null;
            scrollToBottom();
        };

        const closeChat = function() {
            currentChatId.value = null;
        };

        const closeMenu = function() {
            showMenuId.value = null;
        };

        const scrollToBottom = function() {
            setTimeout(function() {
                const el = document.getElementById('qq-msg-scroll');
                if (el) {
                    el.scrollTop = el.scrollHeight;
                }
            }, 100);
        };

        // ---------------- 长按事件 ----------------
        let pressTimer = null;
        const handlePointerDown = function(msg) {
            if (isSelecting.value) return;
            pressTimer = setTimeout(function() {
                showMenuId.value = msg.id;
            }, 500);
        };
        const handlePointerUp = function() {
            if (pressTimer) clearTimeout(pressTimer);
        };
        const handlePointerLeave = function() {
            if (pressTimer) clearTimeout(pressTimer);
        };

        const handleMsgClick = function(msg) {
            if (isSelecting.value) {
                const idx = selectedMsgIds.value.indexOf(msg.id);
                if (idx > -1) {
                    selectedMsgIds.value.splice(idx, 1);
                } else {
                    selectedMsgIds.value.push(msg.id);
                }
            } else {
                closeMenu();
            }
        };

        // ---------------- 菜单功能 ----------------
        const startSelect = function(msg) {
            isSelecting.value = true;
            selectedMsgIds.value = [msg.id];
            closeMenu();
        };

        const cancelSelect = function() {
            isSelecting.value = false;
            selectedMsgIds.value = [];
        };

        const deleteSelected = function() {
            if (!currentChat.value) return;
            currentChat.value.messages = currentChat.value.messages.filter(function(msg) {
                return !selectedMsgIds.value.includes(msg.id);
            });
            isSelecting.value = false;
            selectedMsgIds.value = [];
        };

        const startReply = function(msg) {
            replyingTo.value = msg;
            closeMenu();
        };

        // ---------------- 发送与 API 逻辑 ----------------
        const sendMessage = async function() {
            if (!inputText.value.trim() || isTyping.value || !currentChat.value) return;
            
            const userText = inputText.value.trim();
            const quoteObj = replyingTo.value ? {
                id: replyingTo.value.id,
                text: replyingTo.value.text,
                name: replyingTo.value.role === 'user' ? '我' : currentChat.value.name
            } : null;
            
            inputText.value = '';
            replyingTo.value = null;
            
            // 计算用户气泡时间（感知模式关闭时，无缝衔接上一次时间）
            let uTime;
            if (store.timeAware) {
                uTime = new Date();
            } else {
                const msgs = currentChat.value.messages;
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.time) {
                    uTime = parseTime(lastMsg.time);
                    uTime.setMinutes(uTime.getMinutes() + 1);
                } else {
                    uTime = new Date();
                }
            }
            
            currentChat.value.messages.push({
                id: 'msg_' + Date.now(),
                role: 'user',
                text: userText,
                time: formatTime(uTime),
                showTime: shouldShowTime(currentChat.value.messages, formatTime(uTime)),
                quote: quoteObj
            });
            
            isTyping.value = true;
            scrollToBottom();
            
            try {
                const config = store.apiSettings.main; 
                const apiMessages = currentChat.value.messages.slice(-10).map(function(m) {
                    return { role: m.role === 'ai' ? 'assistant' : 'user', content: m.text };
                });
                
                if (!config.url || !config.key) {
                    throw new Error("请先在设置App中配置主API信息");
                }

                const res = await fetch(config.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + config.key
                    },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: apiMessages
                    })
                });
                
                if (!res.ok) {
                    throw new Error("API 请求失败状态码: " + res.status);
                }

                const data = await res.json();
                let aiResponse = "无响应";
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    aiResponse = data.choices[0].message.content;
                }
                
                // 将AI的回复按段落分割，模拟多气泡发送
                let aiTexts = aiResponse.split('\n').filter(function(t) { return t.trim() !== ''; });
                if (aiTexts.length === 0) aiTexts.push(aiResponse);
                
                // 确定 AI 首次回复的基准时间
                let aiStartTime;
                if (store.timeAware) {
                     aiStartTime = new Date();
                } else {
                     const msgs2 = currentChat.value.messages;
                     const lastMsg2 = msgs2[msgs2.length - 1];
                     aiStartTime = parseTime(lastMsg2.time);
                     aiStartTime.setMinutes(aiStartTime.getMinutes() + 1);
                }
                
                // 【核心机制】保障多气泡在3分钟内分布完毕
                aiTexts.forEach(function(t, index) {
                    let bubbleTime = new Date(aiStartTime.getTime());
                    // 均摊总时长3分钟，不会超过上限
                    const addMins = Math.min(3, Math.floor(index * (3 / aiTexts.length)));
                    bubbleTime.setMinutes(bubbleTime.getMinutes() + addMins);
                    
                    currentChat.value.messages.push({
                        id: 'msg_ai_' + Date.now() + '_' + index,
                        role: 'ai',
                        text: t.trim(),
                        time: formatTime(bubbleTime),
                        showTime: shouldShowTime(currentChat.value.messages, formatTime(bubbleTime))
                    });
                });
                
            } catch(e) {
                currentChat.value.messages.push({
                    id: 'msg_err_' + Date.now(),
                    role: 'ai',
                    text: '回复失败: ' + e.message,
                    time: formatTime(new Date()),
                    showTime: shouldShowTime(currentChat.value.messages, formatTime(new Date()))
                });
            }

            isTyping.value = false;
            scrollToBottom();
        };

        return {
            store: store,
            activeTab: activeTab,
            currentChatId: currentChatId,
            currentChat: currentChat,
            inputText: inputText,
            isTyping: isTyping,
            showMenuId: showMenuId,
            replyingTo: replyingTo,
            isSelecting: isSelecting,
            selectedMsgIds: selectedMsgIds,
            openChat: openChat,
            closeChat: closeChat,
            closeMenu: closeMenu,
            handlePointerDown: handlePointerDown,
            handlePointerUp: handlePointerUp,
            handlePointerLeave: handlePointerLeave,
            handleMsgClick: handleMsgClick,
            startSelect: startSelect,
            cancelSelect: cancelSelect,
            deleteSelected: deleteSelected,
            startReply: startReply,
            sendMessage: sendMessage
        };
    }
};
