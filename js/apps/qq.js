/* eslint-disable */
/* global Vue, window, document, FileReader, Image */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @touchstart="onSwipeStart" @touchend="onSwipeEnd" @click="closeMenu">
            
            <style>
                .qq-msg-row { position: relative; margin-bottom: 20px !important; }
                .msg-content-wrapper { display: flex; align-items: flex-end; max-width: 82%; }
                .qq-msg-row.user .msg-content-wrapper { flex-direction: row-reverse; }
                .msg-time-aside { font-size: 11px; color: #a9a9a9; margin: 0 6px; margin-bottom: 4px; white-space: nowrap; user-select: none; }
                
                .quote-box { background: rgba(0,0,0,0.05); padding: 5px 8px; border-radius: 6px; font-size: 12px; margin-bottom: 6px; color: #555; }
                .qq-msg-row.user .quote-box { background: rgba(255,255,255,0.25); color: #fff; }
                
                .qq-input-textarea { flex: 1; border: 1px solid #dbdbdb; border-radius: 20px; padding: 10px 14px; outline: none; font-size: 15px; background: #fafafa; resize: none; font-family: inherit; line-height: 20px; max-height: 120px; }
                .qq-input-bar-wrap { border-top: 1px solid #efefef; background: #fff; display: flex; flex-direction: column; flex-shrink: 0; }
                
                .msg-pop-menu { position: fixed; background: #333; color: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; z-index: 9999; padding: 4px; gap: 4px; }
                .msg-pop-btn { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
                .msg-pop-btn:active { background: #555; }
            </style>

            <div class="qq-toast" v-show="errorMsg" :style="{transform: 'translateY('+toastY+'px)'}" @touchstart="onToastTs" @touchmove="onToastTm">
                {{errorMsg}}
            </div>

            <!-- 聊天界面 -->
            <div v-if="activeChatId" style="height:100%; display:flex; flex-direction:column; background:#fff; position:absolute; width:100%; top:0; left:0; z-index:10;">
                <div class="qq-header">
                    <span @click="activeChatId = null" style="font-size:28px; padding-right:15px; font-weight:300; cursor:pointer;">&lsaquo;</span>
                    <span style="flex:1; text-align:center;">{{currentContact.nickname}}</span>
                    <span @click="openChatSettings" style="font-size:20px; width:28px; text-align:right; cursor:pointer;">⚙</span>
                </div>
                
                <div class="qq-content" id="chat-area" style="padding-top:10px;">
                    <template v-for="(msg, i) in currentMessages" :key="i">
                        <div class="qq-timestamp" v-if="showTime(msg, i)">{{formatTime(msg.timestamp)}}</div>
                        <div class="qq-msg-row" :class="msg.role">
                            <div v-if="msg.role === 'ai'" class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                            
                            <div class="msg-content-wrapper">
                                <div class="qq-msg-bubble" @touchstart="onBubbleTs($event, i, msg)" @touchmove="onBubbleTm" @touchend="onBubbleTe" @contextmenu.prevent>
                                    <div v-if="msg.quote" class="quote-box">{{msg.quote.length > 30 ? msg.quote.substring(0,30)+'...' : msg.quote}}</div>
                                    <div style="white-space:pre-wrap; word-break: break-all;">{{msg.content}}</div>
                                </div>
                                <div class="msg-time-aside">{{msg.timeStr || ''}}</div>
                            </div>

                            <div v-if="msg.role === 'user'" class="qq-msg-avatar" :style="{backgroundImage: store.qqData.profile.avatar ? 'url('+store.qqData.profile.avatar+')' : 'none'}">{{!store.qqData.profile.avatar ? store.qqData.profile.nickname[0] : ''}}</div>
                        </div>
                    </template>
                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                        <div class="qq-msg-bubble typing-anim">正在输入中...</div>
                    </div>
                </div>

                <!-- 悬浮长按菜单 -->
                <div v-if="menuInfo.show" class="msg-pop-menu" :style="{ top: menuInfo.y + 'px', left: menuInfo.x + 'px' }" @click.stop>
                    <div class="msg-pop-btn" @click.stop="quoteMsg">↩️ 引用</div>
                    <div class="msg-pop-btn" @click.stop="deleteMsg" style="color: #ff4d4f;">🗑️ 删除</div>
                </div>

                <div class="qq-input-bar-wrap">
                    <div v-if="quotedMsg" style="padding: 8px 16px; background: #f7f7f7; font-size: 13px; color: #666; display: flex; justify-content: space-between; align-items: center;">
                        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; border-left: 3px solid #ccc; padding-left: 8px;">引用：{{quotedMsg.content}}</div>
                        <div @click="quotedMsg = null" style="cursor:pointer; padding:4px 8px; font-weight:bold; color:#999;">✕</div>
                    </div>
                    <div style="display:flex; align-items:flex-end; padding: 10px 16px;">
                        <textarea v-model="inputText" class="qq-input-textarea" rows="1" @input="adjustHeight" @keydown="onInputKeydown" placeholder="输入文字发送"></textarea>
                        <button @click="triggerAI" style="background:none; border:none; color:#0095f6; font-weight:600; font-size:15px; margin-left:12px; margin-bottom:8px; cursor:pointer;">发送</button>
                    </div>
                </div>
            </div>

            <!-- 主界面视图 -->
            <div v-else style="height:100%; display:flex; flex-direction:column;">
                
                <!-- 消息页 -->
                <div v-show="currentTab === 'messages'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span style="font-size:20px; font-weight:bold;">消息</span>
                        <span @click="openAddModal" style="font-size:26px; font-weight:300; cursor:pointer;">+</span>
                    </div>
                    <div class="qq-content">
                        <div v-for="c in store.qqData.contacts" :key="c.id" class="qq-contact-item" @click="openChat(c.id)">
                            <div class="qq-contact-avatar" :style="{backgroundImage: c.avatar ? 'url('+c.avatar+')' : 'none'}">{{!c.avatar ? c.nickname[0] : ''}}</div>
                            <div class="qq-contact-info">
                                <div class="qq-contact-name">{{c.nickname}}</div>
                                <div class="qq-contact-preview">{{getLastMsg(c.id)}}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 朋友圈页 / 主页页 / 钱包页 保持原样 ... -->
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
                                <span @click="openUserCardModal()" style="font-size:24px; font-weight:300; cursor:pointer; color:#0095f6;">+</span>
                            </div>
                            <!-- 增加了小头像显示 -->
                            <div v-for="card in store.qqData.userCards" :key="card.id" class="user-card" style="display:flex; align-items:center; cursor:pointer;" @click="openUserCardModal(card)">
                                <div style="width:42px; height:42px; border-radius:50%; background:#efefef; margin-right:12px; background-size:cover; background-position:center; display:flex; align-items:center; justify-content:center; color:#fff;" 
                                     :style="{backgroundImage: card.avatar ? 'url('+card.avatar+')' : 'none'}">{{!card.avatar ? card.name[0] : ''}}</div>
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
                
                <div class="qq-bottom-bar" v-if="['messages', 'moments'].includes(currentTab)">
                    <div :class="{active: currentTab==='messages'}" @click="currentTab='messages'">消息</div>
                    <div :class="{active: currentTab==='profile'}" @click="currentTab='profile'">设置</div>
                </div>
            </div>

            <!-- 通用弹窗组件区 -->
            <div class="qq-modal-overlay" v-if="modal.show">
                <div class="qq-modal">
                    <h3 style="margin-bottom:18px; text-align:center; font-size:16px;">{{modal.title}}</h3>
                    
                    <template v-if="modal.type === 'chat_settings'">
                        <div style="margin-bottom:12px; display:flex; gap:10px;">
                            <button @click="triggerUpload('temp_char_avatar')" style="flex:1; padding:8px; border:1px solid #dbdbdb; border-radius:8px; background:#fff; font-size:13px;">更换 Char 头像</button>
                            <input type="file" id="temp_char_avatar" accept="image/*" style="display:none;" @change="handleCharAvatarUpload" />
                        </div>
                        <label style="font-size:13px; color:#666;">Char 姓名</label>
                        <input v-model="tempData.name" />
                        <label style="font-size:13px; color:#666;">Char 人设</label>
                        <textarea v-model="tempData.persona" rows="3"></textarea>
                        
                        <label style="font-size:13px; color:#666;">你的身份名片</label>
                        <select v-model="tempData.userCardId">
                            <option v-for="uc in store.qqData.userCards" :value="uc.id">{{uc.name}}</option>
                        </select>
                        
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:5px; margin-bottom:10px;">
                            <span style="font-size:14px; font-weight:600;">线下沉浸模式 (长文)</span>
                            <input type="checkbox" v-model="tempData.offlineMode" style="width:20px; height:20px; margin:0;" />
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px;">
                            <span style="font-size:14px; font-weight:600;">真实时间感知模式</span>
                            <input type="checkbox" v-model="tempData.timePerceptionMode" style="width:20px; height:20px; margin:0;" />
                        </div>
                    </template>

                    <!-- 创建/编辑 User 名片界面 增加头像与删除 -->
                    <template v-if="modal.type === 'user_card'">
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
                            <div style="width:50px; height:50px; border-radius:50%; background:#eee; background-size:cover; background-position:center; flex-shrink:0;" :style="{backgroundImage: tempData.avatar ? 'url('+tempData.avatar+')' : 'none'}"></div>
                            <button @click="triggerUpload('temp_user_avatar')" style="flex:1; padding:8px; border:1px solid #dbdbdb; border-radius:8px; background:#fff; font-size:13px;">修改头像</button>
                            <input type="file" id="temp_user_avatar" accept="image/*" style="display:none;" @change="handleTempAvatar" />
                        </div>
                        <input v-model="tempData.name" placeholder="名片姓名 (必填)" />
                        <textarea v-model="tempData.persona" placeholder="你的具体人设与设定" rows="4"></textarea>
                    </template>

                    <!-- 创建AI / 修改资料 ... -->
                    <template v-if="modal.type === 'char'">
                        <input v-model="tempData.name" placeholder="真实姓名 (必填)" />
                        <textarea v-model="tempData.persona" placeholder="详细人设描述" rows="3"></textarea>
                    </template>
                    <template v-if="modal.type === 'profile'">
                        <input v-model="tempData.nickname" placeholder="昵称" />
                        <textarea v-model="tempData.signature" placeholder="个性签名" rows="2"></textarea>
                    </template>

                    <div class="qq-modal-btns">
                        <button v-if="modal.type === 'user_card' && tempData.id" style="background:#ff3b30; color:#fff;" @click="deleteUserCard">删除</button>
                        <button style="background:#efefef; color:#262626;" @click="modal.show = false">取消</button>
                        <button style="background:#0095f6; color:#fff;" @click="modal.confirm">确定</button>
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
        const errorMsg = Vue.ref('');
        const toastY = Vue.ref(0);
        let errTimer = null;

        const triggerUpload = (id) => document.getElementById(id).click();
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
        const showTime = (msg, index) => {
            if (!msg.timestamp) return false;
            if (index === 0) return true;
            const prev = currentMessages.value[index-1];
            if (!prev || !prev.timestamp) return true;
            return (msg.timestamp - prev.timestamp) > 5 * 60 * 1000;
        };

        const onSwipeStart = () => {}; const onSwipeEnd = () => {};
        let pressTimer = null;
        const startPress = (action) => {
            pressTimer = setTimeout(() => { 
                if (action === 'qq_bg') document.getElementById('qq_bg').click();
                if (action === 'qq_avatar') document.getElementById('qq_avatar').click();
                if (action === 'edit_profile') openEditProfile();
            }, 500);
        };
        const cancelPress = () => { if (pressTimer) clearTimeout(pressTimer); };
        
        const handleImgUpload = (event, targetField) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => { store.qqData.profile[targetField] = e.target.result; };
            reader.readAsDataURL(file);
        };

        const handleTempAvatar = (e) => {
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
                    id, name: tempData.name, nickname: tempData.name, 
                    persona: tempData.persona, avatar: null, offlineMode: false, timePerceptionMode: false,
                    userCardId: store.qqData.userCards[0].id
                });
                store.qqData.messages[id] = [];
                modal.show = false;
            };
            modal.show = true;
        };

        const openEditProfile = () => {
            modal.title = '修改个人信息'; modal.type = 'profile';
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
            if (card) Object.assign(tempData, { id: card.id, name: card.name, persona: card.persona, avatar: card.avatar || null });
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
            if (store.qqData.userCards.length <= 1) return showError('请至少保留一个名片');
            store.qqData.userCards = store.qqData.userCards.filter(c => c.id !== tempData.id);
            modal.show = false;
        };

        const openChatSettings = () => {
            modal.title = '聊天设置'; modal.type = 'chat_settings';
            const c = currentContact.value;
            Object.assign(tempData, {
                name: c.name, persona: c.persona,
                userCardId: c.userCardId || store.qqData.userCards[0].id,
                offlineMode: c.offlineMode || false,
                timePerceptionMode: c.timePerceptionMode || false
            });
            modal.confirm = () => {
                c.name = tempData.name; c.nickname = tempData.name;
                c.persona = tempData.persona; c.userCardId = tempData.userCardId;
                c.offlineMode = tempData.offlineMode;
                c.timePerceptionMode = tempData.timePerceptionMode;
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

        const openChat = (id) => { activeChatId.value = id; scrollToBottom(); };
        const currentContact = Vue.computed(() => store.qqData.contacts.find(c => c.id === activeChatId.value));
        const currentMessages = Vue.computed(() => store.qqData.messages[activeChatId.value] || []);

        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);
        const quotedMsg = Vue.ref(null);

        const adjustHeight = (e) => {
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = (el.scrollHeight > 120 ? 120 : el.scrollHeight) + 'px';
        };

        const onInputKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                triggerAI();
            }
        };

        const scrollToBottom = () => {
            setTimeout(() => {
                const area = document.getElementById('chat-area');
                if (area) area.scrollTop = area.scrollHeight + 100;
            }, 100);
        };

        // ===== 长按气泡逻辑 =====
        let touchStartData = { x: 0, y: 0, timer: null };
        const menuInfo = Vue.reactive({ show: false, x: 0, y: 0, msgIndex: -1, msg: null });
        
        const closeMenu = () => { menuInfo.show = false; };
        
        const onBubbleTs = (e, i, msg) => {
            touchStartData.x = e.touches[0].clientX; touchStartData.y = e.touches[0].clientY;
            touchStartData.timer = setTimeout(() => {
                menuInfo.msg = msg; menuInfo.msgIndex = i;
                menuInfo.x = Math.min(touchStartData.x, window.innerWidth - 150);
                menuInfo.y = Math.min(touchStartData.y - 50, window.innerHeight - 80);
                menuInfo.show = true;
            }, 500);
        };
        const onBubbleTm = (e) => {
            if(Math.abs(e.touches[0].clientX - touchStartData.x) > 10 || Math.abs(e.touches[0].clientY - touchStartData.y) > 10) clearTimeout(touchStartData.timer);
        };
        const onBubbleTe = () => { clearTimeout(touchStartData.timer); };

        const deleteMsg = () => {
            store.qqData.messages[activeChatId.value].splice(menuInfo.msgIndex, 1);
            menuInfo.show = false;
        };
        const quoteMsg = () => { quotedMsg.value = menuInfo.msg; menuInfo.show = false; };

        // ===== 虚拟时间推演算法 =====
        const getNextTimeStr = (history, content, isRealTime) => {
            if (isRealTime) {
                const now = new Date();
                return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
            }
            if (history.length === 0) {
                let h = 12, m = Math.floor(Math.random()*20);
                if (content.includes('早')) h = 8;
                else if (content.includes('中')) h = 12;
                else if (content.includes('晚')) h = 20;
                else if (content.includes('夜')) h = 23;
                return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            } else {
                const lastMsg = history[history.length - 1];
                let baseH = 12, baseM = 0;
                if (lastMsg.timeStr && lastMsg.timeStr.includes(':')) {
                    const parts = lastMsg.timeStr.split(':');
                    baseH = parseInt(parts[0], 10) || 12;
                    baseM = parseInt(parts[1], 10) || 0;
                }
                let addMins = Math.floor(content.length / 12) + 1;
                if (addMins > 15) addMins = 15;
                baseM += addMins;
                if (baseM >= 60) { baseH = (baseH + 1) % 24; baseM %= 60; }
                return `${String(baseH).padStart(2,'0')}:${String(baseM).padStart(2,'0')}`;
            }
        };

        // ===== 发送核心流程 =====
        const triggerAI = async () => {
            if (!inputText.value.trim() || isTyping.value) return;
            
            const history = store.qqData.messages[activeChatId.value];
            const isRealTime = !!currentContact.value.timePerceptionMode;

            // 构建用户发送内容
            const rawUserContent = inputText.value;
            const tStr = getNextTimeStr(history, rawUserContent, isRealTime);
            
            history.push({
                role: 'user', content: rawUserContent, timestamp: Date.now(),
                timeStr: tStr, quote: quotedMsg.value ? quotedMsg.value.content : null
            });
            
            inputText.value = ''; 
            const ta = document.querySelector('.qq-input-textarea');
            if (ta) ta.style.height = 'auto';
            quotedMsg.value = null;
            scrollToBottom();

            // 发送请求
            const apiConfig = store.apiSettings.main;
            if (!apiConfig.url || !apiConfig.key) return showError('未配置主API');

            const c = currentContact.value;
            const uCard = store.qqData.userCards.find(card => card.id === (c.userCardId || store.qqData.userCards[0].id)) || store.qqData.userCards[0];

            let sysPrompt = `名字:${c.name}，人设:${c.persona}。用户:${uCard.name}，人设:${uCard.persona}。绝对不要暴露你是AI。`;
            if (c.offlineMode) sysPrompt += `\n开启线下模式。请进行带有旁白和描写的沉浸式语C扮演。字数150-250字。`;
            else sysPrompt += `\n未开启线下模式。请模拟手机在线聊天场景，短句发送，禁止长文。可回复1到5条消息（用换行符分开）。`;

            const apiMessages = [{ role: 'system', content: sysPrompt }];
            history.slice(-15).forEach(m => {
                let msgContent = m.content;
                if (m.quote) msgContent = `[引用了消息：“${m.quote}”]\n` + msgContent;
                apiMessages.push({ role: m.role === 'ai' ? 'assistant' : 'user', content: msgContent });
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
                    for(let i=0; i<lines.length; i++) {
                        const line = lines[i].trim();
                        history.push({ role: 'ai', content: line, timestamp: Date.now(), timeStr: getNextTimeStr(history, line, isRealTime) });
                    }
                } else {
                    history.push({ role: 'ai', content: reply, timestamp: Date.now(), timeStr: getNextTimeStr(history, reply, isRealTime) });
                }
                scrollToBottom();
            } catch (err) {
                showError('AI回复异常: ' + err.message);
            } finally {
                isTyping.value = false;
            }
        };

        return { 
            store, currentTab, activeChatId, modal, tempData, triggerUpload,
            errorMsg, toastY, onToastTs, onToastTm,
            onSwipeStart, onSwipeEnd, startPress, cancelPress, handleImgUpload, handleTempAvatar,
            openAddModal, openEditProfile, openUserCardModal, deleteUserCard, openChatSettings, handleCharAvatarUpload,
            formatTime, showTime, getLastMsg, openChat, currentContact, currentMessages,
            inputText, isTyping, triggerAI, quotedMsg, adjustHeight, onInputKeydown,
            menuInfo, onBubbleTs, onBubbleTm, onBubbleTe, closeMenu, deleteMsg, quoteMsg
        };
    }
};
