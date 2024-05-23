export interface AttachmentDeleteCommand {
  /** Attachment Ids description: attachment file id */
  attachment_ids: number[];
}

export interface AttachmentResponse {
  /** Id description: upload file id */
  id?: number;
  /** Url description: upload file url */
  url?: string;
}

export interface BasicConfigCommand {
  /** Name description: task name */
  name: string;
  /** Description description: task description */
  description?: string;
  /** Tips description: task tips */
  tips?: string;
}

export interface BodyCreateApiV1TasksTaskIdAttachmentsPost {
  /** File */
  file: string;
}

export interface CommonDataResp {
  /** Ok */
  ok: boolean;
}

export interface CreateApiV1TasksTaskIdAttachmentsPostParams {
  task_id: number | string;
  path: string;
}

export interface CreateApiV1TasksTaskIdSamplesPostParams {
  task_id: number | string;
}

export interface SampleData {
  id?: number | string;
  state?: SampleState;
  result: string;
  fileNames: Record<number, string>;
  urls: Record<number, string>;
}

export interface CreateSampleCommand {
  /** Attachement Ids description: attachment file id */
  attachement_ids: number[];
  /** Data description: sample data, include filename, file url, or result */
  data?: SampleData;
}

export interface CreateSampleResponse {
  /** Ids description: attachment ids */
  ids?: number[] | string[];
}

export interface DeleteApiV1TasksTaskIdAttachmentsDeleteParams {
  task_id: number | string;
}

export interface DeleteApiV1TasksTaskIdDeleteParams {
  task_id: number | string;
}

export interface DeleteSampleCommand {
  /** Sample Ids description: attachment file id */
  sample_ids: number[] | string[];
}

export interface DownloadAttachmentApiV1TasksAttachmentFilePathGetParams {
  file_path: string;
}

export interface ExportApiV1TasksTaskIdSamplesExportPostParams {
  task_id: number | string;
  export_type: ExportType;
}

export interface ExportSampleCommand {
  /** Sample Ids description: sample id */
  sample_ids?: number[] | string[];
}

export enum ExportType {
  JSON = 'json',
  // MASK = 'MASK',
  // COCO = 'COCO',
  XML = 'xml',
}

export interface GetApiV1TasksTaskIdGetParams {
  task_id: number | string;
}

export interface GetApiV1TasksTaskIdSamplesSampleIdGetParams {
  task_id: number | string;
  sample_id: number | string;
}

export interface GetPreApiV1TasksTaskIdSamplesSampleIdPreGetParams {
  task_id: number | string;
  sample_id: number | string;
}

export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

export interface ListByApiV1TasksGetParams {
  page?: number;
  page_size?: number;
}

export interface ListByApiV1TasksTaskIdSamplesGetParams {
  task_id: number | string;
  after?: number;
  before?: number;
  page?: number;
  page_size?: number;
  sort?: string;
}

export interface LoginCommand {
  /** Username */
  username: string;
  /** Password */
  password: string;
}

export interface LoginResponse {
  /** Token description: user credential */
  token: string;
}

export interface LogoutResponse {
  /** Msg */
  msg: string;
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  // TODO: 后续支持
  // POINT_CLOUD = 'POINT_CLOUD',
}

export interface MetaData {
  /** Total */
  total: number;
  /** Page */
  page?: number;
  /** Size */
  page_size: number;
}

export interface OkRespAttachmentResponse {
  data: AttachmentResponse;
}

export interface OkRespCommonDataResp {
  data: CommonDataResp;
}
export interface OkRespCreateSampleResponse {
  data: CreateSampleResponse;
}

export interface OkRespLoginResponse {
  data: LoginResponse;
}

export interface OkRespUserInfo {
  data: SignupResponse;
}

export interface OkRespLogoutResponse {
  data: LogoutResponse;
}

export interface OkRespSampleResponse {
  data: SampleResponse;
}

export interface OkRespSignupResponse {
  data: SignupResponse;
}

