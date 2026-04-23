/* eslint-disable */
/* global Vue, window */
'use strict';

const defaultDesktopItems = [
    { type: 'widget', widgetType: 'time', id: 'timeWidget_1', name: '时钟天气', span: '4 / 2', bgImage: null },
    { type: 'widget', widgetType: 'photo', id: 'photoWidget_1', name: '照片墙', span: '2 / 2', bgImage: null },
    { type: 'app', id: 'qq', name: 'QQ', textIcon: 'Q', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'sms', name: '短信', textIcon: '信', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'weibo', name: '微博', textIcon: '微', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'forum', name: '论坛', textIcon: '论', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'music', name: '音乐', textIcon: '音', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'theme', name: '美化', textIcon: '美', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'settings', name: '设置', textIcon: '设', color: '#ffffff', iconImage: null },
    { type: 'app', id: 'widgetApp', name: '小组件', textIcon: '组', color: '#ffffff', iconImage: null }
];

const savedData = window.localStorage.getItem('myPhoneData');
let initialState = savedData ? JSON.parse(savedData) : null;

// 增加多层级安全判断，修复编辑器报红可能引发 TypeError 的警告
if (!initialState || !initialState.desktopItems || initialState.desktopItems.length === 0 || !initialState.desktopItems[0].widgetType) {
    initialState = {
        currentApp: null,
        desktopItems: defaultDesktopItems
    };
}

window.store = Vue.reactive(initialState);

Vue.watch(window.store, (newState) => {
    window.localStorage.setItem('myPhoneData', JSON.stringify(newState));
}, { deep: true });

