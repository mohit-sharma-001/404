"""
Two-Stage Training Pipeline for Tropical Cyclone CNN Model.

Transfer Learning Strategy:
---------------------------
- Stage 1 (Pretraining): The model learns general cyclone visual patterns and spatial dynamics
  from a large global dataset (~33k images across Atlantic, East Pacific, and West Pacific storms).
- Stage 2 (Fine-Tuning): The model specializes its predictions for Indian Ocean storms (~2.2k images)
  via fine-tuning with a significantly reduced learning rate (lr=0.00005) so the specialized training
  builds upon the rich global visual representations without destroying them.

This two-stage approach provides better generalization, faster convergence, and higher final accuracy.
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Ensure project root is in sys.path when script is executed directly
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import confusion_matrix
from torch.utils.data import DataLoader

from app.core.config import settings
from app.models.inference import CycloneCNN
from app.training.dataset_loader import (
    CATEGORY_TO_INDEX,
    IMD_CATEGORIES,
    TCIRDataset,
    combine_and_split,
    knots_to_kmh,
    wind_speed_to_imd_category,
)

PRETRAINED_CHECKPOINT_PATH = "data/model_checkpoint_pretrained.pth"

# Device selection (CUDA GPU if available, else CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")


def compute_class_weights(
    file_indices: Dict[str, List[int]], info_df
) -> torch.Tensor:
    """Compute balanced class weights for CrossEntropyLoss based on category distribution."""
    vmax_col = "Vmax" if "Vmax" in info_df.columns else "vmax"
    has_src = "source_file" in info_df.columns
    cat_counts = np.zeros(len(IMD_CATEGORIES), dtype=np.float32)

    for h5_path, indices in file_indices.items():
        for idx in indices:
            if idx in info_df.index:
                row = info_df.loc[idx]
                # Match row if multi-file dataframe
                if isinstance(row, torch.Tensor):
                    vmax_knots = float(row[vmax_col])
                elif hasattr(row, "ndim") and row.ndim > 1:
                    matching_rows = row[row["source_file"] == h5_path] if has_src else row
                    vmax_knots = float(matching_rows.iloc[0][vmax_col])
                else:
                    vmax_knots = float(row[vmax_col])

                wind_kmh = knots_to_kmh(vmax_knots)
                cat_str = wind_speed_to_imd_category(wind_kmh, verbose=False)
                cat_idx = CATEGORY_TO_INDEX[cat_str]
                cat_counts[cat_idx] += 1.0

    weights = 1.0 / (cat_counts + 1e-5)
    weights = weights / weights.sum() * float(len(IMD_CATEGORIES))
    return torch.from_numpy(weights).float()


def run_stage1_pretraining(
    stage1_train_dict: Dict[str, List[int]],
    combined_info_df,
    epochs: int = 20,
    batch_size: int = 16,
    lr: float = 0.0002,
):
    """STAGE 1: Pretraining on global dataset (~33k images)."""
    print(f"\n==================================================")
    print(f"      STAGE 1: GLOBAL DATASET PRETRAINING         ")
    print(f"==================================================")

    # 1. Hold out random 10% slice of stage1_train for pretraining validation
    global_h5_path = list(stage1_train_dict.keys())[0]
    global_indices = list(stage1_train_dict[global_h5_path])

    rng = np.random.default_rng(42)
    shuffled_idx = rng.permutation(global_indices).tolist()
    val_len = int(len(shuffled_idx) * 0.10)

    val_indices = shuffled_idx[:val_len]
    train_indices = shuffled_idx[val_len:]

    s1_train_split = {global_h5_path: train_indices}
    s1_val_split = {global_h5_path: val_indices}

    print(f"Stage 1 Train Split: {len(train_indices)} images")
    print(f"Stage 1 Val Split:   {len(val_indices)} images")

    # 2. Datasets and DataLoaders
    s1_train_ds = TCIRDataset(file_indices=s1_train_split, info_df=combined_info_df, augment=True)
    s1_val_ds = TCIRDataset(file_indices=s1_val_split, info_df=combined_info_df, augment=False)

    train_loader = DataLoader(s1_train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(s1_val_ds, batch_size=batch_size, shuffle=False)

    # 3. Compute Class Weights & Loss (moved to device)
    class_weights = compute_class_weights(s1_train_split, combined_info_df).to(device)
    criterion_classification = nn.CrossEntropyLoss(weight=class_weights)
    criterion_regression = nn.MSELoss()

    # 4. Model Instance & Device Move
    model = CycloneCNN()
    model.to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    os.makedirs(os.path.dirname(PRETRAINED_CHECKPOINT_PATH), exist_ok=True)
    best_pretrain_val_loss = float("inf")

    print(f"\nStarting Stage 1 Pretraining for {epochs} epochs (lr={lr}) on {device}...\n")
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0

        for images, labels, wind_speed, vis_was_missing in train_loader:
            images = images.to(device)
            labels = labels.to(device)
            wind_speed = wind_speed.to(device)

            optimizer.zero_grad()
            class_logits, speed_preds = model(images)

            loss_class = criterion_classification(class_logits, labels)
            loss_reg = criterion_regression(speed_preds, wind_speed.unsqueeze(1).float())
            loss = loss_class + 0.001 * loss_reg

            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)

        epoch_train_loss = train_loss / len(s1_train_ds)

        # Validation Pass
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels, wind_speed, vis_was_missing in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                wind_speed = wind_speed.to(device)

                class_logits, speed_preds = model(images)
                loss_class = criterion_classification(class_logits, labels)
                loss_reg = criterion_regression(speed_preds, wind_speed.unsqueeze(1).float())
                loss = loss_class + 0.001 * loss_reg

                val_loss += loss.item() * images.size(0)
                preds = torch.argmax(class_logits, dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        epoch_val_loss = val_loss / len(s1_val_ds)
        val_acc = (val_correct / val_total * 100.0) if val_total > 0 else 0.0

        saved_str = ""
        if epoch_val_loss < best_pretrain_val_loss:
            best_pretrain_val_loss = epoch_val_loss
            torch.save({"model_state_dict": model.state_dict()}, PRETRAINED_CHECKPOINT_PATH)
            saved_str = " [Pretrained Checkpoint Saved]"

        print(
            f"Stage 1 Epoch [{epoch:02d}/{epochs:02d}] - Train Loss: {epoch_train_loss:.4f} | Val Loss: {epoch_val_loss:.4f} | Val Acc: {val_acc:.2f}%{saved_str}",
            flush=True,
        )

    print(
        f"\nStage 1 Pretraining Complete! Saved to '{PRETRAINED_CHECKPOINT_PATH}' (Val Loss: {best_pretrain_val_loss:.4f})\n"
    )


def run_stage2_finetuning(
    stage2_train_dict: Dict[str, List[int]],
    stage2_val_dict: Dict[str, List[int]],
    combined_info_df,
    epochs: int = 25,
    batch_size: int = 16,
    lr: float = 0.00005,
):
    """STAGE 2: Fine-tuning on Indian Ocean dataset (~2.2k images)."""
    print(f"==================================================")
    print(f"   STAGE 2: INDIAN OCEAN DATASET FINE-TUNING     ")
    print(f"==================================================")

    # 1. Datasets and DataLoaders
    s2_train_ds = TCIRDataset(file_indices=stage2_train_dict, info_df=combined_info_df, augment=True)
    s2_val_ds = TCIRDataset(file_indices=stage2_val_dict, info_df=combined_info_df, augment=False)

    train_loader = DataLoader(s2_train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(s2_val_ds, batch_size=batch_size, shuffle=False)

    # 2. Compute Stage 2 Specific Class Weights (Indian Ocean Distribution, moved to device)
    class_weights = compute_class_weights(stage2_train_dict, combined_info_df).to(device)
    criterion_classification = nn.CrossEntropyLoss(weight=class_weights)
    criterion_regression = nn.MSELoss()

    # 3. Model Instance & Device Move
    model = CycloneCNN()
    model.to(device)

    if os.path.exists(PRETRAINED_CHECKPOINT_PATH):
        checkpoint = torch.load(PRETRAINED_CHECKPOINT_PATH, map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])
        print(f"Loaded pretrained weights from '{PRETRAINED_CHECKPOINT_PATH}'")
    else:
        print("Warning: Pretrained checkpoint not found. Training from scratch.")

    optimizer = torch.optim.Adam(model.parameters(), lr=lr)

    final_checkpoint_path = settings.MODEL_CHECKPOINT_PATH
    os.makedirs(os.path.dirname(final_checkpoint_path), exist_ok=True)
    best_val_loss = float("inf")

    print(f"\nStarting Stage 2 Fine-tuning for {epochs} epochs (lr={lr}) on {device}...\n")
    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0

        for images, labels, wind_speed, vis_was_missing in train_loader:
            images = images.to(device)
            labels = labels.to(device)
            wind_speed = wind_speed.to(device)

            optimizer.zero_grad()
            class_logits, speed_preds = model(images)

            loss_class = criterion_classification(class_logits, labels)
            loss_reg = criterion_regression(speed_preds, wind_speed.unsqueeze(1).float())
            loss = loss_class + 0.001 * loss_reg

            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)

        epoch_train_loss = train_loss / len(s2_train_ds)

        # Validation Pass
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels, wind_speed, vis_was_missing in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                wind_speed = wind_speed.to(device)

                class_logits, speed_preds = model(images)
                loss_class = criterion_classification(class_logits, labels)
                loss_reg = criterion_regression(speed_preds, wind_speed.unsqueeze(1).float())
                loss = loss_class + 0.001 * loss_reg

                val_loss += loss.item() * images.size(0)
                preds = torch.argmax(class_logits, dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        epoch_val_loss = val_loss / len(s2_val_ds)
        val_acc = (val_correct / val_total * 100.0) if val_total > 0 else 0.0

        saved_str = ""
        if epoch_val_loss < best_val_loss:
            best_val_loss = epoch_val_loss
            torch.save({"model_state_dict": model.state_dict()}, final_checkpoint_path)
            saved_str = " [Best Model Saved]"

        print(
            f"Stage 2 Epoch [{epoch:02d}/{epochs:02d}] - Train Loss: {epoch_train_loss:.4f} | Val Loss: {epoch_val_loss:.4f} | Val Acc: {val_acc:.2f}%{saved_str}",
            flush=True,
        )

    print(
        f"\nStage 2 Fine-tuning Complete! Best checkpoint saved to '{final_checkpoint_path}' (Val Loss: {best_val_loss:.4f})\n"
    )


def run_final_evaluation(
    stage2_test_dict: Dict[str, List[int]], combined_info_df, batch_size: int = 16
):
    """FINAL EVALUATION: Evaluate best fine-tuned model on Indian Ocean held-out test set."""
    print(f"==================================================")
    print(f"   FINAL EVALUATION: INDIAN OCEAN HELD-OUT TEST   ")
    print(f"==================================================")

    final_checkpoint_path = settings.MODEL_CHECKPOINT_PATH
    model = CycloneCNN()
    model.to(device)

    checkpoint = torch.load(final_checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    test_ds = TCIRDataset(file_indices=stage2_test_dict, info_df=combined_info_df, augment=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    criterion_classification = nn.CrossEntropyLoss()
    criterion_regression = nn.MSELoss()

    test_loss = 0.0
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels, wind_speed, vis_was_missing in test_loader:
            images = images.to(device)
            labels = labels.to(device)
            wind_speed = wind_speed.to(device)

            class_logits, speed_preds = model(images)

            loss_class = criterion_classification(class_logits, labels)
            loss_reg = criterion_regression(speed_preds, wind_speed.unsqueeze(1).float())
            loss = loss_class + 0.001 * loss_reg

            test_loss += loss.item() * images.size(0)

            preds = torch.argmax(class_logits, dim=1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.cpu().numpy().tolist())

    final_test_loss = test_loss / len(test_ds)
    correct_count = sum(1 for p, t in zip(all_preds, all_targets) if p == t)
    final_test_acc = (correct_count / len(test_ds) * 100.0) if len(test_ds) > 0 else 0.0

    print(f"Final Test Loss:     {final_test_loss:.4f}")
    print(f"Final Test Accuracy: {final_test_acc:.2f}% ({correct_count}/{len(test_ds)})\n")

    # 7x7 Confusion Matrix Calculation & Display
    cm = confusion_matrix(all_targets, all_preds, labels=list(range(7)))

    # Display Category Names & Index Legend
    abbrevs = ["DEP", "D-DEP", "CS", "SCS", "VSCS", "ESCS", "SuperCS"]

    print("--- 7x7 IMD Category Confusion Matrix ---")
    print("Legend:")
    for idx, (cat, abbr) in enumerate(zip(IMD_CATEGORIES, abbrevs)):
        print(f"  [{idx}] {abbr:<8} = {cat}")

    print("\nConfusion Matrix (Rows: Ground Truth, Columns: Model Prediction):")
    title_label = "True \\ Pred"
    header_str = f"{title_label:<12} | " + " | ".join([f"{abbr:>7}" for abbr in abbrevs])

    print("-" * len(header_str))
    print(header_str)
    print("-" * len(header_str))

    for row_idx, row in enumerate(cm):
        row_str = f"{abbrevs[row_idx]:<12} | " + " | ".join([f"{val:>7d}" for val in row])
        print(row_str)

    print("-" * len(header_str))


def train_pipeline():
    """Main execution entry point for two-stage training pipeline."""
    # 1. Combine Datasets and Create Storm-Level Splits
    stage1_train, stage2_train, stage2_val, stage2_test, combined_info_df = combine_and_split()

    # 2. Stage 1 Pretraining (20 Epochs on Global Data)
    run_stage1_pretraining(stage1_train, combined_info_df, epochs=20, batch_size=16, lr=0.0002)

    # 3. Stage 2 Fine-Tuning (25 Epochs on Indian Ocean Data)
    run_stage2_finetuning(stage2_train, stage2_val, combined_info_df, epochs=25, batch_size=16, lr=0.00005)

    # 4. Final Evaluation on Held-Out Test Set
    run_final_evaluation(stage2_test, combined_info_df, batch_size=16)


if __name__ == "__main__":
    train_pipeline()
