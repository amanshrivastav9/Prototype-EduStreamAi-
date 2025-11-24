// camera-widget.js - Modular Camera Widget
class CameraWidget {
    constructor() {
        this.isInitialized = false;
        this.stream = null;
        this.cameraActive = false;
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        
        // Finger gesture detection
        this.fingerCount = 0;
        this.gestureTimer = null;
        this.gestureCount = 0;
        this.gestureThreshold = 5; // 5 fingers to trigger
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.createWidget();
        this.attachEventListeners();
        this.isInitialized = true;
        
        console.log('Camera Widget initialized');
    }

    createWidget() {
        // Create widget HTML structure
        const widgetHTML = `
        <div class="gesture-camera-widget">
            <button class="camera-toggle" id="cameraToggle">
                <i class="fas fa-camera"></i>
            </button>
            
            <div class="camera-container" id="cameraContainer">
                <div class="camera-header" id="cameraHeader">
                    <div class="camera-title">
                        <i class="fas fa-video"></i>
                        Live Camera
                    </div>
                    <div class="camera-controls">
                        <button class="control-btn" id="minimizeBtn">
                            <i class="fas fa-window-minimize"></i>
                        </button>
                        <button class="control-btn" id="closeBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="camera-feed">
                    <video id="liveCamera" autoplay playsinline></video>
                    <canvas id="gestureCanvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;"></canvas>
                    
                    <div class="permission-request" id="permissionRequest">
                        <i class="fas fa-camera"></i>
                        <p>Camera access is required for live feed</p>
                        <button class="permission-btn" id="requestPermission">
                            Allow Camera Access
                        </button>
                    </div>
                    
                    <div class="camera-loading" id="cameraLoading">
                        <div class="loading-spinner"></div>
                        <p>Starting camera...</p>
                    </div>
                    
                    <div class="camera-placeholder" id="cameraPlaceholder">
                        <i class="fas fa-camera"></i>
                        <p>Camera is off</p>
                    </div>

                    <div class="gesture-indicator-display" id="gestureIndicator" style="display: none;">
                        <div class="gesture-count">Fingers: <span id="fingerCount">0</span></div>
                        <div class="gesture-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill"></div>
                            </div>
                            <div class="gesture-text">Show 5 fingers to open Google.com</div>
                        </div>
                    </div>
                </div>
                
                <div class="camera-footer">
                    <div class="gesture-indicator">
                        <div class="gesture-dot"></div>
                        Gesture controls enabled
                    </div>
                    <div>Drag to move</div>
                </div>
            </div>
        </div>
        `;

        // Inject styles
        this.injectStyles();

        // Add widget to page
        const widgetContainer = document.createElement('div');
        widgetContainer.innerHTML = widgetHTML;
        document.body.appendChild(widgetContainer);

        // Store references to elements
        this.elements = {
            cameraToggle: document.getElementById('cameraToggle'),
            cameraContainer: document.getElementById('cameraContainer'),
            cameraHeader: document.getElementById('cameraHeader'),
            minimizeBtn: document.getElementById('minimizeBtn'),
            closeBtn: document.getElementById('closeBtn'),
            liveCamera: document.getElementById('liveCamera'),
            permissionRequest: document.getElementById('permissionRequest'),
            cameraLoading: document.getElementById('cameraLoading'),
            cameraPlaceholder: document.getElementById('cameraPlaceholder'),
            requestPermission: document.getElementById('requestPermission'),
            gestureCanvas: document.getElementById('gestureCanvas'),
            gestureIndicator: document.getElementById('gestureIndicator'),
            fingerCount: document.getElementById('fingerCount'),
            progressFill: document.getElementById('progressFill')
        };
    }

