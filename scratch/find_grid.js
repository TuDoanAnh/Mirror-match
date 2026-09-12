import fs from 'fs';
import { PNG } from 'pngjs';

const data = fs.readFileSync('d:/games/Mirror-match/src/assets/image/Ez_skill.png');
const png = PNG.sync.read(data);

// Let's test standard grid dimensions: 1774 x 887
// 1774 / 12 = 147.83
// 1774 / 10 = 177.4
// 1774 / 8 = 221.75
// 1774 / 14 = 126.7
// Let's check non-empty regions in space_row1 (Y: 500..710)
// Sprite 0: X[53..95] (w=43)
// Sprite 1: X[114..183] (w=70)
// Sprite 2: X[201..292] (w=92)
// Sprite 3: X[306..453] (w=148)
// Sprite 4: X[455..621] (w=167)
// Sprite 5: X[673..1090] (w=418)
// Sprite 6: X[1092..1269] (w=178)
// Sprite 7: X[1272..1429] (w=158)
// Sprite 8: X[1444..1518] (w=75)

// Notice Row 3 & Row 6 have 12 sprites each, around ~51-52px wide!
// Let's check spacing between centers of those 12 sprites in Row 3 (Y: 327..363):
// S0: 68, S1: 162, S2: 266, S3: 400, S4: 553, S5: 723, S6: 921, S7: 1124, S8: 1300, S9: 1449, S10: 1579, S11: 1704
// The spacing grows larger as the effect expands!

// Let's check if the sheet contains spritesheet frames for Q skill energy bolt / blast and Space skill (Trueshot Barrage ultimate crescent wave)!
