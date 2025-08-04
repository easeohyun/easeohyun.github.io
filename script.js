(function () {
    'use strict';

    const GRADE_MAP = Object.freeze({ S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 });
    const CHARACTERS_JSON_PATH = "./characters.json";
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
    };

    const state = {
        allCharacters: [],
        observer: null,
        worker: null,
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

    const createStatGroup = (fragment, sectionKey, char, name, map) => {
        if (!char[sectionKey]) return;

        const categoryLi = document.createElement('li');
        categoryLi.className = 'stat-item stat-category';
        categoryLi.textContent = name;
        fragment.appendChild(categoryLi);

        const isBonus = sectionKey === "StatBonuses";
        for (const [itemKey, displayName] of Object.entries(map)) {
            const value = char[sectionKey]?.[itemKey];
            if (value !== undefined) {
                fragment.appendChild(createStatItem(displayName, value, isBonus));
            }
        }
    };

    const createSkillRow = (skills, color) => {
        if (!skills || skills.length === 0) return null;
        const rowDiv = document.createElement('div');
        rowDiv.className = 'skill-row';
        skills.forEach(skill => {
            const slotDiv = document.createElement('div');
            slotDiv.className = `skill-slot skill-${color}`;
            slotDiv.textContent = skill || "";
            rowDiv.appendChild(slotDiv);
        });
        return rowDiv;
    };

    const createCharacterCard = (char) => {
        const card = DOM.cardTemplate.content.cloneNode(true).firstElementChild;
        card.dataset.id = char.id;
        if (char.color) {
            card.style.setProperty("--character-color", char.color);
        }

        card.querySelector(".card-nickname").textContent = char.nickname;
        card.querySelector(".card-title").textContent = char.name;

        const statsFragment = document.createDocumentFragment();
        const aptitudeMap = {
            SurfaceAptitude: { name: " [ 경기장 적성 ] ", map: { Turf: "잔디", Dirt: "더트" }},
            DistanceAptitude: { name: " [ 거리 적성 ] ", map: { Short: "단거리", Mile: "마일", Medium: "중거리", Long: "장거리" }},
            StrategyAptitude: { name: " [ 각질 적성 ] ", map: { Front: "도주", Pace: "선행", Late: "선입", End: "추입" }},
            StatBonuses: { name: "[ 성장률 ] ", map: { Speed: "스피드", Stamina: "스태미나", Power: "파워", Guts: "근성", Wit: "지능" }}
        };
        for (const [sectionKey, { name, map }] of Object.entries(aptitudeMap)) {
            createStatGroup(statsFragment, sectionKey, char, name, map);
        }
        card.querySelector(".card-stats").appendChild(statsFragment);

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
            DOM.resultSummary.textContent = message;
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
            resultSummary.textContent = "";
            return;
        }

        characterList.style.display = "";
        noResultsContainer.style.display = "none";
        resultSummary.textContent = hasActiveFilters
            ? `총 ${count}명의 우마무스메를 찾았습니다.`
            : `트레센 학원에 어서오세요, ${state.allCharacters.length}명의 우마무스메를 만날 수 있답니다!`;
        
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
                const isStatBonus = DOM.filterForm.querySelector(`input[name="${key}-value"]`);
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
        const windowHeight = window.innerHeight;
        const isAtBottom = scrollTop + windowHeight >= scrollHeight - 20;

        scrollTopButton.classList.toggle("hidden", scrollTop < 200);
        scrollBottomButton.classList.toggle("hidden", isAtBottom);
    };
    
    const handleKeyboardShortcuts = (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        
        const activeElement = document.activeElement;
        const isTyping = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "SELECT" || activeElement.isContentEditable);
        const isModalOpen = !DOM.modalContainer.hidden;

        if (isTyping && event.key !== 'Escape') return;
        if (isModalOpen && event.key !== 'Escape') return;

        const shortcuts = {
            'q': () => DOM.searchBox.focus(),
            '/': () => DOM.searchBox.focus(),
            'r': resetAllFilters,
            'Escape': () => {
                if (isModalOpen) closeModal();
                else if (isTyping) activeElement.blur();
                else resetAllFilters();
            },
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
        
        html.dataset.theme = theme;
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        darkModeToggleButton.title = theme === 'dark' ? '밝은 테마로 전환 (D)' : '어두운 테마로 전환 (D)';
        localStorage.setItem("theme", theme);
    };

    const toggleTheme = () => {
        const newTheme = (DOM.html.dataset.theme || 'light') === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    };
    
    const openModal = () => {
        DOM.modalContainer.hidden = false;
        requestAnimationFrame(() => {
             DOM.modalContainer.classList.add("active");
             DOM.closeModalBtn.focus();
        });
    };
    
    const closeModal = () => {
        DOM.modalContainer.classList.remove("active");
        DOM.modalContainer.addEventListener("transitionend", () => {
            DOM.modalContainer.hidden = true;
        }, { once: true });
    };

    const setupEventListeners = () => {
        const debouncedUpdate = debounce(updateDisplay, DEBOUNCE_DELAY);
        
        DOM.filterForm.addEventListener("input", updateDisplay);
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
        
        DOM.contactEmailLink.addEventListener("click", function(e) {
            e.preventDefault();
            if (this.dataset.revealed !== "true") {
                const user = "easeohyun";
                const domain = "google.com";
                this.href = `mailto:${user}@${domain}`;
                this.textContent = `${user}@${domain}`;
                this.dataset.revealed = "true";
                window.location.href = this.href;
            }
        });

        document.addEventListener("keydown", handleKeyboardShortcuts);
        window.addEventListener("scroll", debounce(updateScrollButtonsVisibility, 150));
        window.addEventListener("resize", debounce(updateScrollButtonsVisibility, 150));
    };

    const initWorker = () => {
        return new Promise((resolve, reject) => {
            const worker = new Worker('./workers/filterWorker.js');
            worker.onmessage = e => {
                const filteredCharacters = e.data;
                renderCharacters(filteredCharacters, true);
            };
            worker.onerror = error => {
                console.error(`Web Worker 오류: ${error.message}`, error);
                setLoadingState(false);
                DOM.resultSummary.innerHTML = `
                    <div style="color:red; text-align:center;">
                        <p><strong>오류:</strong> 데이터 처리 중 오류가 발생했습니다.</p>
                        <p>페이지를 새로고침 해주세요.</p>
                    </div>`;
                reject(error);
            };
            resolve(worker);
        });
    };
    
    const fetchCharacters = async () => {
        const response = await fetch(CHARACTERS_JSON_PATH);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
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
        } catch (error) {
            console.error("Web Worker 초기화에 실패했습니다:", error);
            setLoadingState(false);
            DOM.resultSummary.innerHTML = `
                <div style="color:var(--color-danger); text-align:center;">
                    <p><strong>오류:</strong> 페이지의 핵심 기능을 불러오는 데 실패했습니다.</p>
                    <p>브라우저 호환성을 확인하거나, 페이지를 새로고침 해주세요.</p>
                </div>`;
            return;
        }

        try {
            const characters = await fetchCharacters();
            state.allCharacters = characters;
            
            state.worker.postMessage({ type: 'init', payload: { characters: state.allCharacters } });
            renderCharacters(state.allCharacters, false);

        } catch (error) {
            console.error("캐릭터 정보 로딩에 실패했습니다:", error);
            setLoadingState(false);
            DOM.resultSummary.innerHTML = `
                <div style="color:var(--color-danger); text-align:center;">
                    <p><strong>오류:</strong> 캐릭터 정보를 불러올 수 없습니다.</p>
                    <p>네트워크 연결을 확인하거나, 페이지를 새로고침 해주세요.</p>
                </div>`;
        } finally {
            updateScrollButtonsVisibility();
        }
    };
    
    document.addEventListener("DOMContentLoaded", initializeApp);

})();
