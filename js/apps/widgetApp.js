window.widgetApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 30px); overflow-y: auto; padding-bottom: 50px;">
            <h2 style="font-weight: 600; margin-bottom: 20px; font-size: 28px;">小与组件</h2>
            
            <div style="background: #f5f5f7; padding: 18px; border-radius: 20px; margin-bottom: 20px;">
                <h3 style="font-size: 16px;">⏱ 时间变天小组件 (4x2)</h3>
                <button @click="toggleWidget('timeWidget', '4 / 2')" :style="btnStyle(hasWidget('timeWidget'))">
                    {{ hasWidget('timeWidget') ? '从桌面移除' : '添加到桌面' }}
                </button>
                <div v-if="hasWidget('timeWidget')" style="margin-top: 15px;">
                    <label style="font-size: 12px; color: #555;">设置背景图片链接:</label>
                    <input type="text" class="input-field" v-model="store.timeWidgetBg" placeholder="输入图片 URL" />
                </div>
            </div>

            <div style="background: #f5f5f7; padding: 18px; border-radius: 20px;">
                <h3 style="font-size: 16px;">📸 照片墙小组件 (2x2)</h3>
                <button @click="toggleWidget('photoWidget', '2 / 2')" :style="btnStyle(hasWidget('photoWidget'))">
                    {{ hasWidget('photoWidget') ? '从桌面移除' : '添加到桌面' }}
                </button>
                <div v-if="hasWidget('photoWidget')" style="margin-top: 15px;">
                    <label style="font-size: 12px; color: #555;">更换展示照片链接:</label>
                    <input type="text" class="input-field" v-model="store.photoWidgetImg" placeholder="输入图片 URL" />
                </div>
            </div>
            
            <p style="margin-top: 30px; font-size: 13px; color: #888; text-align: center;">
                💡 提示：在桌面上<strong>长按</strong>任意应用或组件即可随意拖动排列！
            </p>
        </div>
    `,
    setup() {
        const store = window.store; 

        // 检查桌面列表中有没有这个组件
        const hasWidget = (id) => store.desktopItems.some(w => w.id === id);

        const toggleWidget = (id, span) => {
            if (hasWidget(id)) {
                // 删除
                store.desktopItems = store.desktopItems.filter(w => w.id !== id);
            } else {
                // 插入开头
                store.desktopItems.unshift({ type: 'widget', id, span });
            }
        };

        const btnStyle = (isActive) => ({
            marginTop: '12px', padding: '10px 18px', borderRadius: '30px', border: 'none', width: '100%',
            backgroundColor: isActive ? '#ff3b30' : '#000', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
        });

        return { store, hasWidget, toggleWidget, btnStyle };
    }
}
