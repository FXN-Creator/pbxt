// 生成人员表单
function generatePersonForms() {
    const count = parseInt(document.getElementById('person-count').value);
    const container = document.getElementById('person-forms');
    
    // 确保人数不超过最大人数限制
    if (count > schedulingRules.maxPeople) {
        document.getElementById('person-count').value = schedulingRules.maxPeople;
        return;
    }
    
    // 使用文档片段减少DOM操作
    const fragment = document.createDocumentFragment();
    
    for (let i = 1; i <= count; i++) {
        const personDiv = document.createElement('div');
        personDiv.className = 'person';
        personDiv.innerHTML = `
            <h3>人员 ${i}</h3>
            <label for="name-${i}">姓名：</label>
            <input type="text" id="name-${i}" placeholder="请输入姓名">
            <label>休息日（每个月${schedulingRules.restDaysPerPerson}天）：</label>
            <div class="rest-days" id="rest-days-${i}">
                ${generateRestDayInputs(i)}
                <button onclick="addRestDay(${i})" class="btn-small">+ 添加休息日</button>
            </div>
        `;
        fragment.appendChild(personDiv);
    }
    
    // 清空容器并添加新内容
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // 加载保存的数据
    loadSavedData();
}

// 检查使用次数并处理登录
function checkUsageLimit() {
    const usageCount = getUsageCount();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userType = localStorage.getItem('userType') || 'user';
    
    if (usageCount >= 3 && !isLoggedIn) {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('main-form').style.display = 'none';
    } else {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('main-form').style.display = 'block';
        // 根据用户类型更新UI
        updateUIBasedOnUserType(userType);
    }
}

// 获取使用次数
function getUsageCount() {
    const count = localStorage.getItem('usageCount');
    return count ? parseInt(count) : 0;
}

// 增加使用次数
function incrementUsageCount() {
    const currentCount = getUsageCount();
    localStorage.setItem('usageCount', currentCount + 1);
}

// 登录函数
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('user-type').value;
    
    // 验证输入
    if (!username || !password) {
        showErrorMessage('请输入账号和密码');
        return;
    }
    
    // 检查是否为管理员账户
    if (userType === 'admin' && username === 'hjy' && password === '010101') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userType', 'admin');
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('main-form').style.display = 'block';
        updateUIBasedOnUserType('admin');
        showSuccessMessage('登录成功！');
    }
    // 检查是否为普通账户
    else if (userType === 'user' && username === 'user' && password === '123456') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userType', 'user');
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('main-form').style.display = 'block';
        updateUIBasedOnUserType('user');
        showSuccessMessage('登录成功！');
    }
    else {
        showErrorMessage('账号或密码错误');
    }
}

// 根据用户类型更新UI
function updateUIBasedOnUserType(userType) {
    // 获取修改规则按钮
    const ruleButton = document.querySelector('button[onclick="toggleRuleForm()"]');
    
    if (userType === 'user') {
        // 普通用户只能修改排班规则，不能修改系统设置
        if (ruleButton) {
            ruleButton.style.display = 'inline-block';
        }
        // 隐藏管理员专用的设置项
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(element => {
            element.style.display = 'none';
        });
    } else {
        // 管理员可以访问所有功能
        if (ruleButton) {
            ruleButton.style.display = 'inline-block';
        }
        // 显示所有设置项
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(element => {
            element.style.display = 'block';
        });
    }
}

// 切换规则表单显示
function toggleRuleForm() {
    const ruleForm = document.getElementById('rule-form');
    if (ruleForm.style.display === 'none') {
        ruleForm.style.display = 'block';
        // 填充当前规则值
        document.getElementById('rest-days-per-person').value = schedulingRules.restDaysPerPerson;
        document.getElementById('max-people').value = schedulingRules.maxPeople;
        document.getElementById('shift-types').value = schedulingRules.shiftTypes;
        document.getElementById('max-morning-shift').value = schedulingRules.maxMorningShiftCount;
        document.getElementById('normal-night-shift').value = schedulingRules.normalNightShiftMinCount;
        document.getElementById('friday-saturday-night-shift').value = schedulingRules.fridaySaturdayNightShiftCount;
        document.getElementById('friday-saturday-no-rest').checked = schedulingRules.fridaySaturdayNoRest;
    } else {
        ruleForm.style.display = 'none';
    }
}

// 保存排班规则
function saveRules() {
    schedulingRules.restDaysPerPerson = parseInt(document.getElementById('rest-days-per-person').value);
    schedulingRules.maxPeople = parseInt(document.getElementById('max-people').value);
    schedulingRules.shiftTypes = parseInt(document.getElementById('shift-types').value);
    schedulingRules.maxMorningShiftCount = parseInt(document.getElementById('max-morning-shift').value);
    schedulingRules.normalNightShiftMinCount = parseInt(document.getElementById('normal-night-shift').value);
    schedulingRules.fridaySaturdayNightShiftCount = parseInt(document.getElementById('friday-saturday-night-shift').value);
    schedulingRules.fridaySaturdayNoRest = document.getElementById('friday-saturday-no-rest').checked;
    
    // 重新生成表单
    generatePersonForms();
    alert('规则已保存');
    toggleRuleForm();
}

// 分享排班表
function shareSchedule() {
    if (navigator.share) {
        navigator.share({
            title: '排班表',
            text: `${scheduleYear}年${scheduleMonth}月排班表`,
            url: window.location.href
        })
        .then(() => console.log('分享成功'))
        .catch((error) => console.error('分享失败:', error));
    } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href)
        .then(() => alert('链接已复制到剪贴板'))
        .catch(err => console.error('复制失败:', err));
    }
}

// 生成休息日输入框
function generateRestDayInputs(personIndex) {
    let html = '';
    for (let i = 0; i < schedulingRules.restDaysPerPerson; i++) {
        html += `
            <div class="rest-day">
                <input type="number" id="rest-day-${personIndex}-${i}" min="1" max="31" placeholder="日期" style="width: 60px;">
            </div>
        `;
    }
    return html;
}

