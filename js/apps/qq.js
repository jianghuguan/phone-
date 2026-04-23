/* eslint-disable */
/* global Vue, window, document, FileReader, Image */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @touchstart="onSwipeStart" @touchend="onSwipeEnd">
            <!-- 顶部报错弹窗 -->
            <div class="qq-toast" v-show="errorMsg" :style="{transform: 'translateY('+toastY+'px)'}" @touchstart="onToastTs" @touchmove="onToastTm">
                {{errorMsg}}
            </div>

            <!-- 聊天界面 -->
            <div v-if="activeChatId" style="height:100%; display:flex; flex-direction:column; background:#fff; position:absolute; width:100%; top:0; left:0; z-index:10;">
                <div class="qq-header">
                    <span @click="activeChatId = null" style="font-size:28px; padding-right:15px; font-weight:300;">&lsaquo;</span>
                    <span style="flex:1; text-align:center;">{{currentContact.nickname}}</span>
                    <span style="width:28px;"></span>
                </div>
                <div class="qq-content" id="chat-area" style="padding-top:16px;">
                    <div v-for="(msg, i) in currentMessages" :key="i" class="qq-msg-row" :class="msg.role">
                        <div v-if="msg.role === 'ai'" class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                        <div class="qq-msg-bubble">{{msg.content}}</div>
                        <div v-if="msg.role === 'user'" class="qq-msg-avatar" :style="{backgroundImage: store.qqData.profile.avatar ? 'url('+store.qqData.profile.avatar+')' : 'none'}">{{!store.qqData.profile.avatar ? store.qqData.profile.nickname[0] : ''}}</div>
                    </div>
                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                        <div class="qq-msg-bubble typing-anim">正在输入中...</div>
                    </div>
                </div>
                <div class="qq-input-bar">
                    <input v-model="inputText" @keydown.enter="sendUserMsg" placeholder="输入文字后回车发送" />
                    <button @click="triggerAI">发送</button>
                </div>
            </div>

            <!-- 主界面视图 -->
            <div v-else style="height:100%; display:flex; flex-direction:column;">
                
                <!-- 消息页 -->
                <div v-show="currentTab === 'messages'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span style="font-size:20px; font-weight:bold;">消息</span>
                        <span @click="showAddModal = true" style="font-size:26px; font-weight:300; cursor:pointer;">+</span>
                    </div>
                    <div class="qq-content">
                        <div v-if="store.qqData.contacts.length === 0" style="text-align:center; margin-top:80px; color:#999; font-size:14px;">点击右上角 + 创建AI好友</div>
                        <div v-for="c in store.qqData.contacts" :key="c.id" class="qq-contact-item" @click="openChat(c.id)">
                            <div class="qq-contact-avatar" :style="{backgroundImage: c.avatar ? 'url('+c.avatar+')' : 'none'}">{{!c.avatar ? c.nickname[0] : ''}}</div>
                            <div class="qq-contact-info">
                                <div class="qq-contact-name">{{c.nickname}}</div>
                                <div class="qq-contact-preview">{{getLastMsg(c.id)}}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 朋友圈页 -->
                <div v-show="currentTab === 'moments'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header"><span style="font-size:20px; font-weight:bold;">朋友圈</span></div>
                    <div class="qq-content" style="padding-bottom: 20px;">
                        <div class="qq-profile-header" style="height:250px; border:none; margin-bottom:50px;" :style="{backgroundImage: store.qqData.profile.bgImage ? 'url('+store.qqData.profile.bgImage+')' : 'none'}">
                            <div class="qq-profile-avatar" style="bottom:-30px; right:20px; left:auto; width:75px; height:75px;" :style="{backgroundImage: store.qqData.profile.avatar ? 'url('+store.qqData.profile.avatar+')' : 'none'}"></div>
                            <div style="position:absolute; bottom:-25px; right:110px; font-weight:bold; font-size:18px; color:#262626; text-shadow: 0 0 5px #fff;">{{store.qqData.profile.nickname}}</div>
                        </div>
                        <div style="text-align:center; padding: 40px 0; color:#8e8e8e; font-size:14px;">暂无动态</div>
                    </div>
                </div>

                <!-- 个人主页 -->
                <div v-show="currentTab === 'profile'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header"><span style="font-size:20px; font-weight:bold;">主页</span></div>
                    <div class="qq-content">
                        <div class="qq-profile-header" @touchstart="startPress('qq_bg')" @touchend="cancelPress" @touchmove="cancelPress" :style="{backgroundImage: store.qqData.profile.bgImage ? 'url('+store.qqData.profile.bgImage+')' : 'none'}">
                            <div class="qq-profile-avatar" @touchstart.stop="startPress('qq_avatar')" @touchend="cancelPress" @touchmove="cancelPress" :style="{backgroundImage: store.qqData.profile.avatar ? 'url('+store.qqData.profile.avatar+')' : 'none'}"></div>
                        </div>
                        <div style="padding: 55px 24px 20px;">
                            <h2 style="margin-bottom: 8px; font-size:22px;">{{store.qqData.profile.nickname}}</h2>
                            <p style="color:#262626; font-size:15px; line-height:1.5;">{{store.qqData.profile.signature}}</p>
                            <p style="color:#8e8e8e; font-size:12px; margin-top:15px;">(长按背景或头像可更换图片)</p>
                        </div>
                        <input type="file" accept="image/*" id="qq_bg" style="display:none;" @change="handleImgUpload($event, 'bgImage')" />
                        <input type="file" accept="image/*" id="qq_avatar" style="display:none;" @change="handleImgUpload($event, 'avatar')" />
                    </div>
                </div>

                <!-- 底栏导航 -->
                <div class="qq-bottom-bar" v-if="['messages', 'moments'].includes(currentTab)">
                    <div :class="{active: currentTab==='messages'}" @click="currentTab='messages'">消息</div>
                    <div :class="{active: currentTab==='moments'}" @click="currentTab='moments'">朋友圈</div>
                </div>
                <div class="qq-bottom-bar" v-if="currentTab==='profile'">
                    <div class="active">设置</div>
                    <div>钱包</div>
                </div>
            </div>

            <!-- 创建好友/人设弹窗 -->
            <div class="qq-modal-overlay" v-if="showAddModal">
                <div class="qq-modal">
                    <h3 style="margin-bottom:18px; text-align:center; font-size:16px;">创建AI好友</h3>
                    <input v-model="newFriend.name" placeholder="真实姓名 (必填)" />
                    <input v-model="newFriend.nickname" placeholder="昵称" />
                    <textarea v-model="newFriend.persona" placeholder="详细人设描述 (必填，AI回复将严格依据此人设)" rows="4"></textarea>
                    <div class="qq-modal-btns">
                        <button style="background:#efefef; color:#262626;" @click="showAddModal = false">取消</button>
                        <button style="background:#0095f6; color:#fff;" @click="addFriend">确定</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;
        const currentTab = Vue.ref('messages');
        const activeChatId = Vue.ref(null);
        const showAddModal = Vue.ref(false);
        const newFriend = Vue.reactive({ name: '', nickname: '', persona: '' });
        
        // 报错弹窗逻辑
        const errorMsg = Vue.ref('');
        const toastY = Vue.ref(0);
        let errTimer = null;
        const showError = (msg) => {
            errorMsg.value = msg;
            toastY.value = 0;
            if (errTimer) clearTimeout(errTimer);
            errTimer = setTimeout(() => { errorMsg.value = ''; }, 3000);
        };
        
        let toastStartY = 0;
        const onToastTs = (e) => { toastStartY = e.touches[0].clientY; };
        const onToastTm = (e) => {
            const y = e.touches[0].clientY;
            if (y - toastStartY < 0) {
                toastY.value = y - toastStartY;
                if (toastY.value < -40) errorMsg.value = ''; // 上滑删除
            }
        };

        // 滑动页面逻辑 (右滑跳主页)
        let touchStartX = 0;
        const onSwipeStart = (e) => { touchStartX = e.changedTouches[0].screenX; };
        const onSwipeEnd = (e) => {
            if (activeChatId.value || showAddModal.value) return; 
            const endX = e.changedTouches[0].screenX;
            if (endX - touchStartX > 80 && currentTab.value !== 'profile') {
                currentTab.value = 'profile'; // 右滑
            } else if (touchStartX - endX > 80 && currentTab.value === 'profile') {
                currentTab.value = 'messages'; // 左滑返回
            }
        };

        // 头像与背景长按更换逻辑
        let pressTimer = null;
        const startPress = (id) => {
            pressTimer = setTimeout(() => { document.getElementById(id).click(); }, 600);
        };
        const cancelPress = () => { if (pressTimer) clearTimeout(pressTimer); };
        const handleImgUpload = (event, targetField) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width, h = img.height;
                    if (w > 600) { h = Math.round(h * 600 / w); w = 600; }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    store.qqData.profile[targetField] = canvas.toDataURL('image/jpeg', 0.8);
                }
            };
            reader.readAsDataURL(file);
        };

        // 聊天数据处理
        const getLastMsg = (id) => {
            const msgs = store.qqData.messages[id] || [];
            return msgs.length > 0 ? msgs[msgs.length-1].content : '暂无消息';
        };

        const addFriend = () => {
            if (!newFriend.name || !newFriend.persona) return showError('姓名和人设不能为空');
            const id = 'contact_' + Date.now();
            store.qqData.contacts.push({ id, name: newFriend.name, nickname: newFriend.nickname || newFriend.name, persona: newFriend.persona, avatar: null });
            store.qqData.messages[id] = [];
            showAddModal.value = false;
            newFriend.name = ''; newFriend.nickname = ''; newFriend.persona = '';
        };

        const openChat = (id) => { activeChatId.value = id; scrollToBottom(); };
        const currentContact = Vue.computed(() => store.qqData.contacts.find(c => c.id === activeChatId.value));
        const currentMessages = Vue.computed(() => store.qqData.messages[activeChatId.value] || []);

        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);
        const scrollToBottom = () => {
            setTimeout(() => {
                const area = document.getElementById('chat-area');
                if (area) area.scrollTop = area.scrollHeight;
            }, 50);
        };

        const sendUserMsg = () => {
            if (!inputText.value.trim()) return;
            store.qqData.messages[activeChatId.value].push({ role: 'user', content: inputText.value });
            inputText.value = '';
            scrollToBottom();
        };

        const triggerAI = async () => {
            if (isTyping.value) return;
            const history = store.qqData.messages[activeChatId.value];
            if (history.length === 0 || history[history.length-1].role === 'ai') return showError('请先发送您的消息，再让AI回复');
            
            const apiConfig = store.apiSettings.main;
            if (!apiConfig.url || !apiConfig.key) return showError('请先在设置App中配置主API');

            const apiMessages = [
                { role: 'system', content: `你的名字是${currentContact.value.name}，昵称是${currentContact.value.nickname}。你的人设是：${currentContact.value.persona}。请完全沉浸在此人设中进行简短、口语化的回复，不要暴露你是AI。` }
            ];
            history.forEach(m => {
                apiMessages.push({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content });
            });

            isTyping.value = true;
            scrollToBottom();

            try {
                const res = await fetch(apiConfig.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.key}` },
                    body: JSON.stringify({ model: apiConfig.model, messages: apiMessages })
                });
                
                if (!res.ok) throw new Error(`请求失败 (${res.status})`);
                const data = await res.json();
                const reply = data.choices[0]?.message?.content;
                
                if (!reply || !reply.trim()) throw new Error('AI返回了空消息');
                
                history.push({ role: 'ai', content: reply });
                scrollToBottom();
            } catch (err) {
                showError('AI回复异常: ' + err.message);
            } finally {
                isTyping.value = false;
            }
        };

        return { 
            store, currentTab, activeChatId, showAddModal, newFriend,
            errorMsg, toastY, onToastTs, onToastTm,
            onSwipeStart, onSwipeEnd, startPress, cancelPress, handleImgUpload,
            getLastMsg, addFriend, openChat, currentContact, currentMessages,
            inputText, isTyping, sendUserMsg, triggerAI 
        };
    }
};
