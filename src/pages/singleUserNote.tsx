import { useParams, useNavigate } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout';
import { useDispatch, useSelector } from 'react-redux';
import { getNotesByUser } from '../redux/userSlice';
import { AppDispatch } from '../redux/store';
import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import dateFormat from 'dateformat';
import { AiOutlineClose } from 'react-icons/ai';
import { MdContentCopy } from 'react-icons/md';
import { toast } from 'react-toastify';
import { LuClipboardList } from 'react-icons/lu';
import { IoArrowBack } from 'react-icons/io5';

export default function SingleUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const { singleNote, isLoading } = useSelector((state: any) => state.user);

  const userNoteGet = Array.isArray(singleNote)
    ? singleNote
    : singleNote?.data || [];

  useEffect(() => {
    if (id) {
      dispatch(getNotesByUser(id));
    }
  }, [dispatch, id]);

  return (
    <>
      <DefaultLayout>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumb pageName="User Notes" />
          <button
            onClick={() => navigate('/tables')}
            className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 transition-all active:scale-95 shadow-md self-start sm:self-auto"
          >
            <IoArrowBack size={18} />
            <span>Back to Users</span>
          </button>
        </div>

        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="max-w-full overflow-x-auto">
            {isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              </div>
            ) : userNoteGet.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="mb-4 text-gray-400">
                  <LuClipboardList size={60} className="mx-auto opacity-20" />
                </div>
                <p className="text-xl font-semibold text-black dark:text-white">
                  No notes found for this user.
                </p>
                <p className="text-sm text-gray-500">
                  When the user creates notes, they will appear here.
                </p>
              </div>
            ) : (
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 dark:bg-meta-4">
                    <th className="py-4 px-4 text-center font-semibold text-black dark:text-white text-xs uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="py-4 px-4 text-left font-semibold text-black dark:text-white text-xs uppercase tracking-wider">
                      Title
                    </th>
                    <th className="py-4 px-4 text-left font-semibold text-black dark:text-white text-xs uppercase tracking-wider">
                      Note Content
                    </th>
                    <th className="py-4 px-4 text-center font-semibold text-black dark:text-white text-xs uppercase tracking-wider">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userNoteGet.map((note: any, index: number) => (
                    <tr
                      key={note?._id || index}
                      className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors"
                    >
                      <td className="py-6 px-4 text-center">
                        <p className="text-sm font-medium text-black dark:text-white">
                          {index + 1}
                        </p>
                      </td>
                      <td className="py-6 px-4 text-left align-middle">
                        <p className="text-sm font-medium text-black dark:text-white">
                          {note?.title || <span className="text-gray-400 italic">Untitled</span>}
                        </p>
                      </td>
                      <td className="py-6 px-4 text-center align-middle">
                        <ViewNotes content={note?.content} />
                      </td>
                      <td className="py-6 px-4 whitespace-nowrap text-center align-middle">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-sm font-semibold text-black dark:text-white">
                            {dateFormat(note?.createdAt, 'mmm d, yyyy')}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {dateFormat(note?.createdAt, 'h:MM TT')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DefaultLayout>
    </>
  );
}

const ViewNotes = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    window.navigator.clipboard.writeText(content || '');
    toast.success('Content copied to clipboard');
  };

  const safeContent = content || '';

  return (
    <>
      <div
        className="group cursor-pointer max-w-xs transition-transform active:scale-[0.98]"
        onClick={() => setIsOpen(true)}
      >
        <p className="text-sm text-black dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-relaxed">
          {safeContent || (
            <span className="text-gray-400 italic">No content</span>
          )}
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Click to View
        </p>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white dark:bg-boxdark rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stroke dark:border-strokedark px-6 py-4">
              <h3 className="text-xl font-bold text-black dark:text-white">
                Note Detail
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="p-2.5 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full transition-all active:scale-90"
                  title="Copy to clipboard"
                  aria-label="Copy note"
                >
                  <MdContentCopy size={20} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 text-gray-500 hover:text-danger hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full transition-all active:scale-90"
                  aria-label="Close modal"
                >
                  <AiOutlineClose size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="text-sm md:text-base text-black dark:text-white font-mono whitespace-pre-wrap break-words leading-relaxed bg-gray-50 dark:bg-meta-4 p-6 rounded-lg border border-stroke dark:border-strokedark shadow-inner">
                {safeContent}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
