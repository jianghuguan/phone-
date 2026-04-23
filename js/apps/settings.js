/* eslint-disable */
/* global window, document, FileReader, Blob, URL */
'use strict';

window.settingsApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto; background:#fbfbfd;">
            <h2 style="font-weight: 600; margin-bottom: 20px; font-size:24px;">设置</h2>
            
            <div style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <h3 style="margin-bottom:15px; font-size:16px;">数据管理 (JSON)</h3>
                <div style="display:flex; gap:10px;">
                    <button @click="exportData" class="btn-primary" style="flex:1;">导出备份</button>
                    <button @click="triggerImport" class="btn-primary" style="flex:1; background:#34c759;">导入备份</button>
                </div>
                <input type="file" id="importJsonFile" accept=".json" style="display:none" @change="importData" />
            </div>

            <div style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <h3 style="margin-bottom:15px; font-size:16px;">主 API (供 QQ Char 使用)</h3>
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#8e8e8e;">接口地址 (URL，含 /v1 如果需要)</label>
                    <input v-model="store.apiSettings.main.url" class="settings-input" placeholder="https://api.openai.com" />
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#8e8e8e;">密钥 (API Key)</label>
                    <input v-model="store.apiSettings.main.key" class="settings-input" type="password" placeholder="sk-..." />
                </div>
                <div style="margin-bottom:18px;">
                    <label style="font-size:12px; color:#8e8e8e;">模型选择 (Model)</label>
                    <input v-model="store.apiSettings.main.model" class="settings-input" placeholder="例如: gpt-3.5-turbo" />
                </div>
                <div style="display:flex; gap:10px;">
                    <button @click="testApi('main')" class="btn-primary" style="flex:1; background:#f0f0f0; color:#333;">测试模型</button>
                    <button @click="saveMsg" class="btn-primary" style="flex:1; background:#007aff;">保存</button>
                </div>
            </div>

            <div style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <h3 style="margin-bottom:15px; font-size:16px;">副 API 设置 (备用)</h3>
                <div style="margin-bottom:12px;">
                    <input v-model="store.apiSettings.sub.url" class="settings-input" placeholder="接口地址" />
                </div>
                <div style="margin-bottom:12px;">
                    <input v-model="store.apiSettings.sub.key" class="settings-input" type="password" placeholder="API Key" />
                </div>
                <div style="margin-bottom:18px;">
                    <input v-model="store.apiSettings.sub.model" class="settings-input" placeholder="Model" />
                </div>
                <div style="display:flex; gap:10px;">
                    <button @click="testApi('sub')" class="btn-primary" style="flex:1; background:#f0f0f0; color:#333;">测试模型</button>
                    <button @click="saveMsg" class="btn-primary" style="flex:1; background:#007aff;">保存</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        const exportData = () => {
            const dataStr = JSON.stringify(store);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'myPhoneData.json';
            a.click(); URL.revokeObjectURL(url);
        };

        const triggerImport = () => document.getElementById('importJsonFile').click();

        const importData = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    Object.assign(store, data);
                    alert('导入成功！');
                } catch(err) { alert('JSON 格式错误，导入失败！'); }
                e.target.value = '';
            };
            reader.readAsText(file);
        };

        const testApi = async (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('请填写完整URL和Key');
            try {
                const res = await fetch(config.url + '/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: 'hello' }],
                        max_tokens: 5
                    })
                });
                if (res.ok) alert('测试成功：API连接与模型响应正常！');
                else {
                    const errText = await res.text();
                    alert('测试失败: ' + res.status + ' - ' + errText.slice(0,60));
                }
            } catch(e) { alert('测试异常: ' + e.message); }
        };

        const saveMsg = () => alert('设置已自动保存！');

        return { store, exportData, triggerImport, importData, testApi, saveMsg };
    }
};
