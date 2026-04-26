/* eslint-disable */
/* eslint-env browser, es2021 */
/* global Vue, window, document, FileReader, Image, fetch, console */
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

                <div class="qq-content" id="chat-area" style="padding-top:10px;" @touchstart="closeMsgMenu" @scroll="onChatScroll">
                    <template v-for="item in enhancedMessages" :key="item.index">
                        <div class="qq-timestamp" v-if="item.showTimeFlag">{{ item.dateStr }}</div>

                        <div class="qq-msg-row" :class="item.msg.role">
                            <div
                                v-if="item.msg.role === 'ai'"
                                class="qq-msg-avatar"
                                :style="{ backgroundImage: currentContact.avatar ? 'url(' + currentContact.avatar + ')' : 'none' }"
                            >
                                {{ !currentContact.avatar ? currentContact.nickname[0] : '' }}
                            </div>

                            <div class="msg-bubble-container">
                                <div style="position:relative;">
                                    <div v-if="activeMsgMenu === item.index" class="msg-menu" @touchstart.stop>
                                        <span @click.stop="toggleSelectMsg(item.index)">选择</span>
                                        <span @click.stop="replyMsg(item.index)">回复</span>
                                    </div>

                                    <div
                                        class="qq-msg-bubble"
                                        :class="{ 'selected-msg': isSelected(item.index) }"
                                        @click.stop="handleMsgClick(item.index)"
                                        @touchstart.stop="onMsgTs($event, item.index)"
                                        @touchend.stop="onMsgTe"
                                        @touchmove.stop="onMsgTm"
                                    >
                                        <div v-if="item.msg.quote" class="quote-box">{{ item.msg.quote }}</div>
                                        {{ item.msg.content }}
                                    </div>
                                </div>

                                <div class="bubble-time" v-if="item.msg.timeStr">{{ item.msg.timeStr }}</div>
                            </div>

                            <div
                                v-if="item.msg.role === 'user'"
                                class="qq-msg-avatar"
                                :style="{ backgroundImage: currentUserCard.avatar ? 'url(' + currentUserCard.avatar + ')' : 'none' }"
                            >
                                {{ !currentUserCard.avatar ? currentUserCard.name[0] : '' }}
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

                <div v-show="currentTab === 'moments'" style="flex:1; display:flex; flex-direction:column; overflow:hidden;" @click="showMomentsMenu = false; activeMomentAction = null">
                    <div class="qq-header">
                        <span style="font-size:20px; font-weight:bold;">朋友圈</span>
                        <div style="position:relative;">
                            <span @click.stop="showMomentsMenu = !showMomentsMenu; activeMomentAction = null;" style="font-size:26px; font-weight:300; cursor:pointer; padding: 0 10px;">+</span>
                            <div v-if="showMomentsMenu" class="moments-menu" @click.stop>
                                <div @click="openPublishMoment">发布朋友圈</div>
                                <div @click="refreshMoments">刷新动态</div>
                            </div>
                        </div>
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

                        <div v-if="!store.qqData.moments || store.qqData.moments.length === 0" style="text-align:center; padding:40px 0; color:#8e8e8e; font-size:14px;">暂无动态</div>

                        <div v-for="m in store.qqData.moments" :key="m.id" class="moment-item">
                            <div class="moment-avatar" :style="{ backgroundImage: store.qqData.profile.avatar ? 'url(' + store.qqData.profile.avatar + ')' : 'none' }"></div>
                            <div class="moment-main">
                                <div class="moment-name">{{ store.qqData.profile.nickname }}</div>
                                <div class="moment-content">{{ m.content }}</div>
                                
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; position:relative;">
                                    <div class="moment-time">{{ formatTime(m.timestamp) }}</div>
                                    <div style="background:#f1f1f1; border-radius:4px; padding:0 8px; color:#555; font-weight:bold; letter-spacing:2px; font-size:16px; cursor:pointer; line-height:20px; height:20px; display:flex; align-items:center;" @click.stop="toggleMomentAction(m.id)">..</div>
                                    
                                    <div v-if="activeMomentAction === m.id" class="moment-action-menu" @click.stop>
                                        <span @click="toggleLike(m)">{{ hasLiked(m) ? '取消' : '赞' }}</span>
                                        <span @click="openCommentModal(m)">评论</span>
                                        <span @click="deleteMoment(m.id)">删除</span>
                                    </div>
                                </div>

                                <div class="moment-interactions" v-if="(m.likes && m.likes.length) || (m.comments && m.comments.length)">
                                    <div class="moment-likes" :class="{'has-border': m.comments && m.comments.length}" v-if="m.likes && m.likes.length">
                                        <span style="color:#576b95; font-size:12px;">❤</span> {{ renderLikes(m) }}
                                    </div>
                                    <div class="moment-comments" v-if="m.comments && m.comments.length">
                                        <div v-for="(cmt, idx) in m.comments" :key="idx" @click.stop="openReplyModal(m, cmt)">
                                            <span style="color:#576b95; font-weight:600;">{{ cmt.isUser ? store.qqData.profile.nickname : getCharName(cmt.charId) }}</span>
                                            <template v-if="cmt.replyToName">
                                                <span style="margin:0 2px;">回复</span>
                                                <span style="color:#576b95; font-weight:600;">{{ cmt.replyToName }}</span>
                                            </template>
                                            <span>: {{ cmt.content }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
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

                        <input type="file" accept="image/*" id="qq_bg" style="display:none;" @change="handleImgUpload($event, 'bgImage')" />
                        <input type="file" accept="image/*" id="qq_avatar" style="display:none;" @change="handleImgUpload($event, 'avatar')" />
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
                <div class="qq-modal" style="max-height:85vh; overflow-y:auto; padding-bottom:15px;">
                    <h3 style="margin-bottom:18px; text-align:center; font-size:16px;">{{ modal.title }}</h3>

                    <template v-if="modal.type === 'char'">
                        <input v-model="tempData.name" placeholder="真实姓名 (必填)" />
                        <input v-model="tempData.nickname" placeholder="昵称" />
                        <textarea v-model="tempData.persona" placeholder="详细人设描述" rows="3"></textarea>
                    </template>

                    <template v-if="modal.type === 'publish_moment'">
                        <textarea v-model="tempData.momentContent" placeholder="这一刻的想法..." rows="4"></textarea>
                    </template>
                    
                    <template v-if="modal.type === 'moment_comment'">
                        <textarea v-model="tempData.content" placeholder="输入评论内容..." rows="4"></textarea>
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
                                />
                            </div>
                            <button @click="deleteChat" style="font-size:12px; padding:6px 12px;">删除该联系人</button>
                        </div>

                        <input v-model="tempData.name" placeholder="Char 姓名" />
                        <input v-model="tempData.nickname" placeholder="Char 昵称" />
                        <textarea v-model="tempData.persona" rows="3" placeholder="Char 人设"></textarea>

                        <label style="font-size:13px; color:#666;">选择你的身份 (名片)</label>
                        <select v-model="tempData.userCardId">
                            <option v-for="uc in store.qqData.userCards" :key="uc.id" :value="uc.id">{{ uc.name }}</option>
                        </select>

                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:5px;">
                            <span style="font-size:14px; font-weight:bold;">线下沉浸模式</span>
                            <input type="checkbox" v-model="tempData.offlineMode" style="width:20px; height:20px; margin:0; border:none;" />
                        </div>

                        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;">
                            <span style="font-size:14px; font-weight:bold;">时间感知模式 (真实时间)</span>
                            <input type="checkbox" v-model="tempData.timeSenseMode" style="width:20px; height:20px; margin:0; border:none;" />
                        </div>

                        <div v-if="!tempData.timeSenseMode" style="margin-top:10px; margin-bottom:15px;">
                            <label style="font-size:13px; color:#666;">虚拟时间初始值 (只读/初始设定)</label>
                            <input v-model="tempData.virtualTimeStr" :disabled="currentContact.timeLocked" placeholder="如 10:13，发送后锁定" style="margin-bottom:8px;" />
                            
                            <label style="font-size:13px; color:#666; display:block;">临时修改下回合时间 (仅生效一次)</label>
                            <input v-model="tempData.nextOverrideTime" placeholder="例如: 10:13，填写后只在下一次发气泡时生效" style="margin-bottom:0;" />
                        </div>

                        <div style="margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-size:14px; font-weight:bold;">记忆区 (自动聊天总结)</span>
                                <button @click="manualSummarize" style="font-size:12px; padding:4px 8px; background:#007aff; color:#fff; border:none; border-radius:4px; margin:0;">手动总结</button>
                            </div>
                            <div style="font-size:12px; color:#999; margin-bottom:8px;">每10回合自动调取副API总结（保留最近5回合不总结）。支持直接查看和手动修改。</div>
                            <textarea v-model="tempData.memory" rows="4" placeholder="暂无记忆... 格式如: 1. 总结内容" style="margin-bottom:0; font-size:13px; line-height:1.4;"></textarea>
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
                                />
                            </div>
                            <button
                                v-if="tempData.id && tempData.id !== 'uc_default'"
                                @click="deleteUserCard"
                                style="font-size:12px; padding:6px 12px; background:#000 !important; color:#fff !important; border:1px solid #000 !important;"
                            >
                                删除名片
                            </button>
                        </div>

                        <input v-model="tempData.name" placeholder="名片姓名 (必填)" />
                        <textarea v-model="tempData.persona" placeholder="你的具体人设与设定" rows="4"></textarea>
                    </template>

                    <template v-if="modal.type === 'profile'">
                        <input v-model="tempData.nickname" placeholder="昵称" />
                        <textarea v-model="tempData.signature" placeholder="个性签名" rows="2"></textarea>
                    </template>

                    <div class="qq-modal-btns" style="margin-top:20px;">
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
        
        const displayCount = Vue.ref(40); 

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

        const showMomentsMenu = Vue.ref(false);
        const isRefreshingMoments = Vue.ref(false);
        const activeMomentAction = Vue.ref(null);

        if (!store.qqData.moments) {
            store.qqData.moments = [];
        }

        const currentContact = Vue.computed(function () {
            return store.qqData.contacts.find(function (c) {
                return c.id === activeChatId.value;
            });
        });

        const currentUserCard = Vue.computed(function () {
            const c = currentContact.value;
            if (!c) {
                return store.qqData.userCards[0] || {};
            }
            return store.qqData.userCards.find(function (card) {
                return card.id === (c.userCardId || store.qqData.userCards[0].id);
            }) || store.qqData.userCards[0] || {};
        });

        const formatTime = function (ts) {
            if (!ts) {
                return '';
            }
            const d = new Date(ts);
            return (d.getMonth() + 1) + '-' + d.getDate() + ' ' +
                String(d.getHours()).padStart(2, '0') + ':' +
                String(d.getMinutes()).padStart(2, '0');
        };

        const enhancedMessages = Vue.computed(function () {
            const msgs = store.qqData.messages[activeChatId.value] || [];
            const c = currentContact.value;
            if (!c) return [];
            
            const isTimeSenseMode = c.timeSenseMode;
            const startIndex = Math.max(0, msgs.length - displayCount.value);
            const result = [];
            
            for (let i = startIndex; i < msgs.length; i += 1) {
                const msg = msgs[i];
                let showTimeFlag = false;
                let dateStr = '';

                if (isTimeSenseMode && msg.timestamp) {
                    if (i === 0) {
                        showTimeFlag = true;
                    } else {
                        const prev = msgs[i - 1];
                        if (!prev || !prev.timestamp) {
                            showTimeFlag = true;
                        } else {
                            const d1 = new Date(msg.timestamp);
                            const d2 = new Date(prev.timestamp);
                            if (d1.getFullYear() !== d2.getFullYear() || 
                                d1.getMonth() !== d2.getMonth() || 
                                d1.getDate() !== d2.getDate()) {
                                showTimeFlag = true;
                            }
                        }
                    }
                }
                
                if (showTimeFlag) {
                    dateStr = formatTime(msg.timestamp);
                }

                result.push({
                    msg: msg,
                    index: i,
                    showTimeFlag: showTimeFlag,
                    dateStr: dateStr
                });
            }
            return result;
        });

        let isLoadingMore = false;
        const onChatScroll = function (e) {
            if (!e || !e.target || isLoadingMore) return;
            
            if (e.target.scrollTop < 100) {
                const msgs = store.qqData.messages[activeChatId.value] || [];
                if (displayCount.value < msgs.length) {
                    isLoadingMore = true;
                    const oldScrollHeight = e.target.scrollHeight;
                    const oldScrollTop = e.target.scrollTop;
                    
                    displayCount.value += 40;

                    Vue.nextTick(function () {
                        const newScrollHeight = e.target.scrollHeight;
                        e.target.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
                        isLoadingMore = false;
                    });
                }
            }
        };

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
                    timeLocked: false,
                    currentTurn: 0,
                    summarizedTurnCount: 0,
                    memory: '',
                    nextOverrideTime: ''
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

        // ====== 统一抽象的核心排队总结流程 ======
        const runSummarizeProcess = async function (c, activeId, isManual) {
            if (c.isSummarizing) {
                if (isManual) showError('正在总结中，请稍后再试');
                return;
            }
            
            const msgs = store.qqData.messages[activeId] || [];
            const maxTurn = c.currentTurn || 0;
            // 自动保留最后 5 回合不总结
            const maxBlocks = Math.floor((maxTurn - 5) / 10);

            if (maxBlocks < 1) {
                if (isManual) showError('当前回合数不足，无需总结');
                return;
            }

            let mem = c.memory || '';
            let missingBlocks = [];
            const memLines = mem.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; });

            // 查找所有缺失的总结序号块
            for (let i = 1; i <= maxBlocks; i++) {
                if (!memLines.some(function(line) { return line.startsWith(i + '.'); })) {
                    missingBlocks.push(i);
                }
            }

            if (missingBlocks.length === 0) {
                if (isManual) showError('系统检索：记忆已是完整状态');
                return;
            }

            const apiConfig = store.apiSettings.sub;
            if (!apiConfig.url || !apiConfig.key) { 
                if (isManual) showError('请先在设置App配置副API');
                return; 
            }

            // 锁定总结状态
            c.isSummarizing = true;
            showError('开始总结，共需总结 ' + missingBlocks.length + ' 次');
            let hasError = false;

            for (let i = 0; i < missingBlocks.length; i++) {
                let blockIndex = missingBlocks[i];
                let start = (blockIndex - 1) * 10 + 1;
                let end = blockIndex * 10;
                
                const blockMsgs = msgs.filter(function(m) { return m.turn >= start && m.turn <= end; });
                if (blockMsgs.length === 0) continue;

                let chatText = blockMsgs.map(function(m) { return (m.role === 'user' ? '我' : c.nickname) + ': ' + m.content; }).join('\n');
                if (chatText.length > 3000) chatText = chatText.slice(-3000); // 截断防爆

                let prompt = '请将以下聊天记录总结成一条不超过100字的概括，必须包含时间、地点、人物和发生的事情。直接输出总结内容，不要有多余解释废话。\n聊天记录：\n' + chatText;

                try {
                    const res = await fetch(apiConfig.url + '/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiConfig.key },
                        body: JSON.stringify({ model: apiConfig.model, messages: [{ role: 'user', content: prompt }] })
                    });
                    if (!res.ok) {
                        throw new Error('API异常 ' + res.status);
                    }
                    const data = await res.json();
                    let summary = data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
                    if (summary) {
                        summary = summary.trim();
                        let lines = c.memory ? c.memory.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; }) : [];
                        lines.push(blockIndex + '. ' + summary);
                        lines.sort(function(a, b) {
                            return (parseInt(a.split('.')[0]) || 0) - (parseInt(b.split('.')[0]) || 0);
                        });
                        c.memory = lines.join('\n');
                        // 同步到 tempData（如果此时刚好打开了设置界面的话）
                        if (modal.show && modal.type === 'chat_settings') {
                            tempData.memory = c.memory;
                        }
                        c.summarizedTurnCount = Math.max(c.summarizedTurnCount || 0, end);
                    } else {
                        throw new Error('API返回为空');
                    }
                } catch (err) {
                    console.error(err);
                    showError('总结失败: 第 ' + blockIndex + ' 块报错');
                    hasError = true;
                    break;
                }
            }

            c.isSummarizing = false;
            if (!hasError) {
                showError('总结完成');
            }
        };

        const checkAndAutoSummarize = function (c, activeId) {
            runSummarizeProcess(c, activeId, false);
        };

        const manualSummarize = function (e) {
            if (e) e.preventDefault();
            const c = currentContact.value;
            if (!c) return;
            runSummarizeProcess(c, c.id, true);
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
                virtualTimeStr: c.virtualTimeStr || '',
                nextOverrideTime: c.nextOverrideTime || '',
                memory: c.memory || ''
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
                c.nextOverrideTime = tempData.nextOverrideTime;
                c.memory = tempData.memory;

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
            displayCount.value = 40; 
            
            const c = store.qqData.contacts.find(function(x){ return x.id === id; });
            const history = store.qqData.messages[id] || [];
            
            // 老旧存档兼容：如果没有回合数，则自动补齐所有气泡的回合归属
            if (c && typeof c.currentTurn === 'undefined') {
                let currentT = 0;
                history.forEach(function (m, idx) {
                    if (m.role === 'user') {
                        const prev = history[idx - 1];
                        if (!prev || prev.role === 'ai') currentT += 1;
                    }
                    if (currentT === 0) currentT = 1;
                    m.turn = currentT;
                });
                c.currentTurn = Math.max(currentT, 1);
                c.summarizedTurnCount = 0;
                c.memory = '';
            }

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

        // ====== 朋友圈方法开始 ======

        const getCharName = function (id) {
            const c = store.qqData.contacts.find(function (contact) {
                return contact.id === id;
            });
            return c ? c.nickname || c.name : '未知';
        };

        const openPublishMoment = function () {
            showMomentsMenu.value = false;
            modal.title = '发布朋友圈';
            modal.type = 'publish_moment';
            tempData.momentContent = '';

            modal.confirm = function () {
                if (!tempData.momentContent.trim()) {
                    return showError('内容不能为空');
                }
                store.qqData.moments.unshift({
                    id: 'm_' + Date.now(),
                    content: tempData.momentContent,
                    timestamp: Date.now(),
                    likes: [],
                    comments: []
                });
                modal.show = false;
            };
            modal.show = true;
        };
        
        const toggleMomentAction = function(id) {
            if (activeMomentAction.value === id) {
                activeMomentAction.value = null;
            } else {
                activeMomentAction.value = id;
            }
        };

        const hasLiked = function(m) {
            return m.likes && m.likes.indexOf('user') !== -1;
        };

        const toggleLike = function(m) {
            if (!m.likes) m.likes = [];
            const idx = m.likes.indexOf('user');
            if (idx !== -1) {
                m.likes.splice(idx, 1);
            } else {
                m.likes.push('user');
            }
            activeMomentAction.value = null;
        };

        const renderLikes = function(m) {
            if (!m.likes || !m.likes.length) return '';
            return m.likes.map(function(id) {
                return id === 'user' ? store.qqData.profile.nickname : getCharName(id);
            }).join(', ');
        };

        const deleteMoment = function(id) {
            store.qqData.moments = store.qqData.moments.filter(function(m) {
                return m.id !== id;
            });
            activeMomentAction.value = null;
        };

        const openCommentModal = function(m) {
            activeMomentAction.value = null;
            modal.title = '评论朋友圈';
            modal.type = 'moment_comment';
            tempData.momentId = m.id;
            tempData.replyToCharId = null;
            tempData.replyToName = null;
            tempData.content = '';

            modal.confirm = confirmComment;
            modal.show = true;
        };

        const openReplyModal = function(m, cmt) {
            if (cmt.isUser) return; // 不能自己回复自己的评论
            activeMomentAction.value = null;
            modal.title = '回复 ' + getCharName(cmt.charId);
            modal.type = 'moment_comment';
            tempData.momentId = m.id;
            tempData.replyToCharId = cmt.charId;
            tempData.replyToName = getCharName(cmt.charId);
            tempData.content = '';

            modal.confirm = confirmComment;
            modal.show = true;
        };

        const confirmComment = function() {
            if (!tempData.content.trim()) {
                return showError('内容不能为空');
            }
            
            const m = store.qqData.moments.find(function(x) { return x.id === tempData.momentId; });
            if (!m) {
                modal.show = false;
                return;
            }
            
            if (!m.comments) m.comments = [];
            
            m.comments.push({
                isUser: true,
                content: tempData.content,
                replyToCharId: tempData.replyToCharId,
                replyToName: tempData.replyToName
            });
            
            const targetCharId = tempData.replyToCharId;
            modal.show = false;
            
            if (targetCharId) {
                triggerMomentReply(m, targetCharId);
            }
        };

        const triggerMomentReply = async function(moment, charId) {
            const c = store.qqData.contacts.find(function(x) { return x.id === charId; });
            if (!c) return;
            
            const apiConfig = store.apiSettings.sub;
            if (!apiConfig.url || !apiConfig.key) return showError('请先在设置App中配置副API');
            
            const uCard = store.qqData.userCards.find(function (card) {
                return card.id === (c.userCardId || store.qqData.userCards[0].id);
            }) || store.qqData.userCards[0];
            
            let historyStr = '';
            moment.comments.forEach(function(cmt) {
                if (!cmt.isUser && cmt.charId === charId) {
                    historyStr += c.nickname + '评论道：' + cmt.content + '\\n';
                } else if (cmt.isUser && cmt.replyToCharId === charId) {
                    historyStr += uCard.name + '回复' + c.nickname + '：' + cmt.content + '\\n';
                }
            });

            const prompt = '你是' + c.name + '，昵称' + c.nickname + '。人设：' + c.persona + '。\\n你的朋友' + uCard.name + '在 ' + formatTime(moment.timestamp) + ' 发了一条朋友圈：“' + moment.content + '”。\\n你们在评论区有如下互动：\\n' + historyStr + '\\n请根据最新回复情况，给出你顺承的二次回复（字数不超过30字，口语化，直接输出内容）。如果不打算再回复请直接输出“无”。';

            try {
                const res = await fetch(apiConfig.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiConfig.key
                    },
                    body: JSON.stringify({
                        model: apiConfig.model,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                if (!res.ok) return;

                const data = await res.json();
                let reply = data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
                if (reply) {
                    reply = reply.trim().replace(/^["']|["']$/g, '');
                    if (reply && reply !== '无' && reply.toLowerCase() !== 'none') {
                        moment.comments.push({
                            isUser: false,
                            charId: c.id,
                            content: reply,
                            replyToCharId: null,
                            replyToName: uCard.name
                        });
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };

        const refreshMoments = async function () {
            showMomentsMenu.value = false;
            activeMomentAction.value = null;
            if (isRefreshingMoments.value) {
                return;
            }
            if (!store.qqData.moments || store.qqData.moments.length === 0) {
                return showError('暂无朋友圈可以刷新');
            }

            const latestMoment = store.qqData.moments[0];
            const contacts = store.qqData.contacts;
            if (contacts.length === 0) {
                return showError('没有可以互动的AI好友');
            }

            const apiConfig = store.apiSettings.sub;
            if (!apiConfig.url || !apiConfig.key) {
                return showError('请先在设置App中配置副API(用于朋友圈)');
            }

            isRefreshingMoments.value = true;
            showError('朋友圈刷新中...');

            if (!latestMoment.likes) latestMoment.likes = [];
            if (!latestMoment.comments) latestMoment.comments = [];

            const prob = contacts.length === 1 ? 1 : 0.5;

            const promises = contacts.map(async function (c) {
                const hasCommented = latestMoment.comments.some(function (cmt) {
                    return cmt.charId === c.id;
                });
                if (hasCommented) {
                    return;
                }

                if (Math.random() > prob) {
                    return;
                }

                if (Math.random() > 0.5) {
                    if (latestMoment.likes.indexOf(c.id) === -1) {
                        latestMoment.likes.push(c.id);
                    }
                }

                const uCard = store.qqData.userCards.find(function (card) {
                    return card.id === (c.userCardId || store.qqData.userCards[0].id);
                }) || store.qqData.userCards[0];

                const prompt = '你是' + c.name + '，昵称' + c.nickname + '。人设：' + c.persona + '。你的朋友' + uCard.name + '在 ' + formatTime(latestMoment.timestamp) + ' 发了一条朋友圈：“' + latestMoment.content + '”。请根据你的人设，给这条朋友圈写一条简短的评论（不要超过30字，口语化，直接输出评论内容。如果不想评论请直接输出“无”）。';

                try {
                    const res = await fetch(apiConfig.url + '/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + apiConfig.key
                        },
                        body: JSON.stringify({
                            model: apiConfig.model,
                            messages: [{ role: 'user', content: prompt }]
                        })
                    });

                    if (!res.ok) return;

                    const data = await res.json();
                    let reply = data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
                    if (reply) {
                        reply = reply.trim().replace(/^["']|["']$/g, '');
                        if (reply && reply !== '无' && reply.toLowerCase() !== 'none') {
                            latestMoment.comments.push({ 
                                isUser: false,
                                charId: c.id, 
                                content: reply,
                                replyToCharId: null,
                                replyToName: null
                            });
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            });

            await Promise.all(promises);
            isRefreshingMoments.value = false;
            showError('朋友圈刷新完成');
        };

        // ====== 朋友圈方法结束 ======

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

            if (contact.nextOverrideTime) {
                const parsed = parseTimeStr(contact.nextOverrideTime);
                if (parsed) {
                    contact.virtualTimeStr = formatClock(parsed);
                    contact.timeLocked = true;
                    contact.nextOverrideTime = ''; 
                    return contact.virtualTimeStr;
                }
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

            let base;
            let firstTime;

            if (contact.nextOverrideTime) {
                const parsed = parseTimeStr(contact.nextOverrideTime);
                if (parsed) {
                    firstTime = parsed;
                    contact.nextOverrideTime = ''; 
                }
            }

            if (!firstTime) {
                base = getVirtualBaseTime(contact);
                let firstAdd = Math.floor(Math.random() * 2) + 1;
                if (getLastMessageTimeStr(contact.id)) {
                    firstTime = addMinutesToTime(base, firstAdd);
                } else if (contact.virtualTimeStr) {
                    firstTime = parseTimeStr(contact.virtualTimeStr) || getNowClock();
                } else {
                    firstTime = getNowClock();
                }
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
            const history = store.qqData.messages[activeChatId.value] || [];
            const lastMsg = history[history.length - 1];

            if (typeof c.currentTurn === 'undefined') c.currentTurn = 0;
            if (!lastMsg || lastMsg.role === 'ai') {
                c.currentTurn += 1;
            }

            const newMsg = {
                role: 'user',
                content: inputText.value,
                timestamp: Date.now(),
                timeStr: getMsgTimeStr(c),
                turn: c.currentTurn
            };

            if (quotedMsgText.value) {
                newMsg.quote = quotedMsgText.value;
                clearQuote();
            }

            store.qqData.messages[activeChatId.value].push(newMsg);
            inputText.value = '';
            resetInputHeight();
            scrollToBottom();
            
            // 后台静默检测并自动触发总结
            checkAndAutoSummarize(c, activeChatId.value);
        };

        const triggerAI = async function () {
            if (isTyping.value) {
                return;
            }

            const history = store.qqData.messages[activeChatId.value] || [];
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

            // 提取记忆区并提示AI
            if (c.memory) {
                sysPrompt += '\\n\\n【记忆区(过往聊天总结)】\\n' + c.memory + '\\n(重要：请结合以上记忆区内容和接下来的最新未总结聊天记录进行连贯回复)';
            }

            if (c.offlineMode) {
                sysPrompt += '\\n【指令】当前已开启线下模式。请进行带有旁白和环境描写的沉浸式角色扮演。回复字数控制在150字到250字之间。';
            } else {
                sysPrompt += '\\n【指令】当前未开启线下模式。请模拟手机在线聊天的场景，采用短句发送，禁止发送大段长文。一次可以回复1到5条消息的量（多条消息用换行符分开）。';
            }
            
            sysPrompt += '\\n【注意】聊天记录中带有[时间: xx:xx]标识，请你读取并感知时间流逝。但你的回复中【绝对禁止】携带[时间: xx:xx]前缀，直接输出回复即可！';

            const apiMessages = [{ role: 'system', content: sysPrompt }];
            
            const sumCount = c.summarizedTurnCount || 0;
            const unsummarizedMsgs = history.filter(function (m) { return (m.turn || 0) > sumCount; });
            
            unsummarizedMsgs.slice(-40).forEach(function (m) {
                let text = m.content;
                if (m.quote) {
                    text = '[回复前文: ' + m.quote + ']\n' + text;
                }
                text = '[时间: ' + m.timeStr + '] ' + text;
                apiMessages.push({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: text
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
                let reply = data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';

                if (!reply || !reply.trim()) {
                    throw new Error('AI返回了空消息');
                }

                reply = reply.replace(/\[时间:\s*\d{1,2}:\d{1,2}\]\s*/g, '').replace(/【时间:\s*\d{1,2}:\d{1,2}】\s*/g, '').trim();
                
                if (typeof c.currentTurn === 'undefined') c.currentTurn = 1;

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
                            timeStr: timeList[i],
                            turn: c.currentTurn
                        });
                    }
                } else {
                    const oneTime = buildAiBatchTimeList(c, 1)[0];
                    history.push({
                        role: 'ai',
                        content: reply,
                        timestamp: Date.now(),
                        timeStr: oneTime,
                        turn: c.currentTurn
                    });
                }

                scrollToBottom();
            } catch (err) {
                showError('AI回复异常: ' + err.message);
            } finally {
                isTyping.value = false;
                // AI完成一次发话，自动触发检测
                checkAndAutoSummarize(c, activeChatId.value);
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
            displayCount: displayCount,
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
            manualSummarize: manualSummarize,
            deleteChat: deleteChat,
            formatTime: formatTime,
            enhancedMessages: enhancedMessages,
            onChatScroll: onChatScroll,
            getLastMsg: getLastMsg,
            openChat: openChat,
            currentContact: currentContact,
            currentUserCard: currentUserCard,
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
            backToChatList: backToChatList,
            showMomentsMenu: showMomentsMenu,
            isRefreshingMoments: isRefreshingMoments,
            openPublishMoment: openPublishMoment,
            refreshMoments: refreshMoments,
            getCharName: getCharName,
            activeMomentAction: activeMomentAction,
            toggleMomentAction: toggleMomentAction,
            hasLiked: hasLiked,
            toggleLike: toggleLike,
            renderLikes: renderLikes,
            deleteMoment: deleteMoment,
            openCommentModal: openCommentModal,
            openReplyModal: openReplyModal
        };
    }
};
