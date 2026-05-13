from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter
from reportlab.platypus.tables import Table, TableStyle
from reportlab.lib import colors

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from reportlab.platypus.flowables import KeepTogether
import os

pdf_path = "Protein_Secondary_Structure_CNN_PDR.pdf"

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    rightMargin=40,
    leftMargin=40,
    topMargin=40,
    bottomMargin=30,
)

styles = getSampleStyleSheet()
story = []

title = "Project Design Report (PDR)\nProtein Secondary Structure Prediction using CNN"

story.append(Paragraph(title, styles['Title']))
story.append(Spacer(1, 20))

sections = [
    ("1. Project Overview",
     """
     This project focuses on predicting protein secondary structures using a Convolutional Neural Network (CNN).
     The model processes amino acid sequence data and predicts structural classes such as helices,
     sheets, turns, and coils. The project is implemented using Python, TensorFlow/Keras,
     NumPy, and Scikit-learn.
     """),

    ("2. Objectives",
     """
     • Predict protein secondary structures from amino acid sequences.<br/>
     • Implement a deep learning pipeline using Conv1D layers.<br/>
     • Train and evaluate the model using CullPDB and CB513 datasets.<br/>
     • Improve computational biology understanding using AI techniques.
     """),

    ("3. Technologies Used",
     """
     • Python 3.10<br/>
     • TensorFlow 2.10<br/>
     • Keras 2.10<br/>
     • NumPy 1.26.4<br/>
     • Matplotlib<br/>
     • Scikit-learn
     """),

    ("4. Dataset Information",
     """
     The project uses the CullPDB filtered dataset for training and the CB513 dataset for testing.
     Protein sequences are encoded into numerical representations before being fed into the CNN.
     """),

    ("5. CNN Architecture",
     """
     The model architecture consists of:<br/>
     • Conv1D Layers for feature extraction<br/>
     • Batch Normalization for stable training<br/>
     • Dropout layers for regularization<br/>
     • Dense layers for classification<br/>
     • Softmax output for Q8 secondary structure prediction
     """),

    ("6. Hyperparameters",
     """
     • Learning Rate: 0.0009<br/>
     • Dropout: 0.38<br/>
     • Batch Size: 64<br/>
     • Epochs: 35<br/>
     • Loss Function: categorical_crossentropy
     """),

    ("7. Current Training Results",
     """
     During execution, the model successfully trained on the CullPDB filtered dataset.
     Validation accuracy reached approximately 69.5%, which is considered acceptable for
     classic CNN-based Q8 protein secondary structure prediction.
     """),

    ("8. Identified Issues",
     """
     • Deprecated TensorFlow metrics (val_acc instead of val_accuracy)<br/>
     • Deprecated Adam optimizer argument (lr instead of learning_rate)<br/>
     • Missing pretrained weight references<br/>
     • Missing import in resume.py<br/>
     • Dataset download and extraction issues
     """),

    ("9. Improvements Suggested",
     """
     • Replace deprecated TensorFlow/Keras APIs<br/>
     • Add BiLSTM and Attention layers<br/>
     • Use GPU acceleration<br/>
     • Build a Streamlit-based web interface<br/>
     • Improve dataset preprocessing pipeline<br/>
     • Add model checkpointing and early stopping
     """),

    ("10. Applications",
     """
     • Bioinformatics<br/>
     • Drug Discovery<br/>
     • Protein Engineering<br/>
     • Computational Biology<br/>
     • Healthcare AI Systems
     """),

    ("11. Conclusion",
     """
     The project demonstrates the practical application of deep learning in bioinformatics.
     Although the codebase is based on an older TensorFlow/Keras pipeline, it was successfully
     modernized and executed using TensorFlow 2.10 with Python 3.10 compatibility.
     Future improvements can significantly increase prediction accuracy and deployment readiness.
     """),
]

for heading, body in sections:
    story.append(Paragraph(f"<b>{heading}</b>", styles['Heading2']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(body, styles['BodyText']))
    story.append(Spacer(1, 14))

doc.build(story)

print(f"PDF generated successfully: {os.path.abspath(pdf_path)}")
