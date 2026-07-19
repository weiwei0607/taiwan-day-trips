# 台灣一日遊行程大全

從板橋／土城出發的台灣一日遊行程規劃工具,收錄 1,000 條行程。

## 功能

- 依地區、預算、交通方式、旅遊風格篩選行程
- 關鍵字搜尋
- 「手氣不錯」隨機推薦行程
- 每條行程含預估費用、交通方式、行程亮點與時間安排

## 如何使用

單一 HTML 檔案,無需建置,直接用瀏覽器開啟即可:

```bash
open index.html
```

或啟動本地伺服器:

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 技術棧

- 純前端單檔應用:HTML + CSS + Vanilla JavaScript,無框架、無外部依賴
- 行程資料以 JavaScript 陣列內嵌於 `index.html`

## 資料維護腳本(一次性工具)

- `merge-batch.js`:合併分批產生的 `data-*.js` 行程資料進 `index.html`(執行前自動備份)
- `recompute_prices.js`:重新計算行程預估價格
- `recompute-no-scooter.js`:移除機車選項後重算價格
- `remove-scooter.js`:自資料中移除機車相關內容

執行方式:`node <script>.js`(會直接修改 `index.html`,請先確認 git 已提交)。
