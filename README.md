# Web2APK (Cordova Webview) Generator API Nodejs

Sebuah server sederhana berbasis Express.js yang dapat menghasilkan file APK Android dari sebuah URL website menggunakan Apache Cordova melalui API.

---

## 🚀 Fitur

* Menghasilkan APK Android dari URL website dalam bentuk WebView.
* Menerima request POST untuk membuat aplikasi secara dinamis.
* Menggunakan Cordova untuk proses build APK.

---

## 🧰 Kebutuhan

Sebelum menjalankan server ini, pastikan kamu sudah menginstal:

* **Node.js v23.8.0+**
* **NPM 11.3.0+**
* **Cordova** (global)

  ```bash
  npm install -g cordova
  ```
* **Android SDK 34+** [Download](https://developer.android.com)
* **Gradle 8.14** [Download](https://gradle.org/releases/)
* Sudah mengatur environment variable `ANDROID_HOME` dan `PATH` dengan benar

---

## 🛠️ Langkah Instalasi
1. **Clone repositori ini**

   ```bash
   git clone https://github.com/fitri-hy/web2apk-generator-api.git
   cd web2apk-generator-api
   ```

2. **Unduh SDK Android**

    Instal SDK

3. **Unduh Gradle**

    Extrack kedalam ROOT Project `web2apk-generator-api`


4. **Atur path SDK Android dan Gradle**

   Edit bagian berikut di dalam file `index.js`:

   ```js
   const ANDROID_SDK_PATH = 'C:\\Users\\NamaPengguna\\AppData\\Local\\Android\\Sdk';
   const GRADLE_PATH = path.join(__dirname, 'gradle-8.14', 'bin');
   ```

5. **Install dependencies**

   ```bash
   npm install
   ```

   *Lakukan juga di dalam folder `app-template`*
  

---

## 🔄 Cara Menggunakan

### Jalankan server

```bash
node index.js
```

Server akan berjalan di:

```
http://localhost:8800
```

### Endpoint API

#### `POST /generate`

Digunakan untuk membuat file APK dari sebuah URL website.

**Contoh Body Request:**

```json
{
  "appName": "AplikasiSaya",
  "url": "https://example.com"
}
```

**Respons:**

```json
{
  "message": "APK generated",
  "downloadUrl": "http://localhost:8800/download/AplikasiSaya-<id-unik>.apk"
}
```

### Unduh APK

Gunakan `downloadUrl` dari respons untuk mengunduh APK yang sudah dibuat.

---

## 📁 Struktur Folder

```
.
├── app-template/      # Template proyek Cordova
├── gradle-8.14/       # Folder Gradle
├── output/            # Hasil file APK
├── index.js           # Script utama server
└── package.json
```

---

## 📝 Catatan

* Pastikan Android SDK sudah lengkap dengan build-tools dan platform-tools.
* Disarankan menggunakan Cordova Android versi 12.x atau lebih baru.
* Untuk Linux/macOS, ubah path dan separator sesuai sistem.

---

Dibuat dengan ❤️ oleh Fitri-HY
