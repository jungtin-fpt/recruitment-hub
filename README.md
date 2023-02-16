# Recruitment Hub

Mini project được làm trong môn SWD - Software Architecture & Design

## Miêu tả

> Đề bài yêu cầu crawl data từ các trang tìm việc (CareerBuilder, TopCV, v.v.) sau đó bắt đầu phần tích.
> Cụ thể là đề bài yêu cầu quản lý con crawler để có thể start, stop, báo lỗi. 
> Vì thầy dễ nên mình biến tấu lại theo ý mình xíu, mình nhắm vào Ease of Use, UX, và tập trung làm con crawl cho người bth sử dụng
> , nên là phần hoàn thiện vẫn còn thiếu nhiều tính năng cần thiết để manage con crawler

## Tính năng

- Crawl dễ dàng như search google
- Dễ dàng tracking tình trạng crawler với realtime log streaming ở Dashboard
- Phân tích thông minh trên dữ liệu đã cào các chỉ số công việc trên vùng miền, kĩ năng, mức lương, cấp bậc, phương thức làm việc & công ty
- Bóc tách thông minh JD và phân tích từ khoá trending hiện tại
- Quản lý các keyword bởi QTV
- Export PDF dữ liệu đã phân tích
- Lưu và cache dữ liệu & phân tích

## Cài đặt
1. Clone repository
2. Cài đặt MySQL & Import Data từ [MySQL Import](https://github.com/jungtin01/recruitment-hub-deploy/blob/master/db/mysql_backup/rhub.sql)
3. Cài đặt DB Env ở _ormconfig.json & .env
4. Chạy `npm install` & `npm run dev`

## Deploy trên Ubuntu VPS
Tham khảo [Recruitment Hub Deploy](https://github.com/jungtin01/recruitment-hub-deploy) & Debug thằng puppeteer trên linux maybe phải install thằng chromium thì nó mới chạy chứ không thì nó bị lỗi. Tham khảo [Install Chromium WSL2](https://jungtin.notion.site/sudo-apt-get-install-chromium-browser-b41a577350ce41f98ba66ac9e0510fb4)

## Screenshots

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/1.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/2.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/3.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/4.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/5.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/6.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/7.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/8.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/9.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/10.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/11.jpg">
</p>

<p align="center">
  <img src="https://github.com/jungtin01/recruitment-hub/blob/master/readme/12.jpg">
</p>
