/* global Vue */

const defaultDesktopItems = [
    { type: 'widget', id: 'timeWidget', name: '时钟天气', span: '4 / 2' },
    { type: 'widget', id: 'photoWidget', name: '照片墙', span: '2 / 2' },
    { type: 'app', id: 'qq', name: 'QQ', textIcon: 'Q', color: '#e8f4fd' },
    { type: 'app', id: 'sms', name: '短信', textIcon: '信', color: '#e8fde8' },
    { type: 'app', id: 'weibo', name: '微博', textIcon: '微', color: '#fde8e8' },
    { type: 'app', id: 'forum', name: '论坛', textIcon: '论', color: '#f3e8fd' },
    { type: 'app', id: 'music', name: '音乐', textIcon: '音', color: '#fde8f5' },
    { type: 'app', id: 'theme', name: '美化', textIcon: '美', color: '#fdfce8' },
    { type: 'app', id: 'settings', name: '设置', textIcon: '设', color: '#eeeeee' },
    { type: 'app', id: 'widgetApp', name: '小组件', textIcon: '组', color: '#e8fdfa' }
];

const savedData = localStorage.getItem('myPhoneData');
const initialState = savedData ? JSON.parse(savedData) : {
    currentApp: null,
    desktopItems: defaultDesktopItems,
    timeBgImage: null,
    photoWallImage: null
};

window.store = Vue.reactive(initialState);

Vue.watch(window.store, (newState) => {
    localStorage.setItem('myPhoneData', JSON.stringify(newState));
}, { deep: true });