export interface OkRespTaskResponse {
  data: TaskResponse;
}

export interface OkRespTaskResponseWithStatics {
  data: TaskResponseWithStatics;
}

interface EnumType {
  name: string;
  value: string | number;
}

export interface TreeFulldata {
  children?: TreeFulldata[];
  code?: string;
  create_time?: string;
  disabled?: boolean;
  genre: EnumType;
  icon?: string;
  id?: number;
  is_link?: boolean;
  link_url?: string;
  name?: string;
  sort?: number;
  update_time?: string;
  web_path?: string;
}

export interface OkRespTreeFull {
  code?: string;
  /** Data */
  details: TreeFulldata[];
  msg?: string;
}

export interface MenuResponse {
  code: string;
  details: [];
  msg: string;
}
export interface MenuButtonItems {
  id: number;
  name: string;
  sort: number;
  disabled: boolean;
  apis: [];
}
export interface MenuButtonDetails {
  items: MenuButtonItems[];
  total: number
}

export interface MenuButtonListResponse {
  code?: string;
  /** Data */
  details: MenuButtonDetails;
  msg?: string;
}

export interface PatchSampleCommand {
  /** Data description: sample data, include filename, file url, or result */
  data?: SampleData;
  /** Annotated Count description: annotate result count */
  annotated_count?: number;
  /** description: sample file state, must be 'SKIPPED', 'NEW', or None */
  state?: SampleState;
}

export interface SampleResponse {
  /** Id description: annotation id */
  id?: number;
  /** State description: sample file state, NEW is has not start yet, DONE is completed, SKIPPED is skipped */
  state?: SampleState;
  /** Data description: sample data, include filename, file url, or result */
  data?: SampleData;
  /** Annotated Count description: annotate result count */
  annotated_count?: number;
  /** Created At description: task created at time */
  created_at?: string;
  /** Created By description: task created by */
  created_by?: UserResp;
  /** Updated At description: task updated at time */
  updated_at?: string;
  /** Updated By description: task updated by */
  updated_by?: UserResp;
  menu_id?: number;
}

export interface SampleListResponse {
  meta_data?: MetaData;
  /** Data */
  data: SampleResponse[];
  results: any;
}

export enum SampleState {
  NEW = 'NEW',
  SKIPPED = 'SKIPPED',
  DONE = 'DONE',
}

export interface SignupCommand {
  /** Username */
  username: string;
  /** Password */
  password: string;
}

export interface SignupResponse {
  /** Id */
  id: number;
  /** Username */
  username: string;
}

export interface TaskResponse {
  details: object
}

export interface TaskResponseWithStatics {
  /** Id description: task id */
  id?: number;
  /** Name description: task name */
  name?: string;
  /** Description description: task description */
  description?: string;
  /** Tips description: task tips */
  tips?: string;
  /** Config description: task config content */
  config?: string;
  /** Media Type description: task media type: IMAGE, VIDEO */
  media_type?: MediaType;
  /** Status description: task status: DRAFT, IMPORTED, CONFIGURED, INPROGRESS, FINISHED */
  status?: TaskStatus;
  /** Created At description: task created at time */
  created_at?: string;
  /** Created By description: task created at time */
  created_by?: UserResp;
  stats?: TaskStatics;
}

export enum TaskStatus {
  DRAFT = 'DRAFT',
  IMPORTED = 'IMPORTED',
  CONFIGURED = 'CONFIGURED',
  INPROGRESS = 'INPROGRESS',
  FINISHED = 'FINISHED',
}

export interface TaskListResponseWithStatics {
  meta_data?: MetaData;
  /** Data */
  data: TaskResponseWithStatics[];
}

export interface TaskStatics {
  /** New description: count for task data have not labeled yet */
  new?: number;
  /** Done description: count for task data already labeled */
  done?: number;
  /** Skipped description: count for task data skipped */
  skipped?: number;
}

export interface UpdateApiV1TasksTaskIdPatchParams {
  task_id: number;
}

