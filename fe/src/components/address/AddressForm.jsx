import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { addAddress, updateAddress } from '../../services/address';
import Button from '../common/Button';
import Input from '../common/Input';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AddressForm = ({ address, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    country: 'Việt Nam',
    isDefault: false,
  });
  
  // Lưu trữ dữ liệu địa chỉ từ API
  const [addressOptions, setAddressOptions] = useState({
    provinces: [],
    districts: [],
    wards: []
  });
  
  // Lưu trữ dữ liệu địa chỉ đã chọn
  const [selectedAddress, setSelectedAddress] = useState({
    province: '',
    district: '',
    ward: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const isEditing = !!address?.id; // Kiểm tra xem có phải đang sửa không

  // Điền thông tin sẵn có nếu đang sửa địa chỉ
  useEffect(() => {
    if (address && Object.keys(address).length > 0) {
      // Tải dữ liệu tỉnh/thành phố
      fetchProvinces();
      
      // Thiết lập dữ liệu cơ bản
      setFormData({
        fullName: address.fullName || '',
        phone: address.phone || '',
        addressLine: address.addressLine || '',
        city: address.city || '',
        state: address.state || '',
        country: address.country || 'Việt Nam',
        isDefault: address.isDefault || false,
      });
      
      // Tách địa chỉ chi tiết để lấy phường/xã nếu có
      let detailedAddress = address.addressLine || '';
      let extractedWard = '';
      
      // Tìm tên xã/phường trong địa chỉ chi tiết
      const wardMatch = detailedAddress.match(/,\s*([^,]+)$/);
      if (wardMatch) {
        extractedWard = wardMatch[1].trim();
        // Loại bỏ phần phường/xã khỏi địa chỉ chi tiết
        detailedAddress = detailedAddress.replace(/,\s*[^,]+$/, '').trim();
        
        // Cập nhật địa chỉ chi tiết không có phường/xã
        setFormData(prev => ({
          ...prev,
          addressLine: detailedAddress
        }));
      }

      // Nếu có state/province, thiết lập và tải quận/huyện
      if (address.state) {
        setSelectedAddress(prev => ({ 
          ...prev, 
          province: address.state,
          district: address.city || '',
          ward: extractedWard || ''
        }));
      }
    } else {
      // Tải dữ liệu tỉnh/thành phố khi khởi tạo
      fetchProvinces();
    }
  }, [address]);

  // API để lấy tỉnh/thành phố
  const fetchProvinces = async () => {
    setLoadingAddress(true);
    try {
      const response = await axios.get('https://provinces.open-api.vn/api/p/');
      setAddressOptions(prev => ({
        ...prev,
        provinces: response.data
      }));
    } catch (error) {
      console.error('Không thể tải danh sách tỉnh/thành phố', error);
      toast.error('Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setLoadingAddress(false);
    }
  };

  // API để lấy quận/huyện dựa trên tỉnh/thành phố đã chọn
  const fetchDistricts = useCallback(async (provinceName) => {
    setLoadingAddress(true);
    try {
      const province = addressOptions.provinces.find(p => p.name === provinceName);
      if (province) {
        const response = await axios.get(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
        setAddressOptions(prev => ({
          ...prev,
          districts: response.data.districts || []
        }));
      }
    } catch (error) {
      console.error('Không thể tải danh sách quận/huyện', error);
      toast.error('Không thể tải danh sách quận/huyện');
    } finally {
      setLoadingAddress(false);
    }
  }, [addressOptions.provinces]);

  // Tải lại dữ liệu districts khi province thay đổi
  useEffect(() => {
    if (selectedAddress.province && addressOptions.provinces.length > 0) {
      fetchDistricts(selectedAddress.province);
    }
  }, [selectedAddress.province, addressOptions.provinces, fetchDistricts]);

  // API để lấy phường/xã dựa trên quận/huyện đã chọn
  const fetchWards = useCallback(async (districtName) => {
    setLoadingAddress(true);
    try {
      const province = addressOptions.provinces.find(p => p.name === selectedAddress.province);
      if (!province) return;
      
      const district = addressOptions.districts.find(d => d.name === districtName);
      if (district) {
        const response = await axios.get(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`);
        setAddressOptions(prev => ({
          ...prev,
          wards: response.data.wards || []
        }));
      }
    } catch (error) {
      console.error('Không thể tải danh sách phường/xã', error);
      toast.error('Không thể tải danh sách phường/xã');
    } finally {
      setLoadingAddress(false);
    }
  }, [addressOptions.provinces, addressOptions.districts, selectedAddress.province]);

  // Tải lại dữ liệu wards khi districts thay đổi
  useEffect(() => {
    if (selectedAddress.district && addressOptions.districts.length > 0) {
      fetchWards(selectedAddress.district);
    }
  }, [selectedAddress.district, addressOptions.districts, fetchWards]);

  // Kiểm tra xác thực form
  const validateForm = () => {
    const newErrors = {};
    
    // Xác thực họ tên
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }
    
    // Xác thực số điện thoại
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
    }
    
    // Xác thực tỉnh/thành phố
    if (!selectedAddress.province) {
      newErrors.province = 'Vui lòng chọn tỉnh/thành phố';
    }
    
    // Xác thực quận/huyện
    if (!selectedAddress.district) {
      newErrors.district = 'Vui lòng chọn quận/huyện';
    }
    
    // Xác thực phường/xã
    if (!selectedAddress.ward) {
      newErrors.ward = 'Vui lòng chọn phường/xã';
    }
    
    // Xác thực địa chỉ chi tiết
    if (!formData.addressLine.trim()) {
      newErrors.addressLine = 'Vui lòng nhập địa chỉ chi tiết';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Xử lý các dropdown địa chỉ
    if (name === 'province' || name === 'district' || name === 'ward') {
      // Cập nhật giá trị cho selectedAddress
      if (name === 'province' && value) {
        // Nếu thay đổi tỉnh/thành phố, reset quận/huyện và phường/xã
        setSelectedAddress(prev => ({
          ...prev,
          province: value,
          district: '',
          ward: ''
        }));
      } else if (name === 'district' && value) {
        // Nếu thay đổi quận/huyện, reset phường/xã
        setSelectedAddress(prev => ({
          ...prev,
          district: value,
          ward: ''
        }));
      } else {
        // Cập nhật bình thường cho các trường khác
        setSelectedAddress(prev => ({
          ...prev,
          [name]: value
        }));
      }
      
      // Cập nhật state và city dựa trên lựa chọn địa chỉ
      updateFormDataFromSelection({
        ...selectedAddress,
        [name]: value
      });
    } else {
      // Cập nhật giá trị cho form (các trường còn lại)
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    
    // Đánh dấu trường đã được chạm vào
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };
  
  // Cập nhật formData dựa trên lựa chọn địa chỉ
  const updateFormDataFromSelection = (selection) => {
    const { province, district, ward } = selection;
    
    // Lưu tỉnh/thành phố vào state
    if (province) {
      setFormData(prev => ({
        ...prev,
        state: province
      }));
    }
    
    // Gộp quận/huyện vào city
    if (district) {
      setFormData(prev => ({
        ...prev,
        city: district
      }));
    }
  };
  
  // Kiểm tra lỗi khi rời khỏi trường input
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Kiểm tra từng trường
    validateField(name);
  };
  
  // Kiểm tra lỗi cho một trường cụ thể
  const validateField = (fieldName) => {
    const fieldErrors = {};
    
    switch (fieldName) {
      case 'fullName':
        if (!formData.fullName.trim()) {
          fieldErrors.fullName = 'Vui lòng nhập họ và tên';
        }
        break;
        
      case 'phone':
        if (!formData.phone.trim()) {
          fieldErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.trim())) {
          fieldErrors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
        }
        break;
        
      case 'province':
        if (!selectedAddress.province) {
          fieldErrors.province = 'Vui lòng chọn tỉnh/thành phố';
        }
        break;
        
      case 'district':
        if (!selectedAddress.district) {
          fieldErrors.district = 'Vui lòng chọn quận/huyện';
        }
        break;
        
      case 'ward':
        if (!selectedAddress.ward) {
          fieldErrors.ward = 'Vui lòng chọn phường/xã';
        }
        break;
        
      case 'addressLine':
        if (!formData.addressLine.trim()) {
          fieldErrors.addressLine = 'Vui lòng nhập địa chỉ chi tiết';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      ...fieldErrors
    }));
    
    return Object.keys(fieldErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Đánh dấu tất cả các trường đã chạm vào
    const allFields = ['fullName', 'phone', 'addressLine', 'province', 'district', 'ward'];
    const allTouched = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Xác thực form trước khi gửi
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // Nếu có lỗi, không tiếp tục
    if (Object.keys(formErrors).length > 0) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    // Chuẩn bị dữ liệu địa chỉ đầy đủ cho backend
    // Đảm bảo không gửi các trường không được phép
    const { province, district, ward } = selectedAddress;
    
    // Tạo địa chỉ chi tiết đầy đủ (thêm phường/xã vào)
    let fullAddressLine = formData.addressLine;
    if (ward && !fullAddressLine.includes(ward)) {
      fullAddressLine = `${fullAddressLine}, ${ward}`;
    }

    const addressData = {
      ...formData,
      addressLine: fullAddressLine,
      state: province,
      city: district,
      // Loại bỏ các trường không được backend chấp nhận
      district: undefined,
      ward: undefined
    };
    
    setIsSubmitting(true);

    try {
      let response;
      
      if (isEditing) {
        // Nếu đang sửa, gọi API cập nhật
        response = await updateAddress(address.id, addressData);
        const updatedAddress = response.data.address;
        toast.success('Cập nhật địa chỉ thành công');
        
        if (typeof onSuccess === 'function') {
          onSuccess(updatedAddress);
        }
      } else {
        // Nếu đang thêm mới
        response = await addAddress(addressData);
        const newAddress = response.data.address;
        toast.success('Thêm địa chỉ thành công');
        
        if (typeof onSuccess === 'function') {
          onSuccess(newAddress);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Không thể xử lý địa chỉ. Vui lòng thử lại.';
      toast.error(errorMsg);
      
      // Xử lý lỗi từ server
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          serverErrors[error.field] = error.message;
        });
        setErrors(prev => ({
          ...prev,
          ...serverErrors
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        {isEditing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.fullName && errors.fullName ? errors.fullName : null}
              required
              placeholder="Nhập họ và tên"
              className={`hover:border-blue-400 focus:border-blue-500 transition-colors ${touched.fullName && errors.fullName ? 'border-red-500' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone && errors.phone ? errors.phone : null}
              required
              placeholder="Nhập số điện thoại"
              className={`hover:border-blue-400 focus:border-blue-500 transition-colors ${touched.phone && errors.phone ? 'border-red-500' : ''}`}
            />
          </div>
        </div>

        {/* Phần địa chỉ theo thứ tự từ lớn đến nhỏ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quốc gia <span className="text-red-500">*</span>
          </label>
          <div className={`border rounded-md px-3 py-2 bg-gray-100 text-gray-700 ${touched.country && errors.country ? 'border-red-500' : 'border-gray-300'}`}>
            {formData.country || 'Việt Nam'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Hiện tại chỉ hỗ trợ địa chỉ tại Việt Nam</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <select
              name="province"
              value={selectedAddress.province}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={loadingAddress || addressOptions.provinces.length === 0}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.province && errors.province 
                  ? 'border-red-500' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <option value="">-- Chọn Tỉnh/Thành phố --</option>
              {addressOptions.provinces.map(province => (
                <option key={province.code} value={province.name}>
                  {province.name}
                </option>
              ))}
            </select>
            {touched.province && errors.province && (
              <p className="text-red-500 text-xs mt-1">{errors.province}</p>
            )}
            {loadingAddress && selectedAddress.province === '' && (
              <p className="text-xs text-gray-500 mt-1">Đang tải danh sách tỉnh/thành phố...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <select
              name="district"
              value={selectedAddress.district}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={!selectedAddress.province || loadingAddress || addressOptions.districts.length === 0}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.district && errors.district 
                  ? 'border-red-500' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <option value="">-- Chọn Quận/Huyện --</option>
              {addressOptions.districts.map(district => (
                <option key={district.code} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
            {touched.district && errors.district && (
              <p className="text-red-500 text-xs mt-1">{errors.district}</p>
            )}
            {!selectedAddress.province && (
              <p className="text-xs text-gray-500 mt-1">Vui lòng chọn Tỉnh/Thành phố trước</p>
            )}
            {loadingAddress && selectedAddress.province && selectedAddress.district === '' && (
              <p className="text-xs text-gray-500 mt-1">Đang tải danh sách quận/huyện...</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phường/Xã <span className="text-red-500">*</span>
            </label>
            <select
              name="ward"
              value={selectedAddress.ward}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={!selectedAddress.district || loadingAddress || addressOptions.wards.length === 0}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.ward && errors.ward 
                  ? 'border-red-500' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <option value="">-- Chọn Phường/Xã --</option>
              {addressOptions.wards.map(ward => (
                <option key={ward.code} value={ward.name}>
                  {ward.name}
                </option>
              ))}
            </select>
            {touched.ward && errors.ward && (
              <p className="text-red-500 text-xs mt-1">{errors.ward}</p>
            )}
            {!selectedAddress.district && (
              <p className="text-xs text-gray-500 mt-1">Vui lòng chọn Quận/Huyện trước</p>
            )}
            {loadingAddress && selectedAddress.district && selectedAddress.ward === '' && (
              <p className="text-xs text-gray-500 mt-1">Đang tải danh sách phường/xã...</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ chi tiết <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="addressLine"
              value={formData.addressLine}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.addressLine && errors.addressLine ? errors.addressLine : null}
              required
              placeholder="Số nhà, tên đường, tòa nhà..."
              className={`hover:border-blue-400 focus:border-blue-500 transition-colors ${touched.addressLine && errors.addressLine ? 'border-red-500' : ''}`}
            />
          </div>
        </div>

        <div className="flex items-center py-2">
          <input
            type="checkbox"
            id="isDefault"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
          />
          <label htmlFor="isDefault" className="ml-3 block text-sm text-gray-700 cursor-pointer">
            Đặt làm địa chỉ mặc định
          </label>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || loadingAddress}
            className="px-6 font-medium"
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || loadingAddress}
            className="px-6 font-medium"
          >
            {isSubmitting 
              ? isEditing ? 'Đang cập nhật...' : 'Đang thêm...' 
              : isEditing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'
            }
          </Button>
        </div>
        
        {Object.keys(errors).length > 0 && touched.fullName && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-md mt-4">
            <p className="text-red-600 font-medium text-sm mb-1">Vui lòng sửa các lỗi sau:</p>
            <ul className="list-disc pl-5 text-sm text-red-600">
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddressForm;
