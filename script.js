// 즉시 실행 함수(IIFE)로 전체 코드를 감싸서 전역 스코프 오염 방지
(function() {
  const gradeMap = { 'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1, 'G': 0 };
  let allCharacters = []; // 모든 캐릭터 데이터를 저장할 배열

  // DOM 요소 가져오기
  const filterForm = document.getElementById('filter-form');
  const characterList = document.getElementById('character-list');
  const resultSummary = document.getElementById('result-summary');
  const sortOrder = document.getElementById('sort-order');
  const searchBox = document.getElementById('search-box');
  const resetFiltersButton = document.getElementById('reset-filters');
  const noResultsContainer = document.getElementById('no-results');
  const noResultsResetButton = document.getElementById('no-results-reset');
  const scrollTopButton = document.getElementById('scroll-top');
  const scrollBottomButton = document.getElementById('scroll-bottom');
  const toggleSkillsButton = document.getElementById('toggle-skills-btn');

  // 초성 및 스마트 검색 함수
  function smartIncludes(target, term, mode = 'smart') {
    const targetStr = String(target || '').toLowerCase();
    const termStr = String(term || '').toLowerCase();
    if (!termStr) return true;

    if (mode === 'exact') {
        return targetStr.includes(termStr);
    }

    const sanitize = (str) => str.replace(/[\s\-!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~♪☆・！？—ﾟ∀]/g, "");
    const sanitizedTerm = sanitize(termStr);
    const sanitizedTarget = sanitize(targetStr);
    if (!sanitizedTerm) return true;
    if (sanitizedTarget.includes(sanitizedTerm)) return true;

    const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
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

  // 등급에 맞는 span 태그 생성
  function getGradeSpan(grade) {
    if (!grade) return '';
    return `<span class="grade-${grade.toLowerCase()}">${grade}</span>`;
  }

  // 캐릭터 카드들을 화면에 렌더링하는 함수 (스킬 렌더링 로직 수정)
  function renderCharacters(charactersToRender, isFiltered) {
    const count = charactersToRender.length;
    characterList.innerHTML = '';

    if (count === 0 && isFiltered) {
      characterList.style.display = 'none';
      noResultsContainer.style.display = 'block';
      resultSummary.textContent = '';
      return;
    }

    characterList.style.display = ''; // grid 또는 flex는 CSS 미디어쿼리가 담당하므로 JS는 비워줌
    noResultsContainer.style.display = 'none';

    let summaryText = '';
    if (!isFiltered) {
      summaryText = `트레센 학원에 어서오세요, ${count}명의 우마무스메를 만날 수 있답니다!`;
    } else {
      if (count === 1) summaryText = "당신이 찾던 그 우마무스메가... 딱 1명 있네요! 찾았어요!";
      else if (count <= 5) summaryText = `당신이 찾던 그 우마무스메가... ${count}명 있어요!`;
      else if (count <= 15) summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있을 것 같아요.`;
      else if (count <= 50) summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있는 것 맞죠?`;
      else summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있기를 바랍니다!`;
    }
    resultSummary.textContent = summaryText;

    const nameMaps = {
      SurfaceAptitude: { name: '경기장 적성', map: { Turf: '잔디', Dirt: '더트' } },
      DistanceAptitude: { name: '거리 적성', map: { Short: '단거리', Mile: '마일', Medium: '중거리', Long: '장거리' } },
      StrategyAptitude: { name: '각질 적성', map: { Front: '도주', Pace: '선행', Late: '선입', End: '추입' } },
      StatBonuses: { name: '성장률', map: { Speed: '스피드', Stamina: '스태미나', Power: '파워', Guts: '근성', Wit: '지능' } }
    };

    const fragment = document.createDocumentFragment();

    charactersToRender.forEach(char => {
      const isTurfBPlus = gradeMap[char.SurfaceAptitude.Turf] >= gradeMap['B'];
      const isDirtBPlus = gradeMap[char.SurfaceAptitude.Dirt] >= gradeMap['B'];
      let titleBgClass = '';
      if (isTurfBPlus && isDirtBPlus) titleBgClass = 'title-hybrid-bg';
      else if (isTurfBPlus) titleBgClass = 'title-light-bg';
      else if (isDirtBPlus) titleBgClass = 'title-dark-bg';

      let statsHTML = '';
      for (const sectionKey in nameMaps) {
        statsHTML += `<li class="stat-item stat-category">${nameMaps[sectionKey].name}</li>`;
        for (const itemKey in nameMaps[sectionKey].map) {
          const value = char[sectionKey]?.[itemKey];
          if (value === undefined) continue;
          const displayName = nameMaps[sectionKey].map[itemKey];
          const displayValue = sectionKey === 'StatBonuses' ? `<span>${value}</span><span class="percent">%</span>` : getGradeSpan(value);
          statsHTML += `<li class="stat-item"><span class="label">${displayName}</span><span class="value">${displayValue}</span></li>`;
        }
      }

      // --- 스킬 HTML 생성 로직 수정 ---
      let skillHTML = '';
      const skillData = char.skills;

      // 무지개 스킬 (1개 또는 2개)
      if (skillData.rainbow && skillData.rainbow.length > 0) {
        skillHTML += '<div class="skill-row">';
        const flexClass = skillData.rainbow.length === 2 ? 'flex-2' : '';
        skillData.rainbow.forEach(skill => {
            // 1개일때는 flex-grow가, 2개일때는 flex-2 클래스가 너비를 조절
            skillHTML += `<div class="skill-slot skill-rainbow ${flexClass}">${skill || ''}</div>`;
        });
        skillHTML += '</div>';
      }

      // 핑크 스킬 (2, 3, 4개)
      if (skillData.pink && skillData.pink.length > 0) {
        skillHTML += '<div class="skill-row">';
        let flexClass = '';
        switch (skillData.pink.length) {
            case 2: flexClass = 'flex-2'; break;
            case 3: flexClass = 'flex-3'; break;
            case 4: flexClass = 'flex-4'; break;
        }
        skillData.pink.forEach(skill => {
            // 개수에 맞는 flex-* 클래스를 부여하여 너비를 강제
            skillHTML += `<div class="skill-slot skill-pink ${flexClass}">${skill || ''}</div>`;
        });
        skillHTML += '</div>';
      }

      // 노랑 스킬 (2개 고정)
      if (skillData.yellow && skillData.yellow.length > 0) {
        skillHTML += '<div class="skill-row">';
        skillData.yellow.forEach(skill => {
            // flex-2 클래스로 너비 50% 고정
            skillHTML += `<div class="skill-slot skill-yellow flex-2">${skill || ''}</div>`;
        });
        skillHTML += '</div>';
      }

      // 하얀 스킬 (5개 고정, 2줄)
      if (skillData.white && skillData.white.length > 0) {
          const topSkills = skillData.white.slice(0, 3);
          const bottomSkills = skillData.white.slice(3);

          if (topSkills.length > 0) {
            skillHTML += '<div class="skill-row">';
            topSkills.forEach(skill => {
                // flex-3 클래스로 너비 33.3% 고정
                skillHTML += `<div class="skill-slot skill-white flex-3">${skill || ''}</div>`;
            });
            skillHTML += '</div>';
          }
          if (bottomSkills.length > 0) {
            skillHTML += '<div class="skill-row">';
            bottomSkills.forEach(skill => {
                // flex-2 클래스로 너비 50% 고정
                skillHTML += `<div class="skill-slot skill-white flex-2">${skill || ''}</div>`;
            });
            skillHTML += '</div>';
          }
      }
      // --- 스킬 HTML 생성 로직 끝 ---

      const cardDiv = document.createElement('div');
      cardDiv.className = 'character-card';
      cardDiv.dataset.id = char.id;

      if (char.color) {
        cardDiv.style.setProperty('--character-color', char.color);
      }

      cardDiv.innerHTML = `
        <div class="card-main-info">
            <div class="card-identity">
              <div class="card-nickname">${char.nickname}</div>
              <div class="card-title ${titleBgClass}">${char.name}</div>
            </div>
            <ul class="card-stats">
              ${statsHTML}
            </ul>
        </div>
        <details class="skill-details">
          <summary class="skill-summary">스킬 정보 </summary>
          <div class="skill-container">${skillHTML}</div>
        </details>`;

      fragment.appendChild(cardDiv);
    });

    characterList.appendChild(fragment);
  }

  // 필터, 검색, 정렬을 적용하여 화면을 업데이트하는 메인 함수
  function updateDisplay() {
    const formData = new FormData(filterForm);
    const searchInputValue = searchBox.value;

    const activeFilters = Array.from(filterForm.elements)
      .filter(el => el.type === 'checkbox' && el.checked)
      .map(checkbox => {
        const key = checkbox.name;
        const isStatBonus = !!filterForm.querySelector(`input[name="${key}-value"]`);
        if (isStatBonus) {
          return { key, type: 'value', value: parseInt(formData.get(`${key}-value`), 10) };
        } else {
          return { key, type: 'grade', value: gradeMap[formData.get(`${key}-grade`)] };
        }
      });

    const rawSearchTerms = searchInputValue.split(',').map(term => term.trim()).filter(term => term);
    const inclusionTerms = rawSearchTerms.filter(term => !term.startsWith('-'));
    const exclusionTerms = rawSearchTerms.filter(term => term.startsWith('-')).map(term => term.substring(1)).filter(Boolean);

    const isFiltered = activeFilters.length > 0 || rawSearchTerms.length > 0;

    let filteredCharacters = allCharacters.filter(character => {
      const passesFilters = activeFilters.every(filter => {
        const sections = {
            SurfaceAptitude: 'grade', DistanceAptitude: 'grade',
            StrategyAptitude: 'grade', StatBonuses: 'value'
        };
        for (const sectionName in sections) {
          if (character[sectionName] && character[sectionName][filter.key] !== undefined) {
            if (filter.type === 'value') {
              return character[sectionName][filter.key] >= filter.value;
            } else {
              return gradeMap[character[sectionName][filter.key]] >= filter.value;
            }
          }
        }
        return false;
      });

      if (!passesFilters) return false;

      if (rawSearchTerms.length > 0) {
        const allSkills = Object.values(character.skills).flat().filter(Boolean);
        const searchTargets = [String(character.id), character.name, character.nickname, ...allSkills, ...character.tags];

        const passesInclusion = inclusionTerms.every(term =>
          searchTargets.some(target => smartIncludes(target, term, 'smart'))
        );
        if (!passesInclusion) return false;

        const passesExclusion = !exclusionTerms.some(term =>
          searchTargets.some(target => smartIncludes(target, term, 'smart'))
        );
        if (!passesExclusion) return false;
      }

      return true;
    });

    const sortBy = sortOrder.value;
    if (sortBy === 'name-asc') filteredCharacters.sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.id - b.id);
    else if (sortBy === 'name-desc') filteredCharacters.sort((a, b) => b.name.localeCompare(a.name, 'ko') || a.id - b.id);
    else if (sortBy === 'id-asc') filteredCharacters.sort((a, b) => a.id - b.id);
    else if (sortBy === 'id-desc') filteredCharacters.sort((a, b) => b.id - a.id);

    renderCharacters(filteredCharacters, isFiltered);
  }

  // 필터 초기화
  function resetAllFilters() {
    filterForm.reset();
    searchBox.value = '';
    updateDisplay();
  }
  
  // 모든 스킬 정보 열기/닫기 토글 함수
  function toggleAllSkills() {
    const allDetails = characterList.querySelectorAll('.skill-details');
    if (allDetails.length === 0) return;
    
    // 첫 번째 스킬 정보의 상태를 기준으로, 모든 스킬 정보의 열림/닫힘 상태를 결정
    const shouldOpen = !allDetails[0].open;
    
    allDetails.forEach(detail => {
      detail.open = shouldOpen;
    });
  }

  // 앱 초기화 함수
  async function initializeApp() {
    try {
      const response = await fetch('./characters.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      allCharacters = await response.json();

      allCharacters = allCharacters.filter(char => char.id !== 'ZZZ' && char.id !== 999999);

      filterForm.addEventListener('input', updateDisplay);
      searchBox.addEventListener('input', updateDisplay);
      sortOrder.addEventListener('change', updateDisplay);
      resetFiltersButton.addEventListener('click', resetAllFilters);
      noResultsResetButton.addEventListener('click', resetAllFilters);
      scrollTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      scrollBottomButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
      toggleSkillsButton.addEventListener('click', toggleAllSkills);

      document.addEventListener('keydown', (event) => {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT')) {
            if (event.key === 'Escape') {
                resetAllFilters();
            }
            return;
        }

        switch (event.key) {
            case '/':
                event.preventDefault();
                searchBox.focus();
                break;
            case 'Escape':
                resetAllFilters();
                break;
            case '.':
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                break;
            case ',':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case '\\': // '\' 키에 대한 단축키 추가
                event.preventDefault();
                toggleAllSkills();
                break;
        }
      });

      updateDisplay();

    } catch (error) {
      console.error("캐릭터 데이터를 불러오는 데 실패했습니다:", error);
      characterList.innerHTML = `<p style="text-align:center; color:red;">캐릭터 정보를 불러오지 못했습니다. characters.json 파일이 올바른 위치에 있는지 확인해 주세요.<br>사이트 관리자에게 문의하여 주세요.</p>`;
    }
  }

  document.addEventListener('DOMContentLoaded', initializeApp);

})();