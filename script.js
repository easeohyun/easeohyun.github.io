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

function smartIncludes(target, term) {
    const targetStr = String(target || "").toLowerCase();
    const termStr = String(term || "").toLowerCase();
    if (!termStr) return true;

    const sanitize = (str) => str.replace(/[\s\-!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~♪☆・！？—ﾟ∀]/g, "");
    const sanitizedTerm = sanitize(termStr);
    const sanitizedTarget = sanitize(targetStr);

    if (!sanitizedTerm) return true;
    if (sanitizedTarget.includes(sanitizedTerm)) return true;

    const isTermAllChosung = [...sanitizedTerm].every((char) => CHO_SUNG.includes(char));

    if (isTermAllChosung) {
        const getChosung = (char) => {
            const code = char.charCodeAt(0) - 44032;
            return code >= 0 && code <= 11171 ? CHO_SUNG[Math.floor(code / 588)] : char;
        };
        const targetChosung = [...sanitizedTarget].map(getChosung).join("");
        if (targetChosung.includes(sanitizedTerm)) return true;
    }
    return false;
}

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
        skillSummary.firstChild.textContent = isOpen ? '스킬 정보 닫기' : '스킬 정보 보기'; 
    });
    cardNickname.textContent = char.nickname;
    cardTitle.textContent = char.name;

    const statsHTML = Object.entries(NAME_MAPS)
        .map(([sectionKey, { name, map }]) => {
            const items = Object.entries(map)
                .map(([itemKey, displayName]) => {
                    const value = char[sectionKey]?.[itemKey];
                    if (value === undefined) return "";
                    const displayValue = sectionKey === "StatBonuses" ? `<span>${value}</span><span class="percent">%</span>` : `<span class="grade-${value.toLowerCase()}">${value}</span>`;
                    return `<li class="stat-item"><span class="label">${displayName}</span><span class="value">${displayValue}</span></li>`;
                })
                .join("");
            return `<li class="stat-item stat-category">${name}</li>${items}`;
        })
        .join("");
    cardStats.innerHTML = statsHTML;

    const createSkillRow = (skills, color, flexClassMap) => {
        if (!skills || skills.length === 0) return "";
        const flexClass = flexClassMap[skills.length] || `flex-${skills.length}`;
        const slots = skills.map((skill) => `<div class="skill-slot skill-${color} ${flexClass}"><div>${skill || ""}</div></div>`).join("");
        return `<div class="skill-row">${slots}</div>`;
    };
    skillContainer.innerHTML = [
        createSkillRow(char.skills.rainbow, "rainbow", { 1: "", 2: "flex-2" }),
        createSkillRow(char.skills.pink, "pink", { 2: "flex-2", 3: "flex-3", 4: "flex-4" }),
        createSkillRow(char.skills.yellow, "yellow", { 1: "", 2: "flex-2" }),
        createSkillRow(char.skills.white?.slice(0, 3), "white", { 1: "", 2: "flex-2", 3: "flex-3" }),
        createSkillRow(char.skills.white?.slice(3), "white", { 1: "", 2: "flex-2" }),
    ].join("");

    return card;
}

function setLoadingState(isLoading) {
    DOMElements.characterList.innerHTML = "";
    if (isLoading) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 9; i++) {
            fragment.appendChild(DOMElements.skeletonTemplate.content.cloneNode(true));
        }
        DOMElements.characterList.appendChild(fragment);
        DOMElements.resultSummary.textContent = "학생 명부를 불러오는 중...";
    }
}

function renderCharacters(charactersToRender, isFiltered) {
    const { characterList, noResultsContainer, resultSummary } = DOMElements;
    const count = charactersToRender.length;

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

    const fragment = document.createDocumentFragment();
    charactersToRender.forEach((char) => fragment.appendChild(createCharacterCard(char)));
    characterList.appendChild(fragment);
}

