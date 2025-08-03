function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function escapeHTML(str) {
    if (str === null || str === undefined) {
        return "";
    }
    const text = String(str);

    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };

    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}

const GRADE_MAP = { S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 };
const NAME_MAPS = {
    SurfaceAptitude: { name: " [ 경기장 적성 ] ", map: { Turf: "잔디", Dirt: "더트" } },
    DistanceAptitude: { name: " [ 거리 적성 ] ", map: { Short: "단거리", Mile: "마일", Medium: "중거리", Long: "장거리" } },
    StrategyAptitude: { name: " [ 각질 적성 ] ", map: { Front: "도주", Pace: "선행", Late: "선입", End: "추입" } },
    StatBonuses: { name: "[ 성장률 ] ", map: { Speed: "스피드", Stamina: "스태미나", Power: "파워", Guts: "근성", Wit: "지능" } },
};
const CHO_SUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const CHARACTERS_JSON_PATH = "./characters.json";

// --- DOM Element Cache ---
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
};

let allCharacters = [];
let observer; //
let worker;

function smartIncludes(target, term) {}

function createCharacterCard(char) {
    const card = DOMElements.cardTemplate.content.cloneNode(true).firstElementChild;
    card.dataset.id = char.id;
    if (char.color) {
        card.style.setProperty("--character-color", char.color);
    }

const cardTitle = card.querySelector(".card-title");
const cardNickname = card.querySelector(".card-nickname");
const cardStats = card.querySelector(".card-stats");
const skillContainer = card.querySelector(".skill-container");
const skillDetails = card.querySelector('.skill-details');
const skillSummary = card.querySelector('.skill-summary');

skillDetails.addEventListener('toggle', () => {
    const isOpen = skillDetails.open;
    skillSummary.setAttribute('aria-expanded', isOpen);
    skillSummary.childNodes[0].nodeValue = isOpen ? ' 스킬 정보 ' : ' 스킬 정보 ';
});

cardNickname.textContent = char.nickname;
cardTitle.textContent = char.name;

cardStats.innerHTML = ''; 


Object.entries(NAME_MAPS).forEach(([sectionKey, { name, map }]) => {

    const categoryLi = document.createElement('li');
    categoryLi.className = 'stat-item stat-category';
    categoryLi.textContent = name; 
    cardStats.appendChild(categoryLi); 

    Object.entries(map).forEach(([itemKey, displayName]) => {
        const value = char[sectionKey]?.[itemKey];
        if (value === undefined) return; 

        const itemLi = document.createElement('li');
        itemLi.className = 'stat-item';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'label';
        labelSpan.textContent = displayName;

        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';

        if (sectionKey === "StatBonuses") {

    const valueTextSpan = document.createElement('span');
    valueTextSpan.textContent = value;

    const percentSpan = document.createElement('span');
    percentSpan.className = 'percent';
    percentSpan.textContent = '%';

    valueSpan.appendChild(valueTextSpan);
    valueSpan.appendChild(percentSpan);
} else {

    const gradeSpan = document.createElement('span');
    gradeSpan.className = `grade-${String(value).toLowerCase()}`;
    gradeSpan.textContent = value;
    valueSpan.appendChild(gradeSpan);
}

        itemLi.appendChild(labelSpan);
        itemLi.appendChild(valueSpan);

        cardStats.appendChild(itemLi);
    });
});

skillContainer.innerHTML = ''; 

const createSkillRowAndAppend = (skills, color, flexClassMap) => {
    
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

    skillContainer.appendChild(rowDiv);
};

createSkillRowAndAppend(char.skills?.rainbow ?? [], "rainbow", { 1: "", 2: "flex-2" });
createSkillRowAndAppend(char.skills?.pink ?? [], "pink", { 2: "flex-2", 3: "flex-3", 4: "flex-4" });
createSkillRowAndAppend(char.skills?.yellow ?? [], "yellow", { 1: "", 2: "flex-2" });
createSkillRowAndAppend(char.skills?.white?.slice(0, 3) ?? [], "white", { 1: "", 2: "flex-2", 3: "flex-3" });
createSkillRowAndAppend(char.skills?.white?.slice(3) ?? [], "white", { 1: "", 2: "flex-2" });

    return card;
}

