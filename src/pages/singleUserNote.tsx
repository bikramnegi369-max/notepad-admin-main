import { useParams } from 'react-router-dom';
import DefaultLayout from '../layout/DefaultLayout';
import { useDispatch, useSelector } from 'react-redux';
import { getNotesByUser} from '../redux/userSlice';
import { useEffect, useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import dateFormat from 'dateformat';
import { AiOutlineClose } from 'react-icons/ai';
export default function SingleUser() {
  const { id } = useParams();
  console.log(id,"userid");
  const dispatch = useDispatch();
  const userNoteGet = useSelector((state:any) => state.user.singleNote.data);
   
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
      <tr className='mt-4'>
        <th scope="col" className="text-sm font-medium uppercase xsm:text-base pl-4">
          S.no
        </th>
        
        <th scope="col" className="text-sm font-medium uppercase xsm:text-base pl-4">
        content
        </th>
        <th scope="col" className="text-sm font-medium uppercase xsm:text-base pl-4">
        created Date
        </th>
        
      </tr>
    </thead>
    <tbody>
        {
            userNoteGet?.map((user :any, key:any ) => 
                <tr className="bg-white dark:bg-gray-800">
            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
             {key+1}
            </th>
             
            <td className="px-6 py-4">
             <ViewNotes content={user?.content} />
            </td>
            <td className="px-6 py-4"> 
              {dateFormat(user?.createdAt, "yyyy/mm/dd")}
            </td>
            
          </tr>
            )
        }
     
      
    </tbody>
  </table>
</div>


      </DefaultLayout>
    </>
  );
}


const ViewNotes = ({content}:{content:string}) => {
  const [isOpen,setIsOpen]=useState(false)
  return (
    <>
    <p className='cursor-pointer' onClick={()=>setIsOpen(true)}>{content.length>100?content.slice(0,100)+"...":content}</p>
    {isOpen&&<div className='fixed top-0 left-0 h-screen w-full bg-[rgba(0,0,0,0.1)] flex items-center justify-center'>
      <div className='bg-white p-4 translate-x-30 rounded-md w-[550px] h-[400px] overflow-x-auto relative'>
        <button onClick={()=>setIsOpen(false)} className='absolute top-2 right-2 hover:rounded-full p-1 hover:bg-gray text-black'><AiOutlineClose size={20} /></button>
        <p className='text-base text-black '>
          {content}
        </p>
        </div>
     
    </div>
    }
    </>
  )
}