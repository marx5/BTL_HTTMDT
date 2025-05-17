import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAddresses,
  createAddress as createAddressAction,
  updateAddressById,
  deleteAddressById,
  setAddressAsDefault,
  selectAddresses,
  selectAddressLoading,
  selectDefaultAddress
} from '../redux/slices/addressSlice';

// Hook này giúp chuyển đổi dễ dàng từ context sang redux
// Cung cấp API tương tự với useAddress hook cũ
export const useAddress = () => {
  const dispatch = useDispatch();
  const addresses = useSelector(selectAddresses);
  const loading = useSelector(selectAddressLoading);
  const defaultAddress = useSelector(selectDefaultAddress);

  // Các hàm được bọc để hoạt động tương tự context
  const createAddress = async (addressData) => {
    const resultAction = await dispatch(createAddressAction(addressData));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const updateAddress = async (id, addressData) => {
    const resultAction = await dispatch(updateAddressById({ id, addressData }));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const deleteAddress = async (id) => {
    const resultAction = await dispatch(deleteAddressById(id));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const setDefaultAddress = async (id) => {
    const resultAction = await dispatch(setAddressAsDefault(id));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  return {
    addresses,
    loading,
    error: useSelector(state => state.address.error),
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refreshAddresses: () => dispatch(fetchAddresses()),
    defaultAddress
  };
};

export default useAddress; 