// 添加休息日
function addRestDay(personIndex) {
    const restDaysContainer = document.getElementById(`rest-days-${personIndex}`);
    const restDays = restDaysContainer.querySelectorAll('.rest-day').length;
    
    if (restDays >= schedulingRules.restDaysPerPerson) {
        showErrorMessage(`每个月最多只能有${schedulingRules.restDaysPerPerson}个休息日`);
        return;
    }
    
    // 使用innerHTML添加，减少DOM操作
    const lastChild = restDaysContainer.lastElementChild;
    const newRestDay = `
        <div class="rest-day">
            <input type="number" min="1" max="31" placeholder="日期" style="width: 60px;">
            <button class="btn-remove" onclick="removeRestDay(this)">×</button>
        </div>
    `;
    
    // 保存最后一个子元素（添加按钮）
    const addButton = lastChild;
    // 移除添加按钮
    restDaysContainer.removeChild(addButton);
    // 添加新的休息日
    restDaysContainer.insertAdjacentHTML('beforeend', newRestDay);
    // 重新添加按钮
    restDaysContainer.appendChild(addButton);
}

// 移除休息日
function removeRestDay(button) {
    const restDayDiv = button.parentElement;
    restDayDiv.remove();
}

// 保存数据到localStorage
function saveData() {
    const data = {
        department: document.getElementById('department').value,
        personCount: document.getElementById('person-count').value,
        persons: []
    };
    
    const count = parseInt(document.getElementById('person-count').value);
    for (let i = 1; i <= count; i++) {
        const name = document.getElementById(`name-${i}`).value;
        const restDayInputs = document.querySelectorAll(`#rest-days-${i} input[type="number"]`);
        const restDays = Array.from(restDayInputs).map(input => input.value).filter(day => day);
        data.persons.push({ name, restDays });
    }
    
    localStorage.setItem('scheduleData', JSON.stringify(data));
}

