/* eslint-disable */
/* eslint-env browser, es2021 */
/* global Vue, window, document, FileReader, Image, fetch */
'use strict';

window.qqApp = {
    template: `
        <div class="qq-container" @touchstart="onSwipeStart" @touchend="onSwipeEnd">
            <div
                class="qq-toast"
                v-show="errorMsg"
                :style="{ transform: 'translateY(' + toastY + 'px)' }"
                @touchstart="onToastTs"
                @touchmove="onToastTm"
            >
                {{ errorMsg }}
            </div>

            <div
                v-if="activeChatId"
                style="height:100%; display:flex; flex-direction:column; background:#fff; position:absolute; width:100%; top:0; left:0; z-index:10;"
            >
                <div class="qq-header">
                    <span
                        @click="backToChatList"
                        style="font-size:28px; padding-right:15px; font-weight:300; cursor:pointer;"
                    >&lsaquo;</span>
                    <span style="flex:1; text-align:center;">{{ currentContact.nickname }}</span>
                    <span
                        v-if="!selectMode"
                        @click="openChatSettings"
                        style="font-size:20px; width:28px; text-align:right; cursor:pointer;"
                    >⚙</span>
                    <span
                        v-else
                        @click="cancelSelection"
                        style="font-size:14px; width:48px; text-align:right; cursor:pointer;"
                    >取消</span>
                </div>

                <div v-if="selectMode" class="qq-select-toolbar">
                    <span>已选择 {{ selectedCount }} 条</span>
                    <div class="qq-select-actions">
                        <button @click="deleteSelectedMsgs">删除</button>
                        <button @click="cancelSelection">取消</button>
                    </div>
                </div>

                <div class="qq-content" id="chat-area" style="padding-top:10px;" @touchstart="closeMsgMenu">
                    <template v-for="(msg, i) in currentMessages" :key="i">
                        <div class="qq-timestamp" v-if="showTime(msg, i)">{{ formatTime(msg.timestamp) }}</div>

                        <div class="qq-msg-row" :class="msg.role">
                            <div
                                v-if="msg.role === 'ai'"
                                class="qq-msg-avatar"
                                :style="{ backgroundImage: currentContact.avatar ? 'url(' + currentContact.avatar + ')' : 'none' }"
                            >
                                {{ !currentContact.avatar ? currentContact.nickname[0] : '' }}
                            </div>

                            <div class="msg-bubble-container">
                                <div style="position:relative;">
                                    <div v-if="activeMsgMenu === i" class="msg-menu">
                                        <span @click.stop="toggleSelectMsg(i)">选择</span>
                                        <span @click.stop="replyMsg(i)">回复</span>
                                    </div>

                                    <div
                                        class="qq-msg-bubble"
                                        :class="{ 'selected-msg': isSelected(i) }"
                                        @click.stop="handleMsgClick(i)"
                                        @touchstart.stop="onMsgTs($event, i)"
                                        @touchend.stop="onMsgTe"
                                        @touchmove.stop="onMsgTm"
                                    >
                                        <div v-if="msg.quote" class="quote-box">{{ msg.quote }}</div>
                                        {{ msg.content }}
                                    </div>
                                </div>

                                <div class="bubble-time" v-if="msg.timeStr">{{ msg.timeStr }}</div>
                            </div>

                            <div
                                v-if="msg.role === 'user'"
                                class="qq-msg-avatar"
                                :style="{ backgroundImage: store.qqData.profile.avatar ? 'url(' + store.qqData.profile.avatar + ')' : 'none' }"
                            >
                                {{ !store.qqData.profile.avatar ? store.qqData.profile.nickname[0] : '' }}
                            </div>
                        </div>
                    </template>

                    <div v-if="isTyping" class="qq-msg-row ai">
                        <div
                            class="qq-msg-avatar"
                            :style="{ backgroundImage: currentContact.avatar ? 'url(' + currentContact.avatar + ')' : 'none' }"
                        >
                            {{ !currentContact.avatar ? currentContact.nickname[0] : '' }}
                        </div>
                        <div class="msg-bubble-container">
                            <div class="qq-msg-bubble typing-anim">正在输入中...</div>
                        </div>
                    </div>
                </div>

                <div class="qq-input-area">
                    <div v-if="quotedMsgText" class="quote-preview">
                        <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            回复: {{ quotedMsgText }}
                        </span>
                        <span
                            @click="clearQuote"
                            style="cursor:pointer; padding:0 10px; font-weight:bold; font-size:16px;"
                        >×</span>
                    </div>

                    <div class="qq-input-bar">
                        <textarea
                            v-model="inputText"
                            @input="adjustHeight"
                            @keydown.enter.prevent="handleEnter"
                            ref="chatInputRef"
                            rows="1"
                            placeholder="输入文字..."
                        ></textarea>
                        <button @click="handleAiBtnClick">{{ inputText.trim() ? '发送' : 'AI' }}</button>
                    </div>
                </div>
            </div>

            <div v-else style="height:100%; display:flex; flex-direction:column;">
                <div v-show="currentTab === 'messages'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span style="font-size:20px; font-weight:bold;">消息</span>
                        <span @click="openAddModal" style="font-size:26px; font-weight:300; cursor:pointer;">+</span>
                    </div>
                    <div class="qq-content">
                        <div
                            v-if="store.qqData.contacts.length === 0"
                            style="text-align:center; margin-top:80px; color:#999; font-size:14px;"
                        >
                            点击右上角 + 创建AI好友
                        </div>

                        <div
                            v-for="c in store.qqData.contacts"
                            :key="c.id"
                            class="qq-contact-item"
                            @click="openChat(c.id)"
                        >
                            <div
                                class="qq-contact-avatar"
                                :style="{ backgroundImage: c.avatar ? 'url(' + c.avatar + ')' : 'none' }"
                            >
                                {{ !c.avatar ? c.nickname[0] : '' }}
                            </div>
                            <div class="qq-contact-info">
                                <div class="qq-contact-name">{{ c.nickname }}</div>
                                <div class="qq-contact-preview">{{ getLastMsg(c.id) }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-show="currentTab === 'moments'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span style="font-size:20px; font-weight:bold;">朋友圈</span>
                    </div>
                    <div class="qq-content" style="padding-bottom:20px;">
                        <div
                            class="qq-profile-header"
                            style="height:250px; border:none; margin-bottom:50px;"
                            :style="{ backgroundImage: store.qqData.profile.bgImage ? 'url(' + store.qqData.profile.bgImage + ')' : 'none' }"
                        >
                            <div
                                class="qq-profile-avatar"
                                style="bottom:-30px; right:20px; left:auto; width:75px; height:75px;"
                                :style="{ backgroundImage: store.qqData.profile.avatar ? 'url(' + store.qqData.profile.avatar + ')' : 'none' }"
                            ></div>
                            <div
                                style="position:absolute; bottom:-25px; right:110px; font-weight:bold; font-size:18px; color:#262626; text-shadow:0 0 5px #fff;"
                            >
                                {{ store.qqData.profile.nickname }}
                            </div>
                        </div>
                        <div style="text-align:center; padding:40px 0; color:#8e8e8e; font-size:14px;">暂无动态</div>
                    </div>
                </div>

                <div v-show="currentTab === 'profile'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span style="font-size:20px; font-weight:bold;">主页</span>
                    </div>
                    <div class="qq-content">
                        <div
                            class="qq-profile-header"
                            @touchstart="startPress('qq_bg')"
                            @touchend="cancelPress"
                            @touchmove="cancelPress"
                            :style="{ backgroundImage: store.qqData.profile.bgImage ? 'url(' + store.qqData.profile.bgImage + ')' : 'none' }"
                        >
                            <div
                                class="qq-profile-avatar"
                                @touchstart.stop="startPress('qq_avatar')"
                                @touchend="cancelPress"
                                @touchmove="cancelPress"
                                :style="{ backgroundImage: store.qqData.profile.avatar ? 'url(' + store.qqData.profile.avatar + ')' : 'none' }"
                            ></div>
                        </div>

                        <div style="padding:55px 24px 10px;">
                            <h2
                                style="margin-bottom:8px; font-size:22px;"
                                @touchstart="startPress('edit_profile')"
                                @touchend="cancelPress"
                                @touchmove="cancelPress"
                            >
                                {{ store.qqData.profile.nickname }}
                            </h2>
                            <p
                                style="color:#262626; font-size:15px; line-height:1.5;"
                                @touchstart="startPress('edit_profile')"
                                @touchend="cancelPress"
                                @touchmove="cancelPress"
                            >
                                {{ store.qqData.profile.signature }}
                            </p>
                        </div>

                        <div style="padding:10px 24px 20px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span style="font-size:16px; font-weight:600;">我的名片夹</span>
                                <span @click="openUserCardModal()" style="font-size:24px; font-weight:300; cursor:pointer;">+</span>
                            </div>

                            <div
                                v-for="card in store.qqData.userCards"
                                :key="card.id"
                                class="user-card"
                                @touchstart="startPress('edit_card', card)"
                                @touchend="cancelPress"
                                @touchmove="cancelPress"
                                style="display:flex; align-items:center;"
                            >
                                <div
                                    style="width:40px; height:40px; border-radius:50%; background:#efefef; background-size:cover; background-position:center; margin-right:12px; border:1px solid #000;"
                                    :style="{ backgroundImage: card.avatar ? 'url(' + card.avatar + ')' : 'none' }"
                                ></div>
                                <div style="flex:1; overflow:hidden;">
                                    <div style="font-weight:600; font-size:15px; margin-bottom:4px;">{{ card.name }}</div>
                                    <div
                                        style="font-size:13px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                                    >
                                        {{ card.persona }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <input type="file" accept="image/*" id="qq_bg" style="display:none;" @change="handleImgUpload($event, 'bgImage')">
                        <input type="file" accept="image/*" id="qq_avatar" style="display:none;" @change="handleImgUpload($event, 'avatar')">
                    </div>
                </div>

                <div v-show="currentTab === 'wallet'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                    <div class="qq-header">
                        <span
                            @click="currentTab = 'profile'"
                            style="font-size:28px; padding-right:15px; font-weight:300; cursor:pointer;"
                        >&lsaquo;</span>
                        <span style="flex:1; text-align:center;">钱包</span>
                        <span style="width:28px;"></span>
                    </div>
                    <div class="qq-content" style="background:#f5f5f5;">
                        <div style="background:#fff; padding:40px 20px; text-align:center; margin-bottom:10px;">
                            <div style="color:#666; font-size:15px; margin-bottom:15px;">我的零钱</div>
                            <div style="font-size:40px; font-weight:bold;">¥ {{ store.qqData.wallet.balance.toFixed(2) }}</div>
                        </div>
                    </div>
                </div>

                <div class="qq-bottom-bar" v-if="['messages', 'moments'].includes(currentTab)">
                    <div :class="{ active: currentTab === 'messages' }" @click="currentTab = 'messages'">消息</div>
                    <div :class="{ active: currentTab === 'moments' }" @click="currentTab = 'moments'">朋友圈</div>
                </div>

                <div class="qq-bottom-bar" v-if="['profile', 'wallet'].includes(currentTab)">
                    <div :class="{ active: currentTab === 'profile' }" @click="currentTab = 'profile'">设置</div>
                    <div :class="{ active: currentTab === 'wallet' }" @click="currentTab = 'wallet'">钱包</div>
                </div>
            </div>

            <div class="qq-modal-overlay" v-if="modal.show">
                <div class="qq-modal">
                    <h3 style="margin-bottom:18px; text-align:center; font-size:16px;">{{ modal.title }}</h3>

                    <template v-if="modal.type === 'char'">
                        <input v-model="tempData.name" placeholder="真实姓名 (必填)">
                        <input v-model="tempData.nickname" placeholder="昵称">
                        <textarea v-model="tempData.persona" placeholder="详细人设描述" rows="3"></textarea>
                    </template>

                    <template v-if="modal.type === 'chat_settings'">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div
                                    style="width:50px; height:50px; border-radius:50%; border:1px solid #000; background-size:cover; background-position:center;"
                                    :style="{ backgroundImage: tempData.avatar ? 'url(' + tempData.avatar + ')' : 'none' }"
                                ></div>
                                <button @click="triggerUpload('temp_char_avatar')" style="font-size:12px; padding:6px 12px;">修改 Char 头像</button>
                                <input
                                    type="file"
                                    id="temp_char_avatar"
                                    accept="image/*"
                                    style="display:none;"
                                    @change="handleImgUpload($event, 'chat_temp_avatar')"
                                >
                            </div>
                            <button @click="deleteChat" style="font-size:12px; padding:6px 12px;">删除该联系人</button>
                        </div>

                        <input v-model="tempData.name" placeholder="Char 姓名">
                        <input v-model="tempData.nickname" placeholder="Char 昵称">
                        <textarea v-model="tempData.persona" rows="3" placeholder="Char 人设"></textarea>

                        <label style="font-size:13px; color:#666;">选择你的身份 (名片)</label>
                        <select v-model="tempData.userCardId">
                            <option v-for="uc in store.qqData.userCards" :key="uc.id" :value="uc.id">{{ uc.name }}</option>
                        </select>

                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:5px;">
                            <span style="font-size:14px; font-weight:bold;">线下沉浸模式</span>
                            <input type="checkbox" v-model="tempData.offlineMode" style="width:20px; height:20px; margin:0; border:none;">
                        </div>

                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
                            <span style="font-size:14px; font-weight:bold;">时间感知模式 (真实时间)</span>
                            <input type="checkbox" v-model="tempData.timeSenseMode" style="width:20px; height:20px; margin:0; border:none;">
                        </div>

                        <div v-if="!tempData.timeSenseMode" style="margin-top:10px; margin-bottom:15px;">
                            <label style="font-size:13px; color:#666;">虚拟时间初始值 (只读/初始设定)</label>
                            <input
                                v-model="tempData.virtualTimeStr"
                                :disabled="currentContact.timeLocked"
                                placeholder="如 10:13，发送后锁定"
                                style="margin-bottom:0;"
                            >
                        </div>
                    </template>

                    <template v-if="modal.type === 'user_card'">
                        <div style="display:flex; justify-content:space-between; margin-bottom:15px; gap:10px; align-items:center;">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div
                                    style="width:50px; height:50px; border-radius:50%; border:1px solid #000; background-size:cover; background-position:center;"
                                    :style="{ backgroundImage: tempData.avatar ? 'url(' + tempData.avatar + ')' : 'none' }"
                                ></div>
                                <button @click="triggerUpload('uc_avatar')" style="font-size:12px; padding:6px 12px;">修改头像</button>
                                <input
                                    type="file"
                                    id="uc_avatar"
                                    accept="image/*"
                                    style="display:none;"
                                    @change="handleImgUpload($event, 'uc_avatar_temp')"
                                >
                            </div>
                            <button
                                v-if="tempData.id && tempData.id !== 'uc_default'"
                                @click="deleteUserCard"
                                style="font-size:12px; padding:6px 12px; background:#000 !important; color:#fff !important; border:1px solid #000 !important;"
                            >
                                删除名片
                            </button>
                        </div>

                        <input v-model="tempData.name" placeholder="名片姓名 (必填)">
                        <textarea v-model="tempData.persona" placeholder="你的具体人设与设定" rows="4"></textarea>
                    </template>

                    <template v-if="modal.type === 'profile'">
                        <input v-model="tempData.nickname" placeholder="昵称">
                        <textarea v-model="tempData.signature" placeholder="个性签名" rows="2"></textarea>
                    </template>

                    <div class="qq-modal-btns">
                        <button @click="modal.show = false">取消</button>
                        <button @click="modal.confirm">确定</button>
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

        const inputText = Vue.ref('');
        const isTyping = Vue.ref(false);
        const chatInputRef = Vue.ref(null);
        const quotedMsgText = Vue.ref('');

        const activeMsgMenu = Vue.ref(null);
        const selectMode = Vue.ref(false);
        const selectedMsgIndexes = Vue.ref([]);

        const currentContact = Vue.computed(function () {
            return store.qqData.contacts.find(function (c) {
                return c.id === activeChatId.value;
            });
        });

        const currentMessages = Vue.computed(function () {
            return store.qqData.messages[activeChatId.value] || [];
        });

        const selectedCount = Vue.computed(function () {
            return selectedMsgIndexes.value.length;
        });

        const triggerUpload = function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.click();
            }
        };

        const showError = function (msg) {
            errorMsg.value = msg;
            toastY.value = 0;
            if (errTimer) {
                window.clearTimeout(errTimer);
            }
            errTimer = window.setTimeout(function () {
                errorMsg.value = '';
            }, 3000);
        };

        let toastStartY = 0;

        const onToastTs = function (e) {
            toastStartY = e.touches[0].clientY;
        };

        const onToastTm = function (e) {
            const y = e.touches[0].clientY;
            if (y - toastStartY < 0) {
                toastY.value = y - toastStartY;
                if (toastY.value < -40) {
                    errorMsg.value = '';
                }
            }
        };

        const formatTime = function (ts) {
            if (!ts) {
                return '';
            }
            const d = new Date(ts);
            return (d.getMonth() + 1) + '-' + d.getDate() + ' ' +
                String(d.getHours()).padStart(2, '0') + ':' +
                String(d.getMinutes()).padStart(2, '0');
        };

        const showTime = function (msg, index) {
            if (!msg.timestamp) {
                return false;
            }
            if (index === 0) {
                return true;
            }
            const prev = currentMessages.value[index - 1];
            if (!prev || !prev.timestamp) {
                return true;
            }
            return (msg.timestamp - prev.timestamp) > 5 * 60 * 1000;
        };

        let touchStartX = 0;

        const onSwipeStart = function (e) {
            touchStartX = e.changedTouches[0].screenX;
        };

        const onSwipeEnd = function (e) {
            if (activeChatId.value || modal.show) {
                return;
            }
            const endX = e.changedTouches[0].screenX;
            if (endX - touchStartX > 80 && currentTab.value !== 'profile' && currentTab.value !== 'wallet') {
                currentTab.value = 'profile';
            } else if (touchStartX - endX > 80 && (currentTab.value === 'profile' || currentTab.value === 'wallet')) {
                currentTab.value = 'messages';
            }
        };

        let pressTimer = null;

        const startPress = function (action, payload) {
            pressTimer = window.setTimeout(function () {
                if (action === 'qq_bg') {
                    const bgEl = document.getElementById('qq_bg');
                    if (bgEl) {
                        bgEl.click();
                    }
                }
                if (action === 'qq_avatar') {
                    const avatarEl = document.getElementById('qq_avatar');
                    if (avatarEl) {
                        avatarEl.click();
                    }
                }
                if (action === 'edit_profile') {
                    openEditProfile();
                }
                if (action === 'edit_card') {
                    openUserCardModal(payload);
                }
            }, 500);
        };

        const cancelPress = function () {
            if (pressTimer) {
                window.clearTimeout(pressTimer);
            }
        };

        const handleImgUpload = function (event, targetField) {
            const file = event.target.files && event.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width;
                    let h = img.height;

                    if (w > 600) {
                        h = Math.round(h * 600 / w);
                        w = 600;
                    }

                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);

                    const b64 = canvas.toDataURL('image/jpeg', 0.8);

                    if (targetField === 'uc_avatar_temp') {
                        tempData.avatar = b64;
                    } else if (targetField === 'chat_temp_avatar') {
                        tempData.avatar = b64;
                    } else {
                        store.qqData.profile[targetField] = b64;
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        };

        const openAddModal = function () {
            modal.title = '创建AI好友';
            modal.type = 'char';
            Object.assign(tempData, { name: '', nickname: '', persona: '' });

            modal.confirm = function () {
                if (!tempData.name || !tempData.persona) {
                    return showError('姓名和人设必填');
                }

                const id = 'contact_' + Date.now();
                store.qqData.contacts.push({
                    id: id,
                    name: tempData.name,
                    nickname: tempData.nickname || tempData.name,
                    persona: tempData.persona,
                    avatar: null,
                    offlineMode: false,
                    userCardId: store.qqData.userCards[0].id,
                    timeSenseMode: false,
                    virtualTimeStr: '',
                    timeLocked: false
                });
                store.qqData.messages[id] = [];
                modal.show = false;
            };

            modal.show = true;
        };

        const openEditProfile = function () {
            modal.title = '修改个人信息';
            modal.type = 'profile';
            Object.assign(tempData, {
                nickname: store.qqData.profile.nickname,
                signature: store.qqData.profile.signature
            });

            modal.confirm = function () {
                store.qqData.profile.nickname = tempData.nickname;
                store.qqData.profile.signature = tempData.signature;
                modal.show = false;
            };

            modal.show = true;
        };

        const openUserCardModal = function (card) {
            modal.title = card ? '编辑名片' : '新建名片';
            modal.type = 'user_card';

            if (card) {
                Object.assign(tempData, {
                    id: card.id,
                    name: card.name,
                    persona: card.persona,
                    avatar: card.avatar
                });
            } else {
                Object.assign(tempData, {
                    id: null,
                    name: '',
                    persona: '',
                    avatar: null
                });
            }

            modal.confirm = function () {
                if (!tempData.name) {
                    return showError('名片姓名必填');
                }

                if (tempData.id) {
                    const target = store.qqData.userCards.find(function (c) {
                        return c.id === tempData.id;
                    });
                    if (target) {
                        target.name = tempData.name;
                        target.persona = tempData.persona;
                        target.avatar = tempData.avatar;
                    }
                } else {
                    store.qqData.userCards.push({
                        id: 'uc_' + Date.now(),
                        name: tempData.name,
                        persona: tempData.persona,
                        avatar: tempData.avatar
                    });
                }

                modal.show = false;
            };

            modal.show = true;
        };

        const deleteUserCard = function () {
            store.qqData.userCards = store.qqData.userCards.filter(function (c) {
                return c.id !== tempData.id;
            });
            modal.show = false;
        };

        const openChatSettings = function () {
            modal.title = '聊天设置';
            modal.type = 'chat_settings';

            const c = currentContact.value;
            Object.assign(tempData, {
                name: c.name,
                nickname: c.nickname,
                persona: c.persona,
                avatar: c.avatar,
                userCardId: c.userCardId || store.qqData.userCards[0].id,
                offlineMode: c.offlineMode || false,
                timeSenseMode: c.timeSenseMode || false,
                virtualTimeStr: c.virtualTimeStr || ''
            });

            modal.confirm = function () {
                const oldTimeSenseMode = c.timeSenseMode;

                c.name = tempData.name;
                c.nickname = tempData.nickname;
                c.persona = tempData.persona;
                c.userCardId = tempData.userCardId;
                c.offlineMode = tempData.offlineMode;
                c.avatar = tempData.avatar;
                c.timeSenseMode = tempData.timeSenseMode;

                if (!c.timeSenseMode) {
                    if (oldTimeSenseMode) {
                        const lastTime = getLastMessageTimeStr(c.id);
                        if (lastTime) {
                            c.virtualTimeStr = lastTime;
                            c.timeLocked = true;
                        } else if (!c.timeLocked) {
                            c.virtualTimeStr = tempData.virtualTimeStr;
                            if (c.virtualTimeStr) {
                                c.timeLocked = true;
                            }
                        }
                    } else if (!c.timeLocked) {
                        c.virtualTimeStr = tempData.virtualTimeStr;
                        if (c.virtualTimeStr) {
                            c.timeLocked = true;
                        }
                    }
                }

                modal.show = false;
            };

            modal.show = true;
        };

        const deleteChat = function () {
            const id = activeChatId.value;
            store.qqData.contacts = store.qqData.contacts.filter(function (c) {
                return c.id !== id;
            });
            delete store.qqData.messages[id];
            modal.show = false;
            activeChatId.value = null;
            cancelSelection();
            clearQuote();
        };

        const getLastMsg = function (id) {
            const msgs = store.qqData.messages[id] || [];
            return msgs.length > 0 ? msgs[msgs.length - 1].content : '暂无消息';
        };

        const openChat = function (id) {
            activeChatId.value = id;
            cancelSelection();
            clearQuote();
            closeMsgMenu();
            scrollToBottom();
        };

        const backToChatList = function () {
            activeChatId.value = null;
            cancelSelection();
            closeMsgMenu();
        };

        const adjustHeight = function () {
            const el = chatInputRef.value;
            if (!el) {
                return;
            }
            el.style.height = '36px';
            el.style.height = Math.min(el.scrollHeight, 108) + 'px';
        };

        const resetInputHeight = function () {
            const el = chatInputRef.value;
            if (!el) {
                return;
            }
            el.style.height = '36px';
        };

        const scrollToBottom = function () {
            window.setTimeout(function () {
                const area = document.getElementById('chat-area');
                if (area) {
                    area.scrollTop = area.scrollHeight + 200;
                }
            }, 100);
        };

        let msgPressTimer = null;
        let msgTouchY = 0;

        const onMsgTs = function (e, index) {
            msgTouchY = e.touches[0].clientY;
            msgPressTimer = window.setTimeout(function () {
                activeMsgMenu.value = index;
            }, 500);
        };

        const onMsgTm = function (e) {
            if (Math.abs(e.touches[0].clientY - msgTouchY) > 10 && msgPressTimer) {
                window.clearTimeout(msgPressTimer);
            }
        };

        const onMsgTe = function () {
            if (msgPressTimer) {
                window.clearTimeout(msgPressTimer);
            }
        };

        const closeMsgMenu = function () {
            activeMsgMenu.value = null;
        };

        const isSelected = function (index) {
            return selectedMsgIndexes.value.indexOf(index) !== -1;
        };

        const sortSelectedIndexes = function () {
            selectedMsgIndexes.value = selectedMsgIndexes.value.slice().sort(function (a, b) {
                return a - b;
            });
        };

        const toggleSelectMsg = function (index) {
            if (!selectMode.value) {
                selectMode.value = true;
            }

            const pos = selectedMsgIndexes.value.indexOf(index);
            if (pos === -1) {
                selectedMsgIndexes.value.push(index);
                sortSelectedIndexes();
            } else {
                selectedMsgIndexes.value.splice(pos, 1);
            }

            if (selectedMsgIndexes.value.length === 0) {
                selectMode.value = false;
            }

            activeMsgMenu.value = null;
        };

        const handleMsgClick = function (index) {
            if (!selectMode.value) {
                return;
            }
            toggleSelectMsg(index);
        };

        const cancelSelection = function () {
            selectMode.value = false;
            selectedMsgIndexes.value = [];
        };

        const deleteSelectedMsgs = function () {
            if (!activeChatId.value || selectedMsgIndexes.value.length === 0) {
                return;
            }

            const indexes = selectedMsgIndexes.value.slice().sort(function (a, b) {
                return b - a;
            });

            indexes.forEach(function (idx) {
                store.qqData.messages[activeChatId.value].splice(idx, 1);
            });

            cancelSelection();
            closeMsgMenu();
        };

        const replyMsg = function (index) {
            const msg = store.qqData.messages[activeChatId.value][index];
            if (!msg) {
                return;
            }
            quotedMsgText.value = msg.content.length > 40 ? msg.content.slice(0, 40) + '...' : msg.content;
            activeMsgMenu.value = null;
        };

        const clearQuote = function () {
            quotedMsgText.value = '';
        };

        const pad2 = function (n) {
            return String(n).padStart(2, '0');
        };

        const parseTimeStr = function (str) {
            if (!str || typeof str !== 'string') {
                return null;
            }
            const parts = str.split(':');
            if (parts.length !== 2) {
                return null;
            }
            let h = Number(parts[0]);
            let m = Number(parts[1]);
            if (Number.isNaN(h) || Number.isNaN(m)) {
                return null;
            }
            h = Math.max(0, Math.min(23, h));
            m = Math.max(0, Math.min(59, m));
            return { h: h, m: m };
        };

        const formatClock = function (timeObj) {
            return pad2(timeObj.h) + ':' + pad2(timeObj.m);
        };

        const addMinutesToTime = function (timeObj, minutes) {
            const total = (timeObj.h * 60 + timeObj.m + minutes) % (24 * 60);
            const safeTotal = total < 0 ? total + 24 * 60 : total;
            return {
                h: Math.floor(safeTotal / 60),
                m: safeTotal % 60
            };
        };

        const getNowClock = function () {
            const d = new Date();
            return {
                h: d.getHours(),
                m: d.getMinutes()
            };
        };

        const getLastMessageTimeStr = function (chatId) {
            const msgs = store.qqData.messages[chatId] || [];
            for (let i = msgs.length - 1; i >= 0; i -= 1) {
                if (msgs[i] && msgs[i].timeStr) {
                    return msgs[i].timeStr;
                }
            }
            return '';
        };

        const getVirtualBaseTime = function (contact) {
            const lastMsgTime = getLastMessageTimeStr(contact.id);
            if (lastMsgTime) {
                return parseTimeStr(lastMsgTime);
            }

            if (contact.virtualTimeStr) {
                return parseTimeStr(contact.virtualTimeStr);
            }

            return getNowClock();
        };

        const getMsgTimeStr = function (contact) {
            if (contact.timeSenseMode) {
                const now = getNowClock();
                return formatClock(now);
            }

            const lastMsgTime = getLastMessageTimeStr(contact.id);
            let nextTime;

            if (lastMsgTime) {
                nextTime = addMinutesToTime(parseTimeStr(lastMsgTime), Math.floor(Math.random() * 3) + 1);
            } else if (contact.virtualTimeStr) {
                nextTime = parseTimeStr(contact.virtualTimeStr) || getNowClock();
            } else {
                nextTime = getNowClock();
            }

            contact.virtualTimeStr = formatClock(nextTime);
            contact.timeLocked = true;
            return contact.virtualTimeStr;
        };

        const buildAiBatchTimeList = function (contact, count) {
            const times = [];

            if (contact.timeSenseMode) {
                const now = formatClock(getNowClock());
                for (let i = 0; i < count; i += 1) {
                    times.push(now);
                }
                return times;
            }

            let base = getVirtualBaseTime(contact);
            let firstAdd = Math.floor(Math.random() * 2) + 1;
            let firstTime;

            if (getLastMessageTimeStr(contact.id)) {
                firstTime = addMinutesToTime(base, firstAdd);
            } else if (contact.virtualTimeStr) {
                firstTime = parseTimeStr(contact.virtualTimeStr) || getNowClock();
            } else {
                firstTime = getNowClock();
            }

            times.push(formatClock(firstTime));

            let usedSpan = 0;
            let current = firstTime;

            for (let i = 1; i < count; i += 1) {
                const remain = 3 - usedSpan;
                const add = remain > 0 ? Math.floor(Math.random() * (remain + 1)) : 0;
                usedSpan += add;
                current = addMinutesToTime(current, add);
                times.push(formatClock(current));
            }

            contact.virtualTimeStr = times[times.length - 1];
            contact.timeLocked = true;

            return times;
        };

        const sendUserMsg = function () {
            if (!inputText.value.trim()) {
                return;
            }

            const c = currentContact.value;
            const newMsg = {
                role: 'user',
                content: inputText.value,
                timestamp: Date.now(),
                timeStr: getMsgTimeStr(c)
            };

            if (quotedMsgText.value) {
                newMsg.quote = quotedMsgText.value;
                clearQuote();
            }

            store.qqData.messages[activeChatId.value].push(newMsg);
            inputText.value = '';
            resetInputHeight();
            scrollToBottom();
        };

        const triggerAI = async function () {
            if (isTyping.value) {
                return;
            }

            const history = store.qqData.messages[activeChatId.value];
            if (history.length === 0 || history[history.length - 1].role === 'ai') {
                return showError('请先发送您的消息，再让AI回复');
            }

            const apiConfig = store.apiSettings.main;
            if (!apiConfig.url || !apiConfig.key) {
                return showError('请先在设置App中配置主API');
            }

            const c = currentContact.value;
            const uCard = store.qqData.userCards.find(function (card) {
                return card.id === (c.userCardId || store.qqData.userCards[0].id);
            }) || store.qqData.userCards[0];

            let sysPrompt =
                '你的名字是' + c.name + '，昵称是' + c.nickname + '。你的人设是：' + c.persona + '。\\n' +
                '与你对话的用户名字是' + uCard.name + '，用户的人设是：' + uCard.persona + '。\\n' +
                '请完全沉浸在你的人设中进行回复，绝对不要暴露你是AI模型。';

            if (c.offlineMode) {
                sysPrompt += '\\n【重要指令】当前已开启线下模式。请进行带有旁白和环境描写的沉浸式角色扮演。回复字数控制在150字到250字之间。';
            } else {
                sysPrompt += '\\n【重要指令】当前未开启线下模式。请模拟手机在线聊天的场景，必须采用短句发送，禁止发送大段长文。一次可以回复1到5条消息的量（如果是多条消息，请用换行符分开）。';
            }

            const apiMessages = [{ role: 'system', content: sysPrompt }];
            history.slice(-15).forEach(function (m) {
                apiMessages.push({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: m.content
                });
            });

            isTyping.value = true;
            scrollToBottom();

            try {
                const res = await fetch(apiConfig.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiConfig.key
                    },
                    body: JSON.stringify({
                        model: apiConfig.model,
                        messages: apiMessages
                    })
                });

                if (!res.ok) {
                    throw new Error('请求失败 (' + res.status + ')');
                }

                const data = await res.json();
                const reply = data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';

                if (!reply || !reply.trim()) {
                    throw new Error('AI返回了空消息');
                }

                if (!c.offlineMode && reply.indexOf('\n') !== -1) {
                    const lines = reply.split('\n').filter(function (l) {
                        return l.trim() !== '';
                    });

                    const timeList = buildAiBatchTimeList(c, lines.length);

                    for (let i = 0; i < lines.length; i += 1) {
                        history.push({
                            role: 'ai',
                            content: lines[i].trim(),
                            timestamp: Date.now(),
                            timeStr: timeList[i]
                        });
                    }
                } else {
                    const oneTime = buildAiBatchTimeList(c, 1)[0];
                    history.push({
                        role: 'ai',
                        content: reply,
                        timestamp: Date.now(),
                        timeStr: oneTime
                    });
                }

                scrollToBottom();
            } catch (err) {
                showError('AI回复异常: ' + err.message);
            } finally {
                isTyping.value = false;
            }
        };

        const handleAiBtnClick = function () {
            if (inputText.value.trim()) {
                sendUserMsg();
            } else {
                triggerAI();
            }
        };

        const handleEnter = function (e) {
            if (e.shiftKey) {
                inputText.value += '\n';
                Vue.nextTick(function () {
                    adjustHeight();
                });
                return;
            }
            handleAiBtnClick();
        };

        return {
            store: store,
            currentTab: currentTab,
            activeChatId: activeChatId,
            modal: modal,
            tempData: tempData,
            triggerUpload: triggerUpload,
            errorMsg: errorMsg,
            toastY: toastY,
            onToastTs: onToastTs,
            onToastTm: onToastTm,
            onSwipeStart: onSwipeStart,
            onSwipeEnd: onSwipeEnd,
            startPress: startPress,
            cancelPress: cancelPress,
            handleImgUpload: handleImgUpload,
            openAddModal: openAddModal,
            openEditProfile: openEditProfile,
            openUserCardModal: openUserCardModal,
            deleteUserCard: deleteUserCard,
            openChatSettings: openChatSettings,
            deleteChat: deleteChat,
            formatTime: formatTime,
            showTime: showTime,
            getLastMsg: getLastMsg,
            openChat: openChat,
            currentContact: currentContact,
            currentMessages: currentMessages,
            inputText: inputText,
            isTyping: isTyping,
            chatInputRef: chatInputRef,
            adjustHeight: adjustHeight,
            activeMsgMenu: activeMsgMenu,
            onMsgTs: onMsgTs,
            onMsgTm: onMsgTm,
            onMsgTe: onMsgTe,
            closeMsgMenu: closeMsgMenu,
            quotedMsgText: quotedMsgText,
            clearQuote: clearQuote,
            sendUserMsg: sendUserMsg,
            triggerAI: triggerAI,
            handleAiBtnClick: handleAiBtnClick,
            handleEnter: handleEnter,
            replyMsg: replyMsg,
            selectMode: selectMode,
            selectedMsgIndexes: selectedMsgIndexes,
            selectedCount: selectedCount,
            toggleSelectMsg: toggleSelectMsg,
            handleMsgClick: handleMsgClick,
            isSelected: isSelected,
            deleteSelectedMsgs: deleteSelectedMsgs,
            cancelSelection: cancelSelection,
            backToChatList: backToChatList
        };
    }
};
