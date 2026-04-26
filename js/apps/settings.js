/* eslint-disable */
/* global window, document, FileReader, Blob, URL, fetch, prompt, alert */
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

            <!-- API 设置复用模板块 -->
            <template v-for="apiType in ['main', 'sub', 'draw']" :key="apiType">
                <div style="background: #fff; padding: 18px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h3 style="font-size:16px; margin:0;">
                            {{ apiType === 'main' ? '主 API (对话)' : apiType === 'sub' ? '副 API (总结/动态)' : '绘图 API (未来)' }}
                        </h3>
                        <button @click="savePreset(apiType)" class="btn-primary" style="font-size:12px; padding:4px 8px;">保存为预设</button>
                    </div>

                    <div v-if="store.apiPresets && store.apiPresets.length > 0" style="margin-bottom:12px;">
                        <select @change="loadPreset(apiType, $event)" class="settings-input" style="padding:6px; background:#f5f5f5;">
                            <option value="">-- 选择预设快速套用 --</option>
                            <option v-for="p in store.apiPresets" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                    </div>

                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px; color:#8e8e8e;">接口地址 (URL)</label>
                        <input v-model="store.apiSettings[apiType].url" class="settings-input" placeholder="https://api.openai.com" />
                    </div>
                    <div style="margin-bottom:12px;">
                        <label style="font-size:12px; color:#8e8e8e;">密钥 (API Key)</label>
                        <input v-model="store.apiSettings[apiType].key" class="settings-input" type="password" placeholder="sk-..." />
                    </div>
                    <div style="margin-bottom:18px;">
                        <label style="font-size:12px; color:#8e8e8e;">模型选择 (Model)</label>
                        <div style="display:flex; gap:10px; align-items:center; margin-top:6px;">
                            <input v-model="store.apiSettings[apiType].model" class="settings-input" style="margin-top:0; flex:1;" placeholder="gpt-3.5-turbo" />
                            <select 
                                v-if="store.fetchedModels && store.fetchedModels.length" 
                                v-model="store.apiSettings[apiType].model" 
                                class="settings-input" 
                                style="margin-top:0; width:120px;"
                            >
                                <option v-for="m in store.fetchedModels" :key="m" :value="m">{{m}}</option>
                            </select>
                            <button @click="fetchModels(apiType)" class="btn-primary" style="font-size:12px; padding:8px 12px; height:36px; margin:0;">拉取</button>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button @click="testApi(apiType)" class="btn-primary" style="flex:1; background:#f0f0f0; color:#333;">测试</button>
                        <button @click="saveMsg" class="btn-primary" style="flex:1; background:#007aff;">保存</button>
                    </div>
                </div>
            </template>
            
            <div v-if="store.apiPresets && store.apiPresets.length > 0" style="text-align:center; padding-bottom:20px;">
                <button @click="clearPresets" class="btn-danger" style="font-size:12px; padding:6px 12px; border:none; background:transparent; color:#ff3b30 !important; text-decoration:underline;">清除所有保存的预设</button>
            </div>
        </div>
    `,
    setup() {
        const store = window.store;

        // 初始化缺失数据结构
        if (!store.apiSettings.draw) {
            store.apiSettings.draw = { url: '', key: '', model: '' };
        }
        if (!store.apiPresets) {
            store.apiPresets = [];
        }
        if (!store.fetchedModels) {
            store.fetchedModels = [];
        }

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

        const savePreset = (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('URL和Key不能为空，无法保存！');
            const name = prompt('请输入预设名称：');
            if (name) {
                store.apiPresets.push({
                    id: 'preset_' + Date.now(),
                    name: name,
                    url: config.url,
                    key: config.key,
                    model: config.model
                });
                alert('预设保存成功！可在任一 API 下拉框中直接选用。');
            }
        };

        const loadPreset = (type, event) => {
            const presetId = event.target.value;
            if (!presetId) return;
            const preset = store.apiPresets.find(p => p.id === presetId);
            if (preset) {
                store.apiSettings[type].url = preset.url;
                store.apiSettings[type].key = preset.key;
                store.apiSettings[type].model = preset.model;
            }
            event.target.value = ''; // 恢复默认选项
        };

        const clearPresets = () => {
            if (confirm('确认删除所有保存的 API 预设吗？')) {
                store.apiPresets = [];
            }
        };

        const fetchModels = async (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('请先填写完整的URL和Key！');
            try {
                let baseUrl = config.url.replace(/\/v1\/?$/, ''); // 防止重复v1
                const res = await fetch(baseUrl + '/v1/models', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${config.key}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.data && Array.isArray(json.data)) {
                        store.fetchedModels = json.data.map(m => m.id);
                        alert('拉取模型成功！请在下拉框中选择。');
                    } else {
                        throw new Error('未识别的模型列表格式');
                    }
                } else {
                    throw new Error('服务器拒绝请求 ' + res.status);
                }
            } catch(e) {
                alert('拉取异常: ' + e.message);
            }
        };

        const testApi = async (type) => {
            const config = store.apiSettings[type];
            if (!config.url || !config.key) return alert('请填写完整URL和Key');
            try {
                let baseUrl = config.url.replace(/\/v1\/?$/, '');
                const res = await fetch(baseUrl + '/v1/chat/completions', {
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

        return { store, exportData, triggerImport, importData, testApi, saveMsg, savePreset, loadPreset, fetchModels, clearPresets };
    }
};
