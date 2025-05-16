const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Về chúng tôi</h3>
            <p>
              Shop thời trang chất lượng, phong cách hiện đại, giá cả hợp lý.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Liên kết nhanh</h3>
            <ul>
              <li>
                <a href="/" className="hover:text-primary">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="/cart" className="hover:text-primary">
                  Giỏ hàng
                </a>
              </li>
              <li>
                <a href="/orders" className="hover:text-primary">
                  Đơn hàng
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
            <p>Email: support@fashionstore.com</p>
            <p>Hotline: 0901234567</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
