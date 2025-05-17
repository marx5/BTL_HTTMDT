import React, { useMemo } from 'react';
import useAddress from '../../hooks/useAddress';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

const AddressList = ({
  addresses: propAddresses = [],
  onSelectAddress,
  selectedAddress,
}) => {
  const { addresses: contextAddresses, loading, error } = useAddress();

  // Sử dụng addresses từ prop nếu có, nếu không thì dùng từ context
  const unsortedAddresses = propAddresses.length > 0 ? propAddresses : contextAddresses;
  
  // Sắp xếp địa chỉ: địa chỉ mặc định lên đầu
  const addresses = useMemo(() => {
    return [...unsortedAddresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }, [unsortedAddresses]);

  if (loading) {
    return <div className="text-center py-4">Đang tải địa chỉ...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error.message || 'Không thể tải danh sách địa chỉ'}
      </div>
    );
  }

  if (!addresses || addresses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Bạn chưa có địa chỉ nào</p>
        <Button
          onClick={() => onSelectAddress && onSelectAddress(null)}
          className="w-full max-w-xs mx-auto"
        >
          Thêm địa chỉ mới
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
            selectedAddress?.id === address.id
              ? 'border-primary bg-primary/5 shadow-md'
              : address.isDefault
              ? 'border-primary/50 bg-primary/5'
              : 'border-gray-200 hover:border-primary hover:shadow-sm'
          }`}
          onClick={() => onSelectAddress && onSelectAddress(address)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-gray-900">
                  {address.fullName}
                </h3>
                <span className="text-gray-500">|</span>
                <p className="text-gray-600">{address.phone}</p>
              </div>

              <div className="text-gray-600 space-y-1">
                <p className="font-medium">Địa chỉ:</p>
                <p>{address.addressLine}</p>
                <p>
                  {address.city}, {address.state}, {address.country}
                </p>
              </div>

              {address.note && (
                <div className="text-gray-500 text-sm mt-2">
                  <p className="font-medium">Ghi chú:</p>
                  <p>{address.note}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {address.isDefault && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                  Địa chỉ mặc định
                </span>
              )}
              {selectedAddress?.id === address.id && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Đã chọn
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddressList;
