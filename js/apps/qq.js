/* eslint-disable */
/* global Vue, window, document */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @click="closeMenu">
            <!-- 头部 -->
            <div class="qq-header">
                <span v-if="currentView === 'chat'" @click="currentView = 'list'" style="cursor:pointer; color:#007aff;">← 返回</span>
                <span v-else>消息</span>
                <span>{{ currentView === 'chat' ? activeContact.name : '列表' }}</span>
                <span style="width:40px;"></span>
            </div>

            <!-- 列表视图 -->
            <div v-if="currentView === 'list'" class="qq-content">
                <div v-for="contact in contacts" :key="contact.id" class="qq-contact-item" @click="openChat(contact)">
                    <div class="qq-contact-avatar" :style="{ backgroundImage: 'url(' + contact.avatar + ')' }">
                        <template v-if="!contact.avatar">{{ contact.name[0] }}</template>
                    </div>
                    <div class="qq-contact-info">
                        <div class="qq-contact-name">{{ contact.name }}</div>
                        <div class="qq-contact-preview">
                            {{ contact.messages.length > 0 ? contact.messages[contact.messages.length - 1].content : '暂无消息' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 聊天视图 -->
            <div v-if="currentView === 'chat'" class="qq-content" id="chat-scroll-area">
                <div style="padding: 15px 0;">
                    <div
                        v-for="msg in activeContact.messages"
                        :key="msg.id"
                        class="qq-msg-row"
                        :class="{ user: !msg.isAi, ai: msg.isAi, selectable: isSelecting }"
                        @click="isSelecting ? toggleSelection(msg) : null"
                    >
                        <!-- 多选框 -->
                        <div v-if="isSelecting" class="msg-checkbox" :class="{ checked: selectedMsgIds.has(msg.id) }"></div>

                        <!-- 头像 -->
                        <div class="qq-msg-avatar" :style="{ backgroundImage: msg.isAi ? 'url(' + activeContact.avatar + ')' : 'none', backgroundColor: msg.isAi ? 'transparent' : '#007aff' }">
                            <template v-if="!msg.isAi">我</template>
                        </div>

                        <!-- 气泡区 -->
                        <div class="msg-bubble-container">
                            <div class="bubble-time" v-if="!isSelecting">{{ msg.time }}</div>

                            <div
                                class="qq-msg-bubble"
                                @touchstart="handleTouchStart($event, msg.id)"
                                @touchend="handleTouchEnd"
                                @contextmenu.prevent
                            >
                                <!-- 长按菜单：文字版 -->
                                <div v-if="activeMenuId === msg.id && !isSelecting" class="msg-menu">
                                    <span @click.stop="startSelection(msg)">选择</span>
                                    <span @click.stop="startReply(msg)">回复</span>
                                </div>

                                <!-- 引用内容展示 -->
                                <div v-if="msg.quote" class="quote-box">
                                    <div class="quote-name">{{ msg.quote.name }}:</div>
                                    <div>{{ msg.quote.content }}</div>
                                </div>

                                {{ msg.content }}
                            </div>
                        </div>
                    </div>
                    
                    <!-- 正在输入动画 -->
                    <div v-if="isTyping" class="qq-msg-row ai" style="margin-top: 10px;">
                        <div class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + activeContact.avatar + ')' }"></div>
                        <div class="msg-bubble-container">
                            <div class="qq-msg-bubble typing-anim">正在输入...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部输入栏 / 选择栏 -->
            <div v-if="currentView === 'chat'">
                <!-- 选择模式底部操作栏 -->
                <div v-if="isSelecting" class="qq-selection-bar">
                    <button @click="deleteSelected" style="color:#ff3b30; border-color:#ff3b30;">删除选中</button>
                    <button @click="cancelSelection">取消</button>
                </div>
                
                <!-- 正常输入模式 -->
                <div v-else class="qq-input-area">
                    <!-- 回复预览条 -->
                    <div v-if="replyingToMsg" class="reply-preview-bar">
                        <div class="reply-preview-content">
                            回复 {{ replyingToMsg.isAi ? activeContact.name : '我' }}: {{ replyingToMsg.content }}
                        </div>
                        <div class="reply-preview-close" @click="cancelReply">×</div>
                    </div>

                    <div class="qq-input-bar">
                        <textarea v-model="inputText" placeholder="发送消息..." @input="autoResize" ref="msgInput"></textarea>
                        <button @click="sendMessage">发送</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        // 初始化联系人数据
        if (!store.qqData) {
            store.qqData = {
                contacts: [
                    { id: '1', name: 'AI 助手', avatar: '', messages: [] },
                    { id: '2', name: '测试好友', avatar: '', messages: [] }
                ]
            };
        }

        const contacts = Vue.ref(store.qqData.contacts);
        const currentView = Vue.ref('list');
        const activeContact = Vue.ref(null);
        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);
        const msgInput = Vue.ref(null);

        // 长按菜单状态
        const activeMenuId = Vue.ref(null);
        let touchTimer = null;

        // 选择与回复状态
        const isSelecting = Vue.ref(false);
        const selectedMsgIds = Vue.ref(new Set());
        const replyingToMsg = Vue.ref(null);

        // 格式化当前时间为 HH:mm
        const formatTime = (date) => {
            const h = String(date.getHours()).padStart(2, '0');
            const m = String(date.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        };

        // 获取最后一条消息的时间对象（用于时间感知关闭时的推演）
        const getLastMessageTime = () => {
            const msgs = activeContact.value.messages;
            const d = new Date();
            if (!msgs || msgs.length === 0) return d;
            
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.time) {
                const [h, m] = lastMsg.time.split(':').map(Number);
                d.setHours(h, m, 0, 0);
            }
            return d;
        };

        const openChat = (contact) => {
            activeContact.value = contact;
            currentView.value = 'chat';
            cancelSelection();
            cancelReply();
            Vue.nextTick(scrollToBottom);
        };

        const autoResize = () => {
            const el = msgInput.value;
            if (el) {
                el.style.height = '36px';
                el.style.height = el.scrollHeight + 'px';
            }
        };

        const scrollToBottom = () => {
            const area = document.getElementById('chat-scroll-area');
            if (area) area.scrollTop = area.scrollHeight;
        };

        const handleTouchStart = (e, id) => {
            if (isSelecting.value) return;
            touchTimer = setTimeout(() => {
                activeMenuId.value = id;
            }, 600); // 600ms长按
        };

        const handleTouchEnd = () => {
            if (touchTimer) clearTimeout(touchTimer);
        };

        const closeMenu = () => {
            activeMenuId.value = null;
        };

        // --- 选择删除功能 ---
        const startSelection = (msg) => {
            isSelecting.value = true;
            selectedMsgIds.value.add(msg.id);
            activeMenuId.value = null;
        };

        const toggleSelection = (msg) => {
            if (selectedMsgIds.value.has(msg.id)) {
                selectedMsgIds.value.delete(msg.id);
            } else {
                selectedMsgIds.value.add(msg.id);
            }
        };

        const deleteSelected = () => {
            if (selectedMsgIds.value.size === 0) {
                cancelSelection();
                return;
            }
            activeContact.value.messages = activeContact.value.messages.filter(
                m => !selectedMsgIds.value.has(m.id)
            );
            cancelSelection();
        };

        const cancelSelection = () => {
            isSelecting.value = false;
            selectedMsgIds.value.clear();
        };

        // --- 回复功能 ---
        const startReply = (msg) => {
            replyingToMsg.value = msg;
            activeMenuId.value = null;
            if (msgInput.value) msgInput.value.focus();
        };

        const cancelReply = () => {
            replyingToMsg.value = null;
        };

        // --- 核心发信与API流 ---
        const sendMessage = async () => {
            const text = inputText.value.trim();
            if (!text) return;

            // 处理用户发信时间
            // 假设 settingApp 里有一个统一的时间感知开关 store.settings.timePerception，默认开启
            const timePerception = store.settings?.timePerception !== false;
            let userMsgTimeStr;
            
            if (timePerception) {
                userMsgTimeStr = formatTime(new Date());
            } else {
                const baseDate = getLastMessageTime();
                baseDate.setMinutes(baseDate.getMinutes() + 1); // 顺延1分钟
                userMsgTimeStr = formatTime(baseDate);
            }

            // 构建用户消息
            const newMsg = {
                id: Date.now().toString(),
                isAi: false,
                content: text,
                time: userMsgTimeStr,
                quote: replyingToMsg.value ? {
                    name: replyingToMsg.value.isAi ? activeContact.value.name : '我',
                    content: replyingToMsg.value.content
                } : null
            };

            activeContact.value.messages.push(newMsg);
            inputText.value = '';
            cancelReply();
            Vue.nextTick(() => {
                autoResize();
                scrollToBottom();
            });

            isTyping.value = true;
            Vue.nextTick(scrollToBottom);

            // 模拟 API 调用（依赖 setting.js 中的主配置）
            let aiResponseText = '';
            try {
                const config = store.apiSettings?.main || {};
                if (!config.url || !config.key) {
                    aiResponseText = "请先在设置中配置 API 接口和密钥。";
                } else {
                    const res = await fetch(config.url + '/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${config.key}`
                        },
                        body: JSON.stringify({
                            model: config.model || 'gpt-3.5-turbo',
                            messages: [{ role: 'user', content: text }]
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        aiResponseText = data.choices[0].message.content;
                    } else {
                        aiResponseText = "网络异常或配置错误: " + res.status;
                    }
                }
            } catch (err) {
                aiResponseText = "请求失败，请检查网络和 API 配置。";
            }

            isTyping.value = false;

            // --- 处理AI分段回复及时间间隔 ---
            // 根据段落拆分AI消息为多个气泡
            let bubbles = aiResponseText.split('\n').filter(t => t.trim().length > 0);
            if (bubbles.length === 0) bubbles = ['(空)'];

            // 获取用户刚才发出的消息时间，作为AI回复的时间基准
            const aiBaseDate = getLastMessageTime(); 

            bubbles.forEach((bubbleText, index) => {
                let aiMsgTimeStr;
                if (timePerception) {
                    // 开启时间感知，使用真实时间
                    aiMsgTimeStr = formatTime(new Date());
                } else {
                    // 关闭时间感知：
                    // 首个气泡时间 = 用户基准时间 + 1分钟
                    // 最后一个气泡 = 首个气泡时间 + 最多 2分钟 (即总跨度 <= 3分钟)
                    // 中间的气泡按比例均分
                    let offsetMinutes = 1; // 默认顺延 1 分钟
                    if (bubbles.length > 1) {
                        // 利用 index / (长度 - 1) 计算出 0 到 1 的进度，乘以 2 (最大附加延时)
                        const spread = (index / (bubbles.length - 1)) * 2;
                        offsetMinutes = 1 + spread; // 结果为 1 到 3 之间
                    }
                    const d = new Date(aiBaseDate.getTime() + offsetMinutes * 60000);
                    aiMsgTimeStr = formatTime(d);
                }

                activeContact.value.messages.push({
                    id: Date.now().toString() + '_' + index,
                    isAi: true,
                    content: bubbleText.trim(),
                    time: aiMsgTimeStr
                });
            });

            Vue.nextTick(scrollToBottom);
        };

        return {
            store,
            contacts,
            currentView,
            activeContact,
            inputText,
            isTyping,
            msgInput,
            activeMenuId,
            isSelecting,
            selectedMsgIds,
            replyingToMsg,
            openChat,
            autoResize,
            handleTouchStart,
            handleTouchEnd,
            closeMenu,
            startSelection,
            toggleSelection,
            deleteSelected,
            cancelSelection,
            startReply,
            cancelReply,
            sendMessage
        };
    }
};
