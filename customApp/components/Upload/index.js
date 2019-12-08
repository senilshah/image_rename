import React, { Component } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import PropTypes from 'prop-types';
import Upload from '../Uploads';
import Input from 'antd';
import _ from 'lodash';

class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showCropper: false,
      fileToCrop: null,
      crop: false,
      fileInfo: {},
      showPreview: false,
      previewString: null,
      errorMessage: null,
      loading: false,
      hideSpinner: false,
      newFileName: null,
      errors: {},
    };
    this.imageTypes = ImageTypes;
    this.width = 0; // width of existing file
    this.height = 0; // height of existing file
    this.maxSize = 1200; // maximum allowed size.
  }

  /**
   * toggle cropper modal
   */
  toggleModal = () => {
    this.setState(prevState => ({
      showCropper: !prevState.showCropper,
    }));
  };

  /**
   * toggle preview modal
   */
  togglePreview = () => {
    let { previewString, showPreview } = this.state;
    if (showPreview) {
      previewString = null;
    }
    this.setState(prevState => ({
      showPreview: !prevState.showPreview,
      previewString,
    }));
  };

  toggleCrop = () => {
    this.setState(prevState => ({
      crop: !prevState.crop,
    }));
  };

  /**
   * Default error messages
   *
   * @return     {(Object)}  { message with key }
   */
  errorReporting = () => {
    let { accept, size } = this.props;
    return {
      mime: `File must be a file of type: ${accept.join(', ')}`,
      size: `File size may not be greater than ${size}mb`,
    };
  };

  /**
   * to reset cropper
   */
  resetCropper = () => {
    this.cropper.reset();
  };

  /**
   * to remove file from the file list
   *
   * @param      {object} file    The file
   */
  onRemove = (file, removeIndex) => {
    let { files } = this.props;
    const index = removeIndex;
    let newFileList = files.slice();
    newFileList.splice(index, 1);
    this.props.onChange([...newFileList]);
  };

  /**
   * to validate selected file
   *
   * @param      {object} file    The file
   */
  validateFile = file => {
    const { size, accept } = this.props;
    let fileSize = (file.size / (1024 * 1024)).toFixed(2) <= size;
    if (!fileSize) {
      this.setMessage('size');
    }
    let fileType = accept.indexOf(file.type) !== -1;
    if (!fileType) {
      this.setMessage('mime');
    }
    return fileSize && fileType;
  };

  /**
   * Sets the message.
   *
   * @param      {string}             type    The message type
   */
  setMessage = (type = '') => {
    const { errors } = this.props;
    let defaults = this.errorReporting();
    this.setState({
      errorMessage: errors[type] || defaults[type],
    });
  };

  /**
   * this will only called when uploaded file is image
   *
   * @param      {object} file    The file
   */
  cropperNeeded = file => {
    let fileToCrop = window.URL.createObjectURL(file);
    this.setState(
      {
        fileToCrop,
        newFileName: file.name.substring(0, file.name.lastIndexOf('.')),
      },
      () => {
        this.toggleModal();
      }
    );
  };

  /**
   * this will be used to crop image again
   *
   * @param      {object} file    The file
   */
  reCrop = file => {
    this.setState(
      {
        fileToCrop: file.mainUrl,
        crop: true,
      },
      () => {
        this.toggleModal();
      }
    );
  };

  /**
   * calling first after selecting file
   *
   * @param      {object} file    The file
   */
  beforeUpload = file => {
    const { files, isSingle } = this.props;
    let allowed = this.validateFile(file);
    this.setState({ fileInfo: {}, errors: {}, newFileName: null });
    if (allowed) {
      this.setState({ fileInfo: file, errorMessage: null, crop: true });
      //  open cropper only if image selected
      if (this.imageTypes.indexOf(file.type) !== -1) {
        this.cropperNeeded(file);
      } else {
        file.originFileObj = file;
        if (isSingle) {
          this.props.onChange([file]);
        } else {
          this.props.onChange([...files, file]);
        }
      }
    }
    return false;
  };

  /**
   * when preview icon is clicked
   *
   * @param      {object} file    The file
   */
  onPreview = file => {
    this.setState(
      {
        previewString: file.mainUrl,
        previewName: file.name,
      },
      () => {
        this.togglePreview();
      }
    );
  };

  /**
   * when editing existing image
   *
   * @param      {object}  file    The file
   */
  onEdit = (file, originalFileData) => {
    file.isEdited = true;
    this.setState(
      {
        fileInfo: file,
        errorMessage: null,
        hideSpinner: true,
        errors: {},
        newFileName: originalFileData.fileName
          ? originalFileData.fileName
          : originalFileData.name.substring(
              0,
              originalFileData.name.lastIndexOf('.')
            ) || null,
      },
      () => {
        this.reCrop(file);
        setTimeout(() => {
          this.setState({ hideSpinner: false });
        }, 2000);
      }
    );
  };

  /**
   * rotate image while cropping
   *
   * @param      {string}  position  The position
   */
  rotate = (position = 'left') => {
    let direction = position === 'left' ? -90 : 90;
    this.cropper.rotate(direction);
  };

  onMovment = e => {
    this.width = e.detail.width;
    this.height = e.detail.height;
  };

  maintainDimensions = () => {
    let { height, width, maxSize } = this;
    let object = {};
    if (height > width) {
      object.height = height > maxSize ? maxSize : height;
    } else {
      object.width = width > maxSize ? maxSize : width;
    }
    return object;
  };

  /**
   * Saves an image.
   *
   */
  saveImage = () => {
    let { fileInfo, newFileName, errors } = this.state;
    let { files, isSingle } = this.props;
    if (newFileName.length === 0) {
      errors.fileName = this.context.intl.formatMessage({
        id: 'global.fileNameRequired',
      });
      this.setState({ errors });
      return;
    }
    files.map((file, index) => {
      file = file.file ? file.file : file;
      if (file.uid.toString() === fileInfo.uid.toString()) {
        files.splice(index, 1);
      }
    });
    this.setState({ loading: true });
    const index = files.indexOf(fileInfo);
    if (index > -1) {
      files.splice(index, 1);
    }

    if (this.cropper && typeof this.cropper !== 'undefined') {
      let dimensions = this.maintainDimensions();
      this.cropper.getCroppedCanvas(dimensions).toBlob(
        blob => {
          fileInfo.originFileObj = blob;
          fileInfo.thumbUrl = window.URL.createObjectURL(blob);
          fileInfo.mainUrl = window.URL.createObjectURL(blob);
          let newFile = {
            file: fileInfo,
            fileName: newFileName ? newFileName : fileInfo.name,
          };
          if (isSingle) {
            this.props.onChange([newFile]);
          } else {
            this.props.onChange([...files, newFile]);
          }

          this.setState(state => ({
            fileInfo: {},
            newFileName: null,
            loading: false,
          }));
          this.toggleModal();
        },
        fileInfo.type,
        0.9
      );
    } else {
      fileInfo.originFileObj = fileInfo;
      fileInfo.thumbUrl = window.URL.createObjectURL(fileInfo);
      fileInfo.mainUrl = window.URL.createObjectURL(fileInfo);
      let newFile = {
        file: fileInfo,
        fileName: newFileName ? newFileName : fileInfo.name,
      };
      if (isSingle) {
        this.props.onChange([newFile]);
      } else {
        this.props.onChange([...files, newFile]);
      }
      this.setState(state => ({
        fileInfo: {},
        newFileName: null,
        loading: false,
      }));
      this.toggleModal();
    }
  };

  onRecordChange = event => {
    let value = event.target.value;
    let { newFileName, errors } = this.state;
    newFileName = value;
    if (errors.fileName) errors = {};
    this.setState({ newFileName, errors });
  };

  render() {
    /**
     * size : <number> maximum file size
     * files: <array>  uploaded/selected files
     * disabled: <bool> to disable/enable upload
     * max: <number> maximum number of files
     * accept: <array> file accept types
     * filesLoading: <boolean> if files are loading
     */
    const {
      files,
      disabled,
      max,
      filesLoading,
      isReplace,
      onlyImages,
    } = this.props;

    /**
     * showCropper: <bool> to trigger cropper modal
     * fileToCrop: <base64Url> encoded string of selected image which will be cropped
     * showPreview: <bool> show/hide image preview
     * fileInfo: <object> information of existing file
     * loading: <boolean> Loader on Done button
     */
    const {
      showCropper,
      fileToCrop,
      crop,
      showPreview,
      fileInfo,
      errorMessage,
      loading,
      hideSpinner,
      errors,
    } = this.state;
    let { newFileName } = this.state;
    if (!_.isEmpty(fileInfo) && newFileName === null) {
      newFileName = fileInfo.name.substring(0, fileInfo.name.lastIndexOf('.'));
    }
    if (filesLoading) {
      return <Spin className="spin-msg" />;
    }

    let uploadProps = {
      onRemove: this.onRemove,
      beforeUpload: this.beforeUpload,
      listType: 'picture-card',
      onPreview: this.onPreview,
      onEdit: this.onEdit,
    };

    // if (onlyImages) {
    //   uploadProps.accept = "image/*"
    // }

    return (
      <UploadWrapper>
        {/*used main file upload component from antd */}
        <Upload
          {...uploadProps}
          disabled={disabled || (max && files.length >= max)}
          fileList={files}
          supportServerRender={true}
          showUploadList={{
            showRemoveIcon: !disabled,
            showEditIcon: !disabled,
          }}
        >
          {(max && files.length >= max) || disabled ? null : (
            <UploadButton>
              <Icon type={isReplace ? 'sync' : 'plus'} />
              <div className="ant-upload-text">
                <IntlMessages
                  id={`global.${isReplace ? 'replace' : 'upload'}`}
                />
              </div>
            </UploadButton>
          )}
        </Upload>
        <ErrorMessage class="ant-form-explain">{errorMessage}</ErrorMessage>
        {/*Open cropper modal when needed*/}
        {showCropper && (
          <Modal
            visible={showCropper}
            maskClosable={true}
            onClose={this.toggleModal}
            onCancel={this.toggleModal}
            width="95%"
            height={window.innerHeight}
            closable={false}
            destroyOnClose={true}
            centered
            footer={[
              <Button key="cancel" onClick={this.toggleModal}>
                <IntlMessages id="global.cancel" />
              </Button>,
              <Button
                key="save"
                type="primary"
                loading={loading}
                onClick={this.saveImage}
              >
                <IntlMessages id="global.done" />
              </Button>,
            ]}
          >
            <TitleCrop>
              <Row type="flex" justify="start">
                <Col>
                  <div>
                    <Label>
                      <IntlMessages id="global.name" />
                    </Label>
                    {!_.isEmpty(fileInfo) && (
                      <Input
                        style={{ width: '80%' }}
                        placeholder={this.context.intl.formatMessage({
                          id: 'global.fileName',
                        })}
                        value={newFileName}
                        onChange={this.onRecordChange.bind(this)}
                        addonAfter={fileInfo.name.split('.').pop() || null}
                      />
                    )}
                  </div>
                  {fileInfo.size && (
                    <div>
                      <Label>
                        <IntlMessages id="upload.size" />
                      </Label>
                      <LabelContent>
                        {(fileInfo.size / 1048576).toFixed(2)} MB
                      </LabelContent>
                    </div>
                  )}
                </Col>
              </Row>
            </TitleCrop>
            <CropUtils>
              <Row>
                <Button
                  onClick={this.rotate.bind(this, 'left')}
                  icon="undo"
                  disabled={!crop}
                />
                <Button
                  onClick={this.rotate.bind(this, 'right')}
                  icon="redo"
                  disabled={!crop}
                />
                <Button onClick={this.resetCropper} disabled={!crop}>
                  <IntlMessages id="global.reset" />
                </Button>
              </Row>
            </CropUtils>
            <Divider />
            <Spin spinning={hideSpinner && fileInfo.fullName ? true : false}>
              <div>
                <Cropper
                  ref={cropper => {
                    this.cropper = cropper;
                  }}
                  src={fileToCrop}
                  style={{ maxHeight: '50vh', width: '100%' }}
                  crop={this.onMovment}
                  autoCropArea={1.0}
                  dragMode={'move'}
                />
              </div>
            </Spin>
          </Modal>
        )}
        {showPreview ? this.preview() : <span />}
      </UploadWrapper>
    );
  }

  /**
   * image preview
   *
   */
  preview = () => {
    const { showPreview, previewString, previewName } = this.state;
    return (
      <PreviewModalStyle>
        <PreviewModal
          url={previewString}
          imageName={previewName}
          showPreview={showPreview}
          togglePreview={this.togglePreview}
        />
      </PreviewModalStyle>
    );
  };
}

FileUpload.contextTypes = {
  //To add dynamic placeholder in german language
  intl: PropTypes.object.isRequired,
};

export default FileUpload;

FileUpload.propTypes = {
  size: PropTypes.number,
  files: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  accept: PropTypes.array,
  disabled: PropTypes.bool,
  filesLoading: PropTypes.bool,
  max: PropTypes.number,
  errors: PropTypes.object,
  isSingle: PropTypes.bool,
  isReplace: PropTypes.bool,
  onlyImages: PropTypes.bool,
};

FileUpload.defaultProps = {
  size: 5,
  accept: ['application/pdf', 'image/jpg', 'image/jpeg', 'image/png'],
  disabled: false,
  max: null,
  files: [],
  filesLoading: false,
  errors: {}, // 1.mime,2.size
  isSingle: false,
  isReplace: false,
  onlyImages: false,
};
