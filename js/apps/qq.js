/* eslint-disable */
/* global Vue */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @click="closeMenu">
            <div class="qq-header">
                <span style="cursor:pointer;" @click="goBack">＜ 返回</span>
                <span>{{ currentChat ? currentChat.name : '聊天' }}</span>
                <span style="width: 50px;"></span>
            </div>

            <!-- 聊天列表界面 -->
            <div v-if="!currentChat" class="qq-content">
                <div 
                    v-for="chat in chats" 
                    :key="chat.id" 
                    class="qq-contact-item" 
                    @click="openChat(chat)"
                >
                    <div class="qq-contact-avatar" :style="{ backgroundImage: 'url(' + chat.avatar + ')' }">
                        <template v-if="!chat.avatar">{{ chat.name.charAt(0) }}</template>
                    </div>
                    <div class="qq-contact-info">
                        <div class="qq-contact-name">{{ chat.name }}</div>
                        <div class="qq-contact-preview">
                            {{ chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].content : '暂无消息...' }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 具体聊天界面 -->
            <div v-else class="qq-content" style="display: flex; flex-direction: column;" ref="msgListRef">
                <div style="flex:1; overflow-y:auto; padding: 15px 0;">
                    <div v-for="msg in currentChat.messages" :key="msg.id" class="qq-msg-wrapper">
                        
                        <!-- 选择模式下的复选框 -->
                        <div v-if="selectMode" class="msg-checkbox" @click.stop="toggleSelect(msg.id)">
                            <div class="checkbox-circle" :class="{ checked: selectedIds.includes(msg.id) }"></div>
                        </div>

                        <div 
                            class="qq-msg-row" 
                            :class="msg.role" 
                            @touchstart="handleTouchStart(msg, $event)" 
                            @touchmove="handleTouchMove" 
                            @touchend="handleTouchEnd" 
                            @contextmenu.prevent
                        >
                            <div v-if="msg.role === 'ai'" class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + currentChat.avatar + ')' }">
                                <template v-if="!currentChat.avatar">AI</template>
                            </div>
                            
                            <div class="msg-bubble-container" style="position:relative;">
                                <!-- 长按弹出的文字菜单 -->
                                <div v-if="activeMenuMsgId === msg.id" class="msg-menu" @click.stop>
                                    <span @click.stop="startSelect(msg)">选择</span>
                                    <div class="menu-divider"></div>
                                    <span @click.stop="startReply(msg)">回复</span>
                                </div>
                                
                                <div class="qq-msg-bubble">
                                    <!-- 回复引用的消息框 -->
                                    <div v-if="msg.quote" class="quote-box">{{ msg.quote }}</div>
                                    {{ msg.content }}
                                </div>
                            </div>
                            
                            <div v-if="msg.role === 'user'" class="qq-msg-avatar" style="background:#007aff;">我</div>
                        </div>
                    </div>
                    
                    <div v-if="isTyping" class="qq-msg-wrapper">
                        <div class="qq-msg-row ai">
                            <div class="qq-msg-avatar" :style="{ backgroundImage: 'url(' + currentChat.avatar + ')' }">
                                <template v-if="!currentChat.avatar">AI</template>
                            </div>
                            <div class="msg-bubble-container">
                                <div class="qq-msg-bubble typing-anim">对方正在输入...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部操作区 -->
            <template v-if="currentChat">
                <!-- 多选模式底部栏 -->
                <div v-if="selectMode" class="qq-bottom-action-bar">
                    <button class="btn-primary" style="padding: 8px 24px;" @click="cancelSelect">取消</button>
                    <button class="btn-danger" style="padding: 8px 24px;" :disabled="selectedIds.length === 0" @click="deleteSelected">
                        删除 ({{ selectedIds.length }})
                    </button>
                </div>

                <!-- 正常输入区 -->
                <div v-else class="qq-input-area">
                    <!-- 回复消息悬浮提示 -->
                    <div v-if="replyingMsg" class="reply-preview-bar">
                        <div class="reply-text">
                            回复 {{ replyingMsg.role === 'user' ? '我' : currentChat.name }}：{{ replyingMsg.content }}
                        </div>
                        <div class="reply-close" @click="cancelReply">✕</div>
                    </div>
                    <div class="qq-input-bar">
                        <textarea v-model="inputText" placeholder="发送消息..."></textarea>
                        <button class="btn-primary" @click="sendMessage" :disabled="!inputText.trim() || isTyping">发送</button>
                    </div>
                </div>
            </template>
        </div>
    `,
    setup() {
        const store = window.store;
        const chats = Vue.ref([
            { id: 1, name: 'AI 助手', avatar: '', messages: [] }
        ]);
        const currentChat = Vue.ref(null);
        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);
        const msgListRef = Vue.ref(null);

        // 交互状态
        const activeMenuMsgId = Vue.ref(null);
        const selectMode = Vue.ref(false);
        const selectedIds = Vue.ref([]);
        const replyingMsg = Vue.ref(null);
        let pressTimer = null;

        const openChat = (chat) => {
            currentChat.value = chat;
            scrollToBottom();
        };

        const goBack = () => {
            currentChat.value = null;
            cancelSelect();
            cancelReply();
        };

        // 长按逻辑
        const handleTouchStart = (msg, event) => {
            if (selectMode.value) return; 
            closeMenu();
            pressTimer = setTimeout(() => {
                activeMenuMsgId.value = msg.id;
            }, 600); // 长按600ms
        };

        const handleTouchMove = () => {
            if (pressTimer) clearTimeout(pressTimer);
        };

        const handleTouchEnd = () => {
            if (pressTimer) clearTimeout(pressTimer);
        };

        const closeMenu = () => {
            activeMenuMsgId.value = null;
        };

        // 菜单功能
        const startSelect = (msg) => {
            selectMode.value = true;
            selectedIds.value = [msg.id];
            closeMenu();
        };

        const startReply = (msg) => {
            replyingMsg.value = msg;
            closeMenu();
        };

        const toggleSelect = (id) => {
            const index = selectedIds.value.indexOf(id);
            if (index > -1) {
                selectedIds.value.splice(index, 1);
            } else {
                selectedIds.value.push(id);
            }
        };

        const cancelSelect = () => {
            selectMode.value = false;
            selectedIds.value = [];
        };

        const cancelReply = () => {
            replyingMsg.value = null;
        };

        const deleteSelected = () => {
            if (!currentChat.value) return;
            currentChat.value.messages = currentChat.value.messages.filter(
                msg => !selectedIds.value.includes(msg.id)
            );
            cancelSelect();
        };

        const scrollToBottom = () => {
            Vue.nextTick(() => {
                if (msgListRef.value) {
                    const container = msgListRef.value.children[0];
                    if (container) container.scrollTop = container.scrollHeight;
                }
            });
        };

        const sendMessage = async () => {
            if (!inputText.value.trim() || !currentChat.value) return;

            const userText = inputText.value.trim();
            const quoteText = replyingMsg.value ? replyingMsg.value.content : null;

            const newUserMsg = {
                id: Date.now(),
                role: 'user',
                content: userText,
                quote: quoteText // 保存引用的内容
            };
            
            currentChat.value.messages.push(newUserMsg);
            inputText.value = '';
            cancelReply();
            scrollToBottom();
            isTyping.value = true;

            // 构造传递给 API 的历史消息
            // 植入时间感知的核心提示词
            const systemPrompt = "你是一个贴心的聊天伴侣。\n" + 
                "【重要要求】：如果是聊天中途关闭了时间感知模式，要紧接着上一次的时间开始，每次回复的时间间隔不超过3分钟：例如ai回复的同一次内，第一个气泡时间为10:03，本次回复的最后一个气泡的时间不超过10:06。";

            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...currentChat.value.messages.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: m.quote ? `[引用了消息: ${m.quote}]\n${m.content}` : m.content
                }))
            ];

            try {
                const config = store.apiSettings.main;
                if (!config.url || !config.key) {
                    throw new Error("请先在设置中配置 API URL 和 Key");
                }

                const response = await fetch(config.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.key}`
                    },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: apiMessages
                    })
                });

                if (!response.ok) throw new Error("API 请求失败");
                const data = await response.json();
                const aiReply = data.choices[0].message.content;

                currentChat.value.messages.push({
                    id: Date.now() + 1,
                    role: 'ai',
                    content: aiReply,
                    quote: null
                });
            } catch (error) {
                currentChat.value.messages.push({
                    id: Date.now() + 1,
                    role: 'ai',
                    content: '发送失败: ' + error.message,
                    quote: null
                });
            } finally {
                isTyping.value = false;
                scrollToBottom();
            }
        };

        return {
            chats, currentChat, inputText, isTyping, msgListRef,
            activeMenuMsgId, selectMode, selectedIds, replyingMsg,
            openChat, goBack, handleTouchStart, handleTouchMove, handleTouchEnd, closeMenu,
            startSelect, startReply, toggleSelect, cancelSelect, cancelReply, deleteSelected,
            sendMessage
        };
    }
};
