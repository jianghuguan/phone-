const { reactive } = Vue;

// 全局状态管理
export const store = reactive({
    currentApp: null, // 当前打开的App，null为桌面
    
    // 所有已安装的 App (1x1 格子)
    installedApps: [
        { id: 'qq', name: 'QQ', icon: '🐧', color: '#e8f4fd' },
        { id: 'sms', name: '短信', icon: '💬', color: '#e8fde8' },
        { id: 'weibo', name: '微博', icon: '👁️', color: '#fde8e8' },
        { id: 'forum', name: '论坛', icon: '📌', color: '#f3e8fd' },
        { id: 'music', name: '音乐', icon: '🎵', color: '#fde8f5' },
        { id: 'theme', name: '美化', icon: '✨', color: '#fdfce8' },
        { id: 'settings', name: '设置', icon: '⚙️', color: '#eeeeee' },
        { id: 'widgetApp', name: '小组件', icon: '🧩', color: '#e8fdfa' }
    ],

    // 桌面上的小组件 (span 代表占用几列 x 几行)
    activeWidgets: [
        { id: 'timeWidget', type: 'time', span: '4 / 2' }, // 占4列，2行
        { id: 'weatherWidget', type: 'weather', span: '2 / 2' } // 占2列，2行
    ]
});
