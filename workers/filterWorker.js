const GRADE_MAP = {
  S: 8,
  A: 7,
  B: 6,
  C: 5,
  D: 4,
  E: 3,
  F: 2,
  G: 1
};
const CHO_SUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

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

let allCharacters = [];

onmessage = function (e) {
  const {
    type,
    payload
  } = e.data;

  if (type === 'init') {
    allCharacters = payload.characters;
    return;
  }

  if (type === 'filter') {
    const {
      activeFilters,
      searchTerms,
      sortBy
    } = payload;
    const {
      inclusionTerms,
      exclusionTerms
    } = searchTerms;

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

      if (searchTerms.inclusionTerms.length > 0 || searchTerms.exclusionTerms.length > 0) {
        const allSkills = Object.values(character.skills).flat().filter(Boolean);
        const searchTargets = [String(character.id), character.name, character.nickname, ...allSkills, ...character.tags];

        const passesInclusion = inclusionTerms.every((term) => searchTargets.some((target) => smartIncludes(target, term)));
        if (!passesInclusion) return false;

        const passesExclusion = !exclusionTerms.some((term) => searchTargets.some((target) => smartIncludes(target, term)));
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
