import styled from 'styled-components';

const RenderDiv = styled.div`
  background-image: url(${props => props.background});
  background-position: center center;
  background-size: contain;
  background-repeat: no-repeat;
  position: absolute;
  top: 0;
  bottom: 19px;
  left: 0;
  right: 0;
  background-color: #fafafa;
  img {
    opacity: 0;
  }
`;

export { RenderDiv };
