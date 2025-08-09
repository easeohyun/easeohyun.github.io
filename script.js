(function () {
    'use strict';

    const GRADE_MAP = Object.freeze({ S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 });
    const DEBOUNCE_DELAY = 250;
    const DATA_PATHS = {
        characters: "./characters.json",
        skillDescriptions: "./skill-descriptions.json"
    };

    const DOM = {
        html: document.documentElement,
        body: document.body,
        filterForm: document.getElementById("filter-form"),
        characterList: document.getElementById("character-list"),
        resultSummary: document.getElementById("result-summary"),
        sortOrder: document.getElementById("sort-order"),
        searchBox: document.getElementById("search-box"),
        resetFiltersButton: document.getElementById("reset-filters"),
        noResultsContainer: document.getElementById("no-results"),
        noResultsResetButton: document.getElementById("no-results-reset"),
        scrollTopButton: document.getElementById("scroll-top"),
        scrollBottomButton: document.getElementById("scroll-bottom"),
        toggleSkillsButton: document.getElementById("toggle-skills-btn"),
        darkModeToggleButton: document.getElementById("dark-mode-toggle"),
        cardTemplate: document.getElementById("character-card-template"),
        skeletonTemplate: document.getElementById("skeleton-card-template"),
        modalContainer: document.getElementById("contact-modal"),
        openModalBtn: document.getElementById("open-modal-btn"),
        closeModalBtn: document.getElementById("close-modal-btn"),
        modalOverlay: document.querySelector(".modal-overlay"),
        contactEmailLink: document.getElementById("contact-email-link"),
        skillTooltip: document.getElementById("skill-tooltip"),
    };

    const state = {
        allCharacters: [],
        skillDescriptions: {},
        observer: null,
        worker: null,
        themeTransitionTimeout: null,
        longPressTimer: null,
        longPressInterval: null,
        isModalOpen: false,
        activeTooltip: { element: null, timeout: null },
    };
    
    const getRandomMessage = (messages) => {
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const createStatItem = (displayName, value, isBonus = false) => {
        const itemLi = document.createElement('li');
        itemLi.className = 'stat-item';
        const valueSpan = isBonus
            ? `${value}<span class="percent">%</span>`
            : `<span class="grade-${String(value).toLowerCase()}">${value}</span>`;
        itemLi.innerHTML = `<span class="label">${displayName}</span><span class="value">${valueSpan}</span>`;
        return itemLi;
    };

    const createStatGroup = (char, sectionKey, groupName, itemMap, isBonus = false) => {
        const statData = char[sectionKey];
        if (!statData) return null;

        const items = Object.entries(itemMap)
            .map(([itemKey, displayName]) => {
                const value = statData[itemKey];
                return value !== undefined ? createStatItem(displayName, value, isBonus) : null;
            })
            .filter(Boolean);

        if (items.length === 0) return null;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'stat-group';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'stat-group-title';
        titleDiv.textContent = groupName;
        groupDiv.appendChild(titleDiv);

        const listUl = document.createElement('ul');
        listUl.className = 'stat-items-list';
        items.forEach(item => listUl.appendChild(item));
        groupDiv.appendChild(listUl);

        return groupDiv;
    };

    const createCharacterCard = (char) => {
        const card = DOM.cardTemplate.content.cloneNode(true).firstElementChild;
        card.dataset.id = char.id;
        if (char.color) {
            card.style.setProperty("--character-color", char.color);
        }

        const identityDiv = card.querySelector(".card-identity");
        identityDiv.querySelector(".card-nickname").textContent = `[ ${char.nickname} ]`;
        identityDiv.querySelector(".card-title").textContent = char.name;

        const statsContainer = card.querySelector(".card-stats");
        const aptitudeMap = {
            SurfaceAptitude: { name: "경기장 적성", map: { Turf: "잔디", Dirt: "더트" }},
            DistanceAptitude: { name: "거리 적성", map: { Short: "단거리", Mile: "마일", Medium: "중거리", Long: "장거리" }},
            StrategyAptitude: { name: "각질 적성", map: { Front: "도주", Pace: "선행", Late: "선입", End: "추입" }},
        };
        const bonusMap = {
            StatBonuses: { name: "성장률", map: { Speed: "스피드", Stamina: "스태미나", Power: "파워", Guts: "근성", Wit: "지능" }, isBonus: true }
        };

        for (const [sectionKey, { name, map }] of Object.entries(aptitudeMap)) {
            const groupEl = createStatGroup(char, sectionKey, name, map);
            if (groupEl) statsContainer.appendChild(groupEl);
        }
        for (const [sectionKey, { name, map, isBonus }] of Object.entries(bonusMap)) {
            const groupEl = createStatGroup(char, sectionKey, name, map, isBonus);
            if (groupEl) statsContainer.appendChild(groupEl);
        }

        const createSkillRow = (skills, color) => {
            if (!skills || skills.length === 0) return null;
            const rowDiv = document.createElement('div');
            rowDiv.className = 'skill-row';
            skills.forEach(skill => {
                const slotDiv = document.createElement('div');
                slotDiv.className = `skill-slot skill-${color}`;
                slotDiv.textContent = skill || "";
                slotDiv.setAttribute('role', 'button');
                slotDiv.setAttribute('tabindex', '0');
                rowDiv.appendChild(slotDiv);
            });
            return rowDiv;
        };
        
        const skillContainer = card.querySelector(".skill-container");
        const skillsMap = {
            rainbow: char.skills?.rainbow,
            pink: char.skills?.pink,
            yellow: char.skills?.yellow,
            white: char.skills?.white,
        };
        for (const [color, skills] of Object.entries(skillsMap)) {
            const row = createSkillRow(skills, color);
            if (row) skillContainer.appendChild(row);
        }
        
        const skillDetails = card.querySelector('.skill-details');
        const skillSummary = card.querySelector('.skill-summary');
        
        skillDetails.addEventListener('toggle', () => {
             skillSummary.setAttribute('aria-expanded', skillDetails.open);
        });

        return card;
    };
    
    const setLoadingState = (isLoading, message = "") => {
        if (isLoading) {
            DOM.characterList.innerHTML = "";
            DOM.resultSummary.setAttribute('aria-live', 'assertive');
            DOM.resultSummary.innerHTML = message;
        } else {
            DOM.resultSummary.setAttribute('aria-live', 'polite');
        }
    };
    
    const renderCharacters = (charactersToRender, isFiltered) => {
        const { characterList, noResultsContainer, resultSummary } = DOM;
        const count = charactersToRender.length;
        
        if (state.observer) state.observer.disconnect();
        characterList.innerHTML = "";

        const hasActiveFilters = isFiltered || DOM.searchBox.value.trim() !== "" || Array.from(DOM.filterForm.elements).some(el => el.type === "checkbox" && el.checked);
        
        if (count === 0 && hasActiveFilters) {
            characterList.style.display = "none";
            noResultsContainer.style.display = "block";
            resultSummary.innerHTML = "";
            return;
        }

        characterList.style.display = "grid";
        noResultsContainer.style.display = "none";

        let summaryText = "";
        if (!hasActiveFilters) {
            summaryText = `트레센 학원에 어서오세요, 이렇게 많은 친구들은 처음이죠?<p>지금부터 <strong>${state.allCharacters.length}</strong>명의 우마무스메 중에서 3년을 함께할 학생을 찾아봐요.</p>`;
        } else {
            const messages = 
                count === 1 ? ["당신이 찾던 그 우마무스메가... 딱 <strong>1명</strong> 있었어요!", "앞으로 3년을 함께할 우마무스메를 <strong>1명</strong> 찾았어요.", "지금 이 <strong>1명</strong>과 만남은 운명, 꿈은 목표."] :
                count <= 5 ? [`당신이 찾던 그 우마무스메는... <strong>${count}</strong>명 중에 있을 거예요.`, `<strong>${count}</strong>명의 우마무스메를 찾았어요. 어떤 옷을 입히고 싶으신가요?`, `<strong>${count}</strong>명의 우마무스메 중에서, 결정이 필요할 거예요.`] :
                count <= 15 ? [`당신이 찾던 그 우마무스메는... <strong>${count}</strong>명 중에 있을 것 같아요.`, `<strong>${count}</strong>명의 우마무스메를 찾았어요. 아직은 좀 많죠?`, `<strong>${count}</strong>명의 우마무스메 중에서, 간추릴 필요가 있어요.`] :
                count <= 50 ? [`당신이 찾는 그 우마무스메는... <strong>${count}</strong>명 중에 있는 것 맞죠?`, `<strong>${count}</strong>명의 우마무스메를 찾았는데요, 더 둘러봐야 해요.`, `<strong>${count}</strong>명의 우마무스메 중에서, 대체 어디있을까요?`] :
                [`당신이 찾는 그 우마무스메가... <strong>${count}</strong>명 중에 있기를 바랍니다!`, `<strong>${count}</strong>명의 우마무스메를 찾았는데요, 이제 시작이에요.`, `<strong>${count}</strong>명의 우마무스메 중에서, 이제 찾아볼까요?`];
            summaryText = getRandomMessage(messages);
        }
        resultSummary.innerHTML = summaryText;
        
        state.observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skeletonCard = entry.target;
                    const charId = skeletonCard.dataset.id;
                    const characterData = state.allCharacters.find(c => String(c.id) === charId);
                    if (characterData) {
                        const realCard = createCharacterCard(characterData);
                        skeletonCard.replaceWith(realCard);
                    }
                    obs.unobserve(skeletonCard);
                }
            });
        }, { root: null, rootMargin: '0px 0px 400px 0px', threshold: 0 });

        const fragment = document.createDocumentFragment();
        charactersToRender.forEach(char => {
            const skeletonCard = DOM.skeletonTemplate.content.cloneNode(true).firstElementChild;
            skeletonCard.dataset.id = char.id;
            fragment.appendChild(skeletonCard);
            state.observer.observe(skeletonCard);
        });

        characterList.appendChild(fragment);
    };

    const updateDisplay = () => {
        if (!state.worker) return;

        const formData = new FormData(DOM.filterForm);
        const activeFilters = [];
        for (const el of DOM.filterForm.elements) {
            if (el.type === "checkbox" && el.checked) {
                const key = el.name;
                const isStatBonus = ["Speed", "Stamina", "Power", "Guts", "Wit"].includes(key);
                const filter = isStatBonus
                    ? { key, type: "value", value: parseInt(formData.get(`${key}-value`), 10) || 0 }
                    : { key, type: "grade", value: GRADE_MAP[formData.get(`${key}-grade`)] };
                activeFilters.push(filter);
            }
        }
        
        const rawSearchTerms = DOM.searchBox.value.split(",").map(term => term.trim()).filter(Boolean);
        const searchTerms = {
            inclusionTerms: rawSearchTerms.filter(term => !term.startsWith("-")),
            exclusionTerms: rawSearchTerms.filter(term => term.startsWith("-")).map(term => term.substring(1)).filter(Boolean)
        };
        
        const sortBy = DOM.sortOrder.value;

        setLoadingState(true, "조건에 맞는 우마무스메를 찾고 있습니다...");

        state.worker.postMessage({
            type: 'filter',
            payload: { activeFilters, searchTerms, sortBy }
        });
    };

    const resetAllFilters = () => {
        DOM.filterForm.reset();
        DOM.searchBox.value = "";
        updateDisplay();
    };
    
    const toggleAllSkills = () => {
        const allDetails = DOM.characterList.querySelectorAll(".skill-details");
        if (allDetails.length === 0) return;

        const shouldOpen = Array.from(allDetails).some(d => !d.open);
        allDetails.forEach(detail => detail.open = shouldOpen);

        const icon = DOM.toggleSkillsButton.querySelector(".material-symbols-outlined");
        icon.textContent = shouldOpen ? "unfold_less" : "unfold_more";
        DOM.toggleSkillsButton.title = `모든 스킬 ${shouldOpen ? '접기' : '펼치기'} (A)`;
    };

    const updateScrollButtonsVisibility = () => {
        const { scrollTopButton, scrollBottomButton } = DOM;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;

        scrollTopButton.classList.toggle("hidden", scrollTop < 200);
        scrollBottomButton.classList.toggle("hidden", isAtBottom);
    };
    
    const handleKeyboardShortcuts = (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        
        const activeElement = document.activeElement;
        const isTyping = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "SELECT" || activeElement.isContentEditable);

        if (event.key === 'Escape') {
            event.preventDefault();
            if (state.activeTooltip.element) {
                hideTooltip();
            } else if (state.isModalOpen) {
                closeModal();
            } else if (isTyping) {
                activeElement.blur();
            } else {
                resetAllFilters();
            }
            return;
        }

        if (isTyping || state.isModalOpen) return;

        const shortcuts = {
            'q': () => DOM.searchBox.focus(),
            '/': () => DOM.searchBox.focus(),
            'r': resetAllFilters,
            'w': () => window.scrollTo({ top: 0, behavior: "smooth" }),
            's': () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
            'a': toggleAllSkills,
            'd': toggleTheme,
        };

        const action = shortcuts[event.key.toLowerCase()];
        if (action) {
            event.preventDefault();
            action();
        }
    };
    
    const applyTheme = (theme) => {
        clearTimeout(state.themeTransitionTimeout);
        DOM.html.classList.add('theme-transition');
        DOM.html.dataset.theme = theme;
        
        const icon = DOM.darkModeToggleButton.querySelector(".material-symbols-outlined");
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        DOM.darkModeToggleButton.title = theme === 'dark' ? '밝은 테마로 전환 (D)' : '어두운 테마로 전환 (D)';
        localStorage.setItem("theme", theme);
        
        state.themeTransitionTimeout = setTimeout(() => DOM.html.classList.remove('theme-transition'), 150);
    };

    const toggleTheme = () => {
        applyTheme(DOM.html.dataset.theme === 'light' ? 'dark' : 'light');
    };
    
    const openModal = () => {
        if (state.isModalOpen) return;
        state.isModalOpen = true;
        history.pushState({ modal: true }, '', '#modal');
        DOM.modalContainer.hidden = false;
        requestAnimationFrame(() => {
             DOM.modalContainer.classList.add("active");
             DOM.closeModalBtn.focus();
        });
    };
    
    const closeModal = () => {
        if (!state.isModalOpen) return;
        state.isModalOpen = false;
        DOM.modalContainer.classList.remove("active");
        DOM.modalContainer.addEventListener("transitionend", () => {
            DOM.modalContainer.hidden = true;
            if (location.hash === "#modal") history.back();
        }, { once: true });
    };

    const showTooltip = (element, skillName) => {
        if (state.activeTooltip.element) hideTooltip();

        const description = state.skillDescriptions[skillName];
        const card = element.closest('.character-card');
        const characterColor = card ? getComputedStyle(card).getPropertyValue('--character-color').trim() : 'var(--color-primary)';
        
        DOM.skillTooltip.style.setProperty('--character-color', characterColor);
        DOM.skillTooltip.innerHTML = `
            <div class="tooltip-header">${skillName}</div>
            <div class="tooltip-description">${description || '<span class="tooltip-not-found">설명을 찾을 수 없어요.</span>'}</div>
        `;

        const rect = element.getBoundingClientRect();
        const tooltipRect = DOM.skillTooltip.getBoundingClientRect();

        let top = rect.bottom + window.scrollY + 8;
        let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2);

        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight + window.scrollY - 10) {
            top = rect.top + window.scrollY - tooltipRect.height - 8;
        }

        DOM.skillTooltip.style.top = `${top}px`;
        DOM.skillTooltip.style.left = `${left}px`;
        
        DOM.skillTooltip.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => DOM.skillTooltip.classList.add('visible'));
        
        state.activeTooltip.element = element;
    };

    const hideTooltip = () => {
        if (!state.activeTooltip.element) return;
        DOM.skillTooltip.classList.remove('visible');
        DOM.skillTooltip.setAttribute('aria-hidden', 'true');
        state.activeTooltip.element = null;
    };

    const handleSkillClick = (event) => {
        const skillSlot = event.target.closest('.skill-slot');
        if (!skillSlot) return;

        const skillName = skillSlot.textContent.trim();
        if (!skillName) return;

        showTooltip(skillSlot, skillName);
    };

    const handleBodyClick = (event) => {
        if (state.activeTooltip.element && !state.activeTooltip.element.contains(event.target)) {
            hideTooltip();
        }
    };
    
    const setupEventListeners = () => {
        const debouncedUpdate = debounce(updateDisplay, DEBOUNCE_DELAY);
        
        DOM.filterForm.addEventListener("input", e => {
            if (['checkbox', 'select-one', 'number'].includes(e.target.type)) {
                debouncedUpdate();
            }
        });

        DOM.searchBox.addEventListener("input", debouncedUpdate);
        DOM.sortOrder.addEventListener("change", updateDisplay);

        DOM.resetFiltersButton.addEventListener("click", resetAllFilters);
        DOM.noResultsResetButton.addEventListener("click", resetAllFilters);

        DOM.scrollTopButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        DOM.scrollBottomButton.addEventListener("click", () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
        
        DOM.toggleSkillsButton.addEventListener("click", toggleAllSkills);
        DOM.darkModeToggleButton.addEventListener("click", toggleTheme);

        DOM.openModalBtn.addEventListener("click", openModal);
        DOM.closeModalBtn.addEventListener("click", closeModal);
        DOM.modalOverlay.addEventListener("click", closeModal);
        
        DOM.characterList.addEventListener('click', handleSkillClick);
        DOM.body.addEventListener('click', handleBodyClick);
        
        window.addEventListener('popstate', () => {
            if (state.isModalOpen) closeModal();
        });

        DOM.contactEmailLink.addEventListener("click", function(e) {
            e.preventDefault();
            if (this.dataset.revealed !== "true") {
                const email = "easeohyun" + "@" + "gmail.com"; 
                this.textContent = email;
                this.href = `mailto:${email}`;
                this.dataset.revealed = "true";
            }
            if (confirm(`메일 클라이언트를 열어 '${this.textContent}' 주소로 메일을 보내시겠습니까?`)) {
                window.open(this.href, '_blank');
            }
        });

        document.addEventListener("keydown", handleKeyboardShortcuts);
        window.addEventListener("scroll", debounce(updateScrollButtonsVisibility, 150), { passive: true });
        window.addEventListener("resize", debounce(updateScrollButtonsVisibility, 150));
        
        DOM.filterForm.addEventListener("mousedown", e => {
            const button = e.target.closest(".spinner-btn");
            if (!button) return;
            e.preventDefault();

            const input = button.parentElement.querySelector('input[type="number"]');
            if (!input) return;

            const changeValue = () => {
                const step = parseFloat(input.step) || 1;
                let value = parseFloat(input.value) || 0;
                const min = parseFloat(input.min);
                const max = parseFloat(input.max);

                if (button.classList.contains("up")) {
                    value = isNaN(max) ? value + step : Math.min(max, value + step);
                } else {
                    value = isNaN(min) ? value - step : Math.max(min, value - step);
                }
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            };
            
            changeValue();
            state.longPressTimer = setTimeout(() => {
                state.longPressInterval = setInterval(changeValue, 100);
            }, 500);
        });
        
        const stopLongPress = () => {
            clearTimeout(state.longPressTimer);
            clearInterval(state.longPressInterval);
        };
        document.addEventListener("mouseup", stopLongPress);
        document.addEventListener("mouseleave", stopLongPress);
    };

    const initWorker = () => new Promise((resolve, reject) => {
        if (!('Worker' in window)) return reject(new Error("Web Workers are not supported."));
        
        const worker = new Worker('./workers/filterWorker.js');
        worker.onmessage = e => {
            if (e.data.type === 'filtered') renderCharacters(e.data.payload, true);
        };
        worker.onerror = err => {
            console.error(`Web Worker error: ${err.message}`, err);
            setLoadingState(false);
            DOM.resultSummary.innerHTML = `<div class="error-message"><p><strong>오류:</strong> 데이터를 처리하는 중 문제가 발생했어요.</p><p>페이지를 새로고침 해주세요.</p></div>`;
            reject(err);
        };
        resolve(worker);
    });
    
    const fetchData = async (url) => {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText} for ${url}`);
        return response.json();
    };

    const initializeApp = async () => {
        const style = document.createElement('style');
        style.textContent = `.theme-transition, .theme-transition *, .theme-transition *::before, .theme-transition *::after { transition: background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out !important; }`;
        document.head.appendChild(style);

        setupEventListeners();

        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
        
        setLoadingState(true, "학생 명부를 불러오는 중...");

        try {
            state.worker = await initWorker();
        } catch (error) {
            console.error("Failed to initialize Web Worker:", error);
            DOM.resultSummary.innerHTML = `<div class="error-message"><p><strong>오류:</strong> 필수 기능을 불러오지 못했어요.</p><p>최신 브라우저를 사용하거나 페이지를 새로고침 해주세요.</p></div>`;
            return;
        }

        try {
            const [characters, skillDescriptions] = await Promise.all([
                fetchData(DATA_PATHS.characters),
                fetchData(DATA_PATHS.skillDescriptions)
            ]);
            
            state.allCharacters = characters;
            state.skillDescriptions = skillDescriptions;
            
            state.worker.postMessage({ type: 'init', payload: { characters: state.allCharacters } });
            renderCharacters(state.allCharacters, false);

        } catch (error) {
            console.error("Failed to load initial data:", error);
            DOM.resultSummary.innerHTML = `<div class="error-message"><p><strong>오류:</strong> 데이터를 불러오지 못했어요.</p><p>인터넷 연결을 확인하고 새로고침 해주세요.</p></div>`;
        } finally {
            updateScrollButtonsVisibility();
        }
    };
    
    document.addEventListener("DOMContentLoaded", initializeApp);

})();
