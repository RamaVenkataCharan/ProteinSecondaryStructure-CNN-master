import streamlit as st
import predict
from collections import Counter
import model as cnn_model

st.set_page_config(page_title="Protein Secondary Structure Predictor", layout="wide")

# Disable model summary printing inside the app
cnn_model.do_summary = False

st.title("🧬 Protein Secondary Structure Predictor")
st.markdown("Predict the Q8 secondary structure of a protein sequence using a trained Convolutional Neural Network.")

st.sidebar.header("About")
st.sidebar.markdown(
    "This tool uses a 1D CNN trained on the CullPDB dataset to predict the 8-state (Q8) secondary structure of proteins."
)
st.sidebar.markdown("### Q8 Structure Mapping")
st.sidebar.markdown(
    """
    - **H**: Alpha helix
    - **B**: Beta bridge
    - **E**: Strand
    - **G**: Helix-3
    - **I**: Helix-5
    - **T**: Turn
    - **S**: Bend
    - **L**: Loop/Coil
    """
)

# Text area for user input
sequence = st.text_area("Enter Amino Acid Sequence", height=150, placeholder="MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR")

if st.button("Predict Structure"):
    if not sequence.strip():
        st.warning("Please enter a sequence.")
    else:
        sequence = sequence.strip().upper()
        
        with st.spinner('Predicting structure...'):
            try:
                structure = predict.predict_structure(sequence)
                
                st.subheader("Prediction Results")
                
                # Display sequence and structure aligned
                st.markdown("### Sequence vs Structure")
                
                # Use markdown with preformatted text for alignment
                st.markdown(f"```\nSeq: {sequence}\nStr: {structure}\n```")
                
                # Display basic statistics
                st.markdown("### Statistics")
                counts = Counter(structure)
                total = len(structure)
                
                # Categorize into 3 main states for simplified stats
                helix = sum(counts.get(c, 0) for c in ['H', 'G', 'I'])
                sheet = sum(counts.get(c, 0) for c in ['E', 'B'])
                coil = sum(counts.get(c, 0) for c in ['L', 'S', 'T'])
                
                col1, col2, col3 = st.columns(3)
                col1.metric("Alpha Helix (H, G, I)", f"{(helix/total)*100:.1f}%")
                col2.metric("Beta Sheet (E, B)", f"{(sheet/total)*100:.1f}%")
                col3.metric("Coil/Turn (L, S, T)", f"{(coil/total)*100:.1f}%")
                
                st.markdown("### Detailed Q8 Breakdown")
                
                # Q8 bar chart
                data = {
                    'H': counts.get('H', 0),
                    'B': counts.get('B', 0),
                    'E': counts.get('E', 0),
                    'G': counts.get('G', 0),
                    'I': counts.get('I', 0),
                    'T': counts.get('T', 0),
                    'S': counts.get('S', 0),
                    'L': counts.get('L', 0),
                }
                st.bar_chart(data)
                
            except Exception as e:
                st.error(f"An error occurred during prediction: {str(e)}")
