// ============================================================================
// DANH SÁCH TỌA ĐỘ VẬT CẢN (MAP OBSTACLES)
// Bạn có thể tùy chỉnh các thuộc tính của vật cản bên dưới:
// - x: Tọa độ X trung tâm (từ 0 đến 1536)
// - y: Tọa độ Y trung tâm (từ 0 đến 1024)
// - w: Chiều rộng (Width)
// - h: Chiều cao (Height)
// - isPassable: true (Nếu true: Nhân vật có thể đi xuyên qua, không bị chặn vật lý)
// - hideWhenBehind: true (Nếu true: Khi nhân vật ở Y phía trên -> Ẩn/mờ đi đằng sau vật thể; Khi ở Y phía dưới -> Hiện rõ đè lên trước)
// ============================================================================

export const MAP_OBSTACLES = [
  // --- 1. RÀO DẬU & VIỀN BẢN ĐỒ (CHẶN KHÔNG CHO ĐI RA NGOÀI) ---
  { name: 'Forest_Left_Edge', x: 60, y: 512, w: 120, h: 1024 },
  { name: 'Forest_Right_Edge', x: 1476, y: 512, w: 120, h: 1024 },
  { name: 'Fence_Top_Left', x: 337, y: 62, w: 700, h: 120 },
  { name: 'Fence_Top_Right', x: 1168, y: 69, w: 660, h: 120 },
  { name: 'Gate_Top_Back', x: 768, y: 25, w: 216, h: 50 },
  { name: 'Fence_Bottom_Left', x: 367, y: 931, w: 660, h: 185 },
  { name: 'Fence_Bottom_Right', x: 1162, y: 939, w: 660, h: 160 },
  { name: 'Gate_Bottom_Back', x: 768, y: 992, w: 216, h: 64 },

  // --- 2. SÔNG & VÁCH ĐÁ (CHẶN DI CHUYỂN, BỜ SÔNG) ---
  { name: 'River_Left_Top', x: 203, y: 297, w: 165, h: 350 },
  { name: 'River_Left_Bottom', x: 204, y: 707, w: 165, h: 350 },
  { name: 'River_Right_Top', x: 1323, y: 293, w: 170, h: 330 },
  { name: 'River_Right_Bottom', x: 1330, y: 693, w: 160, h: 330 },
  { name: 'Rock_Mountain_BottomLeft', x: 434, y: 704, w: 150, h: 140 },
  { name: 'Rock_Mountain_TopRight', x: 1066, y: 251, w: 125, h: 100 },

  // --- 3. CÂY CỐI & GỖ MỤC ---
  { name: 'Tree_TopLeft_Cluster', x: 479, y: 231, w: 80, h: 90 },
  // KHÚC GỖ BÊN PHẢI TREE_TOPLEFT_CLUSTER: CHO PHÉP ĐI XUYÊN + ẨN KHI Ở PHÍA TRÊN (Y < 231)
  { name: 'Log_TopLeft', x: 565, y: 231, w: 90, h: 50, isPassable: true, hideWhenBehind: true },

  { name: 'Tree_MidLeft_Small', x: 334, y: 314, w: 50, h: 80 },
  { name: 'Tree_CenterLeft', x: 467, y: 510, w: 50, h: 80 },
  { name: 'Log_CenterLeft', x: 523, y: 570, w: 80, h: 50 },
  { name: 'Log_TopRight', x: 1080, y: 355, w: 80, h: 50 },
  { name: 'Tree_CenterRight_Cluster', x: 1115, y: 535, w: 60, h: 90 },
  { name: 'Tree_BottomRight_Small', x: 1013, y: 695, w: 50, h: 60 },
  { name: 'Log_BottomRight', x: 1039, y: 753, w: 80, h: 50 },
  { name: 'Tree_MidTop_Small', x: 572, y: 366, w: 40, h: 60 },
  { name: 'Tree_MidBottom_Small', x: 649, y: 806, w: 40, h: 60 }
];
