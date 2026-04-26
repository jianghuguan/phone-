/* eslint-disable */
/* global Vue, document, FileReader, Image */
'use strict';

window.themeApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y: auto; background: #fff;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">桌面与 QQ 美化</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">系统桌面背景</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <input id="desktopBgUpload" type="file" accept="image/*" style="display: none;" @change="handleUpload($event, 'desktopBgImage')">
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('desktopBgUpload')">更换背景图</button>
                    <button v-if="store.desktopBgImage" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="store.desktopBgImage = null">恢复默认</button>
                </div>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">QQ 消息界面背景</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <input id="qqMsgBgUpload" type="file" accept="image/*" style="display: none;" @change="handleUpload($event, 'msgListBg', true)">
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('qqMsgBgUpload')">更换背景图</button>
                    <button v-if="store.qqData.theme.msgListBg" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="store.qqData.theme.msgListBg = null">恢复默认</button>
                </div>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">QQ 聊天内页背景</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <input id="qqChatBgUpload" type="file" accept="image/*" style="display: none;" @change="handleUpload($event, 'chatBg', true)">
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('qqChatBgUpload')">更换背景图</button>
                    <button v-if="store.qqData.theme.chatBg" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="store.qqData.theme.chatBg = null">恢复默认</button>
                </div>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">自定义聊天气泡 CSS</div>
                <textarea 
                    v-model="store.qqData.theme.bubbleCss" 
                    rows="5" 
                    class="settings-input" 
                    style="font-family: monospace; font-size: 12px;" 
                    placeholder="例如：\n.qq-msg-bubble { border-radius: 0 !important; }\n.qq-msg-row.user .qq-msg-bubble { background: #ff9900 !important; }">
                </textarea>
                <p style="font-size:11px; color:#888; margin-top:6px;">将全局应用于所有 QQ 聊天气泡</p>
            </div>

            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px; margin-top: 30px;">更换 App 图标</div>
            <p style="color: #666; font-size: 13px; margin-bottom: 15px;">上传图标后默认替换原文字内容</p>
            <div
                v-for="app in apps"
                :key="app.id"
                style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;"
            >
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div
                        class="icon-img"
                        :style="{
                            backgroundColor: app.color,
                            backgroundImage: app.iconImage ? 'url(' + app.iconImage + ')' : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            width: '45px',
                            height: '45px',
                            fontSize: '20px',
                            borderRadius: '12px'
                        }"
                    >
                        <template v-if="!app.iconImage">{{ app.textIcon }}</template>
                    </div>
                    <span style="font-weight: bold; font-size: 15px;">{{ app.name }}</span>
                </div>

                <div style="display: flex; gap: 6px;">
                    <input
                        :id="'iconUpload_' + app.id"
                        type="file"
                        accept="image/*"
                        style="display: none;"
                        @change="handleIconUpload($event, app.id)"
                    >
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px; margin: 0;" @click="triggerClick('iconUpload_' + app.id)">图库选择</button>
                    <button v-if="app.iconImage" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="resetIcon(app)">恢复</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        // 初始化 QQ美化主题数据
        if (!store.qqData.theme) {
            store.qqData.theme = { msgListBg: null, chatBg: null, bubbleCss: '' };
        }

        const apps = Vue.computed(function () {
            return store.desktopItems.filter(function (item) {
                return item.type === 'app';
            });
        });

        const triggerClick = function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.click();
            }
        };

        const compressImage = function (file, callback) {
            const reader = new FileReader();

            reader.onload = function (event) {
                const img = new Image();

                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;

                    if (width > 1000) {
                        height = Math.round((height * 1000) / width);
                        width = 1000;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    callback(canvas.toDataURL('image/jpeg', 0.85));
                };

                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        };

        const handleUpload = function (event, fieldName, isQQ = false) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            compressImage(file, function (base64) {
                if (isQQ) {
                    store.qqData.theme[fieldName] = base64;
                } else {
                    store[fieldName] = base64;
                }
            });

            event.target.value = '';
        };

        const handleIconUpload = function (event, id) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 160;
                    canvas.height = 160;
                    ctx.clearRect(0, 0, 160, 160);
                    ctx.drawImage(img, 0, 0, 160, 160);

                    const targetApp = store.desktopItems.find(item => item.id === id);
                    if (targetApp) {
                        targetApp.iconImage = canvas.toDataURL('image/png');
                        targetApp.color = 'transparent';
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        };

        const resetIcon = function (app) {
            app.iconImage = null;
            app.color = '#ffffff';
        };

        return {
            store: store,
            apps: apps,
            triggerClick: triggerClick,
            handleUpload: handleUpload,
            handleIconUpload: handleIconUpload,
            resetIcon: resetIcon
        };
    }
};
