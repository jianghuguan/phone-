/* eslint-disable */
/* global Vue, window */
'use strict';

// 统一白色背景，新增 iconImage 留空支持换图；小组件新增独立 bgImage 支持换图
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

// 防冲突检测：如果用户留存的是旧版格式的数据，强制刷新为新版
if (!initialState || !initialState.desktopItems[0].widgetType) {
    initialState = {
        currentApp: null,
        desktopItems: defaultDesktopItems
    };
}

window.store = Vue.reactive(initialState);

Vue.watch(window.store, (newState) => {
    window.localStorage.setItem('myPhoneData', JSON.stringify(newState));
}, { deep: true });