function setLoadingState(isLoading) {
    const { characterList, resultSummary, skeletonTemplate } = DOMElements;
    characterList.innerHTML = "";
    if (isLoading) {
        resultSummary.setAttribute('aria-live', 'assertive'); // 중요 메시지 즉시 전달
        resultSummary.textContent = "학생 명부를 불러오는 중...";
        // ... 스켈레톤 UI 생성 코드 ...
    } else {
        resultSummary.setAttribute('aria-live', 'polite'); // 일반적인 상태 변경 전달
    }
}

function renderCharacters(charactersToRender, isFiltered) {
    const { characterList, noResultsContainer, resultSummary, skeletonTemplate } = DOMElements;
    const count = charactersToRender.length;
    if (observer) {
        observer.disconnect();
    }

    characterList.innerHTML = ""; 

    if (count === 0 && isFiltered) {
        characterList.style.display = "none";
        noResultsContainer.style.display = "block";
        resultSummary.textContent = "";
        return;
    }

    characterList.style.display = ""; 
    noResultsContainer.style.display = "none";
    
    let summaryText = "";
    if (!isFiltered) {
        summaryText = `트레센 학원에 어서오세요, ${allCharacters.length}명의 우마무스메를 만날 수 있답니다!`;
    } else {
        if (count === 1) summaryText = "당신이 찾던 그 우마무스메가... 딱 1명 있네요! 찾았어요!";
        else if (count > 1 && count <= 5) summaryText = `당신이 찾던 그 우마무스메가... ${count}명 있어요!`;
        else if (count > 5 && count <= 15) summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있을 것 같아요.`;
        else if (count > 15 && count <= 50) summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있는 것 맞죠?`;
        else summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있기를 바랍니다!`;
    }
    resultSummary.textContent = summaryText;

    const createAndObserveCharacter = (entries, obs) => {
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
    };

    observer = new IntersectionObserver(createAndObserveCharacter, {
        root: null, 
        rootMargin: '0px 0px 400px 0px', 
        threshold: 0, 
    });

    const fragment = document.createDocumentFragment();
    charactersToRender.forEach(char => {
        const skeletonCard = skeletonTemplate.content.cloneNode(true).firstElementChild;
        
        skeletonCard.dataset.id = char.id;

        fragment.appendChild(skeletonCard);
        

        observer.observe(skeletonCard);
    });

    characterList.appendChild(fragment);
}

function updateDisplay() {
    // 워커가 초기화되기 전이라면 함수를 종료합니다.
    if (!worker) return;

    // 1. 사용자 입력 값 (필터 조건)을 모두 수집합니다.
    const formData = new FormData(DOMElements.filterForm);
    const activeFilters = Array.from(DOMElements.filterForm.elements)
        .filter((el) => el.type === "checkbox" && el.checked)
        .map((checkbox) => {
            const key = checkbox.name;
            const isStatBonus = !!DOMElements.filterForm.querySelector(`input[name="${key}-value"]`);
            return isStatBonus ? { key, type: "value", value: parseInt(formData.get(`${key}-value`), 10) } : { key, type: "grade", value: GRADE_MAP[formData.get(`${key}-grade`)] };
        });

    const rawSearchTerms = DOMElements.searchBox.value
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean);
    const inclusionTerms = rawSearchTerms.filter((term) => !term.startsWith("-"));
    const exclusionTerms = rawSearchTerms
        .filter((term) => term.startsWith("-"))
        .map((term) => term.substring(1))
        .filter(Boolean);

    const sortBy = DOMElements.sortOrder.value;

    // 처리 중임을 사용자에게 알립니다.
    DOMElements.characterList.innerHTML = ""; // 목록을 비웁니다.
    DOMElements.resultSummary.textContent = "조건에 맞는 우마무스메를 찾고 있습니다...";

    // 2. 수집한 필터 조건을 객체에 담아 워커에게 메시지로 보냅니다.
    worker.postMessage({
        type: 'filter',
        payload: {
            activeFilters,
            searchTerms: { inclusionTerms, exclusionTerms },
            sortBy
        }
    });
}

function resetAllFilters() {
    DOMElements.filterForm.reset();
    DOMElements.searchBox.value = "";
    updateDisplay();
}

function toggleAllSkills() {
    const allDetails = DOMElements.characterList.querySelectorAll(".skill-details");
    if (allDetails.length === 0) return;
    
    const shouldOpen = !allDetails[0].hasAttribute("open");
    allDetails.forEach((detail) => {
        if (shouldOpen) {
            detail.open = true;
        } else {
            detail.open = false;
        }
    });

    const icon = DOMElements.toggleSkillsButton.querySelector(".material-symbols-outlined");
    icon.textContent = shouldOpen ? "unfold_less" : "unfold_more";
    DOMElements.toggleSkillsButton.title = shouldOpen ? "모든 스킬 접기 ([)" : "모든 스킬 펼치기 ([)";
}

function updateScrollButtonsVisibility() {
    const { scrollTopButton, scrollBottomButton } = DOMElements;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    scrollTopButton.classList.toggle("hidden", scrollTop < 200);
    scrollBottomButton.classList.toggle("hidden", scrollTop + windowHeight >= scrollHeight - 20);
}

function handleKeyboardShortcuts(event) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "SELECT")) {
        if (event.key === "Escape") activeElement.blur();
        return;
    }

    switch (event.key) {
        case "/":
            event.preventDefault();
            DOMElements.searchBox.focus();
            break;
        case "Escape":
            resetAllFilters();
            break;
        case ".":
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
            break;
        case ",":
            window.scrollTo({ top: 0, behavior: "smooth" });
            break;
        case "[":
            event.preventDefault();
            toggleAllSkills();
            break;
        case "]":
            event.preventDefault();
            toggleTheme();
            break;
    }
}

function setupDynamicCheckboxColors() {
    const colorMap = {
        Turf: "var(--color-apt-turf)",
        Dirt: "var(--color-apt-dirt)",
        Short: "var(--color-apt-distance)",
        Mile: "var(--color-apt-distance)",
        Medium: "var(--color-apt-distance)",
        Long: "var(--color-apt-distance)",
        Front: "var(--color-apt-strategy)",
        Pace: "var(--color-apt-strategy)",
        Late: "var(--color-apt-strategy)",
        End: "var(--color-apt-strategy)",
        Speed: "var(--color-stat-speed)",
        Stamina: "var(--color-stat-stamina)",
        Power: "var(--color-stat-power)",
        Guts: "var(--color-stat-guts)",
        Wit: "var(--color-stat-wit)",
    };

    DOMElements.filterForm.querySelectorAll(".filter-item").forEach((item) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox && colorMap[checkbox.name]) {
            item.style.setProperty("--checkbox-color", colorMap[checkbox.name]);
        }
    });
}

function applyTheme(theme) {
    const { html, darkModeToggleButton } = DOMElements;
    const icon = darkModeToggleButton.querySelector(".material-symbols-outlined");
    if (theme === "dark") {
        html.dataset.theme = "dark";
        icon.textContent = "light_mode";
        darkModeToggleButton.title = "밝은 테마로 전환 (])";
    } else {
        html.dataset.theme = "light";
        icon.textContent = "dark_mode";
        darkModeToggleButton.title = "어두운 테마로 전환 (])";
    }
}

function toggleTheme() {
    const currentTheme = DOMElements.html.dataset.theme || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme(systemPrefersDark ? "dark" : "light");
    }
}

async function initializeApp() {
    setLoadingState(true);
    initializeTheme();
    setupDynamicCheckboxColors();

    const { filterForm, searchBox, sortOrder, resetFiltersButton, noResultsResetButton, scrollTopButton, scrollBottomButton, toggleSkillsButton, darkModeToggleButton } = DOMElements;

    
    // 1. 웹 워커를 생성합니다.
worker = new Worker('./workers/filterWorker.js');

// 2. 워커 에러 핸들러를 추가합니다.
worker.onerror = (error) => {
    console.error(`Worker error: ${error.message}`, error);
    // 사용자에게 문제가 발생했음을 알립니다.
    DOMElements.resultSummary.textContent = "오류가 발생했습니다. 페이지를 새로고침 해주세요.";
    // 필요하다면, 여기서 워커를 재시작하거나 다른 복구 로직을 수행할 수 있습니다.
};

// 3. 워커로부터 메시지를 받았을 때 처리할 로직을 정의합니다. (기존 코드)
worker.onmessage = (e) => {
        const filteredCharacters = e.data; // 워커가 보낸 처리 결과
        
        // 필터링이 적용되었는지 여부를 판단합니다.
        const isFiltered = (
            Array.from(DOMElements.filterForm.elements).some(el => el.type === "checkbox" && el.checked) || 
            DOMElements.searchBox.value.trim() !== ""
        );

        // 결과를 화면에 렌더링합니다.
        renderCharacters(filteredCharacters, isFiltered);
    };


    // 3. 캐릭터 데이터를 불러와 메인 스레드와 워커 양쪽에 모두 전달합니다.
    try {
        const response = await fetch(CHARACTERS_JSON_PATH);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allCharacters = await response.json();

        // 워커에게 최초 캐릭터 데이터를 보내 초기화시킵니다.
        worker.postMessage({
            type: 'init',
            payload: { characters: allCharacters }
        });

    } catch (error) {
        console.error("캐릭터 데이터를 불러오는 데 실패했습니다:", error);
        // ... (기존 에러 처리 로직) ...
        return;
    }

    // 4. 초기 화면을 렌더링합니다.
    renderCharacters(allCharacters, false); // 처음에는 필터링되지 않은 전체 목록을 보여줍니다.
    updateScrollButtonsVisibility();
    
    const updateHandler = () => window.requestAnimationFrame(updateDisplay);
    const debouncedSearchHandler = debounce(updateHandler, 250);
    filterForm.addEventListener("input", (e) => {
                if (e.target.id !== 'search-box') {
                                updateHandler();
                            }
    });
    searchBox.addEventListener("input", debouncedSearchHandler);
    sortOrder.addEventListener("change", updateHandler);
    resetFiltersButton.addEventListener("click", resetAllFilters);
    noResultsResetButton.addEventListener("click", resetAllFilters);
    scrollTopButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    scrollBottomButton.addEventListener("click", () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }));
    toggleSkillsButton.addEventListener("click", toggleAllSkills);
    darkModeToggleButton.addEventListener("click", toggleTheme);

    window.addEventListener("scroll", updateScrollButtonsVisibility);
    window.addEventListener("resize", updateScrollButtonsVisibility);
    document.addEventListener("keydown", handleKeyboardShortcuts);

    try {
        const response = await fetch(CHARACTERS_JSON_PATH);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allCharacters = await response.json();
    } catch (error) {
        console.error("캐릭터 데이터를 불러오는 데 실패했습니다:", error);
        DOMElements.characterList.innerHTML = `
            <div id="data-error-container" style="text-align:center; color:red; padding: 20px;">
                <p>캐릭터 정보를 불러오지 못했습니다. ${CHARACTERS_JSON_PATH} 파일이 올바른 위치에 있는지 확인해 주세요.</p>
                <p>문제가 지속되면 사이트 관리자에게 요청이 필요합니다. 사이트 관리자의 이메일은 하단을 확인해 주세요.</p>
                <button id="reload-button" class="button button-primary">새로고침</button>
            </div>
        `;
        document.getElementById("reload-button").addEventListener("click", () => location.reload());
        DOMElements.resultSummary.textContent = "오류 발생";
        return;
    }

    updateDisplay();
    updateScrollButtonsVisibility();
    // 서비스 워커 등록 코드
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }
}

initializeApp();
const powerCheckbox = document.getElementById("Power");
if (powerCheckbox) {
    const powerLabel = powerCheckbox.nextElementSibling;

    powerCheckbox.addEventListener("change", function () {
        if (this.checked) {
            const icon = Math.random() < 0.5 ? "Humerus_Alt" : "Ulna_Radius_Alt";
            powerLabel.dataset.icon = icon;
            powerLabel.classList.add("icon-label"); 
        } else {
            delete powerLabel.dataset.icon;
            powerLabel.classList.remove("icon-label"); 
        }
    });
}
function setupRandomIconCheckbox(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;

    const label = checkbox.nextElementSibling;

    checkbox.addEventListener("change", function () {
        if (this.checked) {
            const rand = Math.random();
            let icon;

            if (rand < 0.05) {
                icon = "directions_walk";
            } else if (rand < 0.3) {
                icon = "directions_run";
            } else {
                icon = "sprint";
            }

            label.dataset.icon = icon;
            label.classList.add("icon-label"); 
        } else {
            delete label.dataset.icon;
            label.classList.remove("icon-label"); 
        }
    });
}

const targetCheckboxIds = ["Short", "Mile", "Medium", "Long", "Front", "Pace", "Late", "End"];

targetCheckboxIds.forEach((id) => setupRandomIconCheckbox(id));

document.addEventListener("DOMContentLoaded", () => {
    const emailLink = document.getElementById("contact-email-link");
    if (emailLink) {
        emailLink.addEventListener(
            "click",
            function (e) {
                e.preventDefault();
                if (this.dataset.revealed !== "true") {
                    const user = "easeohyun";
                    const domain = "google.com";
                    const email = `${user}@${domain}`;

                    this.href = `mailto:${email}`;
                    this.textContent = email;
                    this.dataset.revealed = "true";
                }
            },
            { once: false }
        );
    }

    const modalContainer = document.getElementById("contact-modal");
    const openModalBtn = document.getElementById("open-modal-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const modalOverlay = document.querySelector(".modal-overlay");
    let lastFocusedElement;

    /**
     * [UI 제어 함수] 오직 모달을 시각적으로 여는 역할만 담당합니다.
     */
    const openModalUI = () => {
        // 이미 열려있으면 중복 실행 방지
        if (modalContainer.hidden === false) return; 

        lastFocusedElement = document.activeElement;
        modalContainer.removeAttribute("hidden");
        requestAnimationFrame(() => {
            modalContainer.classList.add("active");
        });
        closeModalBtn.focus();
    };

    /**
     * [UI 제어 함수] 오직 모달을 시각적으로 닫는 역할만 담당합니다.
     */
    const closeModalUI = () => {
        // 이미 닫혀있으면 중복 실행 방지
        if (modalContainer.hidden === true) return; 

        modalContainer.classList.remove("active");
        modalContainer.addEventListener("transitionend", function onTransitionEnd() {
            modalContainer.setAttribute("hidden", true);
            modalContainer.removeEventListener("transitionend", onTransitionEnd);
        }, { once: true });

        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    };
    
    /**
     * [상태 변경 감지] URL 해시 변경을 감지하여 UI를 제어하는 핵심 핸들러입니다.
     */
    const handleHashChange = () => {
        if (location.hash === '#modal') {
            openModalUI();
        } else {
            closeModalUI();
        }
    };

    // --- 이벤트 리스너 설정 ---

    // '알려드릴 내용' 버튼 클릭: URL 해시를 추가하여 모달 열기를 요청합니다.
    openModalBtn.addEventListener("click", (e) => {
        e.preventDefault();
        location.hash = 'modal';
    });

    // '닫기(X)' 버튼 클릭: '뒤로 가기'를 실행하여 해시를 제거합니다.
    closeModalBtn.addEventListener("click", (e) => {
        e.preventDefault();
        history.back();
    });

    // 모달 바깥 영역 클릭: '뒤로 가기'를 실행하여 해시를 제거합니다.
    modalOverlay.addEventListener("click", () => {
        history.back();
    });

    // ESC 키 입력 감지: 열려있을 때 '뒤로 가기'를 실행합니다.
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && location.hash === '#modal') {
            history.back();
        }
    });

    // --- 초기화 및 리스너 등록 ---

    // 페이지가 처음 로드될 때 URL에 #modal이 있는지 확인하여 모달을 엽니다.
    // (예: 링크 공유, 새로고침 시 상태 유지)
    handleHashChange();

    // 브라우저의 '뒤로 가기', '앞으로 가기' 동작을 감지합니다.
    window.addEventListener('hashchange', handleHashChange);
});
