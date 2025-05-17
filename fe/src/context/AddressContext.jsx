import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/address';
import { useAuth } from './AuthContext';
import { showSuccess, showError } from '../utils/notification';

const AddressContext = createContext();

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};

export const AddressProvider = ({ children }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAddresses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data);
      setError(null);
    } catch (err) {
      setError(err);
      showError('Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async (addressData) => {
    try {
      const newAddress = await addAddress(addressData);
      setAddresses((prev) => [...prev, newAddress]);
      showSuccess('Đã thêm địa chỉ mới');
      return newAddress;
    } catch (err) {
      showError(err, 'Không thể thêm địa chỉ');
      throw err;
    }
  };

  const updateAddressById = async (id, addressData) => {
    try {
      const updatedAddress = await updateAddress(id, addressData);
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === id ? updatedAddress : addr))
      );
      showSuccess('Đã cập nhật địa chỉ');
      return updatedAddress;
    } catch (err) {
      showError(err, 'Không thể cập nhật địa chỉ');
      throw err;
    }
  };

  const deleteAddressById = async (id) => {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      showSuccess('Đã xóa địa chỉ');
    } catch (err) {
      showError(err, 'Không thể xóa địa chỉ');
      throw err;
    }
  };

  const setDefaultAddressById = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );
      showSuccess('Đã đặt địa chỉ mặc định');
    } catch (err) {
      showError(err, 'Không thể đặt địa chỉ mặc định');
      throw err;
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const value = {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress: updateAddressById,
    deleteAddress: deleteAddressById,
    setDefaultAddress: setDefaultAddressById,
    refreshAddresses: fetchAddresses,
  };

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};

export default AddressContext;
