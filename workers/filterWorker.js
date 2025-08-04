const GRADE_MAP = { S: 8, A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 };
const CHO_SUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const SANITIZE_REGEX = /[\s\-!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|`~♪☆・！？—ﾟ∀]/g;

let allCharacters = [];

const getChosung = (char) => {
    const code = char.charCodeAt(0) - 44032;
    if (code < 0 || code > 11171) return char;
    return CHO_SUNG[Math.floor(code / 588)];
};

const smartIncludes = (target, term, targetChosung) => {
    if (!term) return true;
    const sanitizedTerm = term.toLowerCase().replace(SANITIZE_REGEX, "");
    if (!sanitizedTerm) return true;
    
    if (target.includes(sanitizedTerm)) return true;

    const isTermAllChosung = [...sanitizedTerm].every(char => CHO_SUNG.includes(char));
    if (isTermAllChosung && targetChosung.includes(sanitizedTerm)) {
        return true;
    }
    
    return false;
};

const preProcessCharacters = (characters) => {
    return characters.map(character => {
        const searchCorpus = [
            character.id,
            character.name,
            character.nickname,
            ...Object.values(character.skills).flat(),
            ...(character.tags || [])
        ].filter(Boolean).join(' ').toLowerCase().replace(SANITIZE_REGEX, "");
        
        const chosungCorpus = [...searchCorpus].map(getChosung).join("");

        return {
            ...character,
            _searchCorpus: searchCorpus,
            _chosungCorpus: chosungCorpus
        };
    });
};

const filterCharacter = (character, { activeFilters, searchTerms }) => {
    for (const filter of activeFilters) {
        let passes = false;
        for (const sectionName in character) {
            if (character[sectionName] && typeof character[sectionName] === 'object' && character[sectionName][filter.key] !== undefined) {
                const value = character[sectionName][filter.key];
                const check = filter.type === "value" ? value >= filter.value : GRADE_MAP[value] >= filter.value;
                if (check) {
                    passes = true;
                    break;
                }
            }
        }
        if (!passes) return false;
    }

    const { inclusionTerms, exclusionTerms } = searchTerms;

    if (inclusionTerms.length > 0) {
        if (!inclusionTerms.every(term => smartIncludes(character._searchCorpus, term, character._chosungCorpus))) {
            return false;
        }
    }
    
    if (exclusionTerms.length > 0) {
        if (exclusionTerms.some(term => smartIncludes(character._searchCorpus, term, character._chosungCorpus))) {
            return false;
        }
    }

    return true;
};

const sortCharacters = (characters, sortBy) => {
    characters.sort((a, b) => {
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
};

onmessage = function (e) {
    const { type, payload } = e.data;

    if (type === 'init') {
        allCharacters = preProcessCharacters(payload.characters);
        return;
    }

    if (type === 'filter') {
        const filtered = allCharacters.filter(char => filterCharacter(char, payload));
        sortCharacters(filtered, payload.sortBy);
        postMessage(filtered);
    }
};
