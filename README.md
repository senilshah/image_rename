# image_rename

It is always required and preferable that on selection of the images to upload, the user gets option for manipulating the image content like cropping the image and storing the image with a custom name before it gets uploaded to the server.

So this code sample covers this both parts using the react-cropper and a simple input field for the custom name.

The basic idea goes, when the user selects the image, we setup a cropper for that and show it in a modal which consists of canvas for cropping the raw image and with the input field consisting of the original file name that can be changed, and some general information that shows the file size, meme type and a cancel button and a save button. 

Once the raw image is cropped, it cannot be recoverd, but, surely we can re-crop the image N number of times on clicking the edit button or if we don't need that image anymore, we can remove it clicking the trash icon.

Dependencies:
- isomorphic theme
- antd upload component
- react-cropper npm package
- firebase (optional)
