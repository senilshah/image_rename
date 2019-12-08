import * as React from 'react';
import { polyfill } from 'react-lifecycles-compat';
import RcUpload from 'rc-upload';
import classNames from 'classnames';
import uniqBy from 'lodash/uniqBy';
import findIndex from 'lodash/findIndex';
import Dragger from './Dragger';
import UploadList from './UploadList';
import {
  RcFile,
  UploadProps,
  UploadState,
  UploadFile,
  UploadLocale,
  UploadChangeParam,
} from './interface';
import {
  T,
  fileToObject,
  genPercentAdd,
  getFileItem,
  removeFileItem,
} from './utils';
import LocaleReceiver from 'antd/lib/locale-provider/LocaleReceiver';
import defaultLocale from 'antd/lib/locale-provider/default';
import { ConfigConsumer, ConfigConsumerProps } from 'antd/lib/config-provider';

import { DraggerStyle } from './style/upload.style';

export { UploadProps };

class Upload extends React.Component<UploadProps, UploadState> {
  static Dragger: typeof Dragger;

  static defaultProps = {
    type: 'select',
    multiple: false,
    action: '',
    data: {},
    accept: '',
    beforeUpload: T,
    showUploadList: true,
    listType: 'text', // or picture
    className: '',
    disabled: false,
    supportServerRender: true,
  };

  static getDerivedStateFromProps(nextProps: UploadProps) {
    if ('fileList' in nextProps) {
      return {
        fileList: nextProps.fileList || [],
      };
    }
    return null;
  }

  recentUploadStatus: boolean | PromiseLike<any>;

  progressTimer: any;

  upload: any;

  constructor(props: UploadProps) {
    super(props);

    this.state = {
      fileList: props.fileList || props.defaultFileList || [],
      dragState: 'drop',
    };
  }

  componentWillUnmount() {
    this.clearProgressTimer();
  }

  onStart = (file: RcFile) => {
    const targetItem = fileToObject(file);
    targetItem.status = 'uploading';

    const nextFileList = this.state.fileList.concat();

    const fileIndex = findIndex(
      nextFileList,
      ({ uid }: UploadFile) => uid === targetItem.uid
    );
    if (fileIndex === -1) {
      nextFileList.push(targetItem);
    } else {
      nextFileList[fileIndex] = targetItem;
    }

    this.onChange({
      file: targetItem,
      fileList: nextFileList,
    });
    // fix ie progress
    if (!window.FormData) {
      this.autoUpdateProgress(0, targetItem);
    }
  };

  autoUpdateProgress(_: any, file: UploadFile) {
    const getPercent = genPercentAdd();
    let curPercent = 0;
    this.clearProgressTimer();
    this.progressTimer = setInterval(() => {
      curPercent = getPercent(curPercent);
      this.onProgress(
        {
          percent: curPercent * 100,
        },
        file
      );
    }, 200);
  }

  onSuccess = (response: any, file: UploadFile) => {
    this.clearProgressTimer();
    try {
      if (typeof response === 'string') {
        response = JSON.parse(response);
      }
    } catch (e) {
      /* do nothing */
    }
    const fileList = this.state.fileList;
    const targetItem = getFileItem(file, fileList);
    // removed
    if (!targetItem) {
      return;
    }
    targetItem.status = 'done';
    targetItem.response = response;
    this.onChange({
      file: { ...targetItem },
      fileList,
    });
  };

  onProgress = (e: { percent: number }, file: UploadFile) => {
    const fileList = this.state.fileList;
    const targetItem = getFileItem(file, fileList);
    // removed
    if (!targetItem) {
      return;
    }
    targetItem.percent = e.percent;
    this.onChange({
      event: e,
      file: { ...targetItem },
      fileList: this.state.fileList,
    });
  };

  onError = (error: Error, response: any, file: UploadFile) => {
    this.clearProgressTimer();
    const fileList = this.state.fileList;
    const targetItem = getFileItem(file, fileList);
    // removed
    if (!targetItem) {
      return;
    }
    targetItem.error = error;
    targetItem.response = response;
    targetItem.status = 'error';
    this.onChange({
      file: { ...targetItem },
      fileList,
    });
  };

  handleRemove(file: UploadFile, index) {
    const { onRemove } = this.props;
    const { status } = file;

    file.status = 'removed'; // eslint-disable-line

    Promise.resolve(
      typeof onRemove === 'function' ? onRemove(file, index) : onRemove
    ).then(ret => {
      // Prevent removing file
      if (ret === false) {
        file.status = status;
        return;
      }

      const removedFileList = removeFileItem(file, this.state.fileList);
      if (removedFileList) {
        this.onChange({
          file,
          fileList: removedFileList,
        });
      }
    });
  }

