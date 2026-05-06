/* global Vue, window, document, FileReader, Image */
'use strict';

window.widgetApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">小组件管理</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <h3 style="margin-bottom:10px;">添加新的小组件</h3>
                <div style="display: flex; gap: 10px;">
                    <button @click="addWidget('time')" class="btn-primary" style="flex:1;">+ 时钟天气</button>
                    <button @click="addWidget('photo')" class="btn-primary" style="flex:1;">+ 照片墙</button>
                </div>
            </div>

            <h3 style="margin-bottom:10px; padding-left:5px;">已添加的小组件</h3>
            <p v-if="widgets.length === 0" style="color:#999; font-size:13px;">桌面目前没有小组件</p>
            
            <div v-for="(widget, index) in widgets" :key="widget.id" style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight:bold;">{{ widget.name }} ({{ index + 1 }})</span>
                    <button @click="removeWidget(widget.id)" class="btn-danger" style="padding: 5px 12px; font-size: 12px;">删除</button>
                </div>
                <div>
                    <!-- 修复：去除了 e => 箭头函数，使用标准的 $event；去除了 HTML5 不支持的自闭合斜杠 /> -->
                    <input type="file" accept="image/*" @change="handleImageUpload($event, widget.id)" :id="'upload_' + widget.id" style="display:none;">
                    <button @click="triggerClick('upload_' + widget.id)" class="btn-primary" style="font-size: 12px; padding: 6px 12px;">
                        {{ widget.bgImage ? '更换背景' : '设置背景图片' }}
                    </button>
                    <button v-if="widget.bgImage" @click="widget.bgImage = null" class="btn-danger" style="font-size: 12px; padding: 6px 12px;">移除图片</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        const widgets = Vue.computed(() => store.desktopItems.filter(item => item.type === 'widget'));

        const addWidget = (type) => {
            const id = type + '_' + Date.now();
            const newWidget = type === 'time' 
                ? { type: 'widget', widgetType: 'time', id: id, name: '时钟天气', span: '4 / 2', bgImage: null }
                : { type: 'widget', widgetType: 'photo', id: id, name: '照片墙', span: '2 / 2', bgImage: null };
            store.desktopItems.unshift(newWidget);
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
                    if (width > 800) {
                        height = Math.round((height * 800) / width);
                        width = 800;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const targetWidget = store.desktopItems.find(item => item.id === id);
                    if (targetWidget) {
                        // 【修改核心】小组件转码也采用 PNG 格式，防止透明图变黑
                        targetWidget.bgImage = canvas.toDataURL('image/png');
                    }
                };
            };
        };

        return { store, widgets, addWidget, removeWidget, triggerClick, handleImageUpload };
    }
};
