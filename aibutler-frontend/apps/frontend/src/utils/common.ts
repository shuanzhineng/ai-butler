import { jsonParse } from '.';
import { ErrorMessages } from '../api/constant';
import type { MediaType } from '../api/types';
import { FileExtension, MediaFileSize } from '../constants/mediaType';
import { message } from '../StaticAnt';
import { config } from '../api/config'
const commonController = {
  isNullObject(obj: any) {
    if (typeof obj !== 'object') {
      return false;
    }

    return Object.keys(obj).length === 0;
  },
  checkEmail(event: any, emailValue?: any) {
    const email: any = event ? event.target.value : emailValue;
    let result = false;
    if (email !== undefined && email.indexOf('@') > -1 && email.indexOf('@') === email.lastIndexOf('@')) {
      result = true;
    }
    if (!result) {
      commonController.notificationErrorMessage({ msg: '请填写正确的邮箱' }, 2);
    }
    return result;
  },
  checkPassword(event: any, passwordValue?: any) {
    const password: any = event ? event.target.value : passwordValue;
    let result = false;
    if (password !== undefined && password.length >= 6 && password.length <= 18) {
      result = true;
    }
    if (!result) {
      commonController.notificationErrorMessage({ self: true, msg: '请填写6-18字符密码' }, 2);
    }
    return result;
  },
  isEmail(value: string) {
    let result = false;
    const index = value.indexOf('@');
    if (index > -1 && value.lastIndexOf('@') === index) {
      result = true;
    }
    return result;
  },
  isPassword(value: string) {
    return value.length >= 6;
  },
  isInputValueNull(targetValue: any) {
    let result = true;
    if (targetValue) {
      result = false;
    }
    return result;
  },
  checkObjectHasUndefined(obj: any) {
    const result: any = { tag: false };
    for (const key in obj) {
      if ((!obj[key] || obj[key] === undefined) && obj[key] !== 0) {
        result.tag = true;
        switch (key) {
          case 'username':
            result.key = '请填写邮箱';
            break;
          case 'password':
            result.key = '请填写密码';
            break;
          case 'repeatPassword':
            result.key = '两次输入的密码不一致';
            break;
        }
        break;
      }
    }
    return result;
  },
  notificationErrorMessage(error: any, time: number) {
    const errCode = error.err_code;
    if (errCode || errCode === 0) {
      const errorMessage = ErrorMessages[errCode];
      if (errorMessage) {
        message.error(errorMessage, time);
      } else {
        message.error('没有后端匹配的错误信息', time);
      }
    }
    if (error && !error.err_code) {
      const messageValue = error.msg ? error.msg : error.message;
      message.error(messageValue, time);
    }
    if (!error) {
      message.error('请求出现问题', 1);
    }
  },
  notificationSuccessMessage(info: any, time: number) {
    message.success(info.message, time);
  },
  notificationWarnMessage(info: any, time: number) {
    message.warning(info.message, time);
  },
  notificationInfoMessage(info: any, time: number) {
    message.info(info.message, time);
  },
  debounce(fn: any, delayTime: number) {
    let timer: any = null;
    return function (name: any) {
      if (timer || timer == 0) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(name), delayTime);
      } else {
        timer = setTimeout(() => fn(name), delayTime);
      }
    };
  },
  reducer() {
    // uploadFile().
  },
  isOverSize(size: number, type: MediaType) {
    const maxSize = MediaFileSize[type as keyof typeof MediaFileSize];

    return size > maxSize * 1024 * 1024;
  },
  isCorrectFileType(fileName: string, type: MediaType) {
    let result = false;
    const correctType = FileExtension[type];
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex > -1) {
      const _type = fileName.slice(dotIndex + 1);
      // console.log(correctType)
      if (correctType.indexOf(_type) > -1) {
        result = true;
      }
    }
    return result;
  },
  getUsername(state: any) {
    return state.user.newUsername;
  },
  getConfigStep(state: any) {
    return state.existTask.configStep;
  },
  getHaveConfigedStep(state: any) {
    return state.existTask.haveConfigedStep;
  },
  findElement(arr: any[], index: number, path: string) {
    const pathsArr = path.split('/');
    for (let itemIndex = 0; itemIndex < arr.length; itemIndex++) {
      const item = arr[itemIndex];
      if (item.path === pathsArr[index]) {
        if (index === pathsArr.length - 1) {
          arr.splice(itemIndex, 1);
          return;
        } else {
          commonController.findElement(item.children, index + 1, path);
          return;
        }
      }
    }
  },
  updateElement(arr: any[], index: number, path: string, updateValue: boolean) {
    const pathsArr = path.split('/');
    for (let itemIndex = 0; itemIndex < arr.length; itemIndex++) {
      const item = arr[itemIndex];
      if (item.path === pathsArr[index]) {
        if (index === pathsArr.length - 1) {
          item.hasUploaded = updateValue;
          return;
        } else {
          commonController.findElement(item.children, index + 1, path);
          return;
        }
      }
    }
  },
  transformFileList(jsondata: any, sampleId: number) {
    const id = sampleId;
    console.log(jsondata)
    const data = jsondata.data;
    // console.log(data)
    // console.log(sampleId)
    let url = data.urls[sampleId];
    let baseURL = '';
    //@ts-ignore
    switch (import.meta.env.MODE) {
      case 'production':
        baseURL = config.prod.baseUrl;
        break;
      case 'development':
        baseURL = config.test.baseUrl;
    }
    for (const _sampleId in data.urls) {
      url = baseURL + data.urls[_sampleId];
    }
    // delete
    let newResult: any = '';
    if (data.result && !commonController.isNullObject(data.result)) {
      newResult = data.result;
    } else {
      newResult = '{}';
    }
    const finalResult = [
      {
        id,
        url,
        result: newResult,
      },
    ];

    return finalResult;
  },
  drawImg(divId: number, src: string) {
    // eslint-disable-next-line no-console
    console.log(divId + '');
    const img: any = window.document.getElementById(divId + '');
    img.onload = () => { };
    // @ts-ignore
    img.src = src;
  },
  downloadToFile(data: any) {
    const info = new Blob(data.data);
    // @ts-ignore
    const dataTimestamp = new Date().getTime();
    try {
      // @ts-ignore
      window.saveAs(info, dataTimestamp + '.json');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  },
  isOverFontCount(field: string, limitedLength: number) {
    let result = false;
    if (field.length > limitedLength) {
      result = true;
      commonController.notificationErrorMessage({ message: '超过限定的' + limitedLength + '字数' }, 1);
    }
    return result;
  },
};
export default commonController;
