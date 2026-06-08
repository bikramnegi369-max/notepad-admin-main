import { useParams } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout';
import { useDispatch, useSelector } from 'react-redux';
import { getNotesByUser } from '../redux/userSlice';
import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import dateFormat from 'dateformat';
import { AiOutlineClose } from 'react-icons/ai';
import { MdContentCopy } from 'react-icons/md';
import { toast } from 'react-toastify';
export default function SingleUser() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const userNoteGet = useSelector((state: any) => state.user.singleNote.data);

  useEffect(() => {
    dispatch(getNotesByUser(id as any) as any);
  }, [dispatch, id]);
  return (
    <>
      <DefaultLayout>
        <Breadcrumb pageName="User Notes" />

        <div className="relative overflow-x-auto p-4 bg-white">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400  ">
            <thead className="text-xs text-gray-700 h-[50px]  uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 bg-gray-2 dark:bg-meta-4 ">
              <tr className="mt-4">
                <th
                  scope="col"
                  className="text-sm font-medium uppercase xsm:text-base pl-4"
                >
                  S.no
                </th>

                <th
                  scope="col"
                  className="text-sm font-medium uppercase xsm:text-base pl-4"
                >
                  content
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium uppercase xsm:text-base pl-4"
                >
                  created Date
                </th>
              </tr>
            </thead>
            <tbody>
              {userNoteGet?.map((user: any, key: any) => (
                <tr className="bg-white dark:bg-gray-800">
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                  >
                    {key + 1}
                  </th>

                  <td className="px-6 py-4">
                    <ViewNotes content={user?.content} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-black dark:text-white">
                      {dateFormat(user?.createdAt, 'mmm d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dateFormat(user?.createdAt, 'h:MM TT')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DefaultLayout>
    </>
  );
}

const ViewNotes = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  return (
    <>
      <p
        className="cursor-pointer text-blue-500 hover:underline line-clamp-2 max-w-xs"
        onClick={() => setIsOpen(true)}
      >
        {content.length > 100 ? content.slice(0, 100) + '...' : content}
      </p>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-boxdark rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark px-6 py-4">
              <h3 className="font-semibold text-black dark:text-white text-lg">
                Note Detail
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full transition-colors"
                  title="Copy to clipboard"
                >
                  <MdContentCopy size={20} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-danger hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full transition-colors"
                >
                  <AiOutlineClose size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="text-base text-black dark:text-white font-mono whitespace-pre-wrap break-words leading-relaxed bg-gray-50 dark:bg-meta-4 p-4 rounded-md border border-stroke dark:border-strokedark">
                {content}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
