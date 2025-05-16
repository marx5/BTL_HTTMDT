import Button from '../common/Button';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
  return (
    <div className={`border rounded-lg p-5 flex flex-col sm:flex-row justify-between gap-4 transition-all ${
      address.isDefault 
        ? 'border-blue-300 shadow-md bg-blue-50' 
        : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
    }`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-lg font-semibold text-gray-800">{address.fullName}</p>
          {address.isDefault && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
              Mặc định
            </span>
          )}
        </div>
        
        <div className="text-gray-600 space-y-1">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>
              {address.addressLine}, {address.city}, {address.state}, {address.country}
            </p>
          </div>
          
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p>{address.phone}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:justify-start">
        {!address.isDefault && (
          <Button 
            variant="primary" 
            onClick={() => onSetDefault(address.id)}
            className="text-sm py-1.5 px-3 bg-blue-500 hover:bg-blue-600"
          >
            Đặt làm mặc định
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onEdit(address)}
            className="text-sm py-1.5 px-3 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.5 9 16l.5-2.828 8.586-8.586z" />
              </svg>
              Sửa
            </span>
          </Button>
          <Button 
            variant="danger" 
            onClick={() => onDelete(address.id)}
            className="text-sm py-1.5 px-3 bg-red-500 hover:bg-red-600"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
