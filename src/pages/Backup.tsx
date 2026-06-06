import { useDispatch } from 'react-redux';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import { backupData, loginBackup } from '../redux/backupSlice';

export default function BackupData() {
  const dispatch = useDispatch();

  const handleBackup = () => {
    dispatch(backupData());
  };

  const handleLoginBackup = () => {
    dispatch(loginBackup());
  };

  return (
    <>
      <DefaultLayout>
        <Breadcrumb pageName="User Backup" />

        <div className="flex  items-center gap-10">
          <div className="text-center bg-gray-400 shadow-md p-5 hover:shadow-2xl px-16">
            <p className="text-2xl  font-bold">Backup User Login </p>
            <button
              className="btn mt-5 bg-green-500 py-1 px-4 text-white rounded-lg hover:bg-green-600"
              onClick={handleLoginBackup}
            >
              Start
            </button>
          </div>

          <div className="text-center bg-gray-400 shadow-md p-5 hover:shadow-2xl px-20">
            <p className="text-2xl font-bold">Backup Notes</p>
            <button
              className="btn mt-5 bg-green-500 py-1 px-4 text-white rounded-lg"
              onClick={handleBackup}
            >
              Start
            </button>
          </div>
        </div>
      </DefaultLayout>
    </>
  );
}
