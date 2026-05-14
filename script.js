    const $ = id => document.getElementById(id);
    
    // 通用输入弹窗
    function showCustomPrompt(title, defaultVal, callback) {
        $('custom-prompt-title').textContent = title;
        $('custom-prompt-input').value = defaultVal || '';
        $('custom-prompt-modal').classList.add('show');
        $('custom-prompt-input').focus();
        $('custom-prompt-confirm').onclick = () => {
            $('custom-prompt-modal').classList.remove('show');
            callback($('custom-prompt-input').value.trim());
        };
    }

    // 通用选择弹窗
    function showCustomSelect(title, options, callback) {
        $('custom-select-title').textContent = title;
        const list = $('custom-select-list');
        list.innerHTML = options.map(opt => `
            <div style="padding: 12px; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px; text-align: center; font-size: 14px; color: var(--text-main); cursor: pointer;" 
                 onclick="document.getElementById('custom-select-modal').classList.remove('show'); window._tempSelectCallback('${opt.value}', '${opt.label}')">
                ${opt.label}
            </div>
        `).join('');
        window._tempSelectCallback = (val, label) => callback(val, label);
        $('custom-select-modal').classList.add('show');
    }

    // 新增防拦截提示框 (替代 alert)
    function _ui_notify_(_m) {
        if (localStorage.getItem('sysNotifyEnabled') === 'true' && Notification.permission === 'granted') {
            new Notification('系统通知', { body: _m });
            return;
        }
        let _t = document.getElementById('_c_t_');
        if (!_t) {
            _t = document.createElement('div'); _t.id = '_c_t_';
            _t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;font-size:14px;transition:opacity 0.3s;pointer-events:none;';
            document.body.appendChild(_t);
        }
        _t.textContent = _m; _t.style.opacity = '1';
        setTimeout(() => _t.style.opacity = '0', 2000);
    }

    function toggleSysNotify(isEnabled) {
        if (isEnabled) {
            if (!("Notification" in window)) {
                _ui_notify_("此浏览器不支持系统通知");
                document.getElementById('sys-notify-toggle').checked = false;
                return;
            }
            if (Notification.permission !== "granted") {
                Notification.requestPermission().then(function (permission) {
                    if (permission === "granted") {
                        localStorage.setItem('sysNotifyEnabled', 'true');
                        _ui_notify_("系统通知已开启");
                    } else {
                        document.getElementById('sys-notify-toggle').checked = false;
                        localStorage.setItem('sysNotifyEnabled', 'false');
                        _ui_notify_("通知权限被拒绝");
                    }
                });
            } else {
                localStorage.setItem('sysNotifyEnabled', 'true');
                _ui_notify_("系统通知已开启");
            }
        } else {
            localStorage.setItem('sysNotifyEnabled', 'false');
            _ui_notify_("系统通知已关闭");
        }
    }

    let elementPositions = JSON.parse(localStorage.getItem('elementPositions')) || {};
    let isGlobalDragging = false;
    let isDesktopEditMode = false;
    let currentDesktopPage = 0;
    // 已移除桌面多页滑动逻辑，保持单页极简

    function enterEditMode() {
        if (isDesktopEditMode) return;
        isDesktopEditMode = true;
        document.body.classList.add('edit-mode');
        
        document.querySelectorAll('.app-icon-wrapper, #desktop-widget, #desktop-ticket').forEach(el => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            if (centerX >= 0 && centerX <= 390) {
                el.classList.add('editable-item');
            } else {
                el.classList.remove('editable-item');
            }
        });

        const topbar = document.getElementById('desktop-edit-topbar');
        topbar.style.display = 'flex';
        setTimeout(() => topbar.style.opacity = '1', 10);
        if (navigator.vibrate) navigator.vibrate(50);
    }

    function exitEditMode() {
        isDesktopEditMode = false;
        document.body.classList.remove('edit-mode');
        const topbar = document.getElementById('desktop-edit-topbar');
        topbar.style.opacity = '0';
        setTimeout(() => topbar.style.display = 'none', 300);
        document.getElementById('desktop-edit-menu').style.display = 'none';
        const sheet = document.getElementById('desktop-customize-sheet');
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => { sheet.style.display = 'none'; }, 400);
    }

    function toggleEditMenu() {
        const menu = document.getElementById('desktop-edit-menu');
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }

    function openCustomizeSheet() {
        document.getElementById('desktop-edit-menu').style.display = 'none';
        const sheet = document.getElementById('desktop-customize-sheet');
        sheet.style.display = 'flex';
        setTimeout(() => { sheet.style.transform = 'translateY(0)'; }, 10);
    }

    function setDesktopStyle(style) {
        const tintSlider = document.getElementById('tint-slider-container');
        tintSlider.style.display = 'none';
        document.body.classList.remove('tinted-mode');
        
        // 增加背景过渡动画
        document.body.style.transition = 'background-color 0.5s ease, filter 0.5s ease';
        
        if (style === 'light') {
            toggleDarkMode(false);
            toggleAppIconBg(false);
            document.querySelector('.screen').style.filter = 'none';
        } else if (style === 'dark') {
            toggleDarkMode(true);
            toggleAppIconBg(false);
            document.querySelector('.screen').style.filter = 'brightness(0.8)';
        } else if (style === 'transparent') {
            toggleAppIconBg(true);
            document.querySelector('.screen').style.filter = 'none';
        } else if (style === 'tinted') {
            toggleDarkMode(true);
            toggleAppIconBg(false);
            document.body.classList.add('tinted-mode');
            tintSlider.style.display = 'flex';
            const savedHue = localStorage.getItem('desktopTintHue') || '200';
            document.documentElement.style.setProperty('--tint-hue', savedHue + 'deg');
            tintSlider.querySelector('input').value = savedHue;
            // 模拟真实的色调壁纸滤镜
            document.querySelector('.screen').style.filter = `sepia(0.8) hue-rotate(${savedHue}deg) saturate(2) brightness(0.6)`; 
        }
        localStorage.setItem('desktopStyleMode', style);
        
        setTimeout(() => { document.body.style.transition = ''; }, 500);
    }

    function updateTintHue(val) {
        document.documentElement.style.setProperty('--tint-hue', val + 'deg');
        localStorage.setItem('desktopTintHue', val);
        // 实时更新壁纸滤镜
        if (document.body.classList.contains('tinted-mode')) {
            document.querySelector('.screen').style.filter = `sepia(0.8) hue-rotate(${val}deg) saturate(2) brightness(0.6)`;
        }
    }

    function updateTintSat(val) {
        document.documentElement.style.setProperty('--tint-sat', val);
        localStorage.setItem('desktopTintSat', val);
    }

    window.addEventListener('DOMContentLoaded', () => {
        const savedStyle = localStorage.getItem('desktopStyleMode');
        if (savedStyle) setDesktopStyle(savedStyle);
        const savedSat = localStorage.getItem('desktopTintSat');
        if (savedSat) document.documentElement.style.setProperty('--tint-sat', savedSat);
    });

    function makeDraggable(el, id, onLongPress) {
        if (!el) return;
        let startX, startY, initialX = 0, initialY = 0;
        let isDragging = false;
        let pressTimer = null;
        let hasMoved = false;

        if (el.id === 'desktop-ticket') {
            el.style.setProperty('--drag-scale', '0.85');
        }

        if (elementPositions[id]) {
            initialX = elementPositions[id].x;
            initialY = elementPositions[id].y;
            el.style.setProperty('--drag-x', `${initialX}px`);
            el.style.setProperty('--drag-y', `${initialY}px`);
        }

        const start = (e) => {
            if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'file') return;
            hasMoved = false;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            if (isDesktopEditMode) {
                if (!el.classList.contains('editable-item')) return;
                isDragging = true;
                isGlobalDragging = true;
                el.classList.add('is-dragging');
                if (el.id === 'desktop-ticket') el.style.setProperty('--drag-scale', '0.9');
                else el.style.setProperty('--drag-scale', '1.1');
                return;
            }

            pressTimer = setTimeout(() => {
                enterEditMode();
                if (document.activeElement) document.activeElement.blur();
                if (navigator.vibrate) navigator.vibrate(50);
                if (onLongPress) onLongPress(e);
            }, 500);
        };

        let rafPending = false;
        const move = (e) => {
            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const dx = currentX - startX;
            const dy = currentY - startY;
            
            if (!isDragging) {
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    clearTimeout(pressTimer);
                }
                return;
            }
            
            if (e.cancelable) e.preventDefault();
            hasMoved = true;
            if (el.id === 'desktop-ticket') {
                const menu = document.getElementById('ticket-style-menu');
                if (menu) menu.classList.remove('show');
            }
            
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(() => {
                    el.style.setProperty('--drag-x', `${initialX + dx}px`);
                    el.style.setProperty('--drag-y', `${initialY + dy}px`);
                    rafPending = false;
                });
            }
        };

        const end = (e) => {
            clearTimeout(pressTimer);
            if (!isDragging) return;
            
            isDragging = false;
            el.classList.remove('is-dragging');
            if (el.id === 'desktop-ticket') el.style.setProperty('--drag-scale', '0.85');
            else el.style.setProperty('--drag-scale', '1');
            
            if (hasMoved) {
                const currentX = e.type.includes('mouse') ? e.clientX : (e.changedTouches ? e.changedTouches[0].clientX : startX);
                const currentY = e.type.includes('mouse') ? e.clientY : (e.changedTouches ? e.changedTouches[0].clientY : startY);
                
                let rawX = initialX + (currentX - startX);
                let rawY = initialY + (currentY - startY);
                
                // 严格网格吸附逻辑，限制拖拽范围防止错位跨格
                const gridX = 87.5;
                const gridY = 95;
                rawX = Math.max(0, Math.min(rawX, 390 * 4)); 
                rawY = Math.max(0, Math.min(rawY, 844 - 150));
                
                initialX = Math.round(rawX / gridX) * gridX;
                initialY = Math.round(rawY / gridY) * gridY;
                
                const screenWidth = 390;
                const pageIndex = Math.floor(initialX / screenWidth);
                if (pageIndex > 0 && pageIndex !== currentDesktopPage) {
                    _ui_notify_('已移动到第 ' + (pageIndex + 1) + ' 页');
                }
                
                elementPositions[id] = {x: initialX, y: initialY};
                localStorage.setItem('elementPositions', JSON.stringify(elementPositions));
                el.style.setProperty('--drag-x', `${initialX}px`);
                el.style.setProperty('--drag-y', `${initialY}px`);
                
                checkWidgetCollision(el);
            }
            
            setTimeout(() => isGlobalDragging = false, 100);
        };

        el.addEventListener('mousedown', start);
        document.addEventListener('mousemove', move, {passive: false});
        document.addEventListener('mouseup', end);
        el.addEventListener('touchstart', start, {passive: false});
        document.addEventListener('touchmove', move, {passive: false});
        document.addEventListener('touchend', end);
        document.addEventListener('touchcancel', end);
    }

    function checkWidgetCollision(appEl) {
        const widgets = [document.getElementById('desktop-widget'), document.getElementById('desktop-ticket')];
        const appRect = appEl.getBoundingClientRect();
        
        widgets.forEach(widget => {
            if (!widget || widget.style.display === 'none' || widget === appEl) return;
            const wRect = widget.getBoundingClientRect();
            
            // 碰撞判定 (留10px容差)
            if (appRect.left < wRect.right - 10 && appRect.right > wRect.left + 10 &&
                appRect.top < wRect.bottom - 10 && appRect.bottom > wRect.top + 10) {
                relocateWidget(widget);
            }
        });
    }

            function relocateWidget(widget) {
            const apps = document.querySelectorAll('.app-icon-wrapper');
            const otherWidget = widget.id === 'desktop-widget' ? document.getElementById('desktop-ticket') : document.getElementById('desktop-widget');
            const screenEl = document.querySelector('.screen');
            const screenRect = screenEl.getBoundingClientRect();
            
            const wWidth = widget.getBoundingClientRect().width;
            const wHeight = widget.getBoundingClientRect().height;
            
            let found = false;
            let targetX = 0, targetY = 0;
            let targetPage = 0;
            
            for (let page = 0; page < 5; page++) {
                const pageOffsetX = page * screenRect.width;
                for (let y = 60; y < screenRect.height - wHeight - 100; y += 95) {
                    for (let x = 20; x < screenRect.width - wWidth; x += 85) {
                        const testRect = {
                            left: screenRect.left + x + pageOffsetX,
                            right: screenRect.left + x + wWidth + pageOffsetX,
                            top: screenRect.top + y,
                            bottom: screenRect.top + y + wHeight
                        };
                        
                        let collision = false;
                        apps.forEach(app => {
                            const aRect = app.getBoundingClientRect();
                            if (testRect.left < aRect.right && testRect.right > aRect.left &&
                                testRect.top < aRect.bottom && testRect.bottom > aRect.top) {
                                collision = true;
                            }
                        });
                        
                        if (!collision && otherWidget) {
                            const oRect = otherWidget.getBoundingClientRect();
                            if (testRect.left < oRect.right && testRect.right > oRect.left &&
                                testRect.top < oRect.bottom && testRect.bottom > oRect.top) {
                                collision = true;
                            }
                        }
                        
                        if (!collision) {
                            targetX = testRect.left;
                            targetY = testRect.top;
                            targetPage = page;
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
                if (found) break;
            }
            
            if (found) {
                const currentTransform = widget.style.transform;
                widget.style.transform = widget.id === 'desktop-ticket' ? 'scale(0.85)' : 'none';
                const baseRect = widget.getBoundingClientRect();
                
                const dx = targetX - baseRect.left;
                const dy = targetY - baseRect.top;
                
                widget.style.transform = currentTransform; 
                
                const id = widget.id === 'desktop-widget' ? 'desktop-widget-pos' : 'desktop-ticket-pos';
                let currentPos = elementPositions[id] || {x: 0, y: 0};
                currentPos.x += dx;
                currentPos.y += dy;
                
                elementPositions[id] = currentPos;
                localStorage.setItem('elementPositions', JSON.stringify(elementPositions));
                
                widget.style.setProperty('--drag-x', `${currentPos.x}px`);
                widget.style.setProperty('--drag-y', `${currentPos.y}px`);
                
                if (targetPage > 0 && targetPage !== currentDesktopPage) {
                    _ui_notify_('空间不足，小组件已自动移动到第 ' + (targetPage + 1) + ' 页');
                }
            }
        }

    function renderTicketHTML(obj) {
        let seat1 = obj.info2Value || '-';
        let seat2 = seat1;
        let matchSeat = seat1.match(/(\d+)(?!.*\d)/);
        if (matchSeat) {
            let num = parseInt(matchSeat[1]) + 1;
            seat2 = seat1.substring(0, matchSeat.index) + String(num).padStart(matchSeat[1].length, '0') + seat1.substring(matchSeat.index + matchSeat[1].length);
        } else {
            seat2 += ' (伴)';
        }

        let serial1 = obj.serial || 'NO.000000';
        let serial2 = serial1;
        let matchSerial = serial1.match(/(\d+)(?!.*\d)/);
        if (matchSerial) {
            let num = parseInt(matchSerial[1]) + 1;
            serial2 = serial1.substring(0, matchSerial.index) + String(num).padStart(matchSerial[1].length, '0') + serial1.substring(matchSerial.index + matchSerial[1].length);
        } else {
            serial2 += '-2';
        }
        
        const tpl = (seat, serial) => `
        <div class="ticket ticket-${obj.style || 'movie'}">
            <div class="ticket-main">
                <div class="ticket-header">
                    <div class="ticket-type">${obj.typeText || 'TICKET'}</div>
                    <div class="ticket-serial">${serial}</div>
                </div>
                <div class="ticket-title">${obj.title || 'Title'}</div>
                <div class="ticket-subtitle">${obj.subtitle || 'Subtitle'}</div>
                <div class="ticket-info-row">
                    <div class="ticket-info-item">
                        <div class="ticket-info-label">${obj.info1Label || 'INFO'}</div>
                        <div class="ticket-info-value">${obj.info1Value || '-'}</div>
                    </div>
                    <div class="ticket-info-item">
                        <div class="ticket-info-label">${obj.info2Label || 'INFO'}</div>
                        <div class="ticket-info-value">${seat}</div>
                    </div>
                    <div class="ticket-info-item">
                        <div class="ticket-info-label">${obj.info3Label || 'INFO'}</div>
                        <div class="ticket-info-value">${obj.info3Value || '-'}</div>
                    </div>
                </div>
                <div class="ticket-footer">
                    <div class="ticket-footer-text">${obj.footer1 || ''}</div>
                    <div class="ticket-footer-text">${obj.footer2 || ''}</div>
                </div>
            </div>
            <div class="ticket-divider"></div>
            <div class="ticket-stub">
                <div class="stub-icon">${obj.icon || '🎫'}</div>
                <div class="stub-date">${obj.date || '01'}</div>
                <div class="stub-month">${obj.month || 'JAN'}</div>
                <div class="stub-year">${obj.year || '2025'}</div>
                <div class="stub-barcode">
                    <div class="stub-bar" style="height:12px"></div><div class="stub-bar" style="height:18px"></div><div class="stub-bar" style="height:8px"></div><div class="stub-bar" style="height:20px"></div><div class="stub-bar" style="height:14px"></div><div class="stub-bar" style="height:6px"></div><div class="stub-bar" style="height:16px"></div><div class="stub-bar" style="height:10px"></div><div class="stub-bar" style="height:20px"></div><div class="stub-bar" style="height:8px"></div><div class="stub-bar" style="height:15px"></div><div class="stub-bar" style="height:12px"></div>
                </div>
            </div>
        </div>`;
        
        return `<div style="display:flex; flex-direction:column; gap:10px; zoom: 0.6; padding: 4px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15));">
            ${tpl(seat1, serial1)}
            ${tpl(seat2, serial2)}
        </div>`;
    }

    let currentTicketStyle = localStorage.getItem('desktopTicketStyle') || 'movie';
    function showTicketStyleMenu(e) {
        if (isGlobalDragging) return;
        const menu = $('ticket-style-menu');
        menu.classList.add('show');
        let x = e.touches ? e.touches[0].clientX : e.clientX;
        let y = e.touches ? e.touches[0].clientY : e.clientY;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        setTimeout(() => document.addEventListener('click', closeTicketStyleMenu), 10);
    }
    function closeTicketStyleMenu(e) {
        const menu = $('ticket-style-menu');
        if (!menu.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeTicketStyleMenu);
        }
    }
    function changeTicketStyle(style) {
        const dt = $('desktop-ticket');
        dt.className = `ticket ticket-${style}`;
        currentTicketStyle = style;
        localStorage.setItem('desktopTicketStyle', style);
        $('ticket-style-menu').classList.remove('show');
        localStorage.setItem('desktopTicketHTML', dt.innerHTML);
    }

    setInterval(() => {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        $('status-time').textContent = timeStr;
        $('widget-time-text').textContent = timeStr;
    }, 1000);

    function openApp() { 
        if (isGlobalDragging || isDesktopEditMode) return;
        $('app-window').classList.add('open'); 
        $('status-bar').style.color = '#000'; 
        $('status-bar').style.textShadow = 'none'; 
    }

    function openSettingsApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('settings-app-window').classList.add('open');
        $('status-bar').style.color = '#000'; 
        $('status-bar').style.textShadow = 'none'; 
    }
        function openWorldbookApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('worldbook-app-window').classList.add('open');
        $('status-bar').style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#000'; 
        $('status-bar').style.textShadow = 'none';
        renderWorldbooks();
    }

    function openThemeApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('theme-app-window').classList.add('open');
        $('status-bar').style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#000'; 
        $('status-bar').style.textShadow = 'none';
    }

    function openEmotionApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('emotion-app-window').classList.add('open');
        $('status-bar').style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#000'; 
        $('status-bar').style.textShadow = 'none';
        cipherRenderMenu();
    }

    let activeMemoryTag = '';

    function openMemoryApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('memory-app-window').classList.add('open');
        $('status-bar').style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#000'; 
        $('status-bar').style.textShadow = 'none';
        activeMemoryTag = '';
        if ($('memory-search-input')) $('memory-search-input').value = '';
        renderMemoryApp();
    }

    function calculateSummarizedCount(roleId) {
        if (!advancedMemories[roleId] || !advancedMemories[roleId].summaries) return 0;
        let ranges = advancedMemories[roleId].summaries.map(s => [...s.range]);
        if (ranges.length === 0) return 0;
        ranges.sort((a, b) => a[0] - b[0]);
        let merged = [ranges[0]];
        for (let i = 1; i < ranges.length; i++) {
            let last = merged[merged.length - 1];
            let curr = ranges[i];
            if (curr[0] <= last[1] + 1) {
                last[1] = Math.max(last[1], curr[1]);
            } else {
                merged.push(curr);
            }
        }
        return merged.reduce((sum, r) => sum + (r[1] - r[0] + 1), 0);
    }

    function renderMemoryApp() {
        const container = $('memory-list-container');
        if (!currentChatPersona) {
            $('memory-total-count').textContent = '0';
            $('memory-tag-cloud').innerHTML = '';
            if($('memory-user-preferences')) $('memory-user-preferences').value = '';
            container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-sub); font-size:12px;">请先在聊天界面选择一个角色，再来管理记忆</div>';
            return;
        }
        
        const headerTitle = document.querySelector('#memory-app-window .app-header-title');
        if (headerTitle) headerTitle.textContent = `${currentChatPersona.name} 的专属记忆库`;
        const roleId = currentChatPersona.id;
        
        initNewMemorySystem(roleId);
        
        if($('memory-user-preferences')) $('memory-user-preferences').value = memorySystem[roleId].preferences || '';
        
        const allMemories = [...memorySystem[roleId].coreMemories, ...memorySystem[roleId].rollingMemories];
        $('memory-total-count').textContent = allMemories.length;
        
        const allTags = new Set();
        allMemories.forEach(s => {
            if (s.tags) s.tags.forEach(t => allTags.add(t));
        });
        
        $('memory-tag-cloud').innerHTML = Array.from(allTags).map(t => `
            <div style="padding: 4px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; border: 1px solid ${activeMemoryTag === t ? 'var(--text-main)' : 'var(--glass-border)'}; background: ${activeMemoryTag === t ? 'var(--text-main)' : 'transparent'}; color: ${activeMemoryTag === t ? 'var(--bg-color)' : 'var(--text-main)'};" onclick="toggleMemoryTag('${t}')">${t}</div>
        `).join('');
        
        filterMemories();
    }

    function toggleMemoryTag(tag) {
        activeMemoryTag = activeMemoryTag === tag ? '' : tag;
        renderMemoryApp();
    }

    function filterMemories() {
        if (!currentChatPersona) return;
        const roleId = currentChatPersona.id;
        const keyword = $('memory-search-input').value.trim().toLowerCase();
        const container = $('memory-list-container');
        
        initNewMemorySystem(roleId);
        
        // 组合核心记忆和滚动记忆，并打上标记
        let list = [
            ...memorySystem[roleId].coreMemories.map(m => ({...m, isCore: true})),
            ...memorySystem[roleId].rollingMemories.map(m => ({...m, isCore: false}))
        ];
        
        // 按时间倒序
        list.sort((a, b) => b.createdAt - a.createdAt);

        if (activeMemoryTag) {
            list = list.filter(s => s.tags && s.tags.includes(activeMemoryTag));
        }
        if (keyword) {
            list = list.filter(s => s.content.toLowerCase().includes(keyword));
        }
        
        container.innerHTML = list.map(s => `
            <div class="modern-item" style="flex-direction: column; align-items: flex-start; gap: 8px; border-left: 3px solid ${s.isCore ? '#d4af37' : 'var(--glass-border)'}; padding-left: 12px;">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 10px; color: ${s.isCore ? '#d4af37' : 'var(--text-sub)'}; font-weight: bold;">
                        ${s.isCore ? '★ 核心记忆' : '滚动记忆'} (重要性: ${s.importance})
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <div style="color: #ff3b30; font-size: 12px; cursor: pointer;" onclick="deleteMemory('${s.id}', ${s.isCore})">删除</div>
                    </div>
                </div>
                <div style="font-size: 13px; color: var(--text-main); line-height: 1.5;">${s.content}</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap; width: 100%; align-items: center;">
                    ${(s.tags || []).map(t => `<span style="font-size: 9px; padding: 2px 6px; background: var(--ai-bubble); border-radius: 4px; color: var(--text-sub);">${t}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    function deleteMemory(id, isCore) {
        if (!currentChatPersona) return;
        const roleId = currentChatPersona.id;
        if (isCore) {
            memorySystem[roleId].coreMemories = memorySystem[roleId].coreMemories.filter(s => s.id !== id);
        } else {
            memorySystem[roleId].rollingMemories = memorySystem[roleId].rollingMemories.filter(s => s.id !== id);
        }
        localStorage.setItem('memorySystem', JSON.stringify(memorySystem));
        renderMemoryApp();
        if ($('edit-persona-sum-count') && $('persona-edit-id').value == roleId) {
            $('edit-persona-sum-count').textContent = memorySystem[roleId].coreMemories.length + memorySystem[roleId].rollingMemories.length;
        }
    }

    function saveUserPreferences() {
        if (!currentChatPersona) return;
        const roleId = currentChatPersona.id;
        if (!advancedMemories[roleId]) advancedMemories[roleId] = { summaries: [], preferences: '' };
        advancedMemories[roleId].preferences = $('memory-user-preferences').value.trim();
        localStorage.setItem('advancedMemories', JSON.stringify(advancedMemories));
    }

    function editMemory(id) {
        if (!currentChatPersona) return;
        const roleId = currentChatPersona.id;
        const mem = advancedMemories[roleId].summaries.find(s => s.id === id);
        if (mem) {
            const modal = $('custom-edit-modal');
            const textarea = $('custom-edit-textarea');
            const confirmBtn = $('custom-edit-confirm');
            
            $('custom-edit-title').textContent = '编辑记忆片段';
            textarea.value = mem.content;
            
            confirmBtn.onclick = () => {
                mem.content = textarea.value;
                localStorage.setItem('advancedMemories', JSON.stringify(advancedMemories));
                renderMemoryApp();
                modal.classList.remove('show');
            };
            modal.classList.add('show');
        }
    }

    function deleteMemory(id) {
        if (!currentChatPersona) return;
        const roleId = currentChatPersona.id;
        advancedMemories[roleId].summaries = advancedMemories[roleId].summaries.filter(s => s.id !== id);
        localStorage.setItem('advancedMemories', JSON.stringify(advancedMemories));
        renderMemoryApp();
        if ($('edit-persona-sum-count') && $('persona-edit-id').value == roleId) {
            $('edit-persona-sum-count').textContent = calculateSummarizedCount(roleId);
        }
    }

    function addTagToMemory(id) {
        const tag = prompt('输入新标签:');
        if (!tag) return;
        if (!currentChatPersona) return;
        const roleId = currentChatPersona.id;
        const mem = advancedMemories[roleId].summaries.find(s => s.id === id);
        if (mem) {
            if (!mem.tags) mem.tags = [];
            if (!mem.tags.includes(tag)) mem.tags.push(tag);
            localStorage.setItem('advancedMemories', JSON.stringify(advancedMemories));
            renderMemoryApp();
        }
    }

    let memorySystem = JSON.parse(localStorage.getItem('memorySystem')) || {};

    // 初始化全新记忆数据结构
    function initNewMemorySystem(roleId) {
        if (!memorySystem[roleId]) {
            memorySystem[roleId] = {
                coreMemories: [],
                rollingMemories: [],
                summarizedMessageIds: [],
                preferences: ''
            };
        }
        if (!memorySystem[roleId].coreMemories) memorySystem[roleId].coreMemories = [];
        if (!memorySystem[roleId].rollingMemories) memorySystem[roleId].rollingMemories = [];
        if (!memorySystem[roleId].summarizedMessageIds) memorySystem[roleId].summarizedMessageIds = [];
    }

    // 自动总结检测
    async function checkAndTriggerAutoSummary(roleId) {
        const p = myPersonas.find(x => String(x.id) === String(roleId));
        if (!p || !p.autoSumToggle) return;

        initNewMemorySystem(roleId);
        const msgs = allChats[roleId] || [];
        const threshold = p.autoSumCount || 50;
        
        // 计算未总结的消息数量
        const unsummarizedMsgs = msgs.filter(m => m.id && !memorySystem[roleId].summarizedMessageIds.includes(m.id));

        if (unsummarizedMsgs.length >= threshold) {
            await executeNewSummary(roleId, unsummarizedMsgs);
        }
    }

    // 手动触发总结
    async function triggerManualSummarize() {
        const roleId = $('persona-edit-id').value;
        if (!roleId) return _ui_notify_('请先保存角色');
        
        initNewMemorySystem(roleId);
        const msgs = allChats[roleId] || [];
        const unsummarizedMsgs = msgs.filter(m => m.id && !memorySystem[roleId].summarizedMessageIds.includes(m.id));
        
        if (unsummarizedMsgs.length <= 0) return _ui_notify_('当前没有需要总结的新消息');
        
        _ui_notify_(`开始总结 ${unsummarizedMsgs.length} 条新消息...`);
        await executeNewSummary(roleId, unsummarizedMsgs);
    }

    // 执行总结核心逻辑
    async function executeNewSummary(roleId, msgsToSummarize) {
        if (window.isSummarizing && window.isSummarizing[roleId]) return;
        window.isSummarizing = window.isSummarizing || {};
        window.isSummarizing[roleId] = true;

        initNewMemorySystem(roleId);
        const p = myPersonas.find(x => String(x.id) === String(roleId));
        const chatText = msgsToSummarize.map(m => `${m.role === 'user' ? '用户' : '我'}: ${m.content}`).join('\n');
        const prevSummary = memorySystem[roleId].rollingMemories.slice(-1)[0]?.content || '无';

        const prompt = `你是 ${p.name}。请用你的第一人称口吻，像在日记本上随手写一段心事一样，记下刚刚这段对话里让你印象深刻的事情。
[上一段记忆]
${prevSummary}

[本轮新消息]
${chatText}

要求：
- 绝不说“今天”“昨天”“刚才”，直接描写感受。
- 用你平时说话的语气，允许省略号、语气词，可以吐槽、期待、失落。
- 不要复述对话过程，只抓取触动你的瞬间、变化或细节。
- 如果涉及感官（气味、触感、温度、声音），务必写进去。
- 必须与上一段记忆保持连续，只补充新进展，不重复已记录的事。
- 绝不用第三人称描述自己，始终用“我”。
- 最后输出一行纯 JSON 格式（不要有 markdown 标记）：
{"importance_score": 8, "memory_text": "你写的记忆内容", "tags": ["标签1","标签2"]}
`;

        try {
            const apiUrl = (p && p.apiUrl) ? p.apiUrl : localStorage.getItem('apiUrl');
            const apiKey = (p && p.apiKey) ? p.apiKey : localStorage.getItem('apiKey');
            const apiModel = (p && p.apiModel) ? p.apiModel : localStorage.getItem('apiModel');

            const res = await fetch(apiUrl.replace(/\/$/, '') + '/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({ model: apiModel, messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
            });
            const data = await res.json();
            let content = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
            
            // 尝试解析 JSON
            let resultObj;
            try {
                // 寻找最后一行或整个文本中的 JSON
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    resultObj = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("No JSON found");
                }
            } catch (err) {
                // 降级处理
                resultObj = { importance_score: 5, memory_text: content, tags: ["日常"] };
            }

            const newMemory = {
                id: 'mem_' + Date.now(),
                content: resultObj.memory_text || content,
                importance: resultObj.importance_score || 5,
                tags: resultObj.tags || [],
                createdAt: Date.now(),
                lastAccessed: Date.now()
            };

            // 根据重要性分流
            if (newMemory.importance >= 8) {
                memorySystem[roleId].coreMemories.push(newMemory);
            } else {
                memorySystem[roleId].rollingMemories.push(newMemory);
            }

            // 记录已总结的消息 ID
            msgsToSummarize.forEach(m => {
                if (m.id) memorySystem[roleId].summarizedMessageIds.push(m.id);
            });

            localStorage.setItem('memorySystem', JSON.stringify(memorySystem));
            
            if ($('edit-persona-sum-count')) {
                $('edit-persona-sum-count').textContent = memorySystem[roleId].coreMemories.length + memorySystem[roleId].rollingMemories.length;
            }
            _ui_notify_('记忆已更新');
        } catch (e) {
            console.error('记忆总结失败:', e);
            _ui_notify_('记忆总结失败: ' + e.message);
        } finally {
            window.isSummarizing[roleId] = false;
        }
    }

    // 提取关键词用于检索
    function extractKeywords(text) {
        if (!text) return [];
        // 简单分词：按标点符号分割，取长度大于1的词
        return text.split(/[\s,，。！？!?、~]+/).filter(w => w.length > 1);
    }

    // 获取注入的记忆（闪回机制）
    function getInjectedMemories(roleId, userMessage = '') {
        initNewMemorySystem(roleId);
        const data = memorySystem[roleId];
        if (!data) return '';

        const p = myPersonas.find(x => String(x.id) === String(roleId));
        // 严格读取用户自定义的注入条数，默认为3
        const injectCount = (p && p.memoryInjectCount !== undefined) ? parseInt(p.memoryInjectCount) : 3;
        if (injectCount <= 0) return ''; // 如果设置为0，则不注入记忆

        const keywords = extractKeywords(userMessage);
        
        let relevantCores = [];
        let relevantRolls = [];
        
        // 关键词关联检索
        if (keywords.length > 0) {
            relevantCores = data.coreMemories.filter(m => keywords.some(kw => m.content.includes(kw) || (m.tags && m.tags.includes(kw))));
            relevantRolls = data.rollingMemories.filter(m => keywords.some(kw => m.content.includes(kw) || (m.tags && m.tags.includes(kw))));
        }

        // 组合记忆文本
        let coreText = '';
        if (relevantCores.length > 0) {
            coreText = relevantCores.slice(0, Math.max(1, Math.floor(injectCount / 2))).map(m => `（脑中闪过：${m.content}）`).join('\n');
        } else {
            const topCores = [...data.coreMemories].sort((a, b) => b.importance - a.importance).slice(0, Math.max(1, Math.floor(injectCount / 2)));
            coreText = topCores.map(m => `（潜意识深处：${m.content}）`).join('\n');
        }

        let rollText = '';
        const remainingCount = Math.max(1, injectCount - (coreText ? coreText.split('\n').length : 0));
        
        if (relevantRolls.length > 0) {
            rollText = relevantRolls.slice(0, remainingCount).map(m => `（回忆起：${m.content}）`).join('\n');
        } else {
            const recentRolls = [...data.rollingMemories].sort((a, b) => b.lastAccessed - a.lastAccessed).slice(0, remainingCount);
            rollText = recentRolls.map(m => `（模糊的记忆：${m.content}）`).join('\n');
        }

        if (!coreText && !rollText) return '';
        return `\n【潜意识与记忆闪回】\n你会在对话中不时浮现以下记忆片段。请将这些记忆作为你当前情绪和潜意识的基底，自然地融入你的回复中。绝对不要直接说“我记得”、“你之前说过”，而是通过你的态度、关心或下意识的举动来体现你没有忘记这些事。\n${coreText}\n${rollText}\n`;
    }


    function handleDesktopBgUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    document.querySelector('.screen').style.backgroundImage = `url(${ev.target.result})`;
                    document.querySelector('.screen').style.backgroundSize = 'cover';
                    localStorage.setItem('desktopBg', ev.target.result);
                    _ui_notify_('桌面壁纸已更新');
                } catch(err) { _ui_notify_('图片过大'); }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    let tempAppIconData = '';
    function openAppEditModal() { $('app-edit-modal').classList.add('show'); tempAppIconData = ''; $('edit-app-name').value = ''; $('edit-app-icon-url').value = ''; }
    
    function handleAppIconFile(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width, h = img.height;
                    if (w > 200) { h = h * (200 / w); w = 200; } // 压缩图标尺寸
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    tempAppIconData = canvas.toDataURL('image/jpeg', 0.8);
                    _ui_notify_('已选择本地图标');
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }
    
    function saveAppEdit() {
        const appId = $('edit-app-select').value;
        const newName = $('edit-app-name').value.trim();
        const newUrl = $('edit-app-icon-url').value.trim();
        let appData = JSON.parse(localStorage.getItem('customApps')) || {};
        if(!appData[appId]) appData[appId] = {};
        
        if(newName) appData[appId].name = newName;
        if(tempAppIconData) appData[appId].icon = tempAppIconData;
        else if(newUrl) appData[appId].icon = newUrl;
        
        try {
            localStorage.setItem('customApps', JSON.stringify(appData));
            applyCustomApps();
            $('app-edit-modal').classList.remove('show');
            _ui_notify_('App 已更新');
        } catch(e) {
            _ui_notify_('保存失败：图片可能仍然过大');
        }
    }
    function applyCustomApps() {
        const appData = JSON.parse(localStorage.getItem('customApps')) || {};
        for(let id in appData) {
            if(appData[id].name && $(`name-${id}`)) $(`name-${id}`).textContent = appData[id].name;
            if(appData[id].icon && $(`icon-${id}`)) {
                $(`icon-${id}`).style.backgroundImage = `url(${appData[id].icon})`;
                $(`icon-${id}`).style.backgroundSize = 'cover';
                $(`icon-${id}`).innerHTML = '';
            }
        }
        const desktopBg = localStorage.getItem('desktopBg');
        if(desktopBg) {
            document.querySelector('.screen').style.backgroundImage = `url(${desktopBg})`;
            document.querySelector('.screen').style.backgroundSize = 'cover';
        }
    }

    function exportEmotionData() {
        _ui_notify_('情绪密码数据导出功能开发中');
    }

    // ================= 情绪密码游戏 (Emotion Cipher) =================
    function cipherGlobalBack() {
        const isMenu = document.getElementById('cp-menu').classList.contains('active');
        if (isMenu) {
            $('emotion-app-window').classList.remove('open');
            $('status-bar').style.color = '#fff'; 
            $('status-bar').style.textShadow = '0 1px 2px rgba(0,0,0,0.2)';
        } else {
            cipherNav('cp-menu');
        }
    }

    const CIPHER_SYMBOLS = {
        '天气':['🌧️','☀️','🌙','⛈️','🌈','❄️','🌊','🌫️','🔥','💨','⭐','🌅'],
        '物品':['🍞','☕','🎵','📱','🔑','💌','🎭','🪞','🧸','🎪','📷','🕯️'],
        '时间':['⏳','⏰','🌅','🌃','♾️','⏪','⏩','🔄','📅','🕐','⌛','🌑'],
        '动作':['🚶','💤','👀','🤫','✋','🫂','💭','🏃','🧘','🤝','👋','🙈'],
        '抽象':['💔','✨','🫧','🌀','💫','🎯','⚡','🔮','♟️','🧩','🎲','💠'],
        '自然':['🌸','🍂','🌿','🦋','🐚','🌻','🍃','🌺','🪸','🌾','🍀','🌵']
    };

    const CIPHER_DEFAULT_EMOTIONS = [
        '等早餐的时候有点难过','深夜突然想起一个人','假装开心但其实很累',
        '被理解的那一刻的感动','想说话但不知道该说什么','雨天窝在家里的安心感',
        '收到意外礼物的惊喜','独自走在夜路上的孤独','和朋友吵架后的后悔',
        '完成一件大事后的空虚','暗恋一个人的小心翼翼','被人误解时的委屈',
        '看到日落时莫名的伤感','失眠时脑子里乱七八糟的想法','想家但回不去的无奈',
        '明明很在意却装作不在乎','突然被感动到想哭','吃到好吃的东西时的满足',
        '考试前的焦虑不安','被表扬时嘴上说没什么但心里很开心'
    ];

    const CIPHER_DEFAULT_BANK = [
        {symbols:'🌧️+🍞+⏳',answer:'等早餐的时候有点难过',hint:'一个关于等待的情绪',wrongs:['开心地准备早餐','等公交时的焦虑','下雨天的浪漫']},
        {symbols:'🌙+📱+💤',answer:'睡前刷手机舍不得放下的纠结',hint:'深夜的矛盾',wrongs:['失眠的痛苦','收到深夜消息的惊喜','做了一个好梦']},
        {symbols:'☀️+🎭+💔',answer:'假装开心但其实很累',hint:'一种伪装',wrongs:['阳光下的快乐','演出成功的喜悦','心碎后的释然']},
        {symbols:'🌫️+🚶+🌃',answer:'独自走在夜路上的孤独',hint:'一个人的夜晚',wrongs:['迷路时的慌张','夜跑的畅快','散步时的放松']},
        {symbols:'💌+⏳+👀',answer:'等回复时反复查看手机的焦虑',hint:'关于等待消息',wrongs:['收到情书的害羞','写信时的认真','删除消息的后悔']},
        {symbols:'🌈+🌧️+✨',answer:'哭完之后反而觉得轻松了',hint:'雨后天晴',wrongs:['看到彩虹的惊喜','雨中漫步的浪漫','暴风雨前的紧张']},
        {symbols:'☕+🌅+💭',answer:'早起喝咖啡时的宁静和思绪',hint:'清晨的独处',wrongs:['赶早班的焦虑','约会前的期待','加班到天亮的疲惫']},
        {symbols:'🧸+🌙+🫂',answer:'深夜抱着玩偶想念一个人',hint:'夜晚的思念',wrongs:['收到礼物的开心','和朋友告别的不舍','童年的回忆']},
        {symbols:'🎵+🌧️+🪞',answer:'下雨天听歌看着镜子里的自己发呆',hint:'一种自我审视',wrongs:['KTV唱歌的快乐','化妆时的期待','听到喜欢的歌的兴奋']},
        {symbols:'🔑+💔+🚶',answer:'决定放手离开的释然和不舍',hint:'关于告别',wrongs:['找到钥匙的开心','搬新家的期待','迷路后找到方向']},
        {symbols:'🌸+💨+📷',answer:'想留住美好瞬间但来不及的遗憾',hint:'关于转瞬即逝',wrongs:['拍到好照片的满足','春天出游的快乐','风吹花落的浪漫']},
        {symbols:'🍂+⏪+🌻',answer:'回忆过去快乐时光的怀念',hint:'关于回忆',wrongs:['秋天的萧瑟','对未来的期待','收获季节的满足']},
    ];

    let cipherState = JSON.parse(localStorage.getItem('cipherState')) || {score:0,created:0,solved:0,collection:[]};
    let cipherBank = JSON.parse(localStorage.getItem('cipherBank')) || [...CIPHER_DEFAULT_BANK];
    let cipherPool = JSON.parse(localStorage.getItem('cipherPool')) || [...CIPHER_DEFAULT_EMOTIONS];
    let cipherCurrent = {mode:null, selectedRole:null, cipher:[], target:'', encMode:'random', puzzleAnswer:''};
    let cipherKbCat = '天气';

    function cipherSave() {
        localStorage.setItem('cipherState', JSON.stringify(cipherState));
        localStorage.setItem('cipherBank', JSON.stringify(cipherBank));
        localStorage.setItem('cipherPool', JSON.stringify(cipherPool));
    }

    function cipherNav(id) {
        document.querySelectorAll('.cipher-page').forEach(p => p.classList.remove('active'));
        $(`${id}`).classList.add('active');
        if (id==='cp-menu') cipherRenderMenu();
        if (id==='cp-codex') cipherRenderCodex();
        if (id==='cp-bank') cipherRenderBank();
    }

    function cipherRenderMenu() {
        $('cipher-score-top').textContent = cipherState.score;
        $('cp-s-created').textContent = cipherState.created;
        $('cp-s-solved').textContent = cipherState.solved;
        $('cp-s-unlocked').textContent = cipherState.collection.length;
    }

    function cipherStartMode(mode) {
        cipherCurrent.mode = mode;
        cipherCurrent.selectedRole = null;
        cipherNav('cp-roles');
        cipherRenderRoles();
    }

    function cipherRenderRoles() {
        const list = $('cp-role-list');
        if (myPersonas.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:var(--text-sub); padding:30px; font-size:12px;">请先在通讯录创建角色</div>';
            return;
        }
        list.innerHTML = myPersonas.map(r => `
            <div class="cipher-role-card ${cipherCurrent.selectedRole===r.id?'selected':''}" onclick="cipherCurrent.selectedRole='${r.id}'; cipherRenderRoles();">
                <img class="cipher-role-avatar" src="${r.avatar||''}">
                <div><div style="font-size:14px; font-weight:600; color:var(--text-main);">${r.name}</div><div style="font-size:10px; color:var(--text-sub);">ENTITY</div></div>
            </div>
        `).join('');
    }

    function cipherConfirmRole() {
        if (!cipherCurrent.selectedRole) { _ui_notify_('请先选择一个角色'); return; }
        if (cipherCurrent.mode === 'encode') { cipherNav('cp-encode'); cipherInitEncode(); }
        else { cipherNav('cp-decode'); cipherInitDecode(); }
    }

    function cipherGetRole() { return myPersonas.find(r=>String(r.id)===String(cipherCurrent.selectedRole)) || myPersonas[0]; }

    function cipherBuildKb() {
        const tabs = $('cp-kb-tabs');
        tabs.innerHTML = Object.keys(CIPHER_SYMBOLS).map(c =>
            `<div class="cipher-kb-tab ${c===cipherKbCat?'active':''}" onclick="cipherSwitchKb('${c}',this)">${c}</div>`
        ).join('');
        cipherRenderKbGrid(cipherKbCat);
    }

    function cipherSwitchKb(c, el) {
        cipherKbCat = c;
        document.querySelectorAll('.cipher-kb-tab').forEach(t => t.classList.remove('active'));
        if (el) el.classList.add('active');
        cipherRenderKbGrid(c);
    }

    function cipherRenderKbGrid(c) {
        $('cp-sym-grid').innerHTML = (CIPHER_SYMBOLS[c]||[]).map(s =>
            `<div class="cipher-sym-btn" onclick="cipherAddSym('${s}')">${s}</div>`
        ).join('');
    }

    function cipherInitEncode() {
        cipherCurrent.cipher = [];
        cipherCurrent.encMode = 'random';
        document.querySelectorAll('#cp-encode-tabs .cipher-diff-btn').forEach(b => b.classList.toggle('active', b.dataset.m==='random'));
        $('cp-enc-random').style.display = 'block';
        $('cp-enc-free').style.display = 'none';
        cipherReroll();
        cipherRenderBox();
        cipherBuildKb();
    }

    function cipherSwitchEncMode(mode, el) {
        cipherCurrent.encMode = mode;
        document.querySelectorAll('#cp-encode-tabs .cipher-diff-btn').forEach(b => b.classList.remove('active'));
        if (el) el.classList.add('active');
        $('cp-enc-random').style.display = mode==='random'?'block':'none';
        $('cp-enc-free').style.display = mode==='free'?'block':'none';
    }

    function cipherReroll() {
        const pool = cipherPool.length > 0 ? cipherPool : CIPHER_DEFAULT_EMOTIONS;
        cipherCurrent.target = pool[Math.floor(Math.random()*pool.length)];
        $('cp-enc-target').textContent = cipherCurrent.target;
    }

    function cipherAddSym(s) {
        if (cipherCurrent.cipher.length >= 10) return;
        cipherCurrent.cipher.push({t:'s',v:s});
        cipherRenderBox();
    }

    function cipherAddWord() {
        const inp = $('cp-word-input');
        const w = inp.value.trim();
        if (!w || cipherCurrent.cipher.length >= 10) return;
        cipherCurrent.cipher.push({t:'w',v:w});
        inp.value = '';
        cipherRenderBox();
    }

    function cipherRemoveAt(i) { cipherCurrent.cipher.splice(i,1); cipherRenderBox(); }
    function cipherClear() { cipherCurrent.cipher=[]; cipherRenderBox(); }

    function cipherRenderBox() {
        const box = $('cp-cipher-box');
        const tags = $('cp-tags');
        if (cipherCurrent.cipher.length === 0) {
            box.className = 'cipher-box empty';
            box.innerHTML = '<div class="cipher-ph">TAP SYMBOLS BELOW</div>';
            tags.innerHTML = '';
            return;
        }
        box.className = 'cipher-box';
        box.innerHTML = cipherCurrent.cipher.map((c,i) => {
            const sep = i < cipherCurrent.cipher.length-1 ? '<span class="cipher-pls">+</span>' : '';
            return c.t==='s' ? `<span class="cipher-sym">${c.v}</span>${sep}` : `<span class="cipher-wrd">${c.v}</span>${sep}`;
        }).join('');
        tags.innerHTML = cipherCurrent.cipher.map((c,i) => `
            <div class="cipher-tag">${c.v}<button class="cipher-tag-rm" onclick="cipherRemoveAt(${i})">×</button></div>
        `).join('');
    }

    function cipherSubmitEncode() {
        if (cipherCurrent.cipher.length < 2) { _ui_notify_('至少需要2个符号或碎词'); return; }
        const emotion = cipherCurrent.encMode === 'free' ? $('cp-free-input').value.trim() : cipherCurrent.target;
        if (!emotion) { _ui_notify_('请输入你想藏的情绪'); return; }
        cipherCurrent.target = emotion;
        cipherSimulateGuess();
    }

    function cipherSimulateGuess() {
        const role = cipherGetRole();
        cipherNav('cp-guess');
        $('cp-guess-avatar').src = role.avatar || '';
        $('cp-guess-name').textContent = role.name;
        $('cp-guess-status').textContent = 'THINKING...';
        $('cp-judge-section').style.display = 'block';
        $('cp-reveal').style.display = 'none';
        $('cp-guess-cipher').innerHTML = cipherCurrent.cipher.map((c,i) => {
            const sep = i<cipherCurrent.cipher.length-1?'<span class="cipher-pls">+</span>':'';
            return c.t==='s'?`<span class="cipher-sym">${c.v}</span>${sep}`:`<span class="cipher-wrd">${c.v}</span>${sep}`;
        }).join('');
        $('cp-guess-content').innerHTML = '<div class="cipher-thinking"><span></span><span></span><span></span></div>';

        const cipherText = cipherCurrent.cipher.map(c=>c.v).join(' + ');
        const target = cipherCurrent.target;

        const apiUrl = localStorage.getItem('apiUrl');
        if (apiUrl) {
            cipherAiGuess(role, cipherText, target);
        } else {
            setTimeout(() => {
                const guesses = [
                    `我感觉到了...「${target}」？这些符号让我想到了某种说不清的情绪。`,
                    `嗯...${cipherText.split('+')[0].trim()}给我的感觉是，你想表达「${target}」。`,
                    `让我想想。这个密码让我联想到「${target}」，对吗？`
                ];
                $('cp-guess-content').textContent = guesses[Math.floor(Math.random()*guesses.length)];
                $('cp-guess-status').textContent = 'ANSWERED';
            }, 1500 + Math.random()*1500);
        }
    }

    async function cipherAiGuess(role, cipherText, target) {
        try {
            const prompt = `你是${role.name}。${role.prompt ? role.prompt.substring(0,200) : ''}

你的朋友给你发了一组"情绪密码"，由符号和碎词组成：${cipherText}

请你猜猜这组密码背后藏着什么情绪或感受。要求：
1. 用你自己的语气和性格来猜，不要OOC
2. 先描述你从这些符号中感受到了什么，然后给出你的猜测
3. 不超过60字，像发微信一样自然
4. 直接输出内容，不加引号`;

            const endpoint = localStorage.getItem('apiUrl').replace(/\/$/, '') + '/chat/completions';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('apiKey')}` },
                body: JSON.stringify({ model: localStorage.getItem('apiModel'), messages: [{role:'user', content:prompt}], temperature: 0.85 })
            });
            const data = await res.json();
            const guess = data.choices[0].message.content.trim();
            $('cp-guess-content').textContent = guess;
            $('cp-guess-status').textContent = 'ANSWERED';
        } catch(e) {
            $('cp-guess-content').textContent = `嗯...我觉得你想表达的是「${target}」？`;
            $('cp-guess-status').textContent = 'ANSWERED';
        }
    }

    function cipherJudge(correct) {
        $('cp-judge-section').style.display = 'none';
        if (correct) {
            cipherState.score += 15; cipherState.created++;
            const ct = cipherCurrent.cipher.map(c=>c.v).join('+');
            if (!cipherState.collection.find(x=>x.cipher===ct)) {
                cipherState.collection.push({cipher:ct, meaning:cipherCurrent.target, time:Date.now(), by:'user'});
            }
            cipherSave();
            cipherShowResult(true, cipherCurrent.target, '+15 ✦');
        } else {
            $('cp-reveal').style.display = 'block';
            $('cp-reveal-text').textContent = cipherCurrent.target;
            cipherState.created++; cipherSave();
        }
    }

    function cipherInitDecode() {
        const role = cipherGetRole();
        const content = $('cp-decode');
        if (cipherBank.length === 0) {
            content.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-sub); font-size:12px;">NO PUZZLES IN BANK</div>';
            return;
        }
        const puzzle = cipherBank[Math.floor(Math.random()*cipherBank.length)];
        cipherCurrent.puzzleAnswer = puzzle.answer;
        let wrongs = (puzzle.wrongs && puzzle.wrongs.length >= 3) ? puzzle.wrongs.slice(0,3) : cipherPool.filter(e=>e!==puzzle.answer).sort(()=>Math.random()-0.5).slice(0,3);
        const allOpts = [puzzle.answer, ...wrongs].sort(()=>Math.random()-0.5);
        const letters = ['A','B','C','D'];

        content.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
                <img class="cipher-role-avatar" src="${role.avatar||''}">
                <div><div style="font-size:14px; font-weight:600; color:var(--text-main);">${role.name}</div><div style="font-size:10px; color:var(--text-sub);">SENT A CIPHER</div></div>
            </div>
            <div class="cipher-box" style="font-size:28px; letter-spacing:8px;">${puzzle.symbols}</div>
            ${puzzle.hint ? `<div class="cipher-target-box"><div class="cipher-target-label">HINT</div><div class="cipher-target-text">${puzzle.hint}</div></div>` : ''}
            <div class="cipher-section-label" style="margin-bottom:8px;">SELECT THE EMOTION</div>
            <div class="cipher-options" id="cp-decode-opts">
                ${allOpts.map((o,i) => `
                    <div class="cipher-opt" data-answer="${encodeURIComponent(o)}" data-correct="${o===puzzle.answer}" onclick="cipherPick(this)">
                        <span class="cipher-opt-letter">${letters[i]}</span>
                        <span>${o}</span>
                    </div>
                `).join('')}
            </div>
            <div style="border-top:1px solid var(--glass-border); margin:10px 0; padding-top:10px;">
                <div class="cipher-section-label">OR TYPE YOUR ANSWER</div>
                <div class="cipher-input-row">
                    <input type="text" class="cipher-text-input" id="cp-free-decode" placeholder="输入你认为的情绪...">
                    <button class="cipher-add-btn" onclick="cipherFreeDecodeSubmit()">→</button>
                </div>
            </div>
        `;
    }

    function cipherPick(el) {
        const container = $('cp-decode-opts');
        if (container.querySelector('.correct') || container.querySelector('.wrong')) return;
        const isCorrect = el.dataset.correct === 'true';
        if (isCorrect) {
            el.classList.add('correct');
            cipherState.score += 10; cipherState.solved++;
            if (!cipherState.collection.find(x=>x.meaning===cipherCurrent.puzzleAnswer)) {
                const p = cipherBank.find(p=>p.answer===cipherCurrent.puzzleAnswer);
                cipherState.collection.push({cipher:p?p.symbols:'?', meaning:cipherCurrent.puzzleAnswer, time:Date.now(), by:'ai'});
            }
            cipherSave();
            container.querySelectorAll('.cipher-opt').forEach(c => c.classList.add('disabled'));
            setTimeout(()=>cipherShowResult(true, cipherCurrent.puzzleAnswer, '+10 ✦'), 600);
        } else {
            el.classList.add('wrong');
            container.querySelectorAll('.cipher-opt').forEach(c => {
                if (c.dataset.correct === 'true') c.classList.add('correct');
                c.classList.add('disabled');
            });
            cipherState.score = Math.max(0, cipherState.score - 3); cipherSave();
            setTimeout(()=>cipherShowResult(false, cipherCurrent.puzzleAnswer, '-3 ✦'), 800);
        }
    }

    function cipherFreeDecodeSubmit() {
        const input = $('cp-free-decode');
        if (!input) return;
        const userAnswer = input.value.trim();
        if (!userAnswer) return;
        const correct = cipherCurrent.puzzleAnswer;
        const isClose = correct.includes(userAnswer) || userAnswer.includes(correct) || userAnswer === correct;
        if (isClose) {
            cipherState.score += 12; cipherState.solved++;
            if (!cipherState.collection.find(x=>x.meaning===correct)) {
                const p = cipherBank.find(p=>p.answer===correct);
                cipherState.collection.push({cipher:p?p.symbols:'?', meaning:correct, time:Date.now(), by:'ai'});
            }
            cipherSave(); cipherShowResult(true, correct, '+12 ✦');
        } else {
            cipherState.score = Math.max(0, cipherState.score - 2); cipherSave();
            cipherShowResult(false, correct, '-2 ✦');
        }
    }

    function cipherShowResult(ok, answer, scoreText) {
        $('cp-r-icon').textContent = ok ? '🎉' : '😢';
        $('cp-r-title').textContent = ok ? 'Decoded!' : 'Not Quite...';
        $('cp-r-sub').textContent = ok ? '你准确地读懂了这份情绪' : '没关系，每种情绪都值得被理解';
        $('cp-r-answer').textContent = answer;
        const sc = $('cp-r-score');
        sc.textContent = scoreText;
        sc.className = 'cipher-result-score ' + (ok ? 'pos' : 'neg');
        $('cp-result').classList.add('active');
    }

    function cipherCloseResult() {
        $('cp-result').classList.remove('active');
        cipherNav('cp-menu');
    }

    function cipherRenderCodex() {
        const content = $('cp-codex');
        if (cipherState.collection.length === 0) {
            content.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-sub); font-size:12px; letter-spacing:2px;">VOID.</div>';
            return;
        }
        const sorted = [...cipherState.collection].sort((a,b)=>b.time-a.time);
        content.innerHTML = sorted.map(item => `
            <div class="cipher-collection-item">
                <div class="cipher-collection-emoji">${(item.cipher||'?').split('+')[0]}</div>
                <div class="cipher-collection-info">
                    <div class="cipher-collection-cipher">${item.cipher}</div>
                    <div class="cipher-collection-meaning">${item.meaning}</div>
                </div>
                <div class="cipher-collection-badge">${item.by==='user'?'ENCODED':'DECODED'}</div>
            </div>
        `).join('');
    }

    let cipherEditingIndex = -1;

    function cipherRenderBank() {
        $('cp-bank-count').textContent = cipherBank.length;
        $('cp-pool-count').textContent = cipherPool.length;
        $('cp-bank-list').innerHTML = cipherBank.length === 0
            ? '<div style="padding:16px; text-align:center; color:var(--text-sub); font-size:12px;">EMPTY</div>'
            : cipherBank.map((p,i) => `
                <div class="cipher-bank-item">
                    <div class="cipher-bank-sym">${p.symbols}</div>
                    <div class="cipher-bank-ans">${p.answer}</div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button class="cipher-bank-del" style="border-color:var(--text-main); color:var(--text-main);" onclick="cipherOpenEditModal(${i})">✎</button>
                        <button class="cipher-bank-del" onclick="cipherBank.splice(${i},1); cipherSave(); cipherRenderBank();">×</button>
                    </div>
                </div>
            `).join('');
        $('cp-pool-list').innerHTML = cipherPool.map((e,i) => `
            <div class="cipher-bank-item">
                <div class="cipher-bank-ans" style="min-width:0;">${e}</div>
                <button class="cipher-bank-del" onclick="cipherPool.splice(${i},1); cipherSave(); cipherRenderBank();">×</button>
            </div>
        `).join('');
    }

    function cipherAddToPool() {
        const inp = $('cp-pool-input');
        const v = inp.value.trim();
        if (!v) return;
        if (!cipherPool.includes(v)) { cipherPool.push(v); cipherSave(); }
        inp.value = '';
        cipherRenderBank();
    }

    function cipherOpenEditModal(index) {
        cipherEditingIndex = index;
        const modal = $('modal-cipher-add');
        const title = modal.querySelector('h3');
        if (index >= 0) {
            title.textContent = 'Edit Puzzle';
            const p = cipherBank[index];
            $('cp-add-symbols').value = p.symbols;
            $('cp-add-answer').value = p.answer;
            $('cp-add-hint').value = p.hint || '';
            $('cp-add-wrongs').value = (p.wrongs || []).join('\n');
        } else {
            title.textContent = 'Add Puzzle';
            $('cp-add-symbols').value = '';
            $('cp-add-answer').value = '';
            $('cp-add-hint').value = '';
            $('cp-add-wrongs').value = '';
        }
        modal.classList.add('show');
    }

    function cipherOpenAddModal() { cipherOpenEditModal(-1); }

    function cipherSavePuzzle() {
        const symbols = $('cp-add-symbols').value.trim();
        const answer = $('cp-add-answer').value.trim();
        const hint = $('cp-add-hint').value.trim();
        const wrongsRaw = $('cp-add-wrongs').value.trim();
        if (!symbols || !answer) { _ui_notify_('符号和答案必填'); return; }
        const wrongs = wrongsRaw.split('\n').map(s=>s.trim()).filter(s=>s);
        
        const puzzleData = {symbols, answer, hint:hint||'', wrongs};
        
        if (cipherEditingIndex >= 0) {
            cipherBank[cipherEditingIndex] = puzzleData;
        } else {
            cipherBank.push(puzzleData);
        }
        
        if (!cipherPool.includes(answer)) cipherPool.push(answer);
        wrongs.forEach(w => { if (!cipherPool.includes(w)) cipherPool.push(w); });
        cipherSave();
        $('modal-cipher-add').classList.remove('show');
        cipherRenderBank();
    }

    function cipherExportBank() {
        const data = {version:1,name:"情绪密码题库",exportedAt:new Date().toISOString(),puzzles:cipherBank,emotions:cipherPool};
        const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `emotion_cipher_bank_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function cipherImportBank(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.puzzles && Array.isArray(data.puzzles)) {
                    const before = cipherBank.length;
                    data.puzzles.forEach(p => {
                        if (p.symbols && p.answer && !cipherBank.find(x=>x.symbols===p.symbols)) cipherBank.push(p);
                    });
                    if (data.emotions && Array.isArray(data.emotions)) {
                        data.emotions.forEach(em => { if (!cipherPool.includes(em)) cipherPool.push(em); });
                    }
                    cipherSave(); cipherRenderBank();
                    _ui_notify_('导入成功！新增 ' + (cipherBank.length-before) + ' 道题目。');
                } else { _ui_notify_('文件格式不正确'); }
            } catch(err) { _ui_notify_('解析失败: '+err.message); }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    document.addEventListener('keydown', function(e) {
        if (e.target.id==='cp-word-input' && e.key==='Enter') { e.preventDefault(); cipherAddWord(); }
        if (e.target.id==='cp-pool-input' && e.key==='Enter') { e.preventDefault(); cipherAddToPool(); }
        if (e.target.id==='cp-free-decode' && e.key==='Enter') { e.preventDefault(); cipherFreeDecodeSubmit(); }
    });

    function toggleDarkMode(isDark) {
        if(isDark) document.body.classList.add('dark-mode');
        else document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', isDark);
    }

    function toggleNotch(isShow) {
        document.getElementById('dynamic-island').style.display = isShow ? 'flex' : 'none';
        localStorage.setItem('showNotch', isShow);
    }

    function toggleStatusBar(isShow) {
        document.getElementById('status-bar').style.display = isShow ? 'flex' : 'none';
        localStorage.setItem('showStatusBar', isShow);
    }

    function exportAllData() {
        const data = JSON.stringify(localStorage);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `月沉机数据_${Date.now()}.json`;
        a.click(); URL.revokeObjectURL(url); _ui_notify_('系统数据已导出');
    }

    function importAllData(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    localStorage.clear();
                    for (let key in data) { localStorage.setItem(key, data[key]); }
                    _ui_notify_('数据导入成功，即将重启系统');
                    setTimeout(() => location.reload(), 1500);
                } catch(err) { _ui_notify_('导入失败：文件格式不正确'); }
            };
            reader.readAsText(e.target.files[0]);
        }
    }

    function clearAllData() {
        if(confirm('警告：此操作将清空所有角色、聊天记录和设置！确定要格式化吗？')) {
            localStorage.clear();
            _ui_notify_('系统已格式化，即将重启');
            setTimeout(() => location.reload(), 1500);
        }
    }

    function toggleAppIconBg(isTransparent) {
        const icons = document.querySelectorAll('.app-icon');
        icons.forEach(icon => {
            if(isTransparent) {
                icon.dataset.oldBg = icon.style.background;
                icon.style.background = 'transparent';
                icon.style.boxShadow = 'none';
            } else {
                icon.style.background = icon.dataset.oldBg || '#fff';
                icon.style.boxShadow = '';
            }
        });
    }

    function handleWidgetBgUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width;
                    let h = img.height;
                    if (w > 800) { h = h * (800 / w); w = 800; }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    try {
                        const widget = document.getElementById('desktop-widget');
                        widget.style.backgroundImage = `url(${dataUrl})`;
                        localStorage.setItem('widgetBg', dataUrl);
                    } catch (err) {
                        _ui_notify_('图片依然过大，保存失败');
                    }
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    let longPressTimer;
    function startLongPress() {
        /* 延长长按判定的时间，降低正常点击发送时的误触概率 */
        longPressTimer = setTimeout(() => {
            toggleToolMenu();
        }, 800);
    }
    function endLongPress() {
        clearTimeout(longPressTimer);
    }

    function toggleToolMenu() {
        const menu = document.getElementById('tool-menu');
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeToolMenuOutside);
        } else {
            menu.classList.add('show');
            setTimeout(() => {
                document.addEventListener('click', closeToolMenuOutside);
            }, 10);
        }
    }

    function closeToolMenuOutside(e) {
        const menu = document.getElementById('tool-menu');
        if (!menu.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeToolMenuOutside);
        }
    }

    function triggerTool(type) {
        toggleToolMenu();
        if (!currentChatPersona) return _ui_notify_('请先选择聊天对象');
        
        switch(type) {
            case 'regenerate':
                if (messageHistory.length > 0 && messageHistory[messageHistory.length - 1].role === 'assistant') {
                    messageHistory.pop();
                    const chatBox = document.getElementById('chat-box');
                    if (chatBox.lastChild) chatBox.removeChild(chatBox.lastChild);
                    saveChatHistory();
                    triggerAIReply();
                } else {
                    _ui_notify_('没有可重回的AI消息');
                }
                break;
            case 'photo':
                if(confirm('点击【确定】选择真实相册，点击【取消】发送虚拟文字图')) {
                    $('real-album-upload').click();
                } else {
                    const txt = prompt('请输入虚拟文字图内容：');
                    if(txt) {
                        appendMessage({ type: 'text', content: `[虚拟图片: ${txt}]` }, 'user', messageHistory.length);
                        messageHistory.push({ role: 'user', content: `[发送了一张虚拟图片: ${txt}]` });
                        saveChatHistory(); triggerAIReply();
                    }
                }
                break;
            case 'camera':
                $('camera-upload').click();
                break;
            case 'voice_call':
                _ui_notify_('语音通话功能开发中');
                break;
            case 'transfer':
                const amount = prompt('请输入转账金额：');
                if(amount && !isNaN(amount)) {
                    confirmTransferSend(parseFloat(amount), 'balance');
                }
                break;
            case 'pat_pat':
                const patMsg = { type: 'pat_pat', sender: 'user', content: `("我"拍了拍"${currentChatPersona.name}")` };
                appendMessage(patMsg, 'user', messageHistory.length);
                messageHistory.push({ role: 'user', ...patMsg });
                saveChatHistory();
                triggerAIReply();
                break;
            case 'listen':
                /* 关闭聊天界面并打开音乐App */
                closeChatDetail();
                openApp();
                openMusicApp();
                _ui_notify_('已开启一起听，请选择歌曲');
                break;
            case 'location':
                _ui_notify_('位置功能开发中');
                break;
            case 'offline':
                /* 必须先打开线下故事编辑器，再关闭聊天界面，否则当前角色状态会被提前清空导致无法进入 */
                openOfflineEditor();
                closeChatDetail();
                break;
            case 'mars':
                _ui_notify_('火星模式开发中');
                break;
            case 'read':
                _ui_notify_('一起看书功能开发中');
                break;
            case 'format':
                let lastAiIdx = -1;
                for(let i = messageHistory.length - 1; i >= 0; i--) {
                    if(messageHistory[i].role === 'assistant' && messageHistory[i].type === 'text') { lastAiIdx = i; break; }
                }
                if(lastAiIdx !== -1) {
                    let text = messageHistory[lastAiIdx].content;
                    text = text.replace(/\n{3,}/g, '\n\n').replace(/“\s+/g, '“').replace(/\s+”/g, '”').trim();
                    messageHistory[lastAiIdx].content = text;
                    saveChatHistory();
                    renderChatBox();
                    _ui_notify_('已自动优化上一条AI消息的排版');
                } else {
                    _ui_notify_('没有找到AI文本消息');
                }
                break;
            case 'sticker':
                const panel = $('sticker-panel');
                if (panel.style.display === 'none' || panel.style.display === '') {
                    panel.style.display = 'flex';
                    renderStickerGroups();
                } else {
                    panel.style.display = 'none';
                }
                break;
            case 'mind':
                generateMindCard();
                break;
        }
    }
    /* 线下模式核心逻辑与状态 */
    let offlineBranches = JSON.parse(localStorage.getItem('offlineBranches')) || [{ id: 'root', name: '主线剧情', history: [], summary: '故事的起点' }];
    let currentOfflineBranchId = localStorage.getItem('currentOfflineBranchId') || 'root';
    let offlineTokenCount = 0;
    let offlinePerspective = '1st';
    let offlineRoomEntities = [];
    let activeOfflineMsgIndex = -1;
    let isOfflineReplying = false;
    let offlineBannedWordsList = JSON.parse(localStorage.getItem('offlineBannedWordsList')) || [];

    /* 动态时间戳 */
    setInterval(() => {
        const el = $('offline-live-time');
        if (el && $('offline-editor').classList.contains('open')) {
            const now = new Date();
            el.textContent = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        }
    }, 1000);

    /* 侧边栏开关逻辑 */
    function openOfflineDrawer(side) {
        $('offline-drawer-overlay').classList.add('show');
        if (side === 'left') {
            $('offline-left-drawer').classList.add('open');
            renderOfflineBranches();
        }
        if (side === 'right') {
            $('offline-right-drawer').classList.add('open');
            renderOfflineSettings();
        }
    }

    function closeOfflineDrawers() {
        $('offline-drawer-overlay').classList.remove('show');
        $('offline-left-drawer').classList.remove('open');
        $('offline-right-drawer').classList.remove('open');
    }

    function openOfflineEditor() {
        if (!currentChatPersona) return _ui_notify_('请先选择一个角色进入线下模式');
        window.offlinePersona = currentChatPersona; // 缓存角色，防止被清空
        document.getElementById('offline-editor').classList.add('open');
        
        $('offline-chapter-title').textContent = window.offlinePersona.name.toUpperCase();

        const savedBg = localStorage.getItem('offlineBg');
        if (savedBg) $('offline-bg-layer').style.backgroundImage = `url(${savedBg})`;
        const savedBlur = localStorage.getItem('offlineBgBlur');
        if (savedBlur) { $('offline-bg-blur').value = savedBlur; $('offline-bg-layer').style.filter = `blur(${savedBlur}px)`; }
        const savedFontSize = localStorage.getItem('offlineFontSize');
        if (savedFontSize) { $('offline-font-size').value = savedFontSize; $('offline-stage').style.fontSize = `${savedFontSize}px`; }

        if (offlineRoomEntities.length === 0) {
            offlineRoomEntities.push(window.offlinePersona.id);
        }
        
        let currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
        if (!currentBranch) {
            currentBranch = offlineBranches[0];
            currentOfflineBranchId = currentBranch.id;
        }

        if (currentBranch.history.length === 0) {
            currentBranch.history.push({
                role: 'system',
                speaker: 'SYSTEM / 旁白',
                content: `故事开始了。你与 ${window.offlinePersona.name} 处于同一个时空。`
            });
            saveOfflineData();
        }
        renderOfflineStage();
    }

    function closeOfflineEditor() {
        document.getElementById('offline-editor').classList.remove('open');
        saveOfflineData();
    }

    function saveOfflineData() {
        localStorage.setItem('offlineBranches', JSON.stringify(offlineBranches));
        localStorage.setItem('currentOfflineBranchId', currentOfflineBranchId);
        localStorage.setItem('offlineBannedWordsList', JSON.stringify(offlineBannedWordsList));
    }

    /* 渲染线下舞台与长按菜单绑定 */
    function renderOfflineStage() {
        const stage = document.getElementById('offline-stage');
        const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
        
        let html = currentBranch.history.map((msg, index) => `
            <div class="offline-paragraph ${msg.role === 'system' ? 'system-msg' : ''}" id="off-msg-${index}">
                <div class="offline-speaker">${msg.speaker}</div>
                <div>${msg.content}</div>
            </div>
        `).join('');

        if (isOfflineReplying) {
            html += `
            <div class="offline-paragraph">
                <div class="offline-speaker">${window.offlinePersona ? window.offlinePersona.name : 'AI'}</div>
                <div style="color: var(--text-sub); font-style: italic;">正在构思中...</div>
            </div>`;
        }
        
        stage.innerHTML = html;
        
        const showOfflineMenu = (e, index) => {
            activeOfflineMsgIndex = index;
            const menu = $('offline-context-menu');
            let x = e.touches ? e.touches[0].clientX : e.clientX;
            let y = e.touches ? e.touches[0].clientY : e.clientY;
            
            const screenRect = document.querySelector('.screen').getBoundingClientRect();
            x = x - screenRect.left;
            y = y - screenRect.top;
            
            if (x + 100 > screenRect.width) x = screenRect.width - 110;
            if (y + 120 > screenRect.height) y = screenRect.height - 130;
            if (x < 10) x = 10;
            if (y < 10) y = 10;
            
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
            menu.classList.add('show');
        };

        currentBranch.history.forEach((msg, index) => {
            const el = document.getElementById(`off-msg-${index}`);
            if (!el) return;
            let pressTimer;
            const startPress = (e) => {
                pressTimer = setTimeout(() => {
                    showOfflineMenu(e, index);
                }, 500);
            };
            const cancelPress = () => clearTimeout(pressTimer);
            el.addEventListener('touchstart', startPress, {passive: true});
            el.addEventListener('touchend', cancelPress);
            el.addEventListener('mousedown', startPress);
            el.addEventListener('mouseup', cancelPress);
            el.addEventListener('mouseleave', cancelPress);
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showOfflineMenu(e, index);
            });
        });

        stage.scrollTo({ top: stage.scrollHeight, behavior: 'smooth' });
        document.getElementById('offline-token-count').textContent = `TOKEN: ${offlineTokenCount}`;
        document.getElementById('drawer-token-count').textContent = offlineTokenCount;
    }

    /* 长按菜单操作 */
    function handleOfflineAction(action) {
        $('offline-context-menu').classList.remove('show');
        if (activeOfflineMsgIndex < 0) return;
        const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
        
        if (action === 'edit') {
            const msg = currentBranch.history[activeOfflineMsgIndex];
            showCustomPrompt('编辑剧情内容:', msg.content, newText => {
                if (newText) {
                    msg.content = newText;
                    saveOfflineData();
                    renderOfflineStage();
                }
            });
        } else if (action === 'delete') {
            currentBranch.history.splice(activeOfflineMsgIndex, 1);
            saveOfflineData();
            renderOfflineStage();
        } else if (action === 'reroll') {
            // 修复重回逻辑：仅删除当前消息，然后重新生成
            currentBranch.history.splice(activeOfflineMsgIndex, 1);
            saveOfflineData();
            renderOfflineStage();
            triggerOfflineAI();
        } else if (action === 'polish') {
            const msg = currentBranch.history[activeOfflineMsgIndex];
            const originalContent = msg.content;
            msg.content = originalContent + '\n\n<span style="color:var(--text-sub); font-style:italic;">[系统：正在请求API润色...]</span>';
            renderOfflineStage();
            
            callOfflineToolAPI(`请润色以下这段小说文本，使其更加生动、细腻，符合当前的文风设定。只输出润色后的文本，不要有任何多余的解释：\n\n${originalContent}`).then(res => {
                if(res) { msg.content = res; saveOfflineData(); renderOfflineStage(); _ui_notify_('润色完成'); }
                else { msg.content = originalContent; renderOfflineStage(); _ui_notify_('润色失败'); }
            });
        } else if (action === 'change_perspective') {
            const msg = currentBranch.history[activeOfflineMsgIndex];
            const originalContent = msg.content;
            msg.content = originalContent + '\n\n<span style="color:var(--text-sub); font-style:italic;">[系统：正在请求API调整视角...]</span>';
            renderOfflineStage();
            
            let pText = offlinePerspective === '1st' ? '第一人称(我)' : (offlinePerspective === '2nd' ? '第二人称(你)' : '第三人称(TA)');
            callOfflineToolAPI(`请将以下这段小说文本的叙事视角转换为${pText}视角。只输出转换后的文本，不要有任何多余的解释：\n\n${originalContent}`).then(res => {
                if(res) { msg.content = res; saveOfflineData(); renderOfflineStage(); _ui_notify_('视角调整完成'); }
                else { msg.content = originalContent; renderOfflineStage(); _ui_notify_('视角调整失败'); }
            });
        }
    }

    document.addEventListener('click', (e) => {
        const menu = $('offline-context-menu');
        if (menu.classList.contains('show') && !menu.contains(e.target)) {
            menu.classList.remove('show');
        }
    });

    /* 分支管理逻辑 */
    function renderOfflineBranches() {
        const tree = $('offline-branch-tree');
        tree.innerHTML = offlineBranches.map(b => `
            <div class="branch-node ${b.id === currentOfflineBranchId ? 'active' : ''} ${b.id !== 'root' ? 'child-node' : ''}" onclick="switchOfflineBranch('${b.id}')">
                <div class="node-line"></div>
                <div class="node-dot"></div>
                <div class="node-content">
                    <div class="node-header">
                        <span class="node-toggle" style="visibility: ${b.id === 'root' ? 'visible' : 'hidden'};">▾</span>
                        <span class="node-name" ondblclick="renameOfflineBranch(event, '${b.id}')">${b.name}</span>
                        <span class="node-add" onclick="createOfflineBranch(event, '${b.id}')">⊕</span>
                        ${b.id !== 'root' ? `<span class="node-add" style="color:#ff3b30; margin-left:8px;" onclick="deleteOfflineBranch(event, '${b.id}')">×</span>` : ''}
                    </div>
                    <div class="node-summary">${b.summary}</div>
                </div>
            </div>
        `).join('');
    }

    function switchOfflineBranch(id) {
        currentOfflineBranchId = id;
        saveOfflineData();
        renderOfflineBranches();
        renderOfflineStage();
        closeOfflineDrawers();
    }

    function createOfflineBranch(e, parentId) {
        if (e) e.stopPropagation();
        const parentBranch = offlineBranches.find(b => b.id === (parentId || currentOfflineBranchId));
        const newId = 'branch_' + Date.now();
        const newBranch = {
            id: newId,
            name: '平行分支',
            history: JSON.parse(JSON.stringify(parentBranch.history)),
            summary: '从节点分化的新世界'
        };
        offlineBranches.push(newBranch);
        currentOfflineBranchId = newId;
        saveOfflineData();
        renderOfflineBranches();
        renderOfflineStage();
        _ui_notify_('已创建并切换至新分支');
    }

    function renameOfflineBranch(e, id) {
        e.stopPropagation();
        const branch = offlineBranches.find(b => b.id === id);
        showCustomPrompt('重命名分支:', branch.name, newName => {
            if (newName) {
                branch.name = newName;
                saveOfflineData();
                renderOfflineBranches();
            }
        });
    }

    function deleteOfflineBranch(e, id) {
        e.stopPropagation();
        if (id === 'root') return;
        if (confirm('确定删除此分支吗？')) {
            offlineBranches = offlineBranches.filter(b => b.id !== id);
            if (currentOfflineBranchId === id) currentOfflineBranchId = 'root';
            saveOfflineData();
            renderOfflineBranches();
            renderOfflineStage();
        }
    }

    /* 右侧设定管理逻辑 */
    function renderOfflineSettings() {
        renderOfflineStyles();
        updateWbSelectOptions('offline-worldbook-select', '');
        
        // 恢复保存的设置
        const savedSettings = JSON.parse(localStorage.getItem('offlineSettings')) || {};
        if ($('offline-auto-sum-toggle')) $('offline-auto-sum-toggle').checked = !!savedSettings.autoSumToggle;
        if ($('offline-auto-sum-count')) $('offline-auto-sum-count').value = savedSettings.autoSumCount || 50;
        if ($('offline-online-ctx')) $('offline-online-ctx').value = savedSettings.onlineCtx || 0;
        if ($('offline-offline-ctx')) $('offline-offline-ctx').value = savedSettings.offlineCtx || 0;
        if ($('offline-word-count')) $('offline-word-count').value = savedSettings.wordCount || '';
        if ($('offline-writing-style') && savedSettings.style) $('offline-writing-style').value = savedSettings.style;
        if ($('offline-worldbook-select') && savedSettings.worldbook) $('offline-worldbook-select').value = savedSettings.worldbook;

        const p = window.offlinePersona;
        const wbId = p ? p.worldbookId : null;
        const wb = worldbooks.find(w => String(w.id) === String(wbId));
        $('offline-lore-display').textContent = wb ? `当前绑定: ${wb.name}` : '当前绑定: 无';
        
        $('room-entities-list').innerHTML = offlineRoomEntities.map(id => {
            const per = myPersonas.find(x => String(x.id) === String(id));
            if (!per) return '';
            return `
                <div class="entity-item">
                    <div class="entity-avatar">${per.avatar ? `<img src="${per.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : per.name.charAt(0)}</div>
                    <span class="entity-name">${per.name}</span>
                </div>
            `;
        }).join('');

        renderOfflineBannedTags();
    }

    function handleBannedWordInput(el) {
        if (el.value.includes(',') || el.value.includes('，')) {
            const words = el.value.split(/,|，/);
            words.forEach(w => {
                const word = w.trim();
                if (word && !offlineBannedWordsList.includes(word)) {
                    offlineBannedWordsList.push(word);
                }
            });
            saveOfflineData();
            renderOfflineBannedTags();
            el.value = '';
        }
    }

    function addOfflineBannedWord() {
        // 保留原函数以防其他地方调用
        handleBannedWordInput($('offline-banned-input'));
    }

    function removeOfflineBannedWord(word) {
        offlineBannedWordsList = offlineBannedWordsList.filter(w => w !== word);
        saveOfflineData();
        renderOfflineBannedTags();
    }

    function renderOfflineBannedTags() {
        const container = $('offline-banned-tags');
        if (!container) return;
        container.innerHTML = offlineBannedWordsList.map(w => `
            <span style="font-size:10px; padding:2px 8px; border:1px solid var(--glass-border); border-radius:12px; color:var(--text-sub); cursor:pointer;" onclick="removeOfflineBannedWord('${w}')">${w} ×</span>
        `).join('');
    }

    function handleOfflineBgUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                $('offline-bg-layer').style.backgroundImage = `url(${ev.target.result})`;
                localStorage.setItem('offlineBg', ev.target.result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }
    function updateOfflineBgBlur(val) {
        $('offline-bg-layer').style.filter = `blur(${val}px)`;
        localStorage.setItem('offlineBgBlur', val);
    }
    function updateOfflineFontSize(val) {
        $('offline-stage').style.fontSize = `${val}px`;
        localStorage.setItem('offlineFontSize', val);
    }

    function switchPerspective(type) {
        offlinePerspective = type;
        ['1st', '2nd', '3rd'].forEach(t => {
            const el = $(`ptab-${t}`);
            if (el) {
                if (t === type) el.classList.add('active');
                else el.classList.remove('active');
            }
        });
    }

    let offlineStyles = JSON.parse(localStorage.getItem('offlineStyles')) || [
        {id: 'default', name: '默认', content: '使用标准的现代小说文笔。'}, 
        {id: 'ancient', name: '古风', content: '使用古代言情小说的文笔，辞藻华丽，带有古风韵味。'}, 
        {id: 'cyberpunk', name: '赛博朋克', content: '使用赛博朋克风格，充满科技感、霓虹灯、机械与颓废的描写。'}
    ];

    function renderOfflineStyles() {
        const selectEl = $('offline-writing-style');
        if (!selectEl) return;
        const currentVal = selectEl.value || 'default';
        selectEl.innerHTML = offlineStyles.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        if (offlineStyles.find(s => s.id === currentVal)) selectEl.value = currentVal;
    }

    function manageOfflineStyles() {
        const options = offlineStyles.map(s => ({label: s.name + (s.id==='default'?'(不可删)':''), value: s.id}));
        options.push({label: '创建新文风', value: 'new'});
        
        showCustomSelect('管理文风 (选择以编辑/删除)', options, val => {
            if (val === 'new') {
                editOfflineStyle(null);
            } else {
                editOfflineStyle(val);
            }
        });
    }

    function editOfflineStyle(id) {
        const style = id ? offlineStyles.find(s => s.id === id) : {id: 'style_' + Date.now(), name: '', content: ''};
        if (!style) return;
        
        const modal = $('custom-edit-modal');
        const textarea = $('custom-edit-textarea');
        const confirmBtn = $('custom-edit-confirm');
        
        $('custom-edit-title').textContent = id ? `编辑文风: ${style.name}` : '创建新文风';
        
        // 借用 textarea 弹窗，第一行作为名称，后面作为内容
        textarea.value = `名称: ${style.name}\n---\n${style.content}`;
        
        confirmBtn.onclick = () => {
            const text = textarea.value;
            const parts = text.split('\n---\n');
            const nameMatch = parts[0].match(/名称:\s*(.*)/);
            const newName = nameMatch ? nameMatch[1].trim() : '未命名文风';
            const newContent = parts[1] ? parts[1].trim() : '';
            
            if (id === 'default') {
                style.content = newContent; // 默认文风只允许改内容
            } else {
                style.name = newName;
                style.content = newContent;
                if (!id) offlineStyles.push(style);
            }
            
            localStorage.setItem('offlineStyles', JSON.stringify(offlineStyles));
            renderOfflineStyles();
            saveOfflineSettings();
            modal.classList.remove('show');
            _ui_notify_('文风已保存');
        };
        
        // 如果不是默认文风，添加删除按钮功能
        if (id && id !== 'default') {
            const delBtn = document.createElement('button');
            delBtn.className = 'glass-btn-rect';
            delBtn.style.color = '#ff3b30';
            delBtn.style.borderColor = '#ff3b30';
            delBtn.textContent = '删除此文风';
            delBtn.onclick = () => {
                if(confirm('确定删除此文风吗？')) {
                    offlineStyles = offlineStyles.filter(s => s.id !== id);
                    localStorage.setItem('offlineStyles', JSON.stringify(offlineStyles));
                    renderOfflineStyles();
                    saveOfflineSettings();
                    modal.classList.remove('show');
                    delBtn.remove();
                }
            };
            // 临时插入删除按钮
            confirmBtn.parentNode.insertBefore(delBtn, confirmBtn);
            // 弹窗关闭时清理临时按钮
            const observer = new MutationObserver(() => {
                if (!modal.classList.contains('show')) { delBtn.remove(); observer.disconnect(); }
            });
            observer.observe(modal, {attributes: true, attributeFilter: ['class']});
        }
        
        modal.classList.add('show');
    }

    function saveOfflineSettings() {
        const settings = {
            autoSumToggle: $('offline-auto-sum-toggle') ? $('offline-auto-sum-toggle').checked : false,
            autoSumCount: $('offline-auto-sum-count') ? $('offline-auto-sum-count').value : 50,
            onlineCtx: $('offline-online-ctx') ? $('offline-online-ctx').value : 0,
            offlineCtx: $('offline-offline-ctx') ? $('offline-offline-ctx').value : 0,
            wordCount: $('offline-word-count') ? $('offline-word-count').value : '',
            style: $('offline-writing-style') ? $('offline-writing-style').value : 'default',
            worldbook: $('offline-worldbook-select') ? $('offline-worldbook-select').value : ''
        };
        localStorage.setItem('offlineSettings', JSON.stringify(settings));
        _ui_notify_('设定已保存');
    }

    function clearOfflineHistory() {
        if (confirm('确定要清空当前分支的所有记录吗？')) {
            const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
            if (currentBranch) {
                currentBranch.history = [];
                saveOfflineData();
                renderOfflineStage();
                _ui_notify_('记录已清空');
            }
        }
    }

    let mindHeartTimer = null;
    async function generateMindCard() {
        if (!currentChatPersona) return;
        const p = currentChatPersona;
        
        /* 强制立即显示卡片UI */
        $('mind-avatar').src = p.avatar || '';
        $('mind-name').textContent = p.name;
        $('mind-sign').textContent = p.desc || 'No Signature';
        $('mind-card-modal').classList.add('show');

        /* 如果已经有缓存的心声（跟随回复生成的），直接显示，不再请求 */
        if (p.latestMind) {
            $('mind-affection').textContent = p.latestMind.affection || '50%';
            $('mind-appearance').textContent = p.latestMind.appearance || '...';
            $('mind-voice').textContent = p.latestMind.voice || '...';
            $('mind-fantasy').textContent = p.latestMind.fantasy || '...';
            startHeartBeat(p.latestMind.affection);
            return;
        }

        $('mind-affection').textContent = '...';
        $('mind-appearance').textContent = '正在感知中...';
        $('mind-voice').textContent = '正在聆听内心深处的声音...';
        $('mind-fantasy').textContent = '正在窥探...';
        
        const _u = p.apiUrl || localStorage.getItem('apiUrl');
        const _k = p.apiKey || localStorage.getItem('apiKey');
        const _m = p.apiModel || localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
        const prompt = `请根据当前的聊天上下文，分析你（${p.name}）当前的状态。返回纯净JSON：{"affection": "85%", "appearance": "穿着打扮和动作", "voice": "内心真实想法", "fantasy": "隐秘幻想"}`;

        try {
            const res = await fetch(_u.replace(/\/$/, '') + (_u.endsWith('/chat/completions') ? '' : '/chat/completions'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_k}` },
                body: JSON.stringify({ model: _m, messages: [{role: 'system', content: p.prompt}, {role: 'user', content: prompt}], temperature: 0.8 })
            });
            const data = await res.json();
            const result = JSON.parse(data.choices[0].message.content.trim().replace(/```json|```/g, '').trim());
            
            p.latestMind = result; /* 存入缓存 */
            $('mind-affection').textContent = result.affection || '50%';
            $('mind-appearance').textContent = result.appearance || '...';
            $('mind-voice').textContent = result.voice || '...';
            $('mind-fantasy').textContent = result.fantasy || '...';
            startHeartBeat(result.affection);
        } catch (e) {
            $('mind-voice').textContent = '感知失败，对方的心门紧闭。';
        }
    }

    function startHeartBeat(affectionStr) {
        if (mindHeartTimer) clearInterval(mindHeartTimer);
        mindHeartTimer = setInterval(() => {
            const base = parseInt(affectionStr) || 75;
            const fluctuation = Math.floor(Math.random() * 10) - 5;
            $('mind-heart-rate').textContent = base + fluctuation;
        }, 1000);
    }

    /* 静默生成心声（在AI回复后调用） */
    async function generateMindCardSilent(p) {
        if (!p) return;
        const _u = p.apiUrl || localStorage.getItem('apiUrl');
        const _k = p.apiKey || localStorage.getItem('apiKey');
        const _m = p.apiModel || localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
        const prompt = `请根据刚刚的对话，分析你（${p.name}）当前的状态。返回纯净JSON：{"affection": "85%", "appearance": "穿着打扮和动作", "voice": "内心真实想法", "fantasy": "隐秘幻想"}`;
        try {
            const res = await fetch(_u.replace(/\/$/, '') + (_u.endsWith('/chat/completions') ? '' : '/chat/completions'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_k}` },
                body: JSON.stringify({ model: _m, messages: [{role: 'system', content: p.prompt}, {role: 'user', content: prompt}], temperature: 0.8 })
            });
            const data = await res.json();
            p.latestMind = JSON.parse(data.choices[0].message.content.trim().replace(/```json|```/g, '').trim());
        } catch (e) {}
    }

    function closeMindCard() {
        $('mind-card-modal').classList.remove('show');
        if (mindHeartTimer) clearInterval(mindHeartTimer);
    }

    function triggerOfflineManualSum() {
        _ui_notify_('手动总结已触发 (开发中)');
    }

    function inviteOfflineEntity() {
        const options = myPersonas.filter(p => !offlineRoomEntities.includes(p.id)).map(p => ({label: p.name, value: p.id}));
        if (options.length === 0) return _ui_notify_('没有可邀请的角色了');
        showCustomSelect('邀请角色加入房间', options, val => {
            offlineRoomEntities.push(val);
            renderOfflineSettings();
            const invitedP = myPersonas.find(x => String(x.id) === String(val));
            if (invitedP) {
                _ui_notify_(`正在生成 ${invitedP.name} 的出场描写...`);
                callOfflineToolAPI(`角色 "${invitedP.name}" 刚刚进入了当前的场景。请根据一般的剧情逻辑，写一段简短的小说描写（50字左右），描述TA是如何自然地出场或加入进来的。只输出描写文本，不要有任何多余解释。`).then(res => {
                    if(res) {
                        const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
                        currentBranch.history.push({ role: 'system', speaker: '旁白', content: res });
                        saveOfflineData(); renderOfflineStage();
                    }
                });
            }
        });
    }

    /* 发送线下消息 */
    async function sendOfflineMessage() {
        if (isOfflineReplying) return;
        const input = document.getElementById('offline-input');
        const text = input.value.trim();
        
        if (text) {
            const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
            const maskId = window.offlinePersona ? window.offlinePersona.maskId : null;
            const mask = myMasks.find(m => String(m.id) === String(maskId)) || myMasks[0] || {name: '我'};
            
            currentBranch.history.push({
                role: 'user',
                speaker: mask.name.toUpperCase(),
                content: text
            });
            input.value = '';
            offlineTokenCount += text.length;
            saveOfflineData();
            renderOfflineStage();
        }

        await triggerOfflineAI();
    }

    /* 线下模式通用 API 调用工具 */
    async function callOfflineToolAPI(promptText) {
        const p = window.offlinePersona;
        if (!p) { _ui_notify_("未选择角色，无法调用API"); return null; }
        const _u = p.apiUrl || localStorage.getItem('apiUrl');
        const _k = p.apiKey || localStorage.getItem('apiKey');
        const _m = p.apiModel || localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
        if (!_u || !_k) { _ui_notify_("请先配置API"); return null; }
        try {
            const res = await fetch(_u.replace(/\/$/, '') + (_u.endsWith('/chat/completions') ? '' : '/chat/completions'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_k}` },
                body: JSON.stringify({ model: _m, messages: [{role: 'user', content: promptText}], temperature: 0.7 })
            });
            const data = await res.json();
            return data.choices[0]?.message?.content?.trim();
        } catch (e) {
            _ui_notify_('API调用失败: ' + e.message);
            return null;
        }
    }

    /* 线下模式 AI 响应逻辑 */
    async function triggerOfflineAI() {
        if (isOfflineReplying) return;
        const p = window.offlinePersona;
        if (!p) return _ui_notify_("未选择角色，无法生成");

        const _u = p.apiUrl || localStorage.getItem('apiUrl');
        const _k = p.apiKey || localStorage.getItem('apiKey');
        const _m = p.apiModel || localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
        
        if (!_u || !_k) return _ui_notify_("请先配置API");

        isOfflineReplying = true;
        renderOfflineStage();

        const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
        const styleId = $('offline-writing-style') ? $('offline-writing-style').value : 'default';
        const styleObj = offlineStyles.find(s => s.id === styleId) || offlineStyles[0];
        const wordCount = $('offline-word-count') ? $('offline-word-count').value.trim() : '';
        
        let perspectiveText = "第一人称（我）";
        if (offlinePerspective === '2nd') perspectiveText = "第二人称（你）";
        if (offlinePerspective === '3rd') perspectiveText = "第三人称（他/她）";

        let styleText = styleObj.content ? `【文风要求】：${styleObj.content}` : "";
        let bannedText = offlineBannedWordsList.length > 0 ? `绝对禁止在回复中使用以下词汇：${offlineBannedWordsList.join(',')}。` : "";
        let wordCountText = wordCount ? `请写大约 ${wordCount}。` : "";

        const savedSettings = JSON.parse(localStorage.getItem('offlineSettings')) || {};
        const wbId = savedSettings.worldbook || p.worldbookId;
        let wbText = '';
        if (wbId) {
            if (wbId.startsWith('group_')) {
                const gId = wbId.replace('group_', '');
                const groupWbs = worldbooks.filter(w => w.groupId === gId);
                wbText = `世界观设定：\n` + groupWbs.map(w => w.content).join('\n') + '\n';
            } else if (wbId.startsWith('wb_')) {
                const wId = wbId.replace('wb_', '');
                const wb = worldbooks.find(w => String(w.id) === String(wId));
                if (wb) wbText = `世界观设定：${wb.content}\n`;
            }
        }

        const sysPrompt = `你就是"${p.name}"本人，这不是角色扮演，你就是TA。
你的详细设定：${p.prompt}
${wbText}
请根据当前的剧情上下文，以小说的口吻描写你的动作、神态和语言。
【强制输出格式要求】
1. 使用${perspectiveText}视角进行叙述。${styleText} ${bannedText} ${wordCountText}
2. 描写和对话必须完全分离，绝对不能写在同一段！
3. 格式必须严格如下：
(这里写环境、动作、神态等描写，绝对不要包含任何对话)
“这里写说话的内容”
(这里写后续的动作描写)
“这里写继续说话的内容”
4. 注意：对话必须用双引号包裹，且单独成段！描写段落中绝对不能出现双引号和对话！
5. 绝对不要出现“AI”、“系统”、“程序”等字眼。`;
        
        const payloadMessages = [{ role: 'system', content: sysPrompt }];
        
        // 上下文截断逻辑
        let onlineCtxCount = parseInt($('offline-online-ctx') ? $('offline-online-ctx').value : 0) || 0;
        let offlineCtxCount = parseInt($('offline-offline-ctx') ? $('offline-offline-ctx').value : 0) || 0;
        
        if (onlineCtxCount > 0 && allChats[p.id]) {
            const onlineMsgs = allChats[p.id].slice(-onlineCtxCount);
            onlineMsgs.forEach(msg => {
                if (msg.type === 'text') payloadMessages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
            });
        }

        let historyToUse = currentBranch.history;
        if (offlineCtxCount > 0 && historyToUse.length > offlineCtxCount) {
            historyToUse = historyToUse.slice(-offlineCtxCount);
        }

        historyToUse.forEach(msg => {
            payloadMessages.push({ role: msg.role === 'system' ? 'system' : (msg.role === 'user' ? 'user' : 'assistant'), content: msg.content });
        });

        try {
            const res = await fetch(_u.replace(/\/$/, '') + (_u.endsWith('/chat/completions') ? '' : '/chat/completions'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_k}` },
                body: JSON.stringify({ model: _m, messages: payloadMessages, temperature: 0.8 })
            });
            
            const data = await res.json();
            const reply = data.choices[0]?.message?.content?.trim();
            
            if (!reply) throw new Error("返回内容为空");

            currentBranch.history.push({
                role: 'ai',
                speaker: `${p.name}`,
                content: reply
            });
            offlineTokenCount += reply.length;
            saveOfflineData();
        } catch (e) {
            _ui_notify_('推演失败: ' + e.message + '。请重试。');
            const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
            currentBranch.history.push({
                role: 'system',
                speaker: '系统提示',
                content: `[推演异常] ${e.message}。请检查API配置或网络后，点击底部"继续推演"重试。`
            });
            saveOfflineData();
        } finally {
            isOfflineReplying = false;
            renderOfflineStage();
        }
    }

    /* 添加旁白功能 */
    function addOfflineSystemMsg() {
        showCustomPrompt('输入旁白内容:', '', text => {
            if (text) {
                const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
                currentBranch.history.push({
                    role: 'system',
                    speaker: '旁白',
                    content: text
                });
                saveOfflineData();
                renderOfflineStage();
            }
        });
    }

    /* 命运骰子功能 */
    function offlineRollDice() {
        const result = Math.floor(Math.random() * 20) + 1;
        let status = "普通成功";
        if (result >= 18) status = "大成功";
        if (result <= 5) status = "失败";
        if (result === 1) status = "大失败";

        const currentBranch = offlineBranches.find(b => b.id === currentOfflineBranchId);
        currentBranch.history.push({
            role: 'system',
            speaker: 'DICE / 命运检定',
            content: `[系统检定] 掷出了 D20 骰子，结果为：${result} (${status})。`
        });
        saveOfflineData();
        renderOfflineStage();
    }
    function goHome() {
        if (document.getElementById('offline-editor')) document.getElementById('offline-editor').classList.remove('open');
        $('app-window').classList.remove('open'); 
        $('settings-app-window').classList.remove('open');
        $('worldbook-app-window').classList.remove('open');
        $('theme-app-window').classList.remove('open');
        $('emotion-app-window').classList.remove('open');
        $('memory-app-window').classList.remove('open');
        $('wallet-app-window').classList.remove('open');
        $('takeout-app-window').classList.remove('open');
        closeChatDetail();
        document.querySelectorAll('.sub-view').forEach(v => v.classList.remove('open'));
        $('music-app-window').classList.remove('open');
        $('status-bar').style.color = '#fff'; 
        $('status-bar').style.textShadow = '0 1px 2px rgba(0,0,0,0.2)';
        const menu = document.getElementById('tool-menu');
        if (menu) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeToolMenuOutside);
        }
    }

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active')); 
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            this.classList.add('active'); 
            const target = this.getAttribute('data-target');
            $(target).classList.add('active');
            $('app-title').textContent = this.getAttribute('data-title');
            
            // 控制右上角加号仅在微信和通讯录显示
            const addBtn = $('wechat-add-btn');
            if (addBtn) {
                if (target === 'view-chats' || target === 'view-list') {
                    addBtn.style.display = 'flex';
                } else {
                    addBtn.style.display = 'none';
                }
            }
        });
    });

    function openSubView(id) { $(id).classList.add('open'); }
    function closeSubView(id) { $(id).classList.remove('open'); }

    // ================= 数据存储与初始化 =================
    let myMasks = [], myPersonas = [], apiPresets = [];
    let userAvatarDataUrl = localStorage.getItem('userAvatar') || '';
    let currentChatPersona = null, messageHistory = [];
    let currentPresetId = localStorage.getItem('currentPresetId') || null;
    let allChats = JSON.parse(localStorage.getItem('allChats')) || {};
    let fontPresets = JSON.parse(localStorage.getItem('fontPresets')) || [];
    let currentFontPresetId = localStorage.getItem('currentFontPresetId') || null;
    let tempFontDataUrl = '';
    
    // 世界书与表情包数据结构
    let worldbooks = JSON.parse(localStorage.getItem('worldbooks')) || [];
    let wbGroups = JSON.parse(localStorage.getItem('wbGroups')) || [{id: 'default', name: '默认分组'}];
    let stickers = JSON.parse(localStorage.getItem('stickers')) || [];
    let stickerGroups = JSON.parse(localStorage.getItem('stickerGroups')) || [{id: 'default', name: '默认表情'}];
    let isStickerManageMode = false;
    let selectedStickers = new Set();

    function saveChatHistory() {
        if(!currentChatPersona) return;
        allChats[currentChatPersona.id] = messageHistory;
        localStorage.setItem('allChats', JSON.stringify(allChats));
        renderRecentChats();
    }

    function renderRecentChats() {
        const container = $('recent-chats-container');
        container.innerHTML = '';
        let hasChats = false;
                let sortedPersonas = [...myPersonas].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        sortedPersonas.forEach(p => {
            const history = allChats[p.id];
            if(history && history.length > 1) {
                hasChats = true;
                // 强制解析最后一条消息，处理拍一拍等特殊格式
                let lastMsgObj = history[history.length - 1];
                let lastMsg = "";
                if (lastMsgObj.type === 'pat_pat') {
                    lastMsg = lastMsgObj.sender === 'user' ? '"我" 拍了拍对方' : '对方拍了拍 "我"';
                } else if (lastMsgObj.type === 'image') {
                    lastMsg = '[图片]';
                } else if (lastMsgObj.type === 'ticket') {
                    lastMsg = '[票根]';
                } else if (lastMsgObj.type === 'transfer') {
                    lastMsg = '[转账]';
                } else if (typeof lastMsgObj.content === 'string') {
                    lastMsg = lastMsgObj.content;
                } else {
                    lastMsg = '[特殊消息]';
                }
                
                container.innerHTML += `
                    <div class="list-item" onclick="openChatWith(${p.id})">
                        <div class="avatar">${p.avatar ? `<img src="${p.avatar}">` : p.name.charAt(0)}</div>
                        <div class="list-info">
                                                        <div class="list-name">${p.desc ? p.desc : p.name}</div>
                            <div class="list-preview">${lastMsg}</div>
                        </div>
                    </div>`;
            }
        });
        if(!hasChats) container.innerHTML = '<div style="text-align:center; color:var(--text-sub); margin-top: 40px; font-size: 14px;">暂无聊天记录，请前往通讯录选择角色开始聊天</div>';
    }

    window.onload = () => {
        /* 强制性修复：无论后续代码是否报错，必须保证加载界面消失，进入桌面 */
        const forceHideLoader = () => {
            const loader = document.getElementById('boot-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 800);
            }
        };
        setTimeout(forceHideLoader, 1500);
        // 额外加一层保险，防止 setTimeout 被阻塞
        window.addEventListener('error', forceHideLoader);

        // PWA 自动全屏检测
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        const hidePhoneShell = isStandalone || localStorage.getItem('hidePhoneShell') === 'true';
        if (hidePhoneShell) document.body.classList.add('no-shell');
        if ($('shell-toggle')) $('shell-toggle').checked = hidePhoneShell;

        // 双击聊天背景获取回复
        const chatBox = document.getElementById('chat-box');
        if (chatBox) {
            chatBox.addEventListener('dblclick', (e) => {
                if (e.target === chatBox) triggerAIReply();
            });
        }
        
        // 初始化通知声音
        if ($('notify-sound-url')) $('notify-sound-url').value = localStorage.getItem('notifySoundUrl') || '';

        const sysNotifyEnabled = localStorage.getItem('sysNotifyEnabled') === 'true';
        if ($('sys-notify-toggle')) $('sys-notify-toggle').checked = sysNotifyEnabled;
        
        const timeAwareEnabled = localStorage.getItem('timeAwareEnabled') !== 'false';
        if ($('time-aware-toggle')) $('time-aware-toggle').checked = timeAwareEnabled;

        // 分块初始化，防止单一错误导致全局崩溃
        try {
            myMasks = JSON.parse(localStorage.getItem('myMasks')) || [{ id: 1, name: '默认真实身份', desc: '做最真实的自己。' }];
            myPersonas = JSON.parse(localStorage.getItem('myPersonas')) || [];
            apiPresets = JSON.parse(localStorage.getItem('apiPresets')) || [];
            if (!Array.isArray(myMasks)) myMasks = [{ id: 1, name: '默认真实身份', desc: '做最真实的自己。' }];
            if (!Array.isArray(myPersonas)) myPersonas = [];
            if (!Array.isArray(apiPresets)) apiPresets = [];
        } catch(e) { console.error("基础数据解析失败", e); }

        try {
            ['apiUrl', 'apiKey', 'apiModel', 'minimaxGroupId', 'minimaxApiKey'].forEach(k => {
                const el = $(k.replace(/([A-Z])/g, "-$1").toLowerCase());
                if(localStorage.getItem(k) && el) el.value = localStorage.getItem(k);
            });
            if(localStorage.getItem('apiTemperature')) {
                if($('api-temperature')) $('api-temperature').value = localStorage.getItem('apiTemperature');
                if($('temp-val')) $('temp-val').textContent = localStorage.getItem('apiTemperature');
            }
        } catch(e) { console.error("API配置初始化失败", e); }

        try {
            if(userAvatarDataUrl && $('my-avatar-img')) {
                $('my-avatar-img').src = userAvatarDataUrl;
                $('my-avatar-img').style.display = 'block';
                if($('my-avatar-text')) $('my-avatar-text').style.display = 'none';
            }
            if(localStorage.getItem('userNickname') && $('display-nickname')) $('display-nickname').innerHTML = localStorage.getItem('userNickname');
            if(localStorage.getItem('userBio') && $('display-bio')) $('display-bio').innerHTML = localStorage.getItem('userBio');
        } catch(e) { console.error("用户资料初始化失败", e); }

        try {
            const savedWidgetBg = localStorage.getItem('widgetBg');
            if (savedWidgetBg) {
                const widget = document.getElementById('desktop-widget');
                if (widget) widget.style.backgroundImage = `url(${savedWidgetBg})`;
            }
        } catch(e) { console.error("小组件背景初始化失败", e); }

        try {
            renderMasks(); 
            renderPersonas(); 
            renderPresets(); 
            renderRecentChats();
            renderFontPresets(); 
            initSavedFont(); 
            applyCustomApps();
        } catch(e) { console.error("渲染函数执行失败", e); }
        
        try {
            if(localStorage.getItem('darkMode') === 'true') { 
                document.body.classList.add('dark-mode'); 
                const toggle = $('dark-mode-toggle');
                if(toggle) toggle.checked = true; 
            }
            
            const showNotch = localStorage.getItem('showNotch') !== 'false';
            if(document.getElementById('dynamic-island')) document.getElementById('dynamic-island').style.display = showNotch ? 'flex' : 'none';
            if($('notch-toggle')) $('notch-toggle').checked = showNotch;

            const showStatusBar = localStorage.getItem('showStatusBar') !== 'false';
            if(document.getElementById('status-bar')) document.getElementById('status-bar').style.display = showStatusBar ? 'flex' : 'none';
            if($('statusbar-toggle')) $('statusbar-toggle').checked = showStatusBar;

            const savedChatBg = localStorage.getItem('chatBg');
            if (savedChatBg && $('chat-detail')) $('chat-detail').style.backgroundImage = `url(${savedChatBg})`;
        } catch(e) { console.error("UI状态初始化失败", e); }

        try {
            // 绑定真实电池电量
            if (navigator.getBattery) {
                navigator.getBattery().then(function(battery) {
                    function updateBattery() {
                        const level = battery.level;
                        if($('battery-level-text')) $('battery-level-text').textContent = Math.round(level * 100) + '%';
                        if($('battery-level-rect')) $('battery-level-rect').setAttribute('width', 18 * level);
                    }
                    updateBattery();
                    battery.addEventListener('levelchange', updateBattery);
                });
            }
        } catch(e) { console.error("电池状态初始化失败", e); }

        try {
            document.querySelectorAll('.app-icon-wrapper').forEach((el, idx) => {
                makeDraggable(el, 'app-' + idx);
            });
            if(document.getElementById('desktop-widget')) makeDraggable(document.getElementById('desktop-widget'), 'desktop-widget-pos');
            
            const dt = document.getElementById('desktop-ticket');
            if(dt) {
                makeDraggable(dt, 'desktop-ticket-pos', (e) => {
                    const menu = document.getElementById('ticket-style-menu');
                    if(menu) {
                        menu.classList.add('show');
                        let x = e.touches ? e.touches[0].clientX : e.clientX;
                        let y = e.touches ? e.touches[0].clientY : e.clientY;
                        menu.style.left = x + 'px';
                        menu.style.top = y + 'px';
                        setTimeout(() => document.addEventListener('click', closeTicketStyleMenu), 10);
                    }
                });
                const savedTicketHTML = localStorage.getItem('desktopTicketHTML');
                if (savedTicketHTML) dt.innerHTML = savedTicketHTML;
                dt.className = `ticket ticket-${currentTicketStyle}`;
                dt.addEventListener('input', () => {
                    localStorage.setItem('desktopTicketHTML', dt.innerHTML);
                });
            }
        } catch(e) { console.error("拖拽与票根初始化失败", e); }
        
        _ui_notify_('系统初始化完成，UI已优化');
    };

    // ================= 面具系统 =================
    function renderMasks() {
        $('masks-list-container').innerHTML = ''; $('ai-read-mask-select').innerHTML = '';
        myMasks.forEach((mask, index) => {
            const displayId = String(index + 1).padStart(2, '0');
            $('masks-list-container').innerHTML += `
                <div class="mask-item">
                    <div class="mask-info">
                        <div class="mask-title"><span class="mask-id-tag">NO.${displayId}</span>${mask.name}</div>
                        <div class="mask-desc">${mask.desc}</div>
                    </div>
                    <div class="action-btns">
                        <div class="action-btn" onclick="editMask(${mask.id})"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
                        <div class="action-btn" onclick="deleteMask(${mask.id})"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
                    </div>
                </div>`;
            $('ai-read-mask-select').innerHTML += `<option value="${mask.id}">${mask.name}</option>`;
        });
    }

    function openAddMask() {
        $('mask-form-title').textContent = '创建新面具'; $('mask-edit-id').value = '';
        $('mask-name-input').value = ''; $('mask-desc-input').value = '';
        openSubView('sub-add-mask');
    }

    function editMask(id) {
        const mask = myMasks.find(m => String(m.id) === String(id));
        if(!mask) return;
        $('mask-form-title').textContent = '编辑面具'; $('mask-edit-id').value = mask.id;
        $('mask-name-input').value = mask.name; $('mask-desc-input').value = mask.desc;
        openSubView('sub-add-mask');
    }

    function saveMask() {
        const _i = $('mask-edit-id').value, _n = $('mask-name-input').value.trim(), _d = $('mask-desc-input').value.trim();
        if(!_n) return _ui_notify_('请输入面具名称');
        if(_i) { 
            const _x = myMasks.findIndex(m => String(m.id) === String(_i)); 
            if(_x > -1) { myMasks[_x].name = _n; myMasks[_x].desc = _d; } 
        } else myMasks.push({ id: Date.now(), name: _n, desc: _d });
        localStorage.setItem('myMasks', JSON.stringify(myMasks));
        renderMasks(); closeSubView('sub-add-mask'); _ui_notify_('面具保存成功');
    }

    function deleteMask(id) {
        if(confirm('确定删除这个面具吗？')) { myMasks = myMasks.filter(m => String(m.id) !== String(id)); localStorage.setItem('myMasks', JSON.stringify(myMasks)); renderMasks(); }
    }

    // ================= 角色系统 =================
    let tempPersonaAvatar = '';
    let tempMaskAvatar = '';
    let tempPersonaBg = '';
    // 已移除 tempPersonaImgLib

    function handleMaskAvatarUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width, h = img.height;
                    if (w > 400) { h = h * (400 / w); w = 400; }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    tempMaskAvatar = canvas.toDataURL('image/jpeg', 0.8);
                    $('mask-avatar-preview').src = tempMaskAvatar;
                    $('mask-avatar-preview').style.display = 'block';
                    $('mask-avatar-text').style.display = 'none';
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function handlePersonaBgUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width;
                    let h = img.height;
                    if (w > 1280 || h > 1280) {
                        if (w > h) { h = Math.round((h * 1280) / w); w = 1280; }
                        else { w = Math.round((w * 1280) / h); h = 1280; }
                    }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    tempPersonaBg = canvas.toDataURL('image/jpeg', 0.8);
                    $('p-bg-preview').textContent = '已设置专属壁纸';
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function handlePersonaAvatarUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width;
                    let h = img.height;
                    if (w > 400) { h = h * (400 / w); w = 400; }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    tempPersonaAvatar = canvas.toDataURL('image/jpeg', 0.8);
                    $('persona-avatar-preview').src = tempPersonaAvatar;
                    $('persona-avatar-preview').style.display = 'block';
                    $('persona-avatar-text').style.display = 'none';
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function renderPersonas() {
        $('persona-list-container').innerHTML = '';
        myPersonas.forEach(p => {
            if (p.isBlocked) return;
            $('persona-list-container').innerHTML += `
                <div class="list-item">
                    <div class="avatar" onclick="openChatWith(${p.id})">${p.avatar ? `<img src="${p.avatar}">` : p.name.charAt(0)}</div>
                    <div class="list-info" onclick="openChatWith(${p.id})"><div class="list-name">${p.name}</div><div class="list-preview">${p.desc}</div></div>
                    <div class="action-btns">
                        <div class="action-btn" onclick="editPersona(${p.id})"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
                        <div class="action-btn" onclick="deletePersona(${p.id})"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
                    </div>
                </div>`;
        });
    }

    function openAddPersona() {
        $('persona-form-title').textContent = '添加 AI 角色'; $('persona-edit-id').value = '';
        ['p-name', 'p-desc', 'p-greeting', 'p-prompt', 'p-voice-id'].forEach(id => $(id).value = '');
        $('p-greeting-container').style.display = 'block';
        /* 检查元素是否存在，防止找不到元素导致报错 */
        if (document.getElementById('p-worldbook-select')) {
            updateWbSelectOptions('p-worldbook-select', '');
        }
        $('p-pinned').checked = false; $('p-can-block').checked = false; $('p-avatar-mode').value = 'all';
        $('persona-extra-actions').style.display = 'none';
        tempPersonaAvatar = ''; $('persona-avatar-preview').style.display = 'none'; $('persona-avatar-text').style.display = 'block';
        tempMaskAvatar = ''; $('mask-avatar-preview').style.display = 'none'; $('mask-avatar-text').style.display = 'block';
        tempPersonaBg = ''; $('p-bg-preview').textContent = '未设置';
        openSubView('sub-add-persona');
    }

    function editPersona(id) {
        const p = myPersonas.find(x => String(x.id) === String(id)); if(!p) return;
        $('persona-form-title').textContent = '编辑 AI 角色'; $('persona-edit-id').value = p.id;
        $('p-name').value = p.name; $('p-desc').value = p.desc; $('p-greeting').value = p.greeting || ''; $('p-prompt').value = p.prompt || '';
        $('p-voice-id').value = p.voiceId || '';
        $('p-greeting-container').style.display = 'none';
        $('ai-read-mask-select').value = p.maskId || myMasks[0].id;
        /* 检查元素是否存在，防止找不到元素导致报错 */
        if (document.getElementById('p-worldbook-select')) {
            updateWbSelectOptions('p-worldbook-select', p.worldbookId || '');
        }
        if($('p-auto-sum-toggle')) $('p-auto-sum-toggle').checked = !!p.autoSumToggle;
        if($('p-auto-sum-count')) $('p-auto-sum-count').value = p.autoSumCount || 50;
        if($('p-memory-inject-count')) $('p-memory-inject-count').value = p.memoryInjectCount || 3;
        if($('p-online-ctx')) $('p-online-ctx').value = p.onlineCtx || 0;
        if($('p-offline-ctx')) $('p-offline-ctx').value = p.offlineCtx || 0;
        $('p-pinned').checked = !!p.pinned; $('p-can-block').checked = !!p.canBlock; $('p-avatar-mode').value = p.avatarMode || 'all';
        $('persona-extra-actions').style.display = 'block';
        
        if($('p-api-url')) $('p-api-url').value = p.apiUrl || '';
        if($('p-api-key')) $('p-api-key').value = p.apiKey || '';
        if($('p-api-model')) $('p-api-model').value = p.apiModel || '';
        if($('p-api-temperature')) $('p-api-temperature').value = p.apiTemperature !== undefined ? p.apiTemperature : 0.7;
        if($('p-temp-val')) $('p-temp-val').textContent = p.apiTemperature !== undefined ? p.apiTemperature : 0.7;
        
        if($('p-vision-url')) $('p-vision-url').value = p.visionUrl || '';
        if($('p-vision-key')) $('p-vision-key').value = p.visionKey || '';
        if($('p-vision-model')) $('p-vision-model').value = p.visionModel || '';
        if($('p-vision-temperature')) $('p-vision-temperature').value = p.visionTemperature !== undefined ? p.visionTemperature : 0.7;
        if($('p-vision-temp-val')) $('p-vision-temp-val').textContent = p.visionTemperature !== undefined ? p.visionTemperature : 0.7;

        if($('p-net-url')) $('p-net-url').value = p.netUrl || '';
        if($('p-net-key')) $('p-net-key').value = p.netKey || '';
        if($('p-net-model')) $('p-net-model').value = p.netModel || '';
        if($('p-net-temperature')) $('p-net-temperature').value = p.netTemperature !== undefined ? p.netTemperature : 0.7;
        if($('p-net-temp-val')) $('p-net-temp-val').textContent = p.netTemperature !== undefined ? p.netTemperature : 0.7;

        const presetOptions = '<option value="">-- 选择全局预设填充 --</option>' + apiPresets.map(pr => `<option value="${pr.id}">${pr.name}</option>`).join('');
        if($('p-api-preset-select')) $('p-api-preset-select').innerHTML = presetOptions;
        if($('p-vision-preset-select')) $('p-vision-preset-select').innerHTML = presetOptions;
        if($('p-net-preset-select')) $('p-net-preset-select').innerHTML = presetOptions;
        
        if($('p-api-status')) $('p-api-status').textContent = '';
        if($('p-vision-status')) $('p-vision-status').textContent = '';
        if($('p-net-status')) $('p-net-status').textContent = '';
        if($('p-api-model-select')) $('p-api-model-select').style.display = 'none';
        if($('p-vision-model-select')) $('p-vision-model-select').style.display = 'none';
        if($('p-net-model-select')) $('p-net-model-select').style.display = 'none';
        
        if ($('edit-persona-msg-count')) {
            $('edit-persona-msg-count').textContent = (allChats[p.id] || []).length;
        }
        
        if ($('edit-persona-sum-count')) {
            $('edit-persona-sum-count').textContent = calculateSummarizedCount(p.id);
        }

        const blockBtn = $('block-persona-btn');
        if (blockBtn) {
            blockBtn.textContent = p.isBlocked ? '解除拉黑' : '拉黑此角色';
        }
        
        tempPersonaAvatar = p.avatar || '';
        if(tempPersonaAvatar) { $('persona-avatar-preview').src = tempPersonaAvatar; $('persona-avatar-preview').style.display = 'block'; $('persona-avatar-text').style.display = 'none'; } 
        else { $('persona-avatar-preview').style.display = 'none'; $('persona-avatar-text').style.display = 'block'; }
        
        const maskId = p.maskId || myMasks[0].id;
        const mask = myMasks.find(m => String(m.id) === String(maskId));
        tempMaskAvatar = mask && mask.avatar ? mask.avatar : '';
        if(tempMaskAvatar) { $('mask-avatar-preview').src = tempMaskAvatar; $('mask-avatar-preview').style.display = 'block'; $('mask-avatar-text').style.display = 'none'; } 
        else { $('mask-avatar-preview').style.display = 'none'; $('mask-avatar-text').style.display = 'block'; }

        tempPersonaBg = p.chatBg || ''; $('p-bg-preview').textContent = tempPersonaBg ? '已设置专属壁纸' : '未设置';
        openSubView('sub-add-persona');
    }

    function savePersona() {
        const _i = $('persona-edit-id').value;
        const _n = $('p-name').value.trim();
        if(!_n) return _ui_notify_('请输入角色名称');
        
        /* 修复报错：增加安全判断，如果元素不存在则返回默认值 */
        const _dt = { 
            id: _i ? parseInt(_i) : Date.now(), 
            name: _n, 
            desc: $('p-desc') ? $('p-desc').value.trim() : '', 
            greeting: $('p-greeting') ? $('p-greeting').value.trim() : '', 
            prompt: $('p-prompt') ? $('p-prompt').value.trim() : '', 
            voiceId: $('p-voice-id') ? $('p-voice-id').value.trim() : '',
            maskId: $('ai-read-mask-select') ? $('ai-read-mask-select').value : '', 
            worldbookId: $('p-worldbook-select') ? $('p-worldbook-select').value : '',
            autoSumToggle: $('p-auto-sum-toggle') ? $('p-auto-sum-toggle').checked : false,
            autoSumCount: $('p-auto-sum-count') ? parseInt($('p-auto-sum-count').value) || 50 : 50,
            memoryInjectCount: $('p-memory-inject-count') ? parseInt($('p-memory-inject-count').value) || 3 : 3,
            onlineCtx: $('p-online-ctx') ? parseInt($('p-online-ctx').value) || 0 : 0,
            offlineCtx: $('p-offline-ctx') ? parseInt($('p-offline-ctx').value) || 0 : 0,
            avatar: tempPersonaAvatar,
            chatBg: tempPersonaBg,
            pinned: $('p-pinned') ? $('p-pinned').checked : false, 
            canBlock: $('p-can-block') ? $('p-can-block').checked : false, 
            avatarMode: $('p-avatar-mode') ? $('p-avatar-mode').value : 'all',
            apiUrl: $('p-api-url') ? $('p-api-url').value.trim() : '',
            apiKey: $('p-api-key') ? $('p-api-key').value.trim() : '',
            apiModel: $('p-api-model') ? $('p-api-model').value.trim() : '',
            apiTemperature: $('p-api-temperature') ? parseFloat($('p-api-temperature').value) : 0.7
        };
        
        if(_i) { 
            const _x = myPersonas.findIndex(x => String(x.id) === String(_i)); 
            if(_x > -1) {
                myPersonas[_x] = _dt; 
            }
        } else {
            myPersonas.push(_dt);
        }
        
        // 保存面具头像
        const maskId = $('ai-read-mask-select').value;
        if (maskId && tempMaskAvatar) {
            const mIdx = myMasks.findIndex(m => String(m.id) === String(maskId));
            if (mIdx > -1) {
                myMasks[mIdx].avatar = tempMaskAvatar;
                localStorage.setItem('myMasks', JSON.stringify(myMasks));
            }
        }
        
        localStorage.setItem('myPersonas', JSON.stringify(myPersonas)); 
        renderPersonas(); 
        renderRecentChats(); 
        closeSubView('sub-add-persona'); 
        _ui_notify_('角色保存成功');
        
        if (currentChatPersona && String(currentChatPersona.id) === String(_dt.id)) {
            currentChatPersona = _dt;
            // 实时更新聊天界面头部信息
            $('chat-header-name').innerHTML = currentChatPersona.desc ? currentChatPersona.desc : currentChatPersona.name;
            $('chat-header-avatar').innerHTML = currentChatPersona.avatar ? `<img src="${currentChatPersona.avatar}">` : currentChatPersona.name.charAt(0);
            // 实时更新聊天背景
            if(currentChatPersona.chatBg) {
                $('chat-detail').style.backgroundImage = `url(${currentChatPersona.chatBg})`;
            } else {
                const savedChatBg = localStorage.getItem('chatBg');
                $('chat-detail').style.backgroundImage = savedChatBg ? `url(${savedChatBg})` : 'none';
            }
            renderChatBox();
        }
    }

    function deletePersona(id) {
        if(confirm('确定删除这个角色吗？')) { myPersonas = myPersonas.filter(x => String(x.id) !== String(id)); localStorage.setItem('myPersonas', JSON.stringify(myPersonas)); renderPersonas(); }
    }

       let activeMsgIndex = -1;
    let activeMsgElement = null;
    let isMultiSelectMode = false;
    let selectedMsgIndices = new Set();

    function showMsgMenu(e, index, el) {
        if(isMultiSelectMode) return;
        if (e && e.cancelable) e.preventDefault();
        activeMsgIndex = index;
        activeMsgElement = el;
        const menu = $('msg-context-menu');
        menu.classList.add('show');
        
        let x = 0, y = 0;
        if (e) {
            if (e.touches && e.touches.length > 0) {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            } else if (e.clientX !== undefined) {
                x = e.clientX;
                y = e.clientY;
            } else {
                const rect = el.getBoundingClientRect();
                x = rect.left + rect.width / 2;
                y = rect.top + rect.height / 2;
            }
        } else {
            const rect = el.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
        }
        
        const screenRect = document.querySelector('.screen').getBoundingClientRect();
        x = x - screenRect.left;
        y = y - screenRect.top;
        
        /* 调整长按菜单的底部安全距离，防止菜单项过多时被屏幕底部截断 */
        if (x + 120 > screenRect.width) x = screenRect.width - 130;
        if (y + 280 > screenRect.height) y = screenRect.height - 290;
        if (x < 10) x = 10;
        if (y < 10) y = 10;
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        
        document.addEventListener('click', closeMsgMenuOutside);
        document.addEventListener('touchstart', closeMsgMenuOutside);
    }

    function closeMsgMenuOutside(e) {
        const menu = $('msg-context-menu');
        if (!menu.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMsgMenuOutside);
            document.removeEventListener('touchstart', closeMsgMenuOutside);
        }
    }

    function handleMsgAction(action) {
        $('msg-context-menu').classList.remove('show');
        if (activeMsgIndex < 0 || activeMsgIndex >= messageHistory.length) return;
        
        const msg = messageHistory[activeMsgIndex];
        
        if (action === 'edit') {
            const modal = $('custom-edit-modal');
            const textarea = $('custom-edit-textarea');
            const confirmBtn = $('custom-edit-confirm');
            
            if (msg.type === 'ticket') {
                $('custom-edit-title').textContent = '编辑票根数据 (JSON)';
                textarea.value = JSON.stringify(msg, null, 2);
                confirmBtn.onclick = () => {
                    try {
                        const parsed = JSON.parse(textarea.value);
                        Object.assign(msg, parsed);
                        saveChatHistory();
                        renderChatBox();
                        modal.classList.remove('show');
                    } catch(e) {
                        _ui_notify_('JSON格式错误');
                    }
                };
            } else {
                $('custom-edit-title').textContent = msg.role === 'system' ? '编辑旁白/系统提示' : '编辑消息内容';
                textarea.value = msg.content || '';
                confirmBtn.onclick = () => {
                    msg.content = textarea.value;
                    saveChatHistory();
                    renderChatBox();
                    modal.classList.remove('show');
                };
            }
            modal.classList.add('show');
        } else if (action === 'copy') {
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(msg.content).then(() => _ui_notify_('已复制'));
                } else {
                    let textArea = document.createElement("textarea");
                    textArea.value = msg.content;
                    textArea.style.position = "fixed";
                    textArea.style.left = "-999999px";
                    textArea.style.top = "-999999px";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    textArea.remove();
                    _ui_notify_('已复制');
                }
            } catch (err) {
                _ui_notify_('复制失败，请检查浏览器权限');
            }
        } else if (action === 'regenerate') {
            if (msg.role === 'assistant') {
                messageHistory = messageHistory.slice(0, activeMsgIndex);
                saveChatHistory();
                renderChatBox();
                triggerAIReply();
            } else {
                _ui_notify_('只能重新生成AI的回复');
            }
                } else if (action === 'quote') {
            currentQuote = {
                sender: msg.role === 'user' ? '我' : currentChatPersona.name,
                content: msg.content
            };
            $('reply-preview-name').textContent = currentQuote.sender + ':';
            $('reply-preview-text').textContent = currentQuote.content;
            $('reply-preview-bar').classList.add('visible');
            $('chatInput').focus();
        } else if (action === 'optimize') {
            let text = msg.content;
            text = text.replace(/\n{3,}/g, '\n\n').replace(/“\s+/g, '“').replace(/\s+”/g, '”').trim();
            msg.content = text;
            saveChatHistory();
            renderChatBox();
            _ui_notify_('排版已优化');
        } else if (action === 'translate') {
            if(msg.translation) {
                delete msg.translation;
                saveChatHistory(); renderChatBox();
            } else {
                translateMsg(activeMsgIndex);
            }
        } else if (action === 'multiselect') {
            enterMultiSelectMode();
        }
    }

    async function translateMsg(idx) {
        const msg = messageHistory[idx];
        if(!msg || !msg.content) return;
        _ui_notify_('正在翻译...');
        try {
            const res = await fetch(localStorage.getItem('apiUrl').replace(/\/$/, '') + '/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('apiKey')}` },
                body: JSON.stringify({ model: localStorage.getItem('apiModel'), messages: [{role: 'system', content: 'Translate the following text to Chinese. Only output the translation.'}, {role: 'user', content: msg.content}], temperature: 0.3 })
            });
            const data = await res.json();
            msg.translation = data.choices[0].message.content.trim();
            saveChatHistory(); renderChatBox();
        } catch(e) { _ui_notify_('翻译失败'); }
    }

    function enterMultiSelectMode() {
        isMultiSelectMode = true;
        selectedMsgIndices.clear();
        $('multi-select-bar').style.display = 'flex';
        $('chatInput').parentElement.style.display = 'none';
        renderChatBox();
    }

    function exitMultiSelect() {
        isMultiSelectMode = false;
        selectedMsgIndices.clear();
        $('multi-select-bar').style.display = 'none';
        $('chatInput').parentElement.style.display = 'flex';
        renderChatBox();
    }

    function toggleMsgSelect(idx) {
        if(selectedMsgIndices.has(idx)) selectedMsgIndices.delete(idx);
        else selectedMsgIndices.add(idx);
        renderChatBox();
    }

    function selectAllMsgs() {
        if (selectedMsgIndices.size === messageHistory.length) {
            selectedMsgIndices.clear();
        } else {
            messageHistory.forEach((_, i) => selectedMsgIndices.add(i));
        }
        renderChatBox();
    }

    function deleteSelectedMsgs() {
        if(selectedMsgIndices.size === 0) return exitMultiSelect();
        if(confirm(`确定删除选中的 ${selectedMsgIndices.size} 条消息吗？`)) {
            messageHistory = messageHistory.filter((_, i) => !selectedMsgIndices.has(i));
            saveChatHistory();
            exitMultiSelect();
        }
    }

    function renderChatBox() {
        $('chat-box').innerHTML = '';
        if (!currentChatPersona) return; // 修复关闭聊天界面时的报错
        lastMsgTime = 0;
        messageHistory.forEach((msg, idx) => {
            // 隐藏第一条内置的系统提示词，防止暴露
            if (idx === 0 && msg.role === 'system' && msg.content.includes('你现在的身份是')) return;
            if (msg.isHidden) return;
            
            appendMessage(msg, msg.role === 'user' ? 'user' : (msg.role === 'system' ? 'system' : 'ai'), idx);
        });
    }

    let lastLeaveTimeMap = JSON.parse(localStorage.getItem('lastLeaveTimeMap')) || {};

    function toggleTimeAware(isAware) {
        localStorage.setItem('timeAwareEnabled', isAware);
        _ui_notify_(isAware ? '时间感知已开启' : '时间感知已关闭');
    }

    function openChatWith(personaId) {
        exitEditMode(); // 修复：打开聊天时强制关闭桌面编辑和色调面板，防止挤压输入框
        currentChatPersona = myPersonas.find(p => String(p.id) === String(personaId)); if(!currentChatPersona) return;
        if (isAiReplying) {
            $('chat-header-name').innerHTML = '正在输入...';
        } else {
            $('chat-header-name').innerHTML = currentChatPersona.desc ? currentChatPersona.desc : currentChatPersona.name;
        }
        $('chat-header-avatar').innerHTML = currentChatPersona.avatar ? `<img src="${currentChatPersona.avatar}">` : currentChatPersona.name.charAt(0);
        
        /* 绑定点击头像触发心声卡片 */
        $('chat-header-avatar').onclick = generateMindCard;
        $('chat-header-avatar').style.cursor = 'pointer';
        
        if(currentChatPersona.chatBg) {
            $('chat-detail').style.backgroundImage = `url(${currentChatPersona.chatBg})`;
        } else {
            const savedChatBg = localStorage.getItem('chatBg');
            $('chat-detail').style.backgroundImage = savedChatBg ? `url(${savedChatBg})` : 'none';
        }

        isMultiSelectMode = false;
        const multiBar = $('multi-select-bar');
        if(multiBar) multiBar.style.display = 'none';
        $('chatInput').parentElement.style.display = 'flex';

        if(allChats[personaId]) {
            messageHistory = allChats[personaId];
            
            // 时间感知逻辑
            if (localStorage.getItem('timeAwareEnabled') === 'true' && lastLeaveTimeMap[personaId]) {
                const now = Date.now();
                const diffMs = now - lastLeaveTimeMap[personaId];
                if (diffMs > 5 * 60 * 1000) { // 超过5分钟才提示
                    const diffMins = Math.floor(diffMs / 60000);
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    let timeStr = hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
                    const sysMsg = { role: 'system', type: 'text', content: `[系统感知] 距离上次聊天已经过了 ${timeStr}。`, time: now };
                    messageHistory.push(sysMsg);
                    saveChatHistory();
                }
            }
            
            renderChatBox();
        } else {
            messageHistory = [];
            const mask = myMasks.find(m => String(m.id) === String(currentChatPersona.maskId)) || myMasks[0];
            messageHistory.push({ role: 'system', content: `你现在的身份是：${currentChatPersona.name}。\n你的详细设定：${currentChatPersona.prompt}\n\n与你对话的人的身份设定是：${mask.name}。\n对方的详细情况：${mask.desc}\n\n请完全沉浸在你的角色中，使用符合你设定的语气和方式与对方交流。不要暴露你是AI。` });
            if(currentChatPersona.greeting) { 
                messageHistory.push({ role: 'assistant', content: currentChatPersona.greeting }); 
            }
            saveChatHistory();
            renderChatBox();
        }
        $('chat-detail').classList.add('open');
    }

    function closeChatDetail() { 
        $('chat-detail').classList.remove('open'); 
        const menu = document.getElementById('tool-menu');
        if (menu) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeToolMenuOutside);
        }
        const stickerPanel = document.getElementById('sticker-panel');
        if (stickerPanel) stickerPanel.style.display = 'none';
        exitMultiSelect();
        
        // 记录离开时间
        if (currentChatPersona) {
            lastLeaveTimeMap[currentChatPersona.id] = Date.now();
            localStorage.setItem('lastLeaveTimeMap', JSON.stringify(lastLeaveTimeMap));
        }
        
        // 修复：如果打开了线下编辑器，不要清空 currentChatPersona
        if (!$('offline-editor').classList.contains('open')) {
            currentChatPersona = null; 
        }
    }
    function editCurrentPersona() { if(currentChatPersona) { editPersona(currentChatPersona.id); } }

    // 监听输入框，显示悬浮表情
    $('chatInput').addEventListener('input', function() {
        const val = this.value.trim();
        const suggestBox = $('chat-sticker-suggest');
        if (!val) {
            suggestBox.style.display = 'none';
            return;
        }
        const matched = stickers.filter(s => s.desc && s.desc.includes(val)).slice(0, 5);
        if (matched.length > 0) {
            suggestBox.innerHTML = matched.map(s => `
                <img src="${s.url}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; cursor:pointer; flex-shrink:0;" 
                     onclick="sendDirectSticker('${s.id}')">
            `).join('');
            suggestBox.style.display = 'flex';
        } else {
            suggestBox.style.display = 'none';
        }
    });

    function sendDirectSticker(id) {
        const s = stickers.find(x => x.id === id);
        if (!s) return;
        const msgObj = { type: 'sticker', url: s.url, content: `【表情包：${s.desc}】` };
        appendMessage(msgObj, 'user', messageHistory.length);
        messageHistory.push({ role: 'user', ...msgObj });
        saveChatHistory();
        $('chatInput').value = '';
        $('chat-sticker-suggest').style.display = 'none';
    }

    /* 修复：点击外部关闭表情面板时，排除自定义选择弹窗，防止切换分组时意外关闭 */
    document.addEventListener('click', (e) => {
        const panel = $('sticker-panel');
        const btn = document.querySelector('.tool-item[onclick="triggerTool(\'sticker\')"]');
        const selectModal = $('custom-select-modal');
        const promptModal = $('custom-prompt-modal');
        
        if (panel && panel.style.display !== 'none') {
            // 如果点击的是弹窗内部，则不关闭表情面板
            if (selectModal && selectModal.contains(e.target)) return;
            if (promptModal && promptModal.contains(e.target)) return;
            
            if (!panel.contains(e.target) && (!btn || !btn.contains(e.target))) {
                panel.style.display = 'none';
            }
        }
    });

    let currentQuote = null;

    function cancelQuote() {
        currentQuote = null;
        $('reply-preview-bar').classList.remove('visible');
    }

    function sendUserMessage() {
        if(!currentChatPersona) return;
        const _txt = $('chatInput').value.trim(); if (!_txt) return;
        
        const msgObj = { id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6), role: 'user', type: 'text', content: _txt, time: Date.now() };
        if (currentQuote) {
            msgObj.quote = currentQuote;
        }
        
        // 如果被对方拉黑，标记为发送失败
        if (currentChatPersona.hasBlockedUser) {
            msgObj.isFailed = true;
        }
        
        appendMessage(msgObj, 'user', messageHistory.length); 
        $('chatInput').value = ''; 
        messageHistory.push(msgObj);
        saveChatHistory();
        cancelQuote();
        
        /* 修复：移除强制回顶逻辑，保持与线下模式一致的自然滚动 */
        setTimeout(() => {
            const chatBox = document.getElementById('chat-box');
            if (chatBox) {
                chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
            }
        }, 50);
        
        // 如果被拉黑，自动回复系统提示，并拦截 AI 回复
        if (currentChatPersona.hasBlockedUser) {
            setTimeout(() => {
                const sysMsg = { role: 'system', type: 'text', content: '消息已发出，但被对方拒收了。', time: Date.now() };
                appendMessage(sysMsg, 'system', messageHistory.length);
                messageHistory.push(sysMsg);
                saveChatHistory();
            }, 500);
            return;
        }
        
        /* 触发 AI 进行回复 */
        triggerAIReply();
    }

    let isAiReplying = false;

    async function triggerAIReply() {
        if(!currentChatPersona) return;
        
        const p = currentChatPersona;
        const _u = p.apiUrl || localStorage.getItem('apiUrl');
        const _k = p.apiKey || localStorage.getItem('apiKey');
        const _m = p.apiModel || localStorage.getItem('apiModel') || 'gpt-3.5-turbo';
        // 优先使用角色独立温度
        const _t = p.apiTemperature !== undefined ? p.apiTemperature : (parseFloat(localStorage.getItem('apiTemperature')) || 0.7);
        
        if (!_u || !_k) return _ui_notify_("请先在设置中配置API");

        isAiReplying = true;
        const originalName = $('chat-header-name').innerHTML;
        $('chat-header-name').innerHTML = '正在输入...';

        const mask = myMasks.find(m => String(m.id) === String(currentChatPersona.maskId)) || myMasks[0];
        
        // 应用线上上下文截断
        let onlineCtxCount = currentChatPersona.onlineCtx || 0;
        let msgsToUse = messageHistory;
        if (onlineCtxCount > 0 && messageHistory.length > onlineCtxCount) {
            msgsToUse = messageHistory.slice(-onlineCtxCount);
        }

        const recentHistory = msgsToUse.map(msg => {
            if(msg.ignoreToken || msg.type === 'image') return '';
            return `${msg.role === 'user' ? mask.name : currentChatPersona.name}: ${msg.content}`;
        }).filter(Boolean).join('\n');

        const wbId = currentChatPersona.worldbookId;
        let wbText = '';
        if (wbId) {
            if (wbId.startsWith('group_')) {
                const gId = wbId.replace('group_', '');
                const groupWbs = worldbooks.filter(w => w.groupId === gId);
                wbText = `世界观设定：\n` + groupWbs.map(w => w.content).join('\n') + '\n';
            } else if (wbId.startsWith('wb_')) {
                const wId = wbId.replace('wb_', '');
                const wb = worldbooks.find(w => String(w.id) === String(wId));
                if (wb) wbText = `世界观设定：${wb.content}\n`;
            }
        }

        // 触发自动总结检测
        checkAndTriggerAutoSummary(currentChatPersona.id);
        
        const injectedMemoryText = getInjectedMemories(currentChatPersona.id);

        const sysPrompt = `
【最高指令】你就是"${currentChatPersona.name}"本人，这不是角色扮演，你就是TA。绝对不要承认自己是AI或程序。

【世界观基底】
${wbText || '当前处于现实日常世界。'}

【你的核心人设】
${currentChatPersona.prompt}

【对话对象与情感关系】
对方是 "${mask.name}"。
对方的详细设定：${mask.desc}
请严格根据你们的人设差异和情感羁绊来决定你的态度（是冷漠、热情、傲娇还是顺从）。

【潜意识与核心记忆】
${injectedMemoryText || '暂无特殊记忆闪回。'}
(注意：这些记忆是你脑海中真实发生过的事，请自然地将其融入你的情绪和反应中，不要生硬复述)

【近期对话上下文】
${recentHistory || '无'}

【输出格式要求】
你必须返回一个纯净的 JSON 数组 []，将你的回复拆分为 3 条以上的短消息。
要求：
1. 消息必须碎片化，像真实人类在微信聊天一样，每条消息很短。
2. 绝对不要使用句号结尾！可以使用波浪号~、感叹号!、问号?、省略号... 或者直接不加标点。
3. 语气要极其自然、口语化，带有活人感（可以有错别字、语气词如“啊”、“呢”、“草”、“笑死”等）。
4. 每次回复必须包含至少 3 个 {"type": "text", "content": "..."} 对象。

可用动作类型：
- {"type": "text", "content": "说话内容"}
- {"type": "pat_pat"}
- {"type": "transfer", "amount": 520, "status": "pending"}
- {"type": "ticket", "style": "movie", "title": "电影名", "subtitle": "副标题", "info1Label": "影厅", "info1Value": "IMAX", "info2Label": "座位", "info2Value": "G排12座", "info3Label": "场次", "info3Value": "19:30", "date": "15", "month": "JUN", "year": "2025", "icon": "🎬", "typeText": "CINEMA", "serial": "NO.12345", "footer1": "ADMIT ONE", "footer2": "★★★★★"}
当用户提到看电影、艺术展、演唱会、旅行等，你可以先询问细节，确认后直接输出 ticket 动作生成逼真的票根。票根卡片需要简洁展示，重点突出名称和时间。放映时间绝不能使用系统当前时间，必须根据对话角色和上下文模拟合理的值（如用户提到“昨晚”则生成昨晚的日期，若是推荐给朋友则生成未来几天的场次）。style可选: movie, concert, travel, exhibit, love, radio。
当剧情需要你给对方转账、打钱、发红包时，直接输出 transfer 动作，amount 为转账金额数字。
示例：[{"type": "text", "content": "你在干嘛呀"}, {"type": "text", "content": "我刚吃完饭"}, {"type": "text", "content": "好撑哦"}]
`;

        const _payload = [{ role: 'system', content: sysPrompt }];
        
        // 已移除图片记忆库逻辑

        msgsToUse.forEach(msg => {
            if(msg.ignoreToken) return;
            if(msg.type === 'image' || msg.type === 'sticker') {
                // 同时发送文本描述和图片URL给AI
                _payload.push({ 
                    role: msg.role, 
                    content: [
                        {type: "text", text: msg.content},
                        {type: "image_url", image_url: {url: msg.url}}
                    ] 
                });
            } else {
                _payload.push({ role: msg.role, content: msg.content });
            }
        });

        try {
            const _r = await fetch(_u.replace(/\/$/, '') + (_u.endsWith('/chat/completions') ? '' : '/chat/completions'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_k}` },
                body: JSON.stringify({ model: _m, messages: _payload, temperature: _t })
            });
            
            if (!_r.ok) throw new Error(`HTTP ${_r.status}`);
            const _d = await _r.json();
            const _rt = _d.choices?.[0]?.message?.content;
            if (!_rt) throw new Error("Empty");

            let _acts = extractAndParseActions(_rt);

            for (const _a of _acts) {
                if (_a.type) {
                    if (_a.type === 'pat_pat') _a.sender = 'ai';
                    _a.time = Date.now();
                    _a.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                    appendMessage(_a, 'ai', messageHistory.length);
                    messageHistory.push({ role: 'assistant', ..._a });
                    
                    let notifyText = _a.content || '发送了一条消息';
                    if (_a.type === 'pat_pat') notifyText = '拍了拍你';
                    if (_a.type === 'transfer') notifyText = `向你转账 ¥${_a.amount}`;
                    if (_a.type === 'ticket') notifyText = `发来一张票根`;
                    if (_a.type === 'image') notifyText = `发来一张图片`;
                    
                    if (localStorage.getItem('sysNotifyEnabled') === 'true' && Notification.permission === 'granted') {
                        new Notification(currentChatPersona.name, { body: notifyText });
                    }
                    // 如果不在当前聊天界面，显示横幅
                    if (!$('chat-detail').classList.contains('open') || currentChatPersona.id !== p.id) {
                        showAppToast(p.name, notifyText, p.avatar);
                    } else {
                        playTestSound(); // 在聊天界面内只播放声音
                    }
                }
            }
            
            saveChatHistory();
            
            /* AI回复完毕后，清空旧心声并静默生成新心声 */
            if (currentChatPersona) {
                currentChatPersona.latestMind = null;
                generateMindCardSilent(currentChatPersona);
            }

        } catch (e) { 
            appendMessage({ type: 'text', content: `[Error: ${e.message}]` }, 'ai', messageHistory.length); 
        } finally {
            isAiReplying = false;
            if (currentChatPersona) {
                $('chat-header-name').innerHTML = currentChatPersona.desc ? currentChatPersona.desc : currentChatPersona.name;
            }
        }
    }

    function extractAndParseActions(rawText) {
        if (!rawText) return [];
        let cleanStr = rawText.trim().replace(/```json|```/g, '').trim();
        try {
            const parsed = JSON.parse(cleanStr);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
        const extracted = [];
        const objRegex = /{\s*"type"\s*:\s*"[^"]+"\s*(?:,\s*"content"\s*:\s*"[^"]+"\s*)?}/g;
        let match;
        while ((match = objRegex.exec(cleanStr)) !== null) {
            try { extracted.push(JSON.parse(match[0])); } catch (err) {}
        }
        if (extracted.length > 0) return extracted;
        return cleanStr.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(line => ({ type: "text", content: line }));
    }

    let lastMsgTime = 0;

    function appendMessage(_obj, _s, _idx) {
        if (!_obj.time) _obj.time = Date.now();
        if (_obj.time - lastMsgTime > 5 * 60 * 1000 && _s !== 'system') {
            const d = new Date(_obj.time);
            const timeStr = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            const divider = document.createElement('div');
            divider.className = 'msg-row system-msg';
            divider.innerHTML = `<div class="msg-bubble" style="text-align:center; width:100%;"><div style="font-size:9px; font-weight:300; color:var(--text-sub); margin-bottom:2px;">信息·短信</div><div style="font-size:10px; font-weight:500; color:var(--text-sub);">${timeStr}</div></div>`;
            $('chat-box').appendChild(divider);
            lastMsgTime = _obj.time;
        }

        // 处理系统提示/旁白 (如拉黑、解除拉黑)，使其与拍一拍样式完全一致
        if (_s === 'system' || _obj.role === 'system') {
            const sysRow = document.createElement('div');
            sysRow.className = 'msg-row system-msg';
            sysRow.innerHTML = `<div class="msg-bubble">${_obj.content}</div>`;
            $('chat-box').appendChild(sysRow);
            $('chat-box').scrollTo({ top: $('chat-box').scrollHeight, behavior: 'smooth' });
            return;
        }

        const _r = document.createElement('div'); _r.className = `msg-row ${_s}`;
        const msgIndex = _idx !== undefined ? _idx : messageHistory.length;
        
        let chk = null;
        if (isMultiSelectMode) {
            chk = document.createElement('div');
            chk.className = `msg-check-circle ${selectedMsgIndices.has(msgIndex) ? 'checked' : ''}`;
            _r.onclick = () => toggleMsgSelect(msgIndex);
        }

        if (_obj.type === 'pat_pat') {
            _r.className = 'msg-row system-msg';
            const _b = document.createElement('div'); _b.className = 'msg-bubble';
            _b.innerHTML = _obj.sender === 'user' ? `"我" 拍了拍 "${currentChatPersona.name}"` : `"${currentChatPersona.name}" 拍了拍 "我"`;
            _r.appendChild(_b);
            
            let pressTimer;
            let startX, startY;
            const startPress = (e) => { 
                if(isMultiSelectMode) return; 
                startX = e.touches ? e.touches[0].clientX : e.clientX;
                startY = e.touches ? e.touches[0].clientY : e.clientY;
                pressTimer = setTimeout(() => showMsgMenu(e, msgIndex, _b), 500); 
            };
            const movePress = (e) => {
                if (!pressTimer) return;
                let x = e.touches ? e.touches[0].clientX : e.clientX;
                let y = e.touches ? e.touches[0].clientY : e.clientY;
                if (Math.abs(x - startX) > 10 || Math.abs(y - startY) > 10) clearTimeout(pressTimer);
            };
            const cancelPress = () => clearTimeout(pressTimer);
            
            _b.addEventListener('touchstart', startPress, {passive: false});
            _b.addEventListener('touchmove', movePress, {passive: true});
            _b.addEventListener('touchend', cancelPress);
            _b.addEventListener('mousedown', startPress);
            _b.addEventListener('mousemove', movePress);
            _b.addEventListener('mouseup', cancelPress);
            _b.addEventListener('mouseleave', cancelPress);
            _b.addEventListener('contextmenu', e => { if(!isMultiSelectMode) { if(e.cancelable) e.preventDefault(); showMsgMenu(e, msgIndex, _b); } });

            $('chat-box').appendChild(_r); 
            $('chat-box').scrollTo({ top: $('chat-box').scrollHeight, behavior: 'smooth' });
            return;
        }

        const _a = document.createElement('div'); _a.className = 'msg-avatar';
        _a.style.marginTop = '0'; // 确保头像顶部对齐

        let showAvatar = true;
        let occupySpace = true;
        const mode = currentChatPersona?.avatarMode || 'all';
        
        if (mode === 'none') {
            showAvatar = false;
            occupySpace = false;
        } else if (mode === 'first') {
            const existingMsgs = Array.from($('chat-box').children);
            if (existingMsgs.length > 0) {
                const lastMsg = existingMsgs[existingMsgs.length - 1];
                if (lastMsg.classList.contains(_s)) {
                    showAvatar = false;
                }
            }
        } else if (mode === 'hide_ai' && _s === 'ai') {
            showAvatar = false;
            occupySpace = false;
        } else if (mode === 'hide_user' && _s === 'user') {
            showAvatar = false;
            occupySpace = false;
        }

        if (showAvatar) {
            let maskId = currentChatPersona ? currentChatPersona.maskId : (myMasks[0] ? myMasks[0].id : null);
            const mask = myMasks.find(m => String(m.id) === String(maskId)) || myMasks[0] || {name: '我', avatar: ''};
            const userAvatar = mask.avatar || userAvatarDataUrl;
            
            let aiAvatarHtml = 'A';
            if (currentChatPersona) {
                aiAvatarHtml = currentChatPersona.avatar ? `<img src="${currentChatPersona.avatar}">` : currentChatPersona.name.charAt(0);
            }
            
            _a.innerHTML = _s === 'ai' ? aiAvatarHtml : (userAvatar ? `<img src="${userAvatar}">` : '我');
        } else {
            _a.style.visibility = 'hidden';
            if (!occupySpace) {
                _a.style.display = 'none';
            }
        }

        const _b = document.createElement('div'); _b.className = 'msg-bubble'; 
        
        if (typeof _obj === 'string') { _b.textContent = _obj; } 
        else if (_obj.type === 'image' || _obj.type === 'sticker') {
            // 统一表情包和图片大小，并支持读取 IndexedDB 大图
            const imgId = 'render_img_' + Math.random().toString(36).substr(2, 6);
            _b.innerHTML = `<img id="${imgId}" src="${(_obj.url && !_obj.url.startsWith('indexeddb:')) ? _obj.url : ''}" style="width: 140px; height: 140px; object-fit: cover; border-radius: 8px; display: block; background: var(--glass-border);">`;
            _b.style.cssText = 'background:transparent;padding:0;box-shadow:none;';
            
            /* 异步加载 IndexedDB 图片，增加容错防止阻塞渲染导致白屏 */
            if (_obj.url && _obj.url.startsWith('indexeddb:')) {
                const dbKey = _obj.url.split(':')[1];
                try {
                    initAuraDB(db => {
                        try {
                            const tx = db.transaction("media", "readonly");
                            const getReq = tx.objectStore("media").get(dbKey);
                            getReq.onsuccess = () => {
                                const imgEl = document.getElementById(imgId);
                                if (imgEl && getReq.result) imgEl.src = getReq.result;
                            };
                        } catch(e) { console.error("读取图片失败", e); }
                    });
                } catch(e) { console.error("数据库调用失败", e); }
            }
        } else if (_obj.type === 'ticket') {
            _b.innerHTML = renderTicketHTML(_obj);
            _b.style.cssText = 'background:transparent;padding:0;box-shadow:none;overflow:visible;';
        } else if (_obj.type === 'transfer') {
            let statusText = _obj.status === 'pending' ? (_s === 'user' ? '转账给对方' : '转账给你') : (_obj.status === 'received' ? '已收款' : '已退还');
            let opacityClass = _obj.status !== 'pending' ? 'received' : '';
            _b.innerHTML = `
                <div class="transfer-card ${opacityClass}" onclick="openTransferDetail(${msgIndex})">
                    <div class="transfer-top">
                        <div class="transfer-icon">
                            <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                        <div class="transfer-info">
                            <div class="transfer-amount">¥ ${parseFloat(_obj.amount).toFixed(2)}</div>
                            <div class="transfer-status">${statusText}</div>
                        </div>
                    </div>
                    <div class="transfer-bottom">微信转账</div>
                </div>
            `;
            _b.style.cssText = 'background:transparent;padding:0;box-shadow:none;overflow:visible;';
        } else { 
            if (_obj.quote) {
                _b.innerHTML = '';
                const qDiv = document.createElement('div');
                qDiv.className = 'quoted-message';
                qDiv.innerHTML = `<span class="quoted-sender">${_obj.quote.sender}:</span><span class="quoted-text">${_obj.quote.content}</span>`;
                _b.appendChild(qDiv);
                const tSpan = document.createElement('span');
                tSpan.textContent = _obj.content;
                _b.appendChild(tSpan);
            } else {
                _b.textContent = _obj.content; 
            }
        }
        
        // 阻止系统默认长按菜单和文本选中
        _b.style.webkitTouchCallout = 'none';
        _b.style.webkitUserSelect = 'none';
        _b.style.userSelect = 'none';

        let _lp_tmr_ = null;

        const _h_t_s_ = (e) => {
            if (isMultiSelectMode) return;
            clearTimeout(_lp_tmr_);
            _lp_tmr_ = setTimeout(() => {
                _lp_tmr_ = null;
                if (navigator.vibrate) navigator.vibrate(50);
                showMsgMenu(e, msgIndex, _b);
            }, 500);
        };

        const _h_t_m_ = () => { clearTimeout(_lp_tmr_); };
        const _h_t_e_ = () => { clearTimeout(_lp_tmr_); };

        _b.addEventListener('touchstart', _h_t_s_);
        _b.addEventListener('touchmove', _h_t_m_);
        _b.addEventListener('touchend', _h_t_e_);
        _b.addEventListener('touchcancel', _h_t_e_);
        
        _b.addEventListener('mousedown', _h_t_s_);
        _b.addEventListener('mousemove', _h_t_m_);
        _b.addEventListener('mouseup', _h_t_e_);
        _b.addEventListener('mouseleave', _h_t_e_);

        _b.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!isMultiSelectMode) showMsgMenu(e, msgIndex, _b);
        });

        /* 包装气泡并添加底部时间戳/状态，处理转账卡片的贴合与对齐 */
        const _wrapper = document.createElement('div');
        _wrapper.style.display = 'flex';
        _wrapper.style.flexDirection = 'column';
        _wrapper.style.alignItems = _s === 'ai' ? 'flex-start' : 'flex-end';
        _wrapper.style.maxWidth = '70%';
        _wrapper.style.marginTop = '0'; 
        if (_obj.type === 'transfer' || _obj.type === 'ticket') {
            _wrapper.style.gap = '0px';
        } else {
            _wrapper.style.gap = '2px';
        }
        
        const bubbleContainer = document.createElement('div');
        bubbleContainer.style.display = 'flex';
        if (_obj.type === 'transfer' || _obj.type === 'ticket') {
            bubbleContainer.style.alignItems = 'flex-start';
        } else {
            bubbleContainer.style.alignItems = 'center';
        }
        bubbleContainer.style.gap = '8px';
        
        // 如果发送失败（被拉黑），在气泡左侧显示红色感叹号
        if (_s === 'user' && _obj.isFailed) {
            const errorIcon = document.createElement('div');
            errorIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ff3b30"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12" stroke="#fff" stroke-width="2" stroke-linecap="round"></line><circle cx="12" cy="16" r="1" fill="#fff"></circle></svg>`;
            errorIcon.style.cursor = 'pointer';
            errorIcon.onclick = () => requestUnblock(currentChatPersona.id);
            bubbleContainer.appendChild(errorIcon);
        }
        
        _b.style.maxWidth = '100%'; 
        bubbleContainer.appendChild(_b);
        _wrapper.appendChild(bubbleContainer);

        const d = new Date(_obj.time || Date.now());
        const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        const _meta = document.createElement('div');
        _meta.style.fontSize = '9px';
        _meta.style.color = 'var(--text-sub)';
        _meta.style.padding = '0 4px';
        _meta.style.opacity = '0.8';
        
        if (_s === 'user') {
            _meta.textContent = _obj.isFailed ? `${timeStr} · 未送达` : `${timeStr} · 已读`;
            if (_obj.isFailed) _meta.style.color = '#ff3b30';
        } else {
            _meta.textContent = timeStr;
        }
        _wrapper.appendChild(_meta);

        if (_s === 'ai') {
            if (chk) _r.append(chk, _a, _wrapper);
            else _r.append(_a, _wrapper);
        } else {
            if (chk) _r.append(chk, _wrapper, _a);
            else _r.append(_wrapper, _a);
        }
        $('chat-box').appendChild(_r); 
        $('chat-box').scrollTo({ top: $('chat-box').scrollHeight, behavior: 'smooth' });
    }

    // ================= API 预设与设置 =================
    function renderPresets() {
        $('api-preset-select').innerHTML = '<option value="">-- 选择预设 --</option>' + apiPresets.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        if (currentPresetId) $('api-preset-select').value = currentPresetId;
    }

    function loadPreset() {
        const p = apiPresets.find(x => String(x.id) === String($('api-preset-select').value));
        if (p) {
            ['url', 'key', 'model'].forEach(k => $(`api-${k}`).value = p[k] || '');
            $('api-temperature').value = p.temperature || 0.7; $('temp-val').textContent = p.temperature || 0.7;
            $('api-preset-name').value = p.name; currentPresetId = p.id; localStorage.setItem('currentPresetId', p.id);
        }
    }

    function savePreset() {
        const name = $('api-preset-name').value.trim(); if (!name) return _ui_notify_('请输入预设名称');
        const data = { name, url: $('api-url').value.trim(), key: $('api-key').value.trim(), model: $('api-model').value.trim(), temperature: parseFloat($('api-temperature').value) };
        let p = apiPresets.find(x => x.name === name);
        if (p) { Object.assign(p, data); currentPresetId = p.id; } 
        else { data.id = Date.now(); apiPresets.push(data); currentPresetId = data.id; }
        localStorage.setItem('apiPresets', JSON.stringify(apiPresets)); localStorage.setItem('currentPresetId', currentPresetId);
        renderPresets(); _ui_notify_('预设已保存');
    }

    function deletePreset() {
        const id = $('api-preset-select').value; if (!id) return _ui_notify_('请选择要删除的预设');
        if (confirm('确定删除此预设吗？')) {
            apiPresets = apiPresets.filter(x => String(x.id) !== String(id)); localStorage.setItem('apiPresets', JSON.stringify(apiPresets));
            currentPresetId = null; localStorage.removeItem('currentPresetId'); $('api-preset-name').value = ''; renderPresets();
        }
    }

    async function fetchModels() {
        const url = $('api-url').value.trim(), key = $('api-key').value.trim();
        if (!url || !key) return _ui_notify_('请先填写 URL 和 Key');
        $('api-status').textContent = '正在拉取模型...';
        try {
            const res = await fetch(`${url.replace(/\/chat\/completions\/?$/, '')}/models`, { headers: { 'Authorization': `Bearer ${key}` } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.data && Array.isArray(data.data)) {
                $('api-model-select').innerHTML = '<option value="">-- 选择模型 --</option>' + data.data.map(m => `<option value="${m.id}">${m.id}</option>`).join('');
                $('api-model-select').style.display = 'block'; $('api-status').textContent = '模型拉取成功';
            } else throw new Error('返回格式不正确');
        } catch (e) { $('api-status').textContent = `拉取失败: ${e.message}`; }
    }

    function saveAPIConfig() {
        ['apiUrl', 'apiKey', 'apiModel', 'apiTemperature', 'minimaxGroupId', 'minimaxApiKey'].forEach(k => {
            const el = $(k.replace(/([A-Z])/g, "-$1").toLowerCase());
            if(el) localStorage.setItem(k, el.value);
        });
        $('api-status').textContent = '配置已应用';
        _ui_notify_('配置已应用');
    }

    async function testAPIConnection() {
        const url = $('api-url').value, key = $('api-key').value;
        if (!url || !key) return $('api-status').textContent = '请先填写 URL 和 Key';
        $('api-status').textContent = '正在测试连接...';
        try {
            const res = await fetch(url.replace(/\/$/, '') + (url.endsWith('/chat/completions') ? '' : '/chat/completions'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({ model: $('api-model').value, messages: [{role: 'user', content: 'Hello'}], temperature: parseFloat($('api-temperature').value) || 0.7 })
            });
            $('api-status').textContent = res.ok ? '连接成功！API 正常工作。' : `连接失败: HTTP ${res.status}`;
        } catch (e) { $('api-status').textContent = `请求错误: ${e.message}`; }
    }

    // ================= 字体与显示设置 =================
    function renderFontPresets() {
        $('font-preset-select').innerHTML = '<option value="">-- 选择预设 --</option>' + fontPresets.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        if (currentFontPresetId) $('font-preset-select').value = currentFontPresetId;
    }

    function loadFontPreset() {
        const p = fontPresets.find(x => String(x.id) === String($('font-preset-select').value));
        if (p) {
            $('font-preset-name').value = p.name;
            $('font-url-input').value = p.fontUrl || '';
            $('font-scale-slider').value = p.fontScale || 1;
            $('font-scale-val').textContent = p.fontScale || 1;
            tempFontDataUrl = p.fontDataUrl || '';
            $('font-file-name').textContent = tempFontDataUrl ? '已加载本地字体' : '未选择文件';
            currentFontPresetId = p.id;
            localStorage.setItem('currentFontPresetId', p.id);
            updateFontPreview();
        }
    }

    function saveFontPreset() {
        const name = $('font-preset-name').value.trim(); if (!name) return _ui_notify_('请输入预设名称');
        const data = { 
            name, 
            fontUrl: $('font-url-input').value.trim(), 
            fontDataUrl: tempFontDataUrl,
            fontScale: parseFloat($('font-scale-slider').value) 
        };
        let p = fontPresets.find(x => x.name === name);
        if (p) { Object.assign(p, data); currentFontPresetId = p.id; } 
        else { data.id = Date.now(); fontPresets.push(data); currentFontPresetId = data.id; }
        localStorage.setItem('fontPresets', JSON.stringify(fontPresets)); 
        localStorage.setItem('currentFontPresetId', currentFontPresetId);
        renderFontPresets(); _ui_notify_('字体预设已保存');
    }

    function deleteFontPreset() {
        const id = $('font-preset-select').value; if (!id) return _ui_notify_('请选择要删除的预设');
        if (confirm('确定删除此预设吗？')) {
            fontPresets = fontPresets.filter(x => String(x.id) !== String(id)); 
            localStorage.setItem('fontPresets', JSON.stringify(fontPresets));
            currentFontPresetId = null; localStorage.removeItem('currentFontPresetId'); 
            $('font-preset-name').value = ''; renderFontPresets();
        }
    }

    function handleFontFileUpload(e) {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            $('font-file-name').textContent = file.name;
            const reader = new FileReader();
            reader.onload = ev => {
                tempFontDataUrl = ev.target.result;
                _ui_notify_('本地字体已读取，请点击应用');
                updateFontPreview();
            };
            reader.readAsDataURL(file);
        }
    }

    function updateFontPreview() {
        const scale = $('font-scale-slider').value;
        $('font-preview-display').style.fontSize = `calc(16px * ${scale})`;
    }

    function applyAndSaveFontData() {
        const scale = $('font-scale-slider').value;
        const url = $('font-url-input').value.trim();
        
        localStorage.setItem('savedFontScale', scale);
        localStorage.setItem('savedFontUrl', url);
        localStorage.setItem('savedFontDataUrl', tempFontDataUrl);
        
        applyFontToPage(scale, url, tempFontDataUrl);
        _ui_notify_('字体与显示设置已应用并保存');
    }

    function initSavedFont() {
        const scale = localStorage.getItem('savedFontScale') || 1;
        const url = localStorage.getItem('savedFontUrl') || '';
        const dataUrl = localStorage.getItem('savedFontDataUrl') || '';
        
        $('font-scale-slider').value = scale;
        $('font-scale-val').textContent = scale;
        $('font-url-input').value = url;
        tempFontDataUrl = dataUrl;
        if(dataUrl) $('font-file-name').textContent = '已加载本地字体';
        
        applyFontToPage(scale, url, dataUrl);
    }

    function applyFontToPage(scale, url, dataUrl) {
        document.documentElement.style.setProperty('--text-scale', scale);
        
        let fontSrc = '';
        if (dataUrl) { fontSrc = `url(${dataUrl})`; } 
        else if (url) { fontSrc = `url('${url}')`; }
        
        let styleEl = document.getElementById('custom-font-style');
        if (fontSrc) {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'custom-font-style';
                document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = `@font-face { font-family: 'UserCustomFont'; src: ${fontSrc}; }`;
            document.documentElement.style.setProperty('--font-family', '"UserCustomFont", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif');
        } else {
            if (styleEl) styleEl.innerHTML = '';
            document.documentElement.style.setProperty('--font-family', '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif');
        }
    }

    // ================= 世界书系统 =================
    function renderWorldbooks() {
        $('worldbook-list-container').innerHTML = '';
        wbGroups.forEach(g => {
            const groupWbs = worldbooks.filter(w => w.groupId === g.id);
            let html = `<div class="cipher-section-label" style="margin-top:16px;">${g.name} (${groupWbs.length})</div>`;
            groupWbs.forEach(wb => {
                html += `
                    <div class="mask-item">
                        <div class="mask-info">
                            <div class="mask-title">${wb.name}</div>
                            <div class="mask-desc">关键词: ${wb.keys}</div>
                        </div>
                        <div class="action-btns">
                            <div class="action-btn" onclick="editWorldbook(${wb.id})"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
                            <div class="action-btn" onclick="deleteWorldbook(${wb.id})"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
                        </div>
                    </div>`;
            });
            $('worldbook-list-container').innerHTML += html;
        });
    }

    function manageWbGroups() {
        const name = prompt('请输入新分组名称 (输入已有名称则忽略，输入"删除:名称"可删除分组):');
        if (!name) return;
        if (name.startsWith('删除:')) {
            const delName = name.replace('删除:', '').trim();
            wbGroups = wbGroups.filter(g => g.name !== delName || g.id === 'default');
            worldbooks.forEach(w => { if(w.groupId && !wbGroups.find(g=>g.id===w.groupId)) w.groupId = 'default'; });
        } else {
            if (!wbGroups.find(g => g.name === name)) wbGroups.push({id: 'g_'+Date.now(), name});
        }
        localStorage.setItem('wbGroups', JSON.stringify(wbGroups));
        localStorage.setItem('worldbooks', JSON.stringify(worldbooks));
        updateWbGroupSelects();
        renderWorldbooks();
    }

    function updateWbGroupSelects() {
        const opts = wbGroups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        if($('wb-group-select')) $('wb-group-select').innerHTML = opts;
    }

    function updateWbSelectOptions(selectId, selectedValue) {
        const el = $(selectId);
        if (!el) return;
        let html = '<option value="">-- 不绑定 --</option>';
        wbGroups.forEach(g => {
            html += `<option value="group_${g.id}">[分组] ${g.name}</option>`;
            const groupWbs = worldbooks.filter(w => w.groupId === g.id);
            groupWbs.forEach(w => {
                html += `<option value="wb_${w.id}">&nbsp;&nbsp;📄 ${w.name}</option>`;
            });
        });
        el.innerHTML = html;
        if (selectedValue) el.value = selectedValue;
    }

    function openAddWorldbook() {
        $('wb-form-title').textContent = '创建设定'; $('wb-edit-id').value = '';
        ['wb-name', 'wb-keys', 'wb-content'].forEach(id => $(id).value = '');
        $('wb-pos').value = 'before';
        $('wb-global').checked = false;
        updateWbGroupSelects();
        openSubView('sub-add-worldbook');
    }

    function editWorldbook(id) {
        const wb = worldbooks.find(x => String(x.id) === String(id)); if(!wb) return;
        $('wb-form-title').textContent = '编辑设定'; $('wb-edit-id').value = wb.id;
        $('wb-name').value = wb.name; $('wb-keys').value = wb.keys; $('wb-pos').value = wb.pos; $('wb-content').value = wb.content;
        $('wb-global').checked = !!wb.isGlobal;
        updateWbGroupSelects();
        $('wb-group-select').value = wb.groupId || 'default';
        openSubView('sub-add-worldbook');
    }

    function saveWorldbook() {
        const _i = $('wb-edit-id').value, _n = $('wb-name').value.trim();
        if(!_n) return _ui_notify_('请输入设定名称');
        const _dt = { id: _i ? parseInt(_i) : Date.now(), name: _n, keys: $('wb-keys').value.trim(), pos: $('wb-pos').value, content: $('wb-content').value.trim(), groupId: $('wb-group-select').value, isGlobal: $('wb-global').checked };
        if(_i) { const _x = worldbooks.findIndex(x => String(x.id) === String(_i)); if(_x > -1) worldbooks[_x] = _dt; } 
        else worldbooks.push(_dt);
        localStorage.setItem('worldbooks', JSON.stringify(worldbooks)); 
        renderWorldbooks(); closeSubView('sub-add-worldbook'); _ui_notify_('设定保存成功');
    }

    function deleteWorldbook(id) {
        if(confirm('确定删除这个设定吗？')) { worldbooks = worldbooks.filter(x => String(x.id) !== String(id)); localStorage.setItem('worldbooks', JSON.stringify(worldbooks)); renderWorldbooks(); }
    }

    // ================= 表情包系统 =================
    function manageStickerGroups() {
        showCustomPrompt('请输入新表情分组名称\n(输入"删除:名称"可删除)', '', name => {
            if (!name) return;
            if (name.startsWith('删除:')) {
                const delName = name.replace('删除:', '').trim();
                stickerGroups = stickerGroups.filter(g => g.name !== delName || g.id === 'default');
                stickers.forEach(s => { if(!stickerGroups.find(g=>g.id===s.groupId)) s.groupId = 'default'; });
            } else {
                if (!stickerGroups.find(g => g.name === name)) stickerGroups.push({id: 'sg_'+Date.now(), name});
            }
            localStorage.setItem('stickerGroups', JSON.stringify(stickerGroups));
            localStorage.setItem('stickers', JSON.stringify(stickers));
            renderStickerGroups();
        });
    }

    function renderStickerGroups() {
        const val = $('sticker-group-select-val').value || 'default';
        const group = stickerGroups.find(g => g.id === val) || stickerGroups[0];
        $('sticker-group-select-display').textContent = group.name;
        renderStickers();
    }

    function toggleStickerManageMode() {
        isStickerManageMode = !isStickerManageMode;
        selectedStickers.clear();
        $('sticker-manage-btn').textContent = isStickerManageMode ? '完成' : '管理';
        $('sticker-manage-actions').style.display = isStickerManageMode ? 'flex' : 'none';
        renderStickers();
    }

    function renderStickers() {
        const groupId = $('sticker-group-select-val').value || 'default';
        const keyword = $('sticker-search-input').value.trim().toLowerCase();
        const grid = $('sticker-grid');
        
        let groupStickers = stickers.filter(s => s.groupId === groupId);
        if (keyword) {
            groupStickers = groupStickers.filter(s => (s.desc || '').toLowerCase().includes(keyword));
        }
        
        grid.innerHTML = groupStickers.map(s => `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                <div style="position:relative; width:100%; aspect-ratio:1; border-radius:8px; overflow:hidden; border:2px solid ${selectedStickers.has(s.id) ? 'var(--text-main)' : 'transparent'}; cursor:pointer;" onclick="handleStickerClick('${s.id}')">
                    <img src="${s.url}" style="width:100%; height:100%; object-fit:cover;">
                    ${isStickerManageMode && selectedStickers.has(s.id) ? `<div style="position:absolute; top:4px; right:4px; width:16px; height:16px; background:var(--text-main); border-radius:50%; display:flex; align-items:center; justify-content:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-color)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>` : ''}
                </div>
                <div style="font-size:9px; color:var(--text-sub); width:100%; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.desc || '无描述'}</div>
            </div>
        `).join('');
    }

    function handleStickerClick(id) {
        if (isStickerManageMode) {
            if (selectedStickers.has(id)) selectedStickers.delete(id);
            else selectedStickers.add(id);
            renderStickers();
        } else {
            const s = stickers.find(x => x.id === id);
            if (!s) return;
            showCustomPrompt('发送表情，可修改描述供AI读取:', s.desc || '', desc => {
                s.desc = desc; 
                localStorage.setItem('stickers', JSON.stringify(stickers));
                
                const msgObj = { type: 'sticker', url: s.url, content: `【表情包：${desc}】` };
                appendMessage(msgObj, 'user', messageHistory.length);
                messageHistory.push({ role: 'user', ...msgObj });
                saveChatHistory();
                $('sticker-panel').style.display = 'none';
            });
        }
    }

    function handleStickerUpload(e) {
        const files = e.target.files;
        const groupId = $('sticker-group-select-val').value || 'default';
        for(let i=0; i<files.length; i++) {
            const reader = new FileReader();
            reader.onload = ev => {
                stickers.push({ id: 's_'+Date.now()+'_'+i, groupId, url: ev.target.result, desc: '' });
                localStorage.setItem('stickers', JSON.stringify(stickers));
                renderStickers();
            };
            reader.readAsDataURL(files[i]);
        }
    }

    function importStickerDoc() {
        showCustomSelect('选择导入方式', [
            {label: '选择本地 TXT 文档', value: 'file'},
            {label: '手动粘贴文本', value: 'text'}
        ], val => {
            if (val === 'file') {
                $('sticker-doc-upload').click();
            } else {
                showCustomPrompt('请粘贴文档内容\n(格式: 描述:xxx链接)', '', txt => {
                    if (txt) processStickerText(txt);
                });
            }
        });
    }

    function handleStickerDocUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            processStickerText(ev.target.result);
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function processStickerText(txt) {
        const groupId = $('sticker-group-select-val').value || 'default';
        const regex = /(?:([^h\n]+))?(https?:\/\/[^\s]+)/g;
        let match;
        let count = 0;
        while ((match = regex.exec(txt)) !== null) {
            let desc = (match[1] || '').replace(/描述:?|：/g, '').trim();
            let url = match[2].trim();
            stickers.push({ id: 's_'+Date.now()+'_'+count, groupId, url, desc });
            count++;
        }
        if (count > 0) {
            localStorage.setItem('stickers', JSON.stringify(stickers));
            renderStickers();
            _ui_notify_(`成功导入 ${count} 个表情`);
        } else {
            _ui_notify_('未识别到有效链接');
        }
    }

    function moveSelectedStickers(targetId) {
        if (selectedStickers.size === 0) return;
        stickers.forEach(s => { if(selectedStickers.has(s.id)) s.groupId = targetId; });
        localStorage.setItem('stickers', JSON.stringify(stickers));
        toggleStickerManageMode();
        _ui_notify_('移动成功');
    }

    function deleteSelectedStickers() {
        if (selectedStickers.size === 0) return;
        if (confirm(`确定删除选中的 ${selectedStickers.size} 个表情吗？`)) {
            stickers = stickers.filter(s => !selectedStickers.has(s.id));
            localStorage.setItem('stickers', JSON.stringify(stickers));
            toggleStickerManageMode();
        }
    }

    // ================= 角色额外操作 =================
    function clearChatHistory() {
        const id = $('persona-edit-id').value;
        if(confirm('确定清空与该角色的聊天记录吗？')) {
            allChats[id] = []; localStorage.setItem('allChats', JSON.stringify(allChats));
            if(currentChatPersona && String(currentChatPersona.id) === String(id)) { messageHistory = []; $('chat-box').innerHTML = ''; }
            renderRecentChats(); _ui_notify_('记录已清空'); closeSubView('sub-add-persona');
        }
    }

    function exportChatHistory() {
        const id = $('persona-edit-id').value;
        const history = allChats[id] || [];
        const blob = new Blob([JSON.stringify(history, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `chat_history_${id}.json`;
        a.click(); URL.revokeObjectURL(url); _ui_notify_('导出成功');
    }

    function importChatHistory(e) {
        const id = $('persona-edit-id').value;
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if(Array.isArray(data)) {
                        allChats[id] = data; localStorage.setItem('allChats', JSON.stringify(allChats));
                        if(currentChatPersona && String(currentChatPersona.id) === String(id)) { openChatWith(id); }
                        renderRecentChats(); _ui_notify_('导入成功'); closeSubView('sub-add-persona');
                    } else throw new Error('格式错误');
                } catch(err) { _ui_notify_('导入失败：文件格式不正确'); }
            };
            reader.readAsText(e.target.files[0]);
        }
    }

    // ================= 其他设置 =================
    function saveUserProfile() {
        const name = $('display-nickname').innerHTML;
        localStorage.setItem('userNickname', name);
        localStorage.setItem('userBio', $('display-bio').innerHTML);
        if($('settings-card-name')) $('settings-card-name').textContent = name.replace(/<[^>]*>?/gm, '');
    }

    function handleAvatarUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let w = img.width, h = img.height;
                    if (w > 400) { h = h * (400 / w); w = 400; }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    userAvatarDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    localStorage.setItem('userAvatar', userAvatarDataUrl);
                    $('my-avatar-img').src = userAvatarDataUrl; 
                    $('my-avatar-img').style.display = 'block'; 
                    $('my-avatar-text').style.display = 'none';
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    // 强力压缩图片，防止 localStorage 爆满
    function compressImage(file, maxWidth, callback) {
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let w = img.width, h = img.height;
                if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
                canvas.width = w; canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                callback(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleBgUpload(e) {
        if (e.target.files[0]) {
            compressImage(e.target.files[0], 1080, (dataUrl) => {
                try {
                    $('chat-detail').style.backgroundImage = `url(${dataUrl})`;
                    localStorage.setItem('chatBg', dataUrl);
                    _ui_notify_('聊天背景已更新并保存！');
                } catch (err) {
                    _ui_notify_('图片依然过大，请尝试更小的图片');
                }
            });
        }
    }
    /* 突破限制：使用 IndexedDB 保存聊天大图，防止 localStorage 爆满卡顿 */
    function handleRealAlbum(e) {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = ev => {
                const base64Data = ev.target.result;
                const imgId = 'img_' + Date.now();
                
                /* 存入 IndexedDB，使用安全封装防止崩溃 */
                initAuraDB(db => {
                    try {
                        const tx = db.transaction("media", "readwrite");
                        tx.objectStore("media").put(base64Data, imgId);
                        
                        // 提示输入描述
                        showCustomPrompt('发送图片，可添加描述供AI读取:', '', desc => {
                            const msgObj = { type: 'image', url: 'indexeddb:' + imgId, content: `【图片：${desc || '无描述'}】` };
                            appendMessage(msgObj, 'user', messageHistory.length);
                            messageHistory.push({ role: 'user', ...msgObj });
                            saveChatHistory();
                            _ui_notify_('图片已发送并保存至本地数据库');
                        });
                    } catch(e) {
                        _ui_notify_('图片保存失败: ' + e.message);
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    }
        // ================= 全局单击标题返回桌面 =================
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.app-header-title').forEach(el => {
            el.style.cursor = 'pointer';
            el.title = '单击返回桌面';
            el.addEventListener('click', goHome);
        });
    });

    // ================= 主题设置：隐藏横条与圆角调整 =================
    function toggleHomeIndicator(isHide) {
        // 使用透明度隐藏，保留点击热区
        const indicator = document.querySelector('.home-indicator');
        if (isHide) {
            indicator.style.opacity = '0';
            indicator.style.background = 'transparent';
        } else {
            indicator.style.opacity = '1';
            indicator.style.background = ''; 
        }
        localStorage.setItem('hideHomeIndicator', isHide);
    }

    function updateIconRadius(val) {
        document.documentElement.style.setProperty('--app-icon-radius', val + 'px');
        const valEl = document.getElementById('icon-radius-val');
        if(valEl) valEl.textContent = val;
        localStorage.setItem('appIconRadius', val);
    }

    // 在 window.onload 中恢复主题设置
    const originalOnload = window.onload;
    window.onload = () => {
        if (originalOnload) originalOnload();
        
        if(localStorage.getItem('hideHomeIndicator') === 'true') {
            const indicator = document.querySelector('.home-indicator');
            indicator.style.opacity = '0';
            indicator.style.background = 'transparent';
            const toggle = document.getElementById('hide-indicator-toggle');
            if(toggle) toggle.checked = true;
        }
        
        if(localStorage.getItem('appIconRadius')) {
            const r = localStorage.getItem('appIconRadius');
            document.documentElement.style.setProperty('--app-icon-radius', r + 'px');
            const slider = document.getElementById('icon-radius-slider');
            const valEl = document.getElementById('icon-radius-val');
            if(slider) slider.value = r;
            if(valEl) valEl.textContent = r;
        }
    };

    let musicPlaylist = JSON.parse(localStorage.getItem('musicPlaylist')) || [];
    let userPlaylists = JSON.parse(localStorage.getItem('cachedUserPlaylists')) || []; // 增加本地缓存
    let currentMusicIndex = -1;
    let musicPlayMode = 'sequence';
    let likedMusics = JSON.parse(localStorage.getItem('likedMusics')) || [];
    let currentMusicLyrics = [];
    let isMusicPlaying = false;
    const MUSIC_API_BASE = "https://ncm.zhenxin.me";
    const AUDIO_API_METING = 'https://api.qijieya.cn/meting/?server=netease&type=url&id=';
    let sysAudio = null;
    let musicUid = localStorage.getItem('musicUid') || '';

    function saveMusicPlaylist() {
        localStorage.setItem('musicPlaylist', JSON.stringify(musicPlaylist));
    }

    async function loginMusicUID() {
        const uid = $('music-uid-input').value.trim() || musicUid;
        if (!uid) return _ui_notify_('请输入网易云 UID');
        
        $('music-login-section').style.display = 'none';
        $('music-main-section').style.display = 'flex';
        $('music-bottom-nav').style.display = 'flex';
        
        // 如果有缓存，先渲染缓存，再静默更新
        if (userPlaylists.length > 0) {
            renderUserPlaylists();
        } else {
            $('music-search-results').innerHTML = '<div style="text-align:center; padding:40px; font-family:\'Cormorant Garamond\', serif; font-size:16px; color:var(--text-sub);">正在同步歌单...</div>';
        }
        
        try {
            const res = await fetch(`${MUSIC_API_BASE}/user/playlist?uid=${uid}`);
            const data = await res.json();
            if (data.code === 200) {
                localStorage.setItem('musicUid', uid);
                musicUid = uid;
                userPlaylists = data.playlist;
                localStorage.setItem('cachedUserPlaylists', JSON.stringify(userPlaylists));
                renderUserPlaylists();
            } else {
                throw new Error('UID 无效');
            }
        } catch (e) {
            if (userPlaylists.length === 0) {
                _ui_notify_('同步失败，请检查网络或 UID');
                $('music-login-section').style.display = 'block';
                $('music-main-section').style.display = 'none';
                $('music-bottom-nav').style.display = 'none';
            }
        }
    }

    function skipMusicLogin() {
        $('music-login-section').style.display = 'none';
        $('music-main-section').style.display = 'flex';
        $('music-bottom-nav').style.display = 'flex';
        switchMusicTab('search');
    }

    function renderUserPlaylists() {
        const container = $('music-search-results');
        container.innerHTML = userPlaylists.map(pl => `
            <div style="display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--glass-border); cursor: pointer;" onclick="loadPlaylistDetail('${pl.id}')">
                <img src="${pl.coverImgUrl}?param=100y100" style="width: 56px; height: 56px; object-fit: cover; filter: grayscale(10%); border-radius: 4px;">
                <div style="flex: 1; overflow: hidden;">
                    <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pl.name}</div>
                    <div style="font-family: 'Cormorant Garamond', serif; font-size: 12px; color: var(--text-sub);">${pl.trackCount} 首歌曲</div>
                </div>
            </div>
        `).join('');
    }

    async function loadPlaylistDetail(id) {
        const container = $('music-search-results');
        container.innerHTML = '<div style="text-align:center; padding:40px; font-family:\'Cormorant Garamond\', serif; font-size:16px; color:var(--text-sub);">正在加载歌曲...</div>';
        try {
            const res = await fetch(`${MUSIC_API_BASE}/playlist/detail?id=${id}`);
            const data = await res.json();
            if (data.code === 200 && data.playlist.tracks) {
                musicPlaylist = data.playlist.tracks.map(song => ({
                    id: song.id,
                    name: song.name,
                    artist: song.ar.map(a => a.name).join('/'),
                    cover: (song.al.picUrl || '').replace(/^http:/, 'https:') + '?param=100y100'
                }));
                saveMusicPlaylist();
                renderMusicList(musicPlaylist, '歌单为空', 'playlist');
            }
        } catch (e) {
            _ui_notify_('加载歌单失败');
            renderUserPlaylists();
        }
    }

    async function importPlaylist() {
        const link = prompt("请粘贴网易云音乐歌单链接\n(例如: https://music.163.com/playlist?id=123456):");
        if (!link) return;
        
        const match = link.match(/id=(\d+)/) || link.match(/\/playlist\/(\d+)/) || link.match(/^(\d+)$/);
        if (!match) return _ui_notify_("无法识别歌单ID，请检查链接格式");
        
        const playlistId = match[1];
        const resContainer = $('music-search-results');
        resContainer.innerHTML = '<div style="text-align:center; padding:40px 20px; color:var(--text-sub); font-size:12px;">正在解析并导入歌单，请稍候...</div>';
        
        try {
            const res = await fetch(`${MUSIC_API_BASE}/playlist/detail?id=${playlistId}`);
            const data = await res.json();
            
            if (data.code === 200 && data.playlist && data.playlist.tracks) {
                const tracks = data.playlist.tracks;
                let addedCount = 0;
                
                tracks.forEach(song => {
                    if (!musicPlaylist.find(s => String(s.id) === String(song.id))) {
                        musicPlaylist.push({
                            id: song.id,
                            name: song.name,
                            artist: song.ar.map(a => a.name).join('/'),
                            cover: (song.al.picUrl || '').replace(/^http:/, 'https:') + '?param=100y100'
                        });
                        addedCount++;
                    }
                });
                
                saveMusicPlaylist();
                _ui_notify_(`成功导入 ${addedCount} 首新歌曲！`);
                switchMusicTab('playlist');
            } else {
                _ui_notify_("获取歌单失败，可能是私密歌单或无版权");
                switchMusicTab('playlist');
            }
        } catch (e) {
            _ui_notify_("网络错误，导入失败");
            switchMusicTab('playlist');
        }
    }

    function openMusicApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('music-app-window').classList.add('open');
        $('status-bar').style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#000'; 
        $('status-bar').style.textShadow = 'none';
        
        const savedBg = localStorage.getItem('musicBg');
        if (savedBg) {
            $('music-app-window').style.backgroundImage = `url(${savedBg})`;
            $('music-app-window').style.backgroundSize = 'cover';
        }
        
        if (musicUid) {
            $('music-login-section').style.display = 'none';
            $('music-main-section').style.display = 'flex';
            $('music-bottom-nav').style.display = 'flex';
            if (userPlaylists.length === 0) {
                loginMusicUID(); // 自动静默登录
            } else {
                switchMusicTab('playlist');
            }
        } else {
            $('music-login-section').style.display = 'block';
            $('music-main-section').style.display = 'none';
            $('music-bottom-nav').style.display = 'none';
        }
        if(!sysAudio) {
            sysAudio = document.getElementById('sys-audio-player');
            sysAudio.addEventListener('ended', () => { 
                if (musicPlayMode === 'loop') {
                    sysAudio.play();
                } else {
                    nextMusic();
                }
            });
            sysAudio.addEventListener('pause', () => { isMusicPlaying = false; updateMusicPlayBtn(); });
            sysAudio.addEventListener('play', () => { isMusicPlaying = true; updateMusicPlayBtn(); });
            sysAudio.addEventListener('timeupdate', () => {
                if (sysAudio.duration) {
                    const progress = (sysAudio.currentTime / sysAudio.duration) * 100;
                    $('full-music-progress').value = progress;
                    $('full-music-current').textContent = formatMusicTime(sysAudio.currentTime);
                    updateLyricsDisplay(sysAudio.currentTime);
                }
            });
            sysAudio.addEventListener('loadedmetadata', () => {
                $('full-music-duration').textContent = formatMusicTime(sysAudio.duration);
            });
        }
    }

    function switchMusicTab(tab) {
        ['search', 'playlist', 'profile'].forEach(t => {
            const el = $(`music-tab-${t}`);
            if (el) {
                el.style.color = tab === t ? 'var(--text-main)' : 'var(--text-sub)';
                el.style.fontWeight = tab === t ? 'bold' : 'normal';
            }
        });
        
        $('music-search-bar').style.display = 'none';
        $('music-search-results').style.display = 'none';
        $('music-profile-section').style.display = 'none';
        
        if (tab === 'search') {
            $('music-search-bar').style.display = 'block';
            $('music-search-results').style.display = 'block';
            $('music-search-results').innerHTML = '<div style="text-align:center; padding:40px; font-family:\'Cormorant Garamond\', serif; font-size:16px; color:var(--text-sub);">搜索你想听的歌曲...</div>';
        } else if (tab === 'playlist') {
            $('music-search-results').style.display = 'block';
            if (musicUid && userPlaylists.length > 0) {
                renderUserPlaylists();
            } else {
                renderMusicList(musicPlaylist, '暂无歌曲', 'playlist');
            }
        } else if (tab === 'profile') {
            $('music-profile-section').style.display = 'flex';
            $('music-user-nickname').textContent = localStorage.getItem('musicNickname') || 'Guest';
            const savedAvatar = localStorage.getItem('musicAvatar');
            if (savedAvatar) $('music-user-avatar').src = savedAvatar;
        }
    }

    function saveMusicProfile() {
        localStorage.setItem('musicNickname', $('music-user-nickname').textContent);
    }

    function handleMusicAvatarUpload(e) {
        if (e.target.files[0]) {
            compressImage(e.target.files[0], 400, (dataUrl) => {
                $('music-user-avatar').src = dataUrl;
                localStorage.setItem('musicAvatar', dataUrl);
            });
        }
    }

    function handleMusicBgUpload(e) {
        if (e.target.files[0]) {
            compressImage(e.target.files[0], 1080, (dataUrl) => {
                $('music-app-window').style.backgroundImage = `url(${dataUrl})`;
                $('music-app-window').style.backgroundSize = 'cover';
                localStorage.setItem('musicBg', dataUrl);
                _ui_notify_('音乐背景已更新');
            });
        }
    }

    function logoutMusic() {
        if(confirm('确定要退出当前账号吗？')) {
            localStorage.removeItem('musicUid');
            localStorage.removeItem('cachedUserPlaylists');
            musicUid = '';
            userPlaylists = [];
            $('music-login-section').style.display = 'block';
            $('music-main-section').style.display = 'none';
            $('music-bottom-nav').style.display = 'none';
            $('music-mini-player').style.display = 'none';
            if(sysAudio) sysAudio.pause();
            _ui_notify_('已退出账号');
        }
    }

    function renderMusicList(list, emptyMsg, listType = 'playlist') {
        const resContainer = $('music-search-results');
        if (!list || list.length === 0) {
            resContainer.innerHTML = `<div style="text-align:center; padding:40px; font-family:\'Cormorant Garamond\', serif; font-size:16px; color:var(--text-sub);">${emptyMsg}</div>`;
            return;
        }
        resContainer.innerHTML = list.map((song, idx) => {
            const safeName = song.name.replace(/'/g, "\\'");
            const safeArtist = song.artist.replace(/'/g, "\\'");
            const num = String(idx + 1).padStart(2, '0');
            return `
                <div style="display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--glass-border); cursor: pointer;" onclick="playMusicFromList(${idx}, '${escape(JSON.stringify(list))}')">
                    <div style="font-family: 'Cormorant Garamond', serif; font-size: 16px; color: var(--text-sub); width: 24px;">${num}</div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.name}</div>
                        <div style="font-family: 'Cormorant Garamond', serif; font-size: 12px; font-style: italic; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.artist}</div>
                    </div>
                    <div onclick="removeFromList(event, ${idx}, '${listType}')" style="color: var(--text-sub); font-size: 16px; padding: 0 5px;">✕</div>
                </div>
            `;
        }).join('');
    }

    function removeFromList(e, idx, listType) {
        e.stopPropagation();
        if (listType === 'playlist') {
            musicPlaylist.splice(idx, 1);
            saveMusicPlaylist();
            if (currentMusicIndex === idx) currentMusicIndex = -1;
            else if (currentMusicIndex > idx) currentMusicIndex--;
            switchMusicTab('playlist');
        } else if (listType === 'liked') {
            likedMusics.splice(idx, 1);
            localStorage.setItem('likedMusics', JSON.stringify(likedMusics));
            switchMusicTab('liked');
        }
    }

    function playMusicFromList(idx, listStr) {
        const list = JSON.parse(unescape(listStr));
        musicPlaylist = list;
        const song = list[idx];
        playMusic(song.id, song.name, song.artist, song.cover);
        currentMusicIndex = idx;
    }

    function playSearchedSong(id, name, artist, cover) {
        let idx = musicPlaylist.findIndex(s => String(s.id) === String(id));
        if (idx === -1) {
            musicPlaylist.push({id, name, artist, cover});
            idx = musicPlaylist.length - 1;
            saveMusicPlaylist();
        }
        currentMusicIndex = idx;
        playMusic(id, name, artist, cover);
    }

    async function searchMusic() {
        const query = $('music-search-input').value.trim();
        if(!query) return;
        const resContainer = $('music-search-results');
        resContainer.innerHTML = '<div style="text-align:center; padding:40px; font-family:\'Cormorant Garamond\', serif; font-size:16px; color:var(--text-sub);">正在搜索...</div>';
        try {
            const res = await fetch(`${MUSIC_API_BASE}/cloudsearch?keywords=${encodeURIComponent(query)}&limit=20`);
            const data = await res.json();
            if(data.code === 200 && data.result && data.result.songs) {
                resContainer.innerHTML = data.result.songs.map((song, idx) => {
                    const picUrl = (song.al.picUrl || '').replace(/^http:/, 'https:') + '?param=100y100';
                    const artist = song.ar.map(a => a.name).join('/');
                    const safeName = song.name.replace(/'/g, "\\'");
                    const safeArtist = artist.replace(/'/g, "\\'");
                    const num = String(idx + 1).padStart(2, '0');
                    return `
                        <div style="display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--glass-border); cursor: pointer;" onclick="playSearchedSong('${song.id}', '${safeName}', '${safeArtist}', '${picUrl}')">
                            <div style="font-family: 'Cormorant Garamond', serif; font-size: 16px; color: var(--text-sub); width: 24px;">${num}</div>
                            <div style="flex: 1; overflow: hidden;">
                                <div style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${song.name}</div>
                                <div style="font-family: 'Cormorant Garamond', serif; font-size: 12px; font-style: italic; color: var(--text-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${artist}</div>
                            </div>
                            <div style="color: var(--text-main); font-size: 14px;">▶</div>
                        </div>
                    `;
                }).join('');
            } else {
                resContainer.innerHTML = '<div style="text-align:center; padding:40px; font-family:\'Cormorant Garamond\', serif; font-size:16px; color:var(--text-sub);">无结果</div>';
            }
        } catch(e) {
            resContainer.innerHTML = '<div style="text-align:center; padding:40px; font-family:\'Cormorant Garamond\', serif; font-size:16px; color:var(--text-sub);">网络错误，请重试</div>';
        }
    }

    async function playMusic(id, name, artist, cover) {
        if(!sysAudio) sysAudio = document.getElementById('sys-audio-player');
        sysAudio.src = `${AUDIO_API_METING}${id}`;
        sysAudio.play().then(() => {
            isMusicPlaying = true;
            updateMusicPlayBtn();
            updateDynamicIsland(name, artist, cover);
        }).catch(e => {
            _ui_notify_('播放失败，可能是VIP歌曲或无版权');
        });
        
        $('music-mini-player').style.display = 'flex';
        $('music-mini-cover').src = cover;
        $('music-mini-title').textContent = name;
        $('music-mini-artist').textContent = artist;
        
        $('full-music-cover').src = cover;
        $('full-music-title').textContent = name;
        $('full-music-artist').textContent = artist;
        
        updateMusicLikeBtn(id);
        fetchLyrics(id);
        
        if (currentMusicIndex === -1) {
            musicPlaylist = [{id, name, artist, cover}];
            currentMusicIndex = 0;
        }
    }

    async function fetchLyrics(id) {
        try {
            const res = await fetch(`${MUSIC_API_BASE}/lyric?id=${id}`);
            const data = await res.json();
            if (data.lrc && data.lrc.lyric) {
                currentMusicLyrics = parseMusicLRC(data.lrc.lyric);
            } else {
                currentMusicLyrics = [];
            }
            renderLyrics();
        } catch (e) {
            currentMusicLyrics = [];
            renderLyrics();
        }
    }

    function parseMusicLRC(lrcText) {
        if (!lrcText) return [];
        const lines = lrcText.split('\n');
        const result = [];
        const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;
        for (const line of lines) {
            const match = timeRegex.exec(line);
            if (match) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const time = minutes * 60 + seconds;
                const text = line.replace(timeRegex, '').trim();
                if (text) result.push({ time, text });
            }
        }
        return result;
    }

    function renderLyrics() {
        const container = $('full-music-lyrics');
        if (currentMusicLyrics.length === 0) {
            container.innerHTML = '<div style="margin-top: 50px;">纯音乐，请欣赏</div>';
            return;
        }
        container.innerHTML = currentMusicLyrics.map((l, i) => `<div id="lrc-${i}" style="transition: all 0.3s;">${l.text}</div>`).join('');
    }

    function updateLyricsDisplay(currentTime) {
        if (currentMusicLyrics.length === 0) return;
        let activeIdx = -1;
        for (let i = 0; i < currentMusicLyrics.length; i++) {
            if (currentTime >= currentMusicLyrics[i].time) {
                activeIdx = i;
            } else {
                break;
            }
        }
        if (activeIdx !== -1) {
            const container = $('full-music-lyrics');
            for (let i = 0; i < container.children.length; i++) {
                if (i === activeIdx) {
                    container.children[i].style.color = '#fff';
                    container.children[i].style.fontSize = '16px';
                    container.children[i].style.fontWeight = 'bold';
                } else {
                    container.children[i].style.color = '#aaa';
                    container.children[i].style.fontSize = '14px';
                    container.children[i].style.fontWeight = 'normal';
                }
            }
            const activeEl = $('lrc-' + activeIdx);
            if (activeEl) {
                container.scrollTo({
                    top: activeEl.offsetTop - container.clientHeight / 2 + 20,
                    behavior: 'smooth'
                });
            }
        }
    }

    function toggleMusicPlay(e) {
        if (e) e.stopPropagation();
        if(!sysAudio || !sysAudio.src) return;
        if(isMusicPlaying) {
            sysAudio.pause();
        } else {
            sysAudio.play();
        }
    }

    function updateMusicPlayBtn() {
        const btn = $('music-play-btn');
        const fullBtn = $('full-music-play-btn');
        const playIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        const pauseIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        const fullPlayIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        const fullPauseIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        
        if(btn) btn.innerHTML = isMusicPlaying ? pauseIcon : playIcon;
        if(fullBtn) fullBtn.innerHTML = isMusicPlaying ? fullPauseIcon : fullPlayIcon;
        
        const cd = $('full-music-cd');
        if (cd) {
            cd.style.animationPlayState = isMusicPlaying ? 'running' : 'paused';
        }
        
        const notch = $('dynamic-island');
        if (notch && notch.style.display !== 'none') {
            if (isMusicPlaying) {
                notch.classList.add('music-active');
            } else {
                notch.classList.remove('music-active');
            }
        }
    }

    function openMusicFullPlayer() {
        $('music-full-player').classList.add('open');
    }

    function closeMusicFullPlayer() {
        $('music-full-player').classList.remove('open');
    }

    function showMusicPlaylist(e) {
        if (e) e.stopPropagation();
        switchMusicTab('playlist');
    }

    function togglePlayMode() {
        const modes = ['sequence', 'loop', 'random'];
        const icons = {
            'sequence': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
            'loop': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><text x="10" y="16" font-size="10" fill="currentColor" stroke="none">1</text></svg>`,
            'random': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`
        };
        let idx = modes.indexOf(musicPlayMode);
        musicPlayMode = modes[(idx + 1) % modes.length];
        $('play-mode-btn').innerHTML = icons[musicPlayMode];
        _ui_notify_(musicPlayMode === 'sequence' ? '列表循环' : (musicPlayMode === 'loop' ? '单曲循环' : '随机播放'));
    }

    function nextMusic() {
        if (musicPlaylist.length === 0) return;
        if (musicPlayMode === 'random') {
            currentMusicIndex = Math.floor(Math.random() * musicPlaylist.length);
        } else {
            currentMusicIndex = (currentMusicIndex + 1) % musicPlaylist.length;
        }
        const song = musicPlaylist[currentMusicIndex];
        playMusic(song.id, song.name, song.artist, song.cover);
    }

    function prevMusic() {
        if (musicPlaylist.length === 0) return;
        if (musicPlayMode === 'random') {
            currentMusicIndex = Math.floor(Math.random() * musicPlaylist.length);
        } else {
            currentMusicIndex = (currentMusicIndex - 1 + musicPlaylist.length) % musicPlaylist.length;
        }
        const song = musicPlaylist[currentMusicIndex];
        playMusic(song.id, song.name, song.artist, song.cover);
    }

    function toggleMusicLike() {
        if (currentMusicIndex === -1) return;
        const song = musicPlaylist[currentMusicIndex];
        const idx = likedMusics.findIndex(s => s.id === song.id);
        if (idx > -1) {
            likedMusics.splice(idx, 1);
            _ui_notify_('已取消喜欢');
        } else {
            likedMusics.push(song);
            _ui_notify_('已添加到我喜欢的音乐');
        }
        localStorage.setItem('likedMusics', JSON.stringify(likedMusics));
        updateMusicLikeBtn(song.id);
        if ($('music-tab-liked').style.fontWeight === 'bold') {
            renderMusicList(likedMusics, '暂无喜欢的歌曲', 'liked');
        }
    }

    function updateMusicLikeBtn(id) {
        const isLiked = likedMusics.some(s => s.id === id);
        const btn = $('music-like-btn');
        if (btn) {
            btn.innerHTML = isLiked 
                ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ff3b30" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
        }
    }

    function seekFullMusic(val) {
        if (sysAudio && sysAudio.duration) {
            sysAudio.currentTime = (val / 100) * sysAudio.duration;
        }
    }

    function formatMusicTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateDynamicIsland(name, artist, cover) {
        const notch = $('dynamic-island');
        if (notch && notch.style.display !== 'none') {
            $('notch-cover').src = cover;
            $('notch-text').textContent = `${name} - ${artist}`;
            notch.classList.add('music-active');
            notch.onclick = () => {
                openApp();
                openMusicApp();
                openMusicFullPlayer();
            };
        }
    }
      // 全屏模式控制
    function toggleFullScreen(isFull) {
        if (isFull) {
            if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
            else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    }
    
    // 监听按 ESC 退出全屏时，同步开关状态
    document.addEventListener('fullscreenchange', () => {
        const isFull = !!document.fullscreenElement;
        const toggle = document.getElementById('fullscreen-toggle');
        if(toggle) toggle.checked = isFull;
    });

    // 手机外壳控制
    function togglePhoneShell(isHide) {
        if (isHide) document.body.classList.add('no-shell');
        else document.body.classList.remove('no-shell');
        localStorage.setItem('hidePhoneShell', isHide);
    }

    // ================= 钱包、外卖、记忆、转账逻辑 =================
    let walletData = JSON.parse(localStorage.getItem('walletData')) || { 'ME': { balance: 0, huabei: 0, funds: 0, stocks: 0, mainBg: '', bankCards: [], familyCards: [], bills: [] } };
    let walletCreds = JSON.parse(localStorage.getItem('walletCreds')) || {};
    let currentWalletAccount = 'ME';

    let toCart = {};
    let toCurrentShopIdx = 0;
    let toSelectedPayMethod = 'balance';
    let toAddresses = JSON.parse(localStorage.getItem('toAddresses')) || [
        {id:'a1',tag:'公司',addr:'科技园A座 3楼',name:'张三',phone:'138****8888'},
        {id:'a2',tag:'家',addr:'幸福小区 12栋 801',name:'张三',phone:'138****8888'}
    ];
    let toSelectedAddrId = toAddresses.length > 0 ? toAddresses[0].id : '';
    let toOrderHistory = JSON.parse(localStorage.getItem('toOrderHistory')) || [];
    let toFavorites = JSON.parse(localStorage.getItem('toFavorites')) || { shops: [], items: [] };
    let toSearchResults = JSON.parse(localStorage.getItem('toSearchResults')) || [];
    let toPendingDaifuOrder = null;
    let takeoutApiConfig = JSON.parse(localStorage.getItem('takeoutApiConfig')) || { url: '', key: '', model: '' };

    const TO_SHOPS = [
        { id:'s1', name:'深夜拉面研究所', emoji:'🍜', rating:'4.9', sales:'2.3k', time:'28min', minOrder:15, delivery:3, pack:2, badge:'品质优选', tags:['HOT','面食'], menu:[
            {id:1,name:'豚骨拉面',desc:'浓郁猪骨汤底·溏心蛋·叉烧',price:32,orig:42,sales:'月售856',emoji:'🍜',cat:'推荐'}
        ]},
        { id:'s2', name:'GREEN · 轻食沙拉', emoji:'🥗', rating:'4.7', sales:'1.8k', time:'22min', minOrder:20, delivery:2, pack:1, badge:'减脂推荐', tags:['轻食'], menu:[
            {id:1,name:'凯撒沙拉',desc:'罗马生菜·帕玛森·面包丁',price:28,orig:38,sales:'月售456',emoji:'🥗',cat:'推荐'}
        ]}
    ];

    let advancedMemories = JSON.parse(localStorage.getItem('advancedMemories')) || {};
    let chatStreaks = JSON.parse(localStorage.getItem('chatStreaks')) || {};
    let memorySettings = JSON.parse(localStorage.getItem('memorySettings')) || { autoSummarizeCount: 150, autoSummarizeEnabled: false };

    function fmtMoney(num) { return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    function addWalletBill(merchant, amount, method) {
        const now = new Date();
        const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        if (!walletData[currentWalletAccount]) walletData[currentWalletAccount] = { balance: 0, huabei: 0, bankCards: [], familyCards: [], bills: [] };
        walletData[currentWalletAccount].bills.unshift({ time: timeStr, location: '线上交易', merchant: merchant, amount: amount, method: method });
        localStorage.setItem('walletData', JSON.stringify(walletData));
    }

    let currentTransferMsgIndex = -1;

    function openTransferDetail(msgIndex) {
        currentTransferMsgIndex = msgIndex;
        const msg = messageHistory[msgIndex];
        const isSender = msg.role === 'user';
        
        $('td-amount').textContent = `¥ ${parseFloat(msg.amount).toFixed(2)}`;
        $('td-sender').textContent = isSender ? '我' : currentChatPersona.name;
        
        const d = new Date(msg.time || Date.now());
        $('td-time').textContent = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

        const iconEl = $('td-icon');
        const statusEl = $('td-status');
        const actionsEl = $('td-actions');

        if (msg.status === 'pending') {
            iconEl.style.background = '#111';
            iconEl.innerHTML = '<svg viewBox="0 0 24 24" style="width: 32px; height: 32px; stroke: #fff; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round;"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>';
            statusEl.textContent = isSender ? '待对方收款' : '待你收款';
            statusEl.style.color = 'var(--text-main)';
            actionsEl.style.display = isSender ? 'none' : 'flex';
        } else if (msg.status === 'received') {
            iconEl.style.background = '#34c759';
            iconEl.innerHTML = '<svg viewBox="0 0 24 24" style="width: 32px; height: 32px; stroke: #fff; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            statusEl.textContent = '已收款';
            statusEl.style.color = '#34c759';
            actionsEl.style.display = 'none';
        } else if (msg.status === 'returned') {
            iconEl.style.background = '#ff3b30';
            iconEl.innerHTML = '<svg viewBox="0 0 24 24" style="width: 32px; height: 32px; stroke: #fff; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            statusEl.textContent = '已退还';
            statusEl.style.color = '#ff3b30';
            actionsEl.style.display = 'none';
        }

        openSubView('sub-transfer-detail');
    }

    function handleTransferAction(action) {
        if (currentTransferMsgIndex === -1) return;
        const msg = messageHistory[currentTransferMsgIndex];
        
        if (action === 'receive') {
            msg.status = 'received';
            if (!walletData['ME']) walletData['ME'] = { balance: 0, bills: [] };
            walletData['ME'].balance += parseFloat(msg.amount);
            addWalletBill(`收到 ${currentChatPersona.name} 的转账`, parseFloat(msg.amount), '钱包余额');
            _ui_notify_('已存入钱包余额');
        } else if (action === 'return') {
            msg.status = 'returned';
            _ui_notify_('已退还给对方');
        }
        
        saveChatHistory();
        renderChatBox();
        openTransferDetail(currentTransferMsgIndex);
    }

    function confirmTransferSend(amount, method) {
        if (!amount || amount <= 0) return _ui_notify_("请输入有效金额");
        const data = walletData['ME'];
        let methodName = '钱包余额';
        
        if (method === 'balance') {
            if (data.balance < amount) return _ui_notify_("余额不足");
            data.balance -= amount;
        } else if (method === 'huabei') {
            if (data.huabei < amount) return _ui_notify_("花呗额度不足");
            data.huabei -= amount;
            methodName = '花呗';
        }
        
        const roleName = currentChatPersona ? currentChatPersona.name : '未知角色';
        addWalletBill(`转账给 ${roleName}`, -amount, methodName);
        
        const txId = 'TX' + Date.now();
        const now = new Date();
        
        const transferObj = {
            type: 'transfer',
            amount: amount,
            status: 'pending',
            id: txId,
            time: now.getTime()
        };

        if(currentChatPersona) {
            appendMessage(transferObj, 'user', messageHistory.length);
            messageHistory.push({ role: 'user', ...transferObj });
            saveChatHistory();
            triggerAIReply();
        }
    }

    function updateChatStreak(roleId) {
        if (!roleId) return;
        const today = new Date().toDateString();
        if (!chatStreaks[roleId]) chatStreaks[roleId] = { streak: 0, lastDate: '' };
        const streak = chatStreaks[roleId];
        if (streak.lastDate === today) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (streak.lastDate === yesterday.toDateString()) {
            streak.streak += 1;
        } else if (streak.lastDate !== today) {
            streak.streak = 1;
        }
        streak.lastDate = today;
        localStorage.setItem('chatStreaks', JSON.stringify(chatStreaks));
    }

    function initRoleMemory(roleId) {
        if (!advancedMemories[roleId]) {
            advancedMemories[roleId] = { coreMemories: [], episodicMemories: [], plotSummaries: [], timeline: [], todaySummary: '' };
            localStorage.setItem('advancedMemories', JSON.stringify(advancedMemories));
        }
    }

    async function checkAutoSummarize(roleId) {
        const msgs = allChats[roleId] || [];
        const threshold = memorySettings.autoSummarizeCount || 150;
        initRoleMemory(roleId);
        const summarizedCount = advancedMemories[roleId].lastSummarizedIndex || 0;
        const unsummarizedCount = msgs.length - summarizedCount;
        
        if (unsummarizedCount >= threshold && memorySettings.autoSummarizeEnabled) {
            await autoGenerateSummary(roleId, 'episodic');
        }
    }

    async function autoGenerateSummary(roleId, type = 'episodic') {
        if (window.isSummarizing && window.isSummarizing[roleId]) return;
        window.isSummarizing = window.isSummarizing || {};
        window.isSummarizing[roleId] = true;

        try {
            initRoleMemory(roleId);
            const msgs = allChats[roleId] || [];
            const startIndex = advancedMemories[roleId].lastSummarizedIndex || 0;
            const endIndex = msgs.length;
            if (endIndex <= startIndex) return;

            const msgsToSummarize = msgs.slice(startIndex, endIndex);
            const chatText = msgsToSummarize.map(m => `${m.role === 'user' ? 'ME' : 'TA'}: ${m.content}`).join('\n');
            const prompt = `请总结以下对话记录，提取核心情节和情感变化，字数在200字以内：\n\n${chatText}`;
            
            const endpoint = localStorage.getItem('apiUrl').replace(/\/$/, '') + '/chat/completions';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('apiKey')}` },
                body: JSON.stringify({ model: localStorage.getItem('apiModel'), messages: [{ role: 'user', content: prompt }], temperature: 0.75 })
            });
            const data = await res.json();
            const summary = data.choices[0].message.content.trim();
            const now = new Date().toLocaleString('zh-CN');
            
            if (type === 'episodic') {
                advancedMemories[roleId].episodicMemories.push({ content: summary, time: now, auto: true });
            } else {
                advancedMemories[roleId].plotSummaries.push({ content: summary, time: now, auto: true });
            }
            
            advancedMemories[roleId].lastSummarizedIndex = endIndex;
            localStorage.setItem('advancedMemories', JSON.stringify(advancedMemories));
        } catch (e) { 
            console.error('总结失败:', e); 
        } finally {
            window.isSummarizing[roleId] = false;
        }
    }

    /* ================= 钱包 APP 核心逻辑 ================= */
    let walletUsersDB = JSON.parse(localStorage.getItem('walletUsersDB')) || {};
    let walletIsLoginMode = true;
    let walletCurrentUserId = localStorage.getItem('walletCurrentUserId') || null;
    let walletSelectedCardColor = 'black';
    let walletIsPasswordless = false;
    let walletCurrentTxnFilter = 'all';

    const getWalletCurUser = () => walletUsersDB[walletCurrentUserId];
    const formatWalletMoney = (num) => '¥ ' + Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function openWalletApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('wallet-app-window').classList.add('open');
        $('status-bar').style.color = '#000'; 
        $('status-bar').style.textShadow = 'none';
        
        if (walletCurrentUserId && walletUsersDB[walletCurrentUserId]) {
            $('walletAuthView').classList.remove('active');
            $('walletMainView').classList.add('active');
            $('walletDisplayUserName').innerText = getWalletCurUser().name;
            refreshWalletAllUI();
        } else {
            $('walletAuthView').classList.add('active');
            $('walletMainView').classList.remove('active');
        }
    }

    const toggleWalletAuthMode = () => {
        walletIsLoginMode = !walletIsLoginMode;
        $('walletAuthTitle').innerText = walletIsLoginMode ? 'Sign In' : 'Register';
        $('walletAuthSub').innerText = walletIsLoginMode ? '登录您的极简钱包' : '注册新的极简钱包';
        $('walletAuthBtn').innerText = walletIsLoginMode ? 'Confirm / 登录' : 'Register / 注册';
        $('walletAuthSwitchText').innerText = walletIsLoginMode ? '没有账号？点击注册 (Register)' : '已有账号？点击登录 (Sign In)';
    };

    /* 修复钱包登录：支持通过账号ID或角色昵称登录 */
    const handleWalletAuth = () => {
        const user = $('walletAuthUser').value.trim();
        const pwd = $('walletAuthPwd').value.trim();
        if(!user || !pwd) { _ui_notify_('请输入账号和密码'); return; }

        if(!walletIsLoginMode) {
            if(walletUsersDB[user]) { _ui_notify_('该账号已存在，请直接登录'); return; }
            walletUsersDB[user] = {
                id: user, name: user, avatar: user.charAt(0).toUpperCase(), pwd: pwd, payPwd: '',
                assets: { wallet: 0, alipay: 0, current: 0, fixed: 0, stocks: 0 },
                cards: [], transactions: []
            };
            localStorage.setItem('walletUsersDB', JSON.stringify(walletUsersDB));
            _ui_notify_('注册成功！系统已为您初始化极简钱包。');
            toggleWalletAuthMode();
            $('walletAuthPwd').value = '';
        } else {
            // 查找账号：先按ID找，找不到再按名字找
            let targetUserId = user;
            if (!walletUsersDB[user]) {
                const foundUser = Object.values(walletUsersDB).find(u => u.name === user);
                if (foundUser) {
                    targetUserId = foundUser.id;
                } else {
                    _ui_notify_('账号不存在，请检查账号名或先注册'); return;
                }
            }
            
            if(walletUsersDB[targetUserId].pwd !== pwd) { _ui_notify_('密码错误'); return; }
            
            walletCurrentUserId = targetUserId;
            localStorage.setItem('walletCurrentUserId', targetUserId);
            $('walletDisplayUserName').innerText = getWalletCurUser().name;
            $('walletAuthView').classList.remove('active');
            $('walletMainView').classList.add('active');
            refreshWalletAllUI();
        }
    };

    const doWalletLogout = () => {
        closeWalletSwitchAccount();
        if($('walletSidebar').classList.contains('active')) toggleWalletSidebar();
        walletCurrentUserId = null;
        localStorage.removeItem('walletCurrentUserId');
        $('walletMainView').classList.remove('active');
        $('walletAuthView').classList.add('active');
        $('walletAuthUser').value = '';
        $('walletAuthPwd').value = '';
        if(!walletIsLoginMode) toggleWalletAuthMode();
    };

    const toggleWalletSidebar = () => {
        $('walletSidebar').classList.toggle('active');
        $('walletSidebarOverlay').classList.toggle('active');
    };

    const toggleWalletPasswordless = () => {
        walletIsPasswordless = !walletIsPasswordless;
        $('walletPwdlessStatus').innerText = walletIsPasswordless ? '开启 (On)' : '关闭 (Off)';
    };

    const calcWalletTotalAssets = () => {
        const u = getWalletCurUser();
        let total = u.assets.wallet + u.assets.alipay + u.assets.current + u.assets.fixed + u.assets.stocks;
        u.cards.forEach(c => total += c.balance);
        return total;
    };

    const calcWalletMonthStats = () => {
        const u = getWalletCurUser();
        let income = 0, expense = 0;
        u.transactions.forEach(t => {
            if(t.amount > 0) income += t.amount;
            else expense += Math.abs(t.amount);
        });
        $('walletMonthIncome').innerText = formatWalletMoney(income);
        $('walletMonthExpense').innerText = formatWalletMoney(expense);
    };

    const refreshWalletAllUI = () => {
        $('walletTotalAssets').innerText = formatWalletMoney(calcWalletTotalAssets());
        calcWalletMonthStats();
        renderWalletCards();
        renderWalletAssets();
        renderWalletTransactions();
        
        // 更新个人资料显示
        const u = getWalletCurUser();
        if (u) {
            $('walletProfileName').innerText = u.name;
            if (u.avatarUrl) {
                $('walletProfileAvatar').innerHTML = `<img src="${u.avatarUrl}" style="width:100%;height:100%;object-fit:cover;">`;
            } else {
                $('walletProfileAvatar').innerHTML = u.avatar;
            }
        }
        
        // 同步更新旧版转账逻辑的余额 (兼容聊天界面的转账功能)
        if (!walletData['ME']) walletData['ME'] = { balance: 0, bills: [] };
        walletData['ME'].balance = getWalletCurUser().assets.wallet;
        localStorage.setItem('walletData', JSON.stringify(walletData));
    };

    // 编辑钱包个人资料
    function editWalletProfile() {
        const name = prompt('请输入钱包昵称:', getWalletCurUser().name);
        if (name) {
            const u = getWalletCurUser();
            u.name = name;
            u.avatar = name.charAt(0).toUpperCase();
            localStorage.setItem('walletUsersDB', JSON.stringify(walletUsersDB));
            refreshWalletAllUI();
        }
    }

    // 钱包头像上传
    function handleWalletAvatarUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                const u = getWalletCurUser();
                u.avatarUrl = ev.target.result;
                localStorage.setItem('walletUsersDB', JSON.stringify(walletUsersDB));
                refreshWalletAllUI();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    // 一键生成角色钱包账号
    async function generatePersonaWallet() {
        const id = $('persona-edit-id').value;
        const p = myPersonas.find(x => String(x.id) === String(id));
        if (!p) return _ui_notify_('请先保存角色');
        
        _ui_notify_('正在请求AI生成钱包账号...');
        const prompt = `请根据你（${p.name}）的人设，生成一个你的专属钱包账号。返回纯JSON格式：{"balance": 随机一个符合你人设的存款金额(纯数字), "password": "生成一个6位数字密码，必须符合你的设定(如生日等)"}`;
        
        try {
            const res = await fetch(localStorage.getItem('apiUrl').replace(/\/$/, '') + '/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('apiKey')}` },
                body: JSON.stringify({ model: localStorage.getItem('apiModel'), messages: [{role: 'user', content: prompt}], temperature: 0.8 })
            });
            const data = await res.json();
            const content = data.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
            const result = JSON.parse(content);
            
            const accountId = 'AI_' + p.id;
            walletUsersDB[accountId] = {
                id: accountId, name: p.name, avatar: p.name.charAt(0), avatarUrl: p.avatar, pwd: result.password, payPwd: result.password,
                assets: { wallet: result.balance, alipay: 0, current: 0, fixed: 0, stocks: 0 },
                cards: [], transactions: [], isAI: true
            };
            localStorage.setItem('walletUsersDB', JSON.stringify(walletUsersDB));
            _ui_notify_(`生成成功！账号已绑定。登录密码为: ${result.password}`);
            savePersona(); // 自动保存角色
        } catch (e) {
            _ui_notify_('生成失败: ' + e.message);
        }
    }

    // 覆盖原有的切换账号逻辑，增加 AI 账号的密码拦截
    const executeWalletSwitch = (userId) => {
        if(userId === walletCurrentUserId) { closeWalletSwitchAccount(); return; }
        
        const targetUser = walletUsersDB[userId];
        if (targetUser.isAI) {
            const pwd = prompt(`请输入 ${targetUser.name} 的6位钱包密码\n(提示：请在聊天中询问TA)`);
            // 修复毒瘤：AI生成的密码可能是数字，prompt获取的是字符串，必须统一转为字符串比对
            if (pwd === null || String(pwd).trim() !== String(targetUser.pwd).trim()) {
                return _ui_notify_('密码错误，拒绝访问');
            }
        }
        
        walletCurrentUserId = userId;
        localStorage.setItem('walletCurrentUserId', userId);
        $('walletDisplayUserName').innerText = getWalletCurUser().name;
        refreshWalletAllUI();
        closeWalletSwitchAccount();
    };

    const renderWalletCards = () => {
        const slider = $('walletCardSlider');
        slider.innerHTML = '';
        getWalletCurUser().cards.forEach(card => {
            slider.innerHTML += `
                <div class="wallet-card-wrapper">
                    <div class="wallet-bank-card-item ${card.color}" onclick="openWalletCardDetail('${card.id}')">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="wallet-card-logo">${card.name}</div>
                            <div class="wallet-card-chip"></div>
                        </div>
                        <div class="wallet-card-number">**** **** **** ${card.num}</div>
                    </div>
                </div>
            `;
        });
        slider.innerHTML += `
            <div class="wallet-card-wrapper">
                <div class="wallet-add-card-btn" onclick="openWalletModal('walletAddCardModal')">+</div>
            </div>
        `;
    };

    const renderWalletAssets = () => {
        const list = $('walletAssetsList');
        const a = getWalletCurUser().assets;
        list.innerHTML = `
            <div class="wallet-list-item-row">
                <div class="wallet-item-info"><h4>钱包余额 (Wallet)</h4></div>
                <div class="wallet-item-amount wallet-neutral">${formatWalletMoney(a.wallet)}</div>
            </div>
            <div class="wallet-list-item-row">
                <div class="wallet-item-info"><h4>支付宝 (Alipay)</h4></div>
                <div class="wallet-item-amount wallet-neutral">${formatWalletMoney(a.alipay)}</div>
            </div>
            <div class="wallet-list-item-row">
                <div class="wallet-item-info"><h4>活期理财 (Current)</h4></div>
                <div class="wallet-item-amount wallet-neutral">${formatWalletMoney(a.current)}</div>
            </div>
            <div class="wallet-list-item-row">
                <div class="wallet-item-info"><h4>定期存款 (Fixed)</h4></div>
                <div class="wallet-item-amount wallet-neutral">${formatWalletMoney(a.fixed)}</div>
            </div>
            <div class="wallet-list-item-row" style="border-bottom:none;">
                <div class="wallet-item-info"><h4>股票基金 (Stocks)</h4></div>
                <div class="wallet-item-amount wallet-neutral">${formatWalletMoney(a.stocks)}</div>
            </div>
        `;
    };

    const filterWalletTxn = (type, element) => {
        document.querySelectorAll('.wallet-filter-opt').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        walletCurrentTxnFilter = type;
        renderWalletTransactions();
    };

    const renderWalletTransactions = () => {
        const list = $('walletTransactionList');
        list.innerHTML = '';
        let txns = getWalletCurUser().transactions;
        if(walletCurrentTxnFilter === 'in') txns = txns.filter(t => t.amount > 0);
        if(walletCurrentTxnFilter === 'out') txns = txns.filter(t => t.amount < 0);

        if(txns.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding: 20px; color: #888; font-size: 12px;">暂无账单记录</div>';
            return;
        }

        txns.forEach((t) => {
            const isPositive = t.amount > 0;
            const amountStr = isPositive ? `+ ¥ ${t.amount}` : `- ¥ ${Math.abs(t.amount)}`;
            const colorClass = isPositive ? 'wallet-positive' : 'wallet-negative';
            list.innerHTML += `
                <div class="wallet-list-item-row" onclick='openWalletReceipt(${JSON.stringify(t)})'>
                    <div class="wallet-item-info">
                        <h4>${t.title}</h4>
                        <p>${t.type} • ${t.date.split(' ')[0]}</p>
                    </div>
                    <div class="wallet-item-amount ${colorClass}">${amountStr}</div>
                </div>
            `;
        });
    };

    const buildWalletTransferOptions = (selectElement) => {
        selectElement.innerHTML = `
            <option value="wallet">钱包余额 (Wallet)</option>
            <option value="alipay">支付宝 (Alipay)</option>
            <option value="current">活期理财 (Current)</option>
            <option value="fixed">定期存款 (Fixed)</option>
            <option value="stocks">股票基金 (Stocks)</option>
        `;
        getWalletCurUser().cards.forEach(card => {
            selectElement.innerHTML += `<option value="${card.id}">银行卡 (*${card.num})</option>`;
        });
    };

    const openWalletModal = (modalId) => {
        if(modalId === 'walletActionModal') {
            buildWalletTransferOptions($('walletSourceSelect'));
            buildWalletTransferOptions($('walletDestSelect'));
            $('walletDestSelect').selectedIndex = 1; 
            $('walletAmountInput').value = '';
        }
        if(modalId === 'walletPwdModal') toggleWalletSidebar();
        $(modalId).classList.add('active');
    };

    const closeWalletModal = (modalId) => {
        $(modalId).classList.remove('active');
    };

    const openWalletCardDetail = (cardId) => {
        const card = getWalletCurUser().cards.find(c => c.id === cardId);
        if(card) {
            $('walletDetailCardNum').innerText = `**** **** **** ${card.num}`;
            $('walletDetailCardBalance').innerText = formatWalletMoney(card.balance);
            $('walletCardDetailModal').classList.add('active');
        }
    };

    const getWalletAssetBalance = (id) => {
        const u = getWalletCurUser();
        if(u.assets[id] !== undefined) return u.assets[id];
        const card = u.cards.find(c => c.id === id);
        return card ? card.balance : 0;
    };

    const updateWalletAssetBalance = (id, amount) => {
        const u = getWalletCurUser();
        if(u.assets[id] !== undefined) {
            u.assets[id] += amount;
        } else {
            const card = u.cards.find(c => c.id === id);
            if(card) card.balance += amount;
        }
    };

    const confirmWalletTransaction = () => {
        const amount = parseFloat($('walletAmountInput').value);
        if(!amount || amount <= 0) return;

        const sourceId = $('walletSourceSelect').value;
        const destId = $('walletDestSelect').value;

        if(sourceId === destId) { _ui_notify_('转出方和转入方不能相同'); return; }

        if(getWalletAssetBalance(sourceId) < amount) {
            const confirmOverdraft = confirm('转出方余额不足，是否模拟外部资金注入？');
            if(!confirmOverdraft) return;
        }

        const u = getWalletCurUser();
        if(u.payPwd !== '' && !walletIsPasswordless) {
            const pwd = prompt('请输入支付密码 (Enter Pay Password):');
            if(pwd !== u.payPwd) { _ui_notify_('密码错误 (Incorrect Password)'); return; }
        }
        
        updateWalletAssetBalance(sourceId, -amount);
        updateWalletAssetBalance(destId, amount);
        
        const sourceText = $('walletSourceSelect').options[$('walletSourceSelect').selectedIndex].text;
        const destText = $('walletDestSelect').options[$('walletDestSelect').selectedIndex].text;

        const now = new Date();
        const dateStr = `${now.getFullYear()}-0${now.getMonth()+1}-${now.getDate() < 10 ? '0'+now.getDate() : now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
        
        u.transactions.unshift({
            id: 'TXN' + Math.floor(Math.random() * 100000),
            title: `转账至 ${destText.split(' ')[0]}`,
            type: sourceText.split(' ')[0],
            date: dateStr,
            amount: -amount,
            status: 'Completed'
        });
        
        u.transactions.unshift({
            id: 'TXN' + Math.floor(Math.random() * 100000),
            title: `来自 ${sourceText.split(' ')[0]}`,
            type: destText.split(' ')[0],
            date: dateStr,
            amount: amount,
            status: 'Completed'
        });
        
        localStorage.setItem('walletUsersDB', JSON.stringify(walletUsersDB));
        refreshWalletAllUI();
        closeWalletModal('walletActionModal');
        _ui_notify_('划转成功 (Transfer Successful)');
    };

    const selectWalletColor = (element, color) => {
        document.querySelectorAll('.wallet-color-option').forEach(el => el.classList.remove('active'));
        element.classList.add('active');
        walletSelectedCardColor = color;
    };

    const confirmWalletAddCard = () => {
        const cardNum = $('walletNewCardNumber').value;
        if(!cardNum) { _ui_notify_('请输入卡号'); return; }

        const lastFour = cardNum.slice(-4) || '0000';
        getWalletCurUser().cards.push({
            id: 'card' + lastFour + Math.floor(Math.random()*100),
            num: lastFour,
            name: 'BANK CARD',
            balance: 0.00,
            color: walletSelectedCardColor
        });
        
        localStorage.setItem('walletUsersDB', JSON.stringify(walletUsersDB));
        refreshWalletAllUI();
        closeWalletModal('walletAddCardModal');
        $('walletNewCardNumber').value = '';
        
        const slider = $('walletCardSlider');
        setTimeout(() => { slider.scrollBy({ left: 1000, behavior: 'smooth' }); }, 100);
    };

    const saveWalletPayPwd = () => {
        const pwd = $('walletNewPayPwd').value;
        if(pwd.length < 4) { _ui_notify_('密码太短'); return; }
        getWalletCurUser().payPwd = pwd;
        localStorage.setItem('walletUsersDB', JSON.stringify(walletUsersDB));
        _ui_notify_('支付密码设置成功 (Password Saved)');
        closeWalletModal('walletPwdModal');
        $('walletNewPayPwd').value = '';
    };

    const openWalletReceipt = (txn) => {
        const content = $('walletReceiptContent');
        const isPositive = txn.amount > 0;
        const qrSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z M40,10 h20 v10 h-20 z M45,25 h10 v20 h-10 z M70,40 h20 v10 h-20 z M10,40 h20 v10 h-20 z M40,55 h20 v10 h-20 z M70,70 h10 v10 h-10 z M85,85 h5 v5 h-5 z M40,80 h20 v10 h-20 z" fill="#333"/></svg>`;

        content.innerHTML = `
            <div class="wallet-receipt-title">PAYMENT RECEIPT</div>
            <div class="wallet-receipt-row"><span>MERCHANT:</span> <span>${txn.title.split(' ')[0]}</span></div>
            <div class="wallet-receipt-row"><span>DATE:</span> <span>${txn.date}</span></div>
            <div class="wallet-receipt-row"><span>TXN ID:</span> <span>${txn.id}</span></div>
            <div class="wallet-receipt-divider"></div>
            <div class="wallet-receipt-row"><span>METHOD:</span> <span>${txn.type.split(' ')[0]}</span></div>
            <div class="wallet-receipt-row"><span>STATUS:</span> <span>${txn.status}</span></div>
            <div class="wallet-receipt-divider"></div>
            <div class="wallet-receipt-row" style="font-size: 16px; font-weight: bold;">
                <span>TOTAL:</span> 
                <span>${isPositive ? '+' : '-'} ¥ ${Math.abs(txn.amount).toFixed(2)}</span>
            </div>
            <div class="wallet-receipt-qr">${qrSvg}</div>
            <div style="text-align: center; margin-top: 10px; color: #999; font-size: 10px;">SCAN TO VERIFY</div>
        `;
        $('walletReceiptModal').classList.add('active');
    };

    const openWalletSwitchAccount = () => {
        toggleWalletSidebar(); 
        const list = $('walletAccountList');
        list.innerHTML = '';
        
        Object.values(walletUsersDB).forEach(u => {
            const isActive = u.id === walletCurrentUserId ? 'active' : '';
            list.innerHTML += `
                <div class="wallet-sa-item ${isActive}" onclick="executeWalletSwitch('${u.id}')">
                    <div class="wallet-sa-avatar">${u.avatar}</div>
                    <div class="wallet-sa-info">
                        <h4>${u.name}</h4>
                        <p>ID: ${u.id}</p>
                    </div>
                    ${isActive ? '<div style="margin-left:auto; color:#111;">✓</div>' : ''}
                </div>
            `;
        });
        $('walletSwitchAccountModal').classList.add('active');
    };

    const closeWalletSwitchAccount = () => {
        $('walletSwitchAccountModal').classList.remove('active');
    };

    function openTakeoutApp() {
        if (isGlobalDragging || isDesktopEditMode) return;
        $('takeout-app-window').classList.add('open');
        $('status-bar').style.color = document.body.classList.contains('dark-mode') ? '#fff' : '#000'; 
        $('status-bar').style.textShadow = 'none';
        renderTakeoutShops();
    }

    function renderTakeoutShops() {
        const container = $('takeout-shops-list');
        container.innerHTML = TO_SHOPS.map(shop => `
            <div class="modern-item" style="align-items: flex-start; margin-bottom: 12px; background: var(--bg-color);" onclick="_ui_notify_('店铺详情开发中')">
                <div style="font-size: 40px; margin-right: 15px; background: var(--glass-bg); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 16px; border: 1px solid var(--glass-border);">${shop.emoji}</div>
                <div class="modern-content">
                    <div class="modern-title" style="font-size: 16px;">${shop.name}</div>
                    <div class="modern-sub" style="color: #ff9500; font-weight: bold;">⭐ ${shop.rating} <span style="color: var(--text-sub); font-weight: normal; margin-left: 8px;">${shop.sales} | ${shop.time}</span></div>
                    <div class="modern-sub" style="margin-top: 4px;">起送 ￥${shop.minOrder} | 配送 ￥${shop.delivery}</div>
                    <div style="display: flex; gap: 6px; margin-top: 10px;">
                        ${shop.badge ? `<span style="font-size: 10px; padding: 2px 6px; background: rgba(255, 59, 48, 0.1); color: #ff3b30; border-radius: 4px; font-weight: bold;">${shop.badge}</span>` : ''}
                        ${shop.tags.map(t => `<span style="font-size: 10px; padding: 2px 6px; border: 1px solid var(--glass-border); border-radius: 4px; color: var(--text-sub);">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    function togglePersonaApiConfig() {
        const panel = $('persona-api-config-panel');
        const icon = $('persona-api-toggle-icon');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            icon.textContent = '▲';
        } else {
            panel.style.display = 'none';
            icon.textContent = '▼';
        }
    }

    function blockCurrentPersona() {
        const id = $('persona-edit-id').value;
        const p = myPersonas.find(x => String(x.id) === String(id));
        if (!p) return;

        if (p.isBlocked) {
            if(confirm('确定要解除拉黑此角色吗？')) {
                p.isBlocked = false;
                localStorage.setItem('myPersonas', JSON.stringify(myPersonas));
                
                if (!allChats[p.id]) allChats[p.id] = [];
                const unblockMsg = { role: 'system', type: 'text', content: '你已将对方移出黑名单。', time: Date.now() };
                allChats[p.id].push(unblockMsg);
                localStorage.setItem('allChats', JSON.stringify(allChats));
                
                if (currentChatPersona && String(currentChatPersona.id) === String(p.id)) {
                    messageHistory = allChats[p.id];
                    renderChatBox();
                }
                
                _ui_notify_('已解除拉黑');
                $('block-persona-btn').textContent = '拉黑此角色';
                renderPersonas();
            }
        } else {
            if(confirm('确定要拉黑此角色吗？拉黑后将不会在列表中显示。')) {
                p.isBlocked = true;
                localStorage.setItem('myPersonas', JSON.stringify(myPersonas));
                
                if (!allChats[p.id]) allChats[p.id] = [];
                const blockMsg = { role: 'system', type: 'text', content: '你已将对方加入黑名单。', time: Date.now() };
                allChats[p.id].push(blockMsg);
                localStorage.setItem('allChats', JSON.stringify(allChats));
                
                if (currentChatPersona && String(currentChatPersona.id) === String(p.id)) {
                    messageHistory = allChats[p.id];
                    renderChatBox();
                }
                
                _ui_notify_('已拉黑');
                $('block-persona-btn').textContent = '解除拉黑';
                renderPersonas();
            }
        }
    }

    function requestUnblock(personaId) {
        if(confirm('对方已将你拉黑，是否发送解除拉黑申请？')) {
            const p = myPersonas.find(x => String(x.id) === String(personaId));
            if (!p) return;
            
            // 模拟对方同意或拒绝 (这里简单模拟 80% 概率同意)
            setTimeout(() => {
                const isAccepted = Math.random() > 0.2;
                const msgContent = isAccepted ? '对方已同意你的解除拉黑申请，你们可以继续聊天了。' : '对方拒绝了你的解除拉黑申请。';
                
                const sysMsg = { role: 'system', type: 'text', content: msgContent, time: Date.now() };
                if (!allChats[p.id]) allChats[p.id] = [];
                allChats[p.id].push(sysMsg);
                localStorage.setItem('allChats', JSON.stringify(allChats));
                
                if (isAccepted) {
                    p.hasBlockedUser = false;
                    localStorage.setItem('myPersonas', JSON.stringify(myPersonas));
                }
                
                if (currentChatPersona && String(currentChatPersona.id) === String(p.id)) {
                    messageHistory = allChats[p.id];
                    renderChatBox();
                }
                _ui_notify_(isAccepted ? '申请已通过' : '申请被拒绝');
            }, 1500);
        }
    }

    function openMemoryAppForCurrent() {
        const id = $('persona-edit-id').value;
        currentChatPersona = myPersonas.find(x => String(x.id) === String(id));
        closeSubView('sub-add-persona');
        closeChatDetail(); // 确保关闭聊天界面，防止层级遮挡
        openMemoryApp();
    }

    // 独立 API 配置：加载全局预设
    function loadPersonaPreset(type) {
        const selectId = type === 'chat' ? 'p-api-preset-select' : (type === 'vision' ? 'p-vision-preset-select' : 'p-net-preset-select');
        const p = apiPresets.find(x => String(x.id) === String($(selectId).value));
        if (p) {
            if (type === 'chat') {
                $('p-api-url').value = p.url || '';
                $('p-api-key').value = p.key || '';
                $('p-api-model').value = p.model || '';
                $('p-api-temperature').value = p.temperature !== undefined ? p.temperature : 0.7;
                $('p-temp-val').textContent = p.temperature !== undefined ? p.temperature : 0.7;
            } else if (type === 'vision') {
                $('p-vision-url').value = p.url || '';
                $('p-vision-key').value = p.key || '';
                $('p-vision-model').value = p.model || '';
                $('p-vision-temperature').value = p.temperature !== undefined ? p.temperature : 0.7;
                $('p-vision-temp-val').textContent = p.temperature !== undefined ? p.temperature : 0.7;
            } else if (type === 'net') {
                $('p-net-url').value = p.url || '';
                $('p-net-key').value = p.key || '';
                $('p-net-model').value = p.model || '';
                $('p-net-temperature').value = p.temperature !== undefined ? p.temperature : 0.7;
                $('p-net-temp-val').textContent = p.temperature !== undefined ? p.temperature : 0.7;
            }
        }
    }

    // 独立 API 配置：拉取模型
    async function fetchPersonaModels(type) {
        const urlId = type === 'chat' ? 'p-api-url' : (type === 'vision' ? 'p-vision-url' : 'p-net-url');
        const keyId = type === 'chat' ? 'p-api-key' : (type === 'vision' ? 'p-vision-key' : 'p-net-key');
        const statusId = type === 'chat' ? 'p-api-status' : (type === 'vision' ? 'p-vision-status' : 'p-net-status');
        const selectId = type === 'chat' ? 'p-api-model-select' : (type === 'vision' ? 'p-vision-model-select' : 'p-net-model-select');

        const url = $(urlId).value.trim() || localStorage.getItem('apiUrl');
        const key = $(keyId).value.trim() || localStorage.getItem('apiKey');
        
        if (!url || !key) return _ui_notify_('请先填写 URL 和 Key (或在全局设置中配置)');
        $(statusId).textContent = '正在拉取模型...';
        try {
            const res = await fetch(`${url.replace(/\/chat\/completions\/?$/, '')}/models`, { headers: { 'Authorization': `Bearer ${key}` } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.data && Array.isArray(data.data)) {
                $(selectId).innerHTML = '<option value="">-- 选择模型 --</option>' + data.data.map(m => `<option value="${m.id}">${m.id}</option>`).join('');
                $(selectId).style.display = 'block'; $(statusId).textContent = '模型拉取成功';
            } else throw new Error('返回格式不正确');
        } catch (e) { $(statusId).textContent = `拉取失败: ${e.message}`; }
    }

    // 独立 API 配置：测试连接
    async function testPersonaAPIConnection(type) {
        const urlId = type === 'chat' ? 'p-api-url' : (type === 'vision' ? 'p-vision-url' : 'p-net-url');
        const keyId = type === 'chat' ? 'p-api-key' : (type === 'vision' ? 'p-vision-key' : 'p-net-key');
        const modelId = type === 'chat' ? 'p-api-model' : (type === 'vision' ? 'p-vision-model' : 'p-net-model');
        const tempId = type === 'chat' ? 'p-api-temperature' : (type === 'vision' ? 'p-vision-temperature' : 'p-net-temperature');
        const statusId = type === 'chat' ? 'p-api-status' : (type === 'vision' ? 'p-vision-status' : 'p-net-status');

        const url = $(urlId).value.trim() || localStorage.getItem('apiUrl');
        const key = $(keyId).value.trim() || localStorage.getItem('apiKey');
        const model = $(modelId).value.trim() || localStorage.getItem('apiModel');
        const temp = parseFloat($(tempId).value) || 0.7;
        
        if (!url || !key) return $(statusId).textContent = '请先填写 URL 和 Key';
        $(statusId).textContent = '正在测试连接...';
        try {
            const res = await fetch(url.replace(/\/$/, '') + (url.endsWith('/chat/completions') ? '' : '/chat/completions'), {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({ model: model, messages: [{role: 'user', content: 'Hello'}], temperature: temp })
            });
            $(statusId).textContent = res.ok ? '连接成功！API 正常工作。' : `连接失败: HTTP ${res.status}`;
        } catch (e) { $(statusId).textContent = `请求错误: ${e.message}`; }
    }
    /* 通知声音与横幅逻辑 (使用 IndexedDB 突破存储限制，修复白屏毒瘤) */
    function initAuraDB(callback) {
        try {
            const dbReq = indexedDB.open("AuraDB", 1);
            dbReq.onupgradeneeded = e => { 
                if (!e.target.result.objectStoreNames.contains("media")) {
                    e.target.result.createObjectStore("media"); 
                }
            };
            dbReq.onsuccess = e => { if (callback) callback(e.target.result); };
            dbReq.onerror = () => { console.error("IndexedDB 初始化失败"); };
        } catch (err) {
            console.error("浏览器不支持或禁用了 IndexedDB", err);
        }
    }
    
    function saveNotifySound() {
        const url = $('notify-sound-url').value.trim();
        if (url && !url.includes('已加载本地音频')) {
            localStorage.setItem('notifySoundUrl', url);
        }
    }
    
    function handleNotifySoundUpload(e) {
        if (e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                initAuraDB(db => {
                    const tx = db.transaction("media", "readwrite");
                    tx.objectStore("media").put(ev.target.result, "notifySound");
                    localStorage.setItem('notifySoundUrl', 'indexeddb');
                    $('notify-sound-url').value = '已加载本地音频';
                    _ui_notify_('提示音已更新并保存到本地数据库');
                });
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }
    
    function playTestSound() {
        const urlType = localStorage.getItem('notifySoundUrl');
        if (urlType === 'indexeddb') {
            initAuraDB(db => {
                const tx = db.transaction("media", "readonly");
                const getReq = tx.objectStore("media").get("notifySound");
                getReq.onsuccess = () => {
                    if (getReq.result) {
                        const audio = new Audio(getReq.result);
                        audio.play().catch(err => console.log('播放失败: ' + err.message));
                    }
                };
            });
        } else if (urlType) {
            const audio = new Audio(urlType);
            audio.play().catch(err => _ui_notify_('播放失败: ' + err.message));
        } else {
            _ui_notify_('未设置提示音');
        }
    }
    function showAppToast(name, msg, avatar) {
        const toast = $('app-toast-banner');
        if (!toast) return;
        $('toast-name').textContent = name;
        $('toast-msg').textContent = msg;
        $('toast-avatar').src = avatar || '';
        toast.style.transform = 'translateY(150px)';
        playTestSound();
        setTimeout(() => { toast.style.transform = 'translateY(0)'; }, 3000);
    }
function checkKeywordsAndEffects(text, isAI = false) {
    if (text.includes('爱心')) triggerCanvasEffect('heart');
    if (text.includes('烟花')) triggerCanvasEffect('firework');
    if (text.includes('打雷')) triggerCanvasEffect('thunder');
    if (text.includes('猫爪')) triggerCanvasEffect('catpaw');

    if (text.includes('生日快乐') || text.includes('土味情话')) {
        shootDanmaku(text.includes('生日快乐') ? '🎂 生日快乐！' : '✨ 宝，你今天真好看 ✨');
    }

    if (text === '求签') {
        setTimeout(() => {
            const chatBox = document.getElementById('chat-box');
            if(chatBox) {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'msg-row system-msg';
                msgDiv.innerHTML = `<div class="msg-bubble">【今日运势】大吉。宜：摸鱼。忌：早起。AI毒舌：别看了，再看你也抽不到SSR。</div>`;
                chatBox.appendChild(msgDiv);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }, 500);
        return true; 
    }
    if (text === '今日人设') {
        const roles = ['社牛', '摆烂大王', '欧皇', '小透明'];
        const role = roles[Math.floor(Math.random() * roles.length)];
        setTimeout(() => {
            const chatBox = document.getElementById('chat-box');
            if(chatBox) {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'msg-row system-msg';
                msgDiv.innerHTML = `<div class="msg-bubble">【今日人设】你被分配为：${role}！</div>`;
                chatBox.appendChild(msgDiv);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }, 500);
        return true;
    }

    if (document.getElementById('offline-editor') && document.getElementById('offline-editor').classList.contains('open')) {
        if (text === '出门') {
            setTimeout(() => {
                const stage = document.getElementById('offline-stage');
                if(stage) {
                    const p = document.createElement('div');
                    p.className = 'offline-paragraph system-msg';
                    p.innerHTML = `<div>SYSTEM</div><div>你推开门，一阵冷风吹过，遇到了一只流浪猫。</div>`;
                    stage.appendChild(p);
                    stage.scrollTop = stage.scrollHeight;
                }
            }, 500);
            return true;
        }
        if (text === '打怪') {
            setTimeout(() => {
                const stage = document.getElementById('offline-stage');
                if(stage) {
                    const p = document.createElement('div');
                    p.className = 'offline-paragraph system-msg';
                    p.innerHTML = `<div>SYSTEM</div><div>你拔出木剑，史莱姆对你造成了 1 点伤害。</div>`;
                    stage.appendChild(p);
                    stage.scrollTop = stage.scrollHeight;
                }
            }, 500);
            return true;
        }
    }
    return false;
}

function shootDanmaku(text) {
    const container = document.getElementById('danmaku-container');
    if(!container) return;
    const el = document.createElement('div');
    el.className = 'danmaku-item';
    el.innerText = text;
    el.style.top = Math.random() * 80 + '%';
    el.style.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
    el.style.fontSize = (Math.random() * 10 + 16) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function triggerCanvasEffect(type) {
    const canvas = document.getElementById('effect-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (type === 'heart') {
        for(let i=0; i<30; i++) {
            setTimeout(() => {
                ctx.fillStyle = 'red';
                ctx.font = '30px Arial';
                ctx.fillText('❤️', Math.random() * canvas.width, Math.random() * canvas.height);
            }, i * 50);
        }
        setTimeout(() => ctx.clearRect(0, 0, canvas.width, canvas.height), 2000);
    }
}

function applyEmotionEffects(msgElement, text) {
    if(!msgElement) return;
    if (text.includes('*害羞*') || text.includes('脸红')) {
        const avatar = msgElement.querySelector('.msg-avatar');
        if(avatar) avatar.classList.add('avatar-blush');
    }
    if (text.includes('*生气*') || text.includes('哼')) {
        const bubble = msgElement.querySelector('.msg-bubble');
        if(bubble) bubble.classList.add('bubble-shake');
    }
    if (text.includes('*无奈*') || text.includes('...')) {
        const avatar = msgElement.querySelector('.msg-avatar');
        if(avatar) avatar.classList.add('avatar-sweat');
    }
}
// ==========================================
// 灵境回溯 (梦境记录) 核心逻辑
// ==========================================

// 初始化梦境进度显示
function initDreamProgress() {
    let dreamCount = parseInt(localStorage.getItem('dream_count') || '0');
    const progressText = document.getElementById('dream-progress-text');
    if (progressText) {
        if (dreamCount >= 3) {
            progressText.innerText = `连续记录梦境以解锁角色深层的记忆碎片。当前进度：3/3 (已解锁隐藏记忆！)`;
        } else {
            progressText.innerText = `连续记录梦境以解锁角色深层的记忆碎片。当前进度：${dreamCount}/3`;
        }
    }
}

// 每次打开灵境回溯App时刷新进度
document.getElementById('icon-dream').addEventListener('click', function() {
    initDreamProgress();
});

// 解析潜意识按钮点击事件
function analyzeDream() {
    const input = document.getElementById('dream-input');
    const text = input.value.trim();
    
    if (!text) {
        alert('请先记录你的梦境碎片...');
        return;
    }

    // 1. 更新本地存储的梦境记录次数
    let dreamCount = parseInt(localStorage.getItem('dream_count') || '0');
    dreamCount++;
    localStorage.setItem('dream_count', dreamCount);
    
    // 刷新UI进度
    initDreamProgress();

    // 2. 构建发送给 AI 的潜意识解析 Prompt
    // 严格要求 AI 遵循世界观、人设和关系进行解梦
    let promptText = `【潜意识探索指令】\n我昨晚做了一个梦，梦境碎片如下：\n"${text}"\n\n请你严格遵循当前的世界观设定、你的人设以及我们之间的情感关系，以你的视角帮我解析这个梦境，并和我进行一段潜意识深处的对话。`;
    
    // 如果解锁了隐藏记忆，附加特殊指令
    if (dreamCount === 3) {
        promptText += `\n(系统提示：由于连续共梦，你突然回忆起了一段与我相关的、被封存的隐藏记忆片段，请在对话中自然地向我透露这段记忆。)`;
    }

    // 3. 关闭梦境 App 窗口
    document.getElementById('dream-app-window').classList.remove('open');
    
    // 4. 自动跳转到聊天界面并发送消息
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        // 将构建好的 Prompt 填入聊天输入框
        chatInput.value = promptText;
        
        // 尝试调用现有的发送消息函数
        if (typeof sendUserMessage === 'function') {
            sendUserMessage();
        } else {
            // 如果找不到函数，则聚焦输入框让用户手动按回车
            chatInput.focus();
        }
    }
    
    // 5. 清空梦境输入框，为下次记录做准备
    input.value = ''; 
}