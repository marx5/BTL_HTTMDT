import { useState, useEffect } from 'react';
import useApiWithToken from '../../hooks/useApiWithToken';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductVariants,
  updateProductVariant,
  deleteProductVariant,
  getProductById,
  deleteProductImage,
} from '../../services/adminProduct';
import { getCategories } from '../../services/adminCategory';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { Link } from 'react-router-dom';

Modal.setAppElement('#root');

const IMG_BASE_URL = process.env.REACT_APP_IMG_URL;

// console.log("IMG_BASE_URL:", IMG_BASE_URL); // Debugging log

const getProductImage = (product) => {
  if (!product) return null;

  // Nếu có ProductImages, lấy ảnh chính
  if (product.ProductImages && product.ProductImages.length > 0) {
    const mainImage = product.ProductImages.find((img) => img.isMain) || product.ProductImages[0];
    if (mainImage?.url) {
      return `${IMG_BASE_URL}${mainImage.url}`;
    }
  }

  // Fallback nếu có image trực tiếp
  if (product.image) {
    return `${IMG_BASE_URL}${product.image}`;
  }

  return null;
};

const Products = () => {
  const {
    data: productsData,
    loading,
    error,
    callApi: fetchProducts,
  } = useApiWithToken();
  const { data: categoriesData, callApi: fetchCategories } = useApiWithToken();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    image: null,
  });
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    stock: '',
  });
  const [productImages, setProductImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [editingVariant, setEditingVariant] = useState(null);
  const [editVariantData, setEditVariantData] = useState({
    size: '',
    color: '',
    stock: ''
  });

  useEffect(() => {
    fetchProducts(() => getProducts(page, limit));
    fetchCategories(() => getCategories(1, 100));
  }, [page, limit, fetchProducts, fetchCategories]);

  const openModal = (product = null) => {
    if (product) {
      console.log("Opening modal for product:", product);
      console.log("Product images:", product.ProductImages);
      
      setIsEditMode(true);
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.Category?.id || '',
        image: null,
      });
      setVariants(product.ProductVariants || []);
      setProductImages(product.ProductImages || []);
    } else {
      setIsEditMode(false);
      setSelectedProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        image: null,
      });
      setVariants([]);
      setProductImages([]);
    }
    setNewImages([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      image: null,
    });
  };

  const handleAddVariant = async () => {
    if (!newVariant.size || !newVariant.color || !newVariant.stock) {
      toast.error('Vui lòng điền đầy đủ thông tin biến thể');
      return;
    }

    if (!selectedProduct?.id) {
      toast.error('Vui lòng lưu sản phẩm trước khi thêm biến thể');
      return;
    }

    try {
      const variantToSend = [
        {
          size: newVariant.size,
          color: newVariant.color,
          stock: parseInt(newVariant.stock),
        },
      ];

      const response = await addProductVariants(
        selectedProduct.id,
        variantToSend
      );
      if (response) {
        setVariants([...variants, ...variantToSend]);
        setNewVariant({
          size: '',
          color: '',
          stock: '',
        });
        toast.success('Thêm biến thể thành công!');
      }
    } catch (err) {
      console.error('Error adding variant:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm biến thể');
    }
  };

  const handleRemoveVariant = async (variantId) => {
    console.log("Removing variant with ID:", variantId);
    console.log("Current variants:", variants);

    // Kiểm tra có ID không và ID có hợp lệ không (phải là số)
    if (!variantId) {
      console.error("No variant ID provided");
      toast.error('Không thể xóa biến thể do thiếu ID');
      return;
    }

    // Nếu là ID tạm thời (có dạng temp-xxx), xóa local không gọi API
    if (typeof variantId === 'string' && variantId.startsWith('temp-')) {
      // Trường hợp biến thể mới chưa lưu vào DB
      const index = parseInt(variantId.split('-')[1]);
      if (isNaN(index)) {
        toast.error('ID biến thể không hợp lệ');
        return;
      }
      
      // Lọc biến thể bằng index
      const newVariants = [...variants];
      newVariants.splice(index, 1);
      setVariants(newVariants);
      toast.success('Đã xóa biến thể');
      return;
    }

    if (isEditMode && selectedProduct?.id) {
      // Kiểm tra nếu biến thể đã bị xóa khỏi UI trước đó
      const variantExists = variants.some(v => v.id === Number(variantId));
      if (!variantExists) {
        console.warn("Variant already removed from UI:", variantId);
        return; // Không gọi API nếu đã xóa khỏi UI
      }

      try {
        // Đảm bảo variantId là số nguyên hợp lệ trước khi gọi API
        const numericVariantId = Number(variantId);
        
        if (isNaN(numericVariantId)) {
          console.error("Invalid variant ID:", variantId);
          toast.error('ID biến thể không hợp lệ');
          return;
        }
        
        // Trước tiên, cập nhật UI để tránh gọi API lặp lại
        setVariants(prevVariants => prevVariants.filter(v => v.id !== numericVariantId));
        
        // Gọi API với ID đã kiểm tra
        await deleteProductVariant(selectedProduct.id, numericVariantId);
        toast.success('Xóa biến thể thành công!');
      } catch (err) {
        console.error('Error deleting variant:', err);
        if (err.response?.data?.message === 'variant_not_found') {
          toast.info('Biến thể không tồn tại trên máy chủ');
          // Đã cập nhật UI trước khi gọi API rồi, không cần làm gì thêm
        } else {
        toast.error('Có lỗi xảy ra khi xóa biến thể');
          // Trong trường hợp lỗi khác, chúng ta đã xóa UI rồi nên không phục hồi lại
        }
      }
    } else {
      // Trường hợp thêm mới sản phẩm (không có trong DB)
      // Xóa biến thể local bằng object index trong array
      setVariants(variants.filter(v => v.id !== variantId));
      toast.success('Đã xóa biến thể');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
  };

  const handleRemoveImage = async (imageId) => {
    if (isEditMode && imageId) {
      try {
        await deleteProductImage(selectedProduct.id, imageId);
        setProductImages(productImages.filter((img) => img.id !== imageId));
        toast.success('Xóa ảnh thành công!');
      } catch (err) {
        console.error('Error deleting image:', err);
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa ảnh');
      }
    } else {
      setProductImages(productImages.filter((img) => img.id !== imageId));
    }
  };

  const handleSetMainImage = (imageId) => {
    setProductImages(
      productImages.map((img) => ({
        ...img,
        isMain: img.id === imageId,
      }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('price', parseFloat(formData.price));
    formDataToSend.append('categoryId', formData.categoryId);

    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    if (newImages.length > 0) {
      newImages.forEach((img) => {
        formDataToSend.append('images', img);
      });
    }

    try {
      let response;
      if (isEditMode) {
        response = await updateProduct(selectedProduct.id, formDataToSend);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        response = await createProduct(formDataToSend);
        toast.success('Tạo sản phẩm thành công!');
      }

      fetchProducts(() => getProducts(page, limit));
      closeModal();
    } catch (error) {
      console.error('Error submitting product:', error);
      toast.error(
        error.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm'
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await deleteProduct(id);
      toast.success('Xóa sản phẩm thành công!');
      fetchProducts(() => getProducts(page, limit));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(
        error.response?.data?.message || 'Có lỗi xảy ra khi xóa sản phẩm'
      );
    }
  };

  const handleEditVariant = (variant) => {
    setEditingVariant(variant);
    setEditVariantData({
      size: variant.size,
      color: variant.color,
      stock: variant.stock
    });
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant || !selectedProduct?.id) {
      toast.error('Không thể cập nhật biến thể');
      return;
    }

    try {
      // Xử lý trường hợp biến thể tạm thời
      if (typeof editingVariant.id === 'string' && editingVariant.id.startsWith('temp-')) {
        const index = parseInt(editingVariant.id.split('-')[1]);
        if (isNaN(index)) {
          toast.error('ID biến thể không hợp lệ');
          return;
        }
        
        // Cập nhật biến thể tạm thời (local)
        const newVariants = [...variants];
        newVariants[index] = {
          ...newVariants[index],
          ...editVariantData,
          stock: parseInt(editVariantData.stock)
        };
        setVariants(newVariants);
        toast.success('Đã cập nhật biến thể');
      } else if (isEditMode) {
        // Cập nhật biến thể trên server
        const numericVariantId = Number(editingVariant.id);
        if (isNaN(numericVariantId)) {
          toast.error('ID biến thể không hợp lệ');
          return;
        }

        // Cập nhật UI trước
        setVariants(prevVariants => prevVariants.map(v => 
          v.id === numericVariantId 
            ? {...v, ...editVariantData, stock: parseInt(editVariantData.stock)} 
            : v
        ));

        // Gọi API cập nhật với đầy đủ các trường dữ liệu
        const updateData = {
          size: editVariantData.size,
          color: editVariantData.color,
          stock: parseInt(editVariantData.stock)
        };

        await updateProductVariant(
          selectedProduct.id, 
          numericVariantId, 
          updateData
        );
        
        toast.success('Cập nhật biến thể thành công!');
      }
      
      // Reset state
      setEditingVariant(null);
    } catch (err) {
      console.error('Error updating variant:', err);
      if (err.response?.data?.message === 'variant_not_found') {
        toast.error('Biến thể không tồn tại trên máy chủ');
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật biến thể');
      }
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const categories = categoriesData?.categories || [];

  // Cập nhật URL fallback cho ảnh để không gây lỗi
  const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPktow7RuZyBjw7MgxJHhu4duaCAoTm8gSW1hZ2UpPC90ZXh0Pjwvc3ZnPg==';

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h2>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thêm sản phẩm mới
          </button>
        </div>

        {/* Bảng danh sách sản phẩm */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Hình ảnh</th>
                <th className="py-2 px-4 border-b">Tên sản phẩm</th>
                <th className="py-2 px-4 border-b">Giá</th>
                <th className="py-2 px-4 border-b">Danh mục</th>
                <th className="py-2 px-4 border-b">Số lượng</th>
                <th className="py-2 px-4 border-b">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{product.id}</td>
                    <td className="py-2 px-4 border-b">
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            console.log('Product image load error');
                            e.target.src = PLACEHOLDER_IMAGE;
                            e.target.onerror = null;
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            Không có ảnh
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">{product.name}</td>
                    <td className="py-2 px-4 border-b">
                      {product.price?.toLocaleString('vi-VN')} VND
                    </td>
                    <td className="py-2 px-4 border-b">
                      {categories.find((c) => c.id === product.categoryId)
                        ?.name || 'Không có'}
                    </td>
                    <td className="py-2 px-4 border-b">{product.stock}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Chi tiết
                        </Link>
                        <button
                          onClick={() => openModal(product)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-2 px-4 text-center text-gray-500"
                  >
                    Không có sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 mx-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Trước
            </button>
            <span className="px-4 py-2 mx-1">{`Trang ${page} / ${totalPages}`}</span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 mx-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              Tiếp
            </button>
          </div>
        )}
      </div>

      {/* Modal thêm/sửa sản phẩm */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-auto">
            <div className="sticky top-0 bg-white z-10 pb-4 border-b mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditMode ? `Chỉnh sửa: ${selectedProduct?.name || 'Sản phẩm'}` : 'Thêm sản phẩm mới'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {isEditMode && selectedProduct && (
                <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-2">
                  <span>ID: {selectedProduct.id}</span>
                  {selectedProduct.Category && <span>• Danh mục: {selectedProduct.Category.name}</span>}
                  <span>• Giá: {selectedProduct.price?.toLocaleString('vi-VN')} VND</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                    placeholder="Nhập tên sản phẩm"
                />
                  <p className="mt-1 text-xs text-gray-500">Tên sản phẩm hiển thị trên cửa hàng</p>
              </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows="3"
                    placeholder="Mô tả chi tiết về sản phẩm"
                />
                  <p className="mt-1 text-xs text-gray-500">Cung cấp thông tin chi tiết về sản phẩm</p>
              </div>
                
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá <span className="text-red-500 font-bold">*</span>
                </label>
                  <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-3 pr-12"
                  required
                      placeholder="0"
                      min="0"
                />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 font-medium">
                      VND
              </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Giá bán (không bao gồm thuế)</p>
                </div>
                
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                    <option value="">-- Chọn danh mục --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                  <p className="mt-1 text-xs text-gray-500">Danh mục phân loại sản phẩm</p>
                {isEditMode && selectedProduct?.Category && (
                    <p className="mt-1 text-xs text-indigo-600 font-medium">
                    Danh mục hiện tại: {selectedProduct.Category.name}
                  </p>
                )}
              </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm <span className="text-red-500 font-bold">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Tải lên ít nhất một hình ảnh cho sản phẩm. Hình ảnh đầu tiên sẽ được hiển thị làm ảnh chính</p>

                {/* Hiển thị ảnh hiện có */}
                {productImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Ảnh hiện có:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {productImages.map((image) => (
                        <div key={image.id || `img-${Math.random()}`} className="relative group">
                          <img
                            src={image.url ? `${IMG_BASE_URL}${image.url}` : PLACEHOLDER_IMAGE}
                            alt="Product"
                            className={`w-full h-24 object-cover rounded ${image.isMain ? 'ring-2 ring-blue-500' : ''}`}
                            onError={(e) => {
                              console.log("Image load error");
                              e.target.src = PLACEHOLDER_IMAGE;
                              e.target.onerror = null;
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(image.id)}
                              className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                              title="Đặt làm ảnh chính"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(image.id)}
                              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Xóa ảnh"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                          {image.isMain && (
                            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                              Ảnh chính
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thêm ảnh mới */}
                <div className="border-dashed border-2 border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  accept="image/*"
                    className="hidden"
                    id="product-images"
                  />
                  <label htmlFor="product-images" className="cursor-pointer block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="mt-2 block text-sm font-medium text-gray-700">
                      Click để chọn ảnh hoặc kéo thả file vào đây
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PNG, JPG, GIF lên đến 10MB
                    </span>
                  </label>
                </div>

                {newImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Ảnh mới sẽ thêm ({newImages.length}):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {newImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-center">
                <button
                  type="submit"
                  className="inline-flex justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isEditMode ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-lg font-medium text-gray-700 mb-2">
                  Biến thể sản phẩm <span className="text-xs font-normal text-gray-500">(tùy chọn)</span>
                </h4>
                <p className="text-xs text-gray-500 mb-3">Thêm các biến thể như kích thước, màu sắc và số lượng tồn kho cho từng biến thể</p>
                <div className="space-y-4">
                  {variants.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Biến thể hiện có:
                      </h5>
                      <div className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kích thước</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {variants.map((variant, index) => (
                              <tr 
                                key={variant.id || `variant-${index}-${variant.size}-${variant.color}`} 
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{variant.size}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.color}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.stock}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                                      onClick={() => handleEditVariant(variant)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariant(variant.id || `temp-${index}`)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Xóa
                            </button>
                          </div>
                                </td>
                              </tr>
                        ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Thêm biến thể mới:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Kích thước</label>
                      <input
                        type="text"
                          placeholder="VD: S, M, L, XL"
                        value={newVariant.size}
                        onChange={(e) =>
                          setNewVariant({ ...newVariant, size: e.target.value })
                        }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Màu sắc</label>
                      <input
                        type="text"
                          placeholder="VD: Đỏ, Xanh, Đen"
                        value={newVariant.color}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            color: e.target.value,
                          })
                        }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng</label>
                      <input
                        type="number"
                          placeholder="Nhập số lượng"
                        value={newVariant.stock}
                        onChange={(e) =>
                          setNewVariant({
                            ...newVariant,
                            stock: e.target.value,
                          })
                        }
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          min="1"
                      />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Thêm biến thể
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Xong
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Cập nhật biến thể
              </h3>
              <button
                onClick={() => setEditingVariant(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kích thước
                </label>
                <input
                  type="text"
                  value={editVariantData.size}
                  onChange={(e) => setEditVariantData({...editVariantData, size: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="VD: S, M, L, XL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Màu sắc
                </label>
                <input
                  type="text"
                  value={editVariantData.color}
                  onChange={(e) => setEditVariantData({...editVariantData, color: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="VD: Đỏ, Xanh, Đen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  value={editVariantData.stock}
                  onChange={(e) => setEditVariantData({...editVariantData, stock: e.target.value})}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Nhập số lượng"
                  min="0"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUpdateVariant}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;
