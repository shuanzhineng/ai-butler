import { Button, Divider, Dropdown, Tag } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import Icon, { BellOutlined, PoweroffOutlined } from '@ant-design/icons';
import { FlexLayout } from '@labelu/components-react';

import { ReactComponent as ProfileIcon } from '@/assets/svg/personal.svg';
import { ReactComponent as LocalDeploy } from '@/assets/svg/local-deploy.svg';
import { goLogin } from '@/utils/sso';

import Breadcrumb from '../Breadcrumb';
import { LabeluLogo, NavigationWrapper } from './style';

const Homepage = () => {
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  const logout = async (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();

    localStorage.setItem('username', '');
    localStorage.setItem('token', '');

    if (window.IS_ONLINE) {
      await goLogin();
    } else {
      navigate('/login');
    }
  };

  return (
    <NavigationWrapper className="navigation" items="center" justify="space-between" padding="0 1.5rem">
      {/* <FlexLayout.Item flex items="center" gap={window.IS_ONLINE ? '.5rem' : '3rem'}>
        <Link to="/">
          <FlexLayout.Item flex items="center">
            <div style={{ fontSize: '30rpx', fontWeight: 'bold' }}>数安标注平台</div>
            {window.IS_ONLINE && (
              <Tag bordered={false} color="var(--color-fill-secondary)" style={{ color: 'var(--color-text)' }}>
                Beta
              </Tag>
            )}
          </FlexLayout.Item>
        </Link>
        {window.IS_ONLINE && <Divider type="vertical" />}
        <Breadcrumb hideHome={window.IS_ONLINE} />
      </FlexLayout.Item> */}
      <FlexLayout.Item flex gap="1rem">
        {/* {window.IS_ONLINE && (
          <a href="https://opendatalab.github.io/labelU/#/guide/install">
            <Button type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }} icon={<Icon component={LocalDeploy} />}>
              本地部署
            </Button>
          </a>
        )} */}
        {/* <Button
          type="link"
          icon={<BellOutlined />}
          href="https://opendatalab.github.io/labelU/#/"
          style={{ color: 'rgba(0, 0, 0, 0.85)' }}
          target="_blank"
          rel="noreferrer"
        >
          帮助文档
        </Button> */}
        {/* <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                label: (
                  <FlexLayout.Item onClick={logout} flex gap=".5rem" padding=".25rem 0">
                    <PoweroffOutlined />
                    <span>退出登录</span>
                  </FlexLayout.Item>
                ),
                key: 'logout',
                title: '退出登录',
              },
            ],
          }}
        >
          <Button icon={<Icon component={ProfileIcon} />} type="link" style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
            {username}
          </Button>
        </Dropdown> */}
      </FlexLayout.Item>
    </NavigationWrapper>
  );
};
export default Homepage;
