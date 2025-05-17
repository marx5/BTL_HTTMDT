import { useState, useEffect } from 'react';
import useApiWithToken from '../../hooks/useApiWithToken';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/adminCategory';
import { showSuccess, showError } from '../../utils/notification';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Categories = () => {
  const {
    data: categoriesData,
    loading,
    error,
    callApi: fetchCategories,
  } = useApiWithToken();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: '',
  });

  useEffect(() => {
    console.log('Fetching categories for page:', page, 'limit:', limit);
    fetchCategories(() => getCategories(page, limit));
  }, [page, limit, fetchCategories]);

  const openModal = (category = null) => {
    if (category) {
      console.log('Opening modal for editing category:', category);
      setIsEditMode(true);
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        parentId: category.parentId || '',
      });
    } else {
      console.log('Opening modal for new category');
      setIsEditMode(false);
      setSelectedCategory(null);
      setFormData({ name: '', parentId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', parentId: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create a copy of formData and ensure parentId is a number or null
      const formDataToSubmit = {
        ...formData,
        // Convert empty string to null, otherwise ensure it's a number
        parentId: formData.parentId === '' ? null : Number(formData.parentId)
      };

      if (isEditMode) {
        console.log('Updating category:', selectedCategory.id, formDataToSubmit);
        await updateCategory(selectedCategory.id, formDataToSubmit);
        showSuccess('Cập nhật danh mục thành công!');
      } else {
        console.log('Creating new category:', formDataToSubmit);
        await createCategory(formDataToSubmit);
        showSuccess('Thêm danh mục thành công!');
      }
      fetchCategories(() => getCategories(page, limit));
      closeModal();
    } catch (err) {
      console.error('Error saving category:', err);
      showError(err.message || 'Có lỗi xảy ra khi lưu danh mục.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      console.log('Deleting category:', id);
      await deleteCategory(id);
      showSuccess('Xóa danh mục thành công!');
      fetchCategories(() => getCategories(page, limit));
    } catch (err) {
      console.error('Error deleting category:', err);
      showError(err.message || 'Có lỗi xảy ra khi xóa danh mục.');
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error) {
    console.error('Error loading categories:', error);
    return (
      <div className="text-red-500 text-center mt-10">
        {error || 'Có lỗi xảy ra khi tải danh mục'}
      </div>
    );
  }

  const categories = categoriesData?.categories || [];
  const totalPages = categoriesData?.totalPages || 1;

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Quản lý danh mục</h2>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Thêm danh mục mới
          </button>
        </div>

        {/* Bảng danh mục */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Tên danh mục</th>
                <th className="py-2 px-4 border-b">Danh mục cha</th>
                <th className="py-2 px-4 border-b">Ngày tạo</th>
                <th className="py-2 px-4 border-b">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{category.id}</td>
                    <td className="py-2 px-4 border-b">{category.name}</td>
                    <td className="py-2 px-4 border-b">
                      {category.Parent ? category.Parent.name : 'Không có'}{' '}
                      {/* Đổi từ ParentCategory thành Parent */}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openModal(category)}
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
                          onClick={() => handleDelete(category.id)}
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
                    colSpan="5"
                    className="py-2 px-4 text-center text-gray-500"
                  >
                    Không có danh mục nào.
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

      {/* Modal Thêm/Sửa danh mục */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">
            {isEditMode ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tên danh mục
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Danh mục cha (tùy chọn)
              </label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Không có</option>
                {categories.map(
                  (cat) =>
                    (!isEditMode || cat.id !== selectedCategory?.id) && (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    )
                )}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isEditMode ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default Categories;
