# Dual PC Collection — Three.js

[線上展示](https://hpppf7.github.io/white-a21-computer/) · [GitHub 原始碼](https://github.com/hPPPf7/white-a21-computer)

依照提供的估價單製作的程序化 3D 展示模型；CPU 已改為 **Intel Core i5-13500，14 核／20 緒**。模型以零件外形與合理裝配位置重建，非原廠 CAD，細部造型為近似。處理器位於水冷頭下，型號另標示於模型水冷頭上。

## 第二台主機與切換

同一網站包含 WHITE A21 與黑色 ROG HYPERION，底部左右箭頭循環切換；手機箭頭位於上方。切換會清除配件選取、同步配置表與提示內容，並平滑重新取景。保留兩個檢視開關的狀態。

第二台依新提供的零件清單重建：AMD Ryzen 7 9800X3D、MSI MEG X870E GODLIKE、G.SKILL Trident Z5 Royal Neo 銀色 DDR5-6000 CL28 48GB (24GB × 2)、WD Black SN850X 4TB、AORUS RTX 5090 D XTREME WATERFORCE 32GB、ROG RYUJIN III 360 ARGB Extreme、ROG Hyperion GR701、ROG Thor 1200W Platinum III ATX 3.1，以及 Strimer Wireless 24P／12V-2×6。

UNI FAN TL Wireless 共七顆：頂部 CPU 冷排使用三顆 LCD、後方一顆 LCD、前方 GPU 冷排使用三顆 LED。兩組 AIO 管路各自連至 CPU／GPU，不共用冷卻迴路。LCD 的數字與圖案是示意畫面，非硬體即時讀值。清單中的砌機服務不列為硬體配件。外形與組件位置為程序化近似重建。

參考：[Hyperion 官方尺寸](https://rog.asus.com/us/cases/rog-hyperion-gr701-model/spec/)、[5090 D WATERFORCE 官方資料](https://www.gigabyte.com/hk/Graphics-Card/GV-N509DAORUSX-W-32GD)。

## 啟動

```sh
npm install
npm run dev
```

開啟終端顯示的本機網址。正式建置執行 `npm run build`，輸出在 `dist/`；使用 `npm run preview` 預覽。

原始碼公開於 GitHub，網站使用 GitHub Pages。推送至 main 時會自動建置並發布，也可手動執行 Deploy GitHub Pages 工作流程。`vite.config.js` 使用相對資源路徑，支援專案子目錄。

## 操作

- 左鍵拖曳：環繞旋轉。
- 右鍵或 Shift + 左鍵拖曳：平移。
- 滾輪：縮放。
- 觸控：單指旋轉，雙指縮放與平移。

左上角提供兩個獨立開關，預設關閉：

- **配件提示**：游標移至配件，旁邊顯示配置名稱與規格。玻璃側板可穿透辨識，拖曳時隱藏提示。
- **配置表**：展開九項配置，點選一項只顯示該配件，鏡頭平滑移至適合的距離。再次點選、按返回完整電腦、按 Esc，或關閉配置表，皆會還原整機與先前鏡頭位置。可在獨立檢視中繼續旋轉、平移、縮放，手動拖曳可中止鏡頭動畫。

桌面配置表顯示在左側，手機顯示於下方；模型取景避開面板。系統若設定減少動態效果，鏡頭即時切換。模型可從所有方向觀察；底部視角會隱藏地面，避免遮擋。

## 配置

- Intel Core i5-13500 — 14 核／20 緒
- ASUS TUF GAMING B760M-PLUS WIFI
- ADATA XPG Lancer 白色 DDR5-5600 CL36，16GB × 2
- UMAX M1500 1TB / KLEVV CRAS C710 1TB
- Apexgaming NANOCOOL PRO 240 白色 ARGB 水冷
- GIGABYTE RTX 4070 SUPER AERO OC 12G 白色
- ASUS A21 白色機殼，後置 120mm 風扇 × 1
- Seasonic FOCUS GX-850 ATX 3.0 白色電源

三個機殼／水冷風扇：上方兩個水冷風扇、後方一個排風扇；前方依清單保留網孔進氣，未額外添加風扇。顯示卡的三個風扇朝下。

## 接線細節

- 顯示卡供電從插頭保留直線段，再彎向右側穿線孔，完整延伸到電源艙內的模組化插頭。
- 主機板 24-pin 與 CPU EPS 8-pin 供電穿過背板的實際開孔，沿後方通道連回電源供應器。
- 水冷管兩端設置同軸接頭，連接 CPU 水冷頭與冷排端水室。
- 兩個冷排風扇接 CPU_FAN／CPU_OPT，水泵接 AIO_PUMP，後風扇接 CHA_FAN；ARGB 線另外接 5V ADD_GEN2 分線接頭。
- 機殼前面板 PCB 分別連到 USB 3、F_PANEL 與 AAFP 音效接頭。
- 顯示卡增加 PCB、PCIe 金手指與後方固定支架；冷頭增加接觸底座與固定座。

接頭外觀、精確位置及線材分線仍為展示用近似，不是電氣接腳或實機接線施工圖。插座類型參考 [ASUS 主機板官方手冊](https://www.asus.com/us/supportonly/tuf%20gaming%20b760m-plus%20wifi/helpdesk_manual/)。`window.__computer.connections()` 可供開發時檢查連線名稱及電線端點是否位於對應接头內，畫面不新增 UI。

## 配件細化

CPU：綠色封裝基板、階梯式金屬上蓋、印字、背面接點與電容。主機板：PCB 走線與絲印、CPU 插座、供電元件、電池、DIMM 接點及 SATA 插座。SSD：M.2 PCB、M-key 缺口、金手指、NAND／控制器晶片、品牌標籤。記憶體：薄基板、雙面金手指、白色散熱片及側面圖案。

顯示卡：開孔背板、一體式三風扇外殼、獨立鰭片、熱導管、扭曲葉片、螺絲與影像輸出端口。水冷：端水室與鰭片結構。電源：規格貼紙、底部格柵及模組化插座。大量細小接點使用 InstancedMesh，減少繪製呼叫。記憶體與顯示卡使用專屬近看角度，分別優先顯示散熱片側面、風扇底面。

參考：[ASUS A21 官方外形](https://www.asus.com/us/motherboards-components/cases/asus/asus-a21-case/)、[GIGABYTE AERO 官方資料](https://www.gigabyte.com/Graphics-Card/GV-N407SAERO-OC-12GD/sp)、[XPG Lancer 外形](https://www.xpg.com/uk/xpg/DRAM-modules-LANCER-RGB-DDR5)、[KLEVV C710 產品資料](https://www.klevv.com/HyAdmin/upload/goodFile/Product%20Sheet_SSD_CRAS%20C710_v3_EN.pdf)。零件細節與標記為展示用近似重建，沒有使用原廠 CAD 或逐接腳電氣模型。

技術：Three.js、OrbitControls、Vite。所有幾何、材質、標記及環境都在本地生成，不依賴外部模型、CDN、圖片或 API。`src/main.js` 的 `specification` 保存完整配置。

## 效能調整

重複的風扇葉片、冷排鰭片與水冷管編織環使用 InstancedMesh；文字貼圖共用快取，縮減貼圖與曲面細分。第二台主機於首次切換時才載入並建立，後續切換重用模型。載入失敗會保留目前主機並提示重新整理。

桌面渲染像素比例上限 1.35；窄螢幕或觸控裝置上限 1，並停用即時陰影。桌面陰影只在初次顯示、切換主機及配件隔離／還原時更新。閒置風扇動畫目標 30 FPS，拖曳、滾輪縮放、慣性及鏡頭轉場目標 60 FPS；分頁隱藏時停止繪製。實際幀率仍取決於裝置。

Chrome 同視角量測：WHITE A21 每幀繪製呼叫 953 → 650、三角形 484,454 → 218,678；HYPERION 520 → 464、228,948 → 148,756。以裝置像素比例 2 比較，1440 × 1000 桌面渲染像素量減少約 54%，390 × 844 手機減少 75%。這些是繪圖工作量，並非 FPS 加速倍數；代價是高 DPI 細節及陰影精度降低。
