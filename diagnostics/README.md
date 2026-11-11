# CancerZ Diagnostics (in-browser AI panel)

the `#diagnostics` panel in `index.html` loads two files from this folder, which are produced by the training project
(`train.py`) and are **not committed yet**:

- `model.onnx` (about 15 MB)
- `model_meta.json`

Until both exist the panel shows "CancerZ Diagnostics is launching soon".

To publish the model: copy both files into this folder, commit, push. GitHub Pages serves them.
The model runs in the visitor's browser with onnxruntime-web (loaded from jsDelivr, version pinned in
`index.html#diagnostics`). Images are never uploaded.

`preprocess.js` mirrors the Python preprocessing (antialiased bilinear resize to 224x224, ImageNet
normalisation). It was checked against Pillow: maximum difference of 1 grey level per pixel.
Do not change one side without the other.
