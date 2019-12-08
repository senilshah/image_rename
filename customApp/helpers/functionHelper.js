import React from 'react';

export const setFileName = (originalFileData, file) => {
  if (
    originalFileData.fileName.split('.').length > 1 &&
    ['jpeg', 'jpg', 'png'].includes(originalFileData.fileName.split('.').pop())
  ) {
    return originalFileData.fileName;
  } else {
    return `${originalFileData.fileName}.${file.name.split('.').pop()}`;
  }
};
