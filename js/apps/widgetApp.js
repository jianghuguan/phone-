window.widgetApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px);">
            <h2 style="font-weight: 600; margin-bottom: 20px;">桌面美化设置</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 15px;">
                <h3>时钟天气背景图</h3>
                <p style="font-size: 12px; color: #666; margin: 5px 0 10px;">更换时间组件的背景壁纸</p>
                <input type="file" accept="image/*" @change="(e) => handleImageUpload(e, 'timeBgImage')" id="timeBgInput" style="display:none;">
                <button @click="triggerClick('timeBgInput')" class="btn-primary">从相册选择</button>
                <button v-if="store.timeBgImage" @click="store.timeBgImage = null" class="btn-danger">移除图片</button>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px;">
                <h3>照片墙 (2x2)</h3>
                <p style="font-size: 12px; color: #666; margin: 5px 0 10px;">设置桌面上展示的照片</p>
                <input type="file" accept="image/*" @change="(e) => handleImageUpload(e, 'photoWallImage')" id="photoWallInput" style="display:none;">
                <button @click="triggerClick('photoWallInput')" class="btn-primary">从相册选择</button>
                <button v-if="store.photoWallImage" @click="store.photoWallImage = null" class="btn-danger">移除图片</button>
            </div>
            
            <p style="text-align:center; color:#999; font-size:12px; margin-top:30px;">提示：在桌面长按图标可拖拽排序</p>
        </div>
    `,
    setup() {
        const store = window.store;

        const triggerClick = (id) => document.getElementById(id).click();

        // 核心：图片压缩转 Base64 算法 (保证高清的同时不撑爆存储)
        const handleImageUpload = (event, storeKey) => {
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
                    // 设置最大宽度限制为 800 (对手机屏幕依然极其清晰)
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // 压缩质量 0.8，存入全局状态并自动保存
                    store[storeKey] = canvas.toDataURL('image/jpeg', 0.8);
                };
            };
        };

        return { store, triggerClick, handleImageUpload };
    }
}
