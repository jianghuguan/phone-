/* global Vue, window, document, FileReader, Image */
'use strict';

window.widgetApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">小组件管理</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <h3 style="margin-bottom:10px;">添加新的小组件</h3>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button @click="addWidget('time')" class="btn-primary" style="flex:1; min-width:45%; padding:10px 0;">+ 时钟天气</button>
                    <button @click="addWidget('photo')" class="btn-primary" style="flex:1; min-width:45%; padding:10px 0;">+ 照片墙(2x2)</button>
                    <button @click="addWidget('photo-1x1')" class="btn-primary" style="flex:1; min-width:45%; padding:10px 0;">+ 圆照片(1x1)</button>
                    <button @click="addWidget('photo-1x2')" class="btn-primary" style="flex:1; min-width:45%; padding:10px 0;">+ 竖照片(1x2)</button>
                    <button @click="addWidget('photo-2x1')" class="btn-primary" style="flex:1; min-width:45%; padding:10px 0;">+ 宽照片(2x1)</button>
                    <button @click="addWidget('pixel-avatar')" class="btn-primary" style="flex:1; min-width:45%; padding:10px 0; background:#333 !important; color:#fff !important;">+ 像素对话(2x2)</button>
                </div>
            </div>

            <h3 style="margin-bottom:10px; padding-left:5px;">已添加的小组件</h3>
            <p v-if="widgets.length === 0" style="color:#999; font-size:13px;">桌面目前没有小组件</p>
            
            <div v-for="(widget, index) in widgets" :key="widget.id" style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight:bold;">{{ widget.name }}</span>
                    <button @click="removeWidget(widget.id)" class="btn-danger" style="padding: 5px 12px; font-size: 12px;">删除</button>
                </div>
                <div>
                    <input type="file" accept="image/*" @change="handleImageUpload($event, widget.id)" :id="'upload_' + widget.id" style="display:none;">
                    <button @click="triggerClick('upload_' + widget.id)" class="btn-primary" style="font-size: 12px; padding: 6px 12px;">
                        {{ widget.bgImage ? '更换图片' : '设置图片' }}
                    </button>
                    <button v-if="widget.bgImage" @click="widget.bgImage = null" class="btn-danger" style="font-size: 12px; padding: 6px 12px; margin-left:5px;">移除图片</button>
                </div>
                
                <div v-if="widget.widgetType === 'pixel-avatar'" style="margin-top:12px;">
                    <input type="text" v-model="widget.text" placeholder="输入气泡内文字..." class="settings-input" style="font-size:12px; padding:8px;" maxlength="20">
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        const widgets = Vue.computed(() => store.desktopItems.filter(item => item.type === 'widget'));

        const assignFreeSpace = (item) => {
            let grid = Array(100).fill(0).map(()=>Array(4).fill(0));
            store.desktopItems.forEach(i => {
                if (i.x !== undefined && i.y !== undefined) {
                    for(let r=0; r<i.h; r++) for(let c=0; c<i.w; c++) if (grid[i.y+r]) grid[i.y+r][i.x+c] = 1;
                }
            });
            for(let r=0; r<100; r++){
                for(let c=0; c<=4-item.w; c++){
                    let fit = true;
                    for(let i=0; i<item.h; i++) for(let j=0; j<item.w; j++) if(grid[r+i][c+j]) fit = false;
                    if(fit){
                        item.x = c; item.y = r; return;
                    }
                }
            }
        };

        const addWidget = (type) => {
            const id = type + '_' + Date.now();
            let newWidget = null;
            if (type === 'time') newWidget = { type: 'widget', widgetType: 'time', id, name: '时钟天气', w: 4, h: 2, bgImage: null };
            else if (type === 'photo') newWidget = { type: 'widget', widgetType: 'photo', id, name: '照片墙(2x2)', w: 2, h: 2, bgImage: null };
            else if (type === 'photo-1x1') newWidget = { type: 'widget', widgetType: 'photo-1x1', id, name: '圆照片(1x1)', w: 1, h: 1, bgImage: null };
            else if (type === 'photo-1x2') newWidget = { type: 'widget', widgetType: 'photo-1x2', id, name: '竖照片(1x2)', w: 1, h: 2, bgImage: null };
            else if (type === 'photo-2x1') newWidget = { type: 'widget', widgetType: 'photo-2x1', id, name: '宽照片(2x1)', w: 2, h: 1, bgImage: null };
            else if (type === 'pixel-avatar') newWidget = { type: 'widget', widgetType: 'pixel-avatar', id, name: '像素对话(2x2)', w: 2, h: 2, bgImage: null, text: 'Hello!' };
            
            assignFreeSpace(newWidget);
            store.desktopItems.push(newWidget);
        };

        const removeWidget = (id) => {
            store.desktopItems = store.desktopItems.filter(item => item.id !== id);
        };

        const triggerClick = (id) => {
            const el = document.getElementById(id);
            if (el) el.click();
        };

        const handleImageUpload = (event, id) => {
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
                    let width = img.width;
                    let height = img.height;
                    if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    const targetWidget = store.desktopItems.find(item => item.id === id);
                    if (targetWidget) targetWidget.bgImage = canvas.toDataURL('image/png');
                };
            };
        };

        return { store, widgets, addWidget, removeWidget, triggerClick, handleImageUpload };
    }
};
