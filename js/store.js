window.store = Vue.reactive({
    currentApp: null,
    
    // 你可以在组件APP长按随便换这两个的背景链接
    timeWidgetBg: 'https://images.unsplash.com/photo-1506744626753-1fa44df6231e?w=800&q=80',
    photoWidgetImg: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&q=80',

    // App 的配置库 (仅做查字典存数据使用)
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

    // ★核心机制：桌面的展示列表及网格分布顺序 (可拖拽排序)
    desktopItems: [
        { type: 'widget', id: 'timeWidget', span: '4 / 2' }, // 占满一行
        { type: 'widget', id: 'photoWidget', span: '2 / 2' }, // 占半行
        { type: 'app', id: 'qq', span: '1 / 1' },
        { type: 'app', id: 'sms', span: '1 / 1' },
        { type: 'app', id: 'weibo', span: '1 / 1' },
        { type: 'app', id: 'forum', span: '1 / 1' },
        { type: 'app', id: 'music', span: '1 / 1' },
        { type: 'app', id: 'theme', span: '1 / 1' },
        { type: 'app', id: 'settings', span: '1 / 1' },
        { type: 'app', id: 'widgetApp', span: '1 / 1' }
    ]
});
