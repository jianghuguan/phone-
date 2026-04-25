/* eslint-disable */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container">
            <!-- 列表页 -->
            <div v-if="currentView === 'list'" style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">
                    <span>消息</span>
                </div>
                <div class="qq-content">
                    <div 
                        v-for="chat in store.chats" 
                        :key="chat.id" 
                        class="qq-contact-item" 
                        @click="openChat(chat)"
                    >
                        <div class="qq-contact-avatar" :style="{ backgroundImage: chat.avatar ? 'url(' + chat.avatar + ')' : 'none', backgroundColor: chat.color }">
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

            <!-- 聊天页 -->
            <div v-else-if="currentView === 'chat'" style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">
                    <span @click="backToList" style="cursor: pointer; color: #007aff;">&lt; 返回</span>
                    <span>{{ currentChat ? currentChat.name : '聊天' }}</span>
                    <span style="width: 40px;"></span>
                </div>
                
                <div class="qq-content" id="qq-chat-box" @click="closeMenu">
                    <div 
                        v-for="msg in currentChat.messages" 
                        :key="msg.id" 
                        class="qq-msg-row" 
                        :class="[msg.role, { 'select-mode': isSelectMode }]"
                        @click="handleMsgClick(msg)"
                    >
                        <!-- 选择模式左侧打钩框 -->
                        <div v-if="isSelectMode" class="qq-msg-checkbox" :class="{ 'checked': selectedMsgs.includes(msg.id) }"></div>

                        <!-- 聊天头像 -->
                        <div class="qq-msg-avatar" :style="msg.role === 'ai' ? { backgroundImage: currentChat.avatar ? 'url(' + currentChat.avatar + ')' : 'none', backgroundColor: currentChat.color } : { backgroundColor: '#007aff' }">
                            <template v-if="msg.role === 'ai' && !currentChat.avatar">{{ currentChat.name.charAt(0) }}</template>
                            <template v-if="msg.role === 'user'">我</template>
                        </div>

                        <!-- 气泡主体与长按事件 -->
                        <div class="msg-bubble-container"
                             @contextmenu.prevent="openMenu(msg.id)" 
                             @touchstart="touchStart($event, msg.id)" 
                             @touchend="touchEnd" 
                             @touchmove="touchMove"
                        >
                            <div class="qq-msg-bubble">
                                <!-- 引用显示的框 -->
                                <div class="quote-box" v-if="msg.quote">{{ msg.quote }}</div>
                                {{ msg.content }}
                            </div>
                            <!-- 长按弹出的文字菜单 -->
                            <div class="msg-menu" v-if="showMenu === msg.id">
                                <span @click.stop="startSelect(msg)">选择</span>
                                <span @click.stop="startReply(msg)">回复</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI 打字动画预留 -->
                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div class="qq-msg-avatar" :style="{ backgroundColor: currentChat.color }">
                            {{ currentChat.name.charAt(0) }}
                        </div>
                        <div class="msg-bubble-container">
                            <div class="qq-msg-bubble typing-anim">正在输入...</div>
                        </div>
                    </div>
                </div>

                <!-- 回复提示栏 (输入框上方) -->
                <div class="qq-reply-bar" v-if="replyingMsg && !isSelectMode">
                    <div class="qq-reply-content">回复：{{ replyingMsg.content }}</div>
                    <div class="qq-reply-close" @click="cancelReply">&times;</div>
                </div>

                <!-- 底部交互区：如果是选择模式则显示批量操作，否则显示输入框 -->
                <div v-if="isSelectMode" class="qq-batch-bar">
                    <div class="qq-batch-btn" @click="cancelSelect">取消</div>
                    <div class="qq-batch-btn danger" @click="deleteSelected">删除</div>
                </div>
                <div v-else class="qq-input-area">
                    <div class="qq-input-bar">
                        <textarea v-model="inputText" placeholder="发送消息..." @keydown.enter.prevent="sendMessage"></textarea>
                        <button class="btn-primary" @click="sendMessage">发送</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;
        const currentView = Vue.ref('list');
        const currentChatId = Vue.ref(null);
        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);

        // 初始化兜底数据
        if (!store.chats) {
            store.chats = [
                { id: '1', name: 'AI 助手', color: '#ff9500', messages: [] }
            ];
        }

        const currentChat = Vue.computed(() => store.chats.find(c => c.id === currentChatId.value));

        // 状态控制：长按菜单、多选、回复
        const showMenu = Vue.ref(null);
        const isSelectMode = Vue.ref(false);
        const selectedMsgs = Vue.ref([]);
        const replyingMsg = Vue.ref(null);

        let touchTimer = null;

        const openChat = (chat) => {
            currentChatId.value = chat.id;
            currentView.value = 'chat';
            cancelSelect();
            cancelReply();
            Vue.nextTick(scrollToBottom);
        };

        const backToList = () => {
            currentView.value = 'list';
            currentChatId.value = null;
        };

        const scrollToBottom = () => {
            const box = document.getElementById('qq-chat-box');
            if (box) box.scrollTop = box.scrollHeight;
        };

        // ========== 交互逻辑：长按、点击 ==========
        const touchStart = (e, id) => {
            if (isSelectMode.value) return;
            touchTimer = setTimeout(() => { showMenu.value = id; }, 500);
        };
        const touchEnd = () => { if (touchTimer) clearTimeout(touchTimer); };
        const touchMove = () => { if (touchTimer) clearTimeout(touchTimer); };
        
        const openMenu = (id) => {
            if (!isSelectMode.value) showMenu.value = id;
        };
        const closeMenu = () => { showMenu.value = null; };

        // ========== 交互逻辑：选择与删除 ==========
        const handleMsgClick = (msg) => {
            if (isSelectMode.value) {
                const idx = selectedMsgs.value.indexOf(msg.id);
                if (idx > -1) selectedMsgs.value.splice(idx, 1);
                else selectedMsgs.value.push(msg.id);
            }
        };

        const startSelect = (msg) => {
            isSelectMode.value = true;
            selectedMsgs.value = [msg.id];
            closeMenu();
        };

        const cancelSelect = () => {
            isSelectMode.value = false;
            selectedMsgs.value = [];
        };

        const deleteSelected = () => {
            if (currentChat.value && selectedMsgs.value.length > 0) {
                currentChat.value.messages = currentChat.value.messages.filter(m => !selectedMsgs.value.includes(m.id));
            }
            cancelSelect();
        };

        // ========== 交互逻辑：回复 ==========
        const startReply = (msg) => {
            replyingMsg.value = msg;
            closeMenu();
        };

        const cancelReply = () => {
            replyingMsg.value = null;
        };

        // ========== 消息发送与 AI 响应 ==========
        const sendMessage = async () => {
            if (!inputText.value.trim() || isTyping.value) return;

            const userText = inputText.value.trim();
            const quoteText = replyingMsg.value ? replyingMsg.value.content : null;
            
            const newMsg = {
                id: Date.now().toString(),
                role: 'user',
                content: userText,
                quote: quoteText // 附带引用
            };

            currentChat.value.messages.push(newMsg);
            inputText.value = '';
            replyingMsg.value = null; // 发送后清空回复状态
            Vue.nextTick(scrollToBottom);

            await fetchAiResponse();
        };

        const fetchAiResponse = async () => {
            isTyping.value = true;
            try {
                const config = store.apiSettings && store.apiSettings.main.url ? store.apiSettings.main : {
                    url: 'https://api.openai.com',
                    key: '',
                    model: 'gpt-3.5-turbo'
                };
                
                if (!config.key) {
                    throw new Error('未配置 API Key，请前往设置中填写');
                }

                // 【内置核心提示词更新】包括了时间感知的约束
                const systemPrompt = `你是一个有用的助手。
如果是聊天中途关闭了时间感知模式，要紧接着上一次的时间开始，每次回复的时间间隔不超过3分钟：例如ai回复的同一次内，第一个气泡时间为10:03，本次回复的最后一个气泡的时间不超过10:06。`;

                // 拼装历史消息，附带引用信息让 AI 知道你在回复哪句
                const messagesPayload = [
                    { role: 'system', content: systemPrompt },
                    ...currentChat.value.messages.map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.quote ? `[用户引用了: "${m.quote}"]\n${m.content}` : m.content
                    }))
                ];

                const res = await fetch(config.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.key}`
                    },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: messagesPayload
                    })
                });

                if (!res.ok) throw new Error('网络请求失败');
                
                const data = await res.json();
                const aiReply = data.choices[0].message.content;

                currentChat.value.messages.push({
                    id: Date.now().toString(),
                    role: 'ai',
                    content: aiReply
                });

            } catch (error) {
                currentChat.value.messages.push({
                    id: Date.now().toString(),
                    role: 'ai',
                    content: '发送失败: ' + error.message
                });
            } finally {
                isTyping.value = false;
                Vue.nextTick(scrollToBottom);
            }
        };

        return { 
            store, currentView, currentChat, currentChatId, inputText, isTyping,
            showMenu, isSelectMode, selectedMsgs, replyingMsg,
            openChat, backToList, touchStart, touchMove, touchEnd, openMenu, closeMenu,
            handleMsgClick, startSelect, cancelSelect, deleteSelected, startReply, cancelReply,
            sendMessage
        };
    }
};
