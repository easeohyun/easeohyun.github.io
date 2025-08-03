// workers/filterWorker.js
const GRADE_MAP = { S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 };
const CHO_SUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

function smartIncludes(searchableString, term) {
    const termStr = String(term || "").toLowerCase().replace(/[\s\-!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~♪☆・！？—ﾟ∀]/g, "");
    if (!termStr) return true;
    
    return searchableString.includes(termStr);
}

let allCharacters = [];

const getChosung = (char) => {
    const code = char.charCodeAt(0) - 44032;
    return code >= 0 && code <= 11171 ? CHO_SUNG[Math.floor(code / 588)] : char;
};

onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'init') {
        // init 시점에 단 한번만 검색용 문자열을 미리 생성합니다.
        allCharacters = payload.characters.map(char => {
            const allSkills = Object.values(char.skills).flat().filter(Boolean);
            const searchTargets = [String(char.id), char.name, char.nickname, ...allSkills, ...char.tags];
            
            const originalText = searchTargets.join('|').toLowerCase().replace(/[\s\-!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~♪☆・！？—ﾟ∀]/g, "");
            const chosungText = [...originalText].map(getChosung).join("");
            
            // 일반 텍스트와 초성 텍스트를 합쳐 검색 효율을 극대화합니다.
            char._searchableString = `${originalText}|${chosungText}`;
            return char;
        });
        return;
    }

    if (type === 'filter') {
        const { activeFilters, searchTerms, sortBy } = payload;
        const { inclusionTerms, exclusionTerms } = searchTerms;

        const filteredCharacters = allCharacters.filter((character) => {
            const passesFilters = activeFilters.every((filter) => {
                for (const sectionName in character) {
                    if (character[sectionName] && typeof character[sectionName] === 'object' && character[sectionName][filter.key] !== undefined) {
                        return filter.type === "value" ? character[sectionName][filter.key] >= filter.value : GRADE_MAP[character[sectionName][filter.key]] >= filter.value;
                    }
                }
                return false;
            });
            if (!passesFilters) return false;

            // 미리 만들어 둔 _searchableString을 사용해 빠르게 검색합니다.
            if (inclusionTerms.length > 0) {
                const passesInclusion = inclusionTerms.every((term) => smartIncludes(character._searchableString, term));
                if (!passesInclusion) return false;
            }

            if (exclusionTerms.length > 0) {
                const passesExclusion = !exclusionTerms.some((term) => smartIncludes(character._searchableString, term));
                if (!passesExclusion) return false;
            }

            return true;
        });

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
        
        postMessage(filteredCharacters);
    }
};
