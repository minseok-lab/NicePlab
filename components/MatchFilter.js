// components/MatchFilter.js

import { useState } from 'react';
import { View } from 'react-native';
// ✨ 1. react-native-dropdown-picker를 import 합니다.
import DropDownPicker from 'react-native-dropdown-picker';
import { getMatchFilterStyles } from '../styles';

// ✨ 2. 라이브러리가 요구하는 형식 {label, value}로 아이템 목록을 정의합니다.
const GENDER_ITEMS = [
  { label: '남자', value: 'male' },
  { label: '여자', value: 'female' },
  { label: '혼성', value: 'mixed' },
];

const LEVEL_ITEMS = [
  { label: '아마추어2 이하', value: 'amateur2_under' },
  { label: '아마추어4 이상', value: 'amateur4_above' },
  { label: '누구나', value: 'general' },
];

const MatchFilter = ({
  genderFilter,
  onGenderChange,
  levelFilter,
  onLevelChange,
  theme,
}) => {
  const styles = getMatchFilterStyles(theme);

  // ✨ 3. 각 드롭다운의 열림/닫힘 상태를 관리하기 위한 state를 추가합니다.
  const [genderOpen, setGenderOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);

  return (
    <View style={styles.container}>
      {/* --- 성별 필터 드롭다운 --- */}
      <View style={styles.pickerContainer}>
        <DropDownPicker
          // ✨ 4. 다중 선택을 활성화하는 핵심 prop입니다.
          multiple={true}
          // 다중 선택 시, 선택된 항목들을 뱃지 형태로 보여주는 모드입니다.
          mode="BADGE"
          open={genderOpen}
          // value는 이제 배열입니다 (예: ['male', 'mixed'])
          value={genderFilter}
          items={GENDER_ITEMS}
          setOpen={setGenderOpen}
          // setValue는 상태 변경 함수를 직접 받습니다.
          setValue={onGenderChange}
          placeholder="성별"
          // 스타일 관련 props
          style={styles.dropdownStyle}
          dropDownContainerStyle={styles.dropdownStyle}
          listItemLabelStyle={styles.textStyle}
          placeholderStyle={styles.placeholderStyle}
          textStyle={styles.textStyle}
        />
      </View>

      {/* --- 레벨 필터 드롭다운 --- */}
      <View style={styles.pickerContainer}>
        <DropDownPicker
          multiple={true}
          mode="BADGE"
          open={levelOpen}
          value={levelFilter}
          items={LEVEL_ITEMS}
          setOpen={setLevelOpen}
          setValue={onLevelChange}
          placeholder="레벨"
          // 스타일 관련 props
          style={styles.dropdownStyle}
          dropDownContainerStyle={styles.dropdownStyle}
          listItemLabelStyle={styles.textStyle}
          placeholderStyle={styles.placeholderStyle}
          textStyle={styles.textStyle}
        />
      </View>
    </View>
  );
};

export default MatchFilter;
