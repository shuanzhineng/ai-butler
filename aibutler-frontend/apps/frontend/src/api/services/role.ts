import request from '../request';
import type {
    TreeResponse,
    PutRoleDataType,
    PutRolePermissionDataType,
    RoleDetailResponse,
    RoleListResponse,
    UnfoldDeptListResponse,
    UserListResponse,
    CreateUserDataType
} from '../types';

export async function role_list(params: string = ""): Promise<RoleListResponse> {
    return await request({
        url: `/system/roles?${params}`,
        method: 'get',
    });
}

export async function update_role(role_id: string, data: PutRoleDataType): Promise<RoleListResponse> {
    return await request({
        url: `/system/roles/${role_id}`,
        method: 'put',
        data: data,
    });
}

export async function put_role_permission(role_id: string, data: PutRolePermissionDataType) {
    return await request({
        url: `/system/roles/${role_id}/permission`,
        method: 'put',
        data: data,
    });
}

export async function delete_role(role_id: string) {
    return await request({
        url: `/system/roles/${role_id}`,
        method: 'delete',
    });
}

export async function create_role(data: PutRoleDataType): Promise<RoleListResponse> {
    return await request({
        url: `/system/roles`,
        method: 'post',
        data: data,
    });
}

export async function menu_tree(): Promise<TreeResponse> {
    return await request({
        url: `/system/menus/full-tree`,
        method: 'get',
    });
}

export async function dept_tree(): Promise<TreeResponse> {
    return await request({
        url: `/system/depts/full-tree`,
        method: 'get',
    });
}

export async function unfold_dept_tree(name: string): Promise<UnfoldDeptListResponse> {
    return await request({
        url: `/system/depts/unfold?page=1&size=100&keyword=${name}`,
        method: 'get',
    });
}

export async function retrieve_role(role_id: string): Promise<RoleDetailResponse> {
    return await request({
        url: `/system/roles/${role_id}`,
        method: 'get',
    });
}

export async function user_list(params: string): Promise<UserListResponse> {
    return await request({
        url: `/system/users?${params}`,
        method: 'get',
    });
}

export async function create_user(data: CreateUserDataType): Promise<RoleListResponse> {
    return await request({
        url: `/system/users`,
        method: 'post',
        data: data,
    });
}

export async function update_user(user_id: string, data: CreateUserDataType): Promise<RoleListResponse> {
    return await request({
        url: `/system/users/${user_id}`,
        method: 'put',
        data: data,
    });
}

export async function delete_user(user_id: string) {
    return await request({
        url: `/system/users/${user_id}`,
        method: 'delete',
    });
}

