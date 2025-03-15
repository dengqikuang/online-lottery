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

        // 根据文件类型处理
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            try {
                if (file.name.endsWith('.csv')) {
                    // 处理CSV文件
                    const csvData = event.target.result;
                    processCSV(csvData);
                } else if (file.name.endsWith('.xlsx')) {
                    // 处理Excel文件
                    const data = new Uint8Array(event.target.result);
                    processExcel(data);
                }

                // 启用抽奖按钮
                drawBtn.disabled = false;
                reuploadBtn.disabled = false;

                // 隐藏加载动画
                loadingOverlay.classList.add('d-none');
            } catch (error) {
                console.error('文件处理错误:', error);
                fileInfo.textContent = '文件处理错误，请检查文件格式';
                fileInfo.style.color = 'red';
                loadingOverlay.classList.add('d-none');
            }
        };

        fileReader.onerror = function() {
            fileInfo.textContent = '文件读取错误';
            fileInfo.style.color = 'red';
            loadingOverlay.classList.add('d-none');
        };

        if (file.name.endsWith('.csv')) {
            fileReader.readAsText(file);
        } else if (file.name.endsWith('.xlsx')) {
            fileReader.readAsArrayBuffer(file);
        }
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
            alert('请输入有效的中奖人数');
            return;
        }

        // 检查是否有足够的参与者
        const availableParticipants = participants.filter(p => !winners.includes(p));
        if (availableParticipants.length < count) {
            alert(`参与者不足！仅剩 ${availableParticipants.length} 名未中奖参与者`);
            
            // 显示结果区域并添加提示信息
            resultSection.classList.remove('d-none');
            winnerDisplay.innerHTML = '';
            
            const noWinnerMsg = document.createElement('div');
            noWinnerMsg.className = 'alert alert-warning text-center';
            noWinnerMsg.innerHTML = `<strong>可中奖人数不足！</strong><br>需要 ${count} 人，但仅剩 ${availableParticipants.length} 名未中奖参与者`;
            winnerDisplay.appendChild(noWinnerMsg);
            
            // 如果所有参与者都已中奖，禁用抽奖按钮
            if (availableParticipants.length === 0) {
                drawBtn.disabled = true;
            }
            
            return;
        }

        // 显示加载动画
        loadingOverlay.classList.remove('d-none');

        // 模拟抽奖过程（延迟以增加期待感）
        setTimeout(() => {
            // 随机抽取中奖者
            const newWinners = [];
            const tempParticipants = [...availableParticipants];

            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * tempParticipants.length);
                newWinners.push(tempParticipants[randomIndex]);
                tempParticipants.splice(randomIndex, 1);
            }

            // 更新中奖者列表
            winners = [...winners, ...newWinners];

            // 添加到历史记录
            const timestamp = new Date().toLocaleString();
            drawHistory.push({
                timestamp: timestamp,
                winners: [...newWinners]
            });

            // 显示结果
            displayWinners(newWinners);
            updateHistory();

            // 隐藏加载动画
            loadingOverlay.classList.add('d-none');

            // 显示结果区域
            resultSection.classList.remove('d-none');

            // 创建彩花效果
            createConfetti();
        }, 1500);
    }

    // 显示中奖者
    function displayWinners(newWinners) {
        winnerDisplay.innerHTML = '';
        newWinners.forEach(winner => {
            const winnerCard = document.createElement('div');
            winnerCard.className = 'winner-card animate__animated animate__bounceIn';
            winnerCard.textContent = winner;
            winnerDisplay.appendChild(winnerCard);
        });
    }

    // 更新历史记录
    function updateHistory() {
        historyList.innerHTML = '';
        drawHistory.forEach((record, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            
            // 格式化时间戳显示
            const formattedTime = record.timestamp.split(' ')[1] || record.timestamp;
            
            // 创建更美观的历史记录项
            listItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <span class="badge bg-primary rounded-pill me-2">${index + 1}</span>
                        <strong>第${index + 1}次抽奖</strong>
                    </div>
                    <small class="text-muted"><i class="bi bi-clock"></i> ${formattedTime}</small>
                </div>
                <div class="mt-1 ps-4">${record.winners.join(', ')}</div>
            `;
            
            historyList.prepend(listItem);
        });
    }



    // 创建彩花效果
    function createConfetti() {
        const confettiSettings = { target: 'confetti-canvas' };
        const confetti = new ConfettiGenerator(confettiSettings);
        
        // 创建canvas元素
        let canvas = document.getElementById('confetti-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'confetti-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1000';
            canvas.style.pointerEvents = 'none';
            document.body.appendChild(canvas);
        }
        
        confetti.render();
        
        // 3秒后移除彩花
        setTimeout(() => {
            confetti.clear();
            canvas.remove();
        }, 3000);
    }
});