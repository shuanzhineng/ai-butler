import type { RouteObject } from 'react-router';
// import { Outlet, useLocation, useNavigate } from 'react-router';
import { Outlet } from 'react-router';
// import { useEffect } from 'react';
import { Navigate } from "react-router-dom"

import Register from '@/pages/register';
import Tasks from '@/pages/tasks';
import TaskEdit from '@/pages/tasks.[id].edit';
import TaskAnnotation from '@/pages/tasks.[id].samples.[id]';
import Samples from '@/pages/tasks.[id]';
import TaskSamplesFinished from '@/pages/tasks.[id].samples.finished';
import Page404 from '@/pages/404';
import MainLayout from '@/layouts/MainLayoutWithNavigation';

import Menu from './pages/system/menu/menu';
import Home from './pages/home';
import type { TaskLoaderResult } from './loaders/task.loader';
import { taskLoader, tasksLoader } from './loaders/task.loader';
import { sampleLoader } from './loaders/sample.loader';
// import RequireAuth from './components/RequireSSO';
import { registerLoader } from './loaders/register.loader';
import { loginLoader } from './loaders/login.loader';
import LoginPage from './pages/login';
import Menubtnpage from './pages/system/menu/menuBtnPage'
import Department from './pages/system/department/index'
import Role from './pages/system/role/index'
import User from './pages/system/user/index'
import Entrylog from './pages/logmanagement/Entrylog/index'
import Operationlog from './pages/logmanagement/operationlog/index'
import DataList from './pages/datagroup/datalist/index'
import DatalistDetails from './pages/datagroup/datalist/datalistDetails'
import ModelTraining from './pages/modelmanagement/modeltraining/index'
import ModelList from './pages/modelmanagement/modeltraining/datalistDetails'
import Addmodel from './pages/modelmanagement/modeltraining/addmodel'
import Apponline from './pages/appmanager/apponline/index'
// function Root() {
//   const location = useLocation();
//   const navigate = useNavigate();

//   useEffect(() => {
//     // 如果是根路径，跳转到任务管理（以任务管理为首页）
//     if (location.pathname === '/' || location.pathname === '') {
//       navigate('/home/menu');
//     }
//   }, [location.pathname, navigate]);

//   if (!window.IS_ONLINE) {
//     return <Outlet />;
//   }

//   return (
//     <RequireAuth>
//       <Outlet />
//     </RequireAuth>
//   );
// }

const routes: RouteObject[] = [
  {
    path: '/',
    id: 'root',
    element: <Navigate to='/home/tasks' />,

  },
  {
    path: 'login',
    loader: loginLoader,
    element: <LoginPage />,
  },
  {
    path: 'register',
    loader: registerLoader,
    element: <Register />,
    handle: {
      crumb: () => {
        return '注册';
      },
    },
  }, {
    path: 'home',
    element: <Home />,
    handle: {
      crumb: () => {
        return '首页';
      },
    },
    children: [{
      path: "apponline",
      element: <Apponline />,
      handle: {
        crumb: () => {
          return '在线推理';
        },
      },
    }, {
      path: "addmodel",
      element: <Addmodel />,
      handle: {
        crumb: () => {
          return '新增训练任务';
        },
      },
    },
    {
      path: "modeltraininglist",
      element: <ModelList />,
      handle: {
        crumb: () => {
          return '训练任务列表';
        },
      },
    },
    {
      path: "modeltraining",
      element: <ModelTraining />,
      handle: {
        crumb: () => {
          return '在线训练';
        },
      },
    },
    {
      path: "datalistDetails",
      element: <DatalistDetails />,
      handle: {
        crumb: () => {
          return '数据集列表';
        },
      },
    },
    {
      path: "datalist",
      element: <DataList />,
      handle: {
        crumb: () => {
          return '数据集';
        },
      },
    }, {
      path: "menu",
      element: <Menu />,
      handle: {
        crumb: () => {
          return '菜单管理';
        },
      },
    },
    {
      path: 'department',
      element: <Department />,
      handle: {
        crumb: () => {
          return '部门管理';
        },
      },
    }, {
      path: 'role',
      element: <Role />,
      handle: {
        crumb: () => {
          return '角色管理';
        },
      },
    },
    {
      path: 'user',
      element: <User />,
      handle: {
        crumb: () => {
          return '用户管理';
        },
      },
    },
    {
      path: 'tasks',
      element: <MainLayout />,
      errorElement: <Page404 />,
      id: 'tasks',
      loader: tasksLoader,
      handle: {
        crumb: () => {
          return '数据标注';
        },
      },
      children: [
        {
          index: true,
          element: <Tasks />,
        },
        {
          path: ':taskId',
          id: 'task',
          element: <Outlet />,
          loader: taskLoader,
          handle: {
            crumb: (data: TaskLoaderResult) => {
              return data?.task?.name;
            },
          },
          children: [
            {
              index: true,
              element: <Samples />,
            },
            {
              path: 'edit',
              element: <TaskEdit />,
              loader: async ({ params }) => {
                return params.taskId !== '0' ? '任务编辑' : '新建任务';
              },
              handle: {
                crumb: (data: string) => {
                  return data;
                },
              },
            },
            {
              path: 'samples',
              id: 'samples',
              element: <Outlet />,
              children: [
                {
                  path: ':sampleId',
                  element: <TaskAnnotation />,
                  loader: sampleLoader,
                  id: 'annotation',
                  handle: {
                    crumb: () => {
                      return '开始标注';
                    },
                  },
                },
                {
                  path: 'finished',
                  element: <TaskSamplesFinished />,
                  loader: taskLoader,
                  handle: {
                    crumb: () => {
                      return '标注结束';
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: 'menubtnpage',
      element: <Menubtnpage />,
      handle: {
        crumb: () => {
          return '菜单按钮';
        },
      },
    },
    {
      path: 'entrylog',
      element: <Entrylog />,
      handle: {
        crumb: () => {
          return '登录日志';
        },
      },
    },
    {
      path: 'operationlog',
      element: <Operationlog />,
      handle: {
        crumb: () => {
          return '操作日志';
        },
      },
    },
    ],
  },
  // {
  //   path: 'log',
  //   element: <Home />,
  //   handle: {
  //     crumb: () => {
  //       return '登录日志';
  //     },
  //   },
  //   children: [
  //     {
  //       path: 'entrylog',
  //       element: <Entrylog />,
  //       handle: {
  //         crumb: () => {
  //           return '登录日志';
  //         },
  //       },
  //     },
  //   ]
  // },
  {
    path: '*',
    element: <Page404 />,
  },
];

export default routes;
