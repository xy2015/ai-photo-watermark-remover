/**
 * 页面路由：管理页面导航与显示/隐藏
 */
class Router {
    constructor(elements) {
        this.elements = elements;
    }

    hideAll() {
        const pages = ['landingPage', 'editorPage', 'feedbackPage', 'privacyPage'];
        pages.forEach(key => this.elements[key].classList.add('hidden'));
        this.elements.mainFooter.classList.add('hidden');
    }

    navigateTo(page) {
        this.hideAll();
        this.elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        switch (page) {
            case 'home':
                this.elements.landingPage.classList.remove('hidden');
                this.elements.mainFooter.classList.remove('hidden');
                break;
            case 'feedback':
                this.elements.feedbackPage.classList.remove('hidden');
                this.elements.mainFooter.classList.remove('hidden');
                break;
            case 'privacy':
                this.elements.privacyPage.classList.remove('hidden');
                this.elements.mainFooter.classList.remove('hidden');
                break;
        }
        window.scrollTo(0, 0);
    }

    showEditor() {
        this.hideAll();
        this.elements.editorPage.classList.remove('hidden');
    }
}
