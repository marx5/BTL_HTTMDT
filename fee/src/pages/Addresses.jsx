import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAddresses } from '../redux/slices/addressSlice';
import useTitle from '../hooks/useTitle';
import { addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../services/address';
import { showSuccess, showError } from '../utils/notification';
import Button from '../components/common/Button';
import AddressList from '../components/address/AddressList';
import AddressForm from '../components/address/AddressForm';
import Loader from '../components/common/Loader';
import AddressCard from '../components/address/AddressCard';

const Addresses = () => {
  // Set tiêu đề trang
  useTitle('Địa chỉ của tôi');

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { data: addresses, loading } = useSelector(state => state.address);
  
  const [editingAddress, setEditingAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    country: 'Việt Nam',
    isDefault: false,
  });

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  // Hàm xử lý khi thêm địa chỉ thành công
  const handleAddSuccess = (newAddress) => {
    // Reload addresses after adding
    dispatch(fetchAddresses());
    // Đóng form
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleUpdateSuccess = (updatedAddress) => {
    // Reload addresses after updating
    dispatch(fetchAddresses());
    
    // Đóng form
    setShowForm(false);
    setEditingAddress(null);
    
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      // Reload addresses after deleting
      dispatch(fetchAddresses());
      
      showSuccess('Xóa địa chỉ thành công');
    } catch (err) {
      setError('Không thể xóa địa chỉ.');
      showError(err.message || 'Không thể xóa địa chỉ. Vui lòng thử lại.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      // Reload addresses after setting default
      dispatch(fetchAddresses());
      
      showSuccess('Đặt địa chỉ mặc định thành công');
    } catch (err) {
      setError('Không thể đặt địa chỉ mặc định.');
      showError(err.message || 'Không thể đặt địa chỉ mặc định. Vui lòng thử lại.');
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setSelectedAddress({
      fullName: '',
      phone: '',
      addressLine: '',
      city: '',
      state: '',
      country: 'Việt Nam',
      isDefault: false,
    });
    setShowForm(true);
  };
  
  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <Loader size="lg" />
        <p className="text-gray-600 mt-4">Đang tải danh sách địa chỉ...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-center">
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <p className="text-red-600 font-medium">{error}</p>
        <Button onClick={() => dispatch(fetchAddresses())} className="mt-4">
          Thử lại
        </Button>
      </div>
    </div>
  );

  // Sắp xếp địa chỉ: địa chỉ mặc định lên đầu
  const sortedAddresses = addresses ? [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  }) : [];

  const hasAddresses = sortedAddresses && sortedAddresses.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý địa chỉ</h1>
        {!showForm && hasAddresses && (
          <Button 
            onClick={handleAddAddress} 
            className="px-4 py-2 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Thêm địa chỉ mới
          </Button>
        )}
      </div>
      
      {showForm ? (
        <AddressForm
          address={editingAddress}
          onSuccess={editingAddress ? handleUpdateSuccess : handleAddSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
        />
      ) : (!hasAddresses) ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="text-gray-600 mb-4">Bạn chưa có địa chỉ nào được lưu.</p>
          <Button onClick={handleAddAddress}>
            Thêm địa chỉ đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAddresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEditAddress}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Addresses;
