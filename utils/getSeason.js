// utils/getSeason.js

function calculateMovingAverages(pastData) {
    const movingAverages = [];
    if (!pastData || pastData.length < 10) return [];

    for (let i = 9; i < pastData.length; i++) {
        const tenDaySlice = pastData.slice(i - 9, i + 1);
        const sum = tenDaySlice.reduce((acc, day) => acc + (day.avgTemp || 0), 0);
        const average = sum / 10;
        movingAverages.push({
            date: pastData[i].date,
            movingAverage: parseFloat(average.toFixed(2)),
        });
    }
    return movingAverages;
}

function findCurrentSeason(movingAverages) {
    if (movingAverages.length === 0) return null;

    const latestMA = movingAverages[movingAverages.length - 1].movingAverage;
    if (latestMA >= 20) return "summer";
    if (latestMA < 5) return "winter";

    if (latestMA >= 5 && latestMA < 20) {
        for (let i = movingAverages.length - 2; i >= 0; i--) {
            const pastMA = movingAverages[i].movingAverage;
            if (pastMA >= 20) return "autumn";
            if (pastMA < 5) return "spring";
        }
        return "autumn";
    }
    return null;
}

export const getSeason = (pastData) => {
    const dataList = pastData?.list;
    if (!dataList || dataList.length < 10) {
        console.warn("계절을 판단하기에 데이터가 충분하지 않습니다. (최소 10일 필요)");
        return null;
    }
    const movingAverages = calculateMovingAverages(dataList);
    return findCurrentSeason(movingAverages);
};