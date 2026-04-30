/* eslint-disable */
/* eslint-env browser, es2021 */
/* jshint ignore:start */
'use strict';

window.widgetApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto; background:#fff;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">小组件管理</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 20px;">
                <h3 style="margin-bottom:12px; font-size:16px;">添加新组件</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button @click="addWidget('time')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">时钟天气(4x2)</button>
                    <button @click="addWidget('photo')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">照片墙(2x2)</button>
                    <button @click="addWidget('photo_1x1_circle')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">圆形照片(1x1)</button>
                    <button @click="addWidget('photo_1x2')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">竖版照片(1x2)</button>
                    <button @click="addWidget('photo_2x1')" class="btn-primary" style="padding: 10px 5px; font-size:13px;">横版照片(2x1)</button>
                </div>
            </div>

            <h3 style="margin-bottom:10px; padding-left:5px;">我的桌面</h3>
            <p v-if="widgets.length === 0" style="color:#999; font-size:13px;">桌面目前没有小组件</p>
            
            <div v-for="(widget, index) in widgets" :key="widget.id" style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight:bold;">{{ widget.name }}</span>
                    <button @click="removeWidget(widget.id)" class="btn-danger" style="padding: 5px 12px; font-size: 12px;">删除</button>
                </div>
                <div>
                    <input type="file" accept="image/*" @change="handleImageUpload($event, widget.id)" :id="'upload_' + widget.id" style="display:none;">
                    <button @click="triggerClick('upload_' + widget.id)" class="btn-primary" style="font-size: 12px; padding: 6px 12px;">设置背景图</button>
                    <button v-if="widget.bgImage" @click="widget.bgImage = null; forceUpdate()" class="btn-danger" style="font-size: 12px; padding: 6px 12px;">移除图片</button>
                </div>
            </div>
        </div>
    `,
    setup: function () {
        var store = window.store;

        var widgets = window.Vue.computed(function () {
            return store.desktopItems.filter(function (item) {
                return item.type === 'widget';
            });
        });

        var addWidget = function (type) {
            var id = type + '_' + Date.now();
            var newWidget = null;
            switch(type) {
                case 'time': newWidget = { type: 'widget', widgetType: 'time', id: id, name: '时钟天气(4x2)', span: '4 / 2', bgImage: null }; break;
                case 'photo': newWidget = { type: 'widget', widgetType: 'photo', id: id, name: '照片墙(2x2)', span: '2 / 2', bgImage: null }; break;
                case 'photo_1x1_circle': newWidget = { type: 'widget', widgetType: 'photo_1x1_circle', id: id, name: '圆形照片(1x1)', span: '1 / 1', bgImage: null }; break;
                case 'photo_1x2': newWidget = { type: 'widget', widgetType: 'photo_1x2', id: id, name: '竖版照片(1x2)', span: '1 / 2', bgImage: null }; break;
                case 'photo_2x1': newWidget = { type: 'widget', widgetType: 'photo_2x1', id: id, name: '横版照片(2x1)', span: '2 / 1', bgImage: null }; break;
            }
            if (newWidget) {
                store.desktopItems.unshift(newWidget);
            }
        };

        var removeWidget = function (id) {
            store.desktopItems = store.desktopItems.filter(function (item) {
                return item.id !== id;
            });
        };

        var triggerClick = function (id) {
            var el = document.getElementById(id);
            if (el) el.click();
        };

        var forceUpdate = function () {
            var updatedItems = [];
            for (var i = 0; i < store.desktopItems.length; i++) {
                updatedItems.push(store.desktopItems[i]);
            }
            store.desktopItems = updatedItems;
        };

        var handleImageUpload = function (event, id) {
            var file = event.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    var width = img.width;
                    var height = img.height;

                    if (width > 600) {
                        height = Math.round((height * 600) / width);
                        width = 600;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    var targetWidget = null;
                    for (var j = 0; j < store.desktopItems.length; j++) {
                        if (store.desktopItems[j].id === id) {
                            targetWidget = store.desktopItems[j];
                            break;
                        }
                    }
                    
                    if (targetWidget) {
                        targetWidget.bgImage = canvas.toDataURL('image/jpeg', 0.7);
                        forceUpdate();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        return { 
            store: store, 
            widgets: widgets, 
            addWidget: addWidget, 
            removeWidget: removeWidget, 
            triggerClick: triggerClick, 
            handleImageUpload: handleImageUpload, 
            forceUpdate: forceUpdate 
        };
    }
};
