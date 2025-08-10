(function () {
    'use strict';

    const GRADE_MAP = Object.freeze({ S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 });
    const CHARACTERS_JSON_PATH = "./characters.json";
    const SKILL_DESCRIPTIONS_PATH = "./skill-descriptions.json";
    const DEBOUNCE_DELAY = 250;
    const SANITIZE_REGEX = /[\s\-!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~♪☆・！？—ﾟ∀]/g;

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
        activeTooltip: {
            element: null,
            target: null,
        },
    };

    const normalizeSkillName = (name) => {
        if (typeof name !== 'string') return '';
        return name.toLowerCase().replace(SANITIZE_REGEX, '');
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
        const li = document.createElement('li');
        li.className = 'stat-item';
        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = displayName;
        const valueEl = document.createElement('span');
        valueEl.className = 'value';

        if (isBonus) {
            valueEl.innerHTML = `${value}<span class="percent">%</span>`;
        } else {
            valueEl.className += ` grade-${String(value).toLowerCase()}`;
            valueEl.textContent = value;
        }

        li.append(label, valueEl);
        return li;
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
        const ul = document.createElement('ul');
ul.className = 'stat-items-list';
ul.append(...items);
        
        groupDiv.append(titleDiv, ul);
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
        statsContainer.innerHTML = '';
        
        const aptitudeMap = {
            SurfaceAptitude: { name: "경기장 적성", map: { Turf: "잔디", Dirt: "더트" }},
            DistanceAptitude: { name: "거리 적성", map: { Short: "단거리", Mile: "마일", Medium: "중거리", Long: "장거리" }},
            StrategyAptitude: { name: "각질 적성", map: { Front: "도주", Pace: "선행", Late: "선입", End: "추입" }},
        };
        const bonusMap = {
            StatBonuses: { name: "성장률", map: { Speed: "스피드", Stamina: "스태미나", Power: "파워", Guts: "근성", Wit: "지능" }, isBonus: true }
        };
        
        const statGroups = [
            ...Object.entries(aptitudeMap).map(([sectionKey, { name, map }]) => createStatGroup(char, sectionKey, name, map)),
            ...Object.entries(bonusMap).map(([sectionKey, { name, map, isBonus }]) => createStatGroup(char, sectionKey, name, map, isBonus))
        ].filter(Boolean);
        
        statsContainer.append(...statGroups);
        
        const createSkillRow = (skills, color) => {
            if (!skills || skills.length === 0) return '';
            const row = document.createElement('div');
            row.className = 'skill-row';
            skills.forEach(skill => {
                if (!skill) return;
                const slot = document.createElement('div');
                slot.className = `skill-slot skill-interactive skill-${color}`;
                slot.setAttribute('role', 'button');
                slot.setAttribute('tabindex', '0');
                slot.textContent = skill;
                row.appendChild(slot);
            });
            return row;
        };
        
        const skillContainer = card.querySelector(".skill-container");
        skillContainer.innerHTML = '';
        const skillsMap = {
            rainbow: char.skills?.rainbow,
            pink: char.skills?.pink,
            yellow: char.skills?.yellow,
            white: char.skills?.white,
        };

        const skillRows = Object.entries(skillsMap)
            .map(([color, skills]) => createSkillRow(skills, color))
            .filter(Boolean);
        
        skillContainer.append(...skillRows);
        
        const skillDetails = card.querySelector('.skill-details');
        const skillSummary = card.querySelector('.skill-summary');
        
        skillDetails.addEventListener('toggle', () => {
             skillSummary.setAttribute('aria-expanded', skillDetails.open);
        });

        return card;
    };

    const setLoadingState = (isLoading, message = "") => {
        DOM.characterList.innerHTML = "";
        DOM.resultSummary.setAttribute('aria-live', isLoading ? 'assertive' : 'polite');
        DOM.resultSummary.innerHTML = isLoading ? message : DOM.resultSummary.innerHTML;
    };
    
    const renderCharacters = (charactersToRender) => {
        const { characterList, noResultsContainer, resultSummary } = DOM;
        const count = charactersToRender.length;
        
        if (state.observer) state.observer.disconnect();
        characterList.innerHTML = "";

        const hasActiveFilters = DOM.searchBox.value.trim() !== "" || Array.from(DOM.filterForm.elements).some(el => el.type === "checkbox" && el.checked);
        
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
             const messages = {
                1: [
                    "당신이 찾던 그 우마무스메가... 딱 <strong>1명</strong> 있었어요!",
                    "앞으로 3년을 함께할 우마무스메를 <strong>1명</strong> 찾았어요.",
                    "지금 이 <strong>1명</strong>과 만남은 운명, 꿈은 목표."
                ],
                few: [
                    `당신이 찾던 그 우마무스메는... <strong>${count}</strong>명 중에 있을 거예요.`,
                    `<strong>${count}</strong>명의 우마무스메를 찾았어요. 어떤 옷을 입히고 싶으신가요?`,
                    `<strong>${count}</strong>명의 우마무스메 중에서, 결정이 필요할 거예요.`
                ],
                some: [
                    `당신이 찾던 그 우마무스메는... <strong>${count}</strong>명 중에 있을 것 같아요.`,
                    `<strong>${count}</strong>명의 우마무스메를 찾았어요. 아직은 좀 많죠?`,
                    `<strong>${count}</strong>명의 우마무스메 중에서, 간추릴 필요가 있어요.`
                ],
                many: [
                    `당신이 찾는 그 우마무스메는... <strong>${count}</strong>명 중에 있는 것 맞죠?`,
                    `<strong>${count}</strong>명의 우마무스메를 찾았는데요, 더 둘러봐야 해요.`,
                    `<strong>${count}</strong>명의 우마무스메 중에서, 대체 어디있을까요?`
                ],
                lots: [
                    `당신이 찾는 그 우마무스메가... <strong>${count}</strong>명 중에 있기를 바랍니다!`,
                    `<strong>${count}</strong>명의 우마무스메를 찾았는데요, 이제 시작이에요.`,
                    `<strong>${count}</strong>명의 우마무스메 중에서, 이제 찾아볼까요?`
                ]
            };
            const category = count === 1 ? '1' : count <= 5 ? 'few' : count <= 15 ? 'some' : count <= 50 ? 'many' : 'lots';
            summaryText = getRandomMessage(messages[category]);
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
                const isStatBonus = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit'].includes(el.id);
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
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        const isAtBottom = scrollTop + windowHeight >= scrollHeight - 20;

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
        const { html, darkModeToggleButton } = DOM;
        const icon = darkModeToggleButton.querySelector(".material-symbols-outlined");
        
        clearTimeout(state.themeTransitionTimeout);
        html.classList.add('theme-transition');
        html.dataset.theme = theme;
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        darkModeToggleButton.title = theme === 'dark' ? '밝은 테마로 전환 (D)' : '어두운 테마로 전환 (D)';
        localStorage.setItem("theme", theme);
        
        state.themeTransitionTimeout = setTimeout(() => {
            html.classList.remove('theme-transition');
        }, 150);
    };

    const toggleTheme = () => {
        const newTheme = (DOM.html.dataset.theme || 'light') === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    };
    
    const openModal = () => {
        if (state.isModalOpen) return;
        state.isModalOpen = true;
        
        if (history.state?.modal !== true) {
            history.pushState({ modal: true }, '', '#modal');
        }
        
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
        }, { once: true });
        
        if (history.state?.modal === true) {
             history.back();
        }
    };

    const hideTooltip = () => {
        if (state.activeTooltip.element) {
            state.activeTooltip.element.remove();
            state.activeTooltip.element = null;
            state.activeTooltip.target = null;
        }
    };

    const showTooltip = (target) => {
        hideTooltip();

        const skillName = target.textContent.trim();
        const normalizedSkillName = normalizeSkillName(skillName);
        const skillDescription = state.skillDescriptions[normalizedSkillName];
        
        const card = target.closest('.character-card');
        const characterColor = card ? card.style.getPropertyValue('--character-color') : 'var(--color-primary)';

        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        tooltip.textContent = skillDescription || "스킬 정보를 찾을 수 없어요.";
        tooltip.style.setProperty('--character-color', characterColor);
        
        state.activeTooltip.element = tooltip;
        state.activeTooltip.target = target;
        DOM.body.appendChild(tooltip);

        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = targetRect.bottom + window.scrollY + 8;
        let left = targetRect.left + window.scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);

        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) left = window.innerWidth - tooltipRect.width - 8;
        if (top + tooltipRect.height > window.innerHeight + window.scrollY && targetRect.top > tooltipRect.height) {
            top = targetRect.top + window.scrollY - tooltipRect.height - 8;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.opacity = 1;
    };

    const setupEventListeners = () => {
        const debouncedUpdate = debounce(updateDisplay, DEBOUNCE_DELAY);
        DOM.filterForm.addEventListener("input", e => {
            if (e.target.matches('input[type="checkbox"], select, input[type="number"]')) {
                debouncedUpdate();
            }
        });
        DOM.searchBox.addEventListener("input", debouncedUpdate);
        DOM.sortOrder.addEventListener("change", updateDisplay);
        DOM.resetFiltersButton.addEventListener("click", resetAllFilters);
        DOM.noResultsResetButton.addEventListener("click", resetAllFilters);

        DOM.scrollTopButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        DOM.scrollBottomButton.addEventListener("click", () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
        
        const debouncedScrollHandler = debounce(() => {
            updateScrollButtonsVisibility();
            hideTooltip();
        }, 150);
        window.addEventListener("scroll", debouncedScrollHandler);
        window.addEventListener("resize", debouncedScrollHandler);

        DOM.openModalBtn.addEventListener("click", openModal);
        DOM.closeModalBtn.addEventListener("click", closeModal);
        DOM.modalOverlay.addEventListener("click", closeModal);
        window.addEventListener('popstate', (event) => {
            if (state.isModalOpen && !event.state?.modal) closeModal();
        });
        DOM.contactEmailLink.addEventListener("click", function(e) {
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
        
        DOM.characterList.addEventListener('mouseover', e => {
            const target = e.target.closest('.skill-interactive');
            if (target) showTooltip(target);
        });
        DOM.characterList.addEventListener('mouseout', e => {
            if (e.target.closest('.skill-interactive')) hideTooltip();
        });
        DOM.characterList.addEventListener('click', e => {
            const target = e.target.closest('.skill-interactive');
            if (target) {
                (state.activeTooltip.target === target) ? hideTooltip() : showTooltip(target);
            } else if (!e.target.closest('.skill-tooltip')) {
                hideTooltip();
            }
        });
        DOM.characterList.addEventListener('keydown', e => {
            const target = e.target.closest('.skill-interactive');
            if (target && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                (state.activeTooltip.target === target) ? hideTooltip() : showTooltip(target);
            }
        });
        
        DOM.toggleSkillsButton.addEventListener("click", toggleAllSkills);
        DOM.darkModeToggleButton.addEventListener("click", toggleTheme);
        document.addEventListener("keydown", handleKeyboardShortcuts);
        
        const stopLongPress = () => {
            clearTimeout(state.longPressTimer);
            clearInterval(state.longPressInterval);
        };
        const handleSpinner = (e) => {
            const btn = e.target.closest(".spinner-btn");
            if (!btn) return;
            
            e.preventDefault();
            const wrapper = btn.closest(".number-input-wrapper");
            const input = wrapper?.querySelector('input[type="number"]');
            if (!input) return;

            const changeValue = () => {
                const step = parseFloat(input.step) || 1;
                let value = parseFloat(input.value) || 0;
                const min = parseFloat(input.min);
                const max = parseFloat(input.max);
                
                if (btn.classList.contains("up")) value = Math.min(max, value + step);
                else if (btn.classList.contains("down")) value = Math.max(min, value - step);
                
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            };
            changeValue();
            state.longPressTimer = setTimeout(() => {
                state.longPressInterval = setInterval(changeValue, 100);
            }, 500);
        }

        DOM.filterForm.addEventListener("mousedown", handleSpinner);
        document.addEventListener("mouseup", stopLongPress);
        document.addEventListener("mouseleave", stopLongPress);
    };
    
    const initWorker = () => {
        return new Promise((resolve, reject) => {
            if (!('Worker' in window)) {
                return reject(new Error("Web Workers are not supported in this browser."));
            }
            const worker = new Worker('./workers/filterWorker.js');
            worker.onmessage = e => {
                if (e.data.type === 'filtered') renderCharacters(e.data.payload);
            };
            worker.onerror = error => {
                console.error(`Web Worker error: ${error.message}`, error);
                setLoadingState(false);
                DOM.resultSummary.innerHTML = `<div class="error-message"><p><strong>Error:</strong> 데이터 처리 중 오류가 발생했어요.</p><p>페이지를 새로고침 해주세요.</p></div>`;
                reject(error);
            };
            resolve(worker);
        });
    };
    
    const fetchData = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText} for ${url}`);
        }
        return await response.json();
    };

    const initializeApp = async () => {
        setupEventListeners();

        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
        
        setLoadingState(true, "학생 명부를 불러오는 중...");

        try {
            state.worker = await initWorker();
            
            const [characters, rawDescriptions] = await Promise.all([
                fetchData(CHARACTERS_JSON_PATH),
                fetchData(SKILL_DESCRIPTIONS_PATH).catch(err => {
                    console.warn("스킬 설명 데이터를 불러오지 못했어요. 툴팁 기능이 비활성화할게요.", err);
                    return {};
                })
            ]);

            state.allCharacters = characters;
            state.worker.postMessage({ type: 'init', payload: { characters: state.allCharacters } });
            
            state.skillDescriptions = Object.fromEntries(
                Object.entries(rawDescriptions).map(([key, value]) => [normalizeSkillName(key), value])
            );

            renderCharacters(state.allCharacters);

        } catch (error) {
            console.error("Failed to load critical data:", error);
            setLoadingState(false);
            DOM.resultSummary.innerHTML = `<div class="error-message"><p><strong>오류:</strong> 우마무스메 데이터를 불러오지 못했어요.</p><p>인터넷 연결을 확인하고 새로고침을 부탁드려요!</p></div>`;
        } finally {
            updateScrollButtonsVisibility();
        }
    };
    
    const registerServiceWorker = () => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed: ', error);
                    });
            });
        }
    };

    document.addEventListener("DOMContentLoaded", initializeApp);
    registerServiceWorker();

})();
