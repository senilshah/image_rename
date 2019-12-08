export const imgToBlob = url => {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      resolve(this.response);
    };
    xhr.onerror = function(error) {
      reject(error);
    };
    xhr.send();
  });
};

export const getFileName = (name, index) => {
  let split = name.split('.');
  return `${split[0]}-${new Date().getTime()}-${index}.${split.pop()}`;
};

export const isImageExtention = extention => {
  return ['jpg', 'png', 'jpeg'].indexOf(extention) !== -1;
};