function updateDisplay() {
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

    const isFiltered = activeFilters.length > 0 || rawSearchTerms.length > 0;

    const filteredCharacters = allCharacters.filter((character) => {
        const passesFilters = activeFilters.every((filter) => {
            for (const sectionName in NAME_MAPS) {
                if (character[sectionName] && character[sectionName][filter.key] !== undefined) {
                    return filter.type === "value" ? character[sectionName][filter.key] >= filter.value : GRADE_MAP[character[sectionName][filter.key]] >= filter.value;
                }
            }
            return false;
        });
        if (!passesFilters) return false;

        if (rawSearchTerms.length > 0) {
            const allSkills = Object.values(character.skills).flat().filter(Boolean);
            const searchTargets = [String(character.id), character.name, character.nickname, ...allSkills, ...character.tags];

            const passesInclusion = inclusionTerms.every((term) => searchTargets.some((target) => smartIncludes(target, term)));
            if (!passesInclusion) return false;

            const passesExclusion = !exclusionTerms.some((term) => searchTargets.some((target) => smartIncludes(target, term)));
            if (!passesExclusion) return false;
        }

        return true;
    });

    const sortBy = DOMElements.sortOrder.value;
    filteredCharacters.sort((a, b) => {
        switch (sortBy) {
            case "name-asc":
                return a.name.localeCompare(b.name, "ko") || a.id - b.id;
            case "name-desc":
                return b.name.localeCompare(a.name, "ko") || a.id - b.id;
            case "id-asc":
                return a.id - b.id;
            case "id-desc":
                return b.id - a.id;
            default:
                return 0;
        }
    });

    renderCharacters(filteredCharacters, isFiltered);
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
    icon.textContent = shouldOpen ? "visibility_off" : "visibility";
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

const debouncedUpdateHandler = debounce(() => window.requestAnimationFrame(updateDisplay), 300);
    filterForm.addEventListener("input", debouncedUpdateHandler); 
    searchBox.addEventListener("input", debouncedUpdateHandler); 
    sortOrder.addEventListener("change", updateDisplay); 
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
                <p>문제가 지속되면 사이트 관리자에게 문의하여 주십시오.</p>
                <button id="reload-button" class="button button-primary">새로고침</button>
            </div>
        `;
        document.getElementById("reload-button").addEventListener("click", () => location.reload());
        DOMElements.resultSummary.textContent = "오류 발생";
        return;
    }

    updateDisplay();
    updateScrollButtonsVisibility();
}

initializeApp();
const powerCheckbox = document.getElementById("Power");
if (powerCheckbox) {
    const powerLabel = powerCheckbox.nextElementSibling;

    powerCheckbox.addEventListener("change", function () {
        if (this.checked) {
            const icon = Math.random() < 0.5 ? "Humerus_Alt" : "Ulna_Radius_Alt";
            powerLabel.dataset.icon = icon;
        } else {
            delete powerLabel.dataset.icon;
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
        } else {
            delete label.dataset.icon;
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

    const openModalBtn = document.getElementById("open-modal-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");
    const modalContainer = document.getElementById("contact-modal");
    const modalOverlay = document.querySelector(".modal-overlay");

    const mainContent = document.querySelector('main');
    const footerContent = document.querySelector('footer');

    let lastFocusedElement;

    const openModal = (e) => {
        lastFocusedElement = document.activeElement;
        
        mainContent.inert = true;
        footerContent.inert = true;

        modalContainer.removeAttribute("hidden");
        requestAnimationFrame(() => {
            modalContainer.classList.add("active");
        });
        closeModalBtn.focus();
    };

    const closeModal = () => {
        modalContainer.classList.remove("active");

        mainContent.inert = false;
        footerContent.inert = false;

        modalContainer.addEventListener(
            "transitionend",
            function onTransitionEnd() {
                modalContainer.setAttribute("hidden", true);
                modalContainer.removeEventListener("transitionend", onTransitionEnd);
            },
            { once: true }
        );

        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    };

    openModalBtn.addEventListener("click", openModal);
    closeModalBtn.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalContainer.classList.contains("active")) {
            closeModal();
        }
    });
});
