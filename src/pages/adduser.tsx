import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';

import { addUser } from '../redux/userSlice';
import { AppDispatch } from '../redux/store';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';

const Adduser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [userData, setUserData] = useState({
    name: '',
    password: '',
  });

  const { navigate: shouldNavigate, isLoading } = useSelector(
    (state: any) => state.user,
  );

  useEffect(() => {
    if (shouldNavigate) {
      navigate('/tables');
    }
  }, [shouldNavigate, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData.name || !userData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    dispatch(addUser(userData));
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-242.5">
        <Breadcrumb pageName="Add User" />

        <div className="flex flex-col gap-9 items-center">
          <div className="w-full lg:w-7/12">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-semibold text-black dark:text-white">
                  User Registration
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Create a new user account with access credentials.
                </p>
              </div>

              <div className="p-6.5">
                <form onSubmit={handleSubmit}>
                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="name"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-4 text-body">
                        <FaUser />
                      </span>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary transition"
                        type="text"
                        name="name"
                        id="name"
                        placeholder="Enter user's full name"
                        value={userData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-5.5">
                    <label
                      className="mb-3 block text-sm font-medium text-black dark:text-white"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-4.5 top-4 text-body">
                        <FaLock />
                      </span>
                      <input
                        className="w-full rounded border border-stroke bg-gray py-3 pl-11.5 pr-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary transition"
                        type="password"
                        name="password"
                        id="password"
                        placeholder="Create a strong password"
                        value={userData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-4.5 mt-8">
                    <button
                      className="flex justify-center rounded border border-stroke py-2.5 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white transition active:scale-95"
                      type="button"
                      onClick={() => navigate('/tables')}
                    >
                      Cancel
                    </button>
                    <button
                      className={`flex justify-center rounded bg-primary py-2.5 px-8 font-medium text-gray hover:bg-opacity-90 transition active:scale-95 ${
                        isLoading ? 'bg-opacity-70 cursor-not-allowed' : ''
                      }`}
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Register User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Adduser;
