# AWS CloudShell ile S3 ve IAM Kurulum Rehberi (Step-by-Step)

Bu rehber, AWS Management Console üzerindeki **AWS CloudShell**'i (tarayıcı tabanlı terminal) kullanarak S3 bucket oluşturma, izinleri yapılandırma, IAM kullanıcısı tanımlama ve API erişim anahtarları (Access & Secret Key) alma işlemlerini en hızlı ve kolay şekilde yapmanızı sağlar.

---

## Adım 1: AWS CloudShell'i Başlatın
1. AWS Management Console'a giriş yapın.
2. Ekranın sağ üst köşesindeki **CloudShell** simgesine (siyah renkli terminal simgesi `>_`) tıklayın.
3. Terminalin hazır hale gelmesini bekleyin (birkaç saniye sürebilir).

---

## Adım 2: S3 Kova (Bucket) Yapılandırma

Bu proje için kullanılacak bucket:
- **Bucket name:** `gstockfootage-media`
- **Region:** `us-east-1`
- **Folder/prefix:** `kidsbible-content/`

### 1. Public erişim ayarı
Eğer medya dosyalarını doğrudan URL ile göstereceksen:
- `Block all public access` kapalı olmalı
- Bucket policy ile yalnızca `kidsbible-content/*` okuma izni vermelisin

### 2. Public read policy
AWS Console > S3 > `gstockfootage-media` > `Permissions` > `Bucket policy` alanına şu içeriği koy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadKidsBibleContent",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::gstockfootage-media/kidsbible-content/*"
    }
  ]
}
```

---

## Adım 3: IAM Kimlik Bilgilerini Alma ve İzinleri Tanımlama

Sistemin AWS'ye bağlanıp dosya yükleyebilmesi için bir API kullanıcısı (IAM User) oluşturuyoruz:

### 1. IAM Identity Center oturumunu açın
AWS Console'daki IAM Identity Center ekranından geçici kimlik bilgilerini alın.

### 2. Geçici kimlik bilgilerini not edin
Elinizde şu üç değer olmalı:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

---

## Adım 4: BibleCMS Panelinde Kullanma
1. **BibleCMS Admin Paneli**'ne girin.
2. Sol menüdeki **AWS Upload Panel** sekmesine gidin.
3. Ayarlar alanına aşağıdaki bilgileri girin:
   - **AWS S3 Bucket:** `gstockfootage-media`
   - **AWS Access Key ID:** geçici `AWS_ACCESS_KEY_ID`
   - **AWS Secret Access Key:** geçici `AWS_SECRET_ACCESS_KEY`
   - **AWS Session Token:** geçici `AWS_SESSION_TOKEN`
   - **AWS Region:** `us-east-1`
4. Sağ taraftaki formdan dosyayı seçip **Upload to AWS** butonuna tıklayın. Yükleme tamamlandığında size kopyalamanız için bir S3 URL'si verecektir.

---
*Not: Bilgileri kalıcı olarak sunucuya kaydetmek isterseniz, projenin kök dizinindeki `.env` dosyasına şu şekilde ekleyebilirsiniz:*
```env
AWS_ACCESS_KEY_ID=replace_me
AWS_SECRET_ACCESS_KEY=replace_me
AWS_SESSION_TOKEN=replace_me
AWS_REGION=us-east-1
AWS_S3_BUCKET=gstockfootage-media
AWS_S3_PREFIX=kidsbible-content
```
