import { ClipLoader } from 'react-spinners';

const Loader = () => {
  return (
    <div className="flex justify-center items-center">
      <ClipLoader color="#1D4ED8" size={40} />
    </div>
  );
};

export default Loader;
