// 플랩풋볼 API에서 사용하는 지역 ID 목록입니다.
// 모든 지역명에 '시/군/구'를 명확히 표기하여 데이터 일관성을 확보했습니다.
export const PLAB_REGIONS = [
  {
    id: 1,
    area_group_name: '서울특별시',
    areas: [
      { id: 1, area_name: ['은평구', '서대문구', '마포구'] },
      {
        id: 2,
        area_name: [
          '노원구',
          '도봉구',
          '성동구',
          '성북구',
          '광진구',
          '강북구',
          '동대문구',
          '중랑구',
        ],
      },
      { id: 3, area_name: ['강남구', '서초구', '송파구', '강동구'] },
      {
        id: 4,
        area_name: [
          '강서구',
          '양천구',
          '영등포구',
          '금천구',
          '동작구',
          '구로구',
          '관악구',
        ],
      },
      { id: 30, area_name: ['종로구', '중구', '용산구'] },
    ],
  },
  {
    id: 2,
    area_group_name: '경기도',
    areas: [
      { id: 5, area_name: ['고양시', '파주시', '김포시'] },
      {
        id: 9,
        area_name: ['의정부시', '양주시', '포천시', '동두천시', '연천군'],
      },
      { id: 11, area_name: ['남양주시', '구리시', '양평군', '가평군'] },
      { id: 31, area_name: ['광주시', '하남시', '이천시', '여주시'] },
      { id: 32, area_name: ['부천시', '광명시', '시흥시', '안산시'] },
      { id: 33, area_name: ['화성시', '오산시', '평택시', '안성시'] },
      { id: 34, area_name: ['안양시', '과천시', '군포시', '의왕시'] },
      { id: 35, area_name: ['성남시', '수원시', '용인시'] },
    ],
  },
  {
    id: 3,
    area_group_name: '인천광역시',
    areas: [
      { id: 14, area_name: ['서구', '동구', '중구'] },
      { id: 15, area_name: ['연수구', '남동구', '미추홀구'] },
      { id: 28, area_name: ['부평구', '계양구'] },
      { id: 36, area_name: ['강화군', '옹진군'] },
    ],
  },
  {
    id: 9,
    area_group_name: '강원특별자치도',
    areas: [
      { id: 37, area_name: ['원주시', '횡성군'] },
      { id: 38, area_name: ['춘천시', '철원군', '화천군', '양구군'] },
      { id: 39, area_name: ['홍천군', '인제군'] },
      { id: 40, area_name: ['강릉시', '영월군', '정선군', '평창군'] },
      { id: 41, area_name: ['속초시', '양양군', '고성군'] },
      { id: 42, area_name: ['태백시', '삼척시', '동해시'] },
    ],
  },
  {
    id: 4,
    area_group_name: '대전광역시',
    areas: [
      { id: 43, area_name: ['세종시', '서구', '유성구'] },
      { id: 44, area_name: ['동구', '중구'] },
      { id: 45, area_name: ['대덕구'] },
    ],
  },
  {
    id: 4,
    area_group_name: '세종특별자치시',
    areas: [{ id: 43, area_name: ['세종시', '서구', '유성구'] }],
  },
  {
    id: 10,
    area_group_name: '충청남도',
    areas: [
      { id: 17, area_name: ['천안시', '아산시'] },
      { id: 46, area_name: ['공주시', '부여군', '청양군'] },
      { id: 47, area_name: ['계룡시', '금산군', '논산시'] },
      { id: 48, area_name: ['서산시', '당진시', '태안군'] },
      { id: 49, area_name: ['보령시', '서천군'] },
      { id: 50, area_name: ['홍성군', '예산군'] },
    ],
  },
  {
    id: 11,
    area_group_name: '충청북도',
    areas: [
      { id: 18, area_name: ['청주시'] },
      { id: 51, area_name: ['충주시'] },
      { id: 52, area_name: ['진천군', '음성군', '괴산군', '증평군'] },
      { id: 53, area_name: ['제천시', '단양군'] },
      { id: 54, area_name: ['보은군', '옥천군', '영동군'] },
    ],
  },
  {
    id: 5,
    area_group_name: '대구광역시',
    areas: [
      { id: 55, area_name: ['동구'] },
      { id: 56, area_name: ['북구'] },
      { id: 57, area_name: ['서구'] },
      { id: 58, area_name: ['중구', '남구'] },
      { id: 59, area_name: ['달서구'] },
      { id: 60, area_name: ['수성구'] },
    ],
  },
  {
    id: 12,
    area_group_name: '경상북도',
    areas: [
      { id: 20, area_name: ['구미시', '김천시', '칠곡군'] },
      { id: 21, area_name: ['포항시', '경주시', '영덕군', '울진군', '울릉군'] },
      { id: 29, area_name: ['안동시', '의성군', '청송군', '영양군', '예천군'] },
      { id: 61, area_name: ['문경시', '상주시', '예천군', '영주시', '봉화군'] },
      { id: 62, area_name: ['경산시', '영천시', '청도군'] },
    ],
  },
  {
    id: 6,
    area_group_name: '부산광역시',
    areas: [
      { id: 63, area_name: ['중구', '동구', '서구', '영도구'] },
      { id: 64, area_name: ['부산진구', '동래구', '남구'] },
      { id: 65, area_name: ['북구', '해운대구', '사하구'] },
      { id: 66, area_name: ['금정구', '연제구', '수영구'] },
      { id: 67, area_name: ['사상구', '기장군', '강서구'] },
    ],
  },
  {
    id: 13,
    area_group_name: '울산광역시',
    areas: [
      { id: 68, area_name: ['중구'] },
      { id: 69, area_name: ['남구'] },
      { id: 70, area_name: ['동구'] },
      { id: 71, area_name: ['북구'] },
      { id: 72, area_name: ['울주군'] },
    ],
  },
  {
    id: 14,
    area_group_name: '경상남도',
    areas: [
      { id: 24, area_name: ['창원시', '통영시', '거제시', '함안군', '고성군'] },
      { id: 73, area_name: ['김해시', '밀양시', '양산시', '의령군', '창녕군'] },
      { id: 74, area_name: ['진주시', '사천시', '남해군', '하동군'] },
      { id: 75, area_name: ['합천군', '산청군', '함양군', '거창군'] },
    ],
  },
  {
    id: 7,
    area_group_name: '광주광역시',
    areas: [
      { id: 76, area_name: ['동구'] },
      { id: 77, area_name: ['남구'] },
      { id: 78, area_name: ['광산구'] },
      { id: 79, area_name: ['북구'] },
      { id: 80, area_name: ['서구'] },
    ],
  },
  {
    id: 15,
    area_group_name: '전라남도',
    areas: [
      { id: 81, area_name: ['여수시', '순천시', '광양시', '구례군', '고흥군'] },
      {
        id: 82,
        area_name: [
          '나주시',
          '담양군',
          '곡성군',
          '화순군',
          '함평군',
          '영광군',
          '장성군',
        ],
      },
      {
        id: 83,
        area_name: ['목포시', '해남군', '영암군', '무안군', '진도군', '신안군'],
      },
      { id: 84, area_name: ['보성군', '장흥군', '강진군', '완도군'] },
    ],
  },
  {
    id: 16,
    area_group_name: '전북특별자치도',
    areas: [
      { id: 26, area_name: ['전주시', '완주군'] },
      { id: 85, area_name: ['군산시', '익산시', '김제시'] },
      { id: 86, area_name: ['정읍시', '고창군', '부안군'] },
      { id: 87, area_name: ['진안군', '무주군', '장수군'] },
      { id: 88, area_name: ['남원시', '임실군', '순창군'] },
    ],
  },
  {
    id: 8,
    area_group_name: '제주특별자치도',
    areas: [
      { id: 27, area_name: ['제주시'] },
      { id: 89, area_name: ['서귀포시'] },
    ],
  },
];
