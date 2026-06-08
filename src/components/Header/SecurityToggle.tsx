import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSecurityStatus, toggleSecurityStatus } from '../../redux/ipSlice';
import { AppDispatch } from '../../redux/store';
import { MdSecurity, MdSecurityUpdateWarning } from 'react-icons/md';

const SecurityToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isGlobalBlocked } = useSelector((state: any) => state.ip);

  useEffect(() => {
    dispatch(getSecurityStatus());
  }, [dispatch]);

  const handleToggle = () => {
    dispatch(toggleSecurityStatus(!isGlobalBlocked));
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-2 dark:bg-meta-4 rounded-full border border-stroke dark:border-strokedark transition-all hover:shadow-sm">
      <div className="flex items-center gap-2">
        {isGlobalBlocked ? (
          <MdSecurityUpdateWarning
            className="text-danger animate-pulse"
            size={18}
          />
        ) : (
          <MdSecurity className="text-success" size={18} />
        )}
        <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">
          {isGlobalBlocked ? 'Lockdown' : 'Active'}
        </span>
      </div>

      <label
        htmlFor="securityToggle"
        className="relative inline-flex items-center cursor-pointer"
      >
        <input
          type="checkbox"
          id="securityToggle"
          className="sr-only peer"
          checked={isGlobalBlocked}
          onChange={handleToggle}
        />
        <div className="w-10 h-5 bg-stroke peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-danger"></div>
      </label>
    </div>
  );
};

export default SecurityToggle;
