(function() {
  'use strict';

  // --- Constants and Global State ---
  const gradeMap = { 'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1, 'G': 0 };
  const nameMaps = {
    SurfaceAptitude: { name: '??? ??', map: { Turf: '??', Dirt: '??' } },
    DistanceAptitude: { name: '?? ??', map: { Short: '???', Mile: '??', Medium: '???', Long: '???' } },
    StrategyAptitude: { name: '?? ??', map: { Front: '??', Pace: '??', Late: '??', End: '??' } },
    StatBonuses: { name: '???', map: { Speed: '???', Stamina: '????', Power: '??', Guts: '??', Wit: '??' } }
  };
  let allCharacters = [];

  // --- DOM Element Cache ---
  const DOMElements = {
    filterForm: document.getElementById('filter-form'),
    characterList: document.getElementById('character-list'),
    resultSummary: document.getElementById('result-summary'),
    sortOrder: document.getElementById('sort-order'),
    searchBox: document.getElementById('search-box'),
    resetFiltersButton: document.getElementById('reset-filters'),
    noResultsContainer: document.getElementById('no-results'),
    noResultsResetButton: document.getElementById('no-results-reset'),
    scrollTopButton: document.getElementById('scroll-top'),
    scrollBottomButton: document.getElementById('scroll-bottom'),
    toggleSkillsButton: document.getElementById('toggle-skills-btn'),
  };

  /**
   * Enhanced search function with Korean initialism (Chosung) support.
   * @param {string} target The string to search within.
   * @param {string} term The search term.
   * @returns {boolean} True if the term is found, false otherwise.
   */
  function smartIncludes(target, term) {
    const targetStr = String(target || '').toLowerCase();
    const termStr = String(term || '').toLowerCase();
    if (!termStr) return true;

    const sanitize = (str) => str.replace(/[\s\-!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~??·!?—??]/g, "");
    const sanitizedTerm = sanitize(termStr);
    const sanitizedTarget = sanitize(targetStr);
    
    if (!sanitizedTerm) return true;
    if (sanitizedTarget.includes(sanitizedTerm)) return true;

    const CHO = "???????????????????";
    const isTermAllChosung = [...sanitizedTerm].every(char => CHO.includes(char));
    
    if (isTermAllChosung) {
      const getChosung = (char) => {
        const code = char.charCodeAt(0) - 44032;
        return (code >= 0 && code <= 11171) ? CHO[Math.floor(code / 588)] : char;
      };
      const targetChosung = [...sanitizedTarget].map(getChosung).join('');
      if (targetChosung.includes(sanitizedTerm)) return true;
    }
    return false;
  }

  /**
   * Creates and returns a DOM element for a single character card.
   * This approach is more performant and maintainable than using innerHTML.
   * @param {object} char The character data object.
   * @returns {HTMLElement} The character card element.
   */
  function createCharacterCard(char) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.dataset.id = char.id;
    if (char.color) {
      card.style.setProperty('--character-color', char.color);
    }
    
    // --- Determine Title Background ---
    const isTurfBPlus = gradeMap[char.SurfaceAptitude.Turf] >= gradeMap['B'];
    const isDirtBPlus = gradeMap[char.SurfaceAptitude.Dirt] >= gradeMap['B'];
    let titleBgClass = '';
    if (isTurfBPlus && isDirtBPlus) {
      titleBgClass = 'title-hybrid-bg';
    } else if (isTurfBPlus || (!isDirtBPlus && gradeMap[char.SurfaceAptitude.Turf] > gradeMap[char.SurfaceAptitude.Dirt])) {
      titleBgClass = `title-turf-${char.SurfaceAptitude.Turf.toLowerCase()}`;
    } else {
      titleBgClass = `title-dirt-${char.SurfaceAptitude.Dirt.toLowerCase()}`;
    }

    // --- Build Stats List ---
    const statsList = Object.entries(nameMaps).map(([sectionKey, { name, map }]) => {
      const items = Object.entries(map).map(([itemKey, displayName]) => {
        const value = char[sectionKey]?.[itemKey];
        if (value === undefined) return '';
        const displayValue = sectionKey === 'StatBonuses'
          ? `<span>${value}</span><span class="percent">%</span>`
          : `<span class="grade-${value.toLowerCase()}">${value}</span>`;
        return `<li class="stat-item"><span class="label">${displayName}</span><span class="value">${displayValue}</span></li>`;
      }).join('');
      return `<li class="stat-item stat-category">${name}</li>${items}`;
    }).join('');

    // --- Build Skills HTML ---
    const createSkillRow = (skills, color, flexClassMap) => {
      if (!skills || skills.length === 0) return '';
      const flexClass = flexClassMap[skills.length] || `flex-${skills.length}`;
      const slots = skills.map(skill => `<div class="skill-slot skill-${color} ${flexClass}">${skill || ''}</div>`).join('');
      return `<div class="skill-row">${slots}</div>`;
    };
    
    const skillHTML = [
      createSkillRow(char.skills.rainbow, 'rainbow', { 1: '', 2: 'flex-2'}),
      createSkillRow(char.skills.pink, 'pink', { 2: 'flex-2', 3: 'flex-3', 4: 'flex-4'}),
      createSkillRow(char.skills.yellow, 'yellow', { 1: '', 2: 'flex-2'}),
      createSkillRow(char.skills.white?.slice(0, 3), 'white', { 1: '', 2: 'flex-2', 3: 'flex-3'}),
      createSkillRow(char.skills.white?.slice(3), 'white', { 1: '', 2: 'flex-2'})
    ].join('');
    
    // --- Assemble Card ---
    card.innerHTML = `
      <div class="card-main-info">
          <div class="card-identity">
            <div class="card-nickname">${char.nickname}</div>
            <div class="card-title ${titleBgClass}">${char.name}</div>
          </div>
          <ul class="card-stats">${statsList}</ul>
      </div>
      <details class="skill-details">
        <summary class="skill-summary">?? ??</summary>
        <div class="skill-container">${skillHTML}</div>
      </details>`;
      
    return card;
  }
  
  /**
   * Renders the character cards to the list.
   * @param {Array<object>} charactersToRender The array of characters to display.
   * @param {boolean} isFiltered Indicates if filters are active.
   */
  function renderCharacters(charactersToRender, isFiltered) {
    const { characterList, noResultsContainer, resultSummary } = DOMElements;
    const count = charactersToRender.length;
    
    characterList.innerHTML = ''; // Clear previous results

    if (count === 0 && isFiltered) {
      characterList.style.display = 'none';
      noResultsContainer.style.display = 'block';
      resultSummary.textContent = '';
      return;
    }
    
    characterList.style.display = '';
    noResultsContainer.style.display = 'none';
    
    let summaryText = '';
    if (!isFiltered) {
      summaryText = `??? ??? ?????, ${count}?? ?????? ?? ? ????!`;
    } else {
        if (count === 1) summaryText = "??? ?? ? ??????... ? 1? ???! ????!";
        else if (count <= 5) summaryText = `??? ?? ? ??????... ${count}? ???!`;
        else if (count <= 15) summaryText = `??? ?? ? ??????... ${count}? ?? ?? ? ???.`;
        else if (count <= 50) summaryText = `??? ?? ? ??????... ${count}? ?? ?? ? ???`;
        else summaryText = `??? ?? ? ??????... ${count}? ?? ??? ????!`;
    }
    resultSummary.textContent = summaryText;

    const fragment = document.createDocumentFragment();
    charactersToRender.forEach(char => fragment.appendChild(createCharacterCard(char)));
    characterList.appendChild(fragment);
  }

  /**
   * Main function to filter, sort, and render characters based on user input.
   */
  function updateDisplay() {
    const { filterForm, searchBox, sortOrder } = DOMElements;
    const formData = new FormData(filterForm);

    // 1. Get filter criteria
    const activeFilters = Array.from(filterForm.elements)
      .filter(el => el.type === 'checkbox' && el.checked)
      .map(checkbox => {
        const key = checkbox.name;
        const isStatBonus = !!filterForm.querySelector(`input[name="${key}-value"]`);
        return isStatBonus
          ? { key, type: 'value', value: parseInt(formData.get(`${key}-value`), 10) }
          : { key, type: 'grade', value: gradeMap[formData.get(`${key}-grade`)] };
      });
      
    // 2. Get search terms
    const rawSearchTerms = searchBox.value.split(',').map(term => term.trim()).filter(Boolean);
    const inclusionTerms = rawSearchTerms.filter(term => !term.startsWith('-'));
    const exclusionTerms = rawSearchTerms.filter(term => term.startsWith('-')).map(term => term.substring(1)).filter(Boolean);

    const isFiltered = activeFilters.length > 0 || rawSearchTerms.length > 0;

    // 3. Filter characters
    const filteredCharacters = allCharacters.filter(character => {
      // Check against checkbox filters
      const passesFilters = activeFilters.every(filter => {
        for (const sectionName in nameMaps) {
          if (character[sectionName] && character[sectionName][filter.key] !== undefined) {
            return filter.type === 'value'
              ? character[sectionName][filter.key] >= filter.value
              : gradeMap[character[sectionName][filter.key]] >= filter.value;
          }
        }
        return false;
      });
      if (!passesFilters) return false;

      // Check against search terms
      if (rawSearchTerms.length > 0) {
        const allSkills = Object.values(character.skills).flat().filter(Boolean);
        const searchTargets = [String(character.id), character.name, character.nickname, ...allSkills, ...character.tags];
        
        const passesInclusion = inclusionTerms.every(term => searchTargets.some(target => smartIncludes(target, term)));
        if (!passesInclusion) return false;
        
        const passesExclusion = !exclusionTerms.some(term => searchTargets.some(target => smartIncludes(target, term)));
        if (!passesExclusion) return false;
      }

      return true;
    });

    // 4. Sort characters
    const sortBy = sortOrder.value;
    filteredCharacters.sort((a, b) => {
        switch (sortBy) {
            case 'name-asc': return a.name.localeCompare(b.name, 'ko') || a.id - b.id;
            case 'name-desc': return b.name.localeCompare(a.name, 'ko') || a.id - b.id;
            case 'id-asc': return a.id - b.id;
            case 'id-desc': return b.id - a.id;
            default: return 0;
        }
    });

    // 5. Render to screen
    renderCharacters(filteredCharacters, isFiltered);
  }
  
  // --- Utility and Event Handler Functions ---
  
  function resetAllFilters() {
    DOMElements.filterForm.reset();
    DOMElements.searchBox.value = '';
    updateDisplay();
  }
  
  function toggleAllSkills(e) {
    const { characterList, toggleSkillsButton } = DOMElements;
    const allDetails = characterList.querySelectorAll('.skill-details');
    if (allDetails.length === 0) return;
    
    const shouldOpen = !allDetails[0].open;
    allDetails.forEach(detail => detail.open = shouldOpen);

    toggleSkillsButton.innerHTML = shouldOpen ? '??' : '??';
    toggleSkillsButton.title = shouldOpen ? '?? ?? ?? (\\)' : '?? ?? ??? (\\)';
  }
  
  function updateScrollButtonsVisibility() {
    const { scrollTopButton, scrollBottomButton } = DOMElements;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;

    scrollTopButton.classList.toggle('hidden', scrollTop < 200);
    scrollBottomButton.classList.toggle('hidden', (scrollTop + windowHeight) >= (scrollHeight - 20));
  }
  
  function handleKeyboardShortcuts(event) {
    const { searchBox } = DOMElements;
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')) {
        if (event.key === 'Escape') resetAllFilters();
        return;
    }

    switch (event.key) {
        case '/': event.preventDefault(); searchBox.focus(); break;
        case 'Escape': resetAllFilters(); break;
        case '.': window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); break;
        case ',': window.scrollTo({ top: 0, behavior: 'smooth' }); break;
        case '\\': event.preventDefault(); toggleAllSkills(); break;
    }
  }

  /**
   * Initializes the application: fetches data, sets up event listeners.
   */
  async function initializeApp() {
    try {
      const response = await fetch('./characters.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      allCharacters = await response.json();

      const { filterForm, searchBox, sortOrder, resetFiltersButton, noResultsResetButton, 
              scrollTopButton, scrollBottomButton, toggleSkillsButton } = DOMElements;

      filterForm.addEventListener('input', updateDisplay);
      searchBox.addEventListener('input', updateDisplay);
      sortOrder.addEventListener('change', updateDisplay);
      resetFiltersButton.addEventListener('click', resetAllFilters);
      noResultsResetButton.addEventListener('click', resetAllFilters);
      scrollTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      scrollBottomButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
      toggleSkillsButton.addEventListener('click', toggleAllSkills);
      
      window.addEventListener('scroll', updateScrollButtonsVisibility);
      window.addEventListener('resize', updateScrollButtonsVisibility);
      document.addEventListener('keydown', handleKeyboardShortcuts);

      updateDisplay();
      updateScrollButtonsVisibility();

    } catch (error) {
      console.error("??? ???? ???? ? ??????:", error);
      DOMElements.characterList.innerHTML = `<p style="text-align:center; color:red;">??? ??? ???? ?????. characters.json ??? ??? ??? ??? ??? ???.<br>??? ????? ???? ???.</p>`;
    }
  }

  // --- App Entry Point ---
  document.addEventListener('DOMContentLoaded', initializeApp);

})();