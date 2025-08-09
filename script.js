(function () {
    'use strict';

    const GRADE_MAP = Object.freeze({ S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 });
    const CHARACTERS_JSON_PATH = "./characters.json";
    const DEBOUNCE_DELAY = 250;
    const SKILL_DESCRIPTIONS_JSON_PATH = "./skill-descriptions.json";


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
    };

    const state = {
        allCharacters: [],
        observer: null,
        worker: null,
        themeTransitionTimeout: null,
        longPressTimer: null,
        longPressInterval: null,
        isModalOpen: false,
        skillDescriptions: {},
    };
    
    const getRandomMessage = (messages) => {
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const createElementWithClass = (tag, className, textContent) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent !== undefined) el.textContent = textContent;
        return el;
    };

    const applyTheme = (theme) => {
        const html = DOM.html;
        if (!html) return;
        html.classList.add('theme-transition');
        requestAnimationFrame(() => {
            html.setAttribute('data-theme', theme);
            clearTimeout(state.themeTransitionTimeout);
            state.themeTransitionTimeout = setTimeout(() => {
                html.classList.remove('theme-transition');
            }, 200);
        });
        localStorage.setItem("theme", theme);
        const isDark = theme === 'dark';
        DOM.darkModeToggleButton.setAttribute('aria-pressed', String(isDark));
        DOM.darkModeToggleButton.title = isDark ? "밝은 테마로 전환 (D)" : "어두운 테마로 전환 (D)";
    };

    const toggleTheme = () => {
        const current = DOM.html.getAttribute('data-theme') || 'light';
        applyTheme(current === 'light' ? 'dark' : 'light');
    };

    const updateScrollButtonsVisibility = () => {
        const atTop = window.scrollY <= 0;
        const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 10;
        DOM.scrollTopButton.hidden = atTop;
        DOM.scrollBottomButton.hidden = atBottom;
    };

    const setCheckboxIcons = () => {
        const iconMap = {
            "turf": "grass",
            "dirt": "terrain",
            "short": "speed",
            "mile": "directions_run",
            "medium": "route",
            "long": "timelapse",
            "front": "sprint",
            "pace": "directions_walk",
            "late": "directions_run",
            "end": "hourglass_bottom",
            "speed": "bolt",
            "stamina": "battery_charging_full",
            "power": "fitness_center",
            "guts": "monitor_heart",
            "wit": "psychology"
        };
        for (const [id, icon] of Object.entries(iconMap)) {
            const element = document.querySelector(`#${id} label`);
            if (element) {
                element.style.setProperty('--icon-content', `'${icon}'`);
            }
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

    const createStatGroup = (char, sectionKey, groupDisplayName, map, isBonus = false) => {
        const sectionData = char[sectionKey];
        if (!sectionData) return null;
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'stat-group';
        const title = createElementWithClass('div', 'stat-group-title', groupDisplayName);
        const list = document.createElement('ul');
        list.className = 'stat-list';
        for (const [key, displayName] of Object.entries(map)) {
            const value = sectionData[key];
            if (value !== undefined) {
                list.appendChild(createStatItem(displayName, value, isBonus));
            }
        }
        sectionDiv.appendChild(title);
        sectionDiv.appendChild(list);
        return sectionDiv;
    };

    const parseLooseSkillMap = (text) => {
        try {
            return JSON.parse(text);
        } catch (e) {
            const map = {};
            const regex = /"(.*?)"\s*:\s*"(.*?)"/gs;
            let m;
            while ((m = regex.exec(text)) !== null) {
                map[m[1]] = m[2];
            }
            return map;
        }
    };

    const fetchSkillDescriptions = async () => {
        try {
            const res = await fetch(SKILL_DESCRIPTIONS_JSON_PATH, { cache: 'no-cache' });
            if (!res.ok) return {};
            const text = await res.text();
            return parseLooseSkillMap(text);
        } catch (e) {
            return {};
        }
    };

    let tooltipEl = null;
    const ensureTooltipEl = () => {
        if (tooltipEl) return tooltipEl;
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'skill-tooltip';
        tooltipEl.className = 'skill-tooltip';
        tooltipEl.setAttribute('role', 'dialog');
        tooltipEl.setAttribute('aria-hidden', 'true');
        tooltipEl.innerHTML = '<div class="skill-tooltip__inner"><div class="skill-tooltip__title"></div><div class="skill-tooltip__desc"></div></div>';
        document.body.appendChild(tooltipEl);
        return tooltipEl;
    };

    const hideTooltip = () => {
        if (!tooltipEl) return;
        tooltipEl.classList.remove('is-visible');
        tooltipEl.setAttribute('aria-hidden', 'true');
    };

    const showTooltipForSlot = (slotEl, skillName, description) => {
        if (!description) return;
        const tooltip = ensureTooltipEl();
        const titleEl = tooltip.querySelector('.skill-tooltip__title');
        const descEl = tooltip.querySelector('.skill-tooltip__desc');
        titleEl.textContent = skillName;
        descEl.textContent = description;

        const card = slotEl.closest('.character-card');
        let charColor = '#3498db';
        if (card) {
            const style = getComputedStyle(card);
            charColor = style.getPropertyValue('--character-color') || charColor;
        }
        tooltip.style.setProperty('--skill-accent', charColor.trim());

        const rect = slotEl.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const margin = 10;
        let left = Math.max(margin, rect.left + rect.width / 2 - tooltipRect.width / 2);
        let top = rect.bottom + margin;
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        left = Math.min(left, vw - tooltipRect.width - margin);
        if (top + tooltipRect.height + margin > vh) {
            top = rect.top - tooltipRect.height - margin;
        }
        tooltip.style.left = left + window.scrollX + 'px';
        tooltip.style.top = top + window.scrollY + 'px';

        tooltip.classList.add('is-visible');
        tooltip.setAttribute('aria-hidden', 'false');
    };

    const getSkillDescription = (name) => {
        if (!name) return '';
        const map = state.skillDescriptions || {};
        if (map[name]) return map[name];
        if (map['#' + name]) return map['#' + name];
        const alt = name.replace(/\s+/g, '');
        if (map[alt]) return map[alt];
        if (map['#' + alt]) return map['#' + alt];
        return '';
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
            SurfaceAptitude: { name: "주요", map: { Turf: "잔디", Dirt: "더트" } },
            DistanceAptitude: { name: "거리", map: { Short: "단거리", Mile: "마일", Medium: "중거리", Long: "장거리" } },
            StrategyAptitude: { name: "작전", map: { Front: "도주", Pace: "선행", Late: "선입", End: "추입" } }
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
                slotDiv.dataset.skillName = skill || "";
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
        if (DOM.characterList) DOM.characterList.innerHTML = "";
        if (DOM.resultSummary) {
            DOM.resultSummary.setAttribute('aria-live', 'assertive');
            DOM.resultSummary.innerHTML = message;
        }
    } else {
        if (DOM.resultSummary) {
            DOM.resultSummary.setAttribute('aria-live', 'polite');
        }
    }
};
    
    const renderCharacters = (charactersToRender, isFiltered) => {
        const { characterList, noResultsContainer, resultSummary } = DOM;
        const count = charactersToRender.length;
        
        if (state.observer) state.observer.disconnect();
        characterList.innerHTML = "";
        noResultsContainer.hidden = count > 0;

        if (count === 0) {
            resultSummary.innerHTML = "조건에 맞는 결과가 없습니다.";
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.classList.add('appear');
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.1 });
        state.observer = observer;

        const frag = document.createDocumentFragment();
        for (const char of charactersToRender) {
            const card = createCharacterCard(char);
            frag.appendChild(card);
        }
        characterList.appendChild(frag);

        document.querySelectorAll('.character-card').forEach(card => observer.observe(card));

        if (isFiltered) {
            resultSummary.innerHTML = `${count}명의 결과를 찾았습니다.`;
        } else {
            resultSummary.innerHTML = `총 ${count}명의 캐릭터가 로드되었습니다.`;
        }
    };

    const sortCharacters = (list, order) => {
        const copy = [...list];
        const compareByName = (a, b) => a.name.localeCompare(b.name, 'ko');
        if (!order || order === "name-asc") return copy.sort(compareByName);
        if (order === "name-desc") return copy.sort((a, b) => compareByName(b, a));
        if (order === "id-asc") return copy.sort((a, b) => a.id - b.id);
        if (order === "id-desc") return copy.sort((a, b) => b.id - a.id);
        return copy;
    };

    const getCheckedValues = (selector) => {
        return Array.from(document.querySelectorAll(selector))
            .filter(el => el.checked)
            .map(el => el.value);
    };

    const getNumberValue = (id) => {
        const el = document.getElementById(id);
        return el ? Number(el.value) : 0;
    };

    const gatherFilters = () => {
        const filters = {
            surfaces: getCheckedValues('input[name="surface"]:checked'),
            distances: getCheckedValues('input[name="distance"]:checked'),
            strategies: getCheckedValues('input[name="strategy"]:checked'),
            stats: {
                speed: getNumberValue('min-speed'),
                stamina: getNumberValue('min-stamina'),
                power: getNumberValue('min-power'),
                guts: getNumberValue('min-guts'),
                wit: getNumberValue('min-wit')
            },
            search: DOM.searchBox.value.trim(),
            exclude: document.getElementById('exclude-term').value.trim()
        };
        return filters;
    };

    const updateDisplay = () => {
        const filters = gatherFilters();
        const order = DOM.sortOrder.value;
        state.worker.postMessage({ type: 'filter', payload: { filters, order } });
    };

    const handleKeyboardShortcuts = (e) => {
        if (e.key === 'd' || e.key === 'D') {
            toggleTheme();
        } else if (e.key === 's' || e.key === 'S') {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        } else if (e.key === 't' || e.key === 'T') {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (e.key === 'k' || e.key === 'K') {
            DOM.searchBox.focus();
        }
    };

    const toggleAllSkills = () => {
        const details = document.querySelectorAll('.skill-details');
        let hasOpen = false;
        details.forEach(d => { if (d.open) hasOpen = true; });
        details.forEach(d => d.open = !hasOpen);
    };

    const resetAllFilters = () => {
        DOM.filterForm.reset();
        DOM.searchBox.value = "";
        updateDisplay();
    };

    const openModal = () => {
        if (state.isModalOpen) return;
        state.isModalOpen = true;
        DOM.modalContainer.hidden = false;
        DOM.modalContainer.setAttribute('aria-hidden', 'false');
        DOM.modalOverlay.setAttribute('aria-hidden', 'false');
        history.pushState({ modal: true }, "", "#modal");
        requestAnimationFrame(() => {
            DOM.modalContainer.classList.add('open');
        });
    };

    const closeModal = () => {
        if (!state.isModalOpen) return;
        DOM.modalContainer.classList.remove('open');
        state.isModalOpen = false;
        DOM.modalContainer.setAttribute('aria-hidden', 'true');
        DOM.modalOverlay.setAttribute('aria-hidden', 'true');
        DOM.modalContainer.addEventListener('transitionend', () => {
            DOM.modalContainer.hidden = true;
            if (location.hash === "#modal") {
                 history.back();
            }
        }, { once: true });
    };

    const setupEventListeners = () => {
        const debouncedUpdate = debounce(updateDisplay, DEBOUNCE_DELAY);
        
        DOM.filterForm.addEventListener("input", e => {
            if(e.target.type === 'checkbox' || e.target.type === 'select-one' || e.target.type === 'number') {
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
        
        window.addEventListener('popstate', (event) => {
            if (state.isModalOpen && (!event.state || !event.state.modal)) {
                closeModal();
            }
        });

        DOM.contactEmailLink.addEventListener("click", function (e) {
            e.preventDefault();
            const isRevealed = this.dataset.revealed === "true";
            if (!isRevealed) {
                const user = "easeohyun";
                const domain = "gmail.com";
                const email = `${user}@${domain}`; 
                this.textContent = email;
                this.href = `mailto:${email}`;
                this.dataset.revealed = "true";
            }

            if (confirm(`메일 클라이언트를 열어 '${this.textContent}' 주소로 메일을 보내시겠습니까?`)) {
                window.open(this.href, '_blank');
            }
        });

        document.addEventListener("keydown", handleKeyboardShortcuts);
        window.addEventListener("scroll", debounce(updateScrollButtonsVisibility, 150));
        window.addEventListener("resize", debounce(updateScrollButtonsVisibility, 150));
        
        DOM.filterForm.addEventListener("mousedown", e => {
            if (!e.target.classList.contains("spinner-btn")) return;
            e.preventDefault();

            const wrapper = e.target.closest(".number-input-wrapper");
            if (!wrapper) return;
            const input = wrapper.querySelector('input[type="number"]');
            if (!input) return;

            const changeValue = () => {
                const step = parseFloat(input.step) || 1;
                let value = parseFloat(input.value) || 0;
                if (e.target.classList.contains("btn-minus")) {
                    value -= step;
                } else if (e.target.classList.contains("btn-plus")) {
                    value += step;
                }
                const min = input.min !== "" ? parseFloat(input.min) : -Infinity;
                const max = input.max !== "" ? parseFloat(input.max) : Infinity;
                value = Math.min(Math.max(value, min), max);
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            };

            changeValue();

            clearTimeout(state.longPressTimer);
            clearInterval(state.longPressInterval);
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
        if (DOM.characterList) {
            DOM.characterList.addEventListener('click', (e) => {
                const slot = e.target.closest('.skill-slot');
                if (!slot) return;
                const name = (slot.dataset.skillName || slot.textContent || '').trim();
                const desc = getSkillDescription(name);
                if (!desc) { hideTooltip(); return; }
                showTooltipForSlot(slot, name, desc);
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#skill-tooltip') && !e.target.closest('.skill-slot')) {
                    hideTooltip();
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') hideTooltip();
            });
            window.addEventListener('scroll', () => hideTooltip(), { passive: true });
            window.addEventListener('resize', () => hideTooltip());
        }
    };

    const initWorker = () => {
        return new Promise((resolve, reject) => {
            if (!('Worker' in window)) {
                reject(new Error("Web Workers are not supported in this browser."));
                return;
            }
            const worker = new Worker('./workers/filterWorker.js');
            worker.onmessage = e => {
                const { type, payload } = e.data;
                if (type === 'filtered') {
                    renderCharacters(payload, true);
                }
            };
            worker.onerror = error => {
                console.error(`Web Worker error: ${error.message}`, error);
                setLoadingState(false);
                DOM.resultSummary.innerHTML = `
                    <div style="color:red; text-align:center;">
                        <p><strong>Error:</strong> An error occurred while processing data.</p>
                        <p>Please refresh the page.</p>
                    </div>`;
                reject(error);
            };
            resolve(worker);
        });
    };
    
    const fetchCharacters = async () => {
        const response = await fetch(CHARACTERS_JSON_PATH, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    };

    const initializeApp = async () => {
        const style = document.createElement('style');
        style.textContent = `
            .theme-transition, .theme-transition *, .theme-transition *::before, .theme-transition *::after {
                transition: background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out !important;
            }
        `;
        document.head.appendChild(style);

        setupEventListeners();
        setCheckboxIcons();

        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
        
        setLoadingState(true, "학생 명부를 불러오는 중...");

        try {
            state.worker = await initWorker();
        } catch (error) {
            console.error("Failed to initialize Web Worker:", error);
            setLoadingState(false);
            DOM.resultSummary.innerHTML = `
                <div style="color:var(--color-danger); text-align:center;">
                    <p><strong>오류:</strong> 여기서 꼭 필요한 기능을 불러오지 못했어요.</p>
                    <p>새로고침을 해보세요. 최신 버전의 브라우저, 다른 브라우저를 사용하는 것도 방법이에요.</p>
                </div>`;
            return;
        }

        try {
            const [characters, skillMap] = await Promise.all([fetchCharacters(), fetchSkillDescriptions()]);
            state.allCharacters = characters;
            state.skillDescriptions = skillMap || {};
            state.worker.postMessage({ type: 'init', payload: { characters: state.allCharacters } });
            renderCharacters(state.allCharacters, false);

        } catch (error) {
            console.error("Failed to load character data:", error);
            setLoadingState(false);
            DOM.resultSummary.innerHTML = `
                <div style="color:var(--color-danger); text-align:center;">
                    <p><strong>오류:</strong> 우마무스메 데이터를 불러오지 못했어요.</p>
                    <p>인터넷에 연결이 잘 되었는지 확인하고 새로고침을 부탁드려요!</p>
                </div>`;
        } finally {
            updateScrollButtonsVisibility();
        }
    };
    
    document.addEventListener("DOMContentLoaded", initializeApp);

})();
