# Web2APK (Cordova Webview) Generator API Nodejs

Sebuah server sederhana berbasis Express.js yang dapat menghasilkan file APK Android dari sebuah URL website menggunakan Apache Cordova melalui API.

---

## 🚀 Fitur

- Membuat APK Android dari URL website.
- Upload logo PNG (via form-data) atau dari URL (via body JSON).
- Link download APK langsung tersedia setelah build.
- Build otomatis dengan Cordova + SDK Android + Gradle.
- Bersih-bersih otomatis folder build sementara.

---

## 🧰 Kebutuhan

Sebelum menjalankan server ini, pastikan kamu sudah menginstal:

* **Node.js v23.8.0+**
* **NPM 11.3.0+**
* **Android SDK 34+**
* **Gradle 8.14+**
* **Cordova** (global)

  ```bash
  npm install -g cordova
  ```

---

## 🛠️ Instalasi

1. **Clone & masuk ke folder**
   ```bash
   git clone https://github.com/fitri-hy/web2apk-generator-api.git
   cd web2apk-generator-api
   ```

2. **Install dependensi**

   ```bash
   npm install
   ```
   > *Lakukan juga di dalam folder `app-template`*

3. **Atur path SDK Android dan Gradle**

   Buka folder `config/paths.js` dan bagian berikut:

   ```js
   ANDROID_SDK_PATH: 'C:\\Users\\Name-PC\\AppData\\Local\\Android\\Sdk',
   GRADLE_PATH: path.join(__dirname, '../gradle-8.14/bin')
   ```

4. **Jalankan server**

   ```bash
   node index.js
   ```

---

## 🧪 Pengujian API

### ✅ Metode 1: Form-Data (Upload File)

Gunakan jika ingin mengunggah logo secara langsung.

#### 🔸 Header

```
Content-Type: multipart/form-data
```

#### 🔸 Form Fields

| Field    | Wajib    | Keterangan                 |
| -------- | -------- | -------------------------- |
| appName  | ✅        | Nama aplikasi Android      |
| url      | ✅        | URL yang dimuat di WebView |
| logoFile | opsional | File logo PNG (.png saja)  |

#### 🧪 Contoh via Postman

* Method: `POST`
* URL: `http://localhost:8800/generate`
* Body > form-data:

  * `appName`: `ContohApp`
  * `url`: `https://example.com`
  * `logoFile`: (Upload file PNG)

#### 📤 Respons

```json
{
  "message": "APK generated",
  "downloadUrl": "http://localhost:8800/download/ContohApp-abc123.apk"
}
```

---

### ✅ Metode 2: Body JSON (Pakai logo dari URL)

Gunakan jika tidak ingin upload logo, cukup pakai URL PNG.

#### 🔸 Header

```
Content-Type: application/json
```

#### 🔸 Body (raw JSON)

```json
{
  "appName": "MyWebApp",
  "url": "https://your-site.com",
  "logoUrl": "https://your-site.com/images/logo.png"
}
```

> Logo harus berformat PNG dan dapat diakses publik.

#### 🧪 Contoh via curl

```bash
curl -X POST http://localhost:8800/generate \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "MyWebApp",
    "url": "https://your-site.com",
    "logoUrl": "https://your-site.com/images/logo.png"
}'
```

---

## ⚠️ Validasi & Error

* ❌ `400` jika `appName`/`url` tidak dikirim.
* ❌ `400` jika file logo bukan PNG.
* ❌ `500` jika gagal build APK.
* ⚠️ Logo bisa di-skip, tapi hasil APK pakai ikon default.

---

## 📁 Output

APK hasil build disimpan di folder:

```
/output
```

Bisa diunduh dari:

```
http://localhost:8800/download/{nama-file.apk}
```

---

## 🧹 Otomatis Bersih-Bersih

Folder sementara otomatis dihapus setelah proses build selesai atau jika terjadi error.

---

## 📁 Struktur Folder

```
web2apk-generator-api/
│
├── app-template/
├── config/
├── middleware/
├── node_modules/
├── output/
├── routes/
├── temps/
├── utils/
├── gradle-8.14
├── index.js
├── package.json
└── README.md
```