  handleManualRemove = (file: UploadFile, index) => {
    if (this.upload) {
      this.upload.abort(file);
    }
    this.handleRemove(file, index);
  };

  onChange = (info: UploadChangeParam) => {
    if (!('fileList' in this.props)) {
      this.setState({ fileList: info.fileList });
    }

    const { onChange } = this.props;
    if (onChange) {
      onChange(info);
    }
  };

  onFileDrop = e => {
    this.setState({
      dragState: e.type,
    });
  };

  onDragDrop = e => {
    this.setState({
      dragEvent: `${e.type}-custom`,
    });
  };

  beforeUpload = (file: RcFile, fileList: RcFile[]) => {
    if (!this.props.beforeUpload) {
      return true;
    }
    const result = this.props.beforeUpload(file, fileList);
    if (result === false) {
      this.onChange({
        file,
        fileList: uniqBy(
          this.state.fileList.concat(fileList.map(fileToObject)),
          (item: UploadFile) => item.uid
        ),
      });
      return false;
    }
    if (result && result.then) {
      return result;
    }
    return true;
  };

  clearProgressTimer() {
    clearInterval(this.progressTimer);
  }

  saveUpload = (node: typeof RcUpload) => {
    this.upload = node;
  };

  renderUploadList = (locale: UploadLocale) => {
    const { showUploadList, listType, onPreview, onEdit } = this.props;
    const { showRemoveIcon, showPreviewIcon, showEditIcon } = showUploadList;
    return (
      <UploadList
        listType={listType}
        items={this.state.fileList}
        onPreview={onPreview}
        onEdit={onEdit}
        onRemove={this.handleManualRemove}
        showRemoveIcon={showRemoveIcon}
        showEditIcon={showEditIcon}
        showPreviewIcon={showPreviewIcon}
        locale={{ ...locale, ...this.props.locale }}
      />
    );
  };

  renderUpload = ({ getPrefixCls }: ConfigConsumerProps) => {
    const {
      prefixCls: customizePrefixCls,
      className,
      showUploadList,
      listType,
      type,
      disabled,
      children,
    } = this.props;

    const prefixCls = getPrefixCls('upload', customizePrefixCls);

    const rcUploadProps = {
      onStart: this.onStart,
      onError: this.onError,
      onProgress: this.onProgress,
      onSuccess: this.onSuccess,
      ...this.props,
      prefixCls,
      beforeUpload: this.beforeUpload,
    };

    delete rcUploadProps.className;

    const uploadList = showUploadList ? (
      <LocaleReceiver
        componentName="Upload"
        defaultLocale={defaultLocale.Upload}
      >
        {this.renderUploadList}
      </LocaleReceiver>
    ) : null;

    if (type === 'drag') {
      const dragCls = classNames(prefixCls, {
        [`${prefixCls}-drag`]: true,
        [`${prefixCls}-drag-uploading`]: this.state.fileList.some(
          file => file.status === 'uploading'
        ),
        [`${prefixCls}-drag-hover`]: this.state.dragState === 'dragover',
        [`${prefixCls}-disabled`]: disabled,
      });
      return (
        <span className={className}>
          <div
            className={dragCls}
            onDrop={this.onFileDrop}
            onDragOver={this.onFileDrop}
            onDragLeave={this.onFileDrop}
          >
            <RcUpload
              {...rcUploadProps}
              ref={this.saveUpload}
              className={`${prefixCls}-btn`}
            >
              <div className={`${prefixCls}-drag-container`}>{children}</div>
            </RcUpload>
          </div>
          {uploadList}
        </span>
      );
    }

    const uploadButtonCls = classNames(prefixCls, {
      [`${prefixCls}-select`]: true,
      [`${prefixCls}-select-${listType}`]: true,
      [`${prefixCls}-disabled`]: disabled,
      [`dragover-custom`]: this.state.dragEvent === 'dragover-custom',
    });

    // Remove id to avoid open by label when trigger is hidden
    // https://github.com/ant-design/ant-design/issues/14298
    if (!children) {
      delete rcUploadProps.id;
    }
    const uploadButton = (
      <DraggerStyle>
        <div
          className={uploadButtonCls}
          style={children ? undefined : { display: 'none' }}
          onDrop={this.onDragDrop}
          onDragOver={this.onDragDrop}
          onDragLeave={this.onDragDrop}
        >
          <RcUpload {...rcUploadProps} ref={this.saveUpload} />
        </div>
      </DraggerStyle>
    );

    if (listType === 'picture-card') {
      return (
        <span className={className}>
          {uploadList}
          {uploadButton}
        </span>
      );
    }
    return (
      <span className={className}>
        {uploadButton}
        {uploadList}
      </span>
    );
  };

  render() {
    return <ConfigConsumer>{this.renderUpload}</ConfigConsumer>;
  }
}

polyfill(Upload);

export default Upload;
