// OS Detection and Dynamic Content
class OSDetector {
    constructor() {
        this.init();
    }

    init() {
        this.detectOS();
        this.updateUI();
        this.setupEventListeners();
    }

    detectOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();

        if (userAgent.includes('win') || platform.includes('win')) {
            this.os = 'windows';
            this.osName = 'Windows';
            this.osIcon = 'fab fa-windows';
        } else if (userAgent.includes('mac') || platform.includes('mac')) {
            this.os = 'macos';
            this.osName = 'macOS';
            this.osIcon = 'fab fa-apple';
        } else if (userAgent.includes('linux') || platform.includes('linux')) {
            this.os = 'linux';
            this.osName = 'Linux';
            this.osIcon = 'fab fa-linux';
        } else {
            // Default to Linux for unknown systems
            this.os = 'linux';
            this.osName = 'Linux';
            this.osIcon = 'fab fa-linux';
        }

        console.log(`Detected OS: ${this.osName}`);
    }

    getDownloadInfo() {
        const downloads = {
            windows: {
                fileName: 'bluelamp-windows-x64.exe',
                size: '~153MB',
                url: 'https://github.com/yamatovision/cli2/releases/download/v1.4.2/bluelamp-windows-x64.exe',
                installCommand: '# ダウンロード後、ダブルクリックで実行\n# または PowerShell/コマンドプロンプトで:\nbluelamp-windows-x64.exe',
                usageCommand: 'bluelamp-windows-x64.exe',
                extensionCommand: 'bluelamp-windows-x64.exe --extension'
            },
            macos: {
                fileName: 'bluelamp-macos-x64',
                size: '~141MB',
                url: 'https://github.com/yamatovision/cli2/releases/download/v1.4.2/bluelamp-macos-x64',
                installCommand: '# ダウンロード後、ターミナルで実行権限を付与:\nchmod +x bluelamp-macos-x64\n\n# 実行:\n./bluelamp-macos-x64',
                usageCommand: './bluelamp-macos-x64',
                extensionCommand: './bluelamp-macos-x64 --extension'
            },
            linux: {
                fileName: 'bluelamp-linux-x64',
                size: '~161MB',
                url: 'https://github.com/yamatovision/cli2/releases/download/v1.4.2/bluelamp-linux-x64',
                installCommand: '# ダウンロード後、ターミナルで実行権限を付与:\nchmod +x bluelamp-linux-x64\n\n# 実行:\n./bluelamp-linux-x64',
                usageCommand: './bluelamp-linux-x64',
                extensionCommand: './bluelamp-linux-x64 --extension'
            }
        };

        return downloads[this.os];
    }

    updateUI() {
        const downloadInfo = this.getDownloadInfo();

        // Update OS detection display
        const osText = document.getElementById('os-text');
        if (osText) {
            osText.innerHTML = `<i class="${this.osIcon}"></i> あなたのOS: <strong>${this.osName}</strong> が検出されました`;
        }

        // Update recommended download
        const recommendedFile = document.getElementById('recommended-file');
        const recommendedSize = document.getElementById('recommended-size');
        const primaryDownload = document.getElementById('primary-download');

        if (recommendedFile) recommendedFile.textContent = downloadInfo.fileName;
        if (recommendedSize) recommendedSize.textContent = downloadInfo.size;
        
        if (primaryDownload) {
            primaryDownload.disabled = false;
            primaryDownload.onclick = () => this.downloadFile(this.os);
        }

        // Update install instructions
        const installCode = document.getElementById('install-code');
        if (installCode) {
            installCode.textContent = downloadInfo.installCommand;
        }

        // Update usage commands
        const orchestratorCommand = document.getElementById('orchestrator-command');
        const extensionCommand = document.getElementById('extension-command');

        if (orchestratorCommand) orchestratorCommand.textContent = downloadInfo.usageCommand;
        if (extensionCommand) extensionCommand.textContent = downloadInfo.extensionCommand;

        // Highlight the detected OS in the grid
        this.highlightDetectedOS();
    }

    highlightDetectedOS() {
        const downloadItems = document.querySelectorAll('.download-item');
        downloadItems.forEach((item, index) => {
            const platforms = ['windows', 'macos', 'linux'];
            if (platforms[index] === this.os) {
                item.style.border = '2px solid #667eea';
                item.style.background = 'linear-gradient(135deg, #f8f9ff, #e6eaff)';
                
                // Add a "recommended" badge
                const badge = document.createElement('div');
                badge.innerHTML = '<i class="fas fa-star"></i> 推奨';
                badge.style.cssText = `
                    position: absolute;
                    top: -10px;
                    right: 15px;
                    background: #667eea;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 15px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                `;
                
                item.style.position = 'relative';
                item.appendChild(badge);
            }
        });
    }

    setupEventListeners() {
        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add download tracking
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Analytics tracking could be added here
                console.log('Download initiated:', e.target.textContent);
            });
        });
    }

    downloadFile(platform) {
        const downloads = {
            windows: 'https://github.com/yamatovision/cli2/releases/download/v1.4.2/bluelamp-windows-x64.exe',
            macos: 'https://github.com/yamatovision/cli2/releases/download/v1.4.2/bluelamp-macos-x64',
            linux: 'https://github.com/yamatovision/cli2/releases/download/v1.4.2/bluelamp-linux-x64'
        };

        const url = downloads[platform];
        if (url) {
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show download feedback
            this.showDownloadFeedback(platform);
        }
    }

    showDownloadFeedback(platform) {
        const downloadInfo = this.getDownloadInfo();
        
        // Create and show a toast notification
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 350px;
            ">
                <i class="fas fa-download"></i>
                <div>
                    <strong>ダウンロード開始</strong><br>
                    <small>${downloadInfo.fileName}</small>
                </div>
            </div>
        `;

        document.body.appendChild(toast);

        // Remove toast after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }
}

// Global download function for HTML onclick handlers
function downloadFile(platform) {
    if (window.osDetector) {
        window.osDetector.downloadFile(platform);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.osDetector = new OSDetector();
    
    // Add some nice loading animations
    const elements = document.querySelectorAll('.download-card, .download-item, .usage-card, .feature-item');
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add hover effects to code blocks
    document.querySelectorAll('.code-block').forEach(block => {
        block.addEventListener('click', () => {
            // Copy to clipboard functionality
            if (navigator.clipboard) {
                navigator.clipboard.writeText(block.textContent).then(() => {
                    // Show copy feedback
                    const originalText = block.innerHTML;
                    block.innerHTML = '<i class="fas fa-check"></i> コピーしました！';
                    block.style.background = 'rgba(40, 167, 69, 0.2)';
                    
                    setTimeout(() => {
                        block.innerHTML = originalText;
                        block.style.background = '';
                    }, 2000);
                });
            }
        });
        
        // Add copy hint
        block.style.cursor = 'pointer';
        block.title = 'クリックでコピー';
    });
});