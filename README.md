# Protein Secondary Structure Predictor (CNN)

Predict protein secondary structure (Q8) from amino-acid sequences using a Convolutional Neural Network (CNN). This repository contains code for data preparation, model definition, training, evaluation and sequence-level prediction — suitable for research and educational experiments in protein structure prediction.

## Quick summary
- Predicts 8-state secondary structure labels (Q8): L, B, E, G, I, H, S, T
- Uses windowed 1D-CNNs on per-residue features (protein profiles preferred)
- Original implementation targets TensorFlow 1.x / Keras and the CullPDB / CB513 datasets

## Status / Compatibility
- Language: Python (code written for Python 3.x; tested historically with Python 3.6/3.7)
- Frameworks: TensorFlow 1.15 (tensorflow-gpu==1.15.4) + Keras 2.3.1 (see requirements)
- If you want to run on modern TF 2.x, porting changes are necessary (tensorflow.keras API differences, model saving/loading behaviors, etc.)
- The repository includes example training histories and exported model checkpoint files.

---

## Features
- Data preprocessing and reshaping utilities for CullPDB/CB513 datasets
- CNN model architecture for window and whole-protein prediction
- Training loop with TensorBoard logging and checkpointing
- Scripts for evaluation and sequence-level prediction
- Utilities for plotting training history

---

## Repository layout (important files)
ProteinSecondaryStructure-CNN-master/
  ├── ProteinSecondaryStructure-CNN-master/   # primary Python package and scripts
  │   ├── dataset.py           # dataset loaders / preprocessing
  │   ├── model.py             # CNN model definition & callbacks
  │   ├── main.py              # training entrypoint
  │   ├── evaluate.py          # evaluation script
  │   ├── predict.py           # single-sequence prediction utility
  │   ├── plot_history.py      # plot training history
  │   ├── download_dataset.py  # helper to download dataset files (where available)
  │   ├── requirements.txt     # expected package versions (TF 1.x / Keras 2.x)
  │   └── images/              # dataset / doc images
  ├── README.md                # (this file)
  └── LICENSE

How it fits together:
- dataset.py provides functions to load and reshape the raw numpy datasets into training/validation/test arrays and exposes constants used by model.py (cnn_width, amino_acid_residues, num_classes, filtered).
- model.py builds a Keras Sequential CNN and sets training hyperparameters and callbacks.
- main.py orchestrates dataset loading, model training and evaluation, and writes training history.
- predict.py encodes a raw amino-acid string, windows it, and runs the saved model to output a Q8 label string.

---

## Dataset
This project uses the ICML2014-related datasets (CullPDB, CB513) originally distributed with the paper:
- Dataset download pointers (historical / archival):
  - http://www.princeton.edu/~jzthree/datasets/ICML2014/
  - See dataset/README.md for the expected numpy file names.

Files expected (examples):
- `cullpdb+profile_6133.npy` or `cullpdb+profile_6133_filtered.npy`
- `cb513+profile_split1.npy`

Notes:
- Input arrays are (N proteins × k features) and are typically reshaped to (N × 700 × 57).
- Among 57 features: amino-acid one-hot/profile encodings, secondary structure labels, solvent accessibility, sequence profile (see dataset/README.md).
- If you use the filtered dataset variant, set the code to use the filtered path (dataset module exposes `is_filtered()`).

---

## Install and prepare environment

Recommended: use a virtual environment with Python 3.6–3.8 for compatibility with the provided requirements.

Clone repository:
```bash
git clone https://github.com/RamaVenkataCharan/ProteinSecondaryStructure-CNN-master.git
cd ProteinSecondaryStructure-CNN-master/ProteinSecondaryStructure-CNN-master
```

Create and activate virtualenv:
```bash
python3 -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows
# venv\Scripts\activate
```

Install dependencies:
```bash
# The provided requirements.txt targets TensorFlow 1.x and Keras 2.x
pip install -r requirements.txt
```

If you need to run on TF 2.x, consider:
- Creating a separate branch and porting model / training code to tf.keras (or use `tf.compat.v1` shims, not recommended long-term).
- Updating/locking modern compatible versions: numpy, scikit-learn, matplotlib, tensorflow.

