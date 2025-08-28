// components/MatchDetails.js

import { View, Text, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { matchDetailsStyles as styles } from '../styles';
import { getTierFromLevel } from '../utils';
import { getLevelBadgeUrl } from '../constants/links';

// --- Helper Functions ---
const getFallbackGrade = (match) => {
    if (typeof match.grade === 'number' && match.grade > 0) {
        return `[${match.grade.toFixed(1)}]`;
    }
    return null;
};

const getAverageLevelInfo = (match) => {
    if (match.confirm_cnt === 0) return '루키';
    if (!match.applys || !Array.isArray(match.applys) || match.applys.length === 0) {
        return getFallbackGrade(match) || '[정보 없음]';
    }
    const levelStats = match.applys.reduce((stats, participant) => {
        if (participant.status !== 'CONFIRM') return stats;
        let level = null;
        if (participant.profile_level?.tier_ko === '루키') level = 2.4;
        else if (participant.level !== null && !isNaN(parseFloat(participant.level))) level = parseFloat(participant.level);
        if (level !== null) {
            stats.sum += level;
            stats.count++;
        }
        return stats;
    }, { sum: 0, count: 0 });

    if (levelStats.count === 0) return getFallbackGrade(match) || '[정보 없음]';
    const averageLevel = levelStats.sum / levelStats.count;
    return `[${averageLevel.toFixed(1)}]`;
};

/**
 * 펼쳐진 카드에 표시될 매치 상세 정보 목록입니다.
 * @param {boolean} isLoading - 상세 정보를 로딩 중인지 여부
 * @param {Array} matches - 표시할 매치 목록
 */
const MatchDetails = ({ isLoading, matches }) => {
  // 1. 로딩 중일 경우 ActivityIndicator를 표시합니다.
  if (isLoading) {
    return <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />;
  }

  // 2. 매치가 없을 경우 안내 문구를 표시합니다.
  if (matches.length === 0) {
    return (
      <View style={styles.matchListContainer}>
        <Text style={styles.noMatchText}>✅ 날씨는 최적이지만, 신청 가능한 매치가 없어요!</Text>
      </View>
    );
  }
  
  // 3. 매치 목록을 렌더링합니다.
  return (
    <View style={styles.matchListContainer}>
      {matches.map(match => {
        const averageLevelInfo = getAverageLevelInfo(match);
        const tierInfo = getTierFromLevel(averageLevelInfo);
        const badgeUrl = getLevelBadgeUrl(tierInfo.en_name);

        return (
          <TouchableOpacity 
            key={match.id}
            style={styles.matchItemContainer}
            onPress={() => Linking.openURL(`https://www.plabfootball.com/match/${match.id}/`)}
          >
            <Text style={[styles.matchInfoText, styles.matchLink]}>
              {`⚽ ${match.label_title}`}
            </Text>
            <View style={styles.matchDetailsContainer}>
              {badgeUrl ? (
                <SvgUri width="18" height="18" uri={badgeUrl} style={{ marginRight: 6 }} />
              ) : (
                <Text style={{ marginRight: 6 }}>📊</Text>
              )}
              <Text style={styles.matchDetailsText}>
                {`평균 레벨: ${tierInfo.name}  [ ${match.confirm_cnt} / ${match.max_player_cnt} ]`}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default MatchDetails;