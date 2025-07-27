const gradeMap = { 'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1, 'G': 0 };

const characters = [
  {
    id: 100101, name: "스페셜 위크", nickname: "스페셜 드리머",
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "C", Medium: "A", Long: "A" },
    StrategyAptitude: { Front: "G", Pace: "A", Late: "A", End: "C" },
    StatBonuses: { Speed: 0, Stamina: 20, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["슈팅 스타"], 
      pink: ["배고픈 대장", "꿈을 이뤄 주는 뒷심"], 
      yellow: ["먹보", "전심전력"], 
      white: ["뒷심", "영양 보급", "물고 늘어지기", "진창길○", "외곽 추월 준비"] 
    },
    tags: ["1기", "주인공", "스페짱"]
  },
  {
    id: 100102, name: "스페셜 위크", nickname: "호핑♪비타민 하트",
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "C", Medium: "A", Long: "A" },
    StrategyAptitude: { Front: "G", Pace: "A", Late: "A", End: "C" },
    StatBonuses: { Speed: 0, Stamina: 10, Power: 10, Guts: 10, Wit: 0 },
    skills: { 
      rainbow: ["겁나게 귀엽네♪머린 다이브"], 
      pink: ["한여름의 자유", "한여름의 총대장"], 
      yellow: ["신속 과감", "텐션 오르는데!"], 
      white: ["페이스 업", "위치 선정 밀어붙이기", "천둥 번개 스텝", "맑은 날○", "꼬리 올리기"] 
    },
    tags: ["여름", "수영복", "수스페"]
  },
  {
    id: 100103, name: "스페셜 위크", nickname: "일본 최고의 총대장", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "C", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "G", Pace: "A", Late: "A", End: "C" },
    StatBonuses: { Speed: 10, Stamina: 10, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["위풍당당, 아름다운 꿈!"], 
      pink: ["노도의 출진", "일본 최고의 근성"], 
      yellow: ["노도의 추격", "일본 최고의 우마무스메"], 
      white: ["코너 달인○", "추격", "외곽 추월 준비", "장거리 직선○", "장거리 코너○"] 
    },
    tags: ["메인스토리", "총대장", "총스페"]
  },
  {
    id: 100201, name: "사일런스 스즈카", nickname: "사일런트 이노센스", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "D", Mile: "A", Medium: "A", Long: "E" }, 
    StrategyAptitude: { Front: "A", Pace: "C", Late: "E", End: "G" },
    StatBonuses: { Speed: 20, Stamina: 10, Power: 0, Guts: 10, Wit: 0 },
    skills: { 
      rainbow: ["선두의 경치는 양보할 수 없어…!"], 
      pink: ["최대 집중", "이차원의 도망자"], 
      yellow: ["컨센트레이션", "도망자"], 
      white: ["집중력", "굳히기 준비", "전도유망", "반시계(좌) 방향○", "빠른 걸음"] 
    },
    tags: ["절벽", "니게시스", "도주시스터즈"]  
  },
  {
    id: 100202, name: "사일런스 스즈카", nickname: "물결 사이의 에메랄드", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "D", Mile: "A", Medium: "A", Long: "E" }, 
    StrategyAptitude: { Front: "A", Pace: "C", Late: "E", End: "G" },
    StatBonuses: { Speed: 15, Stamina: 15, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["수평선 저 너머로"], 
      pink: ["푸른색 이스케이프", "푸른 하늘을 달리는 라파가"], 
      yellow: ["탈출술", "누구보다 앞으로!"], 
      white: ["빠른 걸음", "직선 회복", "제일 먼저", "도주 코너○", "꼬리 올리기"] 
    },
    tags: ["여름", "수영복", "수즈카"]  
  },
  {
    id: "100301", name: "토카이 테이오", nickname: "톱・오브・조이풀", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "E", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "D", Pace: "A", Late: "C", End: "E" },
    StatBonuses: { Speed: 20, Stamina: 10, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["궁극 테이오 스텝"], 
      pink: ["천재적 기교", "제왕 스텝"], 
      yellow: ["기교파", "라이트닝 스텝"], 
      white: ["포지션 센스", "천둥 번개 스텝", "교묘한 스텝", "임기응변", "경쾌한 스텝"] 
    },
    tags: ["2기", "주인공", "골절왕", "하찌미"]  
  },  {
    id: "100302", name: "토카이 테이오", nickname: "비욘드・더・호라이즌", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "E", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "D", Pace: "A", Late: "C", End: "E" },
    StatBonuses: { Speed: 20, Stamina: 10, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["절대는, 나야"], 
      pink: ["레이스의 천재", "지평선 저편까지"], 
      yellow: ["레이스 플래너", "신들린 스텝"], 
      white: ["포지션 센스", "경쾌한 스텝", "좋은 위치 뒤따르기", "봄 우마무스메○", "코너 회복○"] 
    },
    tags: ["애니 콜라보", "불닭"]  
  },  {
    id: "100303", name: "토카이 테이오", nickname: "자색 구름의 나비", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "E", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "D", Pace: "A", Late: "C", End: "E" },
    StatBonuses: { Speed: 10, Stamina: 10, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["가무환락이여, 아아 즐겁도다"], 
      pink: ["천부적인 움직임", "반락유희"], 
      yellow: ["치열한 승부", "여유만만"], 
      white: ["정면 승부", "스태미나 킵", "진가 발휘", "꼬리 올기기", "선행 직선○"] 
    },
    tags: ["축제", "음이오"]  
  },  {
    id: "100401", name: "마루젠스키", nickname: "포뮬러 오브 루주", 
    SurfaceAptitude: { Turf: "A", Dirt: "D" },
    DistanceAptitude: { Short: "B", Mile: "A", Medium: "B", Long: "C" }, 
    StrategyAptitude: { Front: "A", Pace: "E", Late: "G", End: "G" },
    StatBonuses: { Speed: 10, Stamina: 0, Power: 0, Guts: 0, Wit: 20 },
    skills: { 
      rainbow: ["홍염 기어/LP1211-M"], 
      pink: ["날아 보자구!", "홍련의 오버 레브"], 
      yellow: ["기어 체인지", "엑셀 전개!"], 
      white: ["직선 달인", "기어 시프트", "앞장서기", "엑셀러레이션", "집중력"] 
    },
    tags: ["슈퍼카", "틀딱", "마르젠스키", "니게시스", "도주시스터즈"]  
  },  {
    id: "100402", name: "마루젠스키", nickname: "날아라☆서머 나이트", 
    SurfaceAptitude: { Turf: "A", Dirt: "D" },
    DistanceAptitude: { Short: "B", Mile: "A", Medium: "B", Long: "C" }, 
    StrategyAptitude: { Front: "A", Pace: "E", Late: "G", End: "G" },
    StatBonuses: { Speed: 15, Stamina: 0, Power: 0, Guts: 0, Wit: 15 },
    skills: { 
      rainbow: ["뭉클하게♪Chu"], 
      pink: ["심쿵☆말괄량이 우마무스메!", "단상의 지배자"], 
      yellow: ["말괄량이 우마무스메", "마일의 지배자"], 
      white: ["코너 회복○", "적극책", "기세로 밀어붙이기", "스리 세븐", "스피드 이터"] 
    },
    tags: ["여름", "수영복", "수루젠", "3대장"]  
  },  {
    id: "100403", name: "마루젠스키", nickname: "祝ひ寿ぐ神速天女", 
    SurfaceAptitude: { Turf: "A", Dirt: "D" },
    DistanceAptitude: { Short: "B", Mile: "A", Medium: "B", Long: "C" }, 
    StrategyAptitude: { Front: "A", Pace: "E", Late: "G", End: "G" },
    StatBonuses: { Speed: 15, Stamina: 0, Power: 15, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["霊験灼然チョベリグ神託"], 
      pink: ["天女の羽衣", "神薙ダンス"], 
      yellow: ["여장부 기질", "傑出"], 
      white: ["마일 직선○", "적극책", "오기", "抜きん出る一歩", "기어 시프트"] 
    },
    tags: ["새해", "신년", "뉴루젠"]  
  },  {
    id: "100501", name: "후지 키세키", nickname: "슈팅 스타・레뷔", 
    SurfaceAptitude: { Turf: "A", Dirt: "F" },
    DistanceAptitude: { Short: "B", Mile: "A", Medium: "B", Long: "E" }, 
    StrategyAptitude: { Front: "C", Pace: "A", Late: "C", End: "G" },
    StatBonuses: { Speed: 0, Stamina: 20, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["반짝이는 별의 보드빌"], 
      pink: ["빛나는 톱스타", "엔터테이너"], 
      yellow: ["여장부 기질", "레이스 플래너"], 
      white: ["트릭(앞)", "오기", "좋은 위치 뒤따르기", "기어 시프트", "마일 코너○"] 
    },
    tags: ["극장판", "활주로"]  
  },  {
    id: "100502", name: "후지 키세키", nickname: "쉭세・에투알", 
    SurfaceAptitude: { Turf: "A", Dirt: "F" },
    DistanceAptitude: { Short: "B", Mile: "A", Medium: "B", Long: "E" }, 
    StrategyAptitude: { Front: "C", Pace: "A", Late: "C", End: "G" },
    StatBonuses: { Speed: 8, Stamina: 0, Power: 14, Guts: 0, Wit: 8 },
    skills: { 
      rainbow: ["Ravissant"], 
      pink: ["압권의 트릭", "마음을 사로잡는 코너링"], 
      yellow: ["넋이 나가는 트릭", "스피드스터"], 
      white: ["트릭(앞)", "마일 코너○", "빠져나갈 준비", "교묘한 스텝", "정면 승부"] 
    },
    tags: ["무도회", "뉴세키"]  
  },  {
    id: "100601", name: "오구리 캡", nickname: "스타라이트 비트", 
    SurfaceAptitude: { Turf: "A", Dirt: "B" },
    DistanceAptitude: { Short: "E", Mile: "A", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "F", Pace: "A", Late: "A", End: "D" },
    StatBonuses: { Speed: 20, Stamina: 0, Power: 10, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["승리의 고동"], 
      pink: ["가사마쓰의 먹보", "굶주린 괴물", "괴물의 코너링"], 
      yellow: ["먹보", "곡선의 소믈리에"], 
      white: ["코너 가속○", "엑셀러레이션", "영양 보급", "흐린 날○", "뒤처지기 방지"] 
    },
    tags: ["신데렐라그레이", "주인공"]  
  },  {
    id: "100602", name: "오구리 캡", nickname: "기적의 하얀 별", 
    SurfaceAptitude: { Turf: "A", Dirt: "B" },
    DistanceAptitude: { Short: "E", Mile: "A", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "F", Pace: "A", Late: "A", End: "D" },
    StatBonuses: { Speed: 15, Stamina: 15, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["크리스마스 이브의 미라클 런!"], 
      pink: ["폭식 보양", "크리스마스의 기적 체험"], 
      yellow: ["먹보", "내적 체험"], 
      white: ["쥐어짜기", "안쪽 코너 여포", "영양 보급", "짧은 휴식", "스리 세븐"] 
    },
    tags: ["크리스마스", "클구리", "3대장"]  
  },  {
    id: "100701", name: "골드 쉽", nickname: "레드 스트라이프", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "G", Mile: "C", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "G", Pace: "B", Late: "B", End: "A" },
    StatBonuses: { Speed: 0, Stamina: 20, Power: 10, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["불침항, 출항!", "파란주의포!"], 
      pink: ["564 아이즈, 시야 선명!", "익스트림 하교술"], 
      yellow: ["시야 양호! 이상 없음!", "하교 후의 스페셜리스트"], 
      white: ["우마무스메 애호가", "추격", "간파", "하굣길의 즐거움", "후방 대기"] 
    },
    tags: ["피스피스스피스피고루시짱", "파카튜브", "주인공"]  
  },  {
    id: "100702", name: "골드 쉽", nickname: "RUN! 럼블! 런처!!", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "G", Mile: "C", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "G", Pace: "B", Late: "B", End: "A" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 20, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["Adventure of 564"], 
      pink: ["신비 체험! 골쉽 워프", "오징어 튀김, 어떠세요!?", "불타오른다고!!"], 
      yellow: ["내적 체험", "고양감"], 
      white: ["럭키 세븐", "안쪽 코너 여포", "하굣길의 즐거움", "앞으로 기우뚱", "수상한 작전"] 
    },
    tags: ["여름", "수영복", "수루시"]  
  },  {
    id: "100703", name: "골드 쉽", nickname: "La Mode 564", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "G", Mile: "C", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "G", Pace: "B", Late: "B", End: "A" },
    StatBonuses: { Speed: 8, Stamina: 14, Power: 8, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["Vive la GOLD"], 
      pink: ["밀려드는 쥬뗌므", "거친 해안을 선호하는 황금배"], 
      yellow: ["육박하는 그림자", "진창길의 귀신"], 
      white: ["직선 주파", "진창길○", "코너 회복○", "뛰어난 작전", "중거리 직선○"] 
    },
    tags: ["프로젝트L'Arc", "개선문상"]  
  },  {
    id: "100801", name: "보드카", nickname: "와일드 톱기어", 
    SurfaceAptitude: { Turf: "A", Dirt: "D" },
    DistanceAptitude: { Short: "F", Mile: "A", Medium: "A", Long: "F" }, 
    StrategyAptitude: { Front: "C", Pace: "B", Late: "A", End: "F" },
    StatBonuses: { Speed: 10, Stamina: 20, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["커팅×DRIVE!", "엑셀X"], 
      pink: ["스키틀 브레이크", "뛰어난 다리"], 
      yellow: ["호전일식", "강인한 다리"], 
      white: ["직선 회복", "상승기류", "추월 확정 태세", "직선 가속", "마일 직선○"] 
    },
    tags: ["우옥까"]  
  },  {
    id: "100802", name: "보드카", nickname: "얼지 않는 아쿠아・비타이", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "A", Medium: "A", Long: "E" }, 
    StrategyAptitude: { Front: "C", Pace: "B", Late: "A", End: "F" },
    StatBonuses: { Speed: 20, Stamina: 0, Power: 0, Guts: 10, Wit: 0 },
    skills: { 
      rainbow: ["Into High Gear!"], 
      pink: ["앞질러 주겠어!", "최속의 톱기어"], 
      yellow: ["논스톱 걸", "톱기어"], 
      white: ["폭발하는 다리", "뒤처지기 방지", "중거리 코너○", "풀 스로틀", "선입 직선○"] 
    },
    tags: ["크리스마스"]  
  },  {
    id: "100901", name: "다이와 스칼렛", nickname: "톱・오브・블루", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "A", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "A", Pace: "A", Late: "E", End: "G" },
    StatBonuses: { Speed: 10, Stamina: 0, Power: 0, Guts: 20, Wit: 0 },
    skills: { 
      rainbow: ["브릴리언트 레드 에이스", "레드 에이스"], 
      pink: ["퍼펙트 튠", "내가 이길 거야!"], 
      yellow: ["킬러 튠", "레이스 플래너"], 
      white: ["대항 의식○", "템포 업", "좋은 위치 뒤따르기", "스태미나 킵", "빠져나갈 준비"] 
    },
    tags: ["다스카"]  
  },  {
    id: "100902", name: "다이와 스칼렛", nickname: "다홍색 뉘・에투알레", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "B", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "A", Pace: "A", Late: "E", End: "G" },
    StatBonuses: { Speed: 20, Stamina: 0, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["Queen's Lumination"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["끈질기게 버티기", "기세로 밀어붙이기", "노력의 결과", "장거리 직선○", "장거리 코너○"] 
    },
    tags: ["크리스마스", "클스카"]  
  },  {
    id: "101001", name: "타이키 셔틀", nickname: "와일드・프론티어", 
    SurfaceAptitude: { Turf: "A", Dirt: "B" },
    DistanceAptitude: { Short: "A", Mile: "A", Medium: "E", Long: "G" }, 
    StrategyAptitude: { Front: "C", Pace: "A", Late: "E", End: "G" },
    StatBonuses: { Speed: 20, Stamina: 0, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["빅토리 샷!"], 
      pink: ["조준 사격입니다!", "Frontier Spirit"], 
      yellow: ["기어 체인지", "마일의 지배자"], 
      white: ["직선 달인", "기어 시프트", "선행의 요령○", "적극책", "마일 직선○"] 
    },
    tags: ["빅샷"]  
  },  {
    id: "101002", name: "타이키 셔틀", nickname: "Bubblegum☆Memories", 
    SurfaceAptitude: { Turf: "A", Dirt: "B" },
    DistanceAptitude: { Short: "A", Mile: "A", Medium: "E", Long: "G" }, 
    StrategyAptitude: { Front: "C", Pace: "A", Late: "E", End: "G" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 30, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["Joyful Voyage!"], 
      pink: ["Adventure의 선도자", "진검승부입니다!"], 
      yellow: ["마일의 지배자", "치열한 승부"], 
      white: ["진창길○", "적극책", "정면 승부", "마일 코너○", "선행 코너○"] 
    },
    tags: ["캠핑", "캠핑키"]  
  },  {
    id: "101101", name: "그래스 원더", nickname: "바위 뚫는 파랑", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "G", Mile: "A", Medium: "B", Long: "A" }, 
    StrategyAptitude: { Front: "F", Pace: "A", Late: "A", End: "F" },
    StatBonuses: { Speed: 20, Stamina: 0, Power: 10, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["정신일도 하사불성", "정신일도"], 
      pink: ["요조숙녀", "불퇴전의 의지"], 
      yellow: ["독점력", "능숙한 환승"], 
      white: ["선행 긴장", "속박", "추월 확정 태세", "뒷심", "위치 선정 밀어붙이기"] 
    },
    tags: ["그라스", "유리스"]  
  },  {
    id: "101102", name: "그래스 원더", nickname: "세인트 제이드・힐러", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "G", Mile: "A", Medium: "B", Long: "A" }, 
    StrategyAptitude: { Front: "F", Pace: "A", Late: "A", End: "F" },
    StatBonuses: { Speed: 0, Stamina: 15, Power: 0, Guts: 0, Wit: 15 },
    skills: { 
      rainbow: ["게인 힐・슈피리어"], 
      pink: ["큐어리 힐", "용기의 마법"], 
      yellow: ["쿨다운", "릴랙스"], 
      white: ["페이스 킵", "심호흡", "짧은 휴식", "트릭(앞)", "선입의 요령○"] 
    },
    tags: ["환상세계우마네스트", "힐라스"]  
  },  {
    id: "101103", name: "그래스 원더", nickname: "蒼炎の誉", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "G", Mile: "B", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "F", Pace: "A", Late: "A", End: "F" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 20, Wit: 10 },
    skills: { 
      rainbow: ["演舞・撫子大薙刀"], 
      pink: ["射貫く蒼", "勝機到来"], 
      yellow: ["용왕매진", "後の先"], 
      white: ["풀 스로틀", "겨울 우마무스메○", "切り返し", "선입 직선○", "선입 코너○"] 
    },
    tags: ["새해", "신년", "창라스"]  
  },  {
    id: "101201", name: "히시 아마존", nickname: "아마조네스・라피스", 
    SurfaceAptitude: { Turf: "A", Dirt: "E" },
    DistanceAptitude: { Short: "D", Mile: "A", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "G", Pace: "B", Late: "C", End: "A" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 20, Guts: 10, Wit: 0 },
    skills: { 
      rainbow: ["맞짱! 데드히트!"], 
      pink: ["승리를 향한 포효", "맞짱에 거는 집념"], 
      yellow: ["승리를 향한 집념", "질풍노도"], 
      white: ["임기응변", "뛰어난 작전", "물고 늘어지기", "추입 직선○", "추입 코너○"] 
    },
    tags: ["히시아마네상"]  
  },  {
    id: "101202", name: "히시 아마존", nickname: "Hungry Veil", 
    SurfaceAptitude: { Turf: "A", Dirt: "E" },
    DistanceAptitude: { Short: "D", Mile: "A", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "G", Pace: "B", Late: "C", End: "A" },
    StatBonuses: { Speed: 10, Stamina: 0, Power: 10, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["곱빼기! 퍼스트 바이트!"], 
      pink: ["열렬한 인게이지!", "투혼입도!"], 
      yellow: ["강공책", "뛰어난 추입력"], 
      white: ["이른 작전", "속박", "추입력", "뛰어난 작전", "직선 주파"] 
    },
    tags: ["웨딩", "신부", "결혼", "아침차려주는예쁜누나"]  
  },  {
    id: "101301", name: "메지로 맥퀸", nickname: "엘레강스・라인", 
    SurfaceAptitude: { Turf: "A", Dirt: "E" },
    DistanceAptitude: { Short: "G", Mile: "F", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "B", Pace: "A", Late: "D", End: "F" },
    StatBonuses: { Speed: 0, Stamina: 20, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["존귀한 사명을 완수하기 위하여"], 
      pink: ["메지로의 마음가짐", "명배우의 여유"], 
      yellow: ["선봉의 마음가짐", "여유만만"], 
      white: ["봄 우마무스메○", "스태미나 킵", "리드 킵", "장거리 코너○", "영양 보급"] 
    },
    tags: ["파쿠파쿠데스와"]  
  },  {
    id: "101302", name: "메지로 맥퀸", nickname: "엔드・오브・스카이", 
    SurfaceAptitude: { Turf: "A", Dirt: "E" },
    DistanceAptitude: { Short: "G", Mile: "F", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "B", Pace: "A", Late: "D", End: "F" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["최강의 이름을 걸고"], 
      pink: ["액티브 레스트", "하늘 끝까지"], 
      yellow: ["쿨다운", "한줄기 질풍"], 
      white: ["직선 달인", "스태미나 킵", "심호흡", "가을 우마무스메○", "페이스 업"] 
    },
    tags: ["애니 콜라보", "빙닭", "명배우"]  
  },  {
    id: "101303", name: "메지로 맥퀸", nickname: "잔물결 페어 레이디", 
    SurfaceAptitude: { Turf: "A", Dirt: "E" },
    DistanceAptitude: { Short: "G", Mile: "F", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "B", Pace: "A", Late: "D", End: "F" },
    StatBonuses: { Speed: 8, Stamina: 8, Power: 0, Guts: 0, Wit: 14 },
    skills: { 
      rainbow: ["빛나는 바다, 눈부신 그대"], 
      pink: ["여름의 명배우", "일의전심으로 리프레시!"], 
      yellow: ["노력의 결정체", "일의전심ㄴ"], 
      white: ["집중력", "선행의 요령○", "노력의 결과", "빈틈 없음", "스태미나 킵"] 
    },
    tags: ["여름", "수영복", "수맥퀸"]  
  },  {
    id: "101401", name: "엘 콘도르 파사", nickname: "엘☆Número 1", 
    SurfaceAptitude: { Turf: "A", Dirt: "B" },
    DistanceAptitude: { Short: "F", Mile: "A", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "E", Pace: "A", Late: "A", End: "C" },
    StatBonuses: { Speed: 20, Stamina: 0, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["플란차☆가나도르", "열혈☆아미고"], 
      pink: ["매의 눈", "여유로운 퍼포먼스"], 
      yellow: ["천리안", "여유만만"], 
      white: ["직선 달인", "호크아이", "선행 직선○", "스태미나 킵", "템포 업"] 
    },
    tags: ["가나돌", "맘보", "황금세대"]  
  },  {
    id: "101402", name: "엘 콘도르 파사", nickname: "쿠쿨칸・몽크", 
    SurfaceAptitude: { Turf: "A", Dirt: "B" },
    DistanceAptitude: { Short: "F", Mile: "A", Medium: "A", Long: "B" }, 
    StrategyAptitude: { Front: "E", Pace: "A", Late: "A", End: "C" },
    StatBonuses: { Speed: 15, Stamina: 0, Power: 0, Guts: 15, Wit: 0 },
    skills: { 
      rainbow: ["콘도르 맹격파"], 
      pink: ["호용무쌍", "콘도르 도약술", "승천하는 콘도르"], 
      yellow: ["강인한 다리", "승천하는 용"], 
      white: ["뒷심", "상승기류", "외곽 추월 준비", "오기", "십만 마력"] 
    },
    tags: ["환상세계우마네스트", "파닭"]  
  },  {
    id: "101501", name: "티엠 오페라 오", nickname: "오・솔레・수오!", 
    SurfaceAptitude: { Turf: "A", Dirt: "E" },
    DistanceAptitude: { Short: "G", Mile: "E", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "C", Pace: "A", Late: "A", End: "G" },
    StatBonuses: { Speed: 0, Stamina: 20, Power: 0, Guts: 0, Wit: 10 },
    skills: { 
      rainbow: ["빅토리아에게 바치는 무도"], 
      pink: ["강림! 세기말 패왕!", "가극왕의 행진"], 
      yellow: ["스피드스터", "킬러 튠"], 
      white: ["빠져나갈 준비", "템포 업", "비근간거리○", "직선 달인", "스태미나 킵"] 
    },
    tags: [""]  
  },  {
    id: "101502", name: "티엠 오페라 오", nickname: "새해 창천・푸르른 현란", 
    SurfaceAptitude: { Turf: "A", Dirt: "E" },
    DistanceAptitude: { Short: "G", Mile: "E", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "C", Pace: "A", Late: "A", End: "G" },
    StatBonuses: { Speed: 14, Stamina: 8, Power: 0, Guts: 0, Wit: 8 },
    skills: { 
      rainbow: ["복을 베푸는 바르카롤"], 
      pink: ["왈츠의 마에스트로", "코너에 내려앉은 가극왕", "나는 늦지 않게 찾아온다!"], 
      yellow: ["원호의 마에스트로", "노력의 결정체"], 
      white: ["선행 직선○", "노력의 결과", "코너 회복○", "안쪽 그룹 능숙○", "겨울 우마무스메○"] 
    },
    tags: ["새해", "신년", "뉴페라"]  
  },  {
    id: "101601", name: "나리타 브라이언", nickname: "Maverick", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "B", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "G", Pace: "A", Late: "A", End: "D" },
    StatBonuses: { Speed: 10, Stamina: 20, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["Shadow Break"], 
      pink: ["일도양단", "굶주린 늑대의 송곳니"], 
      yellow: ["한줄기 질풍", "전심전력"], 
      white: ["직선 달인", "중거리 직선○", "좋은 위치 뒤따르기", "뒷심", "고독한 늑대"] 
    },
    tags: ["나리브", "쉐브", "고늑"]  
  },  {
    id: "101602", name: "나리타 브라이언", nickname: "굶주린 늑대", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "F", Mile: "B", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "G", Pace: "A", Late: "A", End: "D" },
    StatBonuses: { Speed: 10, Stamina: 10, Power: 0, Guts: 10, Wit: 0 },
    skills: { 
      rainbow: ["회색 임계점"], 
      pink: ["BLAZING WOLF", "갈망하는 괴물"], 
      yellow: ["맹추격", "괴물"], 
      white: ["봄 우마무스메○", "달려들기", "진가 발휘", "심호흡", "빈틈 없음"] 
    },
    tags: ["메인스토리", "Blaze", "겜리브"]  
  },  {
    id: "101701", name: "심볼리 루돌프", nickname: "로드・오브・엠퍼러", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "E", Mile: "C", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "B", Pace: "A", Late: "A", End: "C" },
    StatBonuses: { Speed: 0, Stamina: 20, Power: 0, Guts: 10, Wit: 0 },
    skills: { 
      rainbow: ["그대, 황제의 신위를 보라"], 
      pink: ["황제의 시선", "개수일촉"], 
      yellow: ["독점력", "호선의 프로페서"], 
      white: ["코너 달인○", "속박", "좋은 위치 뒤따르기", "선입 견제", "선행 코너○"] 
    },
    tags: ["학생회장", "말장난"]  
  },  {
    id: "101702", name: "심볼리 루돌프", nickname: "밝은 달의 활잡이", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "E", Mile: "C", Medium: "A", Long: "A" }, 
    StrategyAptitude: { Front: "B", Pace: "A", Late: "A", End: "C" },
    StatBonuses: { Speed: 8, Stamina: 14, Power: 0, Guts: 0, Wit: 8 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["어스름이 물러서는 떠들썩한 화살"], 
      pink: ["신색자약", "풍상고결"], 
      yellow: ["여유만만", "초가을 강풍"], 
      white: ["가을 우마무스메○", "안쪽 코너 여포", "스태미나 킵", "직활강", "선행 직선○"] 
    },
    tags: ["축제", "활돌프", "한조"]  
  },  {
    id: "101801", name: "에어 그루브", nickname: "엠프리스 로드", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "C", Mile: "B", Medium: "A", Long: "E" }, 
    StrategyAptitude: { Front: "D", Pace: "A", Late: "A", End: "G" },
    StatBonuses: { Speed: 10, Stamina: 0, Power: 20, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["블레이즈 오브 프라이드", "엠프리스 프라이드"], 
      pink: ["여제의 권모", "수월경화"], 
      yellow: ["현혹의 교란", "레인의 마술사"], 
      white: ["임기응변", "템포 업", "교란", "추입 주저", "추입 긴장"] 
    },
    tags: ["타와케", "부회장"]  
  },  {
    id: "101802", name: "에어 그루브", nickname: "퀘르쿠스・키윌리스", 
    SurfaceAptitude: { Turf: "A", Dirt: "G" },
    DistanceAptitude: { Short: "C", Mile: "B", Medium: "A", Long: "E" }, 
    StrategyAptitude: { Front: "D", Pace: "A", Late: "A", End: "G" },
    StatBonuses: { Speed: 10, Stamina: 0, Power: 10, Guts: 10, Wit: 0 },
    skills: { 
      rainbow: ["훈풍, 영원한 순간을"], 
      pink: ["여제의 긍지", "상현의 소믈리에"], 
      yellow: ["여장부 기질", "곡선의 소믈리에"], 
      white: ["코너 가속○", "오기", "선행 코너○", "선행의 요령○", "페이스 업"] 
    },
    tags: ["웨딩", "신부", "결혼", "Air Groove"]
  },  {
    id: "101901", name: "아그네스 디지털", nickname: "초특급! 풀컬러 특수 PP", 
    SurfaceAptitude: { Turf: "A", Dirt: "A" },
    DistanceAptitude: { Short: "F", Mile: "A", Medium: "A", Long: "G" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["존귀☆라스트 스퍼—(ﾟ∀ﾟ)—트!"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },  {
    id: "ZZZ", name: "ZZZ", nickname: "ZZZ", 
    SurfaceAptitude: { Turf: "Z", Dirt: "Z" },
    DistanceAptitude: { Short: "Z", Mile: "Z", Medium: "Z", Long: "Z" }, 
    StrategyAptitude: { Front: "Z", Pace: "Z", Late: "Z", End: "Z" },
    StatBonuses: { Speed: 0, Stamina: 0, Power: 0, Guts: 0, Wit: 0 },
    skills: { 
      rainbow: ["ZZZ"], 
      pink: ["ZZZ", "ZZZ"], 
      yellow: ["ZZZ", "ZZZ"], 
      white: ["ZZZ", "ZZZ", "ZZZ", "ZZZ", "ZZZ"] 
    },
    tags: ["ZZZ", "ZZZ"]  
  },
];

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

function getGradeSpan(grade) {
  if (!grade) return '';
  return `<span class="grade-${grade.toLowerCase()}">${grade}</span>`;
}

function renderCharacters(charactersToRender) {
  const count = charactersToRender.length;

  if (count === 0) {
    characterList.style.display = 'none';
    noResultsContainer.style.display = 'block';
    resultSummary.textContent = '';
    return;
  }
  
  characterList.style.display = 'flex';
  noResultsContainer.style.display = 'none';
  characterList.innerHTML = '';
 
  let summaryText = '';
  if (count === 1) {
    summaryText = "당신이 찾던 그 우마무스메가... 딱 1명 있네요! 찾았어요!";
  } else if (count >= 2 && count <= 5) {
    summaryText = `당신이 찾던 그 우마무스메가... ${count}명 있어요!`;
  } else if (count >= 6 && count <= 15) {
    summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있을 것 같아요.`;
  } else if (count >= 16 && count <= 50) {
    summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있는 것 맞죠?`;
  } else { 
    summaryText = `당신이 찾는 그 우마무스메가... ${count}명 중에 있기를 바랍니다!`;
  }
  resultSummary.textContent = summaryText;

  const nameMaps = {
    SurfaceAptitude: { name: '경기장 적성', map: { Turf: '잔디', Dirt: '더트' } },
    DistanceAptitude: { name: '거리 적성', map: { Short: '단거리', Mile: '마일', Medium: '중거리', Long: '장거리' } },
    StrategyAptitude: { name: '각질 적성', map: { Front: '도주', Pace: '선행', Late: '선입', End: '추입' } },
    StatBonuses: { name: '성장률', map: { Speed: '스피드', Stamina: '스태미나', Power: '파워', Guts: '근성', Wit: '지능' } }
  };

  charactersToRender.forEach(char => {
    const isTurfBPlus = gradeMap[char.SurfaceAptitude.Turf] >= gradeMap['B'];
    const isDirtBPlus = gradeMap[char.SurfaceAptitude.Dirt] >= gradeMap['B'];
    let titleBgClass = '';
    if (isTurfBPlus && isDirtBPlus) {
        titleBgClass = 'title-hybrid-bg';
    } else if (isTurfBPlus) {
        titleBgClass = 'title-light-bg';
    } else if (isDirtBPlus) {
        titleBgClass = 'title-dark-bg';
    }

    let statsHTML = '';
    for (const sectionKey in nameMaps) {
      const section = nameMaps[sectionKey];
      statsHTML += `<li class="stat-item stat-category">${section.name}</li>`;
      for (const itemKey in section.map) {
        const value = char[sectionKey]?.[itemKey];
        if (value === undefined) continue;
        const displayName = section.map[itemKey];
        const displayValue = sectionKey === 'StatBonuses'
          ? `<span>${value}</span><span class="percent">%</span>`
          : getGradeSpan(value);
        statsHTML += `<li class="stat-item"><span class="label">${displayName}</span><span class="value">${displayValue}</span></li>`;
      }
    }
    
    let skillHTML = '';
    const skillData = char.skills;
    if (skillData.rainbow) skillData.rainbow.forEach(skill => skillHTML += `<div class="skill-slot skill-rainbow">${skill || ''}</div>`);
    if (skillData.pink)    skillData.pink.forEach(skill => skillHTML += `<div class="skill-slot skill-pink">${skill || ''}</div>`);
    if (skillData.yellow)  skillData.yellow.forEach(skill => skillHTML += `<div class="skill-slot skill-yellow">${skill || ''}</div>`);
    if (skillData.white)   skillData.white.forEach(skill => skillHTML += `<div class="skill-slot skill-white">${skill || ''}</div>`);

    const cardHTML = `
      <div class="character-card" data-id="${char.id}">
        <div class="card-nickname">${char.nickname}</div>
        <div class="card-title ${titleBgClass}">${char.name}</div>
        <ul class="card-stats">
          ${statsHTML}
          <details class="skill-details">
            <summary class="skill-summary">스킬</summary>
            <div class="skill-container">${skillHTML}</div>
          </details>
        </ul>
      </div>`;
    characterList.insertAdjacentHTML('beforeend', cardHTML);
  });
}

function updateDisplay() {
  const formData = new FormData(filterForm);
  const activeCheckboxes = Array.from(filterForm.elements).filter(el => el.type === 'checkbox' && el.checked);
  
  let filteredCharacters = characters.filter(character => {
    if (activeCheckboxes.length === 0) return true;
    return activeCheckboxes.every(checkbox => {
      const key = checkbox.name;
      const sections = { SurfaceAptitude: 'grade', DistanceAptitude: 'grade', StrategyAptitude: 'grade', StatBonuses: 'value' };
      for (const sectionName in sections) {
        if (character[sectionName] && character[sectionName][key] !== undefined) {
          const type = sections[sectionName];
          if (type === 'value') {
            return character[sectionName][key] >= parseInt(formData.get(`${key}-value`), 10);
          } else {
            return gradeMap[character[sectionName][key]] >= gradeMap[formData.get(`${key}-grade`)];
          }
        }
      }
      return false;
    });
  });

  const rawSearchTerms = searchBox.value.split(',').map(term => term.trim()).filter(term => term);
  
  const inclusionTerms = [];
  const exclusionTerms = [];

  rawSearchTerms.forEach(term => {
    if (term.startsWith('-')) {
      const exclusionTerm = term.substring(1);
      if (exclusionTerm) exclusionTerms.push(exclusionTerm);
    } else {
      inclusionTerms.push(term);
    }
  });

  if (inclusionTerms.length > 0) {
    filteredCharacters = filteredCharacters.filter(char => {
      const allSkills = Object.values(char.skills).flat().filter(Boolean);
      const searchTargets = [String(char.id), char.name, char.nickname, ...allSkills, ...char.tags];
      
      return inclusionTerms.every(term => {
        let isExact = false;
        let cleanTerm = term;

        if (term.startsWith('"') && term.endsWith('"')) {
          isExact = true;
          cleanTerm = term.substring(1, term.length - 1);
        }

        if (!cleanTerm) return true;

        const searchMode = isExact ? 'exact' : 'smart';
        return searchTargets.some(target => smartIncludes(target, cleanTerm, searchMode));
      });
    });
  }

  if (exclusionTerms.length > 0) {
    filteredCharacters = filteredCharacters.filter(char => {
      const allSkills = Object.values(char.skills).flat().filter(Boolean);
      const searchTargets = [String(char.id), char.name, char.nickname, ...allSkills, ...char.tags];

      return !exclusionTerms.some(term => 
        searchTargets.some(target => smartIncludes(target, term, 'smart')) // Exclusion always uses smart search
      );
    });
  }

  const sortBy = sortOrder.value;
  if (sortBy === 'name-asc') filteredCharacters.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  else if (sortBy === 'name-desc') filteredCharacters.sort((a, b) => b.name.localeCompare(a.name, 'ko'));
  else if (sortBy === 'id-asc') filteredCharacters.sort((a, b) => a.id - b.id);
  else if (sortBy === 'id-desc') filteredCharacters.sort((a, b) => b.id - a.id);
  
  renderCharacters(filteredCharacters);
}

function resetAllFilters() {
  filterForm.reset();
  searchBox.value = '';
  updateDisplay();
}

filterForm.addEventListener('input', updateDisplay);
searchBox.addEventListener('input', updateDisplay);
sortOrder.addEventListener('change', updateDisplay);
resetFiltersButton.addEventListener('click', resetAllFilters);
noResultsResetButton.addEventListener('click', resetAllFilters);
scrollTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
scrollBottomButton.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));

window.onload = updateDisplay;