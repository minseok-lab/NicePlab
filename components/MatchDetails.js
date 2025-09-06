// components/MatchDetails.js

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { getMatchDetailsStyles } from '../styles';
import { getTierFromLevel } from '../utils';
import {
  getLevelBadgeUrl,
  PLAB_EARLY_Bird,
  PLAB_SUPER_SUB,
} from '../constants';
import SvgIcTshirt from './IcTshirt';
import LoadingIndicator from './LoadingIndicator';

// --- Helper Functions ---
// 함수가 문자열 대신 순수한 숫자 또는 null을 반환하도록 수정
const getAverageLevelInfo = match => {
  if (
    match.confirm_cnt === 0 ||
    !match.applys ||
    !Array.isArray(match.applys) ||
    match.applys.length === 0
  ) {
    return null;
  }

  const levelStats = match.applys.reduce(
    (stats, participant) => {
      if (participant.status !== 'CONFIRM') return stats;
      let level = null;
      if (participant.profile_level?.tier_ko === '루키') level = 2.4;
      else if (participant.level !== null)
        level = parseFloat(participant.level);

      if (level !== null && !isNaN(level)) {
        stats.sum += level;
        stats.count++;
      }
      return stats;
    },
    { sum: 0, count: 0 },
  );

  if (levelStats.count === 0) return null;

  // 순수한 평균 레벨(숫자)을 반환합니다.
  return levelStats.sum / levelStats.count;
};

// ✨ 2. 단일 매치 아이템을 렌더링하는 최적화된 컴포넌트 생성
const MatchItem = React.memo(({ match, theme }) => {
  const styles = getMatchDetailsStyles(theme);

  // useMemo를 사용하여 복잡한 계산 결과를 메모이제이션합니다.
  const { tierInfo, badgeUrl } = useMemo(() => {
    const averageLevel = getAverageLevelInfo(match);
    const tier = getTierFromLevel(averageLevel) || {
      name: '정보 없음',
      en_name: '',
    };
    const url = getLevelBadgeUrl(tier.en_name);
    return { tierInfo: tier, badgeUrl: url };
  }, [match]);

  // useCallback을 사용하여 onPress 핸들러가 재생성되는 것을 방지합니다.
  const handlePress = useCallback(() => {
    const url = `https://www.plabfootball.com/match/${match.id}/`;
    // Linking.openURL에 .catch()를 추가하여 오류를 처리합니다.
    Linking.openURL(url).catch(err => console.error('URL 열기 실패:', err));
  }, [match.id]);

  return (
    <TouchableOpacity style={styles.matchItemContainer} onPress={handlePress}>
      <View style={styles.titleContainer}>
        <Text style={[styles.matchInfoText, styles.matchLink]}>
          {`⚽  ${match.label_title}`}
        </Text>

        {typeof match.is_earlybird === 'number' && (
          <SvgUri
            width="18"
            height="18"
            uri={PLAB_EARLY_Bird}
            style={[styles.baseIconStyle, styles.earlybirdIconStyle]}
          />
        )}
        {Boolean(match.is_super_sub) && (
          <SvgUri
            width="18"
            height="18"
            uri={PLAB_SUPER_SUB}
            style={[styles.baseIconStyle, styles.earlybirdIconStyle]}
          />
        )}
        {match.type === 'tshirt' && (
          <SvgIcTshirt
            width="30"
            height="30"
            color={theme.iconColor} // 예: theme 객체에 정의된 텍스트 색상
            style={[styles.baseIconStyle, styles.tshirtIconStyle]}
          />
        )}
      </View>

      <View style={styles.matchDetailsContainer}>
        {badgeUrl ? (
          <SvgUri
            width="18"
            height="18"
            uri={badgeUrl}
            style={styles.badgeIcon}
          />
        ) : (
          <Text style={styles.badgeIcon}>📊</Text>
        )}
        {/* 안전하게 레벨 정보를 화면에 표시합니다. */}
        <Text style={styles.matchDetailsText}>
          {`평균 레벨: ${tierInfo.name} `}
          {`[ ${match.confirm_cnt} / ${match.max_player_cnt} ]`}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const MatchDetails = ({ isLoading, matches, theme }) => {
  const styles = getMatchDetailsStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator size="small" text="매치 정보를 불러오는 중..." />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.matchListContainer}>
        <Text style={styles.noMatchText}>
          ✅ 날씨는 최적이지만, 신청 가능한 매치가 없어요!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.matchListContainer}>
      {matches.map(match => (
        // 3. matches.map 안에서는 최적화된 MatchItem 컴포넌트를 렌더링합니다.
        <MatchItem key={match.id} match={match} theme={theme} />
      ))}
    </View>
  );
};

export default MatchDetails;
