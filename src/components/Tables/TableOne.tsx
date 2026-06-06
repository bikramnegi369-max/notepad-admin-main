 
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { deleteUser, getTotalNotes, redirect, userGet } from '../../redux/userSlice';
import { CiUnlock } from "react-icons/ci";
import dateFormat from "dateformat";
import { GiEntryDoor } from "react-icons/gi";
import { useNavigate } from 'react-router-dom';
import { MdOutlineDeleteOutline } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

const Userdetail = () => {

  const navigate = useNavigate()



  const handleNavigater = (id:number) => {
    console.log(id)
    navigate('/singleUserNote/'+id)
  }

  const dispatch = useDispatch();
  const userDetailGet = useSelector((state: any) => state.user.user.data);

  // const handleRedirect = async (id : number) => {
  //   dispatch(redirect(id) as any);
  // };

  const handelChatNavigate = (id : number,name : string) => {
    navigate('/chat/'+id+'/'+name)

  }

  const handleDelete = async (id : number) => {
    await (dispatch(deleteUser(id) as any).unwwrap())
    await ( dispatch(userGet() as any).unwwrap())
  };

  useEffect(() => {
    dispatch(userGet() as any);
  }, [dispatch]);

  return (
    <div className="rounded-sm border  border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="flex flex-col">
        <div className="grid grid-cols-3 h-[50px] rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
          <div className="p-2.5 xl:p-3 sn-width">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              S.No
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-3 me-10">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Name
            </h5>
          </div>
         
          <div className="hidden p-2.5 text-center sm:block xl:p-3 ms-[60px]">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Date
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-3 ms-[160px]">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              Visit
            </h5>
          </div>
        </div>

        {userDetailGet?.map((user: any, key: number) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-4 ${
              key === userDetailGet.length - 1
                ? ''
                : 'border-b border-stroke dark:border-strokedark'
            }`}
            key={key}
          >
            <div className="flex items-center gap-3 p-2.5 xl:p-5 sn-width">
              <div className="flex-shrink-0">
                <p>
                  {key + 1}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center p-2.5 xl:p-5 sn-width">
              <p className="text-black dark:text-white"> 
                  {user.name}
                </p>
            </div>

            
            <div className="flex items-center justify-center p-2.5 xl:p-5 sn-width">
              <p className="">{dateFormat(user.createdAt, "yyyy/mm/dd")}</p>
            </div>
            <div className="flex items-center justify-center p-2.5 xl:p-5 gap-2 sn-width">
              {/* <button className="text-meta-3" onClick={()=>handleRedirect(user._id)}><CiUnlock size={35}/></button> */}
              <button className="text-green-400" onClick={()=>handleNavigater(user._id)}><GiEntryDoor size={20}/></button>
              <button className="text-blue-400" onClick={()=>handelChatNavigate(user._id,user.name)}><IoChatboxEllipsesOutline size={20}/></button>
              <button className="text-red-400" onClick={()=>handleDelete(user._id)}><MdOutlineDeleteOutline size={20}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Userdetail;
