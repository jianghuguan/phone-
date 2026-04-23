/* eslint-disable */
/* global Vue, window, document, FileReader, Image */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @touchstart="onSwipeStart" @touchend="onSwipeEnd">
            <!-- 报错弹窗 -->
            <div class="qq-toast" v-show="errorMsg" :style="{transform: 'translateY('+toastY+'px)'}" @touchstart="onToastTs" @touchmove="onToastTm">
                {{errorMsg}}
            </div>

            <!-- 气泡操作菜单 (删除/引用) -->
            <div class="qq-modal-overlay" v-if="bubbleModal.show" @click="bubbleModal.show = false">
                <div class="qq-modal" @click.stop style="width:60%; padding:0; overflow:hidden; border-radius:12px;">
                    <div @click="quoteMessage" style="padding:15px; text-align:center; border-bottom:1px solid #efefef; font-size:15px; cursor:pointer;">引用此消息</div>
                    <div @click="deleteMessage" style="padding:15px; text-align:center; color:#ed4956; font-size:15px; cursor:pointer;">🗑 删除</div>
                </div>
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
                        <div class="qq-msg-row" :class="msg.role" style="align-items: flex-end;">
                            <div v-if="msg.role === 'ai'" class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                            
                            <span v-if="msg.role === 'user'" style="font-size: 11px; color: #999; margin: 0 8px 4px;">{{ getMsgTime(msg) }}</span>
                            
                            <div class="qq-msg-bubble" @touchstart="onBubbleTouchStart(msg, i)" @touchend="onBubbleTouchEnd" @touchmove="onBubbleTouchMove" style="white-space: pre-wrap;">
                                <div v-if="msg.quote" style="background:rgba(0,0,0,0.05); padding:6px 10px; border-radius:6px; font-size:12px; color:#666; margin-bottom:6px; border-left:3px solid #ccc;">{{msg.quote}}</div>
                                {{msg.content}}
                            </div>
                            
                            <span v-if="msg.role === 'ai'" style="font-size: 11px; color: #999; margin: 0 8px 4px;">{{ getMsgTime(msg) }}</span>

                            <div v-if="msg.role === 'user'" class="qq-msg-avatar" :style="{backgroundImage: store.qqData.profile.avatar ? 'url('+store.qqData.profile.avatar+')' : 'none'}">{{!store.qqData.profile.avatar ? store.qqData.profile.nickname[0] : ''}}</div>
                        </div>
                    </template>
                    <div v-if="isTyping" class="qq-msg-row ai" style="align-items: flex-end;">
                        <div class="qq-msg-avatar" :style="{backgroundImage: currentContact.avatar ? 'url('+currentContact.avatar+')' : 'none'}">{{!currentContact.avatar ? currentContact.nickname[0] : ''}}</div>
                        <div class="qq-msg-bubble typing-anim">正在输入中...</div>
                    </div>
                </div>

                <!-- 引用提示层 -->
                <div v-if="quotedMsg" style="background:#f5f5f5; padding:8px 16px; font-size:12px; color:#666; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #efefef;">
                    <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90%;">引用: {{quotedMsg.content}}</div>
                    <div @click="quotedMsg = null" style="cursor:pointer; font-size:16px;">&times;</div>
                </div>

                <!-- 自适应输入框 -->
                <div class="qq-input-bar" style="height:auto; min-height:60px; padding: 10px 16px; align-items:flex-end; flex-shrink:0;">
                    <textarea id="chat-textarea" v-model="inputText" @input="resizeTextarea" @keydown.enter="handleEnter" placeholder="发送消息" rows="1" style="flex:1; border:1px solid #dbdbdb; border-radius:18px; padding:10px 14px; outline:none; font-size:14px; background:#fafafa; resize:none; line-height:1.4; max-height:110px; overflow-y:auto; font-family:inherit; box-sizing:border-box;"></textarea>
                    <button @click="triggerAI" style="margin-bottom: 5px; background:none; border:none; color:#0095f6; font-weight:600; margin-left:12px; font-size:15px; padding:5px; cursor:pointer;">发送</button>
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

                <!-- 个人主页页 -->
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
                            
                            <!-- 增强版个人名片 -->
                            <div v-for="card in store.qqData.userCards" :key="card.id" class="user-card" style="display:flex; align-items:center; padding:12px; margin-bottom:10px;">
                                <div class="qq-contact-avatar" :style="{backgroundImage: card.avatar ? 'url('+card.avatar+')' : 'none', width:'40px', height:'40px', fontSize:'14px', marginRight:'10px', flexShrink:0}">{{!card.avatar && card.name ? card.name[0] : ''}}</div>
                                <div style="flex:1; overflow:hidden;" @click="openUserCardModal(card)">
                                    <div style="font-weight:600; font-size:15px; margin-bottom:4px;">{{card.name}}</div>
                                    <div style="font-size:13px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{card.persona}}</div>
                                </div>
                                <div style="display:flex; gap:10px; margin-left:10px; flex-shrink:0;">
                                    <span @click.stop="openUserCardModal(card)" style="color:#0095f6; font-size:13px; cursor:pointer;">编辑</span>
                                    <span @click.stop="triggerUpload('uc_avatar_' + card.id)" style="color:#0095f6; font-size:13px; cursor:pointer;">头像</span>
                                    <span @click.stop="deleteUserCard(card.id)" style="color:#ed4956; font-size:13px; cursor:pointer;">删除</span>
                                    <input type="file" :id="'uc_avatar_' + card.id" accept="image/*" style="display:none;" @change="handleUserCardAvatarUpload($event, card)" />
                                </div>
                            </div>
                        </div>
                        <input type="file" accept="image/*" id="qq_bg" style="display:none;" @change="handleImgUpload($event, 'bgImage')" />
                        <input type="file" accept="image/*" id="qq_avatar" style="display:none;" @change="handleImgUpload($event, 'avatar')" />
                    </div>
                </div>

                <!-- 钱包页 -->
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
                        <div style="background:#fff; padding:15px 20px;">
                            <div style="font-weight:600; font-size:16px; margin-bottom:15px;">账单明细</div>
                            <div v-for="(h, idx) in store.qqData.wallet.history" :key="idx" style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #fafafa;">
                                <div>
                                    <div style="font-size:15px; color:#333; margin-bottom:4px;">{{h.desc}}</div>
                                    <div style="font-size:12px; color:#999;">{{formatTime(h.time)}}</div>
                                </div>
                                <div style="font-size:16px; font-weight:600; color:#34c759;">{{h.amount}}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 底栏导航 -->
                <div class="qq-bottom-bar" v-if="['messages', 'moments'].includes(currentTab)">
                    <div :class="{active: currentTab==='messages'}" @click="currentTab='messages'">消息</div>
                    <div :class="{active: currentTab==='moments'}" @click="currentTab='moments'">朋友圈</div>
                </div>
                <div class="qq-bottom-bar" v-if="['profile', 'wallet'].includes(currentTab)">
                    <div :class="{active: currentTab==='profile'}" @click="currentTab='profile'">设置</div>
                    <div :class="{active: currentTab==='wallet'}" @click="currentTab='wallet'">钱包</div>
                </div>
            </div>

            <!-- 通用弹窗组件区 -->
            <div class="qq-modal-overlay" v-if="modal.show">
                <div class="qq-modal">
                    <h3 style="margin-bottom:18px; text-align:center; font-size:16px;">{{modal.title}}</h3>
                    
                    <!-- 创建/编辑 Char 界面 -->
                    <template v-if="modal.type === 'char'">
                        <input v-model="tempData.name" placeholder="真实姓名 (必填)" />
                        <input v-model="tempData.nickname" placeholder="昵称" />
                        <textarea v-model="tempData.persona" placeholder="详细人设描述" rows="3"></textarea>
                    </template>
                    
                    <!-- 设置聊天界面 (齿轮) -->
                    <template v-if="modal.type === 'chat_settings'">
                        <div style="margin-bottom:12px; display:flex; gap:10px;">
                            <button @click="triggerUpload('temp_char_avatar')" style="flex:1; padding:8px; border:1px solid #dbdbdb; border-radius:8px; background:#fff; font-size:13px;">更换 Char 头像</button>
                            <input type="file" id="temp_char_avatar" accept="image/*" style="display:none;" @change="handleCharAvatarUpload" />
                        </div>
                        <label style="font-size:13px; color:#666;">Char 姓名</label>
                        <input v-model="tempData.name" />
                        <label style="font-size:13px; color:#666;">Char 昵称</label>
                        <input v-model="tempData.nickname" />
                        <label style="font-size:13px; color:#666;">Char 人设</label>
                        <textarea v-model="tempData.persona" rows="3"></textarea>
                        
                        <label style="font-size:13px; color:#666;">选择你的身份 (名片)</label>
                        <select v-model="tempData.userCardId">
                            <option v-for="uc in store.qqData.userCards" :value="uc.id">{{uc.name}}</option>
                        </select>
                        
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:5px;">
                            <span style="font-size:14px; font-weight:600;">线下沉浸模式</span>
                            <input type="checkbox" v-model="tempData.offlineMode" style="width:20px; height:20px; margin:0; border:none;" />
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:15px; margin-bottom:15px;">
                            <span style="font-size:14px; font-weight:600;">真实手机时间模式</span>
                            <input type="checkbox" v-model="tempData.timePerceptionMode" style="width:20px; height:20px; margin:0; border:none;" />
                        </div>
                        <div style="font-size:11px; color:#999; margin-bottom:10px; line-height:1.4;">
                            * 开启真实时间模式后，气泡将显示当前的现实时间。<br>
                            * 关闭后由AI根据第一条消息及上下文自动推演时间。
                        </div>
                    </template>

                    <!-- 创建/编辑 User 名片界面 -->
                    <template v-if="modal.type === 'user_card'">
                        <input v-model="tempData.name" placeholder="名片姓名 (必填)" />
                        <textarea v-model="tempData.persona" placeholder="你的具体人设与设定" rows="4"></textarea>
                    </template>

                    <!-- 修改基础个人信息 -->
                    <template v-if="modal.type === 'profile'">
                        <input v-model="tempData.nickname" placeholder="昵称" />
                        <textarea v-model="tempData.signature" placeholder="个性签名" rows="2"></textarea>
                    </template>

                    <div class="qq-modal-btns">
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
        
        // Modal State
        const modal = Vue.reactive({ show: false, type: '', title: '', confirm: null });
        const tempData = Vue.reactive({});

        // Utils
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
        const showTime = (msg, index) => {
            if (!msg.timestamp) return false;
            if (index === 0) return true;
            const prev = currentMessages.value[index-1];
            if (!prev || !prev.timestamp) return true;
            return (msg.timestamp - prev.timestamp) > 5 * 60 * 1000;
        };

        const getMsgTime = (msg) => {
            if (currentContact.value.timePerceptionMode) {
                const d = new Date(msg.timestamp || Date.now());
                return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            } else {
                if (msg.virtualTime) return msg.virtualTime;
                const d = new Date(msg.timestamp || Date.now());
                return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            }
        };

        // Gestures
        let touchStartX = 0;
        const onSwipeStart = (e) => { touchStartX = e.changedTouches[0].screenX; };
        const onSwipeEnd = (e) => {
            if (activeChatId.value || modal.show || bubbleModal.show) return; 
            const endX = e.changedTouches[0].screenX;
            if (endX - touchStartX > 80 && currentTab.value !== 'profile' && currentTab.value !== 'wallet') {
                currentTab.value = 'profile'; 
            } else if (touchStartX - endX > 80 && (currentTab.value === 'profile' || currentTab.value === 'wallet')) {
                currentTab.value = 'messages'; 
            }
        };

        // Profile Gestures
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
        
        // Image Processing
        const processImageUpload = (file, callback) => {
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
                    callback(canvas.toDataURL('image/jpeg', 0.8));
                }
            };
            reader.readAsDataURL(file);
        };

        const handleImgUpload = (e, targetField) => {
            processImageUpload(e.target.files[0], (dataUrl) => {
                store.qqData.profile[targetField] = dataUrl;
            });
        };

        const handleUserCardAvatarUpload = (e, card) => {
            processImageUpload(e.target.files[0], (dataUrl) => {
                card.avatar = dataUrl;
            });
        };

        // Modals
        const openAddModal = () => {
            modal.title = '创建AI好友'; modal.type = 'char';
            Object.assign(tempData, { name: '', nickname: '', persona: '' });
            modal.confirm = () => {
                if (!tempData.name || !tempData.persona) return showError('姓名和人设必填');
                const id = 'contact_' + Date.now();
                store.qqData.contacts.push({ 
                    id, name: tempData.name, nickname: tempData.nickname || tempData.name, 
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
            modal.title = card && card.id ? '编辑名片' : '新建名片'; modal.type = 'user_card';
            if (card && card.id) Object.assign(tempData, { id: card.id, name: card.name, persona: card.persona });
            else Object.assign(tempData, { id: null, name: '', persona: '' });
            
            modal.confirm = () => {
                if (!tempData.name) return showError('名片姓名必填');
                if (tempData.id) {
                    const target = store.qqData.userCards.find(c => c.id === tempData.id);
                    if (target) { target.name = tempData.name; target.persona = tempData.persona; }
                } else {
                    store.qqData.userCards.push({ id: 'uc_' + Date.now(), name: tempData.name, persona: tempData.persona, avatar: null });
                }
                modal.show = false;
            };
            modal.show = true;
        };

        const deleteUserCard = (id) => {
            if (store.qqData.userCards.length <= 1) return showError('至少需保留一个名片');
            store.qqData.userCards = store.qqData.userCards.filter(c => c.id !== id);
        };

        const openChatSettings = () => {
            modal.title = '聊天设置'; modal.type = 'chat_settings';
            const c = currentContact.value;
            Object.assign(tempData, {
                name: c.name, nickname: c.nickname, persona: c.persona,
                userCardId: c.userCardId || store.qqData.userCards[0].id,
                offlineMode: c.offlineMode || false,
                timePerceptionMode: c.timePerceptionMode || false
            });
            modal.confirm = () => {
                c.name = tempData.name; c.nickname = tempData.nickname;
                c.persona = tempData.persona; c.userCardId = tempData.userCardId;
                c.offlineMode = tempData.offlineMode; c.timePerceptionMode = tempData.timePerceptionMode;
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

        // Chat Variables & Inputs
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

        const scrollToBottom = () => {
            setTimeout(() => {
                const area = document.getElementById('chat-area');
                if (area) area.scrollTop = area.scrollHeight + 150;
            }, 100);
        };

        const resizeTextarea = (e) => {
            const el = e.target;
            el.style.height = 'auto';
            let newHeight = el.scrollHeight;
            if (newHeight > 110) newHeight = 110; // Max ~5 lines
            el.style.height = newHeight + 'px';
        };

        const handleEnter = (e) => {
            if (window.innerWidth < 768 || ('ontouchstart' in window)) {
                setTimeout(() => resizeTextarea({target: e.target}), 10);
            } else {
                if (!e.shiftKey) {
                    e.preventDefault();
                    sendUserMsg();
                }
            }
        };

        // Long press Bubble Logic
        const bubbleModal = Vue.reactive({ show: false, msgIndex: -1, msg: null });
        let bubbleTimer = null;
        const onBubbleTouchStart = (msg, index) => {
            bubbleTimer = setTimeout(() => {
                bubbleModal.msgIndex = index;
                bubbleModal.msg = msg;
                bubbleModal.show = true;
            }, 500);
        };
        const onBubbleTouchEnd = () => { if (bubbleTimer) clearTimeout(bubbleTimer); };
        const onBubbleTouchMove = () => { if (bubbleTimer) clearTimeout(bubbleTimer); };

        const quoteMessage = () => {
            quotedMsg.value = bubbleModal.msg;
            bubbleModal.show = false;
        };
        const deleteMessage = () => {
            store.qqData.messages[activeChatId.value].splice(bubbleModal.msgIndex, 1);
            bubbleModal.show = false;
        };

        // Chat Engine
        const sendUserMsg = () => {
            if (!inputText.value.trim()) return;

            // 计算时间感知推演
            let vTime = "";
            if (!currentContact.value.timePerceptionMode) {
                const history = store.qqData.messages[activeChatId.value];
                const lastMsg = history[history.length - 1];
                if (lastMsg && lastMsg.virtualTime) {
                    let [h, m] = lastMsg.virtualTime.split(':').map(Number);
                    m += 1; if(m>=60){m-=60;h+=1;} if(h>=24)h-=24;
                    vTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                } else {
                    const d = new Date();
                    vTime = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                }
            }

            const newMsg = { 
                role: 'user', 
                content: inputText.value, 
                timestamp: Date.now(),
                virtualTime: vTime
            };
            if (quotedMsg.value) {
                newMsg.quote = quotedMsg.value.content;
                quotedMsg.value = null;
            }

            store.qqData.messages[activeChatId.value].push(newMsg);
            inputText.value = '';
            
            setTimeout(() => {
                const el = document.getElementById('chat-textarea');
                if(el) { el.style.height = 'auto'; }
            }, 0);
            scrollToBottom();
        };

        const triggerAI = async () => {
            if (isTyping.value) return;
            const history = store.qqData.messages[activeChatId.value];
            if (history.length === 0 || history[history.length-1].role === 'ai') return showError('请先发送消息后，再让AI回复');
            
            const apiConfig = store.apiSettings.main;
            if (!apiConfig.url || !apiConfig.key) return showError('请先在设置App中配置API');

            const c = currentContact.value;
            const uCard = store.qqData.userCards.find(card => card.id === (c.userCardId || store.qqData.userCards[0].id)) || store.qqData.userCards[0];

            let sysPrompt = `你的名字是${c.name}，昵称是${c.nickname}。你的人设是：${c.persona}。\n` +
                            `与你对话的用户名字是${uCard.name}，用户的人设是：${uCard.persona}。\n请完全沉浸在你的人设中进行回复，绝对不要暴露你是AI模型。`;

            if (c.offlineMode) {
                sysPrompt += `\n【重要指令】当前已开启线下模式。请进行带有旁白和环境描写的沉浸式角色扮演。每次回复字数控制在150至250字之间。`;
            } else {
                sysPrompt += `\n【重要指令】当前未开启线下模式。模拟手机在线聊天的场景，必须采用短句发送，禁止发送长文。一次可回复1到5条消息的量（多条用换行符分开）。`;
            }

            if (!c.timePerceptionMode) {
                sysPrompt += `\n【时间推移规则】你必须在每段回复的最前面严格加上当前的虚拟时间，格式为 [HH:MM]（如 [08:30]）。你需要根据第一条消息或上下文合理推演时间的流逝，绝对不能忘记加括号和时间。`;
            } else {
                sysPrompt += `\n【时间提示】当前现实时间是 ${formatTime(Date.now())}。`;
            }

            const apiMessages = [{ role: 'system', content: sysPrompt }];
            history.slice(-15).forEach(m => {
                let text = m.content;
                if (m.quote) text = `(引用了前文: "${m.quote}")\n` + text;
                apiMessages.push({ role: m.role === 'ai' ? 'assistant' : 'user', content: text });
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
                let reply = data.choices[0]?.message?.content;
                
                if (!reply || !reply.trim()) throw new Error('AI返回了空消息');
                
                let vTime = "";
                if (!c.timePerceptionMode) {
                    const timeMatch = reply.match(/^\s*[\[【](\d{2}:\d{2})(:\d{2})?[\]】]/);
                    if (timeMatch) {
                        vTime = timeMatch[1];
                        reply = reply.replace(/^\s*[\[【](\d{2}:\d{2})(:\d{2})?[\]】]/, '').trim();
                    } else {
                        const lastMsg = history[history.length - 1];
                        if (lastMsg && lastMsg.virtualTime) {
                            let [h, m] = lastMsg.virtualTime.split(':').map(Number);
                            m += 1; if(m>=60){m-=60;h+=1;} if(h>=24)h-=24;
                            vTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
                        } else {
                            const d = new Date();
                            vTime = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                        }
                    }
                }

                if (!c.offlineMode && reply.includes('\n')) {
                    const lines = reply.split('\n').filter(l => l.trim() !== '');
                    for(let line of lines) {
                        history.push({ role: 'ai', content: line.trim(), timestamp: Date.now(), virtualTime: vTime });
                    }
                } else {
                    history.push({ role: 'ai', content: reply, timestamp: Date.now(), virtualTime: vTime });
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
            onSwipeStart, onSwipeEnd, startPress, cancelPress, handleImgUpload,
            openAddModal, openEditProfile, openUserCardModal, openChatSettings, handleCharAvatarUpload,
            formatTime, showTime, getMsgTime, getLastMsg, openChat, currentContact, currentMessages,
            inputText, isTyping, sendUserMsg, triggerAI, handleEnter, resizeTextarea,
            quotedMsg, bubbleModal, onBubbleTouchStart, onBubbleTouchEnd, onBubbleTouchMove,
            quoteMessage, deleteMessage, deleteUserCard, handleUserCardAvatarUpload
        };
    }
};
