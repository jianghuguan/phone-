import { store } from '../store.js';

export default {
    template: `
        <div style="padding: 20px; height: 100%; overflow-y: auto;">
            <h2 style="font-weight: 600; margin-bottom: 20px;">组件管理</h2>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px; margin-bottom: 15px;">
                <h3>时间组件 (4x2)</h3>
                <button @click="toggleWidget('timeWidget', 'time', '4 / 2')" :style="btnStyle(hasWidget('timeWidget'))">
                    {{ hasWidget('timeWidget') ? '移除' : '添加到桌面' }}
                </button>
            </div>

            <div style="background: #f5f5f7; padding: 15px; border-radius: 16px;">
                <h3>天气组件 (2x2)</h3>
                <button @click="toggleWidget('weatherWidget', 'weather', '2 / 2')" :style="btnStyle(hasWidget('weatherWidget'))">
                    {{ hasWidget('weatherWidget') ? '移除' : '添加到桌面' }}
                </button>
            </div>
        </div>
    `,
    setup() {
        const hasWidget = (id) => {
            return store.activeWidgets.some(w => w.id === id);
        };

        const toggleWidget = (id, type, span) => {
            if (hasWidget(id)) {
                store.activeWidgets = store.activeWidgets.filter(w => w.id !== id);
            } else {
                store.activeWidgets.unshift({ id, type, span }); // 放在最前面
            }
        };

        const btnStyle = (isActive) => ({
            marginTop: '10px', padding: '8px 16px', borderRadius: '20px', border: 'none',
            backgroundColor: isActive ? '#ff3b30' : '#007aff', color: '#fff', fontWeight: 'bold'
        });

        return { hasWidget, toggleWidget, btnStyle };
    }
}
