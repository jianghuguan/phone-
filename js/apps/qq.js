/* eslint-disable */
/* global Vue, window */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container">
            <!-- 聊天列表界面 -->
            <div v-if="!activeChat" style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">
                    <span>消息</span>
                    <span style="font-size: 14px; color: #007aff; cursor: pointer;" @click="toggleTimeMode">
                        时间感知: {{ timePerception ? '开' : '关' }}
                    </span>
                </div>
                <div class="qq-content">
                    <div
                        v-for="chat in chatList"
                        :key="chat.id"
                        class="qq-contact-item"
                        @click="openChat(chat)"
                    >
                        <div
                            class="qq-contact-avatar"
                            :style="{ backgroundImage: chat.avatar ? 'url(' + chat.avatar + ')' : 'none', backgroundColor: chat.avatar ? 'transparent' : '#007aff' }"
                        >
                            <template v-if="!chat.avatar">{{ chat.name.charAt(0) }}</template>
                        </div>
                        <div class="qq-contact-info">
                            <div class="qq-contact-name">{{ chat.name }}</div>
                            <div class="qq-contact-preview">
                                {{ chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content : '暂无消息' }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="qq-bottom-bar">
                    <div class="active">消息</div>
                    <div>联系人</div>
                    <div>动态</div>
                </div>
            </div>

            <!-- 聊天对话界面 -->
            <div v-else style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">
                    <span @click="closeChat" style="cursor: pointer; color: #007aff;">&lt; 返回</span>
                    <span>{{ activeChat.name }}</span>
                    <span>...</span>
                </div>

                <div class="qq-content" id="chat-scroll-area" @click="activeMenuId = null" style="padding-bottom: 20px;">
                    <div v-for="(msg, index) in activeChat.messages" :key="msg.id">
                        <!-- 时间戳显示 -->
                        <div class="qq-timestamp" v-if="shouldShowTime(index)">
                            {{ formatTime(msg.timestamp) }}
                        </div>

                        <!-- 消息行 -->
                        <div
                            class="qq-msg-row"
                            :class="msg.role"
                            @click="isSelecting ? toggleSelect(msg) : (activeMenuId = null)"
                        >
                            <!-- 多选框 -->
                            <div
                                v-if="isSelecting"
                                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ccc; margin-right: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
                                :style="selectedIds.includes(msg.id) ? 'background: #007aff; border-color: #007aff;' : ''"
                            >
                                <div v-if="selectedIds.includes(msg.id)" style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
                            </div>

                            <!-- 头像 -->
                            <div class="qq-msg-avatar" :style="{ backgroundColor: msg.role === 'user' ? '#007aff' : '#ccc' }">
                                {{ msg.role === 'user' ? '我' : activeChat.name.charAt(0) }}
                            </div>

                            <!-- 气泡及菜单 -->
                            <div class="msg-bubble-container" style="position: relative;">
                                <div
                                    class="qq-msg-bubble"
                                    @touchstart="onTouchStart($event, msg.id)"
                                    @touchmove="onTouchMove"
                                    @touchend="onTouchEnd"
                                >
                                    <!-- 引用框 -->
                                    <div v-if="msg.quote" class="quote-box">
                                        {{ msg.quote }}
                                    </div>
                                    {{ msg.content }}
                                </div>
                                
                                <!-- 长按文字菜单 -->
                                <div v-if="activeMenuId === msg.id && !isSelecting" class="msg-menu">
                                    <span @click.stop="startSelect(msg)">选择</span>
                                    <span style="color: #eee; cursor: default;">|</span>
                                    <span @click.stop="replyMsg(msg)">回复</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AI 正在输入提示 -->
                    <div class="qq-msg-row ai" v-if="isTyping">
                        <div class="qq-msg-avatar" style="background-color: #ccc;">{{ activeChat.name.charAt(0) }}</div>
                        <div class="msg-bubble-container">
                            <div class="qq-msg-bubble typing-anim">正在输入...</div>
                        </div>
                    </div>
                </div>

                <!-- 底部操作区 -->
                <div v-if="isSelecting" class="qq-bottom-bar" style="background: #f9f9f9; align-items: center;">
                    <div @click="deleteSelected" style="color: #ed4956; font-weight: bold;">删除 ({{ selectedIds.length }})</div>
                    <div style="width: 1px; background: #ddd; height: 20px; flex: none;"></div>
                    <div @click="cancelSelect" style="color: #555;">取消</div>
                </div>

                <div v-else class="qq-input-area">
                    <!-- 引用预览悬浮窗 -->
                    <div v-if="quotedMsg" class="quote-preview" style="display: flex; justify-content: space-between;">
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%;">
                            回复: {{ quotedMsg.content }}
                        </span>
                        <span @click="cancelReply" style="font-weight: bold; cursor: pointer; color: #999; padding-left: 10px;">X</span>
                    </div>

                    <div class="qq-input-bar">
                        <textarea v-model="inputText" placeholder="发送消息..."></textarea>
                        <button class="btn-primary" style="background: #007aff !important; color: white !important; border: none !important;" @click="sendMessage">发送</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        // 初始化数据结构
        if (!store.qqData) {
            store.qqData = {
                timePerception: true,
                chats: [
                    {
                        id: 'chat_1',
                        name: 'AI 助手',
                        avatar: '',
                        messages: [
                            { id: 'msg_0', role: 'ai', content: '你好！有什么我可以帮你的？', timestamp: Date.now() - 60000 }
                        ]
                    }
                ]
            };
        }

        const chatList = Vue.computed(function() { return store.qqData.chats; });
        const timePerception = Vue.computed(function() { return store.qqData.timePerception; });
        
        const activeChat = Vue.ref(null);
        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);

        // 菜单与选择状态
        const activeMenuId = Vue.ref(null);
        const isSelecting = Vue.ref(false);
        const selectedIds = Vue.ref([]);
        const quotedMsg = Vue.ref(null);

        // 切换时间感知
        const toggleTimeMode = function() {
            store.qqData.timePerception = !store.qqData.timePerception;
            alert(store.qqData.timePerception ? '时间感知已开启 (实时时间)' : '时间感知已关闭 (模拟连续时间)');
        };

        const openChat = function(chat) {
            activeChat.value = chat;
            cancelSelect();
            cancelReply();
            scrollToBottom();
        };

        const closeChat = function() {
            activeChat.value = null;
        };

        // 长按逻辑
        let touchTimer = null;
        let touchMoved = false;

        const onTouchStart = function(event, msgId) {
            if (isSelecting.value) return;
            touchMoved = false;
            touchTimer = setTimeout(function() {
                if (!touchMoved) {
                    activeMenuId.value = msgId;
                }
            }, 500);
        };

        const onTouchMove = function() {
            touchMoved = true;
            if (touchTimer) clearTimeout(touchTimer);
        };

        const onTouchEnd = function() {
            if (touchTimer) clearTimeout(touchTimer);
        };

        // 选择与删除功能
        const startSelect = function(msg) {
            isSelecting.value = true;
            selectedIds.value = [msg.id];
            activeMenuId.value = null;
        };

        const toggleSelect = function(msg) {
            const index = selectedIds.value.indexOf(msg.id);
            if (index > -1) {
                selectedIds.value.splice(index, 1);
            } else {
                selectedIds.value.push(msg.id);
            }
        };

        const cancelSelect = function() {
            isSelecting.value = false;
            selectedIds.value = [];
        };

        const deleteSelected = function() {
            if (selectedIds.value.length === 0) return cancelSelect();
            if (activeChat.value) {
                activeChat.value.messages = activeChat.value.messages.filter(function(msg) {
                    return !selectedIds.value.includes(msg.id);
                });
            }
            cancelSelect();
        };

        // 回复功能
        const replyMsg = function(msg) {
            quotedMsg.value = msg;
            activeMenuId.value = null;
        };

        const cancelReply = function() {
            quotedMsg.value = null;
        };

        // 滚动到底部
        const scrollToBottom = function() {
            setTimeout(function() {
                const area = window.document.getElementById('chat-scroll-area');
                if (area) {
                    area.scrollTop = area.scrollHeight;
                }
            }, 100);
        };

        // 时间格式化与逻辑计算
        const formatTime = function(ts) {
            const d = new Date(ts);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return hh + ':' + mm;
        };

        const shouldShowTime = function(index) {
            if (!activeChat.value) return false;
            if (index === 0) return true;
            const currentMsg = activeChat.value.messages[index];
            const prevMsg = activeChat.value.messages[index - 1];
            // 超过3分钟显示一次时间
            return (currentMsg.timestamp - prevMsg.timestamp) > 3 * 60 * 1000;
        };

        const getNextTimestamp = function() {
            // 时间感知开：取真实世界当前时间
            if (store.qqData.timePerception) {
                return Date.now();
            }
            
            // 时间感知关：基于上一条消息递增，每次增加 15~45 秒
            // 确保即使 AI 拆分为 3~4 个气泡，总时间差也不会超过 3 分钟
            const msgs = activeChat.value.messages;
            let lastTs = Date.now();
            if (msgs.length > 0) {
                lastTs = msgs[msgs.length - 1].timestamp;
            }
            const increment = Math.floor(Math.random() * 30000) + 15000;
            return lastTs + increment;
        };

        const pushMessage = function(role, content, quoteStr) {
            if (!activeChat.value) return;
            const msgObj = {
                id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                role: role,
                content: content,
                timestamp: getNextTimestamp()
            };
            if (quoteStr) {
                msgObj.quote = quoteStr;
            }
            activeChat.value.messages.push(msgObj);
            scrollToBottom();
        };

        // 消息发送与请求
        const sendMessage = async function() {
            const text = inputText.value.trim();
            if (!text) return;

            let quoteStr = null;
            if (quotedMsg.value) {
                quoteStr = quotedMsg.value.content;
            }

            pushMessage('user', text, quoteStr);
            inputText.value = '';
            quotedMsg.value = null;
            isTyping.value = true;
            scrollToBottom();

            // 构造上下文（限制最近 10 条）
            const history = activeChat.value.messages.slice(-10).map(function(m) {
                return { role: m.role === 'ai' ? 'assistant' : 'user', content: m.content };
            });

            // 调用 AI 接口
            const apiSetting = store.apiSettings && store.apiSettings.main ? store.apiSettings.main : {};
            
            try {
                if (apiSetting.url && apiSetting.key) {
                    const res = await window.fetch(apiSetting.url + '/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + apiSetting.key
                        },
                        body: JSON.stringify({
                            model: apiSetting.model || 'gpt-3.5-turbo',
                            messages: history
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const replyContent = data.choices[0].message.content;
                        // 尝试按双换行拆分成多个气泡，模拟连续发送
                        const segments = replyContent.split('\n\n').filter(function(s) { return s.trim(); });
                        isTyping.value = false;
                        segments.forEach(function(segment, idx) {
                            setTimeout(function() {
                                pushMessage('ai', segment.trim());
                            }, idx * 600);
                        });
                    } else {
                        isTyping.value = false;
                        pushMessage('ai', 'API 响应错误：' + res.status);
                    }
                } else {
                    // 无 API 配置时模拟回复
                    setTimeout(function() {
                        isTyping.value = false;
                        pushMessage('ai', '这是本地模拟回复，请前往设置配置 API。');
                    }, 1000);
                }
            } catch (error) {
                isTyping.value = false;
                pushMessage('ai', '网络或请求错误：' + error.message);
            }
        };

        return {
            store: store,
            chatList: chatList,
            activeChat: activeChat,
            inputText: inputText,
            isTyping: isTyping,
            timePerception: timePerception,
            
            activeMenuId: activeMenuId,
            isSelecting: isSelecting,
            selectedIds: selectedIds,
            quotedMsg: quotedMsg,

            toggleTimeMode: toggleTimeMode,
            openChat: openChat,
            closeChat: closeChat,
            
            onTouchStart: onTouchStart,
            onTouchMove: onTouchMove,
            onTouchEnd: onTouchEnd,
            
            startSelect: startSelect,
            toggleSelect: toggleSelect,
            cancelSelect: cancelSelect,
            deleteSelected: deleteSelected,
            replyMsg: replyMsg,
            cancelReply: cancelReply,
            
            formatTime: formatTime,
            shouldShowTime: shouldShowTime,
            sendMessage: sendMessage
        };
    }
};
