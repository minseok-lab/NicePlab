// constants/plabRegion.js

// 플랩풋볼 API에서 사용하는 지역 ID 목록입니다.
export const PLAB_REGIONS = [
  {
    id: 1,
    area_group_name: '서울특별시',
    areas: [
      { id: 1, area_name: ['은평', '서대문', '마포'] },
      {
        id: 2,
        area_name: [
          '노원',
          '도봉',
          '성동',
          '성북',
          '광진',
          '강북',
          '동대문',
          '중랑',
        ],
      },
      { id: 3, area_name: ['강남', '서초', '송파', '강동'] },
      {
        id: 4,
        area_name: ['강서', '양천', '영등포', '금천', '동작', '구로', '관악'],
      },
      { id: 30, area_name: ['종로', '중구', '용산'] },
    ],
  },
  {
    id: 2,
    area_group_name: '경기도',
    areas: [
      { id: 5, area_name: ['고양', '파주', '김포'] },
      { id: 9, area_name: ['의정부', '양주', '포천', '동두천', '연천'] },
      { id: 11, area_name: ['남양주', '구리', '양평', '가평'] },
      { id: 31, area_name: ['광주', '하남', '이천', '여주'] },
      { id: 32, area_name: ['부천', '광명', '시흥', '안산'] },
      { id: 33, area_name: ['화성', '오산', '평택', '안성'] },
      { id: 34, area_name: ['안양', '과천', '군포', '의왕'] },
      { id: 35, area_name: ['성남', '수원', '용인'] },
    ],
  },
  {
    id: 3,
    area_group_name: '인천광역시',
    areas: [
      { id: 14, area_name: ['서구', '동구', '중구'] },
      { id: 15, area_name: ['연수구', '남동구', '미추홀구'] },
      { id: 28, area_name: ['부평구', '계양구'] },
      { id: 36, area_name: ['강화', '옹진'] },
    ],
  },
  {
    id: 9,
    area_group_name: '강원특별자치도',
    areas: [
      { id: 37, area_name: ['원주', '횡성'] },
      { id: 38, area_name: ['춘천', '철원', '화천', '양구'] },
      { id: 39, area_name: ['홍천', '인제'] },
      { id: 40, area_name: ['강릉', '영월', '정선', '평창'] },
      { id: 41, area_name: ['속초', '양양', '고성'] },
      { id: 42, area_name: ['태백', '삼척', '동해'] },
    ],
  },
  {
    id: 4,
    area_group_name: '대전광역시',
    areas: [
      { id: 43, area_name: ['세종', '서구', '유성구'] },
      { id: 44, area_name: ['동구', '중구'] },
      { id: 45, area_name: ['대덕구'] },
    ],
  },
  {
    id: 4,
    area_group_name: '세종특별자치시',
    areas: [{ id: 43, area_name: ['세종', '서구', '유성구'] }],
  },
  {
    id: 10,
    area_group_name: '충청남도',
    areas: [
      { id: 17, area_name: ['천안', '아산'] },
      { id: 46, area_name: ['공주', '부여', '청양'] },
      { id: 47, area_name: ['계룡', '금산', '논산'] },
      { id: 48, area_name: ['서산', '당진', '태안'] },
      { id: 49, area_name: ['보령', '서천'] },
      { id: 50, area_name: ['홍성', '예산'] },
    ],
  },
  {
    id: 11,
    area_group_name: '충청북도',
    areas: [
      { id: 18, area_name: ['청주'] },
      { id: 51, area_name: ['충주'] },
      { id: 52, area_name: ['진천', '음성', '괴산', '증평'] },
      { id: 53, area_name: ['제천', '단양'] },
      { id: 54, area_name: ['보은', '옥천', '영동'] },
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
      { id: 20, area_name: ['구미', '김천', '칠곡'] },
      { id: 21, area_name: ['포항', '경주', '영덕', '울진', '울릉'] },
      { id: 29, area_name: ['안동', '의성', '청송', '영양', '예천'] },
      { id: 61, area_name: ['문경', '상주', '예천', '영주', '봉화'] },
      { id: 62, area_name: ['경산', '영천', '청도'] },
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
      { id: 24, area_name: ['창원', '통영', '거제', '함안', '고성'] },
      { id: 73, area_name: ['김해', '밀양', '양산', '의령', '창녕'] },
      { id: 74, area_name: ['진주', '사천', '남해', '하동'] },
      { id: 75, area_name: ['합천', '산청', '함양', '거창'] },
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
      { id: 81, area_name: ['여수', '순천', '광양', '구례', '고흥'] },
      {
        id: 82,
        area_name: ['나주', '담양', '곡성', '화순', '함평', '영광', '장성'],
      },
      { id: 83, area_name: ['목포', '해남', '영암', '무안', '진도', '신안'] },
      { id: 84, area_name: ['보성', '장흥', '강진', '완도'] },
    ],
  },
  {
    id: 16,
    area_group_name: '전북특별자치도',
    areas: [
      { id: 26, area_name: ['전주', '완주'] },
      { id: 85, area_name: ['군산', '익산', '김제'] },
      { id: 86, area_name: ['정읍', '고창', '부안'] },
      { id: 87, area_name: ['진안', '무주', '장수'] },
      { id: 88, area_name: ['남원', '임실', '순창'] },
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
