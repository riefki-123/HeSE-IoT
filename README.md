# HEALTH SAFETY ENVIROMENT SCANNER (HeSE)
Proyek IoT untuk keselamatan pekerja konstruksi sebelum masuk ke area dilakukan scan melalui
portal website yang telah kami buat dengan menggunakan algoritma YOLO

## Instalasi
1. Clone Proyek ini di Aplikasi Editor Code kesayangan anda
'''bash
git clone https://github.com/riefki-123/HeSE-IoT
'''
2. Kemudian buatlah sebuah env
'''bash
python -m venv env
'''
3. Setelah membuat env lanjut instalasi library yang sudah saya sediakan pada file requirements.txt
'''bash
pip install -r requirements.txt
'''
4. Karena ini menggunakan Algoritma YOLO pastikan anda sudah membuat train data YOLOv5 antara lain:
- Helmet
- No Helmet
- Vest
- No Vest
- Person
- No Person

## Kontribusi
Kami terbuka untuk Pull request. Untuk perubahan, pertama silahkan buka sebuah issue terlebih dahulu untuk melakukan diskusi apa yang kamu ingin ubah.

## License
[MIT]
