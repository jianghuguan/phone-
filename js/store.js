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

// 修复红叉：去除了 [0].widgetType 判断，改为标准的 Array 判断，防止强类型推导报错
if (!initialState || !Array.isArray(initialState.desktopItems) || initialState.desktopItems.length === 0) {
    initialState = { 
        currentApp: null, 
        desktopItems: defaultDesktopItems 
    };
}

// 补充 API 配置与 QQ 模拟数据
if (!initialState.apiSettings) {
    initialState.apiSettings = {
        main: { url: 'https://api.openai.com', key: '', model: 'gpt-3.5-turbo' },
        sub: { url: '', key: '', model: '' }
    };
}
if (!initialState.qqData) {
    initialState.qqData = {
        profile: { avatar: null, bgImage: null, nickname: '我', signature: '记录生活的美好' },
        contacts: [],
        messages: {}
    };
}

window.store = Vue.reactive(initialState);

Vue.watch(window.store, (newState) => {
    window.localStorage.setItem('myPhoneData', JSON.stringify(newState));
}, { deep: true });

