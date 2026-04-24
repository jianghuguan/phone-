/* eslint-env browser, es2021 */
/* global Vue */
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

let initialState = null;
const savedData = window.localStorage.getItem('myPhoneData');

if (savedData) {
    try {
        initialState = JSON.parse(savedData);
    } catch (err) {
        if (err) { initialState = null; }
    }
}

if (!initialState || !Array.isArray(initialState.desktopItems) || initialState.desktopItems.length === 0) {
    initialState = { currentApp: null, desktopItems: defaultDesktopItems };
}

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

// 补充名片头像字段
if (!initialState.qqData.userCards) {
    initialState.qqData.userCards = [
        { id: 'uc_default', name: '默认用户', persona: '一个普通的记录生活者，回复风格口语化。', avatar: null }
    ];
} else {
    initialState.qqData.userCards.forEach(uc => {
        if (uc.avatar === undefined) uc.avatar = null;
    });
}

if (!initialState.qqData.wallet) {
    initialState.qqData.wallet = {
        balance: 1000,
        history: [{ desc: '初始零钱红包', amount: '+1000.00', time: Date.now() }]
    };
}

window.store = Vue.reactive(initialState);

Vue.watch(window.store, (newState) => {
    try {
        const dataString = JSON.stringify(newState);
        window.localStorage.setItem('myPhoneData', dataString);
    } catch (err) {
        if (err) window.console.warn('Data save failed');
    }
}, { deep: true });
