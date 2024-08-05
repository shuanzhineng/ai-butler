import type { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';
import { get } from 'lodash-es';

import commonController from '../utils/common';
import { config } from './config';
import { Button, message } from 'antd';

/**
 * 后端返回的结构由 { data, meta_data } 包裹
 * @param response
 * @returns
 */
export function successHandler(response: AxiosResponse<any>) {
  console.log(response)
  if (response.config.url && response.config.url.indexOf('/samples/export') != -1) {
    return response;
  } else {
    return response.data;
  }

}

function errorHandler(error: AxiosError) {
  // console.log(error.response.data.errors[0].details[0].type + ":" + error.response.data.errors[0].details[0].code + " " + error.response.data.data.errors[0].details[0].message)
  // const errMsgFromServer = get(error, 'response.data.msg');
  // const errCode = get(error, 'response.data.err_code');
  // 开发环境和开发自测环境显示报错信息
  // console.log(error.response.data.msg)
  //   commonController.notificationErrorMessage(get(error.response.data.msg, 'response.data', error), 5);

  message.error(error.response.data.msg)
  // if (window.DEV) {
  //   notification.error({
  //     message: `${errMsgFromServer || get(error, 'code')}【${get(error, 'response.status', '无状态码')}】`,
  //     description: (
  //       <>
  //         <p>{errCode}</p>
  //         <p>{error.message}</p>
  //         <p>{error.request.responseURL}</p>
  //       </>
  //     ),
  //   });
  // } else {
  //   commonController.notificationErrorMessage(get(error, 'response.data', error), 5);
  // }

  return Promise.reject(error);
}

const authorizationBearerSuccess = (data: any) => {
  const token = localStorage.token;
  console.log(data)

  if (token) {
    // if (data.url.indexOf('http://test-ai.shuanzhineng.com:9000/aibutler/admin/datasets/') != -1) {
    // } else {
    //   data.headers.Authorization = localStorage.token;
    // }
    data.headers.Authorization = localStorage.token;
  }
  return data;
};

const authorizationBearerFailed = (error: any) => {
  // 401一秒后跳转到登录页
  if (error?.response?.status === 401) {
    window.location.href = '/login';
    localStorage.removeItem('token')
    // setTimeout(() => {
    //   if (window.IS_ONLINE) {
    //     // goLogin();
    //   } else {
    //     // window.location.href = '/login';
    //   }
    // }, 1000);
  }

  return Promise.reject(error);
};
// console.log(import.meta.env.MODE)
let baseURL = process.env.VITE_BASE_URL
console.log(process.env)
//@ts-ignore
// switch (import.meta.env.MODE) {
//   case 'production':
//     baseURL = config.prod.baseUrl;
//     break;
//   case 'development':
//     baseURL = config.test.baseUrl;
// }
const requestConfig = {
  timeout: 60 * 1000,
  // baseURL: 'http://test-ai.shuanzhineng.com:8000',
  baseURL: baseURL,
};

const request = axios.create(requestConfig);

request.interceptors.request.use(authorizationBearerSuccess, authorizationBearerFailed);
request.interceptors.response.use(successHandler, errorHandler);
request.interceptors.response.use(undefined, authorizationBearerFailed);

export default request;
