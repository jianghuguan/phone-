/* eslint-disable */
/* jshint ignore:start */
/* global Vue, window, document, FileReader, Image */
'use strict';

window.widgetApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto; background:#fff;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">小组件与排版管理</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <h3 style="margin-bottom:12px; font-size:16px;">添加新组件</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button @click="addWidget('time')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">时钟天气(4x2)</button>
                    <button @click="addWidget('dialog_2x2')" class="btn-primary" style="padding: 10px 5px; font-size:13px; background:#000 !important; color:#fff !important;">气泡日记(2x2)</button>
                    <button @click="addWidget('photo')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">照片墙(2x2)</button>
                    <button @click="addWidget('photo_1x1_circle')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">圆形照片(1x1)</button>
                    <button @click="addWidget('photo_1x2')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">竖版照片(1x2)</button>
                    <button @click="addWidget('photo_2x1')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">横版照片(2x1)</button>
                    <button @click="addWidget('empty_slot')" class="btn-primary" style="padding: 10px 5px; font-size:13px; grid-column: span 2; border: 1px dashed #000 !important; color: #555 !important;">➕ 插入透明留白格子(1x1)</button>
                </div>
                <p style="font-size:11px; color:#888; margin-top:8px;">*由于桌面支持多屏排版，如果一页满了会自动挤到下一页。你可以插入“透明留白格子”来强行挤压其他图标，以实现排版任意留白。</p>
            </div>

            <h3 style="margin-bottom:10px; padding-left:5px;">我的桌面</h3>
            <p v-if="widgets.length === 0" style="color:#999; font-size:13px;">桌面目前没有小组件</p>
            
            <div v-for="(widget, index) in widgets" :key="widget.id" style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight:bold;">{{ widget.name }}</span>
                    <button @click="removeWidget(widget.id)" class="btn-danger" style="padding: 5px 12px; font-size: 12px;">删除</button>
                </div>
                <div v-if="widget.widgetType !== 'empty_slot'">
                    <input type="file" accept="image/*" @change="handleImageUpload($event, widget.id)" :id="'upload_' + widget.id" style="display:none;">
                    <button @click="triggerClick('upload_' + widget.id)" class="btn-primary" style="font-size: 12px; padding: 6px 12px;">
                        {{ widget.bgImage ? (widget.widgetType === 'dialog_2x2' ? '更换头像' : '更换背景') : (widget.widgetType === 'dialog_2x2' ? '设置头像' : '设置背景图') }}
                    </button>
                    <button v-if="widget.bgImage" @click="widget.bgImage = null" class="btn-danger" style="font-size: 12px; padding: 6px 12px;">移除图片</button>
                </div>
            </div>
        </div>
    `,
    setup: function() {
        const store = window.store;

        // 获取所有分布在各页面的小组件
        const widgets = Vue.computed(function() {
            let allWidgets = [];
            if (store.desktopPages) {
                store.desktopPages.forEach(function(page) {
                    allWidgets = allWidgets.concat(page.filter(function(item) { return item.type === 'widget'; }));
                });
            }
            return allWidgets;
        });

        const addWidget = function(type) {
            const id = type + '_' + Date.now();
            let newWidget;
            switch(type) {
                case 'time': newWidget = { type: 'widget', widgetType: 'time', id: id, name: '时钟天气(4x2)', span: '4 / 2', bgImage: null }; break;
                case 'photo': newWidget = { type: 'widget', widgetType: 'photo', id: id, name: '照片墙(2x2)', span: '2 / 2', bgImage: null }; break;
                case 'photo_1x1_circle': newWidget = { type: 'widget', widgetType: 'photo_1x1_circle', id: id, name: '圆形照片(1x1)', span: '1 / 1', bgImage: null }; break;
                case 'photo_1x2': newWidget = { type: 'widget', widgetType: 'photo_1x2', id: id, name: '竖版照片(1x2)', span: '1 / 2', bgImage: null }; break;
                case 'photo_2x1': newWidget = { type: 'widget', widgetType: 'photo_2x1', id: id, name: '横版照片(2x1)', span: '2 / 1', bgImage: null }; break;
                case 'dialog_2x2': newWidget = { type: 'widget', widgetType: 'dialog_2x2', id: id, name: '气泡日记(2x2)', span: '2 / 2', bgImage: null, text: '' }; break;
                case 'empty_slot': newWidget = { type: 'widget', widgetType: 'empty_slot', id: id, name: '隐形留白(1x1)', span: '1 / 1', bgImage: null }; break;
            }
            
            // 默认添加逻辑：找一个大概率没满的页，如果第一页组件小于 10 个就塞第一页，否则新开一页或丢后面
            let targetPage = store.desktopPages[0];
            if (targetPage.length >= 16 && store.desktopPages.length > 1) {
                targetPage = store.desktopPages[1];
            }
            
            // 如果是隐形留白格子，默认放在最后面，这样用户才好慢慢往前拖以推挤其他图标
            if (type === 'empty_slot') {
                targetPage.push(newWidget);
            } else {
                targetPage.unshift(newWidget);
            }
        };

        const removeWidget = function(id) {
            store.desktopPages.forEach(function(page) {
                var idx = page.findIndex(function(item) { return item.id === id; });
                if (idx !== -1) {
                    page.splice(idx, 1);
                }
            });
        };

        const triggerClick = function(id) {
            const el = document.getElementById(id);
            if (el) el.click();
        };

        const handleImageUpload = function(event, id) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width;
                    let height = img.height;
                    
                    // 彻底解决大图无法保存的核心：控制画幅大小，并转换为高压缩率的 JPEG
                    if (width > 800) {
                        height = Math.round((height * 800) / width);
                        width = 800;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 遍历所有页面寻找该组件并替换图片
                    let found = false;
                    for(let i = 0; i < store.desktopPages.length; i++) {
                        let page = store.desktopPages[i];
                        let targetWidget = page.find(function(item) { return item.id === id; });
                        if (targetWidget) {
                            // 注意：必须使用 'image/jpeg' 和 0.6 的质量压缩，抛弃体积巨大的 png
                            targetWidget.bgImage = canvas.toDataURL('image/jpeg', 0.6);
                            found = true;
                            break;
                        }
                    }
                    // 强制触发生层响应式更新
                    if(found) {
                        store.desktopPages = JSON.parse(JSON.stringify(store.desktopPages));
                    }
                };
            };
        };

        return { store: store, widgets: widgets, addWidget: addWidget, removeWidget: removeWidget, triggerClick: triggerClick, handleImageUpload: handleImageUpload };
    }
};
