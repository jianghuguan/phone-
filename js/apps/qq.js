/* eslint-disable */
/* global Vue, window, document */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @click="closeMenu">
            <!-- 列表界面 -->
            <template v-if="!activeContact">
                <div class="qq-header">
                    <span>消息</span>
                    <span 
                        @click="store.timeSensing = !store.timeSensing" 
                        style="font-size:12px; font-weight:normal; cursor:pointer;"
                        :style="{ color: store.timeSensing !== false ? '#0095f6' : '#999' }"
                    >
                        {{ store.timeSensing !== false ? '时感: 开启' : '时感: 关闭' }}
                    </span>
                </div>
                <div class="qq-content">
                    <div class="qq-contact-item" v-for="c in store.contacts" :key="c.id" @click="openChat(c)">
                        <div class="qq-contact-avatar">{{ c.avatar }}</div>
                        <div class="qq-contact-info">
                            <div class="qq-contact-name">{{ c.name }}</div>
                            <div class="qq-contact-preview">
                                {{ c.messages.length ? c.messages[c.messages.length - 1].text : '暂无消息' }}
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- 聊天界面 -->
            <template v-else>
                <!-- 头部 -->
                <div class="qq-header">
                    <div v-if="!isSelecting" @click="activeContact = null; closeMenu()" style="cursor:pointer; color:#0095f6;">
                        &lt; 返回
                    </div>
                    <div v-else @click="cancelSelect" style="cursor:pointer; color:#000;">取消</div>

                    <div>{{ activeContact.name }}</div>

                    <div v-if="!isSelecting" style="width: 40px;"></div>
                    <div v-else @click="deleteSelected" style="cursor:pointer; color:#ed4956; font-size:14px;">
                        删除({{ selectedIds.length }})
                    </div>
                </div>

                <!-- 聊天内容区 -->
                <div class="qq-content" id="qq-chat-list" style="position:relative;">
                    <div 
                        v-for="msg in activeContact.messages" 
                        :key="msg.id" 
                        class="qq-msg-row" 
                        :class="msg.sender"
                    >
                        <!-- 选择模式下的复选框 -->
                        <div 
                            v-if="isSelecting" 
                            @click.stop="toggleSelect(msg.id)" 
                            style="position:absolute; left:16px; top:50%; transform:translateY(-50%); z-index:10; cursor:pointer;"
                        >
                            <div 
                                style="width:22px; height:22px; border-radius:50%; border:1px solid #ccc; background:#fff; display:flex; align-items:center; justify-content:center;" 
                                :style="selectedIds.includes(msg.id) ? { background:'#0095f6', borderColor:'#0095f6' } : {}"
                            >
                                <span v-if="selectedIds.includes(msg.id)" style="color:#fff; font-size:14px; line-height:1;">✓</span>
                            </div>
                        </div>

                        <!-- 头像和气泡 -->
                        <div class="msg-bubble-container" :style="isSelecting && msg.sender === 'ai' ? { marginLeft: '35px', transition: '0.2s' } : { transition: '0.2s' }">
                            <div class="qq-msg-avatar" v-if="msg.sender === 'ai'">{{ activeContact.avatar }}</div>

                            <div style="display:flex; flex-direction:column; position:relative;" :style="msg.sender === 'user' ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }">
                                <div class="bubble-time">{{ msg.time }}</div>

                                <!-- 长按文字菜单 -->
                                <div v-if="showMenuId === msg.id" class="msg-menu" style="top: -35px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                                    <span @click.stop="startSelect(msg.id)">选择</span>
                                    <span style="color:#eee; font-size:12px;">|</span>
                                    <span @click.stop="startReply(msg)">回复</span>
                                </div>

                                <div 
                                    class="qq-msg-bubble"
                                    @touchstart="handleTouchStart($event, msg.id)"
                                    @touchmove="handleTouchMove"
                                    @touchend="handleTouchEnd"
                                    @mousedown="handleTouchStart($event, msg.id)"
                                    @mousemove="handleTouchMove"
                                    @mouseup="handleTouchEnd"
                                    @mouseleave="handleTouchEnd"
                                >
                                    <!-- 引用/回复的框 -->
                                    <div v-if="msg.quote" class="quote-box">{{ msg.quote }}</div>
                                    <div style="white-space: pre-wrap; word-break: break-all;">{{ msg.text }}</div>
                                </div>
                            </div>

                            <div class="qq-msg-avatar" v-if="msg.sender === 'user'">我</div>
                        </div>
                    </div>
                    
                    <div v-if="isTyping" class="qq-msg-row ai" style="margin-top:10px;">
                        <div class="msg-bubble-container">
                            <div class="qq-msg-avatar">{{ activeContact.avatar }}</div>
                            <div class="qq-msg-bubble typing-anim">对方正在输入...</div>
                        </div>
                    </div>
                </div>

                <!-- 输入区 -->
                <div class="qq-input-area" v-if="!isSelecting">
                    <!-- 回复预览区 -->
                    <div v-if="replyingTo" class="quote-preview">
                        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            回复：{{ replyingTo.text }}
                        </div>
                        <span @click="replyingTo = null" style="font-size:20px; padding:0 10px; cursor:pointer; color:#999; line-height:1;">×</span>
                    </div>

                    <div class="qq-input-bar">
                        <textarea 
                            v-model="inputText" 
                            placeholder="发消息..." 
                            @keydown.enter.prevent="sendMsg"
                        ></textarea>
                        <button @click="sendMsg">发送</button>
                    </div>
                </div>
            </template>
        </div>
    `,
    setup() {
        const { ref, nextTick } = Vue;
        const store = window.store;

        // 初始化基础数据
        if (!store.contacts) {
            store.contacts = [
                { id: 'contact_1', name: 'AI助手', avatar: '🤖', messages: [] }
            ];
        }
        if (store.timeSensing === undefined) {
            store.timeSensing = true;
        }

        const activeContact = ref(null);
        const inputText = ref('');
        const isTyping = ref(false);

        // 长按、菜单、选择状态
        const showMenuId = ref(null);
        const isSelecting = ref(false);
        const selectedIds = ref([]);
        const replyingTo = ref(null);

        let pressTimer = null;
        let isMoving = false;

        const openChat = (contact) => {
            activeContact.value = contact;
            setTimeout(scrollToBottom, 100);
        };

        const closeMenu = () => {
            showMenuId.value = null;
        };

        const handleTouchStart = (e, id) => {
            if (isSelecting.value) return;
            isMoving = false;
            pressTimer = setTimeout(() => {
                showMenuId.value = id;
            }, 500); // 长按500毫秒触发
        };

        const handleTouchMove = () => {
            isMoving = true;
            if (pressTimer) clearTimeout(pressTimer);
        };

        const handleTouchEnd = () => {
            if (pressTimer) clearTimeout(pressTimer);
        };

        // 触发选择模式
        const startSelect = (id) => {
            isSelecting.value = true;
            selectedIds.value = [id];
            showMenuId.value = null;
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
            if (!selectedIds.value.length) return;
            activeContact.value.messages = activeContact.value.messages.filter(
                m => !selectedIds.value.includes(m.id)
            );
            cancelSelect();
        };

        // 触发回复模式
        const startReply = (msg) => {
            replyingTo.value = msg;
            showMenuId.value = null;
        };

        const scrollToBottom = () => {
            nextTick(() => {
                const el = document.getElementById('qq-chat-list');
                if (el) el.scrollTop = el.scrollHeight;
            });
        };

        // --- 时间生成逻辑 ---
        const getNextTime = (baseTimeStr, addMinutes) => {
            if (!baseTimeStr) return "10:00";
            let parts = baseTimeStr.split(':');
            let h = parseInt(parts[0], 10) || 0;
            let m = parseInt(parts[1], 10) || 0;
            m += addMinutes;
            h += Math.floor(m / 60);
            m = m % 60;
            h = h % 24;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };

        const generateUserTime = () => {
            if (store.timeSensing !== false) {
                const now = new Date();
                return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            } else {
                const msgs = activeContact.value.messages;
                const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                return lastMsg ? getNextTime(lastMsg.time, 1) : "10:00";
            }
        };

        const generateAiBubbleTime = (userMsgTime, bubbleIndex) => {
            if (store.timeSensing !== false) {
                const now = new Date();
                return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            } else {
                // 关闭时感：第一条AI气泡在用户消息后1分钟。
                // 若拆分为多个气泡，同一批次内的时间间隔总跨度不超过 3 分钟。
                let aiStart = getNextTime(userMsgTime, 1);
                let spread = Math.min(3, bubbleIndex); // 控制跨度封顶 +3分钟
                return getNextTime(aiStart, spread);
            }
        };

        // API 交互
        const fetchAi = async (text) => {
            const api = store.apiSettings && store.apiSettings.main ? store.apiSettings.main : {};
            if (!api.url || !api.key) return "系统提示：请先在主界面返回桌面，去【设置】App配置主API地址和Key";

            const url = api.url.replace(/\/+$/, '') + '/v1/chat/completions';
            const msgs = activeContact.value.messages.slice(-6).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
            msgs.push({ role: 'user', content: text });

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.key}` },
                    body: JSON.stringify({ model: api.model || 'gpt-3.5-turbo', messages: msgs })
                });
                if (!res.ok) {
                    const err = await res.text();
                    return "API请求失败: " + err.slice(0, 50);
                }
                const data = await res.json();
                return data.choices[0].message.content;
            } catch (e) {
                return "网络错误: " + e.message;
            }
        };

        const sendMsg = async () => {
            if (!inputText.value.trim()) return;
            const text = inputText.value.trim();
            const quoteText = replyingTo.value ? replyingTo.value.text : null;

            const userMsg = {
                id: 'msg_' + Date.now(),
                text: text,
                sender: 'user',
                time: generateUserTime(),
                quote: quoteText
            };
            
            activeContact.value.messages.push(userMsg);
            inputText.value = '';
            replyingTo.value = null; // 发送后清空回复预览
            scrollToBottom();

            isTyping.value = true;
            const replyText = await fetchAi(text);
            isTyping.value = false;

            // AI 回复按换行切割成多个气泡
            const bubbles = replyText.split('\n').filter(s => s.trim());
            bubbles.forEach((bText, idx) => {
                activeContact.value.messages.push({
                    id: 'msg_' + Date.now() + '_' + idx,
                    text: bText.trim(),
                    sender: 'ai',
                    time: generateAiBubbleTime(userMsg.time, idx),
                    quote: null
                });
            });

            scrollToBottom();
        };

        return {
            store, activeContact, inputText, isTyping,
            showMenuId, isSelecting, selectedIds, replyingTo,
            openChat, closeMenu,
            handleTouchStart, handleTouchMove, handleTouchEnd,
            startSelect, toggleSelect, cancelSelect, deleteSelected, startReply,
            sendMsg
        };
    }
};
