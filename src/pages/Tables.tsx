import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Userdetail from '../components/Tables/TableOne';
import TableThree from '../components/Tables/TableThree';
import TableTwo from '../components/Tables/TableTwo';
import DefaultLayout from '../layout/DefaultLayout';

const Tables = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="User" />

      <div className="flex flex-col gap-10">
        <Userdetail />
        {/* <TableTwo />
        <TableThree /> */}
      </div>
    </DefaultLayout>
  );
};

export default Tables;
