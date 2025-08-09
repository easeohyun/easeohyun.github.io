(function () {
    'use strict';

    const GRADE_MAP = Object.freeze({ S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 });
    const CHARACTERS_JSON_PATH = "./characters.json";
    const SKILL_DESCRIPTIONS_JSON_PATH = "./skill-descriptions.json";
    const DEBOUNCE_DELAY = 250;

    const DOM = {
        html: document.documentElement,
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
        activeTooltip: { element: null, skillSlot: null },
    };

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const setCheckboxIcons = () => {
        const iconMap = {
            'filter-turf': 'grass', 'filter-dirt': 'landslide', 'filter-speed': 'podiatry',
            'filter-stamina': 'favorite', 'filter-power': 'ulna_radius_alt', 'filter-guts': 'mode_heat',
            'filter-wit': 'school', 'filter-short': 'directions_run', 'filter-mile': 'directions_run',
            'filter-medium': 'directions_run', 'filter-long': 'directions_run', 'filter-front': 'directions_run',
            'filter-pace': 'directions_run', 'filter-late': 'directions_run', 'filter-end': 'directions_run'
        };
        for (const [id, icon] of Object.entries(iconMap)) {
            const element = document.querySelector(`#${id} label`);
            if (element) element.style.setProperty('--icon-content', `'${icon}'`);
        }
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
    
    const hideTooltip = () => {
        if (DOM.skillTooltip.classList.contains("visible")) {
            DOM.skillTooltip.classList.remove("visible");
            DOM.skillTooltip.setAttribute("aria-hidden", "true");
            state.activeTooltip.element = null;
            state.activeTooltip.skillSlot = null;
        }
    };

    const handleSkillClick = (event) => {
        event.stopPropagation();
        const skillSlot = event.currentTarget;
        const skillName = skillSlot.dataset.skillName;

        if (state.activeTooltip.skillSlot === skillSlot) {
            hideTooltip();
            return;
        }

        const description = state.skillDescriptions[skillName];
        if (!description) {
            hideTooltip();
            return;
        }

        const card = skillSlot.closest('.character-card');
        const characterColor = card.style.getPropertyValue("--character-color");

        DOM.skillTooltip.style.setProperty("--character-color", characterColor);
        DOM.skillTooltip.innerHTML = `<strong class="skill-name">${skillName}</strong>${description}`;
        
        const rect = skillSlot.getBoundingClientRect();
        DOM.skillTooltip.classList.add("visible");
        DOM.skillTooltip.setAttribute("aria-hidden", "false");

        const tooltipRect = DOM.skillTooltip.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;

        let top, left;
        DOM.skillTooltip.className = "visible";

        if (spaceBelow > tooltipRect.height + 10 || spaceBelow > spaceAbove) {
            top = rect.bottom + 8;
            DOM.skillTooltip.classList.add("tooltip-top");
        } else {
            top = rect.top - tooltipRect.height - 8;
            DOM.skillTooltip.classList.add("tooltip-bottom");
        }
        
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));

        DOM.skillTooltip.style.top = `${top}px`;
        DOM.skillTooltip.style.left = `${left}px`;
        
        state.activeTooltip.element = DOM.skillTooltip;
        state.activeTooltip.skillSlot = skillSlot;
    };

    const createCharacterCard = (char) => {
        const card = DOM.cardTemplate.content.cloneNode(true).firstElementChild;
        card.dataset.id = char.id;
        if (char.color) card.style.setProperty("--character-color", char.color);

        card.querySelector(".card-nickname").textContent = `[ ${char.nickname} ]`;
        card.querySelector(".card-title").textContent = char.name;

        const statsContainer = card.querySelector(".card-stats");
        const aptitudeMap = {
            SurfaceAptitude: { name: "경기장 적성", map: { Turf: "잔디", Dirt: "더트" }},
            DistanceAptitude: { name: "거리 적성", map: { Short: "단거리", Mile: "마일", Medium: "중거리", Long: "장거리" }},
            StrategyAptitude: { name: "각질 적성", map: { Front: "도주", Pace: "선행", Late: "선입", End: "추입" }},
        };
        const bonusMap = { StatBonuses: { name: "성장률", map: { Speed: "스피드", Stamina: "스태미나", Power: "파워", Guts: "근성", Wit: "지능" }, isBonus: true }};

        Object.entries(aptitudeMap).forEach(([key, { name, map }]) => {
            const groupEl = createStatGroup(char, key, name, map);
            if (groupEl) statsContainer.appendChild(groupEl);
        });
        Object.entries(bonusMap).forEach(([key, { name, map, isBonus }]) => {
            const groupEl = createStatGroup(char, key, name, map, isBonus);
            if (groupEl) statsContainer.appendChild(groupEl);
        });

        const skillContainer = card.querySelector(".skill-container");
        const createSkillRow = (skills, color) => {
            if (!skills || skills.length === 0) return null;
            const rowDiv = document.createElement('div');
            rowDiv.className = 'skill-row';
            skills.forEach(skill => {
                if (!skill) return;
                const slotDiv = document.createElement('div');
                slotDiv.className = `skill-slot skill-${color}`;
                slotDiv.textContent = skill;
                slotDiv.dataset.skillName = skill;
                slotDiv.addEventListener('click', handleSkillClick);
                rowDiv.appendChild(slotDiv);
            });
            return rowDiv;
        };
        
        const skillsMap = {
            rainbow: char.skills?.rainbow, pink: char.skills?.pink,
            yellow: char.skills?.yellow, white: char.skills?.white,
        };
        Object.entries(skillsMap).forEach(([color, skills]) => {
            const row = createSkillRow(skills, color);
            if (row) skillContainer.appendChild(row);
        });
        
        const skillDetails = card.querySelector('.skill-details');
        const skillSummary = card.querySelector('.skill-summary');
        skillDetails.addEventListener('toggle', () => {
             skillSummary.setAttribute('aria-expanded', skillDetails.open);
        });

        return card;
    };
    
    const setLoadingState = (isLoading, message = "") => {
        if (isLoading) {
            if (DOM.characterList) DOM.characterList.innerHTML = "";
            if (DOM.resultSummary) {
                DOM.resultSummary.setAttribute('aria-live', 'assertive');
                DOM.resultSummary.innerHTML = message;
            }
        } else {
            if (DOM.resultSummary) DOM.resultSummary.setAttribute('aria-live', 'polite');
        }
    };
    
    const getSummaryMessage = (count, hasActiveFilters, totalCount) => {
        const getRandomMessage = (messages) => messages[Math.floor(Math.random() * messages.length)];

        if (!hasActiveFilters) {
            return getRandomMessage([`트레센 학원에 어서오세요, 이렇게 많은 친구들은 처음이죠?<p>지금부터 <strong>${totalCount}</strong>명의 우마무스메 중에서 3년을 함께할 학생을 찾아봐요.</p>`]);
        }

        const messagesByCount = [
            { threshold: 1, messages: ["당신이 찾던 그 우마무스메가... 딱 <strong>1명</strong> 있었어요!", "앞으로 3년을 함께할 우마무스메를 <strong>1명</strong> 찾았어요.", "지금 이 <strong>1명</strong>과 만남은 운명, 꿈은 목표."]},
            { threshold: 5, messages: [`당신이 찾던 그 우마무스메는... <strong>${count}</strong>명 중에 있을 거예요.`, `<strong>${count}</strong>명의 우마무스메를 찾았어요. 어떤 옷을 입히고 싶으신가요?`, `<strong>${count}</strong>명의 우마무스메 중에서, 결정이 필요할 거예요.`]},
            { threshold: 15, messages: [`당신이 찾던 그 우마무스메는... <strong>${count}</strong>명 중에 있을 것 같아요.`, `<strong>${count}</strong>명의 우마무스메를 찾았어요. 아직은 좀 많죠?`, `<strong>${count}</strong>명의 우마무스메 중에서, 간추릴 필요가 있어요.`]},
            { threshold: 50, messages: [`당신이 찾는 그 우마무스메는... <strong>${count}</strong>명 중에 있는 것 맞죠?`, `<strong>${count}</strong>명의 우마무스메를 찾았는데요, 더 둘러봐야 해요.`, `<strong>${count}</strong>명의 우마무스메 중에서, 대체 어디있을까요?`]},
            { threshold: Infinity, messages: [`당신이 찾는 그 우마무스메가... <strong>${count}</strong>명 중에 있기를 바랍니다!`, `<strong>${count}</strong>명의 우마무스메를 찾았는데요, 이제 시작이에요.`, `<strong>${count}</strong>명의 우마무스메 중에서, 이제 찾아볼까요?`]}
        ];

        const { messages } = messagesByCount.find(item => count <= item.threshold);
        return getRandomMessage(messages);
    };

    const renderCharacters = (charactersToRender, isFiltered) => {
        const { characterList, noResultsContainer, resultSummary, searchBox, filterForm } = DOM;
        const count = charactersToRender.length;
        
        if (state.observer) state.observer.disconnect();
        characterList.innerHTML = "";

        const hasActiveFilters = isFiltered || searchBox.value.trim() !== "" || Array.from(filterForm.elements).some(el => el.type === "checkbox" && el.checked);
        
        if (count === 0 && hasActiveFilters) {
            characterList.style.display = "none";
            noResultsContainer.style.display = "block";
            resultSummary.innerHTML = "";
            return;
        }

        characterList.style.display = "grid";
        noResultsContainer.style.display = "none";
        resultSummary.innerHTML = getSummaryMessage(count, hasActiveFilters, state.allCharacters.length);
        
        state.observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skeletonCard = entry.target;
                    const charId = skeletonCard.dataset.id;
                    const characterData = state.allCharacters.find(c => String(c.id) === charId);
                    if (characterData) skeletonCard.replaceWith(createCharacterCard(characterData));
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
        const activeFilters = Array.from(DOM.filterForm.elements)
            .filter(el => el.type === "checkbox" && el.checked)
            .map(el => {
                const key = el.name;
                const isStatBonus = el.id.match(/Speed|Stamina|Power|Guts|Wit/);
                return isStatBonus
                    ? { key, type: "value", value: parseInt(formData.get(`${key}-value`), 10) || 0 }
                    : { key, type: "grade", value: GRADE_MAP[formData.get(`${key}-grade`)] };
            });
        
        const rawSearchTerms = DOM.searchBox.value.split(",").map(term => term.trim()).filter(Boolean);
        const searchTerms = {
            inclusionTerms: rawSearchTerms.filter(term => !term.startsWith("-")),
            exclusionTerms: rawSearchTerms.filter(term => term.startsWith("-")).map(term => term.substring(1)).filter(Boolean)
        };
        
        setLoadingState(true, "조건에 맞는 우마무스메를 찾고 있습니다...");
        state.worker.postMessage({ type: 'filter', payload: { activeFilters, searchTerms, sortBy: DOM.sortOrder.value } });
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
        const isAtBottom = (window.innerHeight + scrollTop) >= document.documentElement.scrollHeight - 20;
        scrollTopButton.classList.toggle("hidden", scrollTop < 200);
        scrollBottomButton.classList.toggle("hidden", isAtBottom);
    };
    
    const handleKeyboardShortcuts = (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        const activeElement = document.activeElement;
        const isTyping = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "SELECT" || activeElement.isContentEditable);

        if (event.key === 'Escape') {
            event.preventDefault();
            if (state.isModalOpen) closeModal();
            else if (state.activeTooltip.element) hideTooltip();
            else if (isTyping) activeElement.blur();
            else resetAllFilters();
            return;
        }

        if (isTyping || state.isModalOpen) return;
        const shortcuts = {
            'q': () => DOM.searchBox.focus(), '/': () => DOM.searchBox.focus(), 'r': resetAllFilters,
            'w': () => window.scrollTo({ top: 0, behavior: "smooth" }),
            's': () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
            'a': toggleAllSkills, 'd': toggleTheme,
        };
        const action = shortcuts[event.key.toLowerCase()];
        if (action) {
            event.preventDefault();
            action();
        }
    };
    
    const applyTheme = (theme) => {
        const { html, darkModeToggleButton } = DOM;
        const icon = darkModeToggleButton.querySelector(".material-symbols-outlined");
        clearTimeout(state.themeTransitionTimeout);
        html.classList.add('theme-transition');
        html.dataset.theme = theme;
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        darkModeToggleButton.title = theme === 'dark' ? '밝은 테마로 전환 (D)' : '어두운 테마로 전환 (D)';
        localStorage.setItem("theme", theme);
        state.themeTransitionTimeout = setTimeout(() => html.classList.remove('theme-transition'), 150);
    };

    const toggleTheme = () => applyTheme((DOM.html.dataset.theme || 'light') === 'light' ? 'dark' : 'light');
    
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

    const setupEventListeners = () => {
        const debouncedUpdate = debounce(updateDisplay, DEBOUNCE_DELAY);
        
        DOM.filterForm.addEventListener("input", e => {
            if(['checkbox','select-one','number'].includes(e.target.type)) debouncedUpdate();
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
        document.addEventListener("click", () => {
            if (state.activeTooltip.element) hideTooltip();
        });

        window.addEventListener('popstate', (event) => {
            if (state.isModalOpen) closeModal();
        });

        DOM.contactEmailLink.addEventListener("click", function(e) {
            e.preventDefault();
            const user = "easeohyun", domain = "gmail.com", email = `${user}@${domain}`; 
            if (confirm(`메일 클라이언트를 열어 '${email}' 주소로 메일을 보내시겠습니까?`)) {
                window.open(`mailto:${email}`, '_blank');
            }
        });

        document.addEventListener("keydown", handleKeyboardShortcuts);
        const debouncedScrollResize = debounce(updateScrollButtonsVisibility, 150);
        window.addEventListener("scroll", debouncedScrollResize);
        window.addEventListener("resize", debouncedScrollResize);
        
        DOM.filterForm.addEventListener("mousedown", e => {
            if (!e.target.classList.contains("spinner-btn")) return;
            e.preventDefault();
            const wrapper = e.target.closest(".number-input-wrapper");
            if (!wrapper) return;
            const input = wrapper.querySelector('input[type="number"]');
            if (!input) return;

            const changeValue = () => {
                const step = parseFloat(input.step) || 1, min = parseFloat(input.min) || 0, max = parseFloat(input.max) || 30;
                let value = parseFloat(input.value) || 0;
                if (e.target.classList.contains("up")) value = Math.min(max, value + step);
                else if (e.target.classList.contains("down")) value = Math.max(min, value - step);
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            };
            changeValue();
            state.longPressTimer = setTimeout(() => state.longPressInterval = setInterval(changeValue, 100), 500);
        });
        
        const stopLongPress = () => {
            clearTimeout(state.longPressTimer);
            clearInterval(state.longPressInterval);
        };
        document.addEventListener("mouseup", stopLongPress);
        document.addEventListener("mouseleave", stopLongPress);
    };

    const initWorker = () => {
        return new Promise((resolve, reject) => {
            if (!('Worker' in window)) return reject(new Error("Web Workers are not supported."));
            const worker = new Worker('./workers/filterWorker.js');
            worker.onmessage = e => {
                if (e.data.type === 'filtered') renderCharacters(e.data.payload, true);
            };
            worker.onerror = error => {
                console.error(`Web Worker error: ${error.message}`, error);
                setLoadingState(false);
                DOM.resultSummary.innerHTML = `<div style="color:red; text-align:center;"><p><strong>Error:</strong> An error occurred.</p><p>Please refresh the page.</p></div>`;
                reject(error);
            };
            resolve(worker);
        });
    };
    
    const fetchJson = async (path, options = { cache: 'no-cache' }) => {
        const response = await fetch(path, options);
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        return response.json();
    };

    const initializeApp = async () => {
        document.head.appendChild(Object.assign(document.createElement('style'), {
            textContent: `.theme-transition, .theme-transition *, .theme-transition *::before, .theme-transition *::after { transition: background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out !important; }`
        }));
        setupEventListeners();
        setCheckboxIcons();
        applyTheme(localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light'));
        setLoadingState(true, "학생 명부를 불러오는 중...");

        try {
            state.worker = await initWorker();
            const [characters, skillDescriptions] = await Promise.all([
                fetchJson(CHARACTERS_JSON_PATH),
                fetchJson(SKILL_DESCRIPTIONS_JSON_PATH)
            ]);
            state.allCharacters = characters;
            state.skillDescriptions = skillDescriptions;
            
            state.worker.postMessage({ type: 'init', payload: { characters: state.allCharacters } });
            renderCharacters(state.allCharacters, false);

        } catch (error) {
            console.error("Initialization failed:", error);
            setLoadingState(false);
            DOM.resultSummary.innerHTML = `<div style="color:var(--color-danger); text-align:center;"><p><strong>오류:</strong> 데이터를 불러오지 못했어요.</p><p>인터넷 연결을 확인하고 새로고침 해주세요.</p></div>`;
        } finally {
            updateScrollButtonsVisibility();
        }
    };
    
    document.addEventListener("DOMContentLoaded", initializeApp);
})();