export interface UpdateApiV1TasksTaskIdSamplesSampleIdPatchParams {
  task_id: any;
  sample_id: any;
}

export interface UpdateCommand {
  /** Name description: task name */
  name?: string;
  /** Description description: task description */
  description?: string;
  /** Tips description: task tips */
  tips?: string;
  /** description: task config content */
  media_type?: MediaType;
  /** Config description: task config content */
  config?: string;
}

export interface UserResp {
  /** Id */
  id?: number;
  /** Username */
  username?: string;
}

export interface ValidationError {
  /** Location */
  loc: any[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}
export interface CreatorType {
  id: number;
  name: string;
  username: string;
}

export interface SetCreateMenu {
  name: string;
  code: string;
  icon: string;
  sort: number;
  is_link: boolean;
  link_url: string;
  genre: string;
  web_path: string;
  disabled: boolean;
  parent_id: null;
}

export interface MenuTreeDetails {
  id: number;
  name: string;
  code: string;
  icon: string;
  sort: number;
  is_link: boolean;
  link_url: string;
  genre: string;
  web_path: string;
  disabled: boolean;
  parent_id: number | null;
  parent?: MenuTreeDetails;
  details: object;
}

export interface TreeDetailResponse {
  code?: string;
  details: MenuTreeDetails;
  msg?: string;
}
export interface depResponse {
  code?: string;
  details:
  {
    items: [];
    total: Number
  };
  msg?: string;
}

export interface SetCreateBtn {
  name: string;
  code: string;
  sort: number;
  disabled: boolean;
  apis: [];
}

export interface SetCreateDepts {
  name: string;
  key: string;
  owner: string;
  phone: string;
  email: string;
  description: string;
  sort: number;
  parent_id: null;
}

export interface OkRespTreedept {
  code?: string;
  /** Data */
  details: {
    items: [];
    total: number
  };
  msg?: string;
}
export interface LoginLogItemResponse {
  id: number | string;
  is_sucess: boolean;
  create_time: string;
  username: string;
  ip_address: string;
  browser: string;
  os: string;
  http_status_code: number | string;
  is_success: boolean;
}

export interface LoginLogItemsResponse {
  items: LoginLogItemResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface LoginLogListResponse {
  code: string;
  msg: string;
  details: LoginLogItemsResponse;
}

export interface Creator {
  id: string | number;
  username: string;
  name: string;
}

export interface OperationLogItemResponse {
  id: number | string;
  api: string;
  method: string;
  request_body: string;
  response_body: string;
  user_agent: string;
  create_time: string;
  username: string;
  ip_address: string;
  browser: string;
  os: string;
  http_status_code: number | string;
  is_success: boolean;
  creator: Creator;
}

export interface OperationLogItemsResponse {
  items: OperationLogItemResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface OperationLogListResponse {
  code: string;
  msg: string;
  details: OperationLogItemsResponse;
}

export interface NameValueResponse {
  name: string;
  value: number;
}

export interface RoleItemResponse {
  id: string | number;
  create_time: string;
  name: string;
  code: string;
  disabled: boolean;
  sort: number | string;
  description: string;
  data_range: NameValueResponse;
}

export interface RoleItemsResponse {
  items: RoleItemResponse[];
  msg: string;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface RoleListResponse {
  code: string;
  details: RoleItemsResponse;
}

export interface RoleDetailItemResponse {
  id: string | number;
  create_time: string;
  name: string;
  code: string;
  disabled: boolean;
  sort: number | string;
  description: string;
  data_range: NameValueResponse;
  menu_ids: number[];
  dept_ids: number[];
}

export interface RoleDetailResponse {
  code: string;
  msg: string;
  details: RoleDetailItemResponse;
}

export interface PutRoleDataType {
  name: string;
  code: string;
  disabled: boolean;
  sort: number;
  description: string;
}

export interface PutRolePermissionDataType {
  data_range: number;
  menu_ids: number[] | any;
  dept_ids?: number[] | any;
}

export interface TreeDetail {
  id: number;
  name: string;
  children: TreeDetail[];
}

export interface TreeResponse {
  code: string;
  msg: string;
  details: TreeDetail[];
}

export interface UnfoldDeptDetail {
  id: number;
  name: string;
  children?: [];
}

export interface UnfoldDeptItems {
  items: UnfoldDeptDetail[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface UnfoldDeptListResponse {
  code: string;
  msg: string;
  details: UnfoldDeptItems;
}

export interface UserListDetails {
  items: {
    id: number;
    create_time: string;
    update_time: string;
    is_superuser: boolean;
    name: string;
    username: string;
    phone: string;
    email: string;
    disabled: boolean;
    description: string;
    roles: { id: number; name: string }[];
    depts: { id: number; name: string }[];
  }[];
  msg: string;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface UserListResponse {
  code: string;
  msg: string;
  details: UserListDetails;
}

export interface CreateUserDataType {
  name: string;
  username: string;
  password?: string;
  phone: string;
  email: string;
  disabled: boolean;
  dept_ids: [];
  role_ids: [];
}

export interface SetCreateDatagroup {
  name: string;
  description: string;
  annotation_type: string;
}

export interface GetDatagroupDetail {
  items: {
    id: number;
    create_time: string;
    update_time: string;
    name: string;
    data_type: { name: string; value: string };
    annotation_type: { name: string; value: string };
    creator: { name: string; id: number; username: string };
    disabled: boolean;
    description: string;
    data_set_count: number;
  }[];
  msg: string;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface GetDatagroup {
  code: string;
  msg: string;
  details: GetDatagroupDetail;
}

export interface SetCreategrouop {
  description: string;
  file_id: number;
}

export interface CreateDataGroup {
  name: string;
  description: string;
  annotation_type: string;
}

export interface CreateDataSets {
  file_id: number;
  description: string;
}

export interface DataSetDownloadUrlResponse {
  code: string;
  msg: string;
  details: { presigned_download_url: string };
}

export interface DataSetUploadUrlResponse {
  code: string;
  msg: string;
  details: { presigned_upload_url: string; file_id: number };
}

export interface GetDataSetsDetails {
  items: {
    id: number;
    version: string;
    description: string;
    file: { filename: string };
  }[];
  msg: string;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface GetDataSetsResponse {
  code: string;
  msg: string;
  details: GetDataSetsDetails;
}
export interface SetCreatetrain {
  description: string;
  name: string;
  ai_model_type: string;
}
export interface SetCreatemodel {
  description: string;
  ai_model_type: string;
  framework: string;
  network: string;
  data_set_ids: [];
  params: object;
}

export interface TrainGroupListDetails {
  items: {
    id: number;
    name: string;
    description: string;
    create_time: string;
    ai_model_type: { name: string; value: string };
    disabled: boolean;
    creator: { id: number; name: string; username: string };
    task_count_stat: { WAITING: number; TRAINING: number; FAILURE: number; FINISH: number };
  }[];
  msg: string;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TrainGroupListResponse {
  code: string;
  msg: string;
  details: TrainGroupListDetails;
}

export interface TrainTaskListDetailsResponse {
  items: {
    id: number;
    description: string;
    create_time: string;
    start_datetime: string;
    end_datetime: string;
    version: number;
    status: { name: string; value: string };
    framework: string;
    network: string;
    creator: { id: number; name: string; username: string };
    params: {
      imgsz: number;
      device: string;
      epochs: number;
      save_period: number;
      train_data_ratio: number;
      batch_size: number;

      seed?: number;
      cos_lr?: boolean;
      freeze?: number[];
      workers?: number;
      optimizer?: string;
      multi_scale?: boolean;
      label_smoothing?: number;
      train_hyp_params?: any;
    };
  }[];
  msg: string;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TrainTaskListResponse {
  code: string;
  msg: string;
  details: TrainTaskListDetailsResponse;
}

export interface ModifPsw {
  password: string;
  password2: string;
}
