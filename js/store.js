window.store = Vue.reactive({
    currentApp: null, 
    
    // 背景图控制
    timeBg: '', // 空字符串则显示纯色
    photoBg: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=300&q=80', // 默认可爱小猫

    // 应用配置库 (所有的基础信息放在这)
    appInfo: {
        qq: { name: 'QQ', textIcon: 'Q', color: '#e8f4fd' },
        weibo: { name: '微博', textIcon: '微', color: '#fde8e8' },
        sms: { name: '短信', textIcon: '信', color: '#e8fde8' },
        music: { name: '音乐', textIcon: '音', color: '#fde8f5' },
        widgetApp: { name: '小组件', textIcon: '修', color: '#1a1a1a' } // 黑色主题
    },

    // 桌面的全局网格布局：你的任何调整顺序，都在这个数组里！
    desktopLayout: [
        // 第一排默认是巨无霸合并小组件
        { id: 'timeWeatherWidget', isWidget: true, span: '4 / 2' },
        // 照片墙
        { id: 'photoWidget', isWidget: true, span: '2 / 2' },
        // 其他基础 App
        { id: 'qq', isWidget: false },
        { id: 'weibo', isWidget: false },
        { id: 'sms', isWidget: false },
        { id: 'music', isWidget: false },
        { id: 'widgetApp', isWidget: false }
    ]
});
