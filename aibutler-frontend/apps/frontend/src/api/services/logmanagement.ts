import request from '../request';
import type { LoginLogListResponse, OperationLogListResponse } from '../types';

export async function login_log_list(params: string): Promise<LoginLogListResponse> {
  return await request({
    url: `/system/logs/login-logs?${params}`,
    method: 'get',
  });
}

export async function operation_log_list(params: string): Promise<OperationLogListResponse> {
  // const result = await request.post('/account/oauth2/token', params);
  return await request({
    url: `/system/logs/access-logs?${params}`,
    method: 'get',
  });
}
