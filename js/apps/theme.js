/* eslint-disable */
/* global Vue, document, FileReader, Image */
'use strict';

window.themeApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y: auto;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">桌面与主题美化</h2>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 16px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">桌面背景图</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <input id="desktopBgUpload" type="file" accept="image/*" style="display: none;" @change="handleDesktopBgUpload">
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('desktopBgUpload')">更换背景图</button>
                    <button v-if="store.desktopBgImage" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="resetDesktopBg">恢复默认</button>
                </div>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 16px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">QQ 界面深度美化</div>
                
                <div style="margin-bottom: 12px;">
                    <span style="font-size: 13px; color: #666; display: block; margin-bottom: 6px;">QQ 消息列表背景图</span>
                    <div style="display: flex; gap: 6px;">
                        <input id="qqMsgBgUpload" type="file" accept="image/*" style="display: none;" @change="handleQQMsgBgUpload">
                        <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('qqMsgBgUpload')">更换背景</button>
                        <button v-if="store.qqTheme.msgListBg" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="store.qqTheme.msgListBg = null">移除图片</button>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <span style="font-size: 13px; color: #666; display: block; margin-bottom: 6px;">QQ 聊天界面背景图</span>
                    <div style="display: flex; gap: 6px;">
                        <input id="qqChatBgUpload" type="file" accept="image/*" style="display: none;" @change="handleQQChatBgUpload">
                        <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('qqChatBgUpload')">更换背景</button>
                        <button v-if="store.qqTheme.chatBg" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="store.qqTheme.chatBg = null">移除图片</button>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <span style="font-size: 13px; color: #666; display: block; margin-bottom: 6px;">自定义聊天气泡 CSS（作用于全局）</span>
                    <textarea 
                        v-model="store.qqTheme.bubbleCss" 
                        rows="5" 
                        style="width: 100%; border: 1px solid #ccc; border-radius: 8px; padding: 8px; font-size: 12px; font-family: monospace; outline: none; resize: vertical;" 
                        placeholder="例如修改气泡颜色:\\n.qq-msg-row.user .qq-msg-bubble { background: pink !important; color: black !important; }"></textarea>
                </div>
            </div>

            <p style="color: #666; font-size: 13px; margin-bottom: 15px; font-weight:bold;">更换 App 图标</p>
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
                    <input :id="'iconUpload_' + app.id" type="file" accept="image/*" style="display: none;" @change="handleIconUpload($event, app.id)">
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px; margin: 0;" @click="triggerClick('iconUpload_' + app.id)">图库选择</button>
                    <button v-if="app.iconImage" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="resetIcon(app)">恢复</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        // 兼容初始化 QQ Theme
        if (!store.qqTheme) store.qqTheme = { msgListBg: null, chatBg: null, bubbleCss: '' };

        const apps = Vue.computed(function () {
            return store.desktopItems.filter(function (item) {
                return item.type === 'app';
            });
        });

        const triggerClick = function (id) {
            const el = document.getElementById(id);
            if (el) el.click();
        };

        const compressImage = function (file, callback, maxWidth = 1000) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
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

        const handleDesktopBgUpload = function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            compressImage(file, function (base64) {
                store.desktopBgImage = base64;
            });
            event.target.value = '';
        };

        const handleQQMsgBgUpload = function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            compressImage(file, function (base64) {
                store.qqTheme.msgListBg = base64;
            });
            event.target.value = '';
        };

        const handleQQChatBgUpload = function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            compressImage(file, function (base64) {
                store.qqTheme.chatBg = base64;
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

                    const targetApp = store.desktopItems.find(function (item) { return item.id === id; });
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

        const resetDesktopBg = function () { store.desktopBgImage = null; };
        const resetIcon = function (app) { app.iconImage = null; app.color = '#ffffff'; };

        return {
            store, apps, triggerClick,
            handleDesktopBgUpload, handleQQMsgBgUpload, handleQQChatBgUpload, handleIconUpload,
            resetDesktopBg, resetIcon
        };
    }
};
