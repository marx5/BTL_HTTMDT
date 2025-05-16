# Hướng dẫn Cài đặt và Chạy Dự án

Dự án này bao gồm một phần backend (Node.js) và một phần frontend (JavaScript framework). Dưới đây là hướng dẫn chi tiết để cài đặt và chạy từng phần.

## Yêu cầu chung

*   [Node.js](https://nodejs.org/) (phiên bản LTS được khuyến nghị)
*   npm (thường được cài đặt cùng với Node.js) hoặc yarn

## Backend (Thư mục `be`)

Phần backend được xây dựng bằng Node.js.

### 1. Cài đặt dependencies

Mở terminal hoặc command prompt, di chuyển vào thư mục `be` và chạy lệnh sau để cài đặt các package cần thiết:

```bash
cd be
npm install
```

Hoặc nếu bạn sử dụng yarn:

```bash
cd be
yarn install
```

### 2. Cấu hình môi trường

*   Có thể bạn cần tạo một file `.env` trong thư mục `be` để cấu hình các biến môi trường (ví dụ: thông tin kết nối database, port, secret keys).
*   Kiểm tra file `config/config.json` hoặc các file tương tự để biết các biến môi trường cần thiết. Một file `.env.example` (nếu có) sẽ cung cấp thông tin hữu ích.

### 3. Chạy Backend

Sau khi cài đặt và cấu hình xong, bạn có thể khởi động server backend bằng lệnh:

```bash
npm start
```

Hoặc nếu có script `dev` trong `package.json` để phát triển:

```bash
npm run dev
```


## Frontend (Thư mục `fee`)

Phần frontend được xây dựng bằng một JavaScript framework (ví dụ: React, Vue, Angular).

### 1. Cài đặt dependencies

Mở một terminal hoặc command prompt mới, di chuyển vào thư mục `fee` và chạy lệnh sau để cài đặt các package cần thiết:

```bash
cd fee
npm install
```

Hoặc nếu bạn sử dụng yarn:

```bash
cd fee
yarn install
```

### 2. Cấu hình môi trường (Nếu có)

*   Một số dự án frontend cũng yêu cầu file `.env` trong thư mục `fee` để cấu hình các biến môi trường (ví dụ: API endpoint của backend).
*   Kiểm tra tài liệu của dự án hoặc tìm file `.env.example` (nếu có).

### 3. Chạy Frontend

Sau khi cài đặt xong, bạn có thể khởi động ứng dụng frontend bằng lệnh (thường là):

```bash
npm start
```

Hoặc:

```bash
npm run dev
```


## Kết nối Backend và Frontend

Thông thường, frontend sẽ được cấu hình để gửi request API đến địa chỉ và port mà backend đang chạy. Đảm bảo rằng:

1.  Server backend đang chạy.
2.  Server frontend đang chạy.