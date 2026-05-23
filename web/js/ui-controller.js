/**
 * UI 控制器：Toast 通知、标签页、工具切换、反馈表单
 */
class UIController {
    constructor(toastContainer) {
        this.toastContainer = toastContainer;
    }

    // ── Toast ────────────────────────────────

    showToast(message, type = 'info') {
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ── 标签页 ────────────────────────────────

    switchTab(tab, tabBtns, autoTab, manualTab) {
        tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
        autoTab.classList.toggle('hidden', tab !== 'auto');
        autoTab.classList.toggle('active', tab === 'auto');
        manualTab.classList.toggle('hidden', tab !== 'manual');
        manualTab.classList.toggle('active', tab === 'manual');
    }

    switchTool(tool, markBtn, eraserBtn) {
        markBtn.classList.toggle('active', tool === 'mark');
        eraserBtn.classList.toggle('active', tool === 'eraser');
    }

    selectRegion(region) {
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.region === region);
        });
    }

    // ── 反馈表单 ────────────────────────────────

    showFeedbackSuccess(formWrapper, successEl) {
        formWrapper.classList.add('hidden');
        successEl.classList.remove('hidden');
    }

    resetFeedbackForm(form, formWrapper, successEl) {
        form.reset();
        successEl.classList.add('hidden');
        formWrapper.classList.remove('hidden');
    }
}
