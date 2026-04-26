/* eslint-disable */
/* global window, document, FileReader, Blob, URL, Vue, fetch, alert, prompt */
'use strict';

window.settingsApp = {
    template: `
        <div style="padding: 20px; height: calc(100% - 60px); overflow-y:auto; background:#fbfbfd;">
            <h2 style="font-weight: 600; margin-bottom: 20px; font-size:24px;">设置</h2>
            
            <div style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="font-size:16px; margin:0;">数据管理 (JSON)</h3>
                    <button @click="clearPresets" v-if="store.apiPresets && store.apiPresets.length" style="font-size:12px; padding:4px 8px; background:#ff3b30; color:#fff; border:none; border-radius:4px;">清空 API 预设</button>
                </div>
                <div style="display:flex; gap:10px;">
                    <button @click="exportData" class="btn-primary" style="flex:1;">导出备份</button>
                    <button @click="triggerImport" class="btn-primary" style="flex:1; background:#34c759; color:#fff; border-color:#34c759;">导入备份</button>
                </div>
                <input type="file" id="importJsonFile" accept=".json" style="display:none" @change="importData" />
            </div>

            <div v-for="api in apiConfigs" :key="api.type" style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                <h3 style="margin-bottom:15px; font-size:16px; display:flex; justify-content:space-between; align-items:center;">
                    {{ api.name }}
                    <button @click="savePreset(api.type)" style="font-size:12px; padding:4px 8px; background:#007aff; color:#fff; border:none; border-radius:4px;">保存为预设</button>
                </h3>

                <div style="margin-bottom:12px;" v-if="store.apiPresets && store.apiPresets.length > 0">
                    <select @change="loadPreset(api.type, $event)" class="settings-input" style="margin-top:0;">
                        <option value="">-- 从全局预设中快速加载 --</option>
                        <option v-for="(p, i) in store.apiPresets" :value="i" :key="i">{{ p.name }} ({{ p.model }})</option>
                    </select>
                </div>

                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#8e8e8e;">接口地址 (URL)</label>
                    <input v-model="store.apiSettings[api.type].url" class="settings-input" placeholder="例如: https://api.openai.com" />
                </div>
                <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#8e8e8e;">密钥 (API Key)</label>
                    <input v-model="store.apiSettings[api.type].key" class="settings-input" type="password" placeholder="sk-..." />
                </div>
                <div style="margin-bottom:18px;">
                    <label style="font-size:12px; color:#8e8e8e; display:flex; justify-content:space-between;">
                        <span>模型选择 (Model)</span>
                        <span @click="fetchModels(api.type)" style="color:#007aff; cursor:pointer; font-weight:bold;">一键拉取模型</span>
                    </label>
                    <input v-model="store.apiSettings[api.type].model" class="settings-input" :list="'models_' + api.type" placeholder="手动输入或点击拉取模型" />
                    <datalist :id="'models_' + api.type">
                        <option v-for="m in fetchedModels[api.type]" :value="m" :key="m"></option>
                    </datalist>
                </div>
                <div style="display:flex; gap:10px;">
                    <button @click="testApi(api.type)" class="btn-primary" style="flex:1; background:#f0f0f0; color:#333;">测试模型</button>
                    <button @click="saveMsg" class="btn-primary" style="flex:1; background:#007aff; color:#fff; border-color:#007aff;">保存设置</button>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        // 兼容初始化
        if (!store.apiSettings.draw) store.apiSettings.draw = { url: '', key: '', model: '' };
        if (!store.apiPresets) store.apiPresets = [];

        const apiConfigs = [
            { type: 'main', name: '主 API (供 QQ 聊天使用)' },
            { type: 'sub', name: '副 API (供自动总结/朋友圈)' },
            { type: 'draw', name: '绘图 API (扩展备用)' }
        ];

        const fetchedModels = Vue.reactive({
            main: [], sub: [], draw: []
        });

        const savePreset = (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('请先填写完整URL和Key再保存预设');
            const name = prompt('请输入预设名称：', '预设 ' + (store.apiPresets.length + 1));
            if (name) {
                store.apiPresets.push({
                    name: name,
                    url: config.url,
                    key: config.key,
                    model: config.model
                });
                alert('全局 API 预设保存成功！');
            }
        };

        const loadPreset = (type, event) => {
            const idx = event.target.value;
            if (idx === '') return;
            const preset = store.apiPresets[idx];
            if (preset) {
                store.apiSettings[type].url = preset.url;
                store.apiSettings[type].key = preset.key;
                store.apiSettings[type].model = preset.model;
            }
            event.target.value = ''; 
        };

        const clearPresets = () => {
            if (confirm('确定要清空所有 API 预设吗？')) {
                store.apiPresets = [];
            }
        };

        const fetchModels = async (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('请先填写URL和Key');
            try {
                let baseUrl = config.url;
                if (baseUrl.endsWith('/v1') || baseUrl.endsWith('/v1/')) {
                    baseUrl = baseUrl.replace(/\/v1\/?$/, '');
                }
                const res = await fetch(baseUrl + '/v1/models', {
                    headers: { 'Authorization': 'Bearer ' + config.key }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && Array.isArray(data.data)) {
                        fetchedModels[type] = data.data.map(m => m.id);
                        alert('拉取成功！请在下方输入框的双击下拉菜单中选择。');
                    } else {
                        alert('拉取失败，接口返回格式不规范。');
                    }
                } else {
                    alert('拉取失败，状态码: ' + res.status);
                }
            } catch (e) {
                alert('网络请求异常: ' + e.message);
            }
        };

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
                let checkUrl = config.url;
                if (!checkUrl.endsWith('/v1/chat/completions') && !checkUrl.endsWith('/chat/completions')) {
                    checkUrl = checkUrl.replace(/\/$/, '') + '/v1/chat/completions';
                }
                
                const res = await fetch(checkUrl, {
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

        return { 
            store, apiConfigs, fetchedModels, 
            savePreset, loadPreset, clearPresets, fetchModels,
            exportData, triggerImport, importData, testApi, saveMsg 
        };
    }
};
