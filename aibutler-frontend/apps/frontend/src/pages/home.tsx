import React, { useState, useEffect } from 'react';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  BankOutlined,
  CalendarOutlined,
  ApartmentOutlined,
  CreditCardOutlined,
  ConsoleSqlOutlined,
  DatabaseOutlined,
  EditOutlined,
  ProjectOutlined,
  InteractionOutlined,
  PartitionOutlined,
  ProfileOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  DownOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import '../pages/home.scss'
import { Layout, Menu, Button, theme, App as AntApp, ConfigProvider } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Avatar, Space, Dropdown } from 'antd';
type MenuItem = Required<MenuProps>['items'][number];
const { Header, Sider, Content } = Layout;
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

// const items: MenuItem[] = [
//   getItem('系统管理', 'sub1', <SettingOutlined />, [
//     getItem('菜单管理', '/home/menu', <MenuOutlined />),
//     getItem('部门管理', '/home/department', <BankOutlined />),
//     getItem('角色管理', '/home/role', <UserOutlined />),
//     getItem('用户管理', '/home/user', <TeamOutlined />),
//   ]),
//   getItem('日志管理', 'sub2', <CalendarOutlined />, [
//     getItem('登录日志', '/home/entrylog', <ApartmentOutlined />),
//     getItem('操作日志', '/home/operationlog', <CreditCardOutlined />),

//   ]),
//   getItem('数据管理', 'sub3', <ConsoleSqlOutlined />, [
//     getItem('数据集', '/home/datalist', <DatabaseOutlined />),
//     getItem('数据标注', '/home/tasks', <EditOutlined />),

//   ]),
//   getItem('模型管理', 'sub4', <ProjectOutlined />, [
//     getItem('在线训练', '/home/modeltraining', <InteractionOutlined />),

//   ]),
//   getItem('应用管理', 'sub5', <PartitionOutlined />, [
//     getItem('在线推理', '/home/Apponline', <ProfileOutlined />),

//   ]),
// ];
import { IntlProvider } from 'react-intl';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import intl from 'react-intl-universal';

import enUS1 from '../locales/en-US';
import zhCN1 from '../locales/zh-CN';
import { localeConfig } from '../locales';
import RouterContainer from '../components/RouterContainer';
import themeToken from '../styles/theme.json';
import StaticAnt from '../StaticAnt';
import routes from '../routes';
import * as storage from '../utils/storage';
import { QueryProvider } from '../api/queryClient';
import GlobalStyle from '../styles/GlobalStyle';
import { jsonParse } from '@/utils';
import { any } from 'lodash/fp';