---

## Download dataset
Follow the dataset/README.md instructions. Example (manual):
1. Download `cullpdb+profile_6133.npy.gz` and `cb513+profile_split1.npy.gz` (or filtered variants).
2. Place the unzipped `.npy` files into `ProteinSecondaryStructure-CNN-master/dataset/` or follow expected dataset paths used by `dataset.py`.

There is a helper `download_dataset.py` (try it after inspecting/adjusting the download URLs).

---

## Run training, evaluation and prediction

All commands assume you are in the subdirectory:
cd ProteinSecondaryStructure-CNN-master/ProteinSecondaryStructure-CNN-master

Train (default params in code):
```bash
python main.py
```
- main.py will load dataset (filtered vs. non-filtered behavior controlled inside `dataset.py`), build the model from `model.py`, and fit for `nn_epochs` epochs (default 35).
- Training logs and TensorBoard directory are created under `logs/`.

Evaluate (scripted evaluation):
```bash
python evaluate.py
```
- evaluate.py loads model checkpoints (see `model.checkpoint` values) and computes metrics.

Predict single sequence:
```bash
python predict.py
```
Or programmatically:
```python
from predict import predict_structure
structure = predict_structure("MVLSPADKTNVKAAW...")
print(structure)  # Q8 label string
```
- `predict.py` uses one-hot encoding and sliding windows to call the saved Keras model and returns Q8 predicted labels.

Notes on model file paths:
- Check `model.py` for the checkpoint filename (it sets `filepath` depending on `dataset.filtered`). Adjust `predict.py` or move saved model to the expected path if necessary.

---

## Model architecture (brief)
- Input: window of residues (default `cnn_width`; see dataset.py)
- Several Conv1D layers with BatchNormalization and Dropout
- Flatten → Dense(128) → Dense(32) → Dense(num_classes, softmax)
- Loss: categorical_crossentropy (metrics: accuracy, MAE)
- Typical hyperparameters are declared in `model.py` (LR, dropout, batch size, epochs)

---

## Expected performance
- Reported Q8 accuracy in this repository: ~0.72 (window-CNN on CullPDB split)
- Performance depends heavily on dataset split, filtering, preprocessing and hyperparameter tuning — reproduce exact numbers by running the training & evaluation sequence.

---

## Troubleshooting & tips
- TensorFlow 1.x: the code was written for TF 1.15 + Keras 2.3.1. If you install TF 2.x, you may need to:
  - Replace keras imports with `tensorflow.keras` (some are already `tensorflow.keras` but other TF-1 idioms may remain)
  - Update model saving/loading calls and callbacks
- GPU: If using GPU, install `tensorflow-gpu==1.15.4` and the compatible CUDA/CuDNN versions (per TF 1.15 docs).
- Batch size and window width are declared in `model.py` and `dataset.py`. Tune them for memory constraints.
- If you get shape-mismatch or padding-related errors, inspect `dataset.py` and the expected reshape logic (700 × 57) and ensure input `.npy` files are in the expected format.

---

## Contributing
- If you want to modernize the code:
  - Port to TensorFlow 2.x and tf.keras (rename or update imports, check checkpoint formats)
  - Add unit tests for data loaders and encoding functions
  - Provide preprocessed, smaller example dataset (for quick reproducibility)
  - Add a Dockerfile or environment.yml for reproducible runs
- Please open issues or PRs on the project repository. See `contribution.txt` for minor notes.

---

## Author & License
Author: Mekala Rama Venkata Charan  
License: MIT / educational & research usage (see LICENSE file in repo)

---

## Useful links & references
- Dataset origin: http://www.princeton.edu/~jzthree/datasets/ICML2014/
- Relevant literature:
  - Jian Zhou and Olga Troyanskaya (2014). Deep Supervised and Convolutional Generative Stochastic Network for Protein Secondary Structure Prediction.
  - Sheng Wang et al. (2016). Protein Secondary Structure Prediction Using Deep Convolutional Neural Fields.

If you'd like, I can:
- Create this README.md as a PR/commit in the repo,
- Modernize the code to TF 2.x and update requirements,
- Add an example small dataset and a short Jupyter notebook demonstrating prediction end-to-end.
