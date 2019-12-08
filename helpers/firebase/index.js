import * as firebase from 'firebase';
import ReduxSagaFirebase from 'redux-saga-firebase';
import '@firebase/firestore';
import '@firebase/functions';
import {
  getFileName,
  imgToBlob,
  isImageExtention,
} from 'customApp/helpers/fileHelper';
import { setFileName } from 'customApp/helpers/functionHelper';
import { firebaseConfig } from '../../settings';
import * as Reporting from 'customApp/helpers/reporting';
const valid =
  firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;

const firebaseApp = valid && firebase.initializeApp(firebaseConfig);
const secondApp = valid && firebase.initializeApp(firebaseConfig, 'secondApp');
const firebaseAuth = valid && firebase.auth;

class FirebaseHelper {

  uploadFilePromise = async (
    base,
    fileName,
    file,
    origionalName,
    ref,
    progressMsg
  ) => {
    let that = ref;
    return new Promise((resolve, reject) => {
      if (
        !progressMsg[fileName] ||
        typeof progressMsg[fileName] === 'undefined'
      ) {
        progressMsg[fileName] = {};
      }
      progressMsg[fileName].name = origionalName;
      const uploadTask = this.storageRef.child(`${base}/${fileName}`).put(file);
      uploadTask.on(
        'state_changed',
        snapshot => {
          var progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressMsg[fileName].progress = progress.toFixed(1);
          that.setState({ progressMsg });
        },
        function error(err) {
          Reporting.Error(err);
          reject();
        },
        function complete() {
          resolve(true);
        }
      );
    });
  };

  onFileUpload = async (
    base,
    files,
    ref,
    progressMsg,
    addUid = false,
    useFileName = null
  ) => {
    let records = files.map(async (file, index) => {
      let newFileName = null;
      if (file.file) {
        newFileName = setFileName(file, file.file);
        file = file.file;
      }
      let originFile = newFileName !== null ? newFileName : file.name;
      originFile = originFile
        .split(' ')
        .join('_')
        .toLowerCase();
      let fileName = getFileName(originFile, index);
      let extention = fileName
        .split('.')
        .pop()
        .toLowerCase();
      var string = file.fullName && file.fullName.indexOf(`${base}/`) !== -1;
      let fileObj = {};
      if (string && newFileName === null) {
        let thumb = file.fullName.split('/').pop();
        fileObj = {
          name: file.name,
          path: file.fullName,
        };
        if (file.id) fileObj.id = file.id;
        if (file.created_at) fileObj.created_at = file.created_at;
        if (isImageExtention(extention)) {
          fileObj.thumb = `${base}_thumb/thumb_${thumb}`;
        }
      } else {
        if (useFileName) {
          fileName = useFileName;
        }
        await this.uploadFilePromise(
          base,
          fileName,
          file.originFileObj,
          newFileName !== null ? newFileName : originFile,
          ref,
          progressMsg
        );
        fileObj = {
          name: newFileName !== null ? newFileName : originFile,
          path: `${base}/${fileName}`,
        };
        if (isImageExtention(extention)) {
          fileObj.thumb = `${base}_thumb/thumb_${fileName}`;
        }
        if (addUid) {
          fileObj.id = file.uid;
        }
      }
      if (file.created_at) fileObj.created_at = file.created_at;
      return await fileObj;
    });
    return Promise.all(records);
  };
}

export default new FirebaseHelper();