    injectStyles() {
        const styles = `
        <style>
            .gesture-camera-widget {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 10000;
            }

            .camera-toggle {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff416c, #ff4b2b);
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 28px;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                z-index: 10001;
                border: none;
                outline: none;
            }

            .camera-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
            }

            .camera-toggle.active {
                background: linear-gradient(135deg, #36d1dc, #5b86e5);
            }

            .camera-container {
                position: absolute;
                bottom: 90px;
                right: 0;
                width: 320px;
                height: 240px;
                background: rgba(0, 0, 0, 0.9);
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                display: none;
                flex-direction: column;
                z-index: 10000;
                transition: all 0.3s ease;
                border: 2px solid rgba(255, 255, 255, 0.2);
            }

            .camera-container.active {
                display: flex;
            }

            .camera-header {
                background: rgba(0, 0, 0, 0.7);
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
                cursor: move;
                user-select: none;
            }

            .camera-title {
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .camera-controls {
                display: flex;
                gap: 10px;
            }

            .control-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .control-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #36d1dc;
            }

            .camera-feed {
                flex: 1;
                background: #111;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                overflow: hidden;
            }

            #liveCamera {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: none;
                transform: scaleX(-1); /* Mirror effect */
            }

            .camera-placeholder {
                color: rgba(255, 255, 255, 0.5);
                text-align: center;
                padding: 20px;
            }

            .camera-placeholder i {
                font-size: 50px;
                margin-bottom: 15px;
                display: block;
            }

            .permission-request {
                text-align: center;
                padding: 20px;
                color: white;
            }

            .permission-btn {
                background: linear-gradient(135deg, #36d1dc, #5b86e5);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                margin-top: 15px;
                font-weight: 600;
                transition: all 0.3s;
            }

            .permission-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(54, 209, 220, 0.4);
            }

            .camera-loading {
                display: none;
                text-align: center;
                color: white;
                padding: 20px;
            }

            .loading-spinner {
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 3px solid #36d1dc;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            .camera-footer {
                background: rgba(0, 0, 0, 0.7);
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
                font-size: 12px;
            }

            .gesture-indicator {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .gesture-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #36d1dc;
                animation: pulse 1.5s infinite;
            }

            .gesture-indicator-display {
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                padding: 10px;
                border-radius: 8px;
                color: white;
                font-size: 12px;
            }

            .gesture-count {
                margin-bottom: 8px;
                font-weight: bold;
            }

            .progress-bar {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 5px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #36d1dc, #5b86e5);
                width: 0%;
                transition: width 0.3s;
            }

            .gesture-text {
                text-align: center;
                font-size: 10px;
                opacity: 0.8;
            }

            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @media (max-width: 768px) {
                .camera-container {
                    width: 280px;
                    height: 210px;
                }
                
                .gesture-camera-widget {
                    bottom: 20px;
                    right: 20px;
                }
            }

            @media (max-width: 480px) {
                .camera-container {
                    width: 250px;
                    height: 190px;
                    right: -20px;
                }
            }
        </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    attachEventListeners() {
        const { cameraToggle, cameraHeader, minimizeBtn, closeBtn, requestPermission, liveCamera } = this.elements;

        // Toggle camera visibility
        cameraToggle.addEventListener('click', () => this.toggleCamera());

        // Close camera
        closeBtn.addEventListener('click', () => this.closeCamera());

        // Minimize camera
        minimizeBtn.addEventListener('click', () => this.minimizeCamera());

        // Request camera permission
        requestPermission.addEventListener('click', () => this.startCamera());

        // Dragging functionality
        cameraHeader.addEventListener('mousedown', (e) => this.dragStart(e));
        cameraHeader.addEventListener('touchstart', (e) => this.dragStart(e));

        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('touchmove', (e) => this.drag(e));

        document.addEventListener('mouseup', () => this.dragEnd());
        document.addEventListener('touchend', () => this.dragEnd());

        // Camera stream event for gesture detection
        liveCamera.addEventListener('loadeddata', () => {
            this.startGestureDetection();
        });
    }

    toggleCamera() {
        const { cameraToggle, cameraContainer } = this.elements;
        
        cameraContainer.classList.toggle('active');
        cameraToggle.classList.toggle('active');
        
        if (cameraContainer.classList.contains('active')) {
            cameraToggle.innerHTML = '<i class="fas fa-times"></i>';
            if (!this.cameraActive) {
                this.showPermissionRequest();
            }
        } else {
            cameraToggle.innerHTML = '<i class="fas fa-camera"></i>';
            this.stopCamera();
        }
    }

    closeCamera() {
        const { cameraToggle, cameraContainer } = this.elements;
        
        cameraContainer.classList.remove('active');
        cameraToggle.classList.remove('active');
        cameraToggle.innerHTML = '<i class="fas fa-camera"></i>';
        this.stopCamera();
    }

    minimizeCamera() {
        const { cameraContainer, minimizeBtn } = this.elements;
        
        cameraContainer.classList.toggle('minimized');
        if (cameraContainer.classList.contains('minimized')) {
            cameraContainer.style.height = '50px';
            minimizeBtn.innerHTML = '<i class="fas fa-window-restore"></i>';
        } else {
            cameraContainer.style.height = '240px';
            minimizeBtn.innerHTML = '<i class="fas fa-window-minimize"></i>';
        }
    }

    async startCamera() {
        const { permissionRequest, cameraPlaceholder, cameraLoading, liveCamera } = this.elements;

        // Show loading
        permissionRequest.style.display = 'none';
        cameraPlaceholder.style.display = 'none';
        cameraLoading.style.display = 'block';

        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false 
            });

            // Set stream to video element
            liveCamera.srcObject = this.stream;
            liveCamera.style.display = 'block';
            cameraLoading.style.display = 'none';
            this.cameraActive = true;

            // Hide permission request and placeholder
            permissionRequest.style.display = 'none';
            cameraPlaceholder.style.display = 'none';

        } catch (error) {
            console.error('Error accessing camera:', error);
            cameraLoading.style.display = 'none';

            // Show error message
            permissionRequest.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 40px; margin-bottom: 15px; color: #ff4b2b;"></i>
                <p>Camera access denied or not available</p>
                <button class="permission-btn" id="requestPermission">
                    Try Again
                </button>
            `;
            permissionRequest.style.display = 'block';

            // Re-attach event listener to new button
            document.getElementById('requestPermission').addEventListener('click', () => this.startCamera());
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        const { liveCamera, cameraPlaceholder, permissionRequest, cameraLoading, gestureIndicator } = this.elements;
        
        liveCamera.style.display = 'none';
        this.cameraActive = false;
        gestureIndicator.style.display = 'none';

        // Show placeholder
        cameraPlaceholder.style.display = 'block';
        permissionRequest.style.display = 'none';
        cameraLoading.style.display = 'none';

        // Stop gesture detection
        this.stopGestureDetection();
    }

