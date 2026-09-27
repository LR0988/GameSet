# 🎮 Game Set (遊戲組合) - N-Back 大腦記憶訓練 & 經典遊戲套件

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLR0988%2FGameSet)

現代化、高效能的大腦認知功能訓練與休閒小遊戲集合平台。以神經科學認證的 **N-Back 工作記憶訓練 (Dual N-Back)** 為旗艦核心，搭配經典益智小遊戲，並整合 **Supabase 會員管理、雲端排行榜與成績同步**！

---

## 🌟 使用者管理系統 (Supabase Auth & Database)

- **會員認證**：
  - 電子信箱註冊、登入與密碼重設。
  - 客製化玩家暱稱 (Display Name) 與會員專屬頭像。
  - 訪客免登入即玩模式，登入後自動連線雲端資料庫。
- **雲端排行榜 (Global Leaderboard)**：
  - 各項遊戲獨立全球排行榜：N-Back、斯特魯普、2048、貪食蛇。
  - 實時排名與獎牌徽章（金、銀、銅牌）。
- **個人成績中心**：
  - 雲端同步各項遊戲歷史最高分與個人記錄。

---

## 🧠 核心遊戲項目

### 1. 🧠 N-Back 大腦記憶訓練 (旗艦核心)
- **多種訓練模式**：
  - **雙重模式 (Dual N-Back)**：同時呈現「3x3 空間位置」與「聽覺字母語音」，雙通道極限挑戰。
  - **空間位置 (Position N-Back)**：專注視覺空間工作記憶。
  - **聽覺語音 (Audio N-Back)**：專注聽覺語音工作記憶。
- **靈活難度與自適應 (Adaptive Difficulty)**：
  - 支援 1-Back 至 5-Back+。
  - **智慧自適應演算法**：回合正確率 $\ge 80\%$ 自動升級；$< 50\%$ 自動降級穩固神經迴路。
- **即時回饋與科學統計**：
  - 命中 (Hits)、漏答 (Misses)、誤報 (False Alarms) 全面分析。
  - 歷史進度儲存 (LocalStorage & Supabase Cloud) 與最佳積分紀錄。
  - 完整圖解新手教學（按鍵 A、L 快捷鍵支援）。

### 2. ⚡ 斯特魯普抗干擾測驗 (Stroop Effect)
- 心理學經典色彩認知干擾測試。
- 30 秒高強度專注力與大腦反射速度比拼。
- 連擊加分機制與即時音效回饋。

### 3. 🔢 2048 經典益智
- 滑動合併相同數字方塊直至 2048。
- 支援鍵盤方向鍵 (WASD / 箭頭) 與手機觸控滑動手勢。
- 優雅暗黑玻璃擬態 (Glassmorphism) 設計與動畫。

### 4. 🐍 經典復古貪食蛇 (Retro Snake)
- 像素街機風貪食蛇，吃蘋果得分並提高速度。
- 支援手機虛擬 D-pad 手把與鍵盤控制。

---

## 🚀 部署至 Vercel (Deployment)

本專案完全適配 Vercel 零設定快速部署：

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)。
2. 匯入 GitHub 倉庫 `LR0988/GameSet`。
3. Framework Preset 選擇 **Vite**（Vercel 會自動偵測）。
4. 點擊 **Deploy**，約 30 秒即可完成全自動部署上線！

---

## 💻 本地端開發 (Local Development)

```bash
# 1. 安裝依賴
npm install

# 2. 啟動本機開發伺服器
npm run dev

# 3. 專案建置打包
npm run build

# 4. 一鍵推送到 GitHub
npm run upload
```

---

## 🛠️ 技術棧 (Tech Stack)

- **前端框架**：React 19 + TypeScript
- **會員與資料庫**：Supabase Auth & PostgreSQL
- **構建工具**：Vite 5
- **樣式庫**：Tailwind CSS + Glassmorphism UI
- **音效系統**：Web Audio API 原生合成器 + SpeechSynthesis 語音朗讀
- **特效**：Canvas Confetti 慶祝動畫
- **圖標**：Lucide React
