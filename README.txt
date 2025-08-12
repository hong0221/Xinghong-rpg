# 信宏 RPG（v2.1）上傳說明
1) 把整個資料夾所有檔案上傳到 GitHub repo 根目錄（覆蓋舊檔）
2) Firestore 規則（開發）建議：
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progress/{doc} { allow read: if true; allow write: if request.auth != null; }
    match /{document=**} { allow read: if true; allow write: if false; }
  }
}
3) 在 Firestore 建 packs/levels（至少 starter-pack 與 L-101~）
4) 打開 Pages 網址重新載入，如未更新：清除快取或稍等 SW 更新
