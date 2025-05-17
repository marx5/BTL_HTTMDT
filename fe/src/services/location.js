// import api from './api';
// import axios from 'axios';

// // API URL cho dữ liệu địa chỉ Việt Nam
// const VIETNAM_API_URL = 'https://provinces.open-api.vn/api';

// // Lấy danh sách tỉnh/thành phố
// export const getProvinces = async () => {
//   try {
//     const response = await axios.get(`${VIETNAM_API_URL}/p`);
//     return response.data;
//   } catch (error) {
//     console.error('Lỗi khi lấy danh sách tỉnh/thành phố:', error);
//     throw error;
//   }
// };

// // Lấy danh sách quận/huyện theo mã tỉnh/thành phố
// export const getDistrictsByProvinceCode = async (provinceCode) => {
//   try {
//     const response = await axios.get(`${VIETNAM_API_URL}/p/${provinceCode}?depth=2`);
//     return response.data.districts || [];
//   } catch (error) {
//     console.error('Lỗi khi lấy danh sách quận/huyện:', error);
//     throw error;
//   }
// };

// // Lấy danh sách xã/phường theo mã quận/huyện
// export const getWardsByDistrictCode = async (districtCode) => {
//   try {
//     const response = await axios.get(`${VIETNAM_API_URL}/d/${districtCode}?depth=2`);
//     return response.data.wards || [];
//   } catch (error) {
//     console.error('Lỗi khi lấy danh sách xã/phường:', error);
//     throw error;
//   }
// };

// // Lấy tất cả dữ liệu của một tỉnh (bao gồm quận/huyện và xã/phường)
// export const getFullProvinceData = async (provinceCode) => {
//   try {
//     const response = await axios.get(`${VIETNAM_API_URL}/p/${provinceCode}?depth=3`);
//     return response.data;
//   } catch (error) {
//     console.error('Lỗi khi lấy dữ liệu đầy đủ của tỉnh:', error);
//     throw error;
//   }
// };