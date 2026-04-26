/* eslint-disable */
/* global window, document, FileReader, Blob, URL, Vue */
'use strict';

window.settingsApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto; background:#fbfbfd;">
            <h2 style="font-weight: 600; margin-bottom: 20px; font-size:24px;">设置</h2>
            
            <div style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <h3 style="margin-bottom:15px; font-size:16px;">数据管理 (JSON)</h3>
                <div style="display:flex; gap:10px;">
                    <button @click="exportData" class="btn-primary" style="flex:1;">导出备份</button>
                    <button @click="triggerImport" class="btn-primary" style="flex:1; background:#34c759; color:#fff !important;">导入备份</button>
                </div>
                <input type="file" id="importJsonFile" accept=".json" style="display:none" @change="importData" />
            </div>

            <div v-for="api in apiTypes" :key="api.id" style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <h3 style="margin-bottom:15px; font-size:16px;">{{ api.name }}</h3>
                
                <div style="background: #f9f9f9; padding: 12px; border-radius: 12px; margin-bottom: 15px;">
                    <div style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #444;">API 预设</div>
                    <div style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
                        <select v-model="selectedPresets[api.id]" @change="applyPreset(api.id)" class="settings-input" style="margin-top:0; flex:2;">
                            <option value="">-- 选择预设 --</option>
                            <option v-for="(p, index) in store.apiSettings[api.id].presets" :value="index">{{ p.name }}</option>
                        </select>
                        <button @click="deletePreset(api.id)" class="btn-danger" style="padding:8px 12px; font-size:12px;">删除</button>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <input v-model="newPresetNames[api.id]" class="settings-input" style="margin-top:0; flex:2;" placeholder="保存当前为新预设名称" />
                        <button @click="savePreset(api.id)" class="btn-primary" style="padding:8px 12px; font-size:12px; flex:1;">保存预设</button>
                    </div>
                </div>

                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#8e8e8e;">接口地址 (URL)</label>
                    <input v-model="store.apiSettings[api.id].url" class="settings-input" placeholder="https://api.openai.com" />
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#8e8e8e;">密钥 (API Key)</label>
                    <input v-model="store.apiSettings[api.id].key" class="settings-input" type="password" placeholder="sk-..." />
                </div>
                <div style="margin-bottom:18px;">
                    <label style="font-size:12px; color:#8e8e8e;">模型选择 (Model)</label>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input :list="'models_' + api.id" v-model="store.apiSettings[api.id].model" class="settings-input" style="margin-top:0; flex:2;" placeholder="例如: gpt-3.5-turbo" />
                        <datalist :id="'models_' + api.id">
                            <option v-for="m in availableModels[api.id]" :value="m"></option>
                        </datalist>
                        <button @click="fetchModels(api.id)" class="btn-primary" style="padding:8px; font-size:12px;">拉取模型</button>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button @click="testApi(api.id)" class="btn-primary" style="flex:1; background:#f0f0f0; color:#333;">测试连接</button>
                    <button @click="saveMsg" class="btn-primary" style="flex:1; background:#007aff; color:#fff !important;">保存</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        const apiTypes = [
            { id: 'main', name: '主 API (供 QQ 角色使用)' },
            { id: 'sub', name: '副 API (自动总结与朋友圈)' },
            { id: 'draw', name: '绘图 API (预留绘画接口)' }
        ];

        const availableModels = Vue.reactive({ main: [], sub: [], draw: [] });
        const selectedPresets = Vue.reactive({ main: '', sub: '', draw: '' });
        const newPresetNames = Vue.reactive({ main: '', sub: '', draw: '' });

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

        const fetchModels = async (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('请先填写完整的 URL 和 Key');
            try {
                const res = await window.fetch(config.url + '/v1/models', {
                    method: 'GET',
                    headers: { 'Authorization': 'Bearer ' + config.key }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && Array.isArray(data.data)) {
                        availableModels[type] = data.data.map(m => m.id);
                        alert(`拉取成功！共获取到 ${availableModels[type].length} 个模型，请在输入框下拉列表中选择。`);
                    } else {
                        alert('拉取成功，但未解析到标准格式的模型列表');
                    }
                } else {
                    alert('拉取失败: ' + res.status);
                }
            } catch (e) {
                alert('拉取模型请求异常: ' + e.message);
            }
        };

        const testApi = async (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('请填写完整URL和Key');
            
            try {
                if (type === 'draw') {
                    // 绘画API通用测通方式：探测模型列表
                    const res = await window.fetch(config.url + '/v1/models', {
                        method: 'GET',
                        headers: { 'Authorization': 'Bearer ' + config.key }
                    });
                    if (res.ok) alert('测试成功：绘图 API 连通性正常！');
                    else alert('测试失败: ' + res.status);
                    return;
                }

                // 主副API文本测通
                const res = await window.fetch(config.url + '/v1/chat/completions', {
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

        const savePreset = (type) => {
            const name = newPresetNames[type].trim();
            if (!name) return alert('请输入新预设的名称');
            const config = store.apiSettings[type];
            store.apiSettings[type].presets.push({
                name,
                url: config.url,
                key: config.key,
                model: config.model
            });
            newPresetNames[type] = '';
            selectedPresets[type] = store.apiSettings[type].presets.length - 1;
            alert('当前预设已保存');
        };

        const applyPreset = (type) => {
            const idx = selectedPresets[type];
            if (idx === '' || idx === undefined) return;
            const preset = store.apiSettings[type].presets[idx];
            if (preset) {
                store.apiSettings[type].url = preset.url;
                store.apiSettings[type].key = preset.key;
                store.apiSettings[type].model = preset.model;
            }
        };

        const deletePreset = (type) => {
            const idx = selectedPresets[type];
            if (idx === '' || idx === undefined) return alert('请先选择要删除的预设');
            store.apiSettings[type].presets.splice(idx, 1);
            selectedPresets[type] = '';
        };

        const saveMsg = () => alert('设置已自动保存！');

        return { 
            store, 
            apiTypes, 
            availableModels, 
            selectedPresets, 
            newPresetNames,
            exportData, 
            triggerImport, 
            importData, 
            fetchModels, 
            testApi, 
            savePreset,
            applyPreset,
            deletePreset,
            saveMsg 
        };
    }
};

// 确保全局 API 数据结构完整 (为了向下兼容老存档)
if (window.store && window.store.apiSettings) {
    if (!window.store.apiSettings.draw) {
        window.store.apiSettings.draw = { url: '', key: '', model: '' };
    }
    ['main', 'sub', 'draw'].forEach(type => {
        if (!window.store.apiSettings[type].presets) {
            window.store.apiSettings[type].presets = [];
        }
    });
}
