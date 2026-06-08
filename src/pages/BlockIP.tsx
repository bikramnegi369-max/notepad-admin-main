import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DefaultLayout from '../layout/DefaultLayout';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import {
  getBlockedIPs,
  addBlockedIP,
  deleteBlockedIP,
  updateIPStatus,
  getSecurityStatus,
} from '../redux/ipSlice';
import { AppDispatch } from '../redux/store';
import {
  MdDeleteOutline,
  MdSecurityUpdateWarning,
  MdOutlineBlock,
  MdOutlineCheckCircle,
} from 'react-icons/md';
import dateFormat from 'dateformat';

const BlockIP = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { ips, isLoading, isGlobalBlocked } = useSelector(
    (state: any) => state.ip,
  );
  const [ipAddress, setIpAddress] = useState('');

  useEffect(() => {
    dispatch(getBlockedIPs());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress) return;
    await dispatch(addBlockedIP({ ip: ipAddress, isActive: true }));
    setIpAddress('');
    dispatch(getBlockedIPs());
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to unblock this IP?')) {
      dispatch(deleteBlockedIP(id)).then(() => {
        dispatch(getSecurityStatus());
      });
    }
  };

  const handleStatusToggle = (id: string, currentStatus: boolean) => {
    dispatch(updateIPStatus({ id, isActive: !currentStatus })).then(() => {
      dispatch(getSecurityStatus());
    });
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Security / Block IP" />

      {isGlobalBlocked && (
        <div className="mb-6 flex w-full border-l-6 border-danger bg-danger/[0.1] p-4 shadow-md dark:bg-[#1b1b24] md:p-5">
          <div className="mr-5 flex h-9 w-9 items-center justify-center rounded-lg bg-danger">
            <MdSecurityUpdateWarning className="text-white" size={24} />
          </div>
          <div className="w-full">
            <h5 className="mb-1 text-lg font-bold text-black dark:text-white">
              Global Lockdown Active
            </h5>
            <p className="leading-relaxed text-danger font-medium">
              All external traffic is currently blocked. Whitelisted admins
              only.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-9">
        {/* Input Form */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Block New IP Address
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6.5">
            <div className="mb-4.5">
              <label className="mb-2.5 block text-black dark:text-white">
                IP Address
              </label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.1"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
            <button className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 xl:w-auto xl:px-10">
              Block IP
            </button>
          </form>
        </div>

        {/* Display Table */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
            Blocked IP List
          </h4>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[50px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                    #
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    IP Address
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Status
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Blocked Date
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      Loading...
                    </td>
                  </tr>
                ) : ips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      No IP addresses blocked yet.
                    </td>
                  </tr>
                ) : (
                  ips.map((ip: any, index: number) => (
                    <tr key={ip._id}>
                      <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                        <p className="text-black dark:text-white">
                          {index + 1}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white font-mono">
                          {ip.ip}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <span
                          className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                            ip.isActive
                              ? 'bg-success text-success'
                              : 'bg-danger text-danger'
                          }`}
                        >
                          {ip.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <p className="text-black dark:text-white">
                          {dateFormat(ip.createdAt, 'mmm d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dateFormat(ip.createdAt, 'h:MM TT')}
                        </p>
                      </td>
                      <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                        <div className="flex items-center space-x-3.5">
                          <button
                            onClick={() =>
                              handleStatusToggle(ip._id, ip.isActive)
                            }
                            className={`transition-colors ${
                              ip.isActive
                                ? 'hover:text-warning text-gray-500'
                                : 'hover:text-success text-gray-500'
                            }`}
                            title={
                              ip.isActive ? 'Deactivate IP' : 'Activate IP'
                            }
                          >
                            {ip.isActive ? (
                              <MdOutlineBlock size={22} />
                            ) : (
                              <MdOutlineCheckCircle
                                size={22}
                                className="text-success"
                              />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(ip._id)}
                            className="hover:text-danger text-red-500 transition-colors"
                            title="Unblock IP"
                          >
                            <MdDeleteOutline size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default BlockIP;
