import React, { Component } from 'react';
import { Spin } from 'antd';

import { RenderDiv } from './style/renderer.styles';

export default class Renderer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
    };
  }

  loadImage = url => {
    let imageData = new Image();
    imageData.onload = () => {
      this.setState({ loaded: true });
    };
    imageData.src = url;
  };

  componentDidMount() {
    this.mounted = true;
    let { url } = this.props;
    this.loadImage(url);
  }

  componentWillUnmount() {
    this.mounted = false;
  }
  render() {
    const { url, isPreview, ...elmProps } = this.props;
    const { loaded } = this.state;
    if (this.mounted && loaded) {
      if (isPreview) {
        return <img src={url} alt={url} {...elmProps} />;
      } else {
        return <RenderDiv background={url} />;
      }
    } else {
      return (
        <div className={`${elmProps.prefix}-list-item-icon`}>
          <Spin />
        </div>
      );
    }
  }
}
