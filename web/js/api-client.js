class ApiClient {
    constructor(baseUrl) {
        // 优先级: 构造参数 > 全局变量 window.API_BASE_URL > 默认值
        this.baseUrl = baseUrl || window.API_BASE_URL || 'http://localhost:5000/api';
    }

    async checkHealth() {
        try {
            const res = await fetch(`${this.baseUrl}/health`);
            return await res.json();
        } catch (e) {
            console.warn('后端服务未启动，将使用本地处理模式');
            return null;
        }
    }

    async processAuto(imageData, region) {
        const res = await fetch(`${this.baseUrl}/process/auto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData, region })
        });
        if (!res.ok) return null;
        return await res.json();
    }

    async processManual(imageData, maskData) {
        const res = await fetch(`${this.baseUrl}/process/manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData, mask: maskData })
        });
        if (!res.ok) return null;
        return await res.json();
    }

    async detectWatermark(imageData) {
        const res = await fetch(`${this.baseUrl}/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });
        if (!res.ok) return null;
        return await res.json();
    }

    async processBackground(imageData, opts = {}) {
        const res = await fetch(`${this.baseUrl}/process/background`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: imageData,
                mode: opts.mode || 'keep',
                edge_feather: opts.feather != null ? opts.feather : 2
            })
        });
        if (!res.ok) return null;
        return await res.json();
    }
}
