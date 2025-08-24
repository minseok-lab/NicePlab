/*

// components/MatchDetails.js
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { styles } from '../styles/styles';
import { fetchPlabMatchDetails } from '../api';
import { getTierFromLevel } from '../utils';
import { getLevelBadgeUrl } from '../constants';

// Helper functions
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

export const MatchDetails = ({ matches }) => {
  const [detailedMatches, setDetailedMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (matches.length === 0) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const detailPromises = matches.map(match => fetchPlabMatchDetails(match.id));
        const results = await Promise.all(detailPromises);
        setDetailedMatches(results.filter(Boolean));
      } catch (error) {
        console.error("Failed to fetch match details:", error);
        setDetailedMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [matches]);

  if (isLoading) {
    return <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />;
  }

  if (detailedMatches.length === 0) {
    return <Text style={styles.noMatchText}>✅ 날씨는 최적이지만, 신청 가능한 매치가 없어요!</Text>;
  }

  return (
    <View style={styles.matchListContainer}>
      {detailedMatches.map(match => {
        const averageLevelInfo = getAverageLevelInfo(match);
        const tierInfo = getTierFromLevel(averageLevelInfo);
        const badgeUrl = getLevelBadgeUrl(tierInfo.en_name);

        return (
          <TouchableOpacity 
            key={match.id}
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
                {`평균 레벨: ${tierInfo.name}   [ ${match.confirm_cnt} / ${match.max_player_cnt} ]`}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

*/