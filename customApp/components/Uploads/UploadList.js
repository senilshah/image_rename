import * as React from 'react';
import Animate from 'rc-animate';
import classNames from 'classnames';
import { UploadListProps, UploadFile } from './interface';
import { Icon, Tooltip, Progress } from 'antd';
import Popconfirms from 'components/feedback/popconfirm';
import { ConfigConsumer, ConfigConsumerProps } from 'antd/lib/config-provider';
import Renderer from './Renderer';
import IntlMessages from 'components/utility/intlMessages';
import { setFileName } from 'customApp/helpers/functionHelper';
/*eslint-disable*/
const extname = (url: string) => {
  if (!url) {
    return '';
  }
  const temp = url.split('/');
  const filename = temp[temp.length - 1];
  const filenameWithoutSuffix = filename.split(/#|\?/)[0];
  return (/\.[^./\\]*$/.exec(filenameWithoutSuffix) || [''])[0];
};
const isImageFileType = (type: string): boolean =>
  !!type && type.indexOf('image/') === 0;
const isImageUrl = (file: UploadFile): boolean => {
  if (isImageFileType(file.type)) {
    return true;
  }
  const url = file.thumbUrl || file.url;
  const extension = extname(url);
  if (
    /^data:image\//.test(url) ||
    /(webp|svg|png|gif|jpg|jpeg|bmp|dpg)$/i.test(extension)
  ) {
    return true;
  } else if (/^data:/.test(url)) {
    // other file types of base64
    return false;
  } else if (extension) {
    // other file types which have extension
    return false;
  }
  return true;
};

export default class UploadList extends React.Component<UploadListProps, any> {
  static defaultProps = {
    listType: 'text',
    progressAttr: {
      strokeWidth: 2,
      showInfo: false,
    },
    showRemoveIcon: true,
    showPreviewIcon: true,
    showEditIcon: true,
  };

  state = {
    imageLoaded: false,
  };

  handleClose = (file: UploadFile, index) => {
    const { onRemove } = this.props;
    if (onRemove) {
      onRemove(file, index);
    }
  };

  handlePreview = (file: UploadFile, e: React.SyntheticEvent<HTMLElement>) => {
    const { onPreview } = this.props;
    if (!onPreview) {
      return;
    }
    e.preventDefault();
    return onPreview(file);
  };

  handleEdit = (
    file: UploadFile,
    originalFileData,
    e: React.SyntheticEvent<HTMLElement>
  ) => {
    const { onEdit } = this.props;
    if (!onEdit) {
      return;
    }

    e.preventDefault();
    return onEdit(file, originalFileData);
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
  previewFile = (file: File | Blob, callback: Function) => {
    if (!isImageFileType(file.type)) {
      return callback('');
    }
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  componentDidUpdate() {
    if (
      this.props.listType !== 'picture' &&
      this.props.listType !== 'picture-card'
    ) {
      return;
    }
    (this.props.items || []).forEach(file => {
      if (
        typeof document === 'undefined' ||
        typeof window === 'undefined' ||
        !window.FileReader ||
        !window.File ||
        !(file.originFileObj instanceof File) ||
        file.thumbUrl !== undefined
      ) {
        return;
      }
      file.thumbUrl = '';
      this.previewFile(file.originFileObj, (previewDataUrl: string) => {
        file.thumbUrl = previewDataUrl;
        this.forceUpdate();
      });
    });
  }

  renderUploadList = ({ getPrefixCls }: ConfigConsumerProps) => {
    const {
      prefixCls: customizePrefixCls,
      items = [],
      listType,
      showPreviewIcon,
      showRemoveIcon,
      showEditIcon,
      locale,
    } = this.props;
    const prefixCls = getPrefixCls('upload', customizePrefixCls);

    const list = items.map((file, index) => {
      let originalFileData = file;
      file = file.file ? file.file : file;
      const imageTypes = ['jpg', 'jpeg', 'png'];
      let extention = file.name.split('.').pop();
      let progress;
      let icon = (
        <Icon type={file.status === 'uploading' ? 'loading' : 'paper-clip'} />
      );

      if (listType === 'picture' || listType === 'picture-card') {
        if (listType === 'picture-card' && file.status === 'uploading') {
          icon = (
            <div className={`${prefixCls}-list-item-uploading-text`}>
              {locale.uploading}
            </div>
          );
        } else if (!file.thumbUrl && !file.url) {
          icon = (
            <Icon
              className={`${prefixCls}-list-item-icon`}
              type="file-pdf"
              theme="twoTone"
            />
          );
        } else {
          const thumbnail = isImageUrl(file) ? (
            <Renderer url={file.thumbUrl || file.url} prefix={prefixCls} />
          ) : (
            <Icon
              type="file-pdf"
              className={`${prefixCls}-list-item-icon`}
              theme="twoTone"
            />
          );
          icon = (
            <a
              className={`${prefixCls}-list-item-thumbnail`}
              onClick={e => this.handlePreview(file, e)}
              href="javascript:;"
              target="_blank"
              rel="noopener noreferrer"
            >
              {thumbnail}
            </a>
          );
        }
      }

      if (file.status === 'uploading') {
        // show loading icon if upload progress listener is disabled
        const loadingProgress =
          'percent' in file ? (
            <Progress
              type="line"
              {...this.props.progressAttr}
              percent={file.percent}
            />
          ) : null;

        progress = (
          <div className={`${prefixCls}-list-item-progress`} key="progress">
            {loadingProgress}
          </div>
        );
      }
      const infoUploadingClass = classNames({
        [`${prefixCls}-list-item`]: true,
        [`${prefixCls}-list-item-${file.status}`]: true,
      });
      const linkProps =
        typeof file.linkProps === 'string'
          ? JSON.parse(file.linkProps)
          : file.linkProps;
      const preview = file.url ? (
        <a
          target="_blank"
          rel="noopener noreferrer"
          className={`${prefixCls}-list-item-name`}
          title={
            originalFileData.fileName
              ? setFileName(originalFileData, file)
              : file.name
          }
          {...linkProps}
          href="javascript:;"
          onClick={e => this.handlePreview(file, e)}
        >
          {originalFileData.fileName
            ? setFileName(originalFileData, file)
            : file.name}
        </a>
      ) : (
        <span
          className={`${prefixCls}-list-item-name`}
          onClick={e => this.handlePreview(file, e)}
          title={
            originalFileData.fileName
              ? setFileName(originalFileData, file)
              : file.name
          }
        >
          {originalFileData.fileName
            ? setFileName(originalFileData, file)
            : file.name}
        </span>
      );
      const previewIcon =
        showPreviewIcon && file.thumbUrl ? (
          imageTypes.indexOf(extention) > -1 ? (
            <a
              href={file.url || file.thumbUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => this.handlePreview(file, e)}
              title={locale.previewFile}
            >
              <Icon type="eye-o" />
            </a>
          ) : (
            <a
              href={file.url || file.thumbUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={locale.previewFile}
            >
              <Icon type="eye-o" />
            </a>
          )
        ) : null;
      const removeIcon = showRemoveIcon ? (
        <Popconfirms
          title={<IntlMessages id="upload.delete" />}
          okText={<IntlMessages id="global.yes" />}
          cancelText={<IntlMessages id="global.no" />}
          placement="top"
          onConfirm={e => {
            this.handleClose(file, index);
          }}
          onCancel={e => {
            e.stopPropagation();
          }}
        >
          <Icon type="delete" title={locale.removeFile} />
        </Popconfirms>
      ) : null;

      const editIcon =
        showEditIcon && imageTypes.indexOf(extention) > -1 ? (
          <Icon
            type="edit"
            title="Bearbeiten"
            onClick={e => this.handleEdit(file, originalFileData, e)}
          />
        ) : null;

      const removeIconClose = showRemoveIcon ? (
        <Icon
          type="close"
          title={locale.removeFile}
          onClick={() => this.handleClose(file, index)}
        />
      ) : null;
      const actions =
        listType === 'picture-card' && file.status !== 'uploading' ? (
          <span className={`${prefixCls}-list-item-actions`}>
            {previewIcon}
            {editIcon}
            {removeIcon}
          </span>
        ) : (
          removeIconClose
        );
      let message;
      if (file.response && typeof file.response === 'string') {
        message = file.response;
      } else {
        message = (file.error && file.error.statusText) || locale.uploadError;
      }
      const iconAndPreview =
        file.status === 'error' ? (
          <Tooltip title={message}>
            {icon}
            {preview}
          </Tooltip>
        ) : (
          <span>
            {icon}
            {preview}
          </span>
        );

      return (
        <div className={infoUploadingClass} key={file.uid}>
          <div className={`${prefixCls}-list-item-info`}>{iconAndPreview}</div>
          {actions}
          <Animate transitionName="fade" component="">
            {progress}
          </Animate>
        </div>
      );
    });
    const listClassNames = classNames({
      [`${prefixCls}-list`]: true,
      [`${prefixCls}-list-${listType}`]: true,
    });
    const animationDirection =
      listType === 'picture-card' ? 'animate-inline' : 'animate';
    return (
      <Animate
        transitionName={`${prefixCls}-${animationDirection}`}
        component="div"
        className={listClassNames}
      >
        {list}
      </Animate>
    );
  };

  render() {
    return <ConfigConsumer>{this.renderUploadList}</ConfigConsumer>;
  }
}
