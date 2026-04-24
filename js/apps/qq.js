/* eslint-disable */
/* global Vue, window, document, FileReader, Image */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @touchstart="onSwipeStart" @touchend="onSwipeEnd">
            <div class="qq-toast" v-show="errorMsg" :style="{transform: 'translateY('+toastY+'px)'}" @touchstart="onToastTs" @touchmove="onToastTm">{{errorMsg}}</div>

            <!-- 聊天界面 -->
            <div v-if="activeChatId" style="height:100%; display:flex; flex-direction:column; background:#fff; position:absolute; width:100%; top:0; left:0; z-index:10;">
                <div class="qq-header">
                    <span @click="activeChatId = null" style="font-size:28px; padding-right:15px; font-weight:300; cursor:pointer;">&lsaquo;</span>
                    <span style="flex:1; text-align:center;">{{currentContact.nickname}}</span>
                    <span @click="openChatSettings" style="font-size:20px; width:28px; text-align:right; cursor:pointer;">⚙</span>
                </div>
                
                <div class="qq-content" id="chat-area" style="padding-top:10px;" @click="closeMsgActions">
                    <template v-for="(msg, i) in currentMessages" :key="i">
                        <div class="qq-timestamp" v-if="showTime(msg, i)">{{formatTime(msg.timestamp)}}</div>
                        
                        <div class="qq-msg-row" :class="msg.role" @touchstart="startMsgPress(i)" @touchend="cancelMsgPress" @touchmove="cancelMsgPress">
                            
                            <!-- 长按悬浮菜单 -->
                            <div class="qq-msg-actions" :class="msg.role === 'user' ? 'user-actions' : 'ai-actions'" v-if="activeActionMsgIndex === i">
                                <button @click.stop="quoteMessage(msg)">💬</button>
                                <button @click.stop="deleteMsg(i)">🗑️</button>
                            </div>

                            <div v-if="msg.role === 'ai'" class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                            <div v-if="msg.role === 'user'" class="qq-msg-time">{{formatBubbleTime(msg.timestamp)}}</div>
                            
                            <div class="qq-msg-bubble">
                                <div v-if="msg.quote" class="qq-msg-quote">{{msg.quote}}</div>
                                {{msg.content}}
                            </div>

                            <div v-if="msg.role === 'ai'" class="qq-msg-time">{{formatBubbleTime(msg.timestamp)}}</div>
                            <div v-if="msg.role === 'user'" class="qq-msg-avatar" :style="{backgroundImage: store.qqData.profile.avatar ? 'url('+store.qqData.profile.avatar+')' : 'none'}">{{!store.qqData.profile.avatar ? store.qqData.profile.nickname[0] : ''}}</div>
                        </div>
                    </template>
                    
                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                        <div class="qq-msg-bubble" style="background:transparent; box-shadow:none; color:#888;">正在输入中...</div>
                    </div>
                </div>

                <!-- 引用预览 -->
                <div v-if="quoteMsg" class="qq-quote-bar">
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">「引用：{{quoteMsg.content}}」</span>
                    <span @click="quoteMsg = null" class="quote-close">×</span>
                </div>

                <!-- 文本框 -->
                <div class="qq-input-bar">
                    <textarea id="qq-input-area" class="qq-input-textarea" v-model="inputText" @input="autoResize" placeholder="输入多行文字..."></textarea>
                    <button class="ins-btn ins-btn-primary" style="margin-left:12px; margin-bottom:4px; flex-shrink:0;" @click="handleActionBtn">
                        {{ inputText.trim().length > 0 ? '发送' : 'AI 回复' }}
                    </button>
                </div>
            </div>

            <!-- 主界面视图 -->
            <div v-else style="height:100%; display:flex; flex-direction:column;">
                
                <div v-show="currentTab === 'messages'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span style="font-size:20px; font-weight:bold;">消息</span>
                        <span @click="openAddModal" style="font-size:26px; font-weight:300; cursor:pointer;">+</span>
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

                <div v-show="currentTab === 'profile'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header"><span style="font-size:20px; font-weight:bold;">主页</span></div>
                    <div class="qq-content">
                        <div class="qq-profile-header" @touchstart="startPress('qq_bg')" @touchend="cancelPress" @touchmove="cancelPress" :style="{backgroundImage: store.qqData.profile.bgImage ? 'url('+store.qqData.profile.bgImage+')' : 'none'}">
                            <div class="qq-profile-avatar" @touchstart.stop="startPress('qq_avatar')" @touchend="cancelPress" @touchmove="cancelPress" :style="{backgroundImage: store.qqData.profile.avatar ? 'url('+store.qqData.profile.avatar+')' : 'none'}"></div>
                        </div>
                        <div style="padding: 55px 24px 10px;">
                            <h2 style="margin-bottom: 8px; font-size:22px;" @touchstart="startPress('edit_profile')" @touchend="cancelPress" @touchmove="cancelPress">{{store.qqData.profile.nickname}}</h2>
                            <p style="color:#262626; font-size:15px; line-height:1.5;" @touchstart="startPress('edit_profile')" @touchend="cancelPress" @touchmove="cancelPress">{{store.qqData.profile.signature}}</p>
                        </div>
                        <div style="padding: 10px 24px 20px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-size:16px; font-weight:600;">我的名片夹</span>
                                <span @click="openUserCardModal()" style="font-size:24px; font-weight:300; cursor:pointer; color:#000;">+</span>
                            </div>
                            <div v-for="card in store.qqData.userCards" :key="card.id" class="user-card" @touchstart="startPress('edit_card', card)" @touchend="cancelPress" @touchmove="cancelPress">
                                <div class="qq-contact-avatar" style="width:40px; height:40px; font-size:14px;" :style="{backgroundImage: card.avatar ? 'url('+card.avatar+')' : 'none'}">{{!card.avatar ? card.name[0] : ''}}</div>
                                <div style="flex:1; overflow:hidden;">
                                    <div style="font-weight:600; font-size:15px; margin-bottom:4px;">{{card.name}}</div>
                                    <div style="font-size:13px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{card.persona}}</div>
                                </div>
                            </div>
                        </div>
                        <input type="file" accept="image/*" id="qq_bg" style="display:none;" @change="handleImgUpload($event, 'bgImage')" />
                        <input type="file" accept="image/*" id="qq_avatar" style="display:none;" @change="handleImgUpload($event, 'avatar')" />
                    </div>
                </div>

                <div v-show="currentTab === 'wallet'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span @click="currentTab = 'profile'" style="font-size:28px; padding-right:15px; font-weight:300; cursor:pointer;">&lsaquo;</span>
                        <span style="flex:1; text-align:center;">钱包</span>
                        <span style="width:28px;"></span>
                    </div>
                    <div class="qq-content" style="background:#f5f5f5;">
                        <div style="background:#fff; padding:40px 20px; text-align:center; margin-bottom:10px;">
                            <div style="color:#666; font-size:15px; margin-bottom:15px;">我的零钱</div>
                            <div style="font-size:40px; font-weight:bold;">¥ {{store.qqData.wallet.balance.toFixed(2)}}</div>
                        </div>
                    </div>
                </div>

                <div class="qq-bottom-bar" v-if="['messages', 'moments'].includes(currentTab)">
                    <div :class="{active: currentTab==='messages'}" @click="currentTab='messages'">消息</div>
                    <div :class="{active: currentTab==='moments'}" @click="currentTab='moments'">朋友圈</div>
                </div>
                <div class="qq-bottom-bar" v-if="['profile', 'wallet'].includes(currentTab)">
                    <div :class="{active: currentTab==='profile'}" @click="currentTab='profile'">设置</div>
                    <div :class="{active: currentTab==='wallet'}" @click="currentTab='wallet'">钱包</div>
                </div>
            </div>

            <!-- 通用弹窗组件 -->
            <div class="qq-modal-overlay" v-if="modal.show">
                <div class="qq-modal">
                    <h3 style="margin-bottom:18px; text-align:center; font-size:16px;">{{modal.title}}</h3>
                    
                    <template v-if="modal.type === 'char'">
                        <input v-model="tempData.name" placeholder="真实姓名 (必填)" />
                        <input v-model="tempData.nickname" placeholder="昵称" />
                        <textarea v-model="tempData.persona" placeholder="详细人设描述" rows="3"></textarea>
                    </template>
                    
                    <template v-if="modal.type === 'chat_settings'">
                        <div style="margin-bottom:12px; display:flex; gap:10px;">
                            <button class="ins-btn" @click="triggerUpload('temp_char_avatar')" style="flex:1;">更换 Char 头像</button>
                            <input type="file" id="temp_char_avatar" accept="image/*" style="display:none;" @change="handleCharAvatarUpload" />
                        </div>
                        <input v-model="tempData.name" placeholder="Char 姓名" />
                        <input v-model="tempData.nickname" placeholder="Char 昵称" />
                        <textarea v-model="tempData.persona" rows="3" placeholder="Char 人设"></textarea>
                        
                        <label style="font-size:13px; color:#666;">选择你的身份 (名片)</label>
                        <select v-model="tempData.userCardId">
                            <option v-for="uc in store.qqData.userCards" :value="uc.id">{{uc.name}}</option>
                        </select>
                        
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:5px; margin-bottom:15px;">
                            <span style="font-size:14px; font-weight:600;">线下沉浸模式</span>
                            <input type="checkbox" v-model="tempData.offlineMode" style="width:20px; height:20px; margin:0; border:none;" />
                        </div>

                        <!-- 时间感知模式 -->
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:15px; margin-bottom:15px; border-top:1px solid #eee; padding-top:15px;">
                            <span style="font-size:14px; font-weight:600;">时间感知模式 (同步手机时间)</span>
                            <input type="checkbox" v-model="tempData.syncRealTime" style="width:20px; height:20px; margin:0;" />
                        </div>
                        <div v-if="!tempData.syncRealTime" style="margin-bottom:15px;">
                            <label style="font-size:13px; color:#666;">设置初始虚拟时间 (发消息后永久锁定)</label>
                            <input type="datetime-local" v-model="tempData.virtualStartTimeRaw" :disabled="tempData.isTimeLocked" />
                        </div>
                    </template>

                    <template v-if="modal.type === 'user_card'">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                            <div class="qq-contact-avatar" style="margin:0;" :style="{backgroundImage: tempData.avatar ? 'url('+tempData.avatar+')' : 'none'}">{{!tempData.avatar ? (tempData.name ? tempData.name[0] : 'U') : ''}}</div>
                            <button class="ins-btn" @click="triggerUpload('uc_avatar_input')">修改头像</button>
                            <input type="file" id="uc_avatar_input" accept="image/*" style="display:none" @change="handleUcAvatarUpload" />
                        </div>
                        <input v-model="tempData.name" placeholder="名片姓名 (必填)" />
                        <textarea v-model="tempData.persona" placeholder="你的具体人设与设定" rows="4"></textarea>
                    </template>

                    <template v-if="modal.type === 'profile'">
                        <input v-model="tempData.nickname" placeholder="昵称" />
                        <textarea v-model="tempData.signature" placeholder="个性签名" rows="2"></textarea>
                    </template>

                    <!-- 删除及控制按钮 -->
                    <div class="qq-modal-btns" style="flex-wrap:wrap;">
                        <button v-if="modal.type === 'user_card' && store.qqData.userCards.length > 1" class="ins-btn" style="width:100%; margin-bottom:10px;" @click="deleteUserCard">删除名片</button>
                        <button class="ins-btn" style="flex:1;" @click="modal.show = false">取消</button>
                        <button class="ins-btn ins-btn-primary" style="flex:1;" @click="modal.confirm">确定</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;
        const currentTab = Vue.ref('messages');
        const activeChatId = Vue.ref(null);
        
        const modal = Vue.reactive({ show: false, type: '', title: '', confirm: null });
        const tempData = Vue.reactive({});

        const triggerUpload = (id) => document.getElementById(id).click();
        const errorMsg = Vue.ref('');
        const toastY = Vue.ref(0);
        let errTimer = null;
        
        const showError = (msg) => {
            errorMsg.value = msg; toastY.value = 0;
            if (errTimer) clearTimeout(errTimer);
            errTimer = setTimeout(() => { errorMsg.value = ''; }, 3000);
        };
        const onToastTs = (e) => { toastStartY = e.touches[0].clientY; };
        const onToastTm = (e) => {
            const y = e.touches[0].clientY;
            if (y - toastStartY < 0) {
                toastY.value = y - toastStartY;
                if (toastY.value < -40) errorMsg.value = ''; 
            }
        };
        let toastStartY = 0;

        const formatTime = (ts) => {
            if (!ts) return '';
            const d = new Date(ts);
            return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        };
        
        const formatBubbleTime = (ts) => {
            if (!ts) return '';
            const d = new Date(ts);
            return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        };

        const showTime = (msg, index) => {
            if (!msg.timestamp) return false;
            if (index === 0) return true;
            const prev = currentMessages.value[index-1];
            if (!prev || !prev.timestamp) return true;
            return (msg.timestamp - prev.timestamp) > 5 * 60 * 1000;
        };

        let touchStartX = 0;
        const onSwipeStart = (e) => { touchStartX = e.changedTouches[0].screenX; };
        const onSwipeEnd = (e) => {
            if (activeChatId.value || modal.show) return; 
            const endX = e.changedTouches[0].screenX;
            if (endX - touchStartX > 80 && currentTab.value !== 'profile' && currentTab.value !== 'wallet') {
                currentTab.value = 'profile'; 
            } else if (touchStartX - endX > 80 && (currentTab.value === 'profile' || currentTab.value === 'wallet')) {
                currentTab.value = 'messages'; 
            }
        };

        let pressTimer = null;
        const startPress = (action, payload = null) => {
            pressTimer = setTimeout(() => { 
                if (action === 'qq_bg') document.getElementById('qq_bg').click();
                if (action === 'qq_avatar') document.getElementById('qq_avatar').click();
                if (action === 'edit_profile') openEditProfile();
                if (action === 'edit_card') openUserCardModal(payload);
            }, 500);
        };
        const cancelPress = () => { if (pressTimer) clearTimeout(pressTimer); };
        
        // 气泡长按逻辑
        const activeActionMsgIndex = Vue.ref(null);
        let msgPressTimer = null;
        const startMsgPress = (i) => {
            msgPressTimer = setTimeout(() => { activeActionMsgIndex.value = i; }, 500);
        };
        const cancelMsgPress = () => { if (msgPressTimer) clearTimeout(msgPressTimer); };
        const closeMsgActions = () => { activeActionMsgIndex.value = null; };

        const quoteMsg = Vue.ref(null);
        const quoteMessage = (msg) => {
            quoteMsg.value = msg;
            activeActionMsgIndex.value = null;
        };
        const deleteMsg = (i) => {
            store.qqData.messages[activeChatId.value].splice(i, 1);
            activeActionMsgIndex.value = null;
        };

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

        const handleUcAvatarUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => { tempData.avatar = ev.target.result; };
            reader.readAsDataURL(file);
        };

        const openAddModal = () => {
            modal.title = '创建AI好友'; modal.type = 'char';
            Object.assign(tempData, { name: '', nickname: '', persona: '' });
            modal.confirm = () => {
                if (!tempData.name || !tempData.persona) return showError('姓名和人设必填');
                const id = 'contact_' + Date.now();
                store.qqData.contacts.push({ 
                    id, name: tempData.name, nickname: tempData.nickname || tempData.name, 
                    persona: tempData.persona, avatar: null, offlineMode: false, userCardId: store.qqData.userCards[0].id,
                    syncRealTime: true, isTimeLocked: false, virtualStartTime: null, virtualCurrentTime: null
                });
                store.qqData.messages[id] = [];
                modal.show = false;
            };
            modal.show = true;
        };

        const openEditProfile = () => {
            modal.title = '修改主页信息'; modal.type = 'profile';
            Object.assign(tempData, { nickname: store.qqData.profile.nickname, signature: store.qqData.profile.signature });
            modal.confirm = () => {
                store.qqData.profile.nickname = tempData.nickname;
                store.qqData.profile.signature = tempData.signature;
                modal.show = false;
            };
            modal.show = true;
        };

        const openUserCardModal = (card = null) => {
            modal.title = card ? '编辑名片' : '新建名片'; modal.type = 'user_card';
            if (card) Object.assign(tempData, { id: card.id, name: card.name, persona: card.persona, avatar: card.avatar });
            else Object.assign(tempData, { id: null, name: '', persona: '', avatar: null });
            
            modal.confirm = () => {
                if (!tempData.name) return showError('名片姓名必填');
                if (tempData.id) {
                    const target = store.qqData.userCards.find(c => c.id === tempData.id);
                    if (target) { target.name = tempData.name; target.persona = tempData.persona; target.avatar = tempData.avatar; }
                } else {
                    store.qqData.userCards.push({ id: 'uc_' + Date.now(), name: tempData.name, persona: tempData.persona, avatar: tempData.avatar });
                }
                modal.show = false;
            };
            modal.show = true;
        };

        const deleteUserCard = () => {
            const idx = store.qqData.userCards.findIndex(uc => uc.id === tempData.id);
            if (idx > -1) {
                store.qqData.userCards.splice(idx, 1);
                modal.show = false;
            }
        };

        const openChatSettings = () => {
            modal.title = '聊天设置'; modal.type = 'chat_settings';
            const c = currentContact.value;
            Object.assign(tempData, {
                name: c.name, nickname: c.nickname, persona: c.persona,
                userCardId: c.userCardId || store.qqData.userCards[0].id,
                offlineMode: c.offlineMode || false,
                syncRealTime: c.syncRealTime !== false,
                isTimeLocked: c.isTimeLocked || false
            });

            if (c.virtualStartTime) {
                const d = new Date(c.virtualStartTime);
                const pad = (n) => String(n).padStart(2,'0');
                tempData.virtualStartTimeRaw = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            } else {
                tempData.virtualStartTimeRaw = '';
            }

            modal.confirm = () => {
                c.name = tempData.name; c.nickname = tempData.nickname;
                c.persona = tempData.persona; c.userCardId = tempData.userCardId;
                c.offlineMode = tempData.offlineMode;
                c.syncRealTime = tempData.syncRealTime;
                
                if (!tempData.syncRealTime && !c.isTimeLocked && tempData.virtualStartTimeRaw) {
                    c.virtualStartTime = new Date(tempData.virtualStartTimeRaw).getTime();
                    c.virtualCurrentTime = c.virtualStartTime;
                }
                modal.show = false;
            };
            modal.show = true;
        };

        const handleCharAvatarUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => { currentContact.value.avatar = ev.target.result; };
            reader.readAsDataURL(file);
        };

        const getLastMsg = (id) => {
            const msgs = store.qqData.messages[id] || [];
            return msgs.length > 0 ? msgs[msgs.length-1].content : '暂无消息';
        };

        const openChat = (id) => { 
            activeChatId.value = id; 
            const c = store.qqData.contacts.find(con => con.id === id);
            if (c) {
                if (c.syncRealTime === undefined) c.syncRealTime = true;
                if (!c.syncRealTime) {
                    c.isTimeLocked = true;
                    if (!c.virtualStartTime) {
                        const msgs = store.qqData.messages[id] || [];
                        c.virtualStartTime = (msgs.length > 0 && msgs[0].timestamp) ? msgs[0].timestamp : Date.now();
                        c.virtualCurrentTime = c.virtualStartTime;
                    }
                }
            }
            scrollToBottom(); 
        };

        const currentContact = Vue.computed(() => store.qqData.contacts.find(c => c.id === activeChatId.value));
        const currentMessages = Vue.computed(() => store.qqData.messages[activeChatId.value] || []);

        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);
        const scrollToBottom = () => {
            setTimeout(() => {
                const area = document.getElementById('chat-area');
                if (area) area.scrollTop = area.scrollHeight + 100;
            }, 100);
        };

        const autoResize = (e) => {
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 110) + 'px';
        };
        const resetTextarea = () => {
            const el = document.getElementById('qq-input-area');
            if (el) el.style.height = 'auto';
        };

        const getNextTimestamp = (c, contentLength = 10) => {
            if (c.syncRealTime !== false) return Date.now();
            if (!c.virtualCurrentTime) c.virtualCurrentTime = c.virtualStartTime || Date.now();
            
            const advanceMs = 60000 + Math.floor(contentLength / 30) * 60000 + Math.floor(Math.random() * 60000);
            c.virtualCurrentTime += advanceMs;
            return c.virtualCurrentTime;
        };

        const sendUserMsg = () => {
            if (!inputText.value.trim()) return;
            const c = currentContact.value;
            const ts = getNextTimestamp(c, inputText.value.length);
            
            store.qqData.messages[activeChatId.value].push({ 
                role: 'user', 
                content: inputText.value, 
                timestamp: ts,
                quote: quoteMsg.value ? quoteMsg.value.content : null 
            });
            inputText.value = '';
            quoteMsg.value = null;
            resetTextarea();
            scrollToBottom();
        };

        const triggerAI = async () => {
            if (isTyping.value) return;
            const history = store.qqData.messages[activeChatId.value];
            if (history.length === 0 || history[history.length-1].role === 'ai') return showError('请先发送您的消息，再让AI回复');
            
            const apiConfig = store.apiSettings.main;
            if (!apiConfig.url || !apiConfig.key) return showError('请先在设置App中配置主API');

            const c = currentContact.value;
            const uCard = store.qqData.userCards.find(card => card.id === (c.userCardId || store.qqData.userCards[0].id)) || store.qqData.userCards[0];

            let sysPrompt = `你的名字是${c.name}，昵称是${c.nickname}。你的人设是：${c.persona}。\n` +
                            `与你对话的用户名字是${uCard.name}，用户的人设是：${uCard.persona}。\n请完全沉浸在你的人设中进行回复，绝对不要暴露你是AI模型。`;

            if (c.offlineMode) {
                sysPrompt += `\n【重要指令】当前已开启线下模式。请进行带有旁白和环境描写的沉浸式角色扮演。每次回复的字数请控制在150字到250字之间。`;
            } else {
                sysPrompt += `\n【重要指令】当前未开启线下模式。请模拟手机在线聊天的场景，必须采用短句发送，禁止发送大段长文。一次可以回复1到5条消息的量（如果是多条消息，请用换行符分开）。`;
            }

            const apiMessages = [{ role: 'system', content: sysPrompt }];
            history.slice(-15).forEach(m => {
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
                
                if (!c.offlineMode && reply.includes('\n')) {
                    const lines = reply.split('\n').filter(l => l.trim() !== '');
                    for(let line of lines) {
                        const ts = getNextTimestamp(c, line.length);
                        history.push({ role: 'ai', content: line.trim(), timestamp: ts });
                    }
                } else {
                    const ts = getNextTimestamp(c, reply.length);
                    history.push({ role: 'ai', content: reply, timestamp: ts });
                }
                scrollToBottom();
            } catch (err) {
                showError('AI回复异常: ' + err.message);
            } finally {
                isTyping.value = false;
            }
        };

        const handleActionBtn = () => {
            if (inputText.value.trim().length > 0) {
                sendUserMsg();
            } else {
                triggerAI();
            }
        };

        return { 
            store, currentTab, activeChatId, modal, tempData, triggerUpload,
            errorMsg, toastY, onToastTs, onToastTm,
            onSwipeStart, onSwipeEnd, startPress, cancelPress, handleImgUpload,
            openAddModal, openEditProfile, openUserCardModal, deleteUserCard, openChatSettings, handleCharAvatarUpload, handleUcAvatarUpload,
            formatTime, formatBubbleTime, showTime, getLastMsg, openChat, currentContact, currentMessages,
            inputText, isTyping, autoResize, handleActionBtn,
            activeActionMsgIndex, startMsgPress, cancelMsgPress, closeMsgActions, quoteMsg, quoteMessage, deleteMsg
        };
    }
};
