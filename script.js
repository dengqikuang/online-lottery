document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const fileUpload = document.getElementById('fileUpload');
    const fileInfo = document.getElementById('fileInfo');
    const winnerCount = document.getElementById('winnerCount');
    const drawBtn = document.getElementById('drawBtn');
    const reuploadBtn = document.getElementById('reuploadBtn');
    const resultSection = document.getElementById('resultSection');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const historyList = document.getElementById('historyList');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // 设置文件大小限制和超时时间
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const TIMEOUT = 10000; // 10秒

    // 存储参与者和已中奖者
    let participants = [];
    let winners = [];
    let drawHistory = [];

    // 监听文件上传
    fileUpload.addEventListener('change', handleFileUpload);

    // 监听抽奖按钮
    drawBtn.addEventListener('click', drawWinners);

    // 监听重新上传文件按钮
    reuploadBtn.addEventListener('click', function() {
        console.log('重新上传文件按钮被点击');
        // 触发文件上传控件点击
        fileUpload.click();
    });
    
    // 确保重新上传文件按钮可点击
    console.log('页面加载完成，重新上传文件按钮状态:', reuploadBtn.disabled);

    // 处理文件上传
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
            alert('文件大小超过限制（最大5MB）');
            fileUpload.value = '';
            return;
        }

        // 显示文件信息
        fileInfo.textContent = `已选择文件: ${file.name}`;

        // 如果已经有中奖记录，提示用户确认是否清空
        if (drawHistory.length > 0) {
            if (!confirm('此操作会清空已生成的中奖记录，是否继续？')) {
                // 用户取消操作，重置文件输入
                fileUpload.value = '';
                return;
            }
            
            // 用户确认后清空中奖记录并重置页面状态
            participants = [];
            winners = [];
            drawHistory = [];
            winnerDisplay.innerHTML = '';
            historyList.innerHTML = '';
            resultSection.classList.add('d-none');
            drawBtn.disabled = true;
            reuploadBtn.disabled = true;
        }

        // 显示加载动画
        loadingOverlay.classList.remove('d-none');

        // 使用Promise和超时处理文件读取
        const processFileWithTimeout = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('文件处理超时'));
            }, TIMEOUT);

            try {
                // 根据文件大小选择处理方式
                if (file.size > 1 * 1024 * 1024) { // 大于1MB的文件使用延迟处理
                    // 使用分块处理大文件
                    processLargeFile(file).then(result => {
                        clearTimeout(timeoutId);
                        resolve(result);
                    }).catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
                } else {
                    // 小文件直接处理
                    processSmallFile(file).then(result => {
                        clearTimeout(timeoutId);
                        resolve(result);
                    }).catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
                }
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });

        // 处理文件并更新UI
        processFileWithTimeout.then(() => {
            // 启用抽奖按钮
            drawBtn.disabled = false;
            reuploadBtn.disabled = false;
            
            // 隐藏加载动画
            loadingOverlay.classList.add('d-none');
        }).catch(error => {
            console.error('文件处理错误:', error);
            fileInfo.textContent = '文件处理错误，请检查文件格式或尝试使用更小的文件';
            fileInfo.style.color = 'red';
            loadingOverlay.classList.add('d-none');
            fileUpload.value = '';
        });
    }

    // 处理小文件
    function processSmallFile(file) {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            
            fileReader.onload = function(event) {
                try {
                    if (file.name.endsWith('.csv')) {
                        // 处理CSV文件
                        const csvData = event.target.result;
                        processCSV(csvData);
                        resolve();
                    } else if (file.name.endsWith('.xlsx')) {
                        // 处理Excel文件
                        const data = new Uint8Array(event.target.result);
                        processExcel(data);
                        resolve();
                    } else {
                        reject(new Error('不支持的文件格式'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            fileReader.onerror = function() {
                reject(new Error('文件读取错误'));
            };

            if (file.name.endsWith('.csv')) {
                fileReader.readAsText(file);
            } else if (file.name.endsWith('.xlsx')) {
                fileReader.readAsArrayBuffer(file);
            } else {
                reject(new Error('不支持的文件格式'));
            }
        });
    }

    // 处理大文件 - 使用延迟处理避免UI阻塞
    function processLargeFile(file) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                processSmallFile(file).then(resolve).catch(reject);
            }, 100); // 短暂延迟以避免UI阻塞
        });
    }

    // 处理CSV文件
    function processCSV(csvData) {
        // 简单的CSV解析，按行分割，第一行假设为标题
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        // 查找姓名列的索引（假设有一列包含'姓名'或'名字'或'name'）
        let nameIndex = headers.findIndex(header => 
            header.includes('姓名') || 
            header.includes('名字') || 
            header.toLowerCase().includes('name'));
        
        // 如果找不到姓名列，默认使用第一列
        if (nameIndex === -1) nameIndex = 0;
        
        // 从第二行开始解析数据（跳过标题行）
        participants = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue; // 跳过空行
            
            const values = lines[i].split(',');
            if (values[nameIndex] && values[nameIndex].trim()) {
                participants.push(values[nameIndex].trim());
            }
        }
        
        updateParticipantInfo();
    }

    // 处理Excel文件
    function processExcel(data) {
        // 检查XLSX库是否已加载
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX库尚未加载，请刷新页面重试');
        }
        
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
        
        // 查找姓名列的索引
        const headers = jsonData[0];
        let nameIndex = headers.findIndex(header => 
            header && (header.includes('姓名') || 
            header.includes('名字') || 
            (typeof header === 'string' && header.toLowerCase().includes('name'))));
        
        // 如果找不到姓名列，默认使用第一列
        if (nameIndex === -1) nameIndex = 0;
        
        // 从第二行开始解析数据（跳过标题行）
        participants = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row[nameIndex] && String(row[nameIndex]).trim()) {
                participants.push(String(row[nameIndex]).trim());
            }
        }
        
        updateParticipantInfo();
    }

    // 更新参与者信息
    function updateParticipantInfo() {
        // 去重
        participants = [...new Set(participants)];
        fileInfo.textContent = `共有 ${participants.length} 名参与者`;
        fileInfo.style.color = '';
    }

    // 抽取中奖者
    function drawWinners() {
        // 获取中奖人数
        const count = parseInt(winnerCount.value);
        if (isNaN(count) || count < 1) {
            alert('请输入有效的数据提取数量');
            return;
        }

        // 检查是否有足够的参与者
        const availableParticipants = participants.filter(p => !winners.includes(p));
        if (availableParticipants.length < count) {
            alert(`可用数据不足！仅剩 ${availableParticipants.length} 条未提取数据`);
            
            // 显示结果区域并添加提示信息
            resultSection.classList.remove('d-none');
            winnerDisplay.innerHTML = '';
            
            const noWinnerMsg = document.createElement('div');
            noWinnerMsg.className = 'alert alert-warning text-center';
            noWinnerMsg.innerHTML = `<strong>可用数据不足！</strong><br>需要 ${count} 条，但仅剩 ${availableParticipants.length} 条未提取数据`;
            winnerDisplay.appendChild(noWinnerMsg);
            
            // 如果所有参与者都已中奖，禁用抽奖按钮
            if (availableParticipants.length === 0) {
                drawBtn.disabled = true;
            }
            
            return;
        }

        // 显示加载动画
        loadingOverlay.classList.remove('d-none');

        // 创建强化版随机选择动画
        const drawingAnimation = async () => {
            // 预选多次以增加动画效果
            const preSelectionCount = 15; // 预选次数
            const preSelectionDelay = 80; // 每次预选的延迟时间(ms)
            const finalDelay = 300; // 最终结果前的延迟
            
            const fakeDisplay = document.createElement('div');
            fakeDisplay.className = 'winner-display';
            fakeDisplay.style.position = 'fixed';
            fakeDisplay.style.top = '50%';
            fakeDisplay.style.left = '50%';
            fakeDisplay.style.transform = 'translate(-50%, -50%)';
            fakeDisplay.style.zIndex = '9998';
            document.body.appendChild(fakeDisplay);
            
            // 创建音效
            const createBeepSound = (frequency = 440, duration = 100, volume = 0.1) => {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    
                    gainNode.gain.value = volume;
                    oscillator.frequency.value = frequency;
                    oscillator.type = 'sine';
                    
                    oscillator.start();
                    
                    setTimeout(() => {
                        oscillator.stop();
                    }, duration);
                } catch (e) {
                    console.log('音效播放失败', e);
                }
            };
            
            // 随机选择函数
            const getRandomParticipants = (count, exclude = []) => {
                const availableForSelection = availableParticipants.filter(p => !exclude.includes(p));
                const selected = [];
                
                for (let i = 0; i < count; i++) {
                    if (availableForSelection.length === 0) break;
                    const randomIndex = Math.floor(Math.random() * availableForSelection.length);
                    selected.push(availableForSelection[randomIndex]);
                    availableForSelection.splice(randomIndex, 1);
                }
                
                return selected;
            };
            
            // 预选动画
            for (let i = 0; i < preSelectionCount; i++) {
                const fakeWinners = getRandomParticipants(count);
                
                fakeDisplay.innerHTML = '';
                fakeWinners.forEach(winner => {
                    const winnerCard = document.createElement('div');
                    winnerCard.className = 'winner-card cyber-flicker';
                    winnerCard.textContent = winner;
                    fakeDisplay.appendChild(winnerCard);
                    
                    // 添加随机抖动效果
                    const randomShift = () => Math.random() * 4 - 2; // -2 到 2 像素
                    winnerCard.style.transform = `translate(${randomShift()}px, ${randomShift()}px)`;
                });
                
                // 音效，频率逐渐升高
                const freq = 440 + (i * 40);
                createBeepSound(freq, 50, 0.05);
                
                // 等待下一次预选
                await new Promise(resolve => setTimeout(resolve, preSelectionDelay));
            }
            
            // 移除临时显示
            document.body.removeChild(fakeDisplay);
            
            // 最终选择
            const newWinners = [];
            const tempParticipants = [...availableParticipants];

            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * tempParticipants.length);
                newWinners.push(tempParticipants[randomIndex]);
                tempParticipants.splice(randomIndex, 1);
            }
            
            // 更大的成功音效
            createBeepSound(880, 150, 0.1);
            setTimeout(() => createBeepSound(1200, 200, 0.1), 150);
            
            // 更新中奖者列表
            winners = [...winners, ...newWinners];

            // 添加到历史记录
            const timestamp = new Date().toLocaleString();
            drawHistory.push({
                timestamp: timestamp,
                winners: [...newWinners]
            });

            // 显示结果
            setTimeout(() => {
                displayWinners(newWinners);
                updateHistory();
                createConfetti();
                
                // 显示结果区域
                resultSection.classList.remove('d-none');
                
                // 隐藏加载动画
                loadingOverlay.classList.add('d-none');
                
                // 触发自定义事件，通知弹窗显示
                setTimeout(() => {
                    const event = new CustomEvent('winnersDrawn', {
                        detail: {
                            winners: newWinners
                        }
                    });
                    document.dispatchEvent(event);
                }, 500); // 给显示动画一点时间
                
            }, finalDelay);
        };
        
        // 执行抽奖动画
        drawingAnimation();
    }

    // 显示中奖者 - 强化动画效果
    function displayWinners(newWinners) {
        winnerDisplay.innerHTML = '';
        
        // 添加容器以实现3D效果
        const container3D = document.createElement('div');
        container3D.className = 'winner-container-3d';
        container3D.style.perspective = '1000px';
        container3D.style.width = '100%';
        container3D.style.display = 'flex';
        container3D.style.flexWrap = 'wrap';
        container3D.style.justifyContent = 'center';
        container3D.style.gap = '20px';
        
        winnerDisplay.appendChild(container3D);
        
        newWinners.forEach((winner, index) => {
            const winnerCard = document.createElement('div');
            winnerCard.className = 'winner-card animate-winner';
            winnerCard.textContent = winner;
            
            // 添加额外的动画效果
            winnerCard.style.animationDelay = `${index * 0.2}s`;
            
            // 添加点击效果
            winnerCard.addEventListener('click', function() {
                this.classList.add('animate__animated', 'animate__pulse');
                setTimeout(() => {
                    this.classList.remove('animate__animated', 'animate__pulse');
                }, 1000);
            });
            
            container3D.appendChild(winnerCard);
        });
    }
    
    // 更新历史记录
    function updateHistory() {
        historyList.innerHTML = '';
        
        // 限制显示最近的10条记录以提高性能
        const recentHistory = drawHistory.slice(-10);
        
        recentHistory.forEach((record, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            
            // 添加编号
            const numberSpan = document.createElement('span');
            numberSpan.className = 'cyber-number me-2';
            numberSpan.textContent = `#${drawHistory.length - index}`;
            numberSpan.style.color = 'var(--neon-primary)';
            numberSpan.style.fontWeight = 'bold';
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'text-secondary small ms-2';
            timeSpan.textContent = record.timestamp;
            
            const winnerSpan = document.createElement('div');
            winnerSpan.className = 'mt-1';
            winnerSpan.textContent = record.winners.join('、');
            winnerSpan.style.color = 'var(--text-primary)';
            
            listItem.appendChild(numberSpan);
            listItem.appendChild(timeSpan);
            listItem.appendChild(winnerSpan);
            historyList.appendChild(listItem);
        });
    }

    // 增强彩花效果
    function createConfetti() {
        try {
            if (typeof ConfettiGenerator === 'undefined') {
                console.warn('彩花效果库未加载');
                return;
            }
            
            const canvasId = 'confetti-canvas';
            
            // 清除旧的canvas
            let oldCanvas = document.getElementById(canvasId);
            if (oldCanvas) {
                oldCanvas.remove();
            }
            
            // 创建新的canvas
            const canvas = document.createElement('canvas');
            canvas.id = canvasId;
            document.body.appendChild(canvas);
            
            // 赛博风格彩花配置
            const confettiSettings = {
                target: canvasId,
                max: 120, // 增加粒子数量
                size: 1.8,
                animate: true,
                props: ['circle', 'square', 'triangle', 'line'],
                colors: [
                    [254, 0, 254],    // 霓虹粉
                    [0, 254, 254],    // 霓虹青
                    [0, 100, 255],    // 蓝色
                    [255, 255, 0],    // 黄色
                    [255, 0, 128]     // 品红
                ],
                clock: 25, // 加快动画速度
                start_from_edge: true,
                respawn: true
            };
            
            const confetti = new ConfettiGenerator(confettiSettings);
            confetti.render();
            
            // 延长彩花持续时间
            setTimeout(() => {
                confetti.clear();
                canvas.remove();
            }, 5000); // 5秒后移除彩花效果
        } catch (error) {
            console.error('彩花效果创建失败:', error);
        }
    }
    
    // 预加载关键资源
    function preloadResources() {
        if (document.readyState === 'complete') {
            return; // 页面已完全加载
        }
        
        const scripts = [
            'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
            'https://cdn.jsdelivr.net/npm/confetti-js@0.0.18/dist/index.min.js'
        ];
        
        scripts.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = 'script';
            document.head.appendChild(link);
        });
    }
    
    // 启动预加载
    preloadResources();
});