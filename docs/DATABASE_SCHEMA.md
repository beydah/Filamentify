# Filamentify Veritabanı Yapısı ve Şema Raporu

Bu döküman, Filamentify projesinin veritabanı yapısını, tablolarını ve sütun detaylarını kapsamlı bir şekilde açıklamaktadır. Projede **SQLite** veritabanı motoru ve **better-sqlite3** kütüphanesi kullanılmaktadır.

## Veritabanı Dosyası
*   **Dosya Adı:** `Filamentify_DB.sqlite`
*   **Konum:** `apps/server/Filamentify_DB.sqlite`

---

## Tablo 1: Category_TB (Kategoriler)
Filamentlerin gruplandırıldığı kategorileri (PLA, ABS, PETG vb.) tutar.

| Sütun Adı | Veri Tipi | Özellikler | Açıklama |
| :--- | :--- | :--- | :--- |
| **ID** | INTEGER | PRIMARY KEY, AUTOINCREMENT | Kategorinin benzersiz kimliği. |
| **Name** | TEXT | NOT NULL, UNIQUE | Kategorinin adı (Örn: PLA). |

---

## Tablo 2: Filament_TB (Filament Envanteri)
Stoktaki tüm filamentlerin detaylarını ve durumlarını tutan ana tablodur.

| Sütun Adı | Veri Tipi | Özellikler | Açıklama |
| :--- | :--- | :--- | :--- |
| **ID** | INTEGER | PRIMARY KEY, AUTOINCREMENT | Filamentin benzersiz kimliği. |
| **CategoryID** | INTEGER | FOREIGN KEY (Category_TB.ID) | Filamentin ait olduğu kategorinin ID'si. |
| **Name** | TEXT | - | Filamentin özel adı (Örn: Siyah PLA Plus). |
| **Color** | TEXT | NOT NULL | Filamentin rengi (Hex formatında: #000000). |
| **Price** | REAL | NOT NULL | Filamentin alış fiyatı. |
| **Gram** | INTEGER | NOT NULL | Filamentin orijinal toplam ağırlığı (gr). |
| **Available_Gram** | INTEGER | NOT NULL | Şu an kalan mevcut ağırlık (gr). |
| **PurchaseDate** | DATETIME | DEFAULT CURRENT_TIMESTAMP | Satın alınma tarihi. |
| **Status** | TEXT | DEFAULT 'Active' | Durum (Active, Empty, vb.). |
| **Refresh_Day** | DATETIME | DEFAULT CURRENT_TIMESTAMP | Son güncelleme/yenilenme tarihi. |
| **Score** | INTEGER | DEFAULT 0 | Kullanım sıklığına göre verilen puan. |

---

## İlişkiler ve Kısıtlamalar
1.  **Kategori İlişkisi:** `Filament_TB.CategoryID` sütunu `Category_TB.ID` sütununa bağlıdır. Bir kategori silinmeden önce o kategoriye ait filament olup olmadığı kontrol edilir.
2.  **Benzersizlik:** Kategori isimleri (`Category_TB.Name`) sistemde benzersiz olmalıdır.
3.  **Otomatik Güncelleme:** `PurchaseDate` ve `Refresh_Day` alanları kayıt anında otomatik olarak o anki zaman damgasını alır.

---

## Veri Tipleri Hakkında Notlar
*   **REAL:** Ondalıklı sayıları (Fiyat vb.) tutmak için kullanılır.
*   **INTEGER:** Tam sayıları (ID, Gram vb.) tutmak için kullanılır.
*   **TEXT:** Metinleri ve Hex kodlarını tutmak için kullanılır.
*   **DATETIME:** SQLite'da genellikle ISO 8601 string formatında saklanır.
