import React, { useEffect } from 'react';
import CardDataStats from '../../components/CardDataStats';
import { HiOutlineUserGroup } from 'react-icons/hi';
import DefaultLayout from '../../layout/DefaultLayout';
import { useDispatch, useSelector } from 'react-redux';
import { getTotalNotes, userGet } from '../../redux/userSlice';
import { FaRegNoteSticky } from 'react-icons/fa6';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const dispatch = useDispatch();
  const totalUser = useSelector((state) => state.user.user.data);
  const totalNotes = useSelector((state) => state.user.totalNotes);
  console.log(totalUser?.length, 'notes');

  useEffect(() => {
    dispatch(userGet());
    dispatch(getTotalNotes());
  }, [dispatch]);
  return (
    <DefaultLayout>
      <div className="grid grid-cols-1  gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <Link to={'/tables'}>
          <CardDataStats title="Total User" total={totalUser?.length ?? 0}>
            <HiOutlineUserGroup />
          </CardDataStats>
        </Link>
        <CardDataStats title="Total Notes" total={totalNotes}>
          <FaRegNoteSticky />
        </CardDataStats>
      </div>
      <div>
        {/* <div className="min-h-screen bg-gray-100 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-orange-500">
              <i className="fas fa-users fa-2x"></i>
            </div>
            <div className="text-right flex flex-col ">
              <div>
                
              </div>
              <div className="text-2xl font-bold">{totalUser?.length}</div>
              <div className="text-gray-500">Total Users</div>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-purple-500">
              <i className="fas fa-dollar-sign fa-2x"></i>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalNotes}</div>
              <div className="text-gray-500">Total Notes</div>
            </div>
          </div>
        </div>
      </div>
    </div> */}
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-8"></div>
      </div>
    </DefaultLayout>
  );
};

export default Dashboard;
