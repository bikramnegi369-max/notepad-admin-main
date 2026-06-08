import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUser, userGet } from '../../redux/userSlice';
import { AppDispatch } from '../../redux/store';
import dateFormat from 'dateformat';
import { LuClipboardList } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { IoChatboxEllipsesOutline } from 'react-icons/io5';

const Userdetail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { user, isLoading } = useSelector((state: any) => state.user);
  const userDetailGet = user?.data || [];

  const handleNavigater = (id: number) => {
    navigate(`/singleUserNote/${id}`);
  };

  const handelChatNavigate = (id: number, name: string) => {
    navigate(`/chat/${id}/${name}`);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteUser(id as any)).unwrap();
        dispatch(userGet());
      } catch (error) {
        // Error is handled via toast in the slice
      }
    }
  };

  useEffect(() => {
    dispatch(userGet());
  }, [dispatch]);

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          User Management
        </h4>
      </div>

      {/* Table Header - Hidden on Mobile */}
      <div className="hidden md:grid md:grid-cols-5 bg-gray-2 dark:bg-meta-4 py-3 px-4 md:px-6 xl:px-7.5">
        <div className="col-span-1 flex items-center">
          <p className="font-medium text-sm uppercase">S.No</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium text-sm uppercase">User Details</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium text-sm uppercase">Joined Date</p>
        </div>
        <div className="col-span-1 flex items-center justify-end">
          <p className="font-medium text-sm uppercase text-right">Actions</p>
        </div>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : userDetailGet.length === 0 ? (
          <div className="flex items-center justify-center p-20 text-gray-500">
            No users found.
          </div>
        ) : (
          userDetailGet.map((user: any, index: number) => (
            <div
              key={user._id || index}
              className={`grid grid-cols-2 md:grid-cols-5 border-t border-stroke py-4.5 px-4 dark:border-strokedark md:px-6 2xl:px-7.5 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors ${
                index === userDetailGet.length - 1 ? '' : 'border-b'
              }`}
            >
              {/* Index/S.No */}
              <div className="hidden md:flex col-span-1 items-center">
                <p className="text-sm text-black dark:text-white">
                  {index + 1}
                </p>
              </div>

              {/* User Name */}
              <div className="col-span-1 md:col-span-2 flex items-center">
                <div className="flex flex-col">
                  <p className="text-sm font-bold md:font-medium text-black dark:text-white">
                    {user.name}
                  </p>
                  <span className="md:hidden text-xs text-gray-400 mt-1">
                    Joined: {dateFormat(user.createdAt, 'mmm d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Created Date - Hidden on Mobile (shown as subtitle above) */}
              <div className="hidden md:flex col-span-1 items-center">
                <p className="text-sm text-black dark:text-white">
                  {dateFormat(user.createdAt, 'mmm d, yyyy')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 flex items-center justify-end gap-3.5">
                <button
                  className="hover:text-primary p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-blue-500"
                  onClick={() => handleNavigater(user._id)}
                  title="View Notes"
                >
                  <LuClipboardList size={20} />
                </button>
                <button
                  className="hover:text-primary p-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-green-500"
                  onClick={() => handelChatNavigate(user._id, user.name)}
                  title="Chat"
                >
                  <IoChatboxEllipsesOutline size={20} />
                </button>
                <button
                  className="hover:text-danger p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-red-500"
                  onClick={() => handleDelete(user._id)}
                  title="Delete User"
                >
                  <MdOutlineDeleteOutline size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Userdetail;
