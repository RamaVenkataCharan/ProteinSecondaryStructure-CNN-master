import numpy as np
from tensorflow.keras.models import load_model
import model as cnn_model
from dataset import is_filtered, cnn_width, amino_acid_residues

# Standard 21 Amino Acids
AMINO_ACIDS = "ACDEFGHIKLMNPQRSTVWYX"
AA_TO_INT = {aa: i for i, aa in enumerate(AMINO_ACIDS)}

# Q8 Structure Classes
Q8_CLASSES = ['L', 'B', 'E', 'G', 'I', 'H', 'S', 'T']

def encode_sequence(sequence):
    """One-hot encodes a protein sequence."""
    sequence = sequence.upper()
    encoded = np.zeros((len(sequence), amino_acid_residues))
    for i, aa in enumerate(sequence):
        if aa in AA_TO_INT:
            encoded[i, AA_TO_INT[aa]] = 1
        else:
            encoded[i, AA_TO_INT['X']] = 1 # Unknown amino acid
    return encoded

def window_sequence(encoded_seq):
    """Applies padding and windowing logic."""
    seq_len = encoded_seq.shape[0]
    padding = np.zeros((int(cnn_width/2), amino_acid_residues))
    padded_seq = np.vstack((padding, encoded_seq, padding))
    
    windows = np.zeros((seq_len, cnn_width, amino_acid_residues))
    for i in range(seq_len):
        windows[i, :, :] = padded_seq[i:i+cnn_width, :]
    return windows

def predict_structure(sequence, model_path=None):
    """Predicts secondary structure for a given sequence."""
    if model_path is None:
        model_path = "Best Models/CullPDB6133_Filtered-best - 0.6833.hdf5" if is_filtered() else "Best Models/CullPDB6133-best - 0.721522.hdf5"
        
    net = load_model(model_path, compile=False)
    
    encoded_seq = encode_sequence(sequence)
    windows = window_sequence(encoded_seq)
    
    predictions = net.predict(windows)
    
    predicted_classes = np.argmax(predictions, axis=-1)
    
    structure = "".join([Q8_CLASSES[c] for c in predicted_classes])
    return structure

if __name__ == '__main__':
    # Disable model summary printing inside predict.py
    cnn_model.do_summary = False
    
    sample_sequence = "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR"
    print(f"Sequence: {sample_sequence}")
    structure = predict_structure(sample_sequence)
    print(f"Predicted Q8 Structure: {structure}")
