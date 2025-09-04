import { View, Text, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { getMatchDetailsStyles } from '../styles';
import { getTierFromLevel } from '../utils';
import { getLevelBadgeUrl, PLAB_EARLY_Bird, PLAB_SUPER_SUB } from '../constants';
import SvgIcTshirt from './IcTshirt';

// --- Helper Functions ---
// ✨ FIX: 함수가 문자열 대신 순수한 숫자 또는 null을 반환하도록 수정
const getAverageLevelInfo = (match) => {
    if (match.confirm_cnt === 0 || !match.applys || !Array.isArray(match.applys) || match.applys.length === 0) {
        return null;
    }

    const levelStats = match.applys.reduce((stats, participant) => {
        if (participant.status !== 'CONFIRM') return stats;
        let level = null;
        if (participant.profile_level?.tier_ko === '루키') level = 2.4;
        else if (participant.level !== null) level = parseFloat(participant.level);
        
        if (level !== null && !isNaN(level)) {
            stats.sum += level;
            stats.count++;
        }
        return stats;
    }, { sum: 0, count: 0 });

    if (levelStats.count === 0) return null;
    
    // 순수한 평균 레벨(숫자)을 반환합니다.
    return levelStats.sum / levelStats.count;
};

const MatchDetails = ({ isLoading, matches, theme }) => {
    const styles = getMatchDetailsStyles(theme);

    if (isLoading) {
        return <ActivityIndicator size="small" color={theme.textPrimary} style={{ marginVertical: 10 }} />;
    }

    if (matches.length === 0) {
        return (
            <View style={styles.matchListContainer}>
                <Text style={styles.noMatchText}>✅ 날씨는 최적이지만, 신청 가능한 매치가 없어요!</Text>
            </View>
        );
    }
    
    return (
        <View style={styles.matchListContainer}>
            {matches.map(match => {
                // 1. averageLevel은 이제 숫자 또는 null 입니다.
                const averageLevel = getAverageLevelInfo(match);

                // ✨ FIX: tierInfo가 없는 경우를 대비해 안전한 기본값을 설정합니다.
                const tierInfo = getTierFromLevel(averageLevel) || { name: '정보 없음', en_name: '' }; 
                const badgeUrl = getLevelBadgeUrl(tierInfo.en_name);

                return (
                    <TouchableOpacity 
                        key={match.id}
                        style={styles.matchItemContainer}
                        onPress={() => Linking.openURL(`https://www.plabfootball.com/match/${match.id}/`)}
                    >
                        <View style={styles.titleContainer}>
                            <Text style={[styles.matchInfoText, styles.matchLink]}>
                                {`⚽  ${match.label_title}`}
                            </Text>

                            {typeof match.is_earlybird === 'number' && (
                                <SvgUri
                                    width = "18"
                                    height = "18"
                                    uri = {PLAB_EARLY_Bird}
                                    style = {[styles.baseIconStyle, styles.earlybirdIconStyle]}
                                />
                            )}
                            {Boolean(match.is_super_sub) && (
                                <SvgUri
                                    width = "18"
                                    height = "18"
                                    uri = {PLAB_SUPER_SUB}
                                    style = {[styles.baseIconStyle, styles.earlybirdIconStyle]} />
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
                                <SvgUri width="18" height="18" uri={badgeUrl} style={{ marginRight: 6 }} />
                            ) : (
                                <Text style={{ marginRight: 6 }}>📊</Text>
                            )}
                            {/* ✨ FIX: 안전하게 레벨 정보를 화면에 표시합니다. */}
                            <Text style={styles.matchDetailsText}>
                                {`평균 레벨: ${tierInfo.name} `}
                                {`[ ${match.confirm_cnt} / ${match.max_player_cnt} ]`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default MatchDetails;