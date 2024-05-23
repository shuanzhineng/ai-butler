import type { FormProps } from 'antd';
import { Input, Form } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FlexLayout } from '@labelu/components-react';

import { login } from '@/api/services/user';
import { ReactComponent as EmailIcon } from '@/assets/svg/email.svg';
import { ReactComponent as PasswordIcon } from '@/assets/svg/password.svg';

import LogoTitle from '../../components/LogoTitle';
import { ButtonWrapper, FormWrapper, LoginWrapper } from './style';
import { getMenu } from '../../api/aiButler'
import { jsonStringify } from '@/utils';
interface FormValues {
  username: string;
  password: string;
}

const LoginPage = () => {
  const [form] = Form.useForm<FormValues>();
  const navigate = useNavigate();
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      getMenu().then(res => {
        console.log(res)
        localStorage.setItem('Menu', jsonStringify(res.details))
        navigate('/');
      })
    },
  });

  const handleLogin: FormProps<FormValues>['onFinish'] = async (values) => {
    loginMutation.mutate(values);
  };

  const handleSubmit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    form.submit();
  };

  return (
    <LoginWrapper flex="column" justify="center" items="center">
      {/* <LogoTitle /> */}
      <FormWrapper gap=".5rem" flex="column">
        <Form<FormValues> form={form} onFinish={handleLogin}>
          <FlexLayout flex="column">
            <h1>登录</h1>
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请填写账号' },
                {
                  pattern: /^\S+$/,
                  message: '账号不能包含空格',
                },
              ]}
            >
              <Input placeholder="账号" prefix={<EmailIcon />} onPressEnter={handleSubmit} />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请填写密码' },
                {
                  pattern: /^\S+$/,
                  message: '密码不能包含空格',
                },
              ]}
            >
              <Input.Password
                placeholder="密码"
                prefix={<PasswordIcon />}
                visibilityToggle={false}
                onPressEnter={handleSubmit}
              />
            </Form.Item>
            <Form.Item>
              <ButtonWrapper loading={loginMutation.isPending} block type="primary" onClick={handleSubmit}>
                登录
              </ButtonWrapper>
            </Form.Item>
          </FlexLayout>
        </Form>
      </FormWrapper>
    </LoginWrapper>
  );
};
export default LoginPage;