const App: React.FC = () => {
  const navigate = useNavigate()
  const currentRoute = useLocation()
  const [items, setItems] = useState([])
  const [rootSubmenuKeys, setrootSubmenuKeys] = useState([])
  const menusdata = [
    getItem('系统管理', 'sub1', <SettingOutlined />, [
      getItem('菜单管理', '/home/menu', <MenuOutlined />),
      getItem('部门管理', '/home/department', <BankOutlined />),
      getItem('角色管理', '/home/role', <UserOutlined />),
      getItem('用户管理', '/home/user', <TeamOutlined />),
    ]),
    getItem('日志管理', 'sub2', <CalendarOutlined />, [
      getItem('登录日志', '/home/entrylog', <ApartmentOutlined />),
      getItem('操作日志', '/home/operationlog', <CreditCardOutlined />),

    ]),
    getItem('数据管理', 'sub3', <ConsoleSqlOutlined />, [
      getItem('数据集', '/home/datalist', <DatabaseOutlined />),
      getItem('数据标注', '/home/tasks', <EditOutlined />),

    ]),
    getItem('模型管理', 'sub4', <ProjectOutlined />, [
      getItem('在线训练', '/home/modeltraining', <InteractionOutlined />),

    ]),
    getItem('应用管理', 'sub5', <PartitionOutlined />, [
      getItem('在线推理', '/home/Apponline', <ProfileOutlined />),

    ]),
  ];
  const menus = jsonParse(localStorage.getItem('Menu'))
  let itemsAry = [];
  if (menus) {
    menus.forEach((ele, eleindex) => {
      menusdata.forEach((item, itemindex) => {
        if (ele.name == item.label) {
          let ary = [];
          for (var i = 0; i < ele.children.length; i++) {
            for (var j = 0; j < item.children.length; j++) {
              if (ele.children[i].name == item.children[j].label) {
                ary.push({
                  key: item.children[j].key,
                  label: item.children[j].label,
                  icon: item.children[j].icon,
                });
              }
            }
          }
          if (ary.length > 0) {
            itemsAry.push({
              icon: item.icon,
              key: item.key,
              label: item.label,
              children: ary,
            });
          }
        }
      });
    });
  } else {
    navigate('/');
    localStorage.removeItem('token')
    localStorage.removeItem('Menu')
  }
  const [openKeys, setOpenKeys] = useState(['sub1']);
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const routeClick = (e: { key: string }) => {
    navigate(e.key)
  }
  const locale = storage.get('locale') || 'zh_CN';
  const getAntdLocale = () => {
    if (locale === 'en_US') {
      return enUS;
    } else if (locale === 'zh_CN') {
      return zhCN;
    }
  };

  useEffect(() => {
    setItems(itemsAry)
    let ary = []
    itemsAry.forEach(item => {
      ary.push(item.key)
    })
    setrootSubmenuKeys(ary)
    setOpenKeys([ary[0]])
    // console.log(currentRoute.pathname)
    // navigate(itemsAry[0].children[0].key);
    if (navigator.language.indexOf('zh-CN') > -1) {
      intl.init({
        currentLocale: 'zh-CN',
        locales: {
          'en-US': enUS1,
          'zh-CN': zhCN1,
        },
      });
    } else {
      intl.init({
        currentLocale: 'en-US',
        locales: {
          'en-US': enUS1,
          'zh-CN': zhCN1,
        },
      });
    }

  }, []);

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    if (latestOpenKey && rootSubmenuKeys.indexOf(latestOpenKey!) === -1) {
      setOpenKeys(keys);
    } else {
      setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item key="0" onClick={() => loginout()}>退出登录</Menu.Item>
    </Menu>
  );
  const loginout = () => {
    navigate('/login');
    setTimeout(() => {
      localStorage.removeItem('Menu')
      localStorage.removeItem('token')
    }, 10);
  }
  return (
    <Layout>
      <Header style={{
        padding: 10,
        // background: '#ecf1f6',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between'
      }}>
        <div className="demo-logo-active">
          <img src="../public/src/icons/favicon.ico" alt="" />
          <span>AI生产管理平台</span>
        </div>
        <div style={{
          // background: '#ecf1f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>

          <Dropdown overlay={menu} trigger={['hover']}>
            <a>
              {/* <DownOutlined /> */}
              <Avatar
                size={42}
                icon={<UserOutlined />}
                style={{
                  background: '#ecf1f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </a>
          </Dropdown>
        </div>
      </Header>
      <Layout >
        <Sider className='sidercoll' collapsed={collapsed} style={{ background: colorBgContainer }} onCollapse={(value) => setCollapsed(value)}>
          <Menu openKeys={openKeys} onOpenChange={onOpenChange} defaultSelectedKeys={[currentRoute.pathname]} selectedKeys={[currentRoute.pathname]} mode="inline" items={items} onClick={routeClick} />
          <div className='collIcon' onClick={() => setCollapsed(!collapsed)}>
            {
              collapsed ? <ArrowRightOutlined /> : <ArrowLeftOutlined />
            }
          </div>
        </Sider>
        <Content
          style={{
            // background: colorBgContainer,
            // borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 20px)',
            padding: '10px',
            paddingLeft: '20px'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
