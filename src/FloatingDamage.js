import Phaser from 'phaser';

/**
 * Hiển thị hiệu ứng số sát thương bay (Floating Combat Text)
 * @param {Phaser.Scene} scene 
 * @param {number} x 
 * @param {number} y 
 * @param {number|string} textValue 
 * @param {string} type - 'normal' | 'crit' | 'heal' | 'shield' | 'root'
 */
export function showDamageText(scene, x, y, textValue, type = 'normal') {
  if (!scene || !scene.add) return;

  let fontSize = '16px';
  let fill = '#ffffff';
  let stroke = '#000000';
  let strokeThickness = 3;
  let fontStyle = 'bold';
  let startScale = 1.0;
  let targetScale = 1.0;
  let offsetY = -38;
  let prefix = '';

  const roundedVal = typeof textValue === 'number' ? Math.round(textValue) : textValue;

  if (type === 'crit') {
    fontSize = '23px';
    fill = '#fbbf24'; // Vàng cam chí mạng
    stroke = '#7c2d12';
    strokeThickness = 4;
    startScale = 1.6;
    targetScale = 1.0;
    prefix = '💥 ';
  } else if (type === 'heal') {
    fontSize = '15px';
    fill = '#34d399'; // Xanh lá hồi máu
    stroke = '#064e3b';
    strokeThickness = 3;
    prefix = '+';
  } else if (type === 'shield') {
    fontSize = '15px';
    fill = '#facc15'; // Vàng lá chắn
    stroke = '#78350f';
    strokeThickness = 3;
    prefix = '🛡️ ';
  } else if (type === 'root') {
    fontSize = '14px';
    fill = '#e879f9'; // Tím trói chân
    stroke = '#4c1d95';
    strokeThickness = 3;
  }

  // Offset ngẫu nhiên nhẹ để nhiều dòng sát thương không bị đè hoàn toàn lên nhau
  const rx = x + Phaser.Math.Between(-16, 16);
  const ry = y + Phaser.Math.Between(-8, 8);

  const txtObj = scene.add.text(rx, ry, `${prefix}${roundedVal}`, {
    fontSize,
    fill,
    fontStyle,
    stroke,
    strokeThickness,
    shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, stroke: true, fill: true }
  }).setOrigin(0.5).setDepth(200);

  txtObj.setScale(startScale);

  // Hiệu ứng bay lên và mờ dần (Tween)
  scene.tweens.add({
    targets: txtObj,
    y: ry + offsetY,
    scaleX: targetScale,
    scaleY: targetScale,
    alpha: { start: 1, end: 0 },
    duration: type === 'crit' ? 950 : 750,
    ease: type === 'crit' ? 'Back.easeOut' : 'Power1',
    onComplete: () => {
      txtObj.destroy();
    }
  });
}