// 从localStorage加载数据
function loadSavedData() {
    const savedData = localStorage.getItem('scheduleData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // 恢复部门名称
            if (data.department) {
                document.getElementById('department').value = data.department;
            }
            
            // 恢复人员信息
            if (data.persons && data.persons.length > 0) {
                document.getElementById('person-count').value = data.persons.length;
                
                data.persons.forEach((person, index) => {
                    const personIndex = index + 1;
                    const nameInput = document.getElementById(`name-${personIndex}`);
                    if (nameInput && person.name) {
                        nameInput.value = person.name;
                    }
                    
                    if (person.restDays) {
                        person.restDays.forEach((day, dayIndex) => {
                            const dayInput = document.getElementById(`rest-day-${personIndex}-${dayIndex}`);
                            if (dayInput && day) {
                                dayInput.value = day;
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.error('加载保存的数据失败:', e);
        }
    }
}

// 清除保存的数据
function clearSavedData() {
    localStorage.removeItem('scheduleData');
    localStorage.removeItem('usageCount');
    localStorage.removeItem('isLoggedIn');
    alert('已清除所有保存的数据');
}

// 获取下一个月的信息
function getNextMonthInfo() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const year = nextMonth.getFullYear();
    const month = nextMonth.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    return { year, month, daysInMonth };
}

// 生成排班表
function schedule() {
    // 增加使用次数
    incrementUsageCount();
    
    // 显示加载状态
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<div style="text-align: center; padding: 50px;"><div class="loading-spinner"></div><p>正在生成排班表...</p></div>';
    
    // 使用requestAnimationFrame确保UI先更新
    requestAnimationFrame(() => {
        setTimeout(() => {
            performScheduling();
        }, 100);
    });
}

// 执行排班逻辑
function performScheduling() {
    try {
        const department = document.getElementById('department').value;
        const count = parseInt(document.getElementById('person-count').value);
        const people = [];
        let conflicts = [];
        
        // 验证部门名称
        if (!department || department.trim() === '') {
            alert('请输入部门名称');
            return;
        }
        
        // 验证人数
        if (isNaN(count) || count < 1) {
            alert('请输入有效的人数');
            return;
        }
        
        if (count > schedulingRules.maxPeople) {
            alert(`人数不能超过${schedulingRules.maxPeople}人`);
            return;
        }
        
        // 只获取一次月份信息
        const { year, month, daysInMonth } = getNextMonthInfo();
        
        for (let i = 1; i <= count; i++) {
            const name = document.getElementById(`name-${i}`).value;
            if (!name || name.trim() === '') {
                alert(`请输入人员 ${i} 的姓名`);
                return;
            }
            
            const restDayInputs = document.querySelectorAll(`#rest-days-${i} input[type="number"]`);
            const restDays = Array.from(restDayInputs).map(input => parseInt(input.value)).filter(day => !isNaN(day));
            
            if (restDays.length !== schedulingRules.restDaysPerPerson) {
                alert(`人员 ${i} 必须设置${schedulingRules.restDaysPerPerson}个休息日`);
                return;
            }
            
            // 检查休息日是否有效（在月份范围内）
            const invalidDays = restDays.filter(day => day < 1 || day > daysInMonth);
            if (invalidDays.length > 0) {
                conflicts.push(`${name}的休息日 ${invalidDays.join(', ')} 超出了${month}月的范围（1-${daysInMonth}）`);
            }
            
            // 检查是否有重复的休息日
            const uniqueRestDays = [...new Set(restDays)];
            if (uniqueRestDays.length !== restDays.length) {
                alert(`人员 ${i} 的休息日不能重复`);
                return;
            }
            
            people.push({ name, restDays, stats: { morning: 0, evening: 0, rest: schedulingRules.restDaysPerPerson, total: 0 } });
        }
        
        // 检查是否有重复的姓名
        const names = people.map(person => person.name);
        const uniqueNames = [...new Set(names)];
        if (uniqueNames.length !== names.length) {
            alert('人员姓名不能重复');
            return;
        }
        
        // 检查黄锦钰的休息日是否有冲突
        const huangJinyu = people.find(person => person.name === '黄锦钰');
        if (huangJinyu) {
            const invalidDays = huangJinyu.restDays.filter(day => day < 1 || day > daysInMonth);
            if (invalidDays.length > 0) {
                alert(`黄锦钰的休息日 ${invalidDays.join(', ')} 超出了${month}月的范围（1-${daysInMonth}），请修改后重新提交`);
                return;
            }
        }
        
        // 检查多人在同一天休息的情况
        const restDayCounts = {};
        for (let day = 1; day <= daysInMonth; day++) {
            restDayCounts[day] = 0;
        }
        
        people.forEach(person => {
            person.restDays.forEach(day => {
                if (restDayCounts[day] !== undefined) {
                    restDayCounts[day]++;
                }
            });
        });
        
        // 检查是否有天数休息人数过多
        const maxRestPerDay = Math.floor(people.length * 0.5); // 最多一半人休息
        for (let day = 1; day <= daysInMonth; day++) {
            if (restDayCounts[day] > maxRestPerDay) {
                conflicts.push(`第 ${day} 天有 ${restDayCounts[day]} 人休息，建议减少休息人数`);
            }
        }
        
        // 检查连续休息的情况
        people.forEach(person => {
            if (person.name !== '黄锦钰') { // 黄锦钰的需求必须满足
                const sortedRestDays = [...person.restDays].sort((a, b) => a - b);
                for (let i = 0; i < sortedRestDays.length - 1; i++) {
                    if (sortedRestDays[i + 1] - sortedRestDays[i] === 1) {
                        conflicts.push(`${person.name}有连续休息日：${sortedRestDays[i]}和${sortedRestDays[i + 1]}`);
                        break;
                    }
                }
            }
        });
        
        // 检查周五周六休息的情况
        if (schedulingRules.fridaySaturdayNoRest) {
            people.forEach(person => {
                if (person.name !== '黄锦钰') { // 黄锦钰的需求必须满足
                    person.restDays.forEach(day => {
                        const date = new Date(year, month - 1, day);
                        const dayOfWeek = date.getDay();
                        if (dayOfWeek === 5 || dayOfWeek === 6) { // 5是周五，6是周六
                            conflicts.push(`${person.name}在${day}日（周${'日一二三四五六'[dayOfWeek]}）休息，根据规则周五周六原则上不能休息`);
                        }
                    });
                }
            });
        }
        
        // 如果有冲突，给出推荐方案
        if (conflicts.length > 0) {
            let recommendation = '发现以下休息日冲突：\n';
            recommendation += conflicts.join('\n');
            recommendation += '\n\n推荐的休息日方案：\n';
            
            people.forEach(person => {
                if (person.name !== '黄锦钰') {
                    // 检查无效日期
                    const invalidDays = person.restDays.filter(day => day < 1 || day > daysInMonth);
                    
                    // 检查连续休息日
                    const sortedRestDays = [...person.restDays].sort((a, b) => a - b);
                    const consecutiveDays = [];
                    for (let i = 0; i < sortedRestDays.length - 1; i++) {
                        if (sortedRestDays[i + 1] - sortedRestDays[i] === 1) {
                            consecutiveDays.push(sortedRestDays[i], sortedRestDays[i + 1]);
                        }
                    }
                    
                    // 生成推荐的休息日
                    if (invalidDays.length > 0 || consecutiveDays.length > 0) {
                        const allConflicts = [...new Set([...invalidDays, ...consecutiveDays])];
                        
                        // 生成推荐的休息日（选择该月的有效日期，且不与其他冲突）
                        const validDays = [];
                        for (let day = 1; day <= daysInMonth; day++) {
                            if (!person.restDays.includes(day) && restDayCounts[day] < maxRestPerDay) {
                                // 检查是否会与其他休息日连续
                                const isConsecutive = person.restDays.some(restDay => Math.abs(day - restDay) === 1);
                                if (!isConsecutive) {
                                    validDays.push(day);
                                }
                            }
                        }
                        
                        // 选择前几个有效日期作为推荐
                        const recommendedDays = validDays.slice(0, allConflicts.length);
                        if (recommendedDays.length > 0) {
                            recommendation += `${person.name}：将 ${allConflicts.join(', ')} 改为 ${recommendedDays.join(', ')}\n`;
                        }
                    }
                }
            });
            
            if (confirm(recommendation + '\n是否使用推荐方案？')) {
                // 应用推荐方案
                people.forEach(person => {
                    if (person.name !== '黄锦钰') {
                        // 检查无效日期
                        const invalidDays = person.restDays.filter(day => day < 1 || day > daysInMonth);
                        
                        // 检查连续休息日
                        const sortedRestDays = [...person.restDays].sort((a, b) => a - b);
                        const consecutiveDays = [];
                        for (let i = 0; i < sortedRestDays.length - 1; i++) {
                            if (sortedRestDays[i + 1] - sortedRestDays[i] === 1) {
                                consecutiveDays.push(sortedRestDays[i], sortedRestDays[i + 1]);
                            }
                        }
                        
                        // 生成推荐的休息日
                        if (invalidDays.length > 0 || consecutiveDays.length > 0) {
                            const allConflicts = [...new Set([...invalidDays, ...consecutiveDays])];
                            
                            // 生成推荐的休息日（选择该月的有效日期，且不与其他冲突）
                            const validDays = [];
                            for (let day = 1; day <= daysInMonth; day++) {
                                if (!person.restDays.includes(day) && restDayCounts[day] < maxRestPerDay) {
                                    // 检查是否会与其他休息日连续
                                    const isConsecutive = person.restDays.some(restDay => Math.abs(day - restDay) === 1);
                                    if (!isConsecutive) {
                                        validDays.push(day);
                                    }
                                }
                            }
                            
                            // 选择前几个有效日期作为推荐
                            const recommendedDays = validDays.slice(0, allConflicts.length);
                            if (recommendedDays.length > 0) {
                                // 替换冲突日期
                                person.restDays = person.restDays.filter(day => !allConflicts.includes(day));
                                person.restDays.push(...recommendedDays);
                                // 确保休息日数量正确
                                person.restDays = person.restDays.slice(0, schedulingRules.restDaysPerPerson);
                            }
                        }
                    }
                });
            } else {
                return;
            }
        }
        
        // 初始化排班表（按人员维度）
        const schedule = {};
        // 记录每个人前一天的班次
        const previousShift = {};
        people.forEach(person => {
            schedule[person.name] = [];
            previousShift[person.name] = null; // 初始化为null
            for (let day = 1; day <= daysInMonth; day++) {
                if (person.restDays.includes(day)) {
                    schedule[person.name].push('休');
                } else {
                    schedule[person.name].push('');
                }
            }
        });
        
        // 为每天分配班次人员
        for (let day = 0; day < daysInMonth; day++) {
            const dayNum = day + 1;
            const availablePeople = people.filter(person => !person.restDays.includes(dayNum));
            
            // 识别黄锦钰和男性人员
            const huangJinyu = availablePeople.find(person => person.name === '黄锦钰');
            const maleNames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金', '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟', '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯', '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵', '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向', '汤'];
            const malePeople = availablePeople.filter(person => {
                const firstChar = person.name.charAt(0);
                return maleNames.includes(firstChar);
            });
            
            if (schedulingRules.shiftTypes === 2) {
                // 早班和晚班
                let sorted = [...availablePeople];
                
                // 特殊处理黄锦钰：优先分配早班，但不要太明显
                if (huangJinyu) {
                    // 更自然地优先分配早班，考虑整体班次平衡和连续性
                    sorted = sorted.sort((a, b) => {
                        // 首先考虑班次连续性（优先保持前一天的班次）
                        const hasPreviousShiftA = previousShift[a.name] !== null;
                        const hasPreviousShiftB = previousShift[b.name] !== null;
                        
                        // 如果只有一个人有前一天的班次，优先保持连续性
                        if (hasPreviousShiftA && !hasPreviousShiftB) return -1;
                        if (!hasPreviousShiftA && hasPreviousShiftB) return 1;
                        
                        // 其次考虑班次平衡
                        const balanceA = Math.abs(a.stats.morning - a.stats.evening);
                        const balanceB = Math.abs(b.stats.morning - b.stats.evening);
                        
                        // 计算班次比例差异
                        const ratioA = a.stats.morning / (a.stats.evening || 1);
                        const ratioB = b.stats.morning / (b.stats.evening || 1);
                        
                        // 优先让班次比例更接近1:1的人
                        if (Math.abs(ratioA - 1) < Math.abs(ratioB - 1)) return -1;
                        if (Math.abs(ratioA - 1) > Math.abs(ratioB - 1)) return 1;
                        
                        // 如果黄锦钰的班次不平衡，优先调整她的班次
                        if (a.name === '黄锦钰' && balanceA > balanceB) return -1;
                        if (b.name === '黄锦钰' && balanceB > balanceA) return 1;
                        
                        // 其次考虑早班次数
                        return a.stats.morning - b.stats.evening;
                    });
                } else {
                    // 没有黄锦钰时，按班次平衡和连续性排序
                    sorted = sorted.sort((a, b) => {
                        // 首先考虑班次连续性（优先保持前一天的班次）
                        const hasPreviousShiftA = previousShift[a.name] !== null;
                        const hasPreviousShiftB = previousShift[b.name] !== null;
                        
                        // 如果只有一个人有前一天的班次，优先保持连续性
                        if (hasPreviousShiftA && !hasPreviousShiftB) return -1;
                        if (!hasPreviousShiftA && hasPreviousShiftB) return 1;
                        
                        // 计算班次比例差异
                        const ratioA = a.stats.morning / (a.stats.evening || 1);
                        const ratioB = b.stats.morning / (b.stats.evening || 1);
                        
                        // 优先让班次比例更接近1:1的人
                        if (Math.abs(ratioA - 1) < Math.abs(ratioB - 1)) return -1;
                        if (Math.abs(ratioA - 1) > Math.abs(ratioB - 1)) return 1;
                        
                        // 其次考虑早班次数
                        return a.stats.morning - b.stats.evening;
                    });
                }
                
                // 确定当天是星期几
                const date = new Date(year, month - 1, dayNum);
                const dayOfWeek = date.getDay();
                const isFridaySaturday = (dayOfWeek === 5 || dayOfWeek === 6); // 5是周五，6是周六
                
                // 计算早晚班人数，确保比例更加自然
                let morningCount, eveningCount;
                if (isFridaySaturday) {
                    // 周五周六：夜班需要3人
                    eveningCount = schedulingRules.fridaySaturdayNightShiftCount;
                    morningCount = Math.min(schedulingRules.maxMorningShiftCount, sorted.length - eveningCount);
                } else {
                    // 平时：根据总人数计算合理的班次分配
                    // 优先考虑1:1的比例，同时满足最少夜班人数要求
                    const idealCount = Math.floor(sorted.length / 2);
                    eveningCount = Math.max(schedulingRules.normalNightShiftMinCount, idealCount);
                    morningCount = Math.min(schedulingRules.maxMorningShiftCount, sorted.length - eveningCount);
                    
                    // 调整以确保比例更加自然
                    if (sorted.length > 3) {
                        // 如果人数较多，尽量保持接近1:1的比例
                        const totalShifts = morningCount + eveningCount;
                        if (totalShifts > 0) {
                            const ratio = morningCount / eveningCount;
                            if (ratio > 1.5) {
                                // 早班太多，增加晚班
                                eveningCount++;
                                morningCount = Math.max(1, morningCount - 1);
                            } else if (ratio < 0.67) {
                                // 晚班太多，增加早班
                                morningCount++;
                                eveningCount = Math.max(schedulingRules.normalNightShiftMinCount, eveningCount - 1);
                            }
                        }
                    }
                }
                
                // 确保早晚班人数合理
                if (morningCount + eveningCount > sorted.length) {
                    eveningCount = sorted.length - morningCount;
                }
                
                // 确保至少有一个早班和一个晚班（如果人数足够）
                if (sorted.length >= 2) {
                    morningCount = Math.max(1, morningCount);
                    eveningCount = Math.max(1, eveningCount);
                }
                
                // 分配早班
                for (let i = 0; i < morningCount && i < sorted.length; i++) {
                    const person = sorted[i];
                    schedule[person.name][day] = '早';
                    person.stats.morning++;
                    person.stats.total++;
                    // 更新前一天班次记录
                    previousShift[person.name] = '早';
                }
                
                // 分配晚班：尽量与男性错开，且满足人数要求
                let eveningPeople = sorted.slice(morningCount);
                if (huangJinyu && eveningPeople.includes(huangJinyu)) {
                    // 如果黄锦钰被分配到晚班，尝试与男性错开
                    const femaleEveningPeople = eveningPeople.filter(person => !malePeople.includes(person));
                    const maleEveningPeople = eveningPeople.filter(person => malePeople.includes(person));
                    
                    // 优先让女性上晚班，男性尽量不上晚班
                    eveningPeople = [...femaleEveningPeople, ...maleEveningPeople];
                }
                
                // 确保晚班人数满足要求
                const actualEveningCount = Math.min(eveningCount, eveningPeople.length);
                for (let i = 0; i < actualEveningCount; i++) {
                    const person = eveningPeople[i];
                    schedule[person.name][day] = '晚';
                    person.stats.evening++;
                    person.stats.total++;
                    // 更新前一天班次记录
                    previousShift[person.name] = '晚';
                }
                
                // 对于当天休息的人，重置前一天班次记录
                people.forEach(person => {
                    if (person.restDays.includes(dayNum)) {
                        previousShift[person.name] = null;
                    }
                });
            } else if (schedulingRules.shiftTypes === 3) {
                // 早班、中班和晚班
                let sorted = [...availablePeople];
                
                // 特殊处理黄锦钰：优先分配早班或中班，尽量不分配晚班，考虑连续性
                if (huangJinyu) {
                    sorted = sorted.sort((a, b) => {
                        // 首先考虑班次连续性（优先保持前一天的班次）
                        const hasPreviousShiftA = previousShift[a.name] !== null;
                        const hasPreviousShiftB = previousShift[b.name] !== null;
                        
                        // 如果只有一个人有前一天的班次，优先保持连续性
                        if (hasPreviousShiftA && !hasPreviousShiftB) return -1;
                        if (!hasPreviousShiftA && hasPreviousShiftB) return 1;
                        
                        // 黄锦钰优先
                        if (a.name === '黄锦钰') return -1;
                        if (b.name === '黄锦钰') return 1;
                        
                        // 其次考虑总班次次数
                        return a.stats.total - b.stats.total;
                    });
                } else {
                    // 没有黄锦钰时，按班次连续性和总次数排序
                    sorted = sorted.sort((a, b) => {
                        // 首先考虑班次连续性（优先保持前一天的班次）
                        const hasPreviousShiftA = previousShift[a.name] !== null;
                        const hasPreviousShiftB = previousShift[b.name] !== null;
                        
                        // 如果只有一个人有前一天的班次，优先保持连续性
                        if (hasPreviousShiftA && !hasPreviousShiftB) return -1;
                        if (!hasPreviousShiftA && hasPreviousShiftB) return 1;
                        
                        // 其次考虑总班次次数
                        return a.stats.total - b.stats.total;
                    });
                }
                
                const shiftCount = Math.ceil(sorted.length / 3);
                
                // 分配早班
                for (let i = 0; i < shiftCount && i < sorted.length; i++) {
                    const person = sorted[i];
                    schedule[person.name][day] = '早';
                    person.stats.morning++;
                    person.stats.total++;
                    // 更新前一天班次记录
                    previousShift[person.name] = '早';
                }
                
                // 分配中班
                for (let i = shiftCount; i < shiftCount * 2 && i < sorted.length; i++) {
                    const person = sorted[i];
                    schedule[person.name][day] = '中';
                    if (!person.stats.mid) person.stats.mid = 0;
                    person.stats.mid++;
                    person.stats.total++;
                    // 更新前一天班次记录
                    previousShift[person.name] = '中';
                }
                
                // 分配晚班：尽量与男性错开，且尽量不让黄锦钰上晚班
                let eveningPeople = sorted.slice(shiftCount * 2);
                if (huangJinyu && eveningPeople.includes(huangJinyu)) {
                    // 如果黄锦钰被分配到晚班，尝试与男性错开
                    const femaleEveningPeople = eveningPeople.filter(person => !malePeople.includes(person) && person.name !== '黄锦钰');
                    const huangJinyuArr = [huangJinyu];
                    const maleEveningPeople = eveningPeople.filter(person => malePeople.includes(person));
                    
                    // 优先让其他女性上晚班，然后是黄锦钰，最后是男性
                    eveningPeople = [...femaleEveningPeople, ...huangJinyuArr, ...maleEveningPeople];
                }
                
                for (let i = 0; i < eveningPeople.length; i++) {
                    const person = eveningPeople[i];
                    schedule[person.name][day] = '晚';
                    person.stats.evening++;
                    person.stats.total++;
                    // 更新前一天班次记录
                    previousShift[person.name] = '晚';
                }
                
                // 对于当天休息的人，重置前一天班次记录
                people.forEach(person => {
                    if (person.restDays.includes(dayNum)) {
                        previousShift[person.name] = null;
                    }
                });
            }
        }
        
        // 存储排班数据到全局变量
        scheduleData = schedule;
        scheduleYear = year;
        scheduleMonth = month;
        schedulePeople = people;
        scheduleDepartment = department;
        
        // 保存数据
        saveData();
        
        // 显示结果
        displayResult(schedule, year, month, people, department);
        
        // 询问是否需要天气预报
        setTimeout(() => {
            if (confirm('是否需要获取广州市天河区的天气预报并提醒黄锦钰天气不好的日子？')) {
                // 显示加载状态
                const loadingDiv = document.createElement('div');
                loadingDiv.innerHTML = '<div class="loading-spinner"></div><p>正在获取天气数据...</p>';
                loadingDiv.style.position = 'fixed';
                loadingDiv.style.top = '50%';
                loadingDiv.style.left = '50%';
                loadingDiv.style.transform = 'translate(-50%, -50%)';
                loadingDiv.style.backgroundColor = 'white';
                loadingDiv.style.padding = '20px';
                loadingDiv.style.borderRadius = '8px';
                loadingDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                loadingDiv.id = 'weather-loading';
                document.body.appendChild(loadingDiv);
                
                // 获取天气数据并显示提醒
                getWeatherForecast(year, month, daysInMonth).then(weatherData => {
                    // 移除加载状态
                    if (document.getElementById('weather-loading')) {
                        document.getElementById('weather-loading').remove();
                    }
                    
                    // 显示黄锦钰天气提醒
                    showHuangJinyuWeatherAlert(weatherData, schedule, year, month);
                }).catch(error => {
                    console.error('获取天气数据失败:', error);
                    // 移除加载状态
                    if (document.getElementById('weather-loading')) {
                        document.getElementById('weather-loading').remove();
                    }
                    alert('无法获取真实的天气数据，无法提供天气提醒。');
                });
            }
        }, 1000);
        
        // 自动生成图片（带延迟确保UI已更新）
        setTimeout(() => {
            try {
                generateImage();
            } catch (error) {
                console.error('生成图片失败:', error);
                // 不影响主流程
            }
        }, 300);
    } catch (error) {
        console.error('排班失败:', error);
        alert('排班过程中发生错误，请重试。');
    }
}

// 显示结果
function displayResult(schedule, year, month, people, department) {
    const resultDiv = document.getElementById('result');
    const daysInMonth = Object.values(schedule)[0].length;
    
    let html = `<h2>${year}年${month}月排班表</h2>`;
    
    // 生成表格
    html += '<table border="1" style="width:100%; border-collapse: collapse; margin-top: 20px;">';
    
    // 表头：日期和星期
    html += '<tr><th>部门</th><th>姓名</th>';
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const weekDay = '日一二三四五六'[date.getDay()];
        html += `<th>${day}<br>${weekDay}</th>`;
    }
    if (schedulingRules.shiftTypes === 2) {
        html += '<th>早班</th><th>晚班</th><th>休息</th><th>备注</th></tr>';
    } else {
        html += '<th>早班</th><th>中班</th><th>晚班</th><th>休息</th><th>备注</th></tr>';
    }
    
    // 人员排班信息
    people.forEach(person => {
        html += `<tr>`;
        html += `<td>${department}</td>`;
        html += `<td>${person.name}</td>`;
        
        schedule[person.name].forEach(shift => {
            html += `<td>${shift}</td>`;
        });
        
        html += `<td>${person.stats.morning}</td>`;
        if (schedulingRules.shiftTypes === 3) {
            html += `<td>${person.stats.mid || 0}</td>`;
        }
        html += `<td>${person.stats.evening}</td>`;
        html += `<td>${person.stats.rest}</td>`;
        html += `<td></td>`;
        html += `</tr>`;
    });
    
    html += '</table>';
    
    // 添加排班规则说明
    html += `<div style="margin-top: 20px; font-size: 14px;">`;
    html += `<p>排班规则：</p>`;
    html += `<p>1. 每个月每人休息4天</p>`;
    html += `<p>2. 只有早班和晚班</p>`;
    html += `<p>3. 人数上限为6人</p>`;
    html += `<p>4. 早班：2:00-11:00，晚班：17:00-次日2:00</p>`;
    html += `</div>`;
    
    resultDiv.innerHTML = html;
}

// 导出Excel
function exportToExcel(schedule, year, month, people, daysInMonth, department) {
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 准备数据
    const data = [];
    
    // 表头：日期和星期
    const header = ['部门', '姓名'];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const weekDay = '日一二三四五六'[date.getDay()];
        header.push(`${day}（${weekDay}）`);
    }
    if (schedulingRules.shiftTypes === 2) {
        header.push('早班', '晚班', '休息', '备注');
    } else {
        header.push('早班', '中班', '晚班', '休息', '备注');
    }
    data.push(header);
    
    // 人员排班信息
    people.forEach(person => {
        const row = [department, person.name];
        row.push(...schedule[person.name]);
        if (schedulingRules.shiftTypes === 2) {
            row.push(person.stats.morning, person.stats.evening, person.stats.rest, '');
        } else {
            row.push(person.stats.morning, person.stats.mid || 0, person.stats.evening, person.stats.rest, '');
        }
        data.push(row);
    });
    
    // 添加排班规则说明
    data.push([]);
    data.push(['排班规则：']);
    data.push(['1. 每个月每人休息4天']);
    data.push(['2. 只有早班和晚班']);
    data.push(['3. 人数上限为6人']);
    data.push(['4. 早班：2:00-11:00，晚班：17:00-次日2:00']);
    
    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    const wscols = [{wch: 10}, {wch: 10}]; // 部门和姓名列
    for (let i = 0; i < daysInMonth; i++) {
        wscols.push({wch: 8}); // 日期列
    }
    if (schedulingRules.shiftTypes === 2) {
        wscols.push({wch: 8}, {wch: 8}, {wch: 8}, {wch: 10}); // 统计列
    } else {
        wscols.push({wch: 8}, {wch: 8}, {wch: 8}, {wch: 8}, {wch: 10}); // 统计列
    }
    ws['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, ws, `${year}年${month}月排班表`);
    
    // 导出文件（内存生成，不依赖本地文件路径）
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${year}年${month}月排班表.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 全局变量存储排班数据
let scheduleData = null;
let scheduleYear = null;
let scheduleMonth = null;
let schedulePeople = null;
let scheduleDepartment = null;

// 排班规则
let schedulingRules = {
    restDaysPerPerson: 4,
    maxPeople: 6,
    shiftTypes: 2, // 2: 早班和晚班, 3: 早班、中班和晚班
    // 新规则
    fridaySaturdayNoRest: true, // 周五周六原则上不能休息
    fridaySaturdayNightShiftCount: 3, // 周五周六要求三个人夜班
    normalNightShiftMinCount: 2, // 平时需要两个人以上夜班
    maxMorningShiftCount: 2, // 早班同一天不能有三个人（最多2个）
    shiftRatio: 1 // 早晚班比例大概1比1
};

// 切换规则表单显示/隐藏
function toggleRuleForm() {
    const ruleForm = document.getElementById('rule-form');
    if (ruleForm.style.display === 'none') {
        ruleForm.style.display = 'block';
        // 填充当前规则
        document.getElementById('rest-days-per-person').value = schedulingRules.restDaysPerPerson;
        document.getElementById('max-people').value = schedulingRules.maxPeople;
        document.getElementById('shift-types').value = schedulingRules.shiftTypes;
    } else {
        ruleForm.style.display = 'none';
    }
}

// 应用规则并重新排班
function applyRules() {
    // 获取新规则
    schedulingRules.restDaysPerPerson = parseInt(document.getElementById('rest-days-per-person').value);
    schedulingRules.maxPeople = parseInt(document.getElementById('max-people').value);
    schedulingRules.shiftTypes = parseInt(document.getElementById('shift-types').value);
    
    // 验证规则
    if (schedulingRules.restDaysPerPerson < 1 || schedulingRules.restDaysPerPerson > 10) {
        alert('每人每月休息天数必须在1-10之间');
        return;
    }
    
    if (schedulingRules.maxPeople < 1 || schedulingRules.maxPeople > 10) {
        alert('最大人数必须在1-10之间');
        return;
    }
    
    // 重新生成表单（如果人数上限改变）
    const personCountInput = document.getElementById('person-count');
    if (parseInt(personCountInput.value) > schedulingRules.maxPeople) {
        personCountInput.value = schedulingRules.maxPeople;
        generatePersonForms();
    }
    
    // 重新排班
    schedule();
    
    // 隐藏规则表单
    document.getElementById('rule-form').style.display = 'none';
}

// 生成图片
function generateImage() {
    if (!scheduleData) {
        showErrorMessage('请先生成排班表');
        return;
    }
    
    const resultDiv = document.getElementById('result');
    const table = resultDiv.querySelector('table');
    
    if (!table) {
        showErrorMessage('排班表数据不存在');
        return;
    }
    
    // 显示加载状态
    const loadingDiv = createLoadingElement('正在生成图片...');
    document.body.appendChild(loadingDiv);
    
    // 设置表格样式，确保生成的图片与照片一致
    table.style.border = '1px solid black';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    
    // 使用html2canvas生成图片（优化性能）
    html2canvas(table, {
        scale: 1,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0
    }).then(canvas => {
        // 移除加载状态
        document.body.removeChild(loadingDiv);
        
        // 转换为图片并下载
        const link = document.createElement('a');
        link.download = `${scheduleYear}年${scheduleMonth}月排班表.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // 显示成功提示
        showSuccessMessage('图片生成成功！');
    }).catch(err => {
        // 移除加载状态
        if (document.body.contains(loadingDiv)) {
            document.body.removeChild(loadingDiv);
        }
        console.error('生成图片失败:', err);
        showErrorMessage('生成图片失败，请重试');
    });
}

// 单独生成Excel
function generateExcel() {
    if (!scheduleData) {
        showErrorMessage('请先生成排班表');
        return;
    }
    
    // 显示加载状态
    const loadingDiv = createLoadingElement('正在生成Excel文件...');
    document.body.appendChild(loadingDiv);
    
    try {
        const { year, month, daysInMonth } = getNextMonthInfo();
        exportToExcel(scheduleData, year, month, schedulePeople, daysInMonth, scheduleDepartment);
        
        // 移除加载状态
        document.body.removeChild(loadingDiv);
        
        // 显示成功提示
        showSuccessMessage('Excel文件生成成功！');
    } catch (error) {
        // 移除加载状态
        if (document.body.contains(loadingDiv)) {
            document.body.removeChild(loadingDiv);
        }
        console.error('生成Excel失败:', error);
        showErrorMessage('生成Excel文件失败，请重试');
    }
}

// 创建加载元素
function createLoadingElement(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `<div class="loading-spinner-large"></div><p>${message}</p>`;
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '50%';
    loadingDiv.style.left = '50%';
    loadingDiv.style.transform = 'translate(-50%, -50%)';
    loadingDiv.style.backgroundColor = 'white';
    loadingDiv.style.padding = '30px';
    loadingDiv.style.borderRadius = '12px';
    loadingDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    loadingDiv.style.zIndex = '1000';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.id = 'loading-overlay';
    return loadingDiv;
}

// 显示成功消息
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.maxWidth = '300px';
    document.body.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-20px)';
        messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// 显示错误消息
function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.maxWidth = '300px';
    document.body.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-20px)';
        messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// 初始化微信JSSDK
function initWechat() {
    // 这里需要后端提供签名验证
    // 为了演示，我们使用模拟数据
    wx.config({
        debug: false,
        appId: 'wx1234567890', // 替换为真实的appId
        timestamp: Date.now(),
        nonceStr: 'randomstring',
        signature: 'signature',
        jsApiList: [
            'updateAppMessageShareData',
            'updateTimelineShareData',
            'onMenuShareTimeline',
            'onMenuShareAppMessage'
        ]
    });
    
    wx.ready(function() {
        // 分享给朋友
        wx.updateAppMessageShareData({
            title: '排班系统',
            desc: '交易所排班系统，轻松生成排班表',
            link: window.location.href,
            imgUrl: window.location.origin + '/icon.png',
            success: function() {
                console.log('分享成功');
            }
        });
        
        // 分享到朋友圈
        wx.updateTimelineShareData({
            title: '排班系统',
            link: window.location.href,
            imgUrl: window.location.origin + '/icon.png',
            success: function() {
                console.log('分享到朋友圈成功');
            }
        });
    });
}

// 分享排班表
function shareSchedule() {
    if (!scheduleData) {
        alert('请先生成排班表');
        return;
    }
    
    // 生成分享链接
    const shareUrl = window.location.href;
    
    // 在微信中，使用微信分享API
    if (typeof wx !== 'undefined') {
        // 显示分享菜单
        wx.showOptionMenu({
            menuList: ['share:appMessage', 'share:timeline']
        });
        alert('请点击右上角的分享按钮，将排班表分享给好友');
    } else if (typeof WeixinJSBridge !== 'undefined') {
        alert('请点击右上角的分享按钮，将排班表分享给好友');
    } else {
        // 在其他浏览器中，复制链接到剪贴板
        navigator.clipboard.writeText(shareUrl).then(function() {
            alert('链接已复制到剪贴板，请粘贴到微信中分享');
        }, function(err) {
            alert('复制失败，请手动复制链接');
        });
    }
}

// 检查使用次数
function checkUsageCount() {
    let usageCount = localStorage.getItem('usageCount');
    if (!usageCount) {
        usageCount = 0;
        localStorage.setItem('usageCount', usageCount);
    }
    
    // 检查是否已登录
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // 如果使用次数达到3次且未登录，显示登录界面
    if (parseInt(usageCount) >= 3 && !isLoggedIn) {
        document.getElementById('main-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    }
}

// 登录功能
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 验证账号密码
    if (username === 'hjy' && password === '010101') {
        localStorage.setItem('isLoggedIn', 'true');
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('main-form').style.display = 'block';
        
        // 登录成功后显示天气预报推荐的休息日
        const { year, month, daysInMonth } = getNextMonthInfo();
        
        // 询问是否需要天气预报
        if (confirm('是否需要获取广州市天河区的天气预报来推荐休息日？')) {
            // 显示加载状态
            const loadingDiv = document.createElement('div');
            loadingDiv.innerHTML = '<div class="loading-spinner"></div><p>正在获取天气数据...</p>';
            loadingDiv.style.position = 'fixed';
            loadingDiv.style.top = '50%';
            loadingDiv.style.left = '50%';
            loadingDiv.style.transform = 'translate(-50%, -50%)';
            loadingDiv.style.backgroundColor = 'white';
            loadingDiv.style.padding = '20px';
            loadingDiv.style.borderRadius = '8px';
            loadingDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            loadingDiv.id = 'weather-loading';
            document.body.appendChild(loadingDiv);
            
            try {
                const weatherData = await getWeatherForecast(year, month, daysInMonth);
                // 移除加载状态
                document.getElementById('weather-loading').remove();
                
                const recommendedDays = getRecommendedRestDays(weatherData, daysInMonth);
                
                if (recommendedDays.length > 0) {
                    alert(`登录成功！\n${year}年${month}月广州市天河区推荐的休息日（天气晴朗）：\n${recommendedDays.join('、')}`);
                } else {
                    alert('登录成功！\n无法获取足够的天气数据，无法推荐休息日。');
                }
            } catch (error) {
                console.error('获取天气数据失败:', error);
                // 移除加载状态
                if (document.getElementById('weather-loading')) {
                    document.getElementById('weather-loading').remove();
                }
                alert('登录成功！\n无法获取真实的天气数据，无法推荐休息日。');
            }
        }
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

// 增加使用次数
function incrementUsageCount() {
    let usageCount = localStorage.getItem('usageCount');
    if (!usageCount) {
        usageCount = 0;
    }
    usageCount = parseInt(usageCount) + 1;
    localStorage.setItem('usageCount', usageCount);
    
    // 检查是否需要登录
    checkUsageCount();
}

// 天气数据缓存
let weatherCache = {
    data: null,
    timestamp: 0,
    expiry: 3600000 // 1小时缓存
};

// 从网络获取天气预报数据（广州市天河区）
async function getWeatherForecast(year, month, daysInMonth) {
    try {
        // 检查缓存是否有效
        const now = Date.now();
        if (weatherCache.data && (now - weatherCache.timestamp) < weatherCache.expiry) {
            console.log('使用缓存的天气数据');
            return weatherCache.data;
        }
        
        // 使用OpenWeatherMap API获取天气数据
        // 注意：这里使用了免费的API key，实际使用时建议替换为自己的API key
        const apiKey = 'b6907d289e10d714a6e88b30761fae22';
        const lat = 23.1291; // 广州市天河区纬度
        const lon = 113.3249; // 广州市天河区经度
        
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=zh_cn`);
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`天气API返回错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 检查数据是否有效
        if (!data || !data.list || data.list.length === 0) {
            throw new Error('天气API返回的数据无效');
        }
        
        // 处理天气数据
        const weatherData = {};
        
        // 遍历API返回的天气数据
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.getDate();
            const currentMonth = date.getMonth() + 1;
            
            // 只处理目标月份的数据
            if (currentMonth === month) {
                // 获取天气描述
                const weatherDesc = item.weather[0].description;
                // 映射到我们需要的天气类型
                let weatherType;
                if (weatherDesc.includes('晴')) {
                    weatherType = '晴天';
                } else if (weatherDesc.includes('云')) {
                    weatherType = '多云';
                } else if (weatherDesc.includes('雨')) {
                    if (weatherDesc.includes('大')) {
                        weatherType = '大雨';
                    } else if (weatherDesc.includes('中')) {
                        weatherType = '中雨';
                    } else {
                        weatherType = '小雨';
                    }
                } else if (weatherDesc.includes('雷')) {
                    weatherType = '雷阵雨';
                } else {
                    weatherType = '阴';
                }
                
                // 只保存每天的天气（取当天的第一个数据点）
                if (!weatherData[day]) {
                    weatherData[day] = weatherType;
                }
            }
        });
        
        // 检查是否获取到了足够的天气数据
        const validWeatherDays = Object.keys(weatherData).length;
        if (validWeatherDays < daysInMonth * 0.5) { // 至少获取到一半天数的天气数据
            throw new Error('天气API返回的数据不足');
        }
        
        // 补全没有数据的日子
        for (let day = 1; day <= daysInMonth; day++) {
            if (!weatherData[day]) {
                weatherData[day] = '多云'; // 默认天气
            }
        }
        
        // 缓存天气数据
        weatherCache.data = weatherData;
        weatherCache.timestamp = now;
        
        return weatherData;
    } catch (error) {
        console.error('获取天气数据失败:', error);
        // 失败时抛出错误，让调用者处理
        throw error;
    }
}

// 模拟天气预报数据生成（作为备用）
function generateMockWeatherForecast(daysInMonth) {
    const weatherTypes = ['晴天', '多云', '小雨', '中雨', '大雨', '雷阵雨', '阴'];
    const weatherData = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
        // 生成随机天气，但确保大部分是晴天或多云
        const random = Math.random();
        let weather;
        if (random < 0.6) {
            weather = '晴天';
        } else if (random < 0.8) {
            weather = '多云';
        } else if (random < 0.9) {
            weather = '小雨';
        } else if (random < 0.95) {
            weather = '中雨';
        } else {
            weather = '大雨';
        }
        weatherData[day] = weather;
    }
    
    return weatherData;
}

// 获取合适的休息日推荐
function getRecommendedRestDays(weatherData, daysInMonth) {
    const goodWeatherDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const weather = weatherData[day];
        if (weather === '晴天' || weather === '多云') {
            goodWeatherDays.push(day);
        }
    }
    
    // 选择前几个好天气的日子作为推荐
    return goodWeatherDays.slice(0, 4);
}

// 显示黄锦钰天气提醒
function showHuangJinyuWeatherAlert(weatherData, schedule, year, month) {
    const huangJinyuSchedule = schedule['黄锦钰'];
    if (!huangJinyuSchedule) return;
    
    const badWeatherDays = [];
    
    huangJinyuSchedule.forEach((shift, index) => {
        const day = index + 1;
        const weather = weatherData[day];
        if (shift !== '休' && (weather === '大雨' || weather === '雷阵雨')) {
            badWeatherDays.push({ day, weather, shift });
        }
    });
    
    if (badWeatherDays.length > 0) {
        let alertMessage = `黄锦钰，${year}年${month}月广州市天河区天气提醒：\n`;
        badWeatherDays.forEach(item => {
            alertMessage += `第${item.day}天（${item.shift}班）：${item.weather}，请注意出行安全！\n`;
        });
        alert(alertMessage);
    } else {
        alert(`黄锦钰，${year}年${month}月广州市天河区天气良好，没有需要特别注意的恶劣天气。`);
    }
}

// 初始化
window.onload = function() {
    generatePersonForms();
    // 初始化微信JSSDK
    initWechat();
    // 检查使用次数
    checkUsageCount();
};