/* eslint-disable */
/* global Vue, FileReader, Image, document */

window.themeApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">桌面美化</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <h3 style="margin-bottom:15px; font-size:16px;">桌面壁纸</h3>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 60px; height: 100px; background-color: #ddd; border-radius: 8px; border: 1px solid #ccc; background-size: cover; background-position: center;" :style="{ backgroundImage: store.desktopBgImage ? 'url(' + store.desktopBgImage + ')' : 'none' }"></div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
                        <input type="file" accept="image/*" @change="handleBgUpload" id="bgUpload" style="display:none;" />
                        <button @click="triggerClick('bgUpload')" class="btn-primary" style="padding: 8px;">选择壁纸</button>
                        <button v-if="store.desktopBgImage" @click="store.desktopBgImage = null" class="btn-danger" style="padding: 8px;">恢复纯色</button>
                    </div>
                </div>
            </div>

            <h3 style="margin-bottom:15px; padding-left:5px; font-size:16px;">App 图标更换</h3>
            <p style="color:#666; font-size:13px; margin-bottom:15px;">上传图标后默认替换原文字内容</p>
            
            <div v-for="app in apps" :key="app.id" style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="icon-img" :style="{ backgroundColor: app.color, backgroundImage: app.iconImage ? 'url(' + app.iconImage + ')' : 'none', width: '45px', height: '45px', minWidth: '45px', minHeight: '45px', fontSize: '20px', borderRadius: '12px' }">
                        <template v-if="!app.iconImage">{{ app.textIcon }}</template>
                    </div>
                    <span style="font-weight: bold; font-size: 15px;">{{ app.name }}</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <input type="file" accept="image/*" @change="(e) => handleIconUpload(e, app.id)" :id="'iconUpload_'+app.id" style="display:none;" />
                    <button @click="triggerClick('iconUpload_'+app.id)" class="btn-primary" style="font-size: 12px; padding: 6px 12px; margin:0;">图库选择</button>
                    <button v-if="app.iconImage" @click="app.iconImage = null" class="btn-danger" style="font-size: 12px; padding: 6px 12px;">恢复</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;
        const apps = Vue.computed(() => store.desktopItems.filter(item => item.type === 'app'));
        const triggerClick = (id) => document.getElementById(id).click();

        const handleBgUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width, h = img.height;
                    if (w > 1080) { h = Math.round(h * 1080 / w); w = 1080; }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    store.desktopBgImage = canvas.toDataURL('image/jpeg', 0.8);
                };
            };
        };

        const handleIconUpload = (event, id) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 160; canvas.height = 160;
                    ctx.drawImage(img, 0, 0, 160, 160);
                    const targetApp = store.desktopItems.find(item => item.id === id);
                    if (targetApp) targetApp.iconImage = canvas.toDataURL('image/jpeg', 0.8);
                };
            };
        };

        return { store, apps, triggerClick, handleBgUpload, handleIconUpload };
    }
};
