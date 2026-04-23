/* global Vue */

window.themeApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">桌面美化 (更换App图标)</h2>
            <p style="color:#666; font-size:13px; margin-bottom:15px;">上传图标后默认替换原文字内容</p>
            
            <div v-for="app in apps" :key="app.id" style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <!-- 预览当前图标 -->
                    <div class="icon-img" :style="{ backgroundColor: app.color, backgroundImage: app.iconImage ? 'url(' + app.iconImage + ')' : 'none', backgroundSize: 'cover', backgroundPosition: 'center', width: '45px', height: '45px', fontSize: '20px', borderRadius: '12px' }">
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
        
        // 过滤出所有App应用
        const apps = Vue.computed(() => store.desktopItems.filter(item => item.type === 'app'));
        
        const triggerClick = (id) => document.getElementById(id).click();

        // 裁切图标的逻辑（固定小尺寸节省存储空间）
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
                    canvas.width = 160; 
                    canvas.height = 160;
                    ctx.drawImage(img, 0, 0, 160, 160);
                    
                    const targetApp = store.desktopItems.find(item => item.id === id);
                    if (targetApp) {
                        targetApp.iconImage = canvas.toDataURL('image/jpeg', 0.8);
                    }
                };
            };
        };

        return { apps, triggerClick, handleIconUpload };
    }
};
