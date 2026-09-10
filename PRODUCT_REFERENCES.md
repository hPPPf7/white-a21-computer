# 第三台主機：產品建模依據

本次建模查核：使用者提供的型號優先；照片用來辨認安裝位置、配色和選擇相近款式。以下推定不代表已核實實機標籤。模型是依產品資料製作的程序化重建，不是原廠 CAD。

| 配件 | 建模款式 | 確認程度與選擇依據 | 原廠資料 |
| --- | --- | --- | --- |
| CPU | AMD Ryzen 5 2600 | 使用者確認。6 核／12 緒、3.4 GHz、AM4。 | [AMD](https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-2000-series/amd-ryzen-5-2600.html) |
| 主機板 | MSI X470 GAMING PRO CARBON | 照片絲印確認；305 × 244 mm，按產品圖加入晶片組散熱片、PCIe、SATA、後方 I/O 和第二 EPS 插座（未接）。 | [MSI](https://www.msi.com/Motherboard/x470-gaming-pro-carbon/Specification) |
| 顯卡 | MSI RTX 3060 Ti GAMING X TRIO | **推定款式**。RTX 3060 Ti 8GB 與 MSI 已確認；背板核心開口、盾形標誌、末端斜條及側面燈條與 GAMING X TRIO 接近。相近的 Gaming Z／LHR 版本無法僅由照片排除。建模採 323 × 140 × 56 mm、TRI FROZR 2 三風扇、TORX 配對葉緣及雙 8-pin。 | [MSI 規格](https://www.msi.com/Graphics-Card/GeForce-RTX-3060-Ti-GAMING-X-TRIO/Specification)、[產品圖](https://storage-asset.msi.com/datasheet/vga/global/GeForce-RTX-3060-Ti-GAMING-X-TRIO.pdf) |
| 散熱器 | AMD Wraith Stealth | **較高可能性推定**。AMD 列為 Ryzen 2600 原配，且照片中的圓形黑框、AMD 上緣標誌及低矮鋁鰭片相符。 | [AMD 原配散熱器](https://www.amd.com/en/support/downloads/drivers.html/processors/ryzen/ryzen-2000-series/amd-ryzen-5-2600.html) |
| RAM | Kingston ValueRAM KVR26N19D8/16 × 2 | **低信心建模選型**。僅 16GB ×2 已確認；無法從照片分辨品牌、時脈。選綠色裸板、雙面 16 顆晶片的實際產品作參考，採 133.35 × 31.25 mm。2666 是參考型號規格，不宣稱實機運作頻率。 | [Kingston 機構圖](https://www.kingston.com/dataSheets/KVR26N19D8_16.pdf) |
| SSD | Intel SSD 760p 256GB | 使用者型號 SSDPEKKW256G8 可對應 Intel 760p。按 M.2 2280、M-key 接點、NAND、控制器及標籤重建。 | [Intel 型號對照](https://cdrdv2-public.intel.com/799333/PCN116062-00.pdf)、[760p 簡介](https://www.intel.com/content/dam/www/public/us/en/documents/product-briefs/ssd-760p-product-brief.pdf) |
| HDD | WD Blue WD10EZEX 1TB | 使用者確認 WD10EZEX-00BBHA0；採 WD10EZEX 147 × 101.6 × 26.1 mm 外殼、沖壓上蓋、PCB、藍白標籤及 SATA 接點。 | [WD](https://www.westerndigital.com/en-ie/products/internal-drives/wd-blue-desktop-sata-hdd?sku=WD10EZEX) |
| 電源 | Cooler Master MWE Bronze 550 | 系列及瓦數已確認，**初代外觀推定**，並非斷言 V1。重建固定出線、風扇格柵、側標及 ATX 機身。 | [Cooler Master](https://www.coolermaster.com/th-th/products/mwe-bronze-550/) |
| 機殼 | COUGAR TURRET RGB | TURRET 由使用者確認，**RGB 版本推定**；官方 RGB 版具有透明前面板與兩顆 RGB 風扇，與目前資訊最接近。 | [COUGAR](https://cougargaming.com/products/cases/turret_rgb/) |
| 前風扇／控制器 | VORTEX RGB FCB 120 ×2／Core Box C | **推定原配組合**。照片風扇有 COUGAR 標記、發光圓環；依 RGB 機殼原配款重建。加入雙側光環、橡膠固定角及控制盒，連線改由風扇進控制器，控制器由電源供電。控制盒實際位置為合理配置假設。 | [FCB 120](https://cougargaming.com/products/cooling/vortex_rgb_fcb120_fan/)、[TURRET RGB](https://cougargaming.com/products/cases/turret_rgb/) |

## 實作與驗證

`src/turret-products.js` 在既有安裝位置上替換通用模型，之後進行靜態合併繪製。配件標籤及機械尺寸依上述資料重建，貼紙圖案簡化，不生成實機序號。推定身分顯示在配置表和游標提示。

已驗證十項配件隔離、三台前後循環、手機 HDD 檢視，以及十二條連線兩端落在對應接頭內。連線端點測試不等於逐接腳或實機裝配認證。桌面預設視角約 128 次繪製呼叫、34,870 個三角形。

