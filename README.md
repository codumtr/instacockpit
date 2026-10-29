<p align="center">
  <img src="screenshots/cover.png" alt="CODUM InstaCockpit" width="100%">
</p>

<p align="center">
  <b>Instagram İçin Yeni Nesil Glassmorphism DOM Otomasyon & Analiz Kokpiti</b><br>
  <i>Eklenti indirme yok, şifre vermek yok, ban riski sıfır. Klavyenizden F12 tuşuna basın ve arkanıza yaslanın.</i>
</p>

<p align="center">
  <a href="https://codum.tr/instacockpit"><img src="https://img.shields.io/badge/Web_Sitesi-codum.tr-00f0ff?style=for-the-badge&logo=google-chrome" alt="Web Sitesi"></a>
  <img src="https://img.shields.io/badge/Sürüm-v1.0.0_VIP-00ff88?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Platform-Instagram_Web-ff007f?style=for-the-badge&logo=instagram" alt="Platform">
  <img src="https://img.shields.io/badge/Lisans-MIT-white?style=for-the-badge" alt="License">
</p>

---

## ⚡ Kurulum ve Çalıştırma

> ⚠️ **Önemli Not (Instagram Güvenlik Duvarı - Failed to fetch Çözümü):**  
> Instagram, sayfası açıkken F12 konsolundan dış web sitelerine (`github.com`, `raw.githubusercontent.com` vb.) `fetch()` ile harici ağ bağlantısı kurulmasını CSP (Content Security Policy) ile engeller. Bu yüzden aşağıdaki 2 güvenli yöntemden birini kullanın:

### 🌟 1. Yöntem: Tampermonkey ile Tek Tıkla Kur (En Kolay & Kalıcı)
Her defasında F12 konsolu açmak istemiyorsanız:
1. Tarayıcınıza [Tampermonkey](https://www.tampermonkey.net/) eklentisini kurun.
2. [**instacockpit.user.js**](https://raw.githubusercontent.com/codumtr/instacockpit/main/instacockpit.user.js) bağlantısına tıklayın ve çıkan ekranda **"Kur" (Install)** butonuna basın.
3. [Instagram](https://www.instagram.com)'a girdiğinizde kokpit otomatik olarak ekranın sağında hazır açılacaktır!

---

### 💻 2. Yöntem: F12 Konsoluna Doğrudan Kod Yapıştırma (Sıfır Kurulum)
Eklenti kurmadan doğrudan F12 ile çalıştırmak için:

1. **Kodu Alın:**
   - [**codum.tr/instacockpit**](https://codum.tr/instacockpit) adresine gidin ve **"📋 F12 Kodunun Tamamını Kopyala"** butonuna tıklayın.  
   *(Veya bu depodaki [`instacockpit.js`](instacockpit.js) dosyasını açıp sağ üstteki **"Copy raw file"** butonuna basın).*
2. [Instagram](https://www.instagram.com)'da klavyenizden **F12** tuşuna basıp **Konsol (Console)** sekmesine geçin.
3. `Ctrl + V` ile kopyaladığınız kodu yapıştırıp **Enter**'a basın. Kokpit anında açılacaktır!

---

## 📸 Ekran Görüntüleri & Panel Yetenekleri

| 👥 Akıllı Takip Motoru | 🚪 Takipten Çıkma & Beyaz Liste |
| :---: | :---: |
| <img src="screenshots/follow-engine.png" alt="Akıllı Takip" width="380"> | <img src="screenshots/unfollow-engine.png" alt="Takipten Çıkma" width="380"> |
| **Cinsiyet & Spam Korumalı Organik Büyüme** | **Geri Takip Etmeyenleri Ayıklama & Koruma Listesi** |

| ⚡ Reels Beğeni & Kaydırma | 👻 Hayalet Modu (Ghost Suite) |
| :---: | :---: |
| <img src="screenshots/reels-like-engine.png" alt="Reels Otopilot" width="380"> | <img src="screenshots/ghost-mode.png" alt="Hayalet Modu" width="380"> |
| **İzle, Beğen, Kaydır & Canlı Sayaç** | **Gizli Hikaye İzleme & 'Görüldü'süz DM** |

<br>

<p align="center">
  <b>🎛️ Kompakt Sürükle-Bırak Dock Kontrol Paneli</b><br>
  <br>
  <img src="screenshots/dock-rail.png" alt="Dock Rail" width="150"><br>
  <sub><i>Sayfanın sağ tarafına oturan, istenilen yere sürüklenebilen ve canlı işlem sayacı içeren kontrol rayı.</i></sub>
</p>

---

## 🏎️ 5 Kademeli İnsansı Hız Ayarı

Instagram'ın algoritma sınırlarına takılmamak ve spam korumasını aşmak için 5 farklı hız profili:

| Kademe | Hız Adı | Aralık (Gecikme) | Tavsiye Edilen Kullanım |
| :---: | :--- | :--- | :--- |
| **1** | 🛡️ **Ultra Güvenli** | 8.0 - 15.0 sn | Yeni hesaplar ve sıfır risk |
| **2** | 🐢 **Yavaş (Önerilen)** | 5.0 - 9.0 sn | Günlük organik hesap büyütme |
| **3** | ⚖️ **Dengeli** | 3.5 - 6.5 sn | Standart hesaplar için ideal tempo |
| **4** | ⚡ **Hızlı** | 2.0 - 4.0 sn | Acil temizlik ve toplu etkileşim |
| **5** | 🔥 **Turbo** | 1.0 - 2.0 sn | Maksimum hız (Dikkatli kullanın) |

---

## 🔒 Güvenlik & Gizlilik Politikası

- **Şifresiz Mimari:** Instagram kullanıcı adı veya şifrenizi asla talep etmez.
- **Yerel DOM:** Tüm işlemler doğrudan sizin açık sekmenizdeki tarayıcı belleğinde çalışır.
- **Sıfır Sunucu Kaydı:** Çerezleriniz veya hesap bilgileriniz hiçbir dış sunucuya gönderilmez.

---

## 🌐 Resmi Dağıtım & İletişim

- **Resmi Web Sitesi:** [codum.tr/instacockpit](https://codum.tr/instacockpit)
- **Twitter / X:** [@codumtr](https://x.com/codumtr)
- **Lisans:** MIT License — © 2026 CODUM.TR
