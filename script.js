/**
 * @file Umamusume Character Filter and Search Script
 * @author easeohyun
 * @version 2.0.0
 * @description 캐릭터 데이터를 필터링하고, 검색하며, 정렬하는 기능을 담당하는 메인 스크립트입니다.
 * Web Worker를 사용하여 무거운 연산을 메인 스레드에서 분리하고,
 * Intersection Observer로 지연 로딩을 구현하여 초기 로딩 성능을 최적화했습니다.
 */

// 즉시 실행 함수 표현식(IIFE)을 사용하여 전역 스코프 오염을 방지합니다.
(function () {
    'use strict';

    /** @enum {number} */
    const GRADE_MAP = { S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 };

    /** @const {string} */
    const CHARACTERS_JSON_PATH = "./characters.json";

    // DOM 요소를 한 곳에서 관리하여 코드의 일관성과 유지보수성을 높입니다.
    const DOMElements = {
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

    let allCharacters = [];
    let observer;
    let worker;

    /**
     * 함수를 지정된 시간만큼 지연시켜 실행하는 디바운스 함수입니다.
     * @param {Function} func - 디바운싱할 함수
     * @param {number} delay - 지연 시간 (밀리초)
     * @returns {Function} 디바운싱이 적용된 함수
     */
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * 캐릭터 데이터를 기반으로 동적인 캐릭터 카드를 생성합니다.
     * @param {object} char - 캐릭터 데이터 객체
     * @returns {HTMLElement} 생성된 캐릭터 카드 요소
     */
    function createCharacterCard(char) {
        const card = DOMElements.cardTemplate.content.cloneNode(true).firstElementChild;
        card.dataset.id = char.id;
        if (char.color) {
            card.style.setProperty("--character-color", char.color);
        }

        // 각 DOM 요소에 대한 참조를 한 번만 찾습니다.
        const cardTitle = card.querySelector(".card-title");
        const cardNickname = card.querySelector(".card-nickname");
        const cardStats = card.querySelector(".card-stats");
        const skillContainer = card.querySelector(".skill-container");
        const skillDetails = card.querySelector('.skill-details');
        const skillSummary = card.querySelector('.skill-summary');

        skillDetails.addEventListener('toggle', () => {
             skillSummary.setAttribute('aria-expanded', skillDetails.open);
        });

        cardNickname.textContent = char.nickname;
        cardTitle.textContent = char.name;

        // 적성 및 성장률 정보를 동적으로 생성합니다.
        const statsFragment = document.createDocumentFragment();
        const aptitudeMap = {
            SurfaceAptitude: { name: " [ 경기장 적성 ] ", map: { Turf: "잔디", Dirt: "더트" }},
            DistanceAptitude: { name: " [ 거리 적성 ] ", map: { Short: "단거리", Mile: "마일", Medium: "중거리", Long: "장거리" }},
            StrategyAptitude: { name: " [ 각질 적성 ] ", map: { Front: "도주", Pace: "선행", Late: "선입", End: "추입" }},
            StatBonuses: { name: "[ 성장률 ] ", map: { Speed: "스피드", Stamina: "스태미나", Power: "파워", Guts: "근성", Wit: "지능" }}
        };

        Object.entries(aptitudeMap).forEach(([sectionKey, { name, map }]) => {
            const categoryLi = document.createElement('li');
            categoryLi.className = 'stat-item stat-category';
            categoryLi.textContent = name;
            statsFragment.appendChild(categoryLi);

            Object.entries(map).forEach(([itemKey, displayName]) => {
                const value = char[sectionKey]?.[itemKey];
                if (value === undefined) return;

                const itemLi = document.createElement('li');
                itemLi.className = 'stat-item';
                itemLi.innerHTML = `
                    <span class="label">${displayName}</span>
                    <span class="value">
                        ${sectionKey === "StatBonuses"
                            ? `${value}<span class="percent">%</span>`
                            : `<span class="grade-${String(value).toLowerCase()}">${value}</span>`
                        }
                    </span>`;
                statsFragment.appendChild(itemLi);
            });
        });
        cardStats.appendChild(statsFragment);
        
        // 스킬 정보를 동적으로 생성합니다.
        const skillFragment = document.createDocumentFragment();
        const createSkillRow = (skills, color, flexClassMap) => {
            if (!skills || skills.length === 0) return;
            const rowDiv = document.createElement('div');
            rowDiv.className = 'skill-row';
            const flexClass = flexClassMap[skills.length] || `flex-${skills.length}`;
            skills.forEach(skill => {
                const slotDiv = document.createElement('div');
                slotDiv.className = `skill-slot skill-${color} ${flexClass}`;
                const innerDiv = document.createElement('div');
                innerDiv.textContent = skill || "";
                slotDiv.appendChild(innerDiv);
                rowDiv.appendChild(slotDiv);
            });
            skillFragment.appendChild(rowDiv);
        };

        createSkillRow(char.skills?.rainbow, "rainbow", { 1: "", 2: "flex-2" });
        createSkillRow(char.skills?.pink, "pink", { 2: "flex-2", 3: "flex-3", 4: "flex-4" });
        createSkillRow(char.skills?.yellow, "yellow", { 1: "", 2: "flex-2" });
        createSkillRow(char.skills?.white?.slice(0, 3), "white", { 1: "", 2: "flex-2", 3: "flex-3" });
        createSkillRow(char.skills?.white?.slice(3), "white", { 1: "", 2: "flex-2" });
        skillContainer.appendChild(skillFragment);

        return card;
    }

    /**
     * 로딩 상태에 따라 스켈레톤 UI와 결과 요약을 표시합니다.
     * @param {boolean} isLoading - 로딩 중인지 여부
     */
    function setLoadingState(isLoading) {
        DOMElements.characterList.innerHTML = "";
        if (isLoading) {
            DOMElements.resultSummary.setAttribute('aria-live', 'assertive');
            DOMElements.resultSummary.textContent = "학생 명부를 불러오는 중...";
        } else {
            DOMElements.resultSummary.setAttribute('aria-live', 'polite');
        }
    }

    /**
     * 필터링된 캐릭터 목록을 화면에 렌더링합니다.
     * @param {Array<object>} charactersToRender - 렌더링할 캐릭터 데이터 배열
     * @param {boolean} isFiltered - 필터링이 적용되었는지 여부
     */
    function renderCharacters(charactersToRender, isFiltered) {
        const { characterList, noResultsContainer, resultSummary } = DOMElements;
        const count = charactersToRender.length;
        
        if (observer) observer.disconnect();
        characterList.innerHTML = "";

        if (count === 0 && isFiltered) {
            characterList.style.display = "none";
            noResultsContainer.style.display = "block";
            resultSummary.textContent = "";
            return;
        }

        characterList.style.display = "";
        noResultsContainer.style.display = "none";

        resultSummary.textContent = isFiltered
            ? `총 ${count}명의 우마무스메를 찾았습니다.`
            : `트레센 학원에 어서오세요, ${allCharacters.length}명의 우마무스메를 만날 수 있답니다!`;
        
        // Intersection Observer 설정
        observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skeletonCard = entry.target;
                    const charId = skeletonCard.dataset.id;
                    const characterData = allCharacters.find(c => String(c.id) === charId);
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
            const skeletonCard = DOMElements.skeletonTemplate.content.cloneNode(true).firstElementChild;
            skeletonCard.dataset.id = char.id;
            fragment.appendChild(skeletonCard);
            observer.observe(skeletonCard);
        });

        characterList.appendChild(fragment);
    }

    /**
     * 필터, 검색, 정렬 조건이 변경될 때 화면을 업데이트합니다.
     */
    function updateDisplay() {
        if (!worker) return;

        const formData = new FormData(DOMElements.filterForm);
        const activeFilters = Array.from(DOMElements.filterForm.elements)
            .filter(el => el.type === "checkbox" && el.checked)
            .map(checkbox => {
                const key = checkbox.name;
                const isStatBonus = !!DOMElements.filterForm.querySelector(`input[name="${key}-value"]`);
                return isStatBonus
                    ? { key, type: "value", value: parseInt(formData.get(`${key}-value`), 10) }
                    : { key, type: "grade", value: GRADE_MAP[formData.get(`${key}-grade`)] };
            });

        const rawSearchTerms = DOMElements.searchBox.value.split(",").map(term => term.trim()).filter(Boolean);
        const searchTerms = {
            inclusionTerms: rawSearchTerms.filter(term => !term.startsWith("-")),
            exclusionTerms: rawSearchTerms.filter(term => term.startsWith("-")).map(term => term.substring(1)).filter(Boolean)
        };
        
        const sortBy = DOMElements.sortOrder.value;

        setLoadingState(true);
        DOMElements.resultSummary.textContent = "조건에 맞는 우마무스메를 찾고 있습니다...";

        worker.postMessage({
            type: 'filter',
            payload: { activeFilters, searchTerms, sortBy }
        });
    }

    /**
     * 모든 필터와 검색어를 초기화합니다.
     */
    function resetAllFilters() {
        DOMElements.filterForm.reset();
        DOMElements.searchBox.value = "";
        updateDisplay();
    }
    
    /**
     * 페이지 내 모든 캐릭터 카드의 스킬 정보창을 토글합니다.
     */
    function toggleAllSkills() {
        const allDetails = DOMElements.characterList.querySelectorAll(".skill-details");
        if (allDetails.length === 0) return;

        const shouldOpen = Array.from(allDetails).filter(d => d.open).length <= allDetails.length / 2;
        allDetails.forEach(detail => detail.open = shouldOpen);

        const icon = DOMElements.toggleSkillsButton.querySelector(".material-symbols-outlined");
        icon.textContent = shouldOpen ? "unfold_less" : "unfold_more";
        DOMElements.toggleSkillsButton.title = `모든 스킬 ${shouldOpen ? '접기' : '펼치기'} (A)`;
    }

    /**
     * 스크롤 위치에 따라 상/하단 이동 버튼의 가시성을 조절합니다.
     */
    function updateScrollButtonsVisibility() {
        const { scrollTopButton, scrollBottomButton } = DOMElements;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;

        scrollTopButton.classList.toggle("hidden", scrollTop < 200);
        scrollBottomButton.classList.toggle("hidden", scrollTop + windowHeight >= scrollHeight - 20);
    }
    
    /**
     * 키보드 단축키를 처리합니다.
     * @param {KeyboardEvent} event - 키보드 이벤트 객체
     */
    function handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        
        const isModalActive = !DOMElements.modalContainer.hidden;
        if (isModalActive && event.key !== "Escape") return;
        
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "SELECT")) {
            if (event.key === "Escape") activeElement.blur();
            return;
        }

        const shortcuts = {
            'q': () => DOMElements.searchBox.focus(),
            '/': () => DOMElements.searchBox.focus(),
            'r': () => !isModalActive && resetAllFilters(),
            'Escape': () => !isModalActive && resetAllFilters(),
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
    }
    
    /**
     * 시스템 설정 또는 저장된 설정에 따라 테마를 적용합니다.
     * @param {'light' | 'dark'} theme - 적용할 테마
     */
    function applyTheme(theme) {
        const { html, darkModeToggleButton } = DOMElements;
        const icon = darkModeToggleButton.querySelector(".material-symbols-outlined");
        
        html.dataset.theme = theme;
        icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
        darkModeToggleButton.title = theme === 'dark' ? '밝은 테마로 전환 (D)' : '어두운 테마로 전환 (D)';
    }

    /**
     * 라이트/다크 모드를 토글합니다.
     */
    function toggleTheme() {
        const newTheme = (DOMElements.html.dataset.theme || 'light') === 'light' ? 'dark' : 'light';
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    }

    /**
     * 모든 이벤트 리스너를 초기화하고 등록합니다.
     */
    function setupEventListeners() {
        const {
            filterForm, searchBox, sortOrder, resetFiltersButton, noResultsResetButton,
            scrollTopButton, scrollBottomButton, toggleSkillsButton, darkModeToggleButton,
            openModalBtn, closeModalBtn, modalOverlay, contactEmailLink
        } = DOMElements;
        
        const debouncedUpdate = debounce(updateDisplay, 250);
        filterForm.addEventListener("input", e => {
            if (e.target.type === 'checkbox' || e.target.type === 'select-one' || e.target.type === 'number') {
                updateDisplay();
            }
        });
        searchBox.addEventListener("input", debouncedUpdate);
        sortOrder.addEventListener("change", updateDisplay);

        resetFiltersButton.addEventListener("click", resetAllFilters);
        noResultsResetButton.addEventListener("click", resetAllFilters);

        scrollTopButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        scrollBottomButton.addEventListener("click", () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
        
        toggleSkillsButton.addEventListener("click", toggleAllSkills);
        darkModeToggleButton.addEventListener("click", toggleTheme);

        document.addEventListener("keydown", handleKeyboardShortcuts);
        window.addEventListener("scroll", updateScrollButtonsVisibility);
        window.addEventListener("resize", updateScrollButtonsVisibility);
        
        // Modal 관련 이벤트
        const openModal = () => {
            if (!modalContainer.hidden) return;
            modalContainer.removeAttribute("hidden");
            modalContainer.classList.add("active");
            closeModalBtn.focus();
        };

        const closeModal = () => {
            if (modalContainer.hidden) return;
            modalContainer.classList.remove("active");
            // transition이 끝난 후 hidden 속성을 추가하여 애니메이션을 보장합니다.
            modalContainer.addEventListener("transitionend", () => modalContainer.setAttribute("hidden", true), { once: true });
        };
        
        openModalBtn.addEventListener("click", openModal);
        closeModalBtn.addEventListener("click", closeModal);
        modalOverlay.addEventListener("click", closeModal);
        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && !modalContainer.hidden) closeModal();
        });

        // 이메일 주소 표시
        if (contactEmailLink) {
             contactEmailLink.addEventListener("click", function(e) {
                 e.preventDefault();
                 if (this.dataset.revealed !== "true") {
                     this.href = `mailto:easeohyun@google.com`;
                     this.textContent = `easeohyun@google.com`;
                     this.dataset.revealed = "true";
                 }
             });
        }
    }

    /**
     * 애플리케이션을 초기화하는 메인 함수입니다.
     */
    async function initializeApp() {
        setLoadingState(true);
        
        // 테마 초기화
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

        setupEventListeners();

        // 웹 워커 초기화
        worker = new Worker('./workers/filterWorker.js');
        worker.onmessage = e => {
            const filteredCharacters = e.data;
            const isFiltered = DOMElements.searchBox.value.trim() !== "" || 
                               Array.from(DOMElements.filterForm.elements).some(el => el.type === "checkbox" && el.checked);
            renderCharacters(filteredCharacters, isFiltered);
        };
        worker.onerror = error => {
            console.error(`Web Worker 오류: ${error.message}`, error);
            DOMElements.resultSummary.textContent = "데이터 처리 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.";
        };
        
        // 캐릭터 데이터 로드
        try {
            const response = await fetch(CHARACTERS_JSON_PATH);
            if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            allCharacters = await response.json();

            worker.postMessage({ type: 'init', payload: { characters: allCharacters } });
            renderCharacters(allCharacters, false);
            
        } catch (error) {
            console.error("캐릭터 데이터를 불러오는 데 실패했습니다:", error);
            DOMElements.resultSummary.innerHTML = `
                <div style="color:red; text-align:center;">
                    <p><strong>오류:</strong> 캐릭터 정보를 불러올 수 없습니다.</p>
                    <p>네트워크 연결을 확인하거나, 관리자에게 문의하세요.</p>
                </div>`;
        }
        
        updateScrollButtonsVisibility();
        
        // 서비스 워커 등록
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('서비스 워커가 성공적으로 등록되었습니다. Scope:', reg.scope))
                    .catch(err => console.error('서비스 워커 등록에 실패했습니다:', err));
            });
        }
    }
    
    // DOM이 준비되면 앱을 실행합니다.
    document.addEventListener("DOMContentLoaded", initializeApp);

})();
