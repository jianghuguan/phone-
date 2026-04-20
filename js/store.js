// 使用 Vue 提供的方法
window.store = Vue.reactive({
    currentApp: null, // null为桌面
    
    // 把表情换成了文字 textIcon
    installedApps: [
        { id: 'qq', name: 'QQ', textIcon: 'Q', color: '#e8f4fd' },
        { id: 'sms', name: '短信', textIcon: '信', color: '#e8fde8' },
        { id: 'weibo', name: '微博', textIcon: '微', color: '#fde8e8' },
        { id: 'forum', name: '论坛', textIcon: '论', color: '#f3e8fd' },
        { id: 'music', name: '音乐', textIcon: '音', color: '#fde8f5' },
        { id: 'theme', name: '美化', textIcon: '美', color: '#fdfce8' },
        { id: 'settings', name: '设置', textIcon: '设', color: '#eeeeee' },
        { id: 'widgetApp', name: '小组件', textIcon: '组', color: '#e8fdfa' }
    ],

    activeWidgets: [
        { id: 'timeWidget', type: 'time', span: '4 / 2' },
        { id: 'weatherWidget', type: 'weather', span: '2 / 2' }
    ]
});
