const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh (html, css, js)
app.use(express.static(path.join(__dirname)));

app.post('/auto-save-txt', async (req, res) => {
  try {
    const data = req.body;
    
    const sep = '═'.repeat(52);
    const line = '─'.repeat(52);
    
    const noteContent = [
      sep,
      '  CHECKIP – BÁO CÁO THÔNG TIN ĐỊA CHỈ IP',
      sep,
      `  Thời gian lưu : ${data.timeLocal || new Date().toLocaleString('vi-VN')}`,
      '',
      '📡 THÔNG TIN IP',
      line,
      `  Địa chỉ IP    : ${data.ip || '—'}`,
      `  Phiên bản     : ${data.version || '—'}`,
      `  ASN           : ${data.asn || '—'}`,
      `  ISP / Tổ chức : ${data.org || '—'}`,
      '',
      '📍 VỊ TRÍ ĐỊA LÝ',
      line,
      `  Quốc gia      : ${data.country_name || '—'} (${data.country_code || '—'})`,
      `  Châu lục      : ${data.continent_code || '—'}`,
      `  Vùng / Tỉnh   : ${data.region || '—'} (${data.region_code || '—'})`,
      `  Thành phố     : ${data.city || '—'}`,
      `  Mã bưu điện   : ${data.postal || '—'}`,
      `  Vĩ độ         : ${data.latitude ?? '—'}`,
      `  Kinh độ       : ${data.longitude ?? '—'}`,
      `  Mã quốc tế    : ${data.calling_code ? '+' + data.calling_code : '—'}`,
      '',
      '🕐 MẠNG & THỜI GIAN',
      line,
      `  Múi giờ       : ${data.timezone || '—'}`,
      `  UTC offset    : ${data.utc_offset || '—'}`,
      `  Giờ địa phương: ${data.timeRemote || '—'}`,
      '',
      '💻 TRÌNH DUYỆT & HỆ THỐNG',
      line,
      `  Trình duyệt   : ${data.browser || '—'}`,
      `  Hệ điều hành  : ${data.os || '—'}`,
      `  Ngôn ngữ máy  : ${data.language || '—'}`,
      `  Màn hình      : ${data.screen || '—'}`,
      `  Độ sâu màu    : ${data.colorDepth || '—'}`,
      `  CPU Cores     : ${data.cpuCores || '—'}`,
      `  RAM           : ${data.ram || '—'}`,
      `  Cảm ứng       : ${data.touchSupport || '—'}`,
      `  Canvas Hash   : ${data.canvasFingerprint || '—'}`,
      `  Múi giờ máy   : ${data.localTZ || '—'}`,
      `  User-Agent    : ${data.userAgent || '—'}`,
      '',
      sep,
      `  Tạo bởi CheckIP · ${new Date().toISOString()}`,
      sep,
      '\n\n' // Thêm khoảng trống giữa các lần lưu
    ].join('\n');

    // Đường dẫn lưu file note.txt trong thư mục hiện tại
    const filePath = path.join(__dirname, 'note.txt');
    
    // Ghi cộng dồn (append) vào file
    fs.appendFileSync(filePath, noteContent, 'utf8');

    console.log(`[Success] Đã tự động lưu thông tin IP ${data.ip} vào note.txt`);

    // Lưu vào Google Sheets nếu có cấu hình URL
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (sheetUrl) {
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        console.log(`[Success] Đã đồng bộ IP ${data.ip} lên Google Sheets`);
      } catch (sheetErr) {
        console.error('[Error] Lỗi khi lưu lên Google Sheets:', sheetErr);
      }
    }

    res.json({ success: true, message: 'Đã lưu file txt thành công!' });
  } catch (error) {
    console.error('[Error] Lỗi khi xử lý:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log('Bạn có thể truy cập trang web qua link trên để sử dụng!');
});