    showPermissionRequest() {
        const { cameraPlaceholder, cameraLoading, permissionRequest } = this.elements;
        
        cameraPlaceholder.style.display = 'none';
        cameraLoading.style.display = 'none';
        permissionRequest.style.display = 'block';
    }

    // Dragging methods
    dragStart(e) {
        if (e.type === 'touchstart') {
            this.initialX = e.touches[0].clientX - this.xOffset;
            this.initialY = e.touches[0].clientY - this.yOffset;
        } else {
            this.initialX = e.clientX - this.xOffset;
            this.initialY = e.clientY - this.yOffset;
        }

        if (e.target === this.elements.cameraHeader || e.target.closest('.camera-header')) {
            this.isDragging = true;
        }
    }

    drag(e) {
        if (this.isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                this.currentX = e.touches[0].clientX - this.initialX;
                this.currentY = e.touches[0].clientY - this.initialY;
            } else {
                this.currentX = e.clientX - this.initialX;
                this.currentY = e.clientY - this.initialY;
            }

            this.xOffset = this.currentX;
            this.yOffset = this.currentY;

            this.setTranslate(this.currentX, this.currentY, this.elements.cameraContainer);
        }
    }

    dragEnd() {
        this.initialX = this.currentX;
        this.initialY = this.currentY;
        this.isDragging = false;
    }

    setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // Gesture Detection Methods (Simplified version)
    startGestureDetection() {
        this.elements.gestureIndicator.style.display = 'block';
        
        // Simulate finger detection (in real implementation, you'd use TensorFlow.js or similar)
        this.simulateFingerDetection();
    }

    stopGestureDetection() {
        if (this.gestureTimer) {
            clearInterval(this.gestureTimer);
            this.gestureTimer = null;
        }
        this.fingerCount = 0;
        this.gestureCount = 0;
    }

    simulateFingerDetection() {
        // This is a simplified simulation
        // In a real implementation, you would use computer vision libraries
        
        this.gestureTimer = setInterval(() => {
            // Simulate random finger count between 0-5
            this.fingerCount = Math.floor(Math.random() * 6);
            
            this.elements.fingerCount.textContent = this.fingerCount;
            
            // Update progress bar
            const progress = (this.fingerCount / this.gestureThreshold) * 100;
            this.elements.progressFill.style.width = `${progress}%`;
            
            // Check if 5 fingers are shown
            if (this.fingerCount >= this.gestureThreshold) {
                this.gestureCount++;
                
                if (this.gestureCount >= 3) { // Require 3 consecutive detections
                    this.triggerGoogleOpen();
                    this.gestureCount = 0;
                }
            } else {
                this.gestureCount = 0;
            }
        }, 500);
    }

    triggerGoogleOpen() {
        // Open Google.com in a new tab
        window.open('https://www.google.com', '_blank');
        
        // Show success message
        const originalText = this.elements.gestureIndicator.querySelector('.gesture-text').textContent;
        this.elements.gestureIndicator.querySelector('.gesture-text').textContent = 'Opening Google.com...';
        this.elements.gestureIndicator.querySelector('.gesture-text').style.color = '#36d1dc';
        
        setTimeout(() => {
            this.elements.gestureIndicator.querySelector('.gesture-text').textContent = originalText;
            this.elements.gestureIndicator.querySelector('.gesture-text').style.color = '';
        }, 2000);
    }

    // Public method to destroy widget
    destroy() {
        this.stopCamera();
        const widget = document.querySelector('.gesture-camera-widget');
        if (widget) {
            widget.remove();
        }
        this.isInitialized = false;
    }
}

// Initialize widget when script loads
let cameraWidget;

function initCameraWidget() {
    if (!cameraWidget) {
        cameraWidget = new CameraWidget();
    }
    return cameraWidget;
}

// Auto-initialize if script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCameraWidget);
} else {
    initCameraWidget();
}