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
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">QQ 消息列表背景</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <input id="msgListBgUpload" type="file" accept="image/*" style="display: none;" @change="handleThemeUpload($event, 'msgListBg')">
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('msgListBgUpload')">更换背景图</button>
                    <button v-if="store.qqData.theme.msgListBg" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="resetTheme('msgListBg')">恢复默认</button>
                </div>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 16px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">QQ 聊天界面背景</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <input id="chatBgUpload" type="file" accept="image/*" style="display: none;" @change="handleThemeUpload($event, 'chatBg')">
                    <button class="btn-primary" style="font-size: 12px; padding: 6px 12px;" @click="triggerClick('chatBgUpload')">更换背景图</button>
                    <button v-if="store.qqData.theme.chatBg" class="btn-danger" style="font-size: 12px; padding: 6px 12px;" @click="resetTheme('chatBg')">恢复默认</button>
                </div>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 24px;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">自定义聊天气泡 CSS</div>
                <textarea v-model="store.qqData.theme.bubbleCss" rows="4" style="width: 100%; border: 1px solid #d1d1d6; border-radius: 10px; padding: 10px; font-size: 13px; outline: none; margin-bottom:8px; font-family: monospace;" placeholder="例如: .qq-msg-bubble { background: #fff !important; }"></textarea>
                <p style="font-size:12px; color:#666;">支持原生 CSS，可修改全部气泡样式，输入后即时生效。</p>
            </div>

            <h3 style="font-weight: 600; margin-bottom: 15px;">更换 App 图标</h3>
            <div v-for="app in apps" :key="app.id" style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="icon-img" :style="{ backgroundColor: app.color, backgroundImage: app.iconImage ? 'url(' + app.iconImage + ')' : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', width: '45px', height: '45px', fontSize: '20px', borderRadius: '12px' }">
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

        const handleDesktopBgUpload = function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            compressImage(file, function (base64) {
                store.desktopBgImage = base64;
            });
            event.target.value = '';
        };

        const handleThemeUpload = function (event, field) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            compressImage(file, function (base64) {
                store.qqData.theme[field] = base64;
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

                    const targetApp = store.desktopItems.find(function (item) {
                        return item.id === id;
                    });
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
        const resetTheme = function (field) { store.qqData.theme[field] = null; };
        const resetIcon = function (app) {
            app.iconImage = null;
            app.color = '#ffffff';
        };

        return {
            store, apps, triggerClick,
            handleDesktopBgUpload, handleThemeUpload, handleIconUpload,
            resetDesktopBg, resetTheme, resetIcon
        };
    }
};

// 确保 QQ 主题数据结构完整，并全局注入自定义 CSS 样式（无论是否打开了美化App，全局加载即生效）
if (window.Vue && window.store) {
    if (!window.store.qqData) window.store.qqData = {};
    if (!window.store.qqData.theme) window.store.qqData.theme = { msgListBg: null, chatBg: null, bubbleCss: '' };

    window.Vue.watch(
        () => window.store.qqData.theme,
        (theme) => {
            if (!theme) return;
            let styleEl = document.getElementById('qq-custom-theme-style');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'qq-custom-theme-style';
                document.head.appendChild(styleEl);
            }
            
            let css = '';
            // 针对 QQ 消息列表背景进行注入 (精准锁定结构防止误伤)
            if (theme.msgListBg) {
                css += `\n.qq-container > div:not(.qq-toast):not(.qq-modal-overlay) > div:nth-child(1) > .qq-content:not(#chat-area) { background-image: url(${theme.msgListBg}) !important; background-size: cover !important; background-position: center !important; background-color: transparent !important; }`;
            }
            // 针对 QQ 聊天内背景进行注入
            if (theme.chatBg) {
                css += `\n#chat-area { background-image: url(${theme.chatBg}) !important; background-size: cover !important; background-position: center !important; background-color: transparent !important; }`;
            }
            // 针对 自定义气泡 进行注入
            if (theme.bubbleCss) {
                css += `\n${theme.bubbleCss}`;
            }
            styleEl.innerHTML = css;
        },
        { deep: true, immediate: true }
    );
}
