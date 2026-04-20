window.widgetApp = {
    template: `
        <div style="padding: 20px; padding-bottom: 60px;">
            <h2 style="font-weight: 800; font-size: 28px; margin-bottom: 25px; color: #111;">美化我的小组件</h2>
            
            <!-- 组件存在状态开关 -->
            <div style="background: #f5f5f7; padding: 20px; border-radius: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 16px; margin-bottom: 10px;">智能混合组件 (4x2)</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 15px;">集成时间、日期、实时天气与温度。</p>
                <button @click="toggleWidget('timeWeatherWidget', '4 / 2')" :style="btnStyle(has('timeWeatherWidget'))">
                    {{ has('timeWeatherWidget') ? '从桌面移除' : '添加到桌面' }}
                </button>
            </div>

            <!-- 照片墙开关 -->
            <div style="background: #f5f5f7; padding: 20px; border-radius: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 16px; margin-bottom: 10px;">照片墙组件 (2x2)</h3>
                <button @click="toggleWidget('photoWidget', '2 / 2')" :style="btnStyle(has('photoWidget'))">
                    {{ has('photoWidget') ? '从桌面移除' : '添加到桌面' }}
                </button>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <!-- 壁纸更换区 -->
            <h2 style="font-weight: 700; font-size: 20px; margin-bottom: 15px;">一键换皮肤</h2>

            <h3 style="font-size: 14px; margin-bottom: 10px;">修改 时间/天气 背景图:</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 25px;">
                <div v-for="bg in timeBgs" @click="store.timeBg = bg" 
                     :style="{ backgroundImage: 'url(' + bg + ')', width: '60px', height: '30px', backgroundSize: 'cover', borderRadius: '8px', cursor: 'pointer', border: store.timeBg === bg ? '2px solid #000' : 'none' }">
                </div>
                <div @click="store.timeBg = ''" style="width: 60px; height: 30px; background: #8faada; border-radius: 8px; text-align: center; line-height: 30px; font-size: 12px; font-weight: bold;">恢复纯色</div>
            </div>

            <h3 style="font-size: 14px; margin-bottom: 10px;">修改 照片墙 图片:</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <div v-for="bg in photoBgs" @click="store.photoBg = bg" 
                     :style="{ backgroundImage: 'url(' + bg + ')', width: '60px', height: '60px', backgroundSize: 'cover', borderRadius: '12px', cursor: 'pointer', border: store.photoBg === bg ? '2px solid #000' : 'none' }">
                </div>
            </div>

        </div>
    `,
    setup() {
        const store = window.store;

        // 检查桌面是否存在这个组件
        const has = (id) => store.desktopLayout.some(i => i.id === id);

        // 添加或移除组件
        const toggleWidget = (id, span) => {
            if (has(id)) {
                store.desktopLayout = store.desktopLayout.filter(i => i.id !== id);
            } else {
                store.desktopLayout.unshift({ id, isWidget: true, span });
            }
        };

        const btnStyle = (isActive) => ({
            padding: '10px 20px', borderRadius: '25px', border: 'none', width: '100%',
            backgroundColor: isActive ? '#ff3b30' : '#111', color: '#fff', fontWeight: 'bold'
        });

        // 为你精选的高清无版权美图
        const timeBgs = [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', // 海滩
            'https://images.unsplash.com/photo-1534533983638-34860b865522?auto=format&fit=crop&w=400&q=80', // 清晨雪山
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'  // 抽象艺术
        ];

        const photoBgs = [
            'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=300&q=80', // 默认猫
            'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=300&q=80', // 狗
            'https://images.unsplash.com/photo-1516483638261-f4088921eeeb?auto=format&fit=crop&w=300&q=80', // 治愈风景
            'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=300&q=80'  // 咖啡厅
        ];

        return { store, has, toggleWidget, btnStyle, timeBgs, photoBgs };
    }
}
