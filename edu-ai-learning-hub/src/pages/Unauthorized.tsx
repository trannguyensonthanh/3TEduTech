// src/pages/Unauthorized.tsx
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4'>
      <h1 className='text-6xl font-bold text-red-500'>403</h1>
      <h2 className='text-2xl font-semibold mt-4 mb-2'>
        Access Denied / Forbidden
      </h2>
      <p className='text-gray-600 mb-6'>
        You do not have the necessary permissions to access this page.
      </p>
      <Link
        to='/'
        className='px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors'
      >
        Go to Homepage
      </Link>
    </div>
  );
};

export default Unauthorized;
