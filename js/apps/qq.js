/* eslint-disable */
/* global Vue, window, document, fetch */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container">
            <!-- 列表页 -->
            <div v-if="!activeContact" style="height: 100%; display: flex; flex-direction: column;">
                <div class="qq-header">
                    <span>消息</span>
                    <span @click="showAddModal = true" style="cursor:pointer; font-size: 24px; line-height: 1;">+</span>
                </div>
                <div class="qq-content">
                    <div v-if="!store.contacts || store.contacts.length === 0" style="text-align: center; color: #999; padding: 30px; font-size: 14px;">
                        点击右上角 + 添加联系人
                    </div>
                    <div v-for="contact in store.contacts" :key="contact.id" class="qq-contact-item" @click="openChat(contact)">
                        <div class="qq-contact-avatar" :style="{ backgroundImage: contact.avatar ? 'url(' + contact.avatar + ')' : 'none' }">
                            <span v-if="!contact.avatar">{{ contact.name[0] }}</span>
                        </div>
                        <div class="qq-contact-info">
                            <div class="qq-contact-name">{{ contact.name }}</div>
                            <div class="qq-contact-preview">
                                <span v-if="contact.messages && contact.messages.length > 0">
                                    {{ contact.messages[contact.messages.length - 1].content }}
                                </span>
                                <span v-else>暂无消息</span>
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
            <div v-else style="height: 100%; display: flex; flex-direction: column; background: #f4f4f4;">
                <div class="qq-header" style="background:#f4f4f4; border-bottom: 1px solid #e0e0e0;">
                    <span @click="closeChat" style="cursor: pointer; font-size: 20px;">&lt;</span>
                    <span>{{ activeContact.name }}</span>
                    <span @click="showProfile = true" style="cursor:pointer; font-size: 20px;">≡</span>
                </div>
                
                <div class="qq-content" id="chat-box" @click="handleBoxClick" style="background:#f4f4f4; padding-top: 15px;">
                    <div v-for="msg in activeContact.messages" :key="msg.id" :class="['qq-msg-row', msg.role]">
                         
                        <!-- 多选框：点击整行也能触发选中 -->
                        <div v-if="isSelectMode" class="msg-checkbox" @click.stop="toggleSelect(msg.id)">
                            <div :class="['checkbox-inner', { checked: selectedIds.includes(msg.id) }]"></div>
                        </div>

                        <!-- 头像 AI -->
                        <div v-if="msg.role === 'ai'" class="qq-msg-avatar" :style="{ backgroundImage: activeContact.avatar ? 'url(' + activeContact.avatar + ')' : 'none' }">
                            <span v-if="!activeContact.avatar">{{ activeContact.name[0] }}</span>
                        </div>

                        <!-- 气泡容器 -->
                        <div class="msg-bubble-container"
                             @touchstart="handleTouchStart($event, msg)" 
                             @touchend="handleTouchEnd" 
                             @contextmenu.prevent="showMenu($event, msg)">
                            
                            <!-- 长按菜单：改为纯文字 -->
                            <div v-if="activeMenuId === msg.id && !isSelectMode" class="msg-menu">
                                <span @click.stop="enterSelectMode(msg)" style="font-size:14px; padding: 2px 6px;">选择</span>
                                <span @click.stop="setReply(msg)" style="font-size:14px; padding: 2px 6px;">回复</span>
                            </div>

                            <!-- 气泡本体 -->
                            <div :class="['qq-msg-bubble', { 'typing-anim': msg.isTyping }]">
                                <div v-if="msg.quote" class="quote-box">{{ msg.quote }}</div>
                                <div style="white-space: pre-wrap;">{{ msg.content }}</div>
                            </div>
                        </div>

                        <!-- 头像 用户 -->
                        <div v-if="msg.role === 'user'" class="qq-msg-avatar" style="background: #007aff;">我</div>
                    </div>
                </div>

                <!-- 底部输入或操作栏 -->
                <div v-if="!isSelectMode" class="qq-input-area" style="background:#f4f4f4;">
                    <!-- 回复预览区（显示在输入框上方） -->
                    <div v-if="replyTarget" class="quote-preview">
                        <span style="flex:1" class="qq-contact-preview">
                            回复 {{ replyTarget.role === 'user' ? '我' : activeContact.name }}: {{ replyTarget.content }}
                        </span>
                        <span @click="replyTarget = null" style="cursor:pointer; font-size:22px; color:#999; padding-left:10px; line-height:1;">×</span>
                    </div>
                    
                    <div class="qq-input-bar">
                        <textarea v-model="inputText" @keydown.enter.prevent="sendMessage"></textarea>
                        <button class="btn-primary" @click="sendMessage" style="background:#007aff; color:#fff; border:none;">发送</button>
                    </div>
                </div>
                
                <!-- 多选操作栏 -->
                <div v-else class="qq-select-bar">
                    <button class="btn-primary" @click="cancelSelect" style="background:#e5e5ea; color:#000; border:none;">取消</button>
                    <button class="btn-danger" @click="deleteSelected" :disabled="selectedIds.length === 0" style="background:#ff3b30; color:#fff; border:none;">
                        删除 {{ selectedIds.length > 0 ? '(' + selectedIds.length + ')' : '' }}
                    </button>
                </div>
            </div>

            <!-- 添加联系人弹窗 -->
            <div v-if="showAddModal" class="qq-modal-overlay" @click.self="showAddModal = false">
                <div class="qq-modal">
                    <h3 style="margin-bottom:15px; font-size:18px;">添加联系人</h3>
                    <input v-model="newContact.name" placeholder="名字" />
                    <textarea v-model="newContact.prompt" placeholder="人物设定/系统提示词" rows="3"></textarea>
                    <div class="qq-modal-btns">
                        <button @click="showAddModal = false" style="background:#f0f0f0; border:none;">取消</button>
                        <button class="btn-primary" @click="addContact" style="background:#007aff; color:#fff; border:none;">保存</button>
                    </div>
                </div>
            </div>

        </div>
    `,
    setup() {
        const store = window.store;
        if (!store.contacts) store.contacts = [];

        const activeContact = Vue.ref(null);
        const inputText = Vue.ref('');
        const showAddModal = Vue.ref(false);
        const showProfile = Vue.ref(false);
        
        const newContact = Vue.ref({ name: '', prompt: '' });

        // 长按与菜单状态
        const activeMenuId = Vue.ref(null);
        let touchTimer = null;

        // 选择与回复状态
        const isSelectMode = Vue.ref(false);
        const selectedIds = Vue.ref([]);
        const replyTarget = Vue.ref(null);

        const openChat = (contact) => {
            activeContact.value = contact;
            isSelectMode.value = false;
            replyTarget.value = null;
            Vue.nextTick(() => scrollToBottom());
        };

        const closeChat = () => {
            activeContact.value = null;
        };

        // 点击空白处，如果在选择模式则不干涉，否则关闭菜单
        const handleBoxClick = () => {
            if (!isSelectMode.value) {
                activeMenuId.value = null;
            }
        };

        const handleTouchStart = (e, msg) => {
            if (isSelectMode.value) return; // 处于选择模式时不触发长按
            touchTimer = setTimeout(() => {
                activeMenuId.value = msg.id;
            }, 500); // 500ms 触发长按
        };

        const handleTouchEnd = () => {
            if (touchTimer) clearTimeout(touchTimer);
        };

        const showMenu = (e, msg) => {
            if (isSelectMode.value) return;
            activeMenuId.value = msg.id;
        };

        // 进入选择模式
        const enterSelectMode = (msg) => {
            isSelectMode.value = true;
            selectedIds.value = [msg.id];
            activeMenuId.value = null;
        };

        // 切换选中状态
        const toggleSelect = (id) => {
            if (selectedIds.value.includes(id)) {
                selectedIds.value = selectedIds.value.filter(i => i !== id);
            } else {
                selectedIds.value.push(id);
            }
        };

        // 取消选择
        const cancelSelect = () => {
            isSelectMode.value = false;
            selectedIds.value = [];
        };

        // 删除选中的气泡
        const deleteSelected = () => {
            if (!activeContact.value) return;
            activeContact.value.messages = activeContact.value.messages.filter(
                m => !selectedIds.value.includes(m.id)
            );
            cancelSelect();
        };

        // 设置回复目标
        const setReply = (msg) => {
            replyTarget.value = msg;
            activeMenuId.value = null;
        };

        const addContact = () => {
            if (!newContact.value.name) return alert('请输入名字');
            store.contacts.unshift({
                id: Date.now(),
                name: newContact.value.name,
                prompt: newContact.value.prompt,
                avatar: null,
                messages: []
            });
            showAddModal.value = false;
            newContact.value = { name: '', prompt: '' };
        };

        const scrollToBottom = () => {
            const box = document.getElementById('chat-box');
            if (box) box.scrollTop = box.scrollHeight;
        };

        const sendMessage = async () => {
            if (!inputText.value.trim() || !activeContact.value) return;

            // 构建用户发送的消息
            const userMsg = {
                id: Date.now(),
                role: 'user',
                content: inputText.value,
                // 如果存在回复目标，则生成引用文字
                quote: replyTarget.value ? `${replyTarget.value.role === 'user' ? '我' : activeContact.value.name}: ${replyTarget.value.content}` : null
            };
            
            activeContact.value.messages.push(userMsg);
            const userText = inputText.value; // 保存用于发送 API

            // 重置输入状态
            inputText.value = '';
            replyTarget.value = null;
            activeMenuId.value = null;
            
            Vue.nextTick(() => scrollToBottom());

            // 构建 AI 占位消息
            const aiMsg = { id: Date.now() + 1, role: 'ai', content: '...', isTyping: true };
            activeContact.value.messages.push(aiMsg);
            Vue.nextTick(() => scrollToBottom());

            // 读取主 API 设置
            const config = store.apiSettings.main;
            if (!config.url || !config.key) {
                aiMsg.isTyping = false;
                aiMsg.content = '【系统提示】请先在“设置”中配置 API URL 和 Key。';
                return;
            }

            try {
                // ============== 【提示词时间戳限制核心修改区】 ==============
                let systemText = `你现在扮演 ${activeContact.value.name}。`;
                if (activeContact.value.prompt) {
                    systemText += `\n人物设定：${activeContact.value.prompt}`;
                }
                // 加入要求的约束提示词
                systemText += `\n\n【时间规则】如果是聊天中途关闭了时间感知模式，要紧接着上一次的时间开始，每次回复的时间间隔不超过3分钟：例如ai回复的同一次内，第一个气泡时间为10：03，本次回复的最后一个气泡的时间不超过10:06。`;

                const messages = [{ role: 'system', content: systemText }];
                
                // 截取最近的 15 条消息提供上下文
                const historyMsgs = activeContact.value.messages.slice(-15, -1);
                historyMsgs.forEach(m => {
                    if (!m.isTyping) {
                        let textContent = m.content;
                        if (m.quote) textContent = `(引用: ${m.quote})\n${textContent}`;
                        messages.push({
                            role: m.role === 'user' ? 'user' : 'assistant',
                            content: textContent
                        });
                    }
                });

                const res = await fetch(config.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${config.key}` 
                    },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: messages
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    aiMsg.content = data.choices[0].message.content;
                } else {
                    const errText = await res.text();
                    aiMsg.content = '【请求失败】' + res.status + ' - ' + errText.slice(0, 60);
                }
            } catch(e) {
                aiMsg.content = '【网络异常】' + e.message;
            } finally {
                aiMsg.isTyping = false;
                Vue.nextTick(() => scrollToBottom());
            }
        };

        return {
            store, activeContact, inputText, showAddModal, showProfile, newContact,
            openChat, closeChat, addContact, handleBoxClick,
            activeMenuId, handleTouchStart, handleTouchEnd, showMenu,
            isSelectMode, selectedIds, replyTarget,
            enterSelectMode, toggleSelect, cancelSelect, deleteSelected, setReply,
            sendMessage
        };
    }
